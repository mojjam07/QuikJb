import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Card, Title, RadioButton, ActivityIndicator, Snackbar, Text } from 'react-native-paper';
import * as Location from 'expo-location';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { validateJobPost } from '../utils/validation';
import { encryptContact } from '../utils/encryption';

const PostJobScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [jobType, setJobType] = useState('');
  const [pay, setPay] = useState('');
  const [payFrequency, setPayFrequency] = useState('daily');
  const [contact, setContact] = useState('');
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [postingLoading, setPostingLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryFunction, setRetryFunction] = useState(null);
  const { width } = Dimensions.get('window');
  const isTablet = width > 768;

  const getLocation = async () => {
    setLocationLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission is required to post a job. Please enable location services.');
        setRetryFunction(() => getLocation);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location.coords);
      setError(null);
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Failed to get your location. Please check your internet connection and try again.');
      setRetryFunction(() => getLocation);
    } finally {
      setLocationLoading(false);
    }
  };

  const handlePostJob = async () => {
    if (!auth.currentUser) {
      setError('You must be logged in to post a job.');
      return;
    }

    const errors = validateJobPost(title, description, jobType, pay, contact);
    if (Object.keys(errors).length > 0) {
      const errorMessage = Object.values(errors).join('\n');
      setError(errorMessage);
      return;
    }

    if (!location) {
      setError('Please get your current location before posting the job.');
      setRetryFunction(() => getLocation);
      return;
    }

    setPostingLoading(true);
    try {
      // Encrypt sensitive contact information
      const encryptedContact = encryptContact(contact);

      await addDoc(collection(db, 'jobs'), {
        title,
        description,
        jobType,
        pay: parseFloat(pay),
        payFrequency,
        contact: encryptedContact, // Store encrypted contact
        location: {
          lat: location.latitude,
          lng: location.longitude,
        },
        status: 'available',
        postedBy: auth.currentUser.uid,
        createdAt: new Date(),
      });
      Alert.alert('Success', 'Job posted successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error posting job:', error);
      setError('Failed to post job. Please check your internet connection and try again.');
      setRetryFunction(() => handlePostJob);
    } finally {
      setPostingLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={[styles.card, isTablet && styles.cardTablet]}>
          <Card.Content>
            <Title accessibilityLabel="Post a new job form">Post a New Job</Title>
            <TextInput
              label="Job Title"
              value={title}
              onChangeText={setTitle}
              style={[styles.input, isTablet && styles.inputTablet]}
              accessibilityLabel="Enter job title"
              accessibilityHint="Type the title of the job you want to post"
            />
            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={[styles.input, isTablet && styles.inputTablet]}
              accessibilityLabel="Enter job description"
              accessibilityHint="Describe the job requirements and details"
            />
            <TextInput
              label="Job Type (e.g., Cleaner, Babysitter)"
              value={jobType}
              onChangeText={setJobType}
              style={[styles.input, isTablet && styles.inputTablet]}
              accessibilityLabel="Enter job type"
              accessibilityHint="Specify the type of job, like cleaner or babysitter"
            />
            <TextInput
              label="Pay ($)"
              value={pay}
              onChangeText={setPay}
              keyboardType="numeric"
              style={[styles.input, isTablet && styles.inputTablet]}
              accessibilityLabel="Enter pay amount"
              accessibilityHint="Enter the amount you will pay for this job"
            />
            <View style={styles.radioGroup}>
              <Title style={styles.radioTitle} accessibilityLabel="Select pay frequency">Pay Frequency</Title>
              <RadioButton.Group onValueChange={setPayFrequency} value={payFrequency}>
                <View style={styles.radioOption}>
                  <RadioButton value="daily" accessibilityLabel="Daily pay frequency" />
                  <Title style={styles.radioLabel}>Daily</Title>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="weekly" accessibilityLabel="Weekly pay frequency" />
                  <Title style={styles.radioLabel}>Weekly</Title>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="monthly" accessibilityLabel="Monthly pay frequency" />
                  <Title style={styles.radioLabel}>Monthly</Title>
                </View>
              </RadioButton.Group>
            </View>
            <TextInput
              label="Contact Phone Number"
              value={contact}
              onChangeText={setContact}
              keyboardType="phone-pad"
              style={[styles.input, isTablet && styles.inputTablet]}
              accessibilityLabel="Enter contact phone number"
              accessibilityHint="Provide your phone number for job applicants to contact you"
            />
            {!location && (
              <Button
                mode="contained"
                onPress={getLocation}
                style={styles.button}
                loading={locationLoading}
                disabled={locationLoading}
                accessibilityLabel={locationLoading ? "Getting location" : "Get current location"}
                accessibilityHint="Fetch your current location to include with the job posting"
              >
                {locationLoading ? 'Getting Location...' : 'Get Current Location'}
              </Button>
            )}
            {location && (
              <View>
                <Title style={styles.locationTitle}>Current Location:</Title>
                <Text style={styles.locationText}>
                  Latitude: {location.latitude.toFixed(6)}, Longitude: {location.longitude.toFixed(6)}
                </Text>
                <Button
                  mode="contained"
                  onPress={handlePostJob}
                  style={styles.button}
                  loading={postingLoading}
                  disabled={postingLoading}
                  accessibilityLabel={postingLoading ? "Posting job" : "Post job"}
                  accessibilityHint="Submit the job posting to make it available to workers"
                >
                  {postingLoading ? 'Posting Job...' : 'Post Job'}
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        action={{
          label: 'Retry',
          onPress: () => {
            setError(null);
            if (retryFunction) retryFunction();
          },
        }}
        accessibilityLabel={`Error: ${error}`}
      >
        {error}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40, // Add bottom margin for nav/tab bar
  },
  card: {
    margin: 10,
    elevation: 4,
  },
  cardTablet: {
    marginHorizontal: 20,
    maxWidth: 600,
    alignSelf: 'center',
  },
  input: {
    marginBottom: 10,
  },
  inputTablet: {
    maxWidth: 600,
    alignSelf: 'center',
  },
  button: {
    marginTop: 10,
  },
  radioGroup: {
    marginBottom: 10,
  },
  radioTitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  radioLabel: {
    fontSize: 14,
    marginLeft: 8,
  },
  locationTitle: {
    fontSize: 16,
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
    color: '#4CAF50',
  },
  locationText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
    color: '#666',
  },
});

export default PostJobScreen;
