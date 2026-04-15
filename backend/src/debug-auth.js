require('dotenv').config();
const mongoose = require('mongoose');
const { MONGODB_URI } = require('./config/env');
const User = require('./modules/users/user.model');

const run = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('MongoDB connected');

  const user = await User.findOne({ email: 'admin@university.com' });

  if (!user) {
    console.log('ERROR: User not found in DB. Run seed first.');
    process.exit(1);
  }

  console.log('User found:', {
    id: user._id,
    email: user.email,
    role: user.role,
    status: user.status,
    password_hash: user.password_hash,
  });

  const match = await user.comparePassword('admin123');
  console.log('Password match for "admin123":', match);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
