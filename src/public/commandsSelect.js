Vue.component('command-select', {
    name: "commandSelect",
    template: `
        <div class="commandSelect">
            <label>Available commands</label>
            <hr>
            <select v-model="selected" @change="change">
                <option v-for="(option, index) in options" :value="option" v-html="option.name">
                </option>
            </select>
            
        </div>
    `,
    data() {
        return {
            selected: null
        }
    },
    computed: {
        options() {
            return this.$store.state.commands
        }
    },
    async created() {
        this.$store.dispatch('fetchCommands')
    },
    methods: {
        change() {
            this.$store.dispatch('selectCommand', this.selected)
        }
    }
})