import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph } from 'react-native-paper';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const AllTestimonialsScreen = () => {
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'jobs'), (querySnapshot) => {
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
      // Sort testimonials by createdAt descending (most recent first)
      allTestimonials.sort((a, b) => new Date(b.createdAt.seconds * 1000) - new Date(a.createdAt.seconds * 1000));
      setTestimonials(allTestimonials);
    }, (error) => {
      console.error('Error listening to testimonials:', error);
    });

    return () => unsubscribe();
  }, []);

  const renderTestimonial = ({ item }) => (
    <Card style={styles.testimonialCard}>
      <Card.Content>
        <Title>{item.jobTitle}</Title>
        <Paragraph>Rating: {item.rating}/5</Paragraph>
        <Paragraph>{item.comment}</Paragraph>
        <Paragraph style={styles.dateText}>
          {new Date(item.createdAt.seconds * 1000).toLocaleDateString()}
        </Paragraph>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>All Testimonials</Title>
      </View>
      <FlatList
        data={testimonials}
        renderItem={renderTestimonial}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  listContent: {
    padding: 10,
    paddingBottom: 80,
  },
  testimonialCard: {
    marginBottom: 10,
    elevation: 2,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 10,
  },
});

export default AllTestimonialsScreen;
