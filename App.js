import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './firebaseConfig'; // Initialize Firebase

import LoginScreen from './screens/Login';
import SignupScreen from './screens/Signup';
import DashboardScreen from './screens/Dashboard';
import JobListScreen from './screens/JobList';
import PostJobScreen from './screens/PostJob';
import JobDetailsScreen from './screens/JobDetails';
import SearchScreen from './screens/Search';
import TestimonialScreen from './screens/Testimonial';

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
    return null; // Or a loading screen
  }

  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={user ? 'Dashboard' : 'Login'}>
          {!user ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
            </>
          ) : (
            <>
              <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
              <Stack.Screen name="JobList" component={JobListScreen} options={{ title: 'Nearby Jobs' }} />
              <Stack.Screen name="PostJob" component={PostJobScreen} options={{ title: 'Post a Job' }} />
              <Stack.Screen name="JobDetails" component={JobDetailsScreen} options={{ title: 'Job Details' }} />
              <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Search Jobs' }} />
              <Stack.Screen name="Testimonial" component={TestimonialScreen} options={{ title: 'Leave Testimonial' }} />
            </>
          )}
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </PaperProvider>
  );
}
