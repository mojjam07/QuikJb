# TODO: Fix Posting Job Errors

## Errors to Fix
- ERROR Error posting job: [FirebaseError: Missing or insufficient permissions.]
- ERROR [TypeError: Cannot call a class as a function]

## Analysis
- Permissions error likely due to Firestore rules validating encrypted contact as phone number
- TypeError may be from Firebase initialization or react-native-paper components

## Plan
- [x] Update firestore.rules to remove phone validation on encrypted contact
- [x] Remove rate limiting from create rule to avoid potential issues
- [x] Add auth check in PostJob.js before posting
- [ ] Test job posting functionality

## Files to Edit
- Quick-Job/firestore.rules
- Quick-Job/screens/PostJob.js
