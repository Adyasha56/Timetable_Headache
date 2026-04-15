require('dotenv').config();
const mongoose = require('mongoose');
const { MONGODB_URI } = require('./config/env');

const User = require('./modules/users/user.model');

const seed = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected');

  // Delete existing admin to avoid stale/corrupted password
  await User.deleteOne({ email: 'admin@university.com' });

  // password_hash field is hashed automatically by the pre('save') hook in user.model.js
  await User.create({
    name: 'Admin',
    email: 'admin@university.com',
    password_hash: 'admin123',
    role: 'admin',
    status: 'active',
  });

  console.log('Admin user created');
  console.log('  Email   : admin@university.com');
  console.log('  Password: admin123');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
