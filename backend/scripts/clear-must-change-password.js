const mongoose = require('mongoose');
const User = require('../src/models/User');
const { connectDb, runCli } = require('./lib/seedHelpers');

const main = async () => {
  await connectDb();
  const before = await User.countDocuments({ mustChangePassword: true });
  const result = await User.updateMany(
    { mustChangePassword: true },
    { $set: { mustChangePassword: false } }
  );
  const after = await User.countDocuments({ mustChangePassword: true });
  process.stdout.write(
    `clear-must-change-password: ${before} user(s) flagged, modified=${result.modifiedCount}, remaining=${after}\n`
  );
  await mongoose.disconnect();
};

if (require.main === module) {
  runCli(main, 'clear-must-change-password');
}

module.exports = { main };
