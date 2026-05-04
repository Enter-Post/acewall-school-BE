/**
 * Update .env with ngrok URL
 * Usage: node scripts/update-ngrok.js <ngrok-url>
 * Example: node scripts/update-ngrok.js https://abc123.ngrok-free.app
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ngrokUrl = process.argv[2];

if (!ngrokUrl) {
  console.log('Usage: node scripts/update-ngrok.js <ngrok-url>');
  console.log('Example: node scripts/update-ngrok.js https://abc123.ngrok-free.app');
  process.exit(1);
}

const envPath = path.join(__dirname, '..', '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found. Please create it first:');
  console.log('   cp .env.example .env');
  process.exit(1);
}

let envContent = fs.readFileSync(envPath, 'utf8');

// Update TOOL_URL
envContent = envContent.replace(
  /^TOOL_URL=.*/m,
  `TOOL_URL=${ngrokUrl}`
);

// Update REDIRECT_URI
envContent = envContent.replace(
  /^REDIRECT_URI=.*/m,
  `REDIRECT_URI=${ngrokUrl}/launch`
);

fs.writeFileSync(envPath, envContent);

console.log('✅ Updated .env with ngrok URL:');
console.log(`   TOOL_URL=${ngrokUrl}`);
console.log(`   REDIRECT_URI=${ngrokUrl}/launch`);
console.log('\n📋 Register these URLs with your LTI Platform:');
console.log(`   Target Link URI: ${ngrokUrl}/launch`);
console.log(`   Login URL:       ${ngrokUrl}/login`);
console.log(`   JWKS URL:        ${ngrokUrl}/.well-known/jwks.json`);
