const Room = require('./room.model');

const findAll = async (filter = {}, page = 1, limit = 20) => {
  const [data, total] = await Promise.all([
    Room.find(filter).skip((page - 1) * limit).limit(limit).populate('dept_id', 'name code'),
    Room.countDocuments(filter),
  ]);
  return [data, total];
};

const findById = (id) => Room.findById(id).populate('dept_id', 'name code');
const create = (data) => Room.create(data);
const update = (id, data) => Room.findByIdAndUpdate(id, data, { new: true });
const remove = (id) => Room.findByIdAndDelete(id);

module.exports = { findAll, findById, create, update, remove };
