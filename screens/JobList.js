import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button, FAB, Searchbar, TouchableRipple, Text } from 'react-native-paper';
import * as Location from 'expo-location';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

const JobListScreen = ({ navigation }) => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState(null);

  useEffect(() => {
    getLocationPermission();
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchQuery]);

  const getLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is required to find nearby jobs.');
      return;
    }
    let location = await Location.getCurrentPositionAsync({});
    setLocation(location.coords);
  };

  const fetchJobs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'jobs'));
      const jobsData = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(job => job.status === 'available');
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
    let filtered = jobs;
    if (searchQuery) {
      filtered = filtered.filter(job => job.jobType.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (location) {
      filtered = filtered.filter(job => {
        const distance = getDistance(location.latitude, location.longitude, job.location.lat, job.location.lng);
        return distance <= 10; // 10km radius
      });
    }
    setFilteredJobs(filtered);
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const handleContact = (contact) => {
    Linking.openURL(`tel:${contact}`).catch(() => {
      Alert.alert('Error', 'Unable to make a call. Please check your device settings.');
    });
  };

  const renderJobItem = ({ item }) => (
    <Card style={styles.card}>
      <TouchableRipple onPress={() => navigation.navigate('JobDetails', { job: item })}>
        <Card.Content>
          <Title>{item.title}</Title>
          <Paragraph>{item.description}</Paragraph>
          <Paragraph>Job Type: {item.jobType}</Paragraph>
          <Paragraph>Pay: ${item.pay} {item.payFrequency ? `per ${item.payFrequency}` : ''}</Paragraph>
          <Paragraph>Location: {item.address}</Paragraph>
          <Paragraph>Status: {item.status}</Paragraph>
        </Card.Content>
      </TouchableRipple>
      <Card.Actions>
        <Button mode="contained" onPress={() => handleContact(item.contact)} style={styles.button} disabled={item.status === 'completed'}>
          Contact
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Searchbar
        placeholder="Search by job type"
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
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('PostJob')}
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
    padding: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  searchbar: {
    margin: 10,
    borderRadius: 10,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 80, // Add bottom padding for FAB and nav/tab bar
  },
  card: {
    margin: 10,
    elevation: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    marginBottom: 70,
    right: 0,
    bottom: 0,
  },
  button: {
    marginHorizontal: 10,
  },
});

export default JobListScreen;
