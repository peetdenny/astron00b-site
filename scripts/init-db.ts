/**
 * Database initialization script
 * Run this once to set up MongoDB indexes
 * 
 * Usage: npx tsx scripts/init-db.ts
 */

// Load environment variables from .env file
import { config } from 'dotenv';
config();

import { initializeIndexes, closeConnection } from '../src/lib/db';

async function main() {
  console.log('Initializing MongoDB database...');
  
  try {
    await initializeIndexes();
    console.log('✅ Database initialization complete!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

main();