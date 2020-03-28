require('dotenv').config({
    silent:true
})
const express = require('express');
const app =express();
const path = require('path')
app.use('/',express.static(path.join(process.cwd(),'src/public')))
const PORT = process.env.PORT || 3000
app.listen(PORT,()=>console.log(`Listening on ${PORT}`))