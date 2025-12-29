import { MongoClient, type Db, type Collection, ObjectId } from 'mongodb';

// MongoDB client singleton
let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

/**
 * Get MongoDB client (creates connection if needed)
 */
export function getClient(): Promise<MongoClient> {
  if (!clientPromise) {
    const uri = import.meta.env?.MONGODB_URI || process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    client = new MongoClient(uri);
    clientPromise = client.connect();
  }

  return clientPromise;
}

/**
 * Get the main database
 */
export async function getDatabase(): Promise<Db> {
  const client = await getClient();
  return client.db('astronoob');
}

/**
 * User document type
 */
export interface User {
  _id?: ObjectId;
  googleId: string;
  email: string;
  username: string;
  country: string;
  picture?: string; // Google profile photo URL
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Scope document type
 */
export interface Scope {
  _id?: ObjectId;
  userId: ObjectId;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  dishSizeMm: number;
  createdAt: Date;
  updatedAt: Date;
  // Cached heartbeat status fields
  lastHeartbeatAt?: Date;
  lastSeenClientTs?: string;
  lastRunIndex?: number;
  totalRuns?: number;
  lastCapture?: string;
}

/**
 * Node heartbeat document type
 */
export interface NodeHeartbeat {
  _id?: ObjectId;
  nodeId: string;
  receivedAt: Date;
  ts: string; // Client timestamp
  uptime_s?: number;
  load?: string;
  run_index?: number;
  total_runs?: number;
  last_capture?: string;
}

/**
 * Get users collection
 */
export async function getUsersCollection(): Promise<Collection<User>> {
  const db = await getDatabase();
  return db.collection<User>('users');
}

/**
 * Get scopes collection
 */
export async function getScopesCollection(): Promise<Collection<Scope>> {
  const db = await getDatabase();
  return db.collection<Scope>('scopes');
}

/**
 * Get node heartbeats collection
 */
export async function getNodeHeartbeatsCollection(): Promise<Collection<NodeHeartbeat>> {
  const db = await getDatabase();
  return db.collection<NodeHeartbeat>('node_heartbeats');
}

/**
 * Initialize database indexes
 * Call this once during setup
 */
export async function initializeIndexes(): Promise<void> {
  try {
    const users = await getUsersCollection();
    const scopes = await getScopesCollection();

    // Create indexes for users
    await users.createIndex({ googleId: 1 }, { unique: true });
    await users.createIndex({ email: 1 }, { unique: true });

    // Create indexes for scopes
    await scopes.createIndex({ userId: 1 });
    await scopes.createIndex({ name: 1 }); // For nodeId lookup

    // Create indexes for node heartbeats
    const heartbeats = await getNodeHeartbeatsCollection();
    await heartbeats.createIndex({ nodeId: 1, receivedAt: -1 });
    await heartbeats.createIndex({ receivedAt: -1 }); // For cleanup queries

    console.log('Database indexes initialized successfully');
  } catch (error) {
    console.error('Error initializing database indexes:', error);
    throw error;
  }
}

/**
 * Close database connection
 * Use this in serverless cleanup if needed
 */
export async function closeConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    clientPromise = null;
  }
}

