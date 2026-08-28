import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { env } from '../config/env.js';
import { supabase } from '../config/supabase.js';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyMigration() {
  console.log('🚀 Starting Supabase Database Migration Execution...');
  const migrationPath = path.join(__dirname, '../../migrations/001_initial_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Attempt Connection via Postgres Connection String if SUPABASE_DB_URL is set or constructed
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

  if (dbUrl) {
    console.log('🔌 Connecting to Supabase PostgreSQL via DATABASE_URL...');
    const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      console.log('⚡ Executing migration SQL file against Supabase PostgreSQL...');
      await client.query(sql);
      console.log('✅ Migration executed successfully via PostgreSQL client!');
      await client.end();
      return true;
    } catch (err) {
      console.error('❌ Direct PostgreSQL migration error:', err.message);
      await client.end();
    }
  }

  // Attempt using Supabase CLI db push if linked or available
  console.log('ℹ️ Checking if migration can be verified or applied via Supabase client...');
  
  // Test if tables exist now
  const { data, error } = await supabase.from('reconciliation_runs').select('id').limit(1);

  if (!error) {
    console.log('✅ Supabase database tables exist and are verified!');
    return true;
  } else if (error.code === '42P01') {
    console.log('⚠️ Tables do not exist yet in Supabase project:', env.SUPABASE_URL);
    console.log('📄 Migration SQL is prepared in: backend/migrations/001_initial_schema.sql');
    console.log('👉 Please execute backend/migrations/001_initial_schema.sql in the Supabase SQL Editor or provide DATABASE_URL in .env to apply automatically.');
    return false;
  } else {
    console.error('❌ Supabase table query error:', error.message);
    return false;
  }
}

applyMigration();
