const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Generate and send OTP via email
const sendEmailOTP = async (email) => {
  try {
    // Generate a 6-digit OTP
    const secret = speakeasy.generateSecret({ length: 20 });
    const otp = speakeasy.totp({
      secret: secret.base32,
      encoding: 'base32',
      step: 300, // OTP valid for 5 minutes (300 seconds)
      digits: 6,
    });

    // Store the secret and expiry in your database (e.g., in a new 'otps' collection or in the user's record)
    // For now, we'll assume you'll store this.

    const mailOptions = {
      from: process.env.OTP_EMAIL_FROM,
      to: email,
      subject: 'Your StudySnap Login OTP',
      text: `Your OTP for logging into StudySnap is: ${otp}. This code is valid for 5 minutes.`,
      html: `<p>Your OTP for logging into StudySnap is: <strong>${otp}</strong></p><p>This code is valid for 5 minutes.</p>`,
    };

    await transporter.sendMail(mailOptions);
    
    // Return the secret (or a reference) so it can be verified later
    // In a real app, you'd store this in a database with the user's email and an expiry timestamp.
    return { success: true, secret: secret.base32, expiresIn: 300 };

  } catch (error) {
    console.error('Email OTP error:', error);
    throw new Error('Failed to send OTP email');
  }
};

// Verify the OTP entered by the user
const verifyEmailOTP = (otp, secret) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: otp,
    step: 300, // Must match the step used in generation
    window: 1, // Allow 1 step before/after (30 seconds tolerance)
    digits: 6,
  });
};

module.exports = { sendEmailOTP, verifyEmailOTP };