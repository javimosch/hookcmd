
import Home from './pages/Home.js'
import Logs from './pages/Logs.js'

// 2. Define some routes
// Each route should map to a component. The "component" can
// either be an actual component constructor created via
// `Vue.extend()`, or just a component options object.
// We'll talk about nested routes later.
const routes = [
    { path: '/', component: Home },
    { path: '/logs', component: Logs }
]

export default new VueRouter({
    routes // short for `routes: routes`
})