const Section = require('./section.model');

const findAll = async (filter = {}, page = 1, limit = 20) => {
  const [data, total] = await Promise.all([
    Section.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('dept_id', 'name code')
      .populate('subjects', 'code name type'),
    Section.countDocuments(filter),
  ]);
  return [data, total];
};

const findById = (id) =>
  Section.findById(id)
    .populate('dept_id', 'name code')
    .populate('subjects', 'code name type credits sessions_per_week');

const create = (data) => Section.create(data);
const update = (id, data) => Section.findByIdAndUpdate(id, data, { new: true });
const remove = (id) => Section.findByIdAndDelete(id);

module.exports = { findAll, findById, create, update, remove };
