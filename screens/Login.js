
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Image, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Title, Card, Paragraph } from 'react-native-paper';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { validateLogin } from '../utils/validation';
import { useGoogleSignIn } from '../utils/googleAuth';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { width, height } = Dimensions.get('window');
  const isTablet = width > 768;
  const logoSize = isTablet ? Math.min(width * 0.4, height * 0.2) : Math.min(width * 0.4, height * 0.2);

  const { request, response, promptAsync, signInWithGoogle } = useGoogleSignIn();
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (response?.type === 'success') {
        setGoogleLoading(true);
        const { user, error } = await signInWithGoogle();
        setGoogleLoading(false);
        if (error) {
          Alert.alert('Google Sign-in Failed', error.message);
        }
      }
    };
    handleGoogleResponse();
  }, [response]);

  const handleLogin = async () => {
    const errors = validateLogin(email, password);
    if (Object.keys(errors).length > 0) {
      const errorMessage = Object.values(errors).join('\n');
      Alert.alert('Validation Error', errorMessage);
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address first.');
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Success', 'Password reset email sent. Check your inbox.');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <View style={styles.content}>
        <View style={styles.brandingContainer}>
          <Image source={require('../assets/logo1.png')} style={[styles.logo, { width: logoSize, height: logoSize }]} />
          <Paragraph style={[styles.subtitle, isTablet && styles.subtitleTablet]}>Enter Your Registered Data to Continue Using</Paragraph>
        </View>
        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
              style={styles.input}
            />
            <Button mode="contained" onPress={handleLogin} loading={loading} style={styles.button}>
              Login
            </Button>
            <Button onPress={handlePasswordReset} loading={resetLoading} style={styles.link}>
              Forgot Password?
            </Button>
            <Button onPress={() => navigation.navigate('Signup')} style={styles.link}>
              Don't have an account? Sign Up
            </Button>
            <Button
              mode="outlined"
              onPress={() => promptAsync()}
              loading={googleLoading}
              disabled={!request}
              style={styles.googleButton}
            >
              Sign in with Google
            </Button>
          </Card.Content>
        </Card>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  subtitleTablet: {
    fontSize: 18,
  },
  card: {
    elevation: 4,
  },
  input: {
    marginBottom: 10,
  },
  button: {
    marginTop: 10,
  },
  link: {
    marginTop: 10,
  },
  googleButton: {
    marginTop: 20,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
});

export default LoginScreen;
