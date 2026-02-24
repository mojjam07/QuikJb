import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Linking, Alert, FlatList, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button, FAB, Chip } from 'react-native-paper';
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { decryptContact } from '../utils/encryption';
import { sendJobNotification, NotificationTypes } from '../utils/notifications';

const JobDetailsScreen = ({ route, navigation }) => {
  const { width, height } = useWindowDimensions();
  const isTablet = width > 768;
  const { job } = route.params;
  const [currentJob, setCurrentJob] = useState(job);
  const [decryptedContact, setDecryptedContact] = useState('');
  const [hasApplied, setHasApplied] = useState(false);
  const [approvedSeekers, setApprovedSeekers] = useState([]);

  // Decrypt contact when job is loaded
  useEffect(() => {
    if (job && job.contact) {
      const contact = decryptContact(job.contact);
      setDecryptedContact(contact);
    }
    // Check if user has already applied
    if (job && job.applicants) {
      setHasApplied(job.applicants.includes(auth.currentUser.uid));
    }
    // Check approved seekers
    if (job && job.approvedSeekers) {
      setApprovedSeekers(job.approvedSeekers);
    }
  }, [job]);

  // Listen for real-time updates
  useEffect(() => {
    const jobRef = doc(db, 'jobs', job.id);
    const unsubscribe = onSnapshot(jobRef, (doc) => {
      if (doc.exists()) {
        setCurrentJob({ id: doc.id, ...doc.data() });
      }
    });
    return () => unsubscribe();
  }, [job.id]);

  const handleApply = async () => {
    if (currentJob.status !== 'available') {
      Alert.alert('Job not available');
      return;
    }
    if (auth.currentUser.uid === currentJob.postedBy) {
      Alert.alert('Cannot apply', 'You cannot apply for your own job');
      return;
    }
    
    try {
      const jobRef = doc(db, 'jobs', currentJob.id);
      await updateDoc(jobRef, {
        applicants: arrayUnion(auth.currentUser.uid),
      });
      setHasApplied(true);
      
      // Send notification to job poster
      sendJobNotification(currentJob.postedBy, NotificationTypes.NEW_APPLICATION, {
        jobId: currentJob.id,
        jobTitle: currentJob.title,
      });
      
      Alert.alert('Success', 'Your application has been submitted!');
    } catch (error) {
      Alert.alert('Error', 'Failed to apply for job.');
    }
  };

  const handleWithdrawApplication = async () => {
    Alert.alert(
      'Withdraw Application',
      'Are you sure you want to withdraw your application?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              const jobRef = doc(db, 'jobs', currentJob.id);
              await updateDoc(jobRef, {
                applicants: arrayRemove(auth.currentUser.uid),
              });
              setHasApplied(false);
              Alert.alert('Success', 'Application withdrawn.');
            } catch (error) {
              Alert.alert('Error', 'Failed to withdraw application.');
            }
          },
        },
      ]
    );
  };

  const handleApproveApplicant = async (applicantId) => {
    try {
      const jobRef = doc(db, 'jobs', currentJob.id);
      const approvedSeekers = currentJob.approvedSeekers || [];
      
      if (approvedSeekers.includes(applicantId)) {
        Alert.alert('Already approved', 'This applicant has already been approved.');
        return;
      }
      
      await updateDoc(jobRef, {
        approvedSeekers: arrayUnion(applicantId),
      });
      
      // Send notification to the approved applicant
      sendJobNotification(applicantId, NotificationTypes.APPLICATION_APPROVED, {
        jobId: currentJob.id,
        jobTitle: currentJob.title,
      });
      
      Alert.alert('Success', 'Applicant approved! They can now accept the job.');
    } catch (error) {
      console.error('Error approving applicant:', error);
      Alert.alert('Error', 'Failed to approve applicant.');
    }
  };

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
      
      // Send notification to job poster
      sendJobNotification(currentJob.postedBy, NotificationTypes.JOB_TAKEN, {
        jobId: currentJob.id,
        jobTitle: currentJob.title,
      });
      
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
              
              // Send notification to job poster
              sendJobNotification(currentJob.postedBy, NotificationTypes.JOB_COMPLETED, {
                jobId: currentJob.id,
                jobTitle: currentJob.title,
              });
              
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

  // Dynamic styles based on screen size
  const buttonContainerStyle = {
    flexDirection: isTablet ? 'row' : 'column',
    justifyContent: 'space-between',
    marginTop: 10,
    flexWrap: isTablet ? 'nowrap' : 'wrap',
  };

  const buttonStyle = {
    marginTop: 10,
    flex: isTablet ? 1 : undefined,
    marginHorizontal: isTablet ? 5 : 0,
    minWidth: isTablet ? 120 : '100%',
  };

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
            {currentJob.status === 'available' && decryptedContact && (
              <Paragraph>Contact: {decryptedContact}</Paragraph>
            )}
            {currentJob.status === 'available' && auth.currentUser.uid !== currentJob.postedBy && (
              <View style={buttonContainerStyle}>
                <Button mode="outlined" onPress={handleChat} style={buttonStyle}>
                  Chat with Job Poster
                </Button>
                {hasApplied ? (
                  <Button
                    mode="contained"
                    onPress={handleWithdrawApplication}
                    style={buttonStyle}
                    buttonColor="#f44336"
                  >
                    Withdraw Application
                  </Button>
                ) : (
                  <Button
                    mode="contained"
                    onPress={handleApply}
                    style={buttonStyle}
                  >
                    Apply for Job
                  </Button>
                )}
              </View>
            )}
            {/* Show applicants count for job poster */}
            {currentJob.status === 'available' && auth.currentUser.uid === currentJob.postedBy && currentJob.applicants && currentJob.applicants.length > 0 && (
              <View style={buttonContainerStyle}>
                <Chip style={styles.applicantChip}>
                  {currentJob.applicants.length} Applicant{currentJob.applicants.length !== 1 ? 's' : ''}
                </Chip>
                <Button
                  mode="contained"
                  onPress={() => {
                    // Show a dialog to select which applicant to approve
                    Alert.alert(
                      'Approve Applicant',
                      'Select an applicant to approve:',
                      currentJob.applicants.map((applicantId) => ({
                        text: `Applicant ${applicantId.slice(0, 8)}...`,
                        onPress: () => handleApproveApplicant(applicantId),
                      })).concat({ text: 'Cancel', style: 'cancel' })
                    );
                  }}
                  style={buttonStyle}
                >
                  Approve Applicant
                </Button>
              </View>
            )}
            {/* Show approved seeker status for applicants */}
            {currentJob.status === 'available' && hasApplied && currentJob.approvedSeekers && currentJob.approvedSeekers.includes(auth.currentUser.uid) && (
              <View style={buttonContainerStyle}>
                <Button
                  mode="contained"
                  onPress={handleTakeJob}
                  style={buttonStyle}
                >
                  Accept Job
                </Button>
              </View>
            )}
            {currentJob.status === 'taken' && currentJob.assignedUser === auth.currentUser.uid && (
              <View style={buttonContainerStyle}>
                <Button mode="contained" disabled style={[buttonStyle, { opacity: 0.6 }]}>
                  Job Taken
                </Button>
                <Button mode="outlined" onPress={handleChat} style={buttonStyle}>
                  Chat with Job Poster
                </Button>
                <Button mode="contained" onPress={handleMarkCompleted} style={buttonStyle}>
                  Mark as Completed
                </Button>
              </View>
            )}
            {currentJob.status === 'taken' && currentJob.postedBy === auth.currentUser.uid && (
              <Button mode="outlined" onPress={handleChat} style={buttonStyle}>
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
  testimonialsContainer: {
    margin: 20,
    marginBottom: 40, // Add bottom margin for nav/tab bar
  },
  testimonialCard: {
    marginVertical: 5,
  },
  applicantChip: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
});

export default JobDetailsScreen;
