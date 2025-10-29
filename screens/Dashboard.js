import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button, FAB } from 'react-native-paper';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'jobs'));
      const allTestimonials = [];
      querySnapshot.forEach((doc) => {
        const job = doc.data();
        if (job.testimonials) {
          job.testimonials.forEach((testimonial) => {
            allTestimonials.push({
              ...testimonial,
              jobTitle: job.title,
            });
          });
        }
      });
      // Get positive testimonials (rating >= 4)
      const positiveTestimonials = allTestimonials.filter(t => t.rating >= 4).slice(0, 3);
      setTestimonials(positiveTestimonials);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    }
  };

  const handleLogout = () => {
    auth.signOut();
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
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
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
        <View style={styles.testimonialsSection}>
          <Title style={styles.sectionTitle}>Testimonials</Title>
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
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
