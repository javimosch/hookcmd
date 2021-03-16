require('dotenv').config({
    silent: true
})
require('./server/mongo')
const express = require('express');
const app = express();
const path = require('path')
const PORT = process.env.PORT || 3000
const low = require('lowdb')
const FileAsync = require('lowdb/adapters/FileAsync')
const moment = require('moment-timezone')
const shortid = require('shortid')
const sander = require('sander')
const bodyParser = require('body-parser')
init().catch(console.log)

async function getLoggerDb() {
    app._loggers = app._loggers || {}
    let name = `logs-${moment().format("YYYY-MM-DD")}.json`
    if (!app._loggers[name]) {
        var dir = path.join(process.cwd(), 'data', 'logs');
        if (!await sander.exists(dir)) {
            await sander.mkdir(dir);
        }
        app._loggers[name] = await low(new FileAsync(path.join(process.cwd(), 'data/logs', name), {
            defaultValue: { logs: [] }
        }))
    }
    return app._loggers[name];
}
async function saveLog(log) {

    await (await getLoggerDb())
        .get('logs')
        .push({ _id: shortid.generate(), ...log })
        .write()
}

async function init() {

    const db = await low(new FileAsync(path.join(process.cwd(), 'data', 'commands.json'), {
        defaultValue: { commands: [] }
    }))

    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))

    app.get('/', (req, res) => {
        if (req.query.pwd !== "123") {
            res.send('YOU SHALL NOT PASS')
        }
        let html = sander.readFileSync(path.join(process.cwd(), 'src/public', 'index.html')).toString('utf-8')
        html = html.split('</head>').join(`
            <script>
                window.API_URL = "${process.env.API_URL || ""}"
            </script>
        </head>
        `)
        res.send(html)
    })
    app.use('/', express.static(path.join(process.cwd(), 'src/public')))

    require('funql-api').middleware(app, {
        /*defaults*/
        getMiddlewares: [(req, res, next) => {
            if (req.query.name === 'hook') {
                req.query.body = require('btoa')(JSON.stringify({
                    args: [{
                        commandName: req.query.command || ""
                    }]
                }))
                next()
            } else {
                res.send(401)
            }
        }],
        postMiddlewares: [(req, res, next) => {
            //res.send(401)
            next();
        }],
        allowGet: true,
        allowOverwrite: false,
        attachToExpress: true,
        allowCORS: true,
        api: {
            hook(args) {
                let log = {
                    date: moment().tz("Europe/Paris").format('MMMM Do YYYY, h:mm:ss a'),
                    args
                }
                if (args.commandName === 'test') {
                    log.message = "Test, nothing happens."
                    return log;
                }
                async function hookExec() {

                    if (!args.commandName) {
                        log.err = 'command missing'
                    } else {
                        try {
                            var commands = await db.get('commands')
                                .filter({ name: args.commandName })
                                .value();
                            var res = await app.api.executeCommand(commands[0] || null)
                            log.res = {
                                err: res.err,
                                stepsCodes: res.stepsCodes
                            }
                        } catch (err) {
                            log.err = JSON.stringify(err, Object.getOwnPropertyNames(err), 4)
                        }
                    }
                    saveLog(log)
                }
                hookExec().catch(err => {
                    saveLog({
                        ...log,
                        err: JSON.stringify(err, Object.getOwnPropertyNames(err), 4)
                    })
                })
                return {
                    message: "The hook was received. Thanks",
                    args
                }
            },
            async executeCommand(command) {
                if (!command) {
                    return {
                        err: "invalid command"
                    }
                }
                let all = ``;
                let stepsCodes = {}
                let ssh = await getSSH()
                const sequential = require('promise-sequential');
                await sequential((command.steps || []).map((step, index) => {
                    return () => (async () => {
                        let res = null;
                        if (step.cmd) {
                            res = await ssh.execCommand(step.cmd, {
                                cwd: '/',
                                onStdout(chunk) {
                                    console.log('stdoutChunk', chunk.toString('utf8'))
                                },
                                onStderr(chunk) {
                                    console.log('stderrChunk', chunk.toString('utf8'))
                                },
                            })
                            stepsCodes[index] = res.code
                        } else {
                            res = {
                                stderr: '(Empty command)',
                                stdout: ''
                            }
                        }
                        all += `
                        
                        =================================

                        STEP ${index + 1}
                            STDERR: ${res.stderr}
                            STDOUT: ${res.stdout}
                        `
                    })()
                }))

                return {
                    stepsCodes,
                    all
                }
            },
            async getCommands(name) {
                return db.get("commands").value()
            },
            async removeCommand(_id) {
                console.log("REMOVING", _id)
                await db.get('commands')
                    .remove({ _id: _id })
                    .write()
                return true;
            },
            async saveCommand(command) {
                if (!command.name) {
                    return {
                        err: "name required"
                    }
                }
                command.steps = command.steps.filter(step => {
                    return !!step.cmd
                })
                if (command._id) {
                    return await db.get('commands')
                        .find({ _id: command._id })
                        .assign({ ...command })
                        .write()
                }
                let match = await db.get('commands')
                    .filter({ name: command.name })
                    .value()

                if (match.length === 0) {

                    await db
                        .get('commands')
                        .push({ _id: shortid.generate(), ...command })
                        .write()
                    return await db.get('commands').find({ name: command.name }).value()
                }
                return await db.get('commands')
                    .find({ name: command.name })
                    .assign({ ...command })
                    .write()
            }
        }
    })

    app.get('/hook/:commandName', async (req, res, next) => {
        res.json(await app.api.hook({
            commandName: req.params.commandName
        }))
    })
    app.post('/hook/:commandName', async (req, res, next) => {
        res.json(await app.api.hook({
            commandName: req.params.commandName,
            body: req.body
        }))
    })

    app.listen(PORT, () => console.log(`Listening on ${PORT}`))

    if ((await sander.readdir(path.join(process.cwd(), 'data'))).find(folder => folder === 'schedules')) {
        const nodeSchedule = require('node-schedule');
        let schedules = await sander.readdir(path.join(process.cwd(), 'data', 'schedules'))
        console.log('Schedules detected', schedules)
        schedules = schedules.map(schedule => ({
            name: schedule,
            module: require(path.join(process.cwd(), 'data/schedules', schedule))
        }))
        schedules
            .filter(schedule => schedule.module.enabled === undefined ? true : schedule.module.enabled)
            .forEach(schedule => {
                console.log("Schedule configured", schedule.name)
                if (schedule.module.manual) {
                    return
                }
                nodeSchedule.scheduleJob(schedule.module.cron, async () => {
                    console.log('Schedule running', schedule.name)
                    let command = schedule.module.handler(app)
                    if (command instanceof Promise) {
                        command = await command
                    }
                    app.api.executeCommand(command).then((r) => {
                        console.log('Schedule success', schedule.name, r)
                    }).catch(err => {
                        console.log('Schedule fail', schedule.name, err.stack)
                    })
                })
            });
    }

}

async function getSSH() {
    node_ssh = require('node-ssh')
    ssh = new node_ssh()
    let key = await sander.readFileSync(process.env.SSH_KEY || path.join(process.cwd(), 'key')).toString('utf-8')
    console.log('SSH: Key', key.length)
    return ssh.connect({
        host: process.env.SSH_HOST || 'localhost',
        username: process.env.SSH_USER || 'root',
        privateKey: key
    })
}