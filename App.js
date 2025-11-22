import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, ActivityIndicator } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { Image, View, StyleSheet } from 'react-native';
import { db, auth } from './firebaseConfig'; // Initialize Firebase

import LoginScreen from './screens/Login';
import SignupScreen from './screens/Signup';
import DashboardScreen from './screens/Dashboard';
import JobListScreen from './screens/JobList';
import PostJobScreen from './screens/PostJob';
import JobDetailsScreen from './screens/JobDetails';
import SearchScreen from './screens/Search';
import TestimonialScreen from './screens/Testimonial';
import AllTestimonialsScreen from './screens/AllTestimonials';

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    // Show loading spinner while checking auth state
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  // Extract headerRight component to avoid repetition
  const HeaderRightLogo = () => (
    <View style={{ marginRight: 10 }}>
      <Image source={require('./assets/logo1.png')} style={{ width: 50, height: 50 }} />
    </View>
  );

  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={user ? 'Home' : 'Login'}>
          {!user ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
            </>
          ) : (
            <>
              <Stack.Screen name="Home" component={DashboardScreen} options={{ title: 'Home', headerRight: () => <HeaderRightLogo /> }} />
              <Stack.Screen name="JobList" component={JobListScreen} options={{ title: 'Nearby Jobs', headerRight: () => <HeaderRightLogo /> }} />
              <Stack.Screen name="PostJob" component={PostJobScreen} options={{ title: 'Post a Job', headerRight: () => <HeaderRightLogo /> }} />
              <Stack.Screen name="JobDetails" component={JobDetailsScreen} options={{ title: 'Job Details', headerRight: () => <HeaderRightLogo /> }} />
              <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Search Jobs', headerRight: () => <HeaderRightLogo /> }} />
              <Stack.Screen name="Testimonial" component={TestimonialScreen} options={{ title: 'Leave Testimonial', headerRight: () => <HeaderRightLogo /> }} />
              <Stack.Screen name="AllTestimonials" component={AllTestimonialsScreen} options={{ title: 'All Testimonials', headerRight: () => <HeaderRightLogo /> }} />
            </>
          )}
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
