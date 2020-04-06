import api from './api.js'
const store = new Vuex.Store({
    state: {
        commands: [],
        selectedCommand: null
    },
    mutations: {
        SET_COMMANDS(state, commands) {
            state.commands = commands
        },
        SET_SELECTED_COMMAND(state, command) {
            state.selectedCommand = command
        }
    },
    actions: {
        async fetchCommands({ commit }) {
            commit('SET_COMMANDS', (await api('getCommands')).map(cmd => {
                return cmd;
            }))
        },
        selectCommand({ commit }, command) {
            commit("SET_SELECTED_COMMAND", command)
        }
    }
})
export default store;