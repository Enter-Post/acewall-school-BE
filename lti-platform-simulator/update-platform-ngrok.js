import axios from 'axios';

const LMS_URL = 'https://professor-gallon-dropout.ngrok-free.dev';

async function updatePlatform() {
  try {
    console.log('🔄 Updating platform configuration in LMS...');
    
    const platformData = {
      platform_name: "Fake LTI Platform Simulator",
      issuer: "https://frequency-subtext-malformed.ngrok-free.dev",
      client_id: "lti-tool-client-id",
      deployment_id: "test-deployment-1",
      authorization_endpoint: "https://frequency-subtext-malformed.ngrok-free.dev/authorize",
      token_endpoint: "https://frequency-subtext-malformed.ngrok-free.dev/token",
      jwks_url: "https://frequency-subtext-malformed.ngrok-free.dev/.well-known/jwks.json",
      redirect_uri: `${LMS_URL}/api/lti/launch`,
      active: true
    };

    const response = await axios.post(`${LMS_URL}/api/lti/create-platform`, platformData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Platform updated successfully:');
    console.log('📍 Platform:', response.data.platform);
    console.log('🔗 Redirect URI:', response.data.platform.redirect_uri);

  } catch (error) {
    console.error('❌ Error updating platform:', error.response?.data || error.message);
  }
}

updatePlatform();
