const { exportPDF, exportICal } = require('./export.service');

const pdf = async (req, res, next) => {
  try {
    await exportPDF(req.params.scheduleId, res);
  } catch (err) { next(err); }
};

const ical = async (req, res, next) => {
  try {
    await exportICal(req.params.scheduleId, req.query.startDate, res);
  } catch (err) { next(err); }
};

module.exports = { pdf, ical };
