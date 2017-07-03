const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const md5 = require('md5');
const valdator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    validate: [
      validator.isEmail, 'Invalid Email Address',
      required: 'Please Supply an email address'
    ]
  },
  name: {
    type: String,
    required: 'Please supply a name',
    trim: true
  }
});

userSchema.plugin(passportLocalMongoose, {
  usernameField: 'email'
});

userSchema.plugin(mongodbErrorHandler);

module.export = mongoose.model('User', userSchema);
