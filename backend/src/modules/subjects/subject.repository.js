const Subject = require('./subject.model');

const findAll = async (filter = {}, page = 1, limit = 20) => {
  const [data, total] = await Promise.all([
    Subject.find(filter).skip((page - 1) * limit).limit(limit).populate('dept_id', 'name code'),
    Subject.countDocuments(filter),
  ]);
  return [data, total];
};

const findById = (id) => Subject.findById(id).populate('dept_id', 'name code');
const create = (data) => Subject.create(data);
const update = (id, data) => Subject.findByIdAndUpdate(id, data, { new: true });
const remove = (id) => Subject.findByIdAndDelete(id);

module.exports = { findAll, findById, create, update, remove };
