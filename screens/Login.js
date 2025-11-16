import React, { useState } from 'react';
import { View, StyleSheet, Alert, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Title, Card, Paragraph } from 'react-native-paper';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { validateLogin } from '../utils/validation';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const { width, height } = Dimensions.get('window');
  const isTablet = width > 768;
  const logoSize = isTablet ? Math.min(width * 0.4, height * 0.2) : Math.min(width * 0.4, height * 0.2);

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
      <View style={styles.content}>
        <View style={styles.brandingContainer}>
          <Image source={require('../assets/logo1.png')} style={[styles.logo, { width: logoSize, height: logoSize }]} />
          {/* <Title style={[styles.brandName, isTablet && styles.brandNameTablet]}>Quick-Job</Title> */}
          <Paragraph style={[styles.subtitle, isTablet && styles.subtitleTablet]}>Enter Your Registered Data to Continue Using</Paragraph>
        </View>
        <Card style={styles.card}>
          <Card.Content>
            {/* <Title style={styles.title}>Login</Title> */}
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
              secureTextEntry
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
          </Card.Content>
        </Card>
      </View>
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
  brandName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  brandNameTablet: {
    fontSize: 32,
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
  title: {
    textAlign: 'center',
    marginBottom: 20,
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
});

export default LoginScreen;
