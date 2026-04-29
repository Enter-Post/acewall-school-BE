import mongoose from 'mongoose';
import LTIPlatform from '../src/Models/LTIPlatfrom.model.js';

// Platform configuration to add to your LMS database
const platformConfig = {
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

async function setupPlatform() {
  try {
    // Connect to your MongoDB (adjust connection string as needed)
    await mongoose.connect('mongodb://localhost:27017/acewall-school', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔗 Connected to MongoDB');

    // Check if platform already exists
    const existingPlatform = await LTIPlatform.findOne({ 
      issuer: platformConfig.issuer,
      client_id: platformConfig.client_id 
    });

    if (existingPlatform) {
      console.log('⚠️  Platform already exists, updating...');
      await LTIPlatform.updateOne(
        { _id: existingPlatform._id },
        { $set: platformConfig }
      );
      console.log('✅ Platform updated successfully');
    } else {
      console.log('➕ Adding new fake platform...');
      const newPlatform = new LTIPlatform(platformConfig);
      await newPlatform.save();
      console.log('✅ Fake platform added successfully');
    }

    console.log('\n📋 Platform Configuration:');
    console.log(JSON.stringify(platformConfig, null, 2));

    console.log('\n🎯 Ready to test!');
    console.log('1. Start your LMS: npm start (on port 5050)');
    console.log('2. Start fake platform: cd lti-platform-simulator && npm start');
    console.log('3. Test: http://localhost:4000/simulate-launch');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run setup
setupPlatform();
