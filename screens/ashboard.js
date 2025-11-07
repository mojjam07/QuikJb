import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, FAB, Avatar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
      const positiveTestimonials = allTestimonials.filter(t => t.rating >= 4).slice(0, 3);
      setTestimonials(positiveTestimonials);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    }
  };

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
          onPress: () => auth.signOut(),
          style: 'destructive',
        },
      ],
      { cancelable: false }
    );
  };

  const numColumns = width > 600 ? 3 : 2;

  const menuItems = [
    { 
      title: 'Nearby Jobs', 
      icon: 'map-marker-radius', 
      screen: 'JobList',
      gradient: ['#667eea', '#764ba2'],
      description: 'Find work near you'
    },
    { 
      title: 'Post Job', 
      icon: 'briefcase-plus', 
      screen: 'PostJob',
      gradient: ['#4facfe', '#00f2fe'],
      description: 'Hire someone today'
    },
    { 
      title: 'Search Jobs', 
      icon: 'magnify', 
      screen: 'Search',
      gradient: ['#43e97b', '#38f9d7'],
      description: 'Explore opportunities'
    },
    { 
      title: 'Testimonials', 
      icon: 'star-circle', 
      screen: 'Testimonial',
      gradient: ['#fa709a', '#fee140'],
      description: 'Share your experience'
    },
  ];

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <MaterialCommunityIcons
        key={i}
        name={i < rating ? 'star' : 'star-outline'}
        size={16}
        color="#FFD700"
      />
    ));
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f5f5f5']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Avatar.Icon 
              size={60} 
              icon="briefcase" 
              style={styles.avatar}
              color="#fff"
            />
            <Title style={styles.welcomeTitle}>Welcome Back!</Title>
            <Paragraph style={styles.subtitle}>Find your next opportunity</Paragraph>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.section}>
          <Title style={styles.sectionTitle}>Quick Actions</Title>
          <View style={styles.grid}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.cardWrapper}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={item.gradient}
                  style={styles.gradientCard}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.cardIconContainer}>
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={40}
                      color="#fff"
                    />
                  </View>
                  <Title style={styles.cardTitle}>{item.title}</Title>
                  <Paragraph style={styles.cardDescription}>
                    {item.description}
                  </Paragraph>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Testimonials Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Title style={styles.sectionTitle}>Recent Testimonials</Title>
            <MaterialCommunityIcons name="comment-quote" size={24} color="#667eea" />
          </View>
          
          {testimonials.length > 0 ? (
            testimonials.map((testimonial, index) => (
              <Card key={index} style={styles.testimonialCard} elevation={3}>
                <Card.Content style={styles.testimonialContent}>
                  <View style={styles.testimonialHeader}>
                    <Avatar.Icon 
                      size={45} 
                      icon="account-circle" 
                      style={styles.testimonialAvatar}
                    />
                    <View style={styles.testimonialInfo}>
                      <Title style={styles.testimonialJob}>
                        {testimonial.jobTitle}
                      </Title>
                      <View style={styles.ratingContainer}>
                        {renderStars(testimonial.rating)}
                        <Paragraph style={styles.ratingText}>
                          {testimonial.rating}.0
                        </Paragraph>
                      </View>
                    </View>
                  </View>
                  <Paragraph style={styles.testimonialComment}>
                    "{testimonial.comment}"
                  </Paragraph>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard} elevation={2}>
              <Card.Content style={styles.emptyContent}>
                <MaterialCommunityIcons 
                  name="comment-text-outline" 
                  size={60} 
                  color="#ccc" 
                />
                <Paragraph style={styles.noTestimonialsText}>
                  No testimonials yet.{'\n'}Be the first to leave one!
                </Paragraph>
              </Card.Content>
            </Card>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="logout"
        onPress={handleLogout}
        color="#fff"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 300,
  },
  scrollContainer: {
    paddingHorizontal: 16,
  },
  header: {
    marginTop: 40,
    marginBottom: 30,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 15,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: (width - 48) / 2,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradientCard: {
    padding: 20,
    borderRadius: 20,
    minHeight: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconContainer: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  testimonialCard: {
    marginBottom: 15,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  testimonialContent: {
    padding: 16,
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  testimonialAvatar: {
    backgroundColor: '#667eea',
  },
  testimonialInfo: {
    marginLeft: 12,
    flex: 1,
  },
  testimonialJob: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  testimonialComment: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  emptyCard: {
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  emptyContent: {
    alignItems: 'center',
    padding: 40,
  },
  noTestimonialsText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 15,
    fontSize: 14,
  },
  bottomPadding: {
    height: 80,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#667eea',
  },
});

export default DashboardScreen;