import funql from 'https://cdn.jsdelivr.net/npm/funql-api@1.2.9/client.js'
const fql = funql(window.API_URL || window.location.origin)
export default fql;