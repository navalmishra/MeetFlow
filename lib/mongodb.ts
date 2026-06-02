import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI?.trim();

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

export function isMongoConfigured(): boolean {
  return Boolean(MONGODB_URI);
}

function resetConnectionCache() {
  cached.conn = null;
  cached.promise = null;
}

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 8000,
      })
      .then((conn) => {
        cached.conn = conn;
        return conn;
      })
      .catch((error) => {
        resetConnectionCache();
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    resetConnectionCache();
    throw error;
  }
}

/** Returns false if MongoDB is unavailable (does not throw). */
export async function tryConnectToDatabase(): Promise<boolean> {
  if (!isMongoConfigured()) return false;
  try {
    await connectToDatabase();
    return true;
  } catch {
    return false;
  }
}
