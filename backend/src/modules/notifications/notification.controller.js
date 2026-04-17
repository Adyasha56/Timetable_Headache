const service = require('./notification.service');
const { success } = require('../../common/utils/response');

const getAll = async (req, res, next) => {
  try { success(res, await service.getAll(req.user.id, req.query)); } catch (err) { next(err); }
};

const getUnreadCount = async (req, res, next) => {
  try { success(res, { count: await service.getUnreadCount(req.user.id) }); } catch (err) { next(err); }
};

const markRead = async (req, res, next) => {
  try { success(res, await service.markRead(req.params.id, req.user.id)); } catch (err) { next(err); }
};

const markAllRead = async (req, res, next) => {
  try { await service.markAllRead(req.user.id); success(res, null); } catch (err) { next(err); }
};

module.exports = { getAll, getUnreadCount, markRead, markAllRead };
