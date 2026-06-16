const mongoose = require('mongoose');

let connectionPromise = null;

const initDb = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }

  connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000
  }).then((conn) => {
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn.connection;
  }).catch((error) => {
    connectionPromise = null;
    throw error;
  });

  return connectionPromise;
};

const requireDb = async (req, res, next) => {
  try {
    await initDb();
    next();
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    res.status(503).json({ error: 'Database unavailable. Check server configuration.' });
  }
};

module.exports = { initDb, requireDb };
