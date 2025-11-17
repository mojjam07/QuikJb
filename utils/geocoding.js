import * as Location from 'expo-location';

/**
 * Reverse geocodes a location with a timeout to prevent hanging on slow devices.
 * @param {Object} location - The location object with latitude and longitude.
 * @param {number} timeoutMs - Timeout in milliseconds (default 3000ms).
 * @returns {Promise<Array>} - The geocoded result or throws on timeout/error.
 */
export const reverseGeocodeWithTimeout = async (location, timeoutMs = 3000) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Geocoding timeout')), timeoutMs);
  });

  const geocodePromise = Location.reverseGeocodeAsync(location);

  return Promise.race([geocodePromise, timeoutPromise]);
};
