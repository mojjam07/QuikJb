import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Card, Title, RadioButton } from 'react-native-paper';
import * as Location from 'expo-location';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

const PostJobScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [jobType, setJobType] = useState('');
  const [pay, setPay] = useState('');
  const [payFrequency, setPayFrequency] = useState('daily');
  const [contact, setContact] = useState('');
  const [location, setLocation] = useState(null);

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is required to post a job.');
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    setLocation(location.coords);
  };

  const handlePostJob = async () => {
    if (!title || !description || !jobType || !pay || !contact || !location) {
      Alert.alert('Error', 'Please fill in all fields and get location.');
      return;
    }

    try {
      await addDoc(collection(db, 'jobs'), {
        title,
        description,
        jobType,
        pay: parseFloat(pay),
        payFrequency,
        contact,
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
      Alert.alert('Error', 'Failed to post job. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Post a New Job</Title>
            <TextInput
              label="Job Title"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />
            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              style={styles.input}
            />
            <TextInput
              label="Job Type (e.g., Cleaner, Babysitter)"
              value={jobType}
              onChangeText={setJobType}
              style={styles.input}
            />
            <TextInput
              label="Pay ($)"
              value={pay}
              onChangeText={setPay}
              keyboardType="numeric"
              style={styles.input}
            />
            <View style={styles.radioGroup}>
              <Title style={styles.radioTitle}>Pay Frequency</Title>
              <RadioButton.Group onValueChange={setPayFrequency} value={payFrequency}>
                <View style={styles.radioOption}>
                  <RadioButton value="daily" />
                  <Title style={styles.radioLabel}>Daily</Title>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="weekly" />
                  <Title style={styles.radioLabel}>Weekly</Title>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton value="monthly" />
                  <Title style={styles.radioLabel}>Monthly</Title>
                </View>
              </RadioButton.Group>
            </View>
            <TextInput
              label="Contact Phone Number"
              value={contact}
              onChangeText={setContact}
              keyboardType="phone-pad"
              style={styles.input}
            />
            <Button mode="contained" onPress={getLocation} style={styles.button}>
              Get Current Location
            </Button>
            {location && (
              <Button mode="contained" onPress={handlePostJob} style={styles.button}>
                Post Job
              </Button>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
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
  input: {
    marginBottom: 10,
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
});

export default PostJobScreen;
