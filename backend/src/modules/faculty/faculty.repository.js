const Faculty = require('./faculty.model');

const findAll = async (filter = {}, page = 1, limit = 20) => {
  const [data, total] = await Promise.all([
    Faculty.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('dept_id', 'name code'),
    Faculty.countDocuments(filter),
  ]);
  return [data, total];
};

const findById = (id) => Faculty.findById(id).populate('dept_id', 'name code');
const create = (data) => Faculty.create(data);
const update = (id, data) => Faculty.findByIdAndUpdate(id, data, { new: true });
const remove = (id) => Faculty.findByIdAndDelete(id);

module.exports = { findAll, findById, create, update, remove };
