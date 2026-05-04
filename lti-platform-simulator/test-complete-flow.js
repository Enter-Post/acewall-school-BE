import axios from 'axios';

// Use localhost for testing (change to ngrok URL when ready)
const PLATFORM_URL = 'http://localhost:4000';
const LMS_URL = 'http://localhost:5050'; // Change to ngrok when ready

async function testCompleteFlow() {
  try {
    console.log('🚀 Testing Complete LTI Flow...\n');
    
    // Step 1: Check platform health
    console.log('📋 Step 1: Checking platform health...');
    const healthResponse = await axios.get(`${PLATFORM_URL}/health`);
    console.log('✅ Platform healthy:', healthResponse.data.status);
    
    // Step 2: Get JWKS keys
    console.log('\n📋 Step 2: Checking JWKS keys...');
    const jwksResponse = await axios.get(`${PLATFORM_URL}/.well-known/jwks.json`);
    const jwks = jwksResponse.data;
    console.log('✅ JWKS Keys available:', jwks.keys.length);
    console.log('🔑 Key ID:', jwks.keys[0].kid);
    
    // Step 3: Trigger LTI flow
    console.log('\n📋 Step 3: Triggering LTI flow...');
    console.log(`🎯 Calling: ${PLATFORM_URL}/simulate-launch`);
    
    const launchResponse = await axios.get(`${PLATFORM_URL}/simulate-launch`, {
      maxRedirects: 0 // Don't follow redirects, we want to see the flow
    }).catch(error => {
      if (error.response?.status === 302) {
        console.log('✅ LMS Login redirect working (302 Found)');
        console.log('🔗 Redirect to:', error.response.headers.location);
        return { success: true, message: 'LTI flow initiated successfully' };
      }
      throw error;
    });
    
    console.log('📄 Launch response:', launchResponse.status);
    console.log('🎯 LTI Flow Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.status || error.message);
    if (error.response?.data) {
      console.log('📄 Error response:', error.response.data);
    }
  }
}

testCompleteFlow();
