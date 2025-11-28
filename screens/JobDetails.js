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

  const handleChat = () => {
    // Determine the other user for chat
    let otherUserId, otherUserEmail;
    if (auth.currentUser.uid === currentJob.postedBy) {
      // Current user is job poster
      if (currentJob.status === 'taken') {
        // Chat with assigned user
        otherUserId = currentJob.assignedUser;
        otherUserEmail = 'Job Taker';
      } else {
        // Chat with potential taker (if any)
        otherUserId = currentJob.assignedUser || 'potential_taker';
        otherUserEmail = 'Job Seeker';
      }
    } else {
      // Current user is job seeker/taker, chat with poster
      otherUserId = currentJob.postedBy;
      otherUserEmail = 'Job Poster';
    }

    navigation.navigate('Chat', {
      jobId: currentJob.id,
      jobTitle: currentJob.title,
      otherUserId: otherUserId,
      otherUserEmail: otherUserEmail,
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
              <View style={styles.buttonContainer}>
                <Button mode="outlined" onPress={handleChat} style={styles.button}>
                  Chat with Job Poster
                </Button>
                <Button
                  mode="contained"
                  onPress={handleTakeJob}
                  style={styles.button}
                  disabled={!(currentJob.approvedSeekers && currentJob.approvedSeekers.includes(auth.currentUser.uid))}
                >
                  {currentJob.approvedSeekers && currentJob.approvedSeekers.includes(auth.currentUser.uid) ? 'Take Job' : 'Waiting for Approval'}
                </Button>
              </View>
            )}
            {currentJob.status === 'taken' && currentJob.assignedUser === auth.currentUser.uid && (
              <View style={styles.buttonContainer}>
                <Button mode="contained" disabled style={styles.disabledButton}>
                  Job Taken
                </Button>
                <Button mode="outlined" onPress={handleChat} style={styles.button}>
                  Chat with Job Poster
                </Button>
                <Button mode="contained" onPress={handleMarkCompleted} style={styles.button}>
                  Mark as Completed
                </Button>
              </View>
            )}
            {currentJob.status === 'taken' && currentJob.postedBy === auth.currentUser.uid && (
              <Button mode="outlined" onPress={handleChat} style={styles.button}>
                Chat with Job Taker
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
