const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserdbSchema = new Schema({
    username: { type: String, required: true, unique: [ true, 'username already exist' ] },
    firstName: { type: String, required: true},
    lastName: { type: String, required: true},
    phone: { type: String, required: true},
    address: { type: String},
    vehicle: [{type: Object}],
    image: { type: String, default: '1.jpg' },
}, { timestamps: true });

//plugin passport-local-mongoose to enable password hashing and salting and other things
UserdbSchema.plugin(passportLocalMongoose);

//connect the schema with user table
const Userdb = mongoose.model('userdb', UserdbSchema);

//export the model 
module.exports = Userdb;