# APK Build Plan for Quick-Job App

## Project Overview
- **App Name**: Quick-Job
- **Package Name**: com.mojjam07.QuickJob
- **Expo SDK**: 54
- **React Native Version**: 0.81.5
- **Build System**: EAS (Expo Application Services)

---

## Pre-requisites Checklist

Before building the APK, ensure the following are installed/configured:

- [ ] Node.js (v18+ recommended)
- [ ] npm or yarn
- [ ] Expo CLI (`npm install -g expo-cli`)
- [ ] EAS CLI (`npm install -g eas-cli`)
- [ ] Android Studio with SDK configured
- [ ] Android SDK path set in environment variables

---

## Build Options

### Option 1: EAS Build (Recommended - Cloud Build)
This is the recommended approach for Expo projects. EAS builds the APK in the cloud without needing local Android SDK setup.

#### Steps for EAS Build:

1. **Login to Expo**
   
```
bash
   npx expo login
   
```

2. **Configure EAS (Already configured in eas.json)**
   - Development build: `eas build -p android --profile development`
   - Preview build: `eas build -p android --profile preview`
   - Production build: `eas build -p android --profile production`

3. **Build Production APK**
   
```
bash
   eas build -p android --profile production
   
```

4. **Download the APK**
   - After build completes, download from Expo dashboard or using:
   
```
bash
   eas build:list
   eas build:download [BUILD_ID]
   
```

---

### Option 2: Prebuild + Local Build (Local Development)
Use this approach if you need to build locally without EAS.

#### Steps for Local Build:

1. **Generate Native Directories**
   
```
bash
   npx expo prebuild --platform android
   
```

2. **Build Debug APK (with bundled JS)**
   
```
bash
   cd android
   ./gradlew assembleDebug
   
```

3. **Build Release APK**
   - First, create a keystore:
   
```
bash
   keytool -genkey -v -keystore my-release-key.keystore -alias quickjob -keyalg RSA -keysize 2048 -validity 10000
   
```
   
   - Configure signing in `android/app/build.gradle`:
   
```
gradle
   android {
       signingConfigs {
           release {
               storeFile file('my-release-key.keystore')
               storePassword 'your_password'
               keyAlias 'quickjob'
               keyPassword 'your_password'
           }
       }
   }
   
```
   
   - Build release:
   
```
bash
   ./gradlew assembleRelease
   
```

4. **APK Location**
   - Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
   - Release: `android/app/build/outputs/apk/release/app-release.apk`

---

## APK with Bundled JS (Standalone)

Both EAS build and local build options above create APKs with bundled JavaScript. This means the app works **without Metro bundler**.

### Verification Steps:
1. Check that APK contains `index.android.bundle`:
   
```
bash
   unzip -l app.apk | grep bundle
   
```

2. Install on device:
   
```bash
   adb install app.apk
   
```

---

## Configuration Notes

### Android Permissions (Already configured in app.json):
- ACCESS_FINE_LOCATION
- ACCESS_COARSE_LOCATION
- RECEIVE_BOOT_COMPLETED
- VIBRATE
- POST_NOTIFICATIONS

### Firebase Configuration:
- Ensure `firebaseConfig.js` is properly configured
- Android SHA-1 fingerprint should be added to Firebase Console for Google Auth

---

## Troubleshooting

### Common Issues:

1. **SDK Version Mismatch**
   - Run: `npx expo install --fix`

2. **Android SDK Not Found**
   - Set ANDROID_HOME environment variable
   - Example: `export ANDROID_HOME=/path/to/android/sdk`

3. **Keystore Errors**
   - Make sure to backup your keystore
   - Never commit keystore to version control

4. **Build Fails on assets**
   - Clear cache: `npx expo start --clear`

---

## Recommended Build Command Sequence

```
bash
# 1. Install dependencies
npm install

# 2. Run prebuild to generate android directory
npx expo prebuild --platform android

# 3. Build debug APK
cd android && ./gradlew assembleDebug

# 4. APK will be at: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Next Steps

1. Choose build option (EAS Cloud or Local)
2. Ensure all pre-requisites are installed
3. Run the appropriate commands
4. Test the APK on a device
