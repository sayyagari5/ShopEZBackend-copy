const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const otpService = require('../otpService');

async function register(req, res) {
   const {
      email,
      password,
      customerName,
      phoneNo,
      street,
      city,
      state,
      zipcode,
      country
   } = req.body;

   // Basic validation
   if (!email || !password || !customerName || !phoneNo || !street || !city || !state || !zipcode || !country) {
      return res.status(400).json({
         success: false,
         message: 'All required fields must be provided'
      });
   }

   // Email format validation
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   if (!emailRegex.test(email)) {
      return res.status(400).json({
         success: false,
         message: 'Invalid email format'
      });
   }

   try {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const customerId = Math.floor(Math.random() * 1000000);

      const customerData = {
         customerName,
         customerId,
         phoneNo,
         street,
         city,
         state,
         zipcode,
         country
      };

      const success = await userModel.createUser(email, hashedPassword, customerData);

      if (success) {
         res.status(201).json({ success: true, message: 'User registered successfully' });
      } else {
         res.status(500).json({ success: false, message: 'Registration failed' });
      }
   } catch (error) {
      console.error('Registration error:', error);
      // Check for duplicate email
      if (error.number === 2627) {
         res.status(409).json({ success: false, message: 'Email already exists' });
      } else {
         res.status(500).json({ success: false, message: 'Internal server error' });
      }
   }
}

async function login(req, res) {
   const { email, password } = req.body;
   console.log('Login attempt:', { email, password: '***' });

   try {
      const user = await userModel.getUserByEmail(email);
      console.log('User found:', user ? 'yes' : 'no');

      if (!user) {
         console.log('User not found');
         return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.account_password);
      console.log('Password match:', isMatch);

      if (!isMatch) {
         console.log('Password mismatch');
         return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      const otp = otpService.generateOtp();
      otpService.storeOtp(email, otp);
      otpService.sendOtpToEmail(user.email, otp);

      res.json({ success: true, message: 'Check your email for the OTP.' });

      /*const token = jwt.sign(
        { id: user.customer_id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      */
      /*res.json({
        success: true,
        token,
        user: {
          email: user.email,
        }
      });*/

   } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
   }
}

async function verifyOtp(req, res) {
   const { email, otp } = req.body;
   if (otpService.validateOtp(email, otp)) {
      const user = await userModel.getUserByEmail(email);

      const token = jwt.sign(
         { id: user.customer_id, email: user.email },
         process.env.JWT_SECRET,
         { expiresIn: '24h' }
      );
      res.json({
         success: true,
         token,
         user: {
            email: user.email,
         }
      });
   } else {
      res.status(401).json({ success: false, message: 'Invalid OTP, please try again.' });
   }
}

module.exports = { register, login, verifyOtp }; 