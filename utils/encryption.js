// import 'react-native-get-random-values';
// import { getRandomValues } from 'react-native-get-random-values';
import CryptoJS from 'crypto-js';

// Encryption key - In production, this should be stored securely (e.g., environment variable)
const ENCRYPTION_KEY = process.env.EXPO_PUBLIC_ENCRYPTION_KEY || 'default-key-change-in-production';

/**
 * Generates a secure random key for encryption
 * @returns {string} - A secure random key
 */
const generateSecureKey = () => {
  const randomBytes = new Uint8Array(32);
  getRandomValues(randomBytes);
  return CryptoJS.lib.WordArray.create(randomBytes);
};

/**
 * Encrypts sensitive data using AES encryption
 * @param {string} data - The data to encrypt
 * @returns {string} - The encrypted data as a string
 */
export const encryptData = (data) => {
  if (!data || typeof data !== 'string') {
    return data;
  }
  try {
    // Generate salt for key derivation
    const salt = generateSecureKey();
    // Derive key from password and salt
    const key = CryptoJS.PBKDF2(ENCRYPTION_KEY, salt, {
      keySize: 256/32,
      iterations: 1000
    });
    const iv = generateSecureKey();

    const encrypted = CryptoJS.AES.encrypt(data, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    // Combine salt, IV and encrypted data
    return salt.toString() + ':' + iv.toString() + ':' + encrypted.toString();
  } catch (error) {
    console.error('Encryption error:', error);
    // Fallback to simple encryption without IV for compatibility
    try {
      return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
    } catch (fallbackError) {
      console.error('Fallback encryption also failed:', fallbackError);
      return data; // Ultimate fallback to unencrypted data
    }
  }
};

/**
 * Decrypts sensitive data using AES decryption
 * @param {string} data - The data to decrypt
 * @returns {string} - The decrypted data as a string
 */
export const decryptData = (data) => {
  if (!data || typeof data !== 'string') {
    return data;
  }
  try {
    // Check if data contains salt, IV (new format: salt:iv:encrypted)
    if (data.includes(':')) {
      const parts = data.split(':');
      if (parts.length === 3) {
        // New format with salt and IV
        const [saltString, ivString, encryptedData] = parts;
        const salt = CryptoJS.enc.Hex.parse(saltString);
        const iv = CryptoJS.enc.Hex.parse(ivString);
        const key = CryptoJS.PBKDF2(ENCRYPTION_KEY, salt, {
          keySize: 256/32,
          iterations: 1000
        });

        const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        });

        return decrypted.toString(CryptoJS.enc.Utf8);
      } else if (parts.length === 2) {
        // Legacy format with IV but no salt
        const [ivString, encryptedData] = parts;
        const iv = CryptoJS.enc.Hex.parse(ivString);
        const key = CryptoJS.PBKDF2(ENCRYPTION_KEY, CryptoJS.lib.WordArray.random(128/8), {
          keySize: 256/32,
          iterations: 1000
        });

        const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        });

        return decrypted.toString(CryptoJS.enc.Utf8);
      }
    }
    // Legacy format without IV or salt
    const bytes = CryptoJS.AES.decrypt(data, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return data; // Fallback to original data
  }
};

/**
 * Encrypts contact information before storing in database
 * @param {string} contact - The contact information to encrypt
 * @returns {string} - The encrypted contact information
 */
export const encryptContact = (contact) => {
  if (!contact || typeof contact !== 'string') {
    return contact;
  }
  try {
    return encryptData(contact);
  } catch (error) {
    console.error('Contact encryption error:', error);
    return contact;
  }
};

/**
 * Decrypts contact information when retrieving from database
 * @param {string} contact - The contact information to decrypt
 * @returns {string} - The decrypted contact information
 */
export const decryptContact = (contact) => {
  if (!contact || typeof contact !== 'string') {
    return contact;
  }
  try {
    return decryptData(contact);
  } catch (error) {
    console.error('Contact decryption error:', error);
    return contact;
  }
};
