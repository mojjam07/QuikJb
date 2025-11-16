import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert, Linking, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button, FAB, Searchbar, TouchableRipple, Text, ActivityIndicator, Snackbar } from 'react-native-paper';
import * as Location from 'expo-location';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

const JobListScreen = ({ navigation }) => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState(null);
  const [userState, setUserState] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryFunction, setRetryFunction] = useState(null);
  const { width } = Dimensions.get('window');
  const isTablet = width > 768;

  useEffect(() => {
    getLocationPermission();
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
    setCurrentPage(1); // Reset to first page when filters change
  }, [jobs, searchQuery, userState]);

  const getLocationPermission = async () => {
    setLocationLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission is required to find nearby jobs. Please enable location services.');
        setRetryFunction(() => getLocationPermission);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location.coords);
      // Also set user state for filtering
      const result = await Location.reverseGeocodeAsync({ latitude: location.coords.latitude, longitude: location.coords.longitude });
      if (result[0] && result[0].region) {
        setUserState(result[0].region);
      }
      setError(null);
    } catch (error) {
      console.error('Error getting location:', error);
      setError('Failed to get your location. Please check your internet connection and try again.');
      setRetryFunction(() => getLocationPermission);
    } finally {
      setLocationLoading(false);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
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
          const state = result[0] && result[0].region ? result[0].region : 'Unknown';
          return { ...job, address, state };
        } catch (error) {
          console.error('Error reverse geocoding:', error);
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
    if (searchQuery) {
      filtered = filtered.filter(job => job.jobType.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (location) {
      filtered = filtered.filter(job => {
        const distance = getDistance(location.latitude, location.longitude, job.location.lat, job.location.lng);
        return distance <= 10; // 10km radius
      });
    }
    // Filter by user's state if available
    if (userState) {
      filtered = filtered.filter(job => job.state === userState);
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

  const handleContact = (contact) => {
    Linking.openURL(`tel:${contact}`).catch(() => {
      Alert.alert('Error', 'Unable to make a call. Please check your device settings.');
    });
  };

  const renderJobItem = ({ item }) => (
    <Card style={[styles.card, isTablet && styles.cardTablet]}>
      <TouchableRipple
        onPress={() => navigation.navigate('JobDetails', { job: item })}
        accessibilityLabel={`View details for ${item.title} job`}
        accessibilityHint="Opens job details screen"
      >
        <Card.Content>
          <Title accessibilityLabel={`Job title: ${item.title}`}>{item.title}</Title>
          <Paragraph accessibilityLabel={`Job description: ${item.description}`}>{item.description}</Paragraph>
          <Paragraph accessibilityLabel={`Job type: ${item.jobType}`}>Job Type: {item.jobType}</Paragraph>
          <Paragraph accessibilityLabel={`Pay: ${item.pay} dollars ${item.payFrequency ? `per ${item.payFrequency}` : ''}`}>
            Pay: ${item.pay} {item.payFrequency ? `per ${item.payFrequency}` : ''}
          </Paragraph>
          <Paragraph accessibilityLabel={`Location: ${item.address}`}>Location: {item.address}</Paragraph>
          <Paragraph accessibilityLabel={`Status: ${item.status}`}>Status: {item.status}</Paragraph>
        </Card.Content>
      </TouchableRipple>
      <Card.Actions>
        <Button
          mode="contained"
          onPress={() => handleContact(item.contact)}
          style={styles.button}
          disabled={item.status === 'completed'}
          accessibilityLabel={item.status === 'completed' ? 'Job completed' : 'Contact employer'}
          accessibilityHint={item.status === 'completed' ? 'This job is no longer available' : 'Opens phone dialer to call employer'}
        >
          Contact
        </Button>
      </Card.Actions>
    </Card>
  );

  const renderSkeletonItem = () => (
    <Card style={[styles.card, isTablet && styles.cardTablet]}>
      <Card.Content>
        <View style={[styles.skeleton, { height: 24, width: '80%', marginBottom: 8 }]} />
        <View style={[styles.skeleton, { height: 16, width: '100%', marginBottom: 8 }]} />
        <View style={[styles.skeleton, { height: 16, width: '60%', marginBottom: 8 }]} />
        <View style={[styles.skeleton, { height: 16, width: '40%', marginBottom: 8 }]} />
        <View style={[styles.skeleton, { height: 16, width: '70%', marginBottom: 8 }]} />
        <View style={[styles.skeleton, { height: 16, width: '30%', marginBottom: 8 }]} />
      </Card.Content>
      <Card.Actions>
        <View style={[styles.skeleton, { height: 36, width: '100%', marginBottom: 8 }]} />
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
        accessibilityLabel="Search jobs by type"
        accessibilityHint="Enter text to filter jobs by job type"
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
      ) : (
        <FlatList
          data={getPaginatedJobs()}
          renderItem={renderJobItem}
          keyExtractor={item => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      )}
      {totalPages > 1 && !loading && (
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
      <FAB
        style={[styles.fab, isTablet && styles.fabTablet]}
        icon="plus"
        onPress={() => navigation.navigate('PostJob')}
        accessibilityLabel="Post new job"
        accessibilityHint="Opens screen to create a new job posting"
      />
      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        action={{
          label: 'Retry',
          onPress: () => {
            setError(null);
            if (retryFunction) retryFunction();
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
  fab: {
    position: 'absolute',
    margin: 16,
    marginBottom: 70,
    right: 0,
    bottom: 0,
  },
  fabTablet: {
    margin: 24,
    marginBottom: 80,
  },
  button: {
    marginHorizontal: 10,
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

export default JobListScreen;
