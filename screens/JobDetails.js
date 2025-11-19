import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Linking, Alert, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button, FAB } from 'react-native-paper';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { decryptContact } from '../utils/encryption';

const JobDetailsScreen = ({ route, navigation }) => {
  const { job } = route.params;
  const [currentJob, setCurrentJob] = useState(job);

  const handleCall = () => {
    if (!currentJob.contact) {
      Alert.alert('Error', 'Contact information not available.');
      return;
    }
    try {
      const decrypted = decryptContact(currentJob.contact);
      Linking.openURL(`tel:${decrypted}`).catch(() => {
        Alert.alert('Error', 'Unable to make a call. Please check your device settings.');
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to decrypt contact information.');
    }
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
    Alert.alert(
      'Confirm Completion',
      'Are you sure you want to mark this job as completed?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Mark Completed',
          onPress: async () => {
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
          },
        },
      ],
      { cancelable: false }
    );
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
            {/* {currentJob.status === 'available' && (
              <Paragraph>Contact: {currentJob.contact}</Paragraph>
            )} */}
            {currentJob.status === 'available' && auth.currentUser.uid !== currentJob.postedBy && (
              <Button mode="outlined" onPress={handleCall} style={styles.button}>
                Call Now Before Taking The Job
              </Button>
            )}
            {currentJob.status === 'available' && auth.currentUser.uid !== currentJob.postedBy && (
              <Button mode="contained" onPress={handleTakeJob} style={styles.button}>
                Take Job
              </Button>
            )}
            {currentJob.status === 'taken' && currentJob.assignedUser === auth.currentUser.uid && (
              <View style={styles.buttonContainer}>
                <Button mode="contained" disabled style={styles.disabledButton}>
                  Job Taken
                </Button>
                <Button mode="contained" onPress={handleMarkCompleted} style={styles.button}>
                  Mark as Completed
                </Button>
              </View>
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  disabledButton: {
    marginTop: 10,
    flex: 1,
    marginRight: 5,
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
