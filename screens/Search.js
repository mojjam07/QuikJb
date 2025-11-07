import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Searchbar, TouchableRipple, Button } from 'react-native-paper';
import * as Location from 'expo-location';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const SearchScreen = ({ navigation }) => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userState, setUserState] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchUserLocation();
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
    setCurrentPage(1); // Reset to first page when filters change
  }, [jobs, searchQuery, userState]);

  const fetchUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const result = await Location.reverseGeocodeAsync({ latitude: location.coords.latitude, longitude: location.coords.longitude });
      if (result[0] && result[0].region) {
        setUserState(result[0].region);
      }
    } catch (error) {
      console.error('Error fetching user location:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const q = query(collection(db, 'jobs'), where('status', '==', 'completed'));
      const querySnapshot = await getDocs(q);
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
          const state = result[0] && result[0].region ? result[0].region : 'Unknown';
          return { ...job, address, state };
        } catch (error) {
          console.error('Error reverse geocoding:', error);
          return { ...job, address: `${job.location.lat.toFixed(4)}, ${job.location.lng.toFixed(4)}`, state: 'Unknown' };
        }
      }));
      setJobs(jobsWithAddresses);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const filterJobs = () => {
    let filtered = jobs;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(job =>
        job.jobType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by user's state if available
    if (userState) {
      filtered = filtered.filter(job => job.state === userState);
    }

    setFilteredJobs(filtered);
  };

  const getPaginatedJobs = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredJobs.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);

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
      {filteredJobs.length === 0 ? (
        <View style={styles.noJobsContainer}>
          <Text style={styles.noJobsText}>No completed jobs available at the moment.</Text>
        </View>
      ) : (
        <View style={styles.container}>
          <FlatList
            data={getPaginatedJobs()}
            renderItem={renderJobItem}
            keyExtractor={item => item.id}
            style={styles.list}
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
  noJobsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noJobsText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
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

export default SearchScreen;
