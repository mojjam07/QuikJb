
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Image, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Title, Card, Paragraph } from 'react-native-paper';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { validateSignup } from '../utils/validation';
import { useGoogleSignIn } from '../utils/googleAuth';

const SignupScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
          Alert.alert('Google Sign-up Failed', error.message);
        }
      }
    };
    handleGoogleResponse();
  }, [response]);

  const handleSignup = async () => {
    const errors = validateSignup(email, password, confirmPassword);
    if (Object.keys(errors).length > 0) {
      const errorMessage = Object.values(errors).join('\n');
      Alert.alert('Validation Error', errorMessage);
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Send email verification
      await sendEmailVerification(userCredential.user);
      Alert.alert(
        'Account Created',
        'Please check your email and verify your account before logging in.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      Alert.alert('Signup Failed', error.message);
    } finally {
      setLoading(false);
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
          <Paragraph style={[styles.subtitle, isTablet && styles.subtitleTablet]}>Register With a Valid Data to Have Access</Paragraph>
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
            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              right={<TextInput.Icon icon={showConfirmPassword ? "eye-off" : "eye"} onPress={() => setShowConfirmPassword(!showConfirmPassword)} />}
              style={styles.input}
            />
            <Button mode="contained" onPress={handleSignup} loading={loading} style={styles.button}>
              Sign Up
            </Button>
            <Button onPress={() => navigation.navigate('Login')} style={styles.link}>
              Already have an account? Login
            </Button>
            <Button
              mode="outlined"
              onPress={() => promptAsync()}
              loading={googleLoading}
              disabled={!request}
              style={styles.googleButton}
            >
              Sign up with Google
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
    marginBottom: 2,
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

export default SignupScreen;
