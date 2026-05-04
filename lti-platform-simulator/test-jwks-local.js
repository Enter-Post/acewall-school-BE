import axios from 'axios';

// Test localhost JWKS endpoint
const PLATFORM_URL = 'http://localhost:4000';

async function testLocalJWKS() {
  try {
    console.log('🔑 Testing localhost JWKS endpoint...');
    
    // Test JWKS endpoint
    const jwksResponse = await axios.get(`${PLATFORM_URL}/.well-known/jwks.json`);
    console.log('✅ JWKS Response:');
    console.log(JSON.stringify(jwksResponse.data, null, 2));
    
    // Extract and display key information
    const jwks = jwksResponse.data;
    if (jwks.keys && jwks.keys.length > 0) {
      console.log('\n📋 Available Keys:');
      jwks.keys.forEach((key, index) => {
        console.log(`  ${index + 1}. Key ID: ${key.kid}`);
        console.log(`     Algorithm: ${key.alg}`);
        console.log(`     Key Type: ${key.kty}`);
        console.log(`     Usage: ${key.use}`);
        console.log(`     Public Key (first 50 chars): ${key.n.substring(0, 50)}...`);
        console.log('');
      });
    } else {
      console.log('❌ No keys found in JWKS');
    }
    
    // Test health endpoint
    const healthResponse = await axios.get(`${PLATFORM_URL}/health`);
    console.log('🏥 Platform Health:');
    console.log(JSON.stringify(healthResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing JWKS:', error.response?.data || error.message);
  }
}

testLocalJWKS();
