import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Searchbar, TouchableRipple, Button, ActivityIndicator, Snackbar } from 'react-native-paper';
import * as Location from 'expo-location';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { reverseGeocodeWithTimeout, getCurrentPositionAsync, openLocationSettings } from '../utils/geocoding';

const SearchScreen = ({ navigation }) => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userState, setUserState] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryFunction, setRetryFunction] = useState(null);
  const [canOpenSettings, setCanOpenSettings] = useState(false);
  const { width } = Dimensions.get('window');
  const isTablet = width > 768;

  useEffect(() => {
    fetchUserLocation();
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
    setCurrentPage(1); // Reset to first page when filters change
  }, [jobs, searchQuery, userState]);

  const fetchUserLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied. Please enable location services to find jobs in your area.');
        setRetryFunction(() => fetchUserLocation);
        return;
      }
      const location = await getCurrentPositionAsync({});
      try {
        const result = await reverseGeocodeWithTimeout({ latitude: location.coords.latitude, longitude: location.coords.longitude });
        if (result[0] && result[0].region) {
          setUserState(result[0].region);
        }
      } catch (error) {
        console.warn('Geocoding for user location failed, skipping state filter:', error.message);
      }
      setError(null);
    } catch (error) {
      console.error('Error fetching user location:', error);
      let errorMessage = 'Failed to get your location. Please check your internet connection and try again.';
      let canOpenSettings = false;

      if (error.message === 'LOCATION_SERVICES_DISABLED' || error.userMessage) {
        errorMessage = error.userMessage || 'Location services are disabled. Please enable location services in your device settings.';
        canOpenSettings = error.canOpenSettings || true;
      }

      setError(errorMessage);
      setRetryFunction(() => fetchUserLocation);
      setCanOpenSettings(canOpenSettings);
    } finally {
      setLocationLoading(false);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'jobs'), where('status', '==', 'completed'));
      const querySnapshot = await getDocs(q);
      const jobsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const jobsWithAddresses = await Promise.all(jobsData.map(async (job) => {
        try {
          const result = await reverseGeocodeWithTimeout({ latitude: job.location.lat, longitude: job.location.lng });
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
          console.warn('Geocoding for job location failed, using coordinates:', error.message);
          return { ...job, address: `${job.location.lat.toFixed(4)}, ${job.location.lng.toFixed(4)}`, state: 'Unknown' };
        }
      }));
      setJobs(jobsWithAddresses);
      setError(null);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to load jobs. Please check your internet connection and try again.');
      setRetryFunction(() => fetchJobs);
    } finally {
      setLoading(false);
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
    <TouchableRipple
      onPress={() => navigation.navigate('JobDetails', { job: item })}
      accessibilityLabel={`View details for ${item.title} job`}
      accessibilityHint="Opens job details screen"
    >
      <Card style={[styles.card, isTablet && styles.cardTablet]}>
        <Card.Content>
          <Title accessibilityLabel={`Job title: ${item.title}`}>{item.title}</Title>
          <Paragraph accessibilityLabel={`Job description: ${item.description}`}>{item.description}</Paragraph>
          <Paragraph accessibilityLabel={`Job type: ${item.jobType}`}>Job Type: {item.jobType}</Paragraph>
          <Paragraph accessibilityLabel={`Pay: ${item.pay} dollars ${item.payFrequency ? `per ${item.payFrequency}` : ''}`}>
            Pay: ${item.pay} {item.payFrequency ? `per ${item.payFrequency}` : ''}
          </Paragraph>
          <Paragraph accessibilityLabel={`Location: ${item.address}`}>Location: {item.address}</Paragraph>
        </Card.Content>
      </Card>
    </TouchableRipple>
  );

  const renderSkeletonItem = () => (
    <Card style={[styles.card, isTablet && styles.cardTablet]}>
      <Card.Content>
        <View style={[styles.skeleton, { height: 24, width: '80%', marginBottom: 8 }]} />
        <View style={[styles.skeleton, { height: 16, width: '100%', marginBottom: 8 }]} />
        <View style={[styles.skeleton, { height: 16, width: '60%', marginBottom: 8 }]} />
        <View style={[styles.skeleton, { height: 16, width: '40%', marginBottom: 8 }]} />
        <View style={[styles.skeleton, { height: 16, width: '70%', marginBottom: 8 }]} />
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Searchbar
        placeholder="Search jobs by type, title, or description"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
        accessibilityLabel="Search jobs"
        accessibilityHint="Enter text to filter jobs by type, title, or description"
      />
      {loading ? (
        <View style={styles.container}>
          <FlatList
            data={Array.from({ length: 5 }, (_, i) => ({ id: i.toString() }))}
            renderItem={renderSkeletonItem}
            keyExtractor={item => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />
        </View>
      ) : filteredJobs.length === 0 ? (
        <View style={styles.noJobsContainer}>
          <Text style={styles.noJobsText} accessibilityLabel="No jobs available">
            No completed jobs available at the moment.
          </Text>
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
            <View style={[styles.paginationContainer, isTablet && styles.paginationTablet]}>
              <Button
                mode="outlined"
                onPress={handlePreviousPage}
                disabled={currentPage === 1}
                style={styles.pageButton}
                icon="chevron-left"
                accessibilityLabel="Previous page"
                accessibilityHint="Go to previous page of jobs"
              >
              </Button>
              <Text style={styles.pageText} accessibilityLabel={`Page ${currentPage} of ${totalPages}`}>
                Page {currentPage} of {totalPages}
              </Text>
              <Button
                mode="outlined"
                onPress={handleNextPage}
                disabled={currentPage === totalPages}
                style={styles.pageButton}
                icon="chevron-right"
                accessibilityLabel="Next page"
                accessibilityHint="Go to next page of jobs"
              >
              </Button>
            </View>
          )}
        </View>
      )}
      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={6000}
        action={{
          label: canOpenSettings ? 'Settings' : 'Retry',
          onPress: () => {
            if (canOpenSettings) {
              openLocationSettings();
              setError(null);
              setCanOpenSettings(false);
            } else {
              setError(null);
              if (retryFunction) retryFunction();
            }
          },
        }}
        accessibilityLabel={`Error: ${error}`}
      >
        {error}
      </Snackbar>
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
  cardTablet: {
    marginHorizontal: 20,
    maxWidth: 600,
    alignSelf: 'center',
  },
  skeleton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
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
  paginationTablet: {
    paddingHorizontal: 40,
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
