const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../../config/env');
const AppError = require('../../common/errors/AppError');
const authRepo = require('./auth.repository');

const login = async (email, password) => {
  const user = await authRepo.findByEmail(email);
  if (!user) throw new AppError('Invalid credentials', 401, 'AUTH_FAILED');

  const match = await user.comparePassword(password);
  if (!match) throw new AppError('Invalid credentials', 401, 'AUTH_FAILED');

  const token = jwt.sign(
    { id: user._id, role: user.role, dept_id: user.dept_id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  };
};

const me = async (userId) => {
  const user = await authRepo.findById(userId);
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  return user;
};

module.exports = { login, me };
