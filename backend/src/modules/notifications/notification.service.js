const Notification = require('./notification.model');

const create = (userId, type, title, message, refId = null, refType = null) =>
  Notification.create({ user_id: userId, type, title, message, ref_id: refId, ref_type: refType });

const getAll = async (userId, query = {}) => {
  const filter = { user_id: userId };
  if (query.read !== undefined) filter.read = query.read === 'true';
  return Notification.find(filter).sort({ created_at: -1 }).limit(50);
};

const markRead = (id, userId) =>
  Notification.findOneAndUpdate({ _id: id, user_id: userId }, { read: true }, { new: true });

const markAllRead = (userId) =>
  Notification.updateMany({ user_id: userId, read: false }, { read: true });

const getUnreadCount = (userId) => Notification.countDocuments({ user_id: userId, read: false });

module.exports = { create, getAll, markRead, markAllRead, getUnreadCount };
