import api from './api.js'
import './commandStep.js'
Vue.component('command', {
    name: "Command",
    template: `
    <div class="command">
        <form>
            <label>Hook Command&nbsp;<span v-html="crudMode"></span></label>
            <hr>
            <input placeholder="name" v-model="command.name"/>
            <hr>
            <draggable v-model="command.steps" group="commands">
   
            
            <div v-for="(step, index) in command.steps" :key="step._id">
                <command-step v-model="command.steps[index]"/>
            </div>
            </draggable>

            <button type="button" @click="addStep">Add step </button>
            <hr>
            <button type="button" @click="newCommand">New</button>
            <button type="button" @click="saveCommand">Save</button>
            <button type="button" @click="removeCommand" v-show="command._id">Remove</button>
            <hr>
            <button type="button" @click="testCommand">Test</button>
            <hr>
            <textarea class="result" v-model="test.result">
            </textarea>
        </form>
    </div>
    `,
    data() {
        return this.getDefaults();
    },
    created() {
        this.$store.watch((state) => {
            return state.selectedCommand
        }, () => {
            Object.assign(this.command, this.selectedCommand || {})
        }, {
            deep: true
        })
    },
    mounted() {

    },
    computed: {
        crudMode() {
            return this.command._id ? "(Edition)" : "(New)"
        },
        selectedCommand() {
            return this.$store.state.selectedCommand
        }
    },
    methods: {
        getDefaults() {
            return {
                test: {
                    result: ""
                },
                command: {
                    _id: "",
                    name: "",
                    steps: []
                }
            }
        },
        async testCommand() {
            this.test.result = `Executing...`;
            let res = await api("executeCommand", Object.assign({}, this.command))
            this.test.result = res.all;
        },
        addStep() {
            this.command.steps.push({
                _id: '_' + Math.random().toString(36).substr(2, 9)
            })
        },
        async removeCommand() {
            await api('removeCommand', this.command._id)
            this.$store.dispatch('fetchCommands')
            Object.assign(this.$data, this.getDefaults())
        },
        newCommand() {
            Object.assign(this.$data, this.getDefaults())
            this.$store.dispatch('selectCommand', null)
        },
        async saveCommand(e) {
            e.preventDefault();
            await api('saveCommand', Object.assign({}, this.command))
            this.$store.dispatch('fetchCommands')
        }
    }
})