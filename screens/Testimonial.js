import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Title, Card } from 'react-native-paper';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

const TestimonialScreen = ({ route, navigation }) => {
  const { jobId } = route.params || {};
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!jobId) {
      Alert.alert('Error', 'No job selected for testimonial.');
      return;
    }
    if (!comment.trim()) {
      Alert.alert('Error', 'Please provide a comment.');
      return;
    }
    setLoading(true);
    try {
      const jobRef = doc(db, 'jobs', jobId);
      await updateDoc(jobRef, {
        testimonials: arrayUnion({
          userId: auth.currentUser.uid,
          rating,
          comment,
          createdAt: new Date(),
        }),
      });
      Alert.alert('Success', 'Testimonial submitted!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit testimonial.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Leave a Testimonial</Title>
            <View style={styles.ratingContainer}>
              <Title style={styles.ratingTitle}>Rating:</Title>
              <TextInput
                label="Rating (1-5)"
                value={rating.toString()}
                onChangeText={(text) => setRating(Math.min(5, Math.max(1, parseInt(text) || 1)))}
                keyboardType="numeric"
                style={styles.ratingInput}
              />
            </View>
            <TextInput
              label="Comment"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              style={styles.input}
            />
            <Button mode="contained" onPress={handleSubmit} loading={loading} style={styles.button}>
              Submit Testimonial
            </Button>
          </Card.Content>
        </Card>
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
    padding: 20,
  },
  card: {
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  ratingContainer: {
    marginBottom: 20,
  },
  ratingTitle: {
    marginBottom: 10,
  },
  ratingInput: {
    marginBottom: 10,
  },
  input: {
    marginBottom: 20,
  },
  button: {
    marginTop: 10,
  },
});

export default TestimonialScreen;
