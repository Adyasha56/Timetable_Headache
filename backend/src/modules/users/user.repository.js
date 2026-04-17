const User = require('./user.model');

const findAll = async (filter = {}, page = 1, limit = 20) => {
  const [data, total] = await Promise.all([
    User.find(filter)
      .select('-password_hash')
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('dept_id', 'name code'),
    User.countDocuments(filter),
  ]);
  return [data, total];
};

const findById = (id) => User.findById(id).select('-password_hash').populate('dept_id', 'name code');
const findByEmail = (email) => User.findOne({ email });
const create = (data) => User.create(data);
const update = (id, data) => User.findByIdAndUpdate(id, data, { new: true }).select('-password_hash');
const remove = (id) => User.findByIdAndDelete(id);

module.exports = { findAll, findById, findByEmail, create, update, remove };
