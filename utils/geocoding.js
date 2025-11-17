import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';

/**
 * Opens the device settings for location services
 */
export const openLocationSettings = async () => {
  try {
    if (Platform.OS === 'ios') {
      // iOS: Open general settings
      await Linking.openURL('app-settings:');
    } else {
      // Android: Open location settings
      await Linking.openSettings();
    }
  } catch (error) {
    console.warn('Unable to open settings:', error);
  }
};

/**
 * Gets the current position with improved error handling and options.
 * @param {Object} options - Location options (accuracy, timeout, etc.)
 * @returns {Promise<Object>} - Location coordinates
 */
export const getCurrentPositionAsync = async (options = {}) => {
  const defaultOptions = {
    accuracy: Location.Accuracy.High,
    timeout: 15000, // 15 seconds timeout
    maximumAge: 10000, // Accept locations up to 10 seconds old
    ...options,
  };

  try {
    // First check if location services are enabled
    const enabled = await Location.hasServicesEnabledAsync();
    if (!enabled) {
      const error = new Error('LOCATION_SERVICES_DISABLED');
      error.userMessage = 'Location services are disabled. Please enable location services in your device settings.';
      error.canOpenSettings = true;
      throw error;
    }

    // Request permissions if not already granted
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      const error = new Error('LOCATION_PERMISSION_DENIED');
      error.userMessage = 'Location permission denied. Please grant location permission to use this feature.';
      error.canOpenSettings = true;
      throw error;
    }

    // Get current position with options
    const location = await Location.getCurrentPositionAsync(defaultOptions);
    return location;
  } catch (error) {
    // Provide more specific error messages
    if (error.message === 'LOCATION_SERVICES_DISABLED' || error.message.includes('services')) {
      const customError = new Error('LOCATION_SERVICES_DISABLED');
      customError.userMessage = 'Location services are disabled. Please enable location services in your device settings.';
      customError.canOpenSettings = true;
      throw customError;
    } else if (error.message === 'LOCATION_PERMISSION_DENIED' || error.message.includes('permission')) {
      const customError = new Error('LOCATION_PERMISSION_DENIED');
      customError.userMessage = 'Location permission is required. Please enable location services and grant permission.';
      customError.canOpenSettings = true;
      throw customError;
    } else if (error.message.includes('timeout')) {
      throw new Error('Location request timed out. Please check your internet connection and try again.');
    } else {
      throw new Error(`Unable to get current location: ${error.message}`);
    }
  }
};

/**
 * Reverse geocodes a location with a timeout to prevent hanging on slow devices.
 * @param {Object} location - The location object with latitude and longitude.
 * @param {number} timeoutMs - Timeout in milliseconds (default 5000ms).
 * @returns {Promise<Array>} - The geocoded result or throws on timeout/error.
 */
export const reverseGeocodeWithTimeout = async (location, timeoutMs = 5000) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Geocoding request timed out. Please check your internet connection.')), timeoutMs);
  });

  const geocodePromise = Location.reverseGeocodeAsync(location);

  try {
    return await Promise.race([geocodePromise, timeoutPromise]);
  } catch (error) {
    if (error.message.includes('timeout')) {
      throw new Error('Geocoding request timed out. Please try again.');
    }
    throw error;
  }
};
