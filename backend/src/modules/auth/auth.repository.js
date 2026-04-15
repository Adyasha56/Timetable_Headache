const User = require('../users/user.model');

const findByEmail = (email) => User.findOne({ email });
const findById = (id) => User.findById(id).select('-password_hash');
const create = (data) => User.create(data);

module.exports = { findByEmail, findById, create };
