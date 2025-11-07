import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button, Text } from 'react-native-paper';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const AllTestimonialsScreen = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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
      setCurrentPage(1); // Reset to first page when testimonials update
    }, (error) => {
      console.error('Error listening to testimonials:', error);
    });

    return () => unsubscribe();
  }, []);

  const getPaginatedTestimonials = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return testimonials.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(testimonials.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

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
        data={getPaginatedTestimonials()}
        renderItem={renderTestimonial}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContent}
      />
      {totalPages > 1 && (
        <View style={styles.paginationContainer}>
          <Button
            mode="outlined"
            onPress={handlePreviousPage}
            disabled={currentPage === 1}
            style={styles.pageButton}
            icon="chevron-left"
          >
          </Button>
          <Text style={styles.pageText}>
            Page {currentPage} of {totalPages}
          </Text>
          <Button
            mode="outlined"
            onPress={handleNextPage}
            disabled={currentPage === totalPages}
            style={styles.pageButton}
            icon="chevron-right"
          >
          </Button>
        </View>
      )}
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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  pageButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  pageText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default AllTestimonialsScreen;
