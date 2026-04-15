const DailyOverride = require('./daily-override.model');

const findAll = async (filter = {}, page = 1, limit = 20) => {
  const [data, total] = await Promise.all([
    DailyOverride.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ date: -1 })
      .populate('original_teacher_id', 'name')
      .populate('substitute_teacher_id', 'name')
      .populate('subject_id', 'name code')
      .populate('room_id', 'name'),
    DailyOverride.countDocuments(filter),
  ]);
  return [data, total];
};

const findById = (id) => DailyOverride.findById(id);
const create = (data) => DailyOverride.create(data);
const update = (id, data) => DailyOverride.findByIdAndUpdate(id, data, { new: true });
const remove = (id) => DailyOverride.findByIdAndDelete(id);

module.exports = { findAll, findById, create, update, remove };
