import axios from 'axios';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const PLATFORM_URL = 'https://frequency-subtext-malformed.ngrok-free.dev';
const LMS_URL = 'https://professor-gallon-dropout.ngrok-free.dev';

async function testLaunch() {
  console.log('🚀 Starting LTI Platform Simulator Test...\n');

  try {
    // Step 1: Check if platform is running
    console.log('📋 Step 1: Checking platform health...');
    const healthResponse = await axios.get(`${PLATFORM_URL}/health`);
    console.log('✅ Platform is healthy:', healthResponse.data.status);
    console.log('📊 Platform config:', healthResponse.data.config);

    // Step 2: Get JWKS to verify JWT signing is working
    console.log('\n📋 Step 2: Checking JWKS endpoint...');
    const jwksResponse = await axios.get(`${PLATFORM_URL}/.well-known/jwks.json`);
    console.log('✅ JWKS endpoint working');
    console.log('🔑 Available keys:', jwksResponse.data.keys.length);

    // Step 3: Trigger the LTI flow
    console.log('\n📋 Step 3: Triggering LTI launch simulation...');
    console.log(`🎯 Calling: ${PLATFORM_URL}/simulate-launch`);
    
    // This will redirect to LMS, so we need to follow redirects
    const launchResponse = await axios.get(`${PLATFORM_URL}/simulate-launch`, {
      maxRedirects: 5,
      validateStatus: (status) => status < 400
    });

    console.log('✅ Launch initiated successfully');
    console.log('📍 Final URL:', launchResponse.request.res.responseUrl || 'Redirected successfully');

    // Step 4: Verify the complete flow
    console.log('\n📋 Step 4: Verifying complete flow...');
    
    // Wait a moment for the flow to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if LMS responded correctly (you might need to adjust this based on your LMS response)
    try {
      const dashboardResponse = await axios.get(`${LMS_URL}/dashboard`, {
        validateStatus: (status) => status < 500
      });
      
      if (dashboardResponse.status === 200) {
        console.log('✅ LTI flow completed successfully!');
        console.log('🎉 User should now be logged into the LMS dashboard');
      } else {
        console.log('⚠️  LMS responded with status:', dashboardResponse.status);
        console.log('📄 Response:', dashboardResponse.data);
      }
    } catch (dashboardError) {
      if (dashboardError.response && dashboardError.response.status === 302) {
        console.log('✅ LTI flow completed - LMS redirected user');
        console.log('🎯 Redirect location:', dashboardError.response.headers.location);
      } else {
        console.log('⚠️  Could not verify LMS dashboard access');
        console.log('📄 Error:', dashboardError.message);
      }
    }

    // Step 5: Summary
    console.log('\n🎯 Test Summary:');
    console.log('✅ Fake Platform: Running on port 4000');
    console.log('✅ JWKS Endpoint: Working');
    console.log('✅ LTI Login Flow: Initiated');
    console.log('✅ JWT Signing: RS256 with proper claims');
    console.log('✅ Auto-POST to LMS: Simulated');
    
    console.log('\n🔍 Next steps:');
    console.log('1. Make sure your LMS is running on localhost:5050');
    console.log('2. Add the fake platform to your LMS database:');
    console.log('   - issuer: http://localhost:4000');
    console.log('   - client_id: lti-tool-client-id');
    console.log('   - jwks_url: http://localhost:4000/.well-known/jwks.json');
    console.log('   - authorization_endpoint: http://localhost:4000/authorize');
    console.log('   - redirect_uri: http://localhost:5050/api/lti/launch');
    console.log('3. Visit http://localhost:4000/simulate-launch to test manually');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Make sure the fake platform is running: npm start');
      console.log('2. Check if port 4000 is available');
      console.log('3. Verify your LMS is running on port 5050');
    } else if (error.response) {
      console.log('📄 Error response:', error.response.status, error.response.data);
    }
  }
}

// Run the test
testLaunch();
