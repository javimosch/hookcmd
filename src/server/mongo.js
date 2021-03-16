const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true, useUnifiedTopology: true,
    dbName: process.env.MONGO_DB
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    // we're connected!
    console.log('MONGO OK')
});


const { Schema } = mongoose;

const userSchema = new Schema({
    username: String,
    password: String
});