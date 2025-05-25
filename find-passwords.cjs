const bcrypt = require('bcrypt');

// Common passwords that might have been used
const commonPasswords = [
  'password',
  'password123', 
  'admin',
  'admin123',
  'manager',
  'manager123',
  'gudang',
  'mitra',
  'gudangmitra',
  'nug',
  'Nug',
  'NUG',
  '123456',
  'qwerty',
  'user',
  'user123',
  'test',
  'test123'
];

// Hashed passwords from the database
const hashedPasswords = {
  'manager@gudangmitra.com': '$2b$10$0.r4erV9XBZhKwGP2lzqL.MURRLUCcUEKP3RBrEScJSzcpr9zXFrq',
  'intanchaya21@gmail.com': '$2a$10$QnDalji4Dj40S8/IB3HS3.OUKdHcDO1U.HFIVtZ9n3nn1.wAPXLee',
  'ridwanfarid213@gmail.com': '$2a$10$6wxsMiuVMWYnrHPgwdNyqeL5v7Qumft0/RroRRKiXbr1tVwG3DIoS',
  'user@gudangmitra.com': '$2a$10$TkIhkZz0ur0OGbmOTp9uMeuyB64L8opCa9AWTNBxHdHOnFEitUFO.',
  'sarah@gudangmitra.com': '$2a$10$TkIhkZz0ur0OGbmOTp9uMeuyB64L8opCa9AWTNBxHdHOnFEitUFO.',
  'mreza3074@gmail.com': '$2a$10$D5n5rjQucquFnEkGjXkFZO4ybh7qnmeBtsNoOKmr1lLClZjzu78MG',
  'nug@example.com': '$2b$10$IQ2Z64rzqGME6McSxoj2nOlADK1103yeyuY3CnnH9S6dDKrHZZ5sq'
};

async function findPassword(email, hash) {
  console.log(`\n🔍 Testing passwords for ${email}...`);
  
  for (const password of commonPasswords) {
    try {
      const matches = await bcrypt.compare(password, hash);
      if (matches) {
        console.log(`✅ FOUND! Password for ${email} is: "${password}"`);
        return password;
      }
    } catch (error) {
      console.log(`❌ Error testing "${password}": ${error.message}`);
    }
  }
  
  console.log(`❌ No common password found for ${email}`);
  return null;
}

async function findAllPasswords() {
  console.log('🔐 Finding passwords for hashed users...\n');
  
  const results = {};
  
  for (const [email, hash] of Object.entries(hashedPasswords)) {
    const password = await findPassword(email, hash);
    if (password) {
      results[email] = password;
    }
  }
  
  console.log('\n🎉 SUMMARY OF FOUND PASSWORDS:');
  console.log('=====================================');
  
  if (Object.keys(results).length > 0) {
    for (const [email, password] of Object.entries(results)) {
      console.log(`${email} → "${password}"`);
    }
  } else {
    console.log('No passwords found with common patterns.');
    console.log('\nYou may need to:');
    console.log('1. Reset passwords in the database');
    console.log('2. Ask users for their original passwords');
    console.log('3. Create new plain text passwords temporarily');
  }
  
  console.log('\n📋 WORKING PLAIN TEXT ACCOUNTS:');
  console.log('admin@example.com → "password123"');
  console.log('user@example.com → "password123"');
  console.log('admin1@example.com → "admin123"');
}

findAllPasswords().catch(console.error);
