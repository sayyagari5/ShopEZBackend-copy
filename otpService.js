const crypto = require('crypto');
const nodemailer = require('nodemailer');
const otps = {}; // Temporary in-memory OTP storage

function generateOtp() {
   return crypto.randomBytes(3).toString('hex');
}

function storeOtp(username, otp) {
   otps[username] = otp;
}

function validateOtp(username, otp) {
   if (otps[username] && otps[username] === otp) {
      delete otps[username];
      return true;
   }
   return false;
}

function sendOtpToEmail(email, otp) {
   const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
         user: process.env.EMAIL_USER,
         pass: process.env.EMAIL_PASSWORD,
      },
   });

   const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP',
      text: `Your OTP is: ${otp}.`,
   };

   transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
         console.error('Error sending OTP email:', error);
      } else {
         console.log('OTP email sent');
      }
   });
}

module.exports = {
   generateOtp,
   storeOtp,
   validateOtp,
   sendOtpToEmail,
};