import React, { useState } from 'react';
import { View, StyleSheet, Linking, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button, FAB } from 'react-native-paper';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

const JobDetailsScreen = ({ route, navigation }) => {
  const { job } = route.params;
  const [currentJob, setCurrentJob] = useState(job);

  const handleCall = () => {
    Linking.openURL(`tel:${currentJob.contact}`).catch(() => {
      Alert.alert('Error', 'Unable to make a call. Please check your device settings.');
    });
  };

  const handleTakeJob = async () => {
    if (currentJob.status !== 'available') {
      Alert.alert('Job not available');
      return;
    }
    try {
      const jobRef = doc(db, 'jobs', currentJob.id);
      await updateDoc(jobRef, {
        status: 'taken',
        assignedUser: auth.currentUser.uid,
      });
      setCurrentJob({ ...currentJob, status: 'taken', assignedUser: auth.currentUser.uid });
      Alert.alert('Success', 'Job taken successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to take job.');
    }
  };

  const handleMarkCompleted = async () => {
    if (currentJob.assignedUser !== auth.currentUser.uid) {
      Alert.alert('Not authorized');
      return;
    }
    try {
      const jobRef = doc(db, 'jobs', currentJob.id);
      await updateDoc(jobRef, {
        status: 'completed',
      });
      setCurrentJob({ ...currentJob, status: 'completed' });
      Alert.alert('Success', 'Job marked as completed!');
      navigation.navigate('Testimonial', { jobId: currentJob.id });
    } catch (error) {
      Alert.alert('Error', 'Failed to mark job as completed.');
    }
  };

  const renderTestimonial = ({ item }) => (
    <Card style={styles.testimonialCard}>
      <Card.Content>
        <Paragraph>Rating: {item.rating}/5</Paragraph>
        <Paragraph>{item.comment}</Paragraph>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>{currentJob.title}</Title>
            <Paragraph>{currentJob.description}</Paragraph>
            <Paragraph>Job Type: {currentJob.jobType}</Paragraph>
            <Paragraph>Pay: ${currentJob.pay} {currentJob.payFrequency ? `per ${currentJob.payFrequency}` : ''}</Paragraph>
            <Paragraph>Location: {currentJob.address || `${currentJob.location.lat.toFixed(4)}, ${currentJob.location.lng.toFixed(4)}`}</Paragraph>
            <Paragraph>Status: {currentJob.status}</Paragraph>
            {currentJob.status !== 'completed' && (
              <Paragraph>Contact: {currentJob.contact}</Paragraph>
            )}
            {currentJob.status === 'available' && (
              <Button mode="contained" onPress={handleTakeJob} style={styles.button}>
                Take Job
              </Button>
            )}
            {currentJob.status === 'taken' && currentJob.assignedUser === auth.currentUser.uid && (
              <Button mode="contained" onPress={handleMarkCompleted} style={styles.button}>
                Mark as Completed
              </Button>
            )}
            {currentJob.status !== 'completed' && (
              <Button mode="outlined" onPress={handleCall} style={styles.button}>
                Call Now
              </Button>
            )}
          </Card.Content>
        </Card>
        {currentJob.testimonials && currentJob.testimonials.length > 0 && (
          <View style={styles.testimonialsContainer}>
            <Title>Testimonials</Title>
            <FlatList
              data={currentJob.testimonials}
              renderItem={renderTestimonial}
              keyExtractor={(item, index) => index.toString()}
            />
          </View>
        )}
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
  },
  card: {
    margin: 20,
    elevation: 4,
  },
  button: {
    marginTop: 10,
  },
  testimonialsContainer: {
    margin: 20,
    marginBottom: 40, // Add bottom margin for nav/tab bar
  },
  testimonialCard: {
    marginVertical: 5,
  },
});

export default JobDetailsScreen;
