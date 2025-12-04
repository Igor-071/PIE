// Run this with: node run-migrations.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://snmsjiiogsxshksgjyzc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNubXNqaWlvZ3N4c2hrc2dqeXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NDUxNzksImV4cCI6MjA3ODQyMTE3OX0.hXC6SYy19RUwRVELsH9NjfW3EOJxMeU7FcSqFY3Z-wI";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runMigration() {
  try {
    console.log('📦 Reading FIX_DATABASE.sql...');
    const sql = fs.readFileSync(path.join(__dirname, 'FIX_DATABASE.sql'), 'utf8');
    
    console.log('🚀 Running migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('🔍 Refresh http://localhost:8080/diagnostic to verify');
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
}

runMigration();

