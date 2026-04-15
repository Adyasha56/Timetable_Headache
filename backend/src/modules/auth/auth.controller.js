const authService = require('./auth.service');
const { success } = require('../../common/utils/response');

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    success(res, result);
  } catch (err) {
    next(err);
  }
};

const logout = (req, res) => {
  success(res, { message: 'Logged out' });
};

const me = async (req, res, next) => {
  try {
    const user = await authService.me(req.user.id);
    success(res, user);
  } catch (err) {
    next(err);
  }
};

module.exports = { login, logout, me };
