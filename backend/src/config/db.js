const mongoose = require('mongoose');

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const initDb = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }

  if (!cached.promise || mongoose.connection.readyState === 0) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      dbName: process.env.MONGODB_DB_NAME || 'trinetra'
    };

    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log(`MongoDB Connected: ${mongooseInstance.connection.host}`);
        return mongooseInstance.connection;
      })
      .catch((error) => {
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
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
