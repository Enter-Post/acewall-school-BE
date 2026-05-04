import mongoose from 'mongoose';
import LTIPlatform from '../src/Models/LTIPlatfrom.model.js';

const platformConfig = {
  platform_name: "Fake LTI Platform Simulator",
  issuer: "http://localhost:4000",
  client_id: "lti-tool-client-id",
  deployment_id: "test-deployment-1",
  authorization_endpoint: "http://localhost:4000/authorize",
  token_endpoint: "http://localhost:4000/token",
  jwks_url: "http://localhost:4000/.well-known/jwks.json",
  redirect_uri: "http://localhost:5050/api/lti/launch",
  active: true
};

async function checkAndAddPlatform() {
  try {
    // Connect to MongoDB (adjust connection string as needed)
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017', {
      dbName: "dev"
    });

    console.log('🔗 Connected to MongoDB');

    // Check if platform exists
    const existingPlatform = await LTIPlatform.findOne({ 
      issuer: platformConfig.issuer,
      active: true 
    });

    if (existingPlatform) {
      console.log('✅ Platform found in database:');
      console.log(JSON.stringify(existingPlatform, null, 2));
      
      // Check if it matches our config
      const matches = 
        existingPlatform.client_id === platformConfig.client_id &&
        existingPlatform.authorization_endpoint === platformConfig.authorization_endpoint &&
        existingPlatform.redirect_uri === platformConfig.redirect_uri;
      
      if (matches) {
        console.log('✅ Platform configuration matches!');
      } else {
        console.log('⚠️  Platform exists but configuration differs. Updating...');
        await LTIPlatform.updateOne(
          { _id: existingPlatform._id },
          { $set: platformConfig }
        );
        console.log('✅ Platform updated successfully');
      }
    } else {
      console.log('❌ Platform not found. Adding to database...');
      const newPlatform = new LTIPlatform(platformConfig);
      await newPlatform.save();
      console.log('✅ Platform added successfully');
    }

    // Verify all platforms
    const allPlatforms = await LTIPlatform.find({});
    console.log('\n📋 All platforms in database:');
    allPlatforms.forEach(platform => {
      console.log(`- ${platform.platform_name}: ${platform.issuer}`);
    });

  } catch (error) {
    console.error('❌ Database operation failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Run check
checkAndAddPlatform();
