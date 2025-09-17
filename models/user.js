const mongoose = require('mongoose');
const validEmail = require('../utils/regex').validEmail;

const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [validEmail, "Please use a valid email address"],
    },
    roleId: {
      type: Number,
      required: true,
      enum: [1, 2],
      default: 2,
    },
    password: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

const User = mongoose.model('User', userSchema);

module.exports = User;