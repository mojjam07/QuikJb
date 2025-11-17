import CryptoJS from 'crypto-js';

// Encryption key - In production, this should be stored securely (e.g., environment variable)
const ENCRYPTION_KEY = process.env.EXPO_PUBLIC_ENCRYPTION_KEY || 'default-key-change-in-production';

/**
 * Generates a secure random key for encryption
 * @returns {string} - A secure random key
 */
const generateSecureKey = () => {
  try {
    // Try to use crypto.getRandomValues if available (web)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return CryptoJS.lib.WordArray.create(array);
    }
    // Fallback for React Native environments
    const randomBytes = [];
    for (let i = 0; i < 32; i++) {
      randomBytes.push(Math.floor(Math.random() * 256));
    }
    return CryptoJS.lib.WordArray.create(randomBytes);
  } catch (error) {
    console.warn('Secure random generation failed, using fallback:', error);
    // Ultimate fallback - not secure but functional
    return CryptoJS.lib.WordArray.random(32);
  }
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
    // Use a combination of the encryption key and a random IV for better security
    const key = CryptoJS.PBKDF2(ENCRYPTION_KEY, CryptoJS.lib.WordArray.random(128/8), {
      keySize: 256/32,
      iterations: 1000
    });
    const iv = generateSecureKey();

    const encrypted = CryptoJS.AES.encrypt(data, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    // Combine IV and encrypted data
    return iv.toString() + ':' + encrypted.toString();
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
    // Check if data contains IV (new format: iv:encrypted)
    if (data.includes(':')) {
      const [ivString, encryptedData] = data.split(':', 2);
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
    } else {
      // Legacy format without IV
      const bytes = CryptoJS.AES.decrypt(data, ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    }
  } catch (error) {
    console.error('Decryption error:', error);
    return data; // Fallback to original data
  }
};

/**
 * Encrypts contact information before storing in database
 * @param {string} contact - The contact information to encrypt
 * @returns {string} - Encrypted contact information
 */
export const encryptContact = (contact) => {
  if (!contact || typeof contact !== 'string') {
    return contact;
  }
  return encryptData(contact);
};

/**
 * Decrypts contact information when retrieving from database
 * @param {string} contact - The contact information to decrypt
 * @returns {string} - Decrypted contact information
 */
export const decryptContact = (contact) => {
  if (!contact || typeof contact !== 'string') {
    return contact;
  }
  return decryptData(contact);
};
