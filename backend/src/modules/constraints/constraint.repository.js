const Constraint = require('./constraint.model');

const findAll = async (filter = {}, page = 1, limit = 20) => {
  const [data, total] = await Promise.all([
    Constraint.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('created_by', 'name email')
      .populate('dept_id', 'name code'),
    Constraint.countDocuments(filter),
  ]);
  return [data, total];
};

const findById = (id) => Constraint.findById(id);
const create = (data) => Constraint.create(data);
const update = (id, data) => Constraint.findByIdAndUpdate(id, data, { new: true });
const remove = (id) => Constraint.findByIdAndDelete(id);

module.exports = { findAll, findById, create, update, remove };
