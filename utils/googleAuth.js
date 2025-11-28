import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import Constants from 'expo-constants';

// Allow WebBrowser to handle auth redirects
WebBrowser.maybeCompleteAuthSession();

// Firebase auth instance
const auth = getAuth();

export const useGoogleSignIn = () => {
  // Configure Google Auth request with client ID from app config or Expo constants
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: Constants.expoConfig?.extra?.googleClientId || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: Constants.expoConfig?.extra?.googleIosClientId || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: Constants.expoConfig?.extra?.googleAndroidClientId || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    expoClientId: Constants.expoConfig?.extra?.googleExpoClientId || process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
  });

  // Function to handle response and sign in with Firebase Credential
  const signInWithGoogle = async () => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      try {
        const userCredential = await signInWithCredential(auth, credential);
        return { user: userCredential.user, error: null };
      } catch (error) {
        return { user: null, error };
      }
    }
    return { user: null, error: new Error('Google Sign-in cancelled or failed') };
  };

  return {
    request,
    response,
    promptAsync,
    signInWithGoogle,
  };
};
