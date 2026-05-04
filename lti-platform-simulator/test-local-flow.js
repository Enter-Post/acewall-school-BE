import axios from 'axios';

// Test locally without ngrok
const PLATFORM_URL = 'http://localhost:4000';
const LMS_URL = 'http://localhost:5051'; // Use actual LMS port

async function testLocalFlow() {
  try {
    console.log('Testing LTI flow locally (without ngrok)...\n');
    
    // Step 1: Check platform health
    console.log('Step 1: Checking platform health...');
    const healthResponse = await axios.get(`${PLATFORM_URL}/health`);
    console.log('Platform healthy:', healthResponse.data.status);
    
    // Step 2: Update platform configuration to use localhost
    console.log('\nStep 2: Updating platform to use localhost URLs...');
    const platformData = {
      platform_name: "Fake LTI Platform Simulator",
      issuer: "http://localhost:4000",
      client_id: "lti-tool-client-id",
      deployment_id: "test-deployment-1",
      authorization_endpoint: "http://localhost:4000/authorize",
      token_endpoint: "http://localhost:4000/token",
      jwks_url: "http://localhost:4000/.well-known/jwks.json",
      redirect_uri: `${LMS_URL}/api/lti/launch`,
      active: true
    };

    try {
      const updateResponse = await axios.post(`${LMS_URL}/api/lti/create-platform`, platformData);
      console.log('Platform updated successfully');
    } catch (error) {
      console.log('Platform update failed, continuing with test...');
    }
    
    // Step 3: Test LTI flow locally
    console.log('\nStep 3: Triggering LTI flow...');
    console.log(`Calling: ${PLATFORM_URL}/simulate-launch`);
    
    const launchResponse = await axios.get(`${PLATFORM_URL}/simulate-launch`, {
      maxRedirects: 0
    }).catch(error => {
      if (error.response?.status === 302) {
        console.log('LMS Login redirect working (302 Found)');
        console.log('Redirect to:', error.response.headers.location);
        return { success: true };
      }
      throw error;
    });
    
    console.log('Local LTI flow test completed!');
    
  } catch (error) {
    console.error('Local test failed:', error.response?.status || error.message);
    if (error.response?.data) {
      console.log('Error response:', error.response.data);
    }
  }
}

testLocalFlow();
