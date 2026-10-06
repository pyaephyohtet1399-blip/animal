const mongoose = require('mongoose');

const MONGO_OPTIONS = {
  maxPoolSize: 50,
  minPoolSize: 10,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000
};

const connectDB = async (uri) => {
  await mongoose.connect(uri, MONGO_OPTIONS);
  return mongoose.connection;
};

module.exports = { connectDB, MONGO_OPTIONS };
