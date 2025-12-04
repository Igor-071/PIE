#!/usr/bin/env node
/**
 * CREATE TEST USERS SCRIPT
 * Run this with: node create-test-users.js
 * 
 * This script will:
 * 1. Create test users in Supabase Auth
 * 2. Assign roles to each user
 * 3. Create a test patient record
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Try to load .env file if it exists
let envVars = {};
try {
  const envFile = readFileSync('.env', 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim().replace(/"/g, '');
    }
  });
} catch (err) {
  console.log('⚠️  No .env file found, using defaults');
}

// Supabase configuration
const SUPABASE_URL = envVars.VITE_SUPABASE_URL || 'https://snmsjiiogsxshksgjyzc.supabase.co';
const SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_PUBLISHABLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNubXNqaWlvZ3N4c2hrc2dqeXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NDUxNzksImV4cCI6MjA3ODQyMTE3OX0.hXC6SYy19RUwRVELsH9NjfW3EOJxMeU7FcSqFY3Z-wI';

// Test accounts to create
const TEST_ACCOUNTS = [
  {
    email: 'admin@clinic.test',
    password: 'Admin123!',
    role: 'clinic_admin',
    fullName: 'Admin User',
    description: 'Clinic Administrator - Full Access'
  },
  {
    email: 'provider@clinic.test',
    password: 'Provider123!',
    role: 'provider',
    fullName: 'Dr. Sarah Provider',
    description: 'Medical Provider'
  },
  {
    email: 'assistant@clinic.test',
    password: 'Assistant123!',
    role: 'assistant',
    fullName: 'Assistant User',
    description: 'Clinic Assistant - Limited Access'
  },
  {
    email: 'patient@test.com',
    password: 'Patient123!',
    role: 'patient',
    fullName: 'Jane Doe',
    description: 'Test Patient'
  }
];

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('\n🚀 Starting Test User Creation Process...\n');
console.log('📍 Supabase URL:', SUPABASE_URL);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function createTestUsers() {
  const results = {
    success: [],
    failed: [],
    alreadyExists: []
  };

  for (const account of TEST_ACCOUNTS) {
    try {
      console.log(`\n🔄 Creating user: ${account.email}`);
      console.log(`   Role: ${account.role}`);
      console.log(`   Description: ${account.description}`);

      // Try to sign up the user
      const { data, error } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: {
          data: {
            full_name: account.fullName
          },
          emailRedirectTo: undefined // Don't send confirmation email
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`   ⚠️  User already exists`);
          results.alreadyExists.push(account);
          
          // Try to get the user and assign role anyway
          await assignRoleToExistingUser(account);
        } else {
          console.log(`   ❌ Failed: ${error.message}`);
          results.failed.push({ account, error: error.message });
        }
        continue;
      }

      if (data.user) {
        console.log(`   ✅ User created with ID: ${data.user.id}`);
        
        // Assign role
        await assignRole(data.user.id, account.role);
        
        // If patient, create patient record
        if (account.role === 'patient') {
          await createPatientRecord(data.user.id, account);
        }
        
        results.success.push(account);
      }

    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
      results.failed.push({ account, error: err.message });
    }
  }

  return results;
}

async function assignRole(userId, role) {
  try {
    console.log(`   🎭 Assigning role: ${role}`);
    
    const { error } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role: role }, { onConflict: 'user_id,role' });

    if (error) {
      console.log(`   ⚠️  Role assignment warning: ${error.message}`);
    } else {
      console.log(`   ✅ Role assigned successfully`);
    }
  } catch (err) {
    console.log(`   ⚠️  Role assignment error: ${err.message}`);
  }
}

async function assignRoleToExistingUser(account) {
  try {
    // Sign in to get user ID
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password
    });

    if (signInError) {
      console.log(`   ⚠️  Could not sign in to assign role: ${signInError.message}`);
      return;
    }

    if (signInData.user) {
      await assignRole(signInData.user.id, account.role);
      await supabase.auth.signOut();
    }
  } catch (err) {
    console.log(`   ⚠️  Error assigning role to existing user: ${err.message}`);
  }
}

async function createPatientRecord(userId, account) {
  try {
    console.log(`   👤 Creating patient record`);
    
    const { data, error } = await supabase
      .from('patients')
      .insert({
        user_id: userId,
        first_name: 'Jane',
        last_name: 'Doe',
        email: account.email,
        phone: '555-0123',
        date_of_birth: '1990-01-15',
        gender: 'Female',
        address: '123 Test Street',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90001',
        emergency_contact_name: 'John Doe',
        emergency_contact_phone: '555-0124'
      })
      .select()
      .single();

    if (error) {
      console.log(`   ⚠️  Patient record warning: ${error.message}`);
    } else {
      console.log(`   ✅ Patient record created`);
      
      // Add sample treatment
      await createSampleTreatment(data.id);
    }
  } catch (err) {
    console.log(`   ⚠️  Patient record error: ${err.message}`);
  }
}

async function createSampleTreatment(patientId) {
  try {
    const { error } = await supabase
      .from('treatments')
      .insert({
        patient_id: patientId,
        treatment_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        treatment_type: 'Botox Treatment',
        areas_treated: ['Forehead', 'Glabella'],
        products_used: ['Botox Cosmetic 100U'],
        units_used: [25, 20],
        notes: 'Initial consultation and treatment. Patient tolerated procedure well.',
        provider_notes: 'Standard dosing protocol followed. Follow-up in 2 weeks.'
      });

    if (!error) {
      console.log(`   ✅ Sample treatment added`);
    }
  } catch (err) {
    console.log(`   ⚠️  Sample treatment error: ${err.message}`);
  }
}

function printResults(results) {
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESULTS SUMMARY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (results.success.length > 0) {
    console.log('✅ Successfully Created:');
    results.success.forEach(acc => {
      console.log(`   • ${acc.email} (${acc.role})`);
    });
    console.log('');
  }

  if (results.alreadyExists.length > 0) {
    console.log('⚠️  Already Existed (roles updated):');
    results.alreadyExists.forEach(acc => {
      console.log(`   • ${acc.email} (${acc.role})`);
    });
    console.log('');
  }

  if (results.failed.length > 0) {
    console.log('❌ Failed:');
    results.failed.forEach(({ account, error }) => {
      console.log(`   • ${account.email}: ${error}`);
    });
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 TEST CREDENTIALS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('CLINIC PORTAL (http://localhost:8080 → "Clinic Sign In"):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 Admin:     admin@clinic.test / Admin123!');
  console.log('🔐 Provider:  provider@clinic.test / Provider123!');
  console.log('🔐 Assistant: assistant@clinic.test / Assistant123!\n');
  
  console.log('PATIENT PORTAL (http://localhost:8080 → "Patient Sign In"):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 Patient:   patient@test.com / Patient123!\n');
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Setup complete! You can now login to test the application.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Run the script
createTestUsers()
  .then(results => {
    printResults(results);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal Error:', error);
    console.error('\nPlease check:');
    console.error('1. Supabase project is running');
    console.error('2. .env file has correct credentials');
    console.error('3. Database migrations have been run');
    process.exit(1);
  });

