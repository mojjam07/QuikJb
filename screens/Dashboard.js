import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, RefreshControl, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button, FAB } from 'react-native-paper';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const [testimonials, setTestimonials] = useState([]);
  const [lastJob, setLastJob] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTestimonials = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'jobs'));
      const allTestimonials = [];
      let jobsData = [];
      querySnapshot.forEach((doc) => {
        const job = doc.data();
        jobsData.push({ id: doc.id, ...job });
        if (job.testimonials) {
          job.testimonials.forEach((testimonial) => {
            allTestimonials.push({
              ...testimonial,
              jobTitle: job.title,
            });
          });
        }
      });
      // Sort testimonials by createdAt descending and get the last one
      allTestimonials.sort((a, b) => new Date(b.createdAt.seconds * 1000) - new Date(a.createdAt.seconds * 1000));
      setTestimonials(allTestimonials.slice(0, 1)); // Only the most recent testimonial

      // Get the last listed job (assuming sorted by createdAt or id)
      if (jobsData.length > 0) {
        jobsData.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt.seconds * 1000) - new Date(a.createdAt.seconds * 1000);
          }
          return b.id.localeCompare(a.id); // Fallback to id
        });
        setLastJob(jobsData[0]);
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'jobs'), (querySnapshot) => {
      const allTestimonials = [];
      let jobsData = [];
      querySnapshot.forEach((doc) => {
        const job = doc.data();
        jobsData.push({ id: doc.id, ...job });
        if (job.testimonials) {
          job.testimonials.forEach((testimonial) => {
            allTestimonials.push({
              ...testimonial,
              jobTitle: job.title,
            });
          });
        }
      });
      // Sort testimonials by createdAt descending and get the last one
      allTestimonials.sort((a, b) => new Date(b.createdAt.seconds * 1000) - new Date(a.createdAt.seconds * 1000));
      setTestimonials(allTestimonials.slice(0, 1)); // Only the most recent testimonial

      // Get the last listed job
      if (jobsData.length > 0) {
        jobsData.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt.seconds * 1000) - new Date(a.createdAt.seconds * 1000);
          }
          return b.id.localeCompare(a.id); // Fallback to id
        });
        setLastJob(jobsData[0]);
      }
    }, (error) => {
      console.error('Error listening to testimonials:', error);
    });

    return () => unsubscribe();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTestimonials();
    setRefreshing(false);
  }, [fetchTestimonials]);

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: () => {
            auth.signOut();
          },
        },
      ],
      { cancelable: false }
    );
  };

  const numColumns = width > 600 ? 3 : 2; // 3 columns for tablets/web, 2 for phones

  const menuItems = [
    { title: 'Nearby Jobs', icon: 'map-marker', screen: 'JobList' },
    { title: 'Post Job', icon: 'plus', screen: 'PostJob' },
    { title: 'Search Jobs', icon: 'magnify', screen: 'Search' },
    { title: 'Testimonial', icon: 'star', screen: 'Testimonial' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Image source={require('../assets/logo1.png')} style={styles.logo} />
          {/* <Title style={styles.brandName}>Quick-Job</Title> */}
          <Paragraph style={styles.subtitle}>Connect Employers with Workers Instantly</Paragraph>
          <Title style={styles.welcomeTitle}>Welcome, {auth.currentUser?.email?.split('@')[0] || 'User'}!</Title>
        </View>
        <View style={styles.grid}>
          {menuItems.map((item, index) => (
            <Card key={index} style={styles.card} onPress={() => navigation.navigate(item.screen)}>
              <Card.Content style={styles.cardContent}>
                <Button mode="contained" icon={item.icon} style={styles.button}>
                  {item.title}
                </Button>
              </Card.Content>
            </Card>
          ))}
        </View>
        {lastJob && (
          <View style={styles.lastJobSection}>
            <Title style={styles.sectionTitle}>Latest Job</Title>
            <Card style={styles.jobCard} onPress={() => navigation.navigate('JobDetails', { job: lastJob })}>
              <Card.Content>
                <Title>{lastJob.title}</Title>
                <Paragraph>{lastJob.description}</Paragraph>
                <Paragraph>Job Type: {lastJob.jobType}</Paragraph>
                <Paragraph>Pay: ${lastJob.pay} {lastJob.payFrequency ? `per ${lastJob.payFrequency}` : ''}</Paragraph>
                <Paragraph>Status: {lastJob.status}</Paragraph>
              </Card.Content>
            </Card>
          </View>
        )}
        <View style={styles.testimonialsSection}>
          <Title style={styles.sectionTitle}>Latest Testimonial</Title>
          {testimonials.length > 0 ? (
            testimonials.map((testimonial, index) => (
              <Card key={index} style={styles.testimonialCard}>
                <Card.Content>
                  <Title>{testimonial.jobTitle}</Title>
                  <Paragraph>Rating: {testimonial.rating}/5</Paragraph>
                  <Paragraph>{testimonial.comment}</Paragraph>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Paragraph style={styles.noTestimonialsText}>No testimonials yet. Be the first to leave one!</Paragraph>
          )}
          <Button mode="outlined" onPress={() => navigation.navigate('AllTestimonials')} style={styles.viewAllButton}>
            View All Testimonials
          </Button>
        </View>
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="logout"
        onPress={handleLogout}
      />
    </SafeAreaView>
  );
};

const numColumns = width > 600 ? 3 : 2; // 3 columns for tablets/web, 2 for phones

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
  logo: {
    width: 150,
    height: 100,
    marginBottom: 10,
  },
  brandName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  lastJobSection: {
    marginBottom: 20,
  },
  jobCard: {
    marginBottom: 10,
    elevation: 2,
    backgroundColor: '#fff',
  },
  testimonialsSection: {
    marginBottom: 40, // Add bottom margin for nav/tab bar
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  testimonialCard: {
    marginBottom: 10,
    elevation: 2,
    backgroundColor: '#fff',
  },
  noTestimonialsText: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#666',
  },
  viewAllButton: {
    marginTop: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: (width - 30) / numColumns,
    marginBottom: 15,
    elevation: 4,
    backgroundColor: '#fff',
  },
  cardContent: {
    alignItems: 'center',
    padding: 10,
  },
  button: {
    width: '100%',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    marginBottom: 70,
    right: 0,
    bottom: 0,
    backgroundColor: '#9050ebff',
  },
});

export default DashboardScreen;
