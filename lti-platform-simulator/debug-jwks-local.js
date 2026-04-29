import axios from 'axios';

// Use localhost for testing
const PLATFORM_URL = 'http://localhost:4000';

async function debugJWKS() {
  try {
    console.log('Testing JWKS endpoint locally...');
    
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
      
      // Test a JWT generation to see what kid is being used
      const testResponse = await axios.get(`${PLATFORM_URL}/simulate-launch`);
      console.log('Test launch initiated - check server logs for JWT kid');
    }
    
  } catch (error) {
    console.error('Error testing JWKS:', error.response?.data || error.message);
  }
}

debugJWKS();
