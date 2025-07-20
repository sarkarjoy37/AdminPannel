// setup-admin.js - Script to set up admin user with custom claims
// Run this script once to set up your admin user

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// You'll need to download your service account key from Firebase Console
// Go to Project Settings → Service Accounts → Generate New Private Key
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function setupAdminUser() {
  try {
    // Replace with the email you created in Firebase Console
    const adminEmail = 'admin@ecommerceapp.com';
    
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(adminEmail);
    
    // Set custom claims for admin access
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      admin: true,
      role: 'admin'
    });
    
    console.log(`✅ Admin user setup successful!`);
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🆔 UID: ${userRecord.uid}`);
    console.log(`🔑 Admin privileges granted`);
    
    // Verify the claims were set
    const updatedUser = await admin.auth().getUser(userRecord.uid);
    console.log(`📋 Custom claims:`, updatedUser.customClaims);
    
  } catch (error) {
    console.error('❌ Error setting up admin user:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      console.log('💡 Make sure you created the user in Firebase Console first:');
      console.log('   1. Go to Firebase Console → Authentication → Users');
      console.log('   2. Click "Add User"');
      console.log('   3. Enter email and password');
      console.log('   4. Run this script again');
    }
  }
}

setupAdminUser().then(() => {
  console.log('🎉 Setup complete!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Setup failed:', error);
  process.exit(1);
}); 