import axios from 'axios';

const PLATFORM_URL = 'https://frequency-subtext-malformed.ngrok-free.dev';

async function testJWKS() {
  try {
    console.log('Testing JWKS endpoint...');
    
    // Test JWKS endpoint
    const jwksResponse = await axios.get(`${PLATFORM_URL}/.well-known/jwks.json`);
    console.log('JWKS Response:', JSON.stringify(jwksResponse.data, null, 2));
    
    // Test health endpoint to see what keys are being used
    const healthResponse = await axios.get(`${PLATFORM_URL}/health`);
    console.log('Platform Health:', JSON.stringify(healthResponse.data, null, 2));
    
    // Check if the kid in JWKS matches what the platform is using
    const jwks = jwksResponse.data;
    const platformConfig = healthResponse.data.config;
    
    console.log('JWKS Keys:', jwks.keys?.length || 0);
    console.log('Platform JWKS URL:', platformConfig.jwks_url);
    
    if (jwks.keys && jwks.keys.length > 0) {
      console.log('Available key IDs:', jwks.keys.map(key => key.kid));
    }
    
  } catch (error) {
    console.error('Error testing JWKS:', error.response?.data || error.message);
  }
}

testJWKS();
