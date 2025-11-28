import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button, List, Chip, FAB, Badge } from 'react-native-paper';
import { collection, query, where, onSnapshot, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const [userJobs, setUserJobs] = useState([]);
  const [userTestimonials, setUserTestimonials] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isTablet = screenWidth > 768;

  const currentUser = auth.currentUser;

  useFocusEffect(
    React.useCallback(() => {
      if (!currentUser) {
        Alert.alert('Error', 'User not authenticated');
        navigation.goBack();
        return;
      }

      const fetchUserData = async () => {
        try {
          // Fetch user's posted jobs
          const jobsQuery = query(collection(db, 'jobs'), where('userId', '==', currentUser.uid));
          const jobsUnsubscribe = onSnapshot(jobsQuery, (querySnapshot) => {
            const jobs = [];
            querySnapshot.forEach((doc) => {
              jobs.push({ id: doc.id, ...doc.data() });
            });
            setUserJobs(jobs);
          });

          // Fetch user's testimonials (from jobs where user has left testimonials)
          const allJobsQuery = collection(db, 'jobs');
          const allJobsUnsubscribe = onSnapshot(allJobsQuery, (querySnapshot) => {
            const testimonials = [];
            querySnapshot.forEach((doc) => {
              const job = doc.data();
              if (job.testimonials) {
                job.testimonials.forEach((testimonial) => {
                  if (testimonial.userId === currentUser.uid) {
                    testimonials.push({
                      ...testimonial,
                      jobTitle: job.title,
                    });
                  }
                });
              }
            });
            setUserTestimonials(testimonials);
          });

          // Fetch active chats for the user - temporarily disabled due to permissions issue
          // TODO: Implement a better approach that doesn't require listing all chats
          setActiveChats([]);

          setLoading(false);

          return () => {
            jobsUnsubscribe();
            allJobsUnsubscribe();
          };
        } catch (error) {
          Alert.alert('Error', 'Failed to fetch user data');
          console.error('Error fetching user data:', error);
          setLoading(false);
        }
      };

      fetchUserData();
    }, [currentUser, navigation])
  );

  const handleVerifyEmail = async () => {
    if (!currentUser) return;

    try {
      await currentUser.sendEmailVerification();
      Alert.alert('Success', 'Verification email sent! Please check your inbox.');
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification email');
      console.error('Error sending verification email:', error);
    }
  };



  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Paragraph>Loading profile...</Paragraph>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Title style={[styles.title, isTablet && styles.titleTablet]}>Profile</Title>
        </View>

        <Card style={styles.userInfoCard}>
          <Card.Content>
            <Title>User Information</Title>
            <Paragraph>Email: {currentUser?.email}</Paragraph>
            <View style={styles.verificationContainer}>
              <Paragraph>Verification Status: </Paragraph>
              <Chip
                mode="outlined"
                selectedColor={currentUser?.emailVerified ? 'green' : 'red'}
                style={styles.verificationChip}
              >
                {currentUser?.emailVerified ? 'Verified' : 'Not Verified'}
              </Chip>
            </View>
            {!currentUser?.emailVerified && (
              <Button mode="contained" onPress={handleVerifyEmail} style={styles.verifyButton}>
                Send Verification Email
              </Button>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.jobsCard}>
          <Card.Content>
            <Title>Jobs Posted ({userJobs.length})</Title>
            {userJobs.length > 0 ? (
              userJobs.map((job) => (
                <List.Item
                  key={job.id}
                  title={job.title}
                  description={`Status: ${job.status} | Pay: $${job.pay}`}
                  onPress={() => navigation.navigate('JobDetails', { job })}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
                />
              ))
            ) : (
              <Paragraph style={styles.noDataText}>No jobs posted yet.</Paragraph>
            )}
            <Button mode="outlined" onPress={() => navigation.navigate('PostJob')} style={styles.postJobButton}>
              Post New Job
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.testimonialsCard}>
          <Card.Content>
            <Title>Testimonials Given ({userTestimonials.length})</Title>
            {userTestimonials.length > 0 ? (
              userTestimonials.map((testimonial, index) => (
                <List.Item
                  key={index}
                  title={testimonial.jobTitle}
                  description={`Rating: ${testimonial.rating}/5 | ${testimonial.comment}`}
                  right={(props) => <List.Icon {...props} icon="star" />}
                />
              ))
            ) : (
              <Paragraph style={styles.noDataText}>No testimonials given yet.</Paragraph>
            )}
            <Button mode="outlined" onPress={() => navigation.navigate('Testimonial')} style={styles.testimonialButton}>
              Leave Testimonial
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.chatsCard}>
          <Card.Content>
            <Title>Active Chats ({activeChats.length})</Title>
            {activeChats.length > 0 ? (
              activeChats.map((chat) => (
                <List.Item
                  key={chat.chatId}
                  title={chat.jobTitle}
                  description={`${chat.otherUserEmail} • ${chat.lastMessage}`}
                  onPress={() => navigation.navigate('Chat', {
                    jobId: chat.jobId,
                    jobTitle: chat.jobTitle,
                    otherUserId: chat.otherUserId,
                    otherUserEmail: chat.otherUserEmail,
                  })}
                  right={(props) => (
                    <View style={styles.chatRight}>
                      {chat.unreadCount > 0 && (
                        <Badge style={styles.unreadBadge}>{chat.unreadCount}</Badge>
                      )}
                      <List.Icon {...props} icon="chevron-right" />
                    </View>
                  )}
                />
              ))
            ) : (
              <Paragraph style={styles.noDataText}>No active chats yet.</Paragraph>
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
  scrollContainer: {
    padding: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  titleTablet: {
    fontSize: 28,
  },
  userInfoCard: {
    marginBottom: 20,
    elevation: 2,
    backgroundColor: '#fff',
  },
  verificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  verificationChip: {
    marginLeft: 10,
  },
  verifyButton: {
    marginTop: 10,
  },
  jobsCard: {
    marginBottom: 20,
    elevation: 2,
    backgroundColor: '#fff',
  },
  testimonialsCard: {
    marginBottom: 40,
    elevation: 2,
    backgroundColor: '#fff',
  },
  noDataText: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#666',
    marginVertical: 10,
  },
  postJobButton: {
    marginTop: 10,
  },
  testimonialButton: {
    marginTop: 10,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    marginBottom: 70,
    right: 0,
    bottom: 0,
    backgroundColor: '#9050ebff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen;
