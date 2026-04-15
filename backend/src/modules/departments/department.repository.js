const Department = require('./department.model');

const findAll = (filter = {}) => Department.find(filter);
const findById = (id) => Department.findById(id);
const create = (data) => Department.create(data);
const update = (id, data) => Department.findByIdAndUpdate(id, data, { new: true });
const remove = (id) => Department.findByIdAndDelete(id);

module.exports = { findAll, findById, create, update, remove };
