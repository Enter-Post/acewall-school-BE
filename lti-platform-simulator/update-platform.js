import mongoose from 'mongoose';
import LTIPlatform from '../src/Models/LTIPlatfrom.model.js';

const LMS_URL = 'https://professor-gallon-dropout.ngrok-free.dev';

async function updatePlatform() {
  try {
    // Connect to your MongoDB
    await mongoose.connect('mongodb://localhost:27017', {
      dbName: "dev"
    });

    console.log('🔗 Connected to MongoDB');

    // Update existing platform or create new one
    const platform = await LTIPlatform.findOneAndUpdate(
      { issuer: 'http://localhost:4000' },
      {
        platform_name: "Fake LTI Platform Simulator",
        issuer: "http://localhost:4000",
        client_id: "lti-tool-client-id",
        deployment_id: "test-deployment-1",
        authorization_endpoint: "http://localhost:4000/authorize",
        token_endpoint: "http://localhost:4000/token",
        jwks_url: "http://localhost:4000/.well-known/jwks.json",
        redirect_uri: `${LMS_URL}/api/lti/launch`,
        active: true
      },
      { upsert: true, new: true }
    );

    console.log('✅ Platform updated/created successfully:');
    console.log('📍 Platform:', platform);
    console.log('🔗 Redirect URI:', platform.redirect_uri);

  } catch (error) {
    console.error('❌ Error updating platform:', error);
  } finally {
    await mongoose.connection.close();
  }
}

updatePlatform();
