const crypto = require('crypto');
require('dotenv').config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Must be 32 bytes for aes-256-gcm
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return IV, encrypted data, and auth tag as a combined string
  return iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
}

function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const authTag = Buffer.from(parts[2], 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

module.exports = { encrypt, decrypt };
