const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// This function will be used by your frontend to send the verification code
// It returns a `verificationId` that the frontend needs to confirm the OTP.
const sendPhoneOTP = async (phoneNumber) => {
  try {
    // IMPORTANT: Firebase phone authentication is primarily done client-side.
    // The backend can't directly send an SMS. The flow is:
    // 1. Frontend requests a verificationId from Firebase using the phone number.
    // 2. Firebase sends the SMS.
    // 3. User enters OTP.
    // 4. Frontend verifies the code using the verificationId.
    // 
    // Your backend's role is to trust the ID token from Firebase after successful verification.
    // For simplicity, this service file is a placeholder. The actual SMS trigger is client-side.
    // The backend will later verify the Firebase ID token.

    // If you need a server-side SMS trigger, you'd use a different provider (like Twilio).
    // For Firebase, you'll update your frontend `Login.jsx` to use the Firebase SDK.
    console.log(`Firebase phone verification initiated for ${phoneNumber}. This happens client-side.`);
    // Return a success indicator for the frontend to proceed.
    return { success: true, message: 'Verification code sent via Firebase client SDK' };

  } catch (error) {
    console.error('Firebase phone OTP error:', error);
    throw new Error('Failed to send SMS via Firebase');
  }
};

// Verify Firebase ID token (called after user enters OTP on frontend)
const verifyPhoneOTP = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    // decodedToken contains user info including phone_number
    return { success: true, uid: decodedToken.uid, phoneNumber: decodedToken.phone_number };
  } catch (error) {
    console.error('Firebase token verification error:', error);
    throw new Error('Invalid OTP or verification failed');
  }
};

module.exports = { sendPhoneOTP, verifyPhoneOTP };