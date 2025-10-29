import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Searchbar, TouchableRipple } from 'react-native-paper';
import * as Location from 'expo-location';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const SearchScreen = ({ navigation }) => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchQuery]);

  const fetchJobs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'jobs'));
      const jobsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const jobsWithAddresses = await Promise.all(jobsData.map(async (job) => {
        try {
          const result = await Location.reverseGeocodeAsync({ latitude: job.location.lat, longitude: job.location.lng });
          const address = result[0] ? (() => {
            const name = result[0].name;
            const street = result[0].street;
            const city = result[0].city;
            const region = result[0].region;
            if (name && !/^\d+$/.test(name)) {
              return `${name}, ${city || region || ''}`.trim();
            } else if (street) {
              return `${street}, ${city || region || ''}`.trim();
            } else {
              return `${city || region || 'Unknown'}`;
            }
          })() : `${job.location.lat.toFixed(4)}, ${job.location.lng.toFixed(4)}`;
          return { ...job, address };
        } catch (error) {
          console.error('Error reverse geocoding:', error);
          return { ...job, address: `${job.location.lat.toFixed(4)}, ${job.location.lng.toFixed(4)}` };
        }
      }));
      setJobs(jobsWithAddresses);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const filterJobs = () => {
    if (searchQuery) {
      const filtered = jobs.filter(job =>
        job.jobType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredJobs(filtered);
    } else {
      setFilteredJobs(jobs);
    }
  };

  const renderJobItem = ({ item }) => (
    <TouchableRipple onPress={() => navigation.navigate('JobDetails', { job: item })}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>{item.title}</Title>
          <Paragraph>{item.description}</Paragraph>
          <Paragraph>Job Type: {item.jobType}</Paragraph>
          <Paragraph>Pay: ${item.pay} {item.payFrequency ? `per ${item.payFrequency}` : ''}</Paragraph>
          <Paragraph>Location: {item.address}</Paragraph>
        </Card.Content>
      </Card>
    </TouchableRipple>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Searchbar
        placeholder="Search jobs by type, title, or description"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      <FlatList
        data={filteredJobs}
        renderItem={renderJobItem}
        keyExtractor={item => item.id}
        style={styles.list}
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
  searchbar: {
    margin: 10,
    borderRadius: 10,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 40, // Add bottom margin for nav/tab bar
  },
  card: {
    margin: 10,
    elevation: 4,
  },
});

export default SearchScreen;
