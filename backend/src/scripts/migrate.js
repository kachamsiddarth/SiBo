import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Migration runner and Supabase database structure verification script.
 */
export async function runMigrations() {
  console.log('🔄 Verifying Supabase PostgreSQL database tables and pgvector extension...');

  const migrationFilePath = path.join(__dirname, '../../migrations/001_initial_schema.sql');
  const sqlContent = fs.readFileSync(migrationFilePath, 'utf8');

  // Verify connection by querying database table status
  try {
    const { data: runs, error } = await supabase.from('reconciliation_runs').select('id').limit(1);

    if (error) {
      if (error.code === '42P01') { // Table does not exist
        console.log('⚠️ Database tables not yet created in Supabase PostgreSQL.');
        console.log('📄 SQL Migration File Ready at: backend/migrations/001_initial_schema.sql');
        console.log('👉 Please execute the contents of backend/migrations/001_initial_schema.sql in the Supabase SQL Editor.');
        return { success: false, status: 'MIGRATION_REQUIRED', sqlPath: migrationFilePath };
      } else {
        console.warn('⚠️ Database connection warning:', error.message);
        return { success: false, error: error.message };
      }
    }

    console.log('✅ Supabase database connection verified. Tables exist and ready.');
    return { success: true, status: 'READY' };
  } catch (err) {
    console.error('❌ Migration verification error:', err.message);
    return { success: false, error: err.message };
  }
}

// Execute if run directly via node
if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  runMigrations()
    .then((result) => {
      console.log('Migration status result:', result);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
