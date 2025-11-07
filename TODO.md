# TODO: Implement Location-Based Job Filtering by State

## Steps to Complete:
- [x] Request location permissions and fetch user's current state (region) on component mount in Search.js
- [x] Update fetchJobs function to add a 'state' field to each job object using the region from reverse geocoding
- [x] Update filterJobs function to include filtering by user's state, combined with existing search query
- [x] Handle case where location permission is denied: default to showing all jobs without state filtering
- [x] Apply the same location-based filtering to JobList.js
- [ ] Test the implementation to ensure jobs display based on user's state location in both Search and JobList screens
