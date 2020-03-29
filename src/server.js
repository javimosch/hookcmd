require('dotenv').config({
    silent: true
})
const express = require('express');
const app = express();
const path = require('path')
const PORT = process.env.PORT || 3000
const low = require('lowdb')
const FileAsync = require('lowdb/adapters/FileAsync')

init().catch(console.log)

async function init() {

    const db = await low(new FileAsync(path.join(process.cwd(), 'data', 'commands.json'), {
        defaultValue: { commands: [] }
    }))



    require('funql-api').middleware(app, {
        /*defaults*/
        getMiddlewares: [],
        postMiddlewares: [],
        allowGet: false,
        allowOverwrite: false,
        attachToExpress: false,
        allowCORS: true,
        api: {
            async executeCommand(command) {
                if (!command) {
                    return {
                        err: "invalid command"
                    }
                }
                let all = ``;
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
                            console.log({
                                code: res.code,
                                signal: res.signal
                            })
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
                command.steps = command.steps.filter(step=>{
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
                    const shortid = require('shortid')
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
    app.use('/', express.static(path.join(process.cwd(), 'src/public')))

    app.listen(PORT, () => console.log(`Listening on ${PORT}`))


}

function getSSH() {
    node_ssh = require('node-ssh')
    ssh = new node_ssh()

    return ssh.connect({
        host: process.env.SSH_HOST || 'localhost',
        username: process.env.SSH_USER || 'root',
        privateKey: process.env.SSH_KEY || path.join(process.cwd(), 'key')
    })
}