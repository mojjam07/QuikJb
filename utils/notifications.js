import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request notification permissions
export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permissions not granted');
    return false;
  }

  // Configure for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    // Create channel for job notifications
    await Notifications.setNotificationChannelAsync('job-notifications', {
      name: 'Job Notifications',
      importance: Notifications.AndroidImportance.MAX,
      description: 'Notifications about job applications and updates',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return true;
};

// Get and store push token
export const getAndStorePushToken = async () => {
  try {
    if (!auth.currentUser) return null;

    const pushToken = await Notifications.getExpoPushTokenAsync();
    
    // Store push token in Firestore for the user
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      await updateDoc(userRef, {
        pushTokens: arrayUnion(pushToken.data),
      });
    } else {
      // Create user document if it doesn't exist
      await setDoc(userRef, {
        pushTokens: [pushToken.data],
        createdAt: new Date(),
      });
    }

    return pushToken.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
};

// Send local notification
export const sendLocalNotification = async (title, body, data = {}) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // Immediate delivery
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Notification types
export const NotificationTypes = {
  NEW_APPLICATION: 'new_application',
  APPLICATION_APPROVED: 'application_approved',
  APPLICATION_REJECTED: 'application_rejected',
  JOB_TAKEN: 'job_taken',
  JOB_COMPLETED: 'job_completed',
  NEW_MESSAGE: 'new_message',
};

// Send job-related notification
export const sendJobNotification = async (recipientUserId, type, jobData) => {
  let title = '';
  let body = '';

  switch (type) {
    case NotificationTypes.NEW_APPLICATION:
      title = 'New Job Application';
      body = `Someone applied for your job: ${jobData.jobTitle}`;
      break;
    case NotificationTypes.APPLICATION_APPROVED:
      title = 'Application Approved';
      body = `Your application for "${jobData.jobTitle}" has been approved!`;
      break;
    case NotificationTypes.JOB_TAKEN:
      title = 'Job Taken';
      body = `Your job "${jobData.jobTitle}" has been accepted!`;
      break;
    case NotificationTypes.JOB_COMPLETED:
      title = 'Job Completed';
      body = `The job "${jobData.jobTitle}" has been marked as completed.`;
      break;
    default:
      return;
  }

  // Store notification in Firestore for the recipient
  try {
    const notificationRef = doc(db, 'notifications', `${recipientUserId}_${Date.now()}`);
    await setDoc(notificationRef, {
      type,
      title,
      body,
      jobId: jobData.jobId,
      jobTitle: jobData.jobTitle,
      recipientId: recipientUserId,
      senderId: auth.currentUser?.uid,
      read: false,
      createdAt: new Date(),
    });

    // Send local notification if recipient is currently in app
    // (For a full push notification system, you'd integrate with FCM here)
  } catch (error) {
    console.error('Error storing notification:', error);
  }
};

// Setup notification listeners
export const setupNotificationListeners = (notificationHandler) => {
  // Handle notifications received while app is in foreground
  const notificationReceivedListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notification received:', notification);
      if (notificationHandler) {
        notificationHandler(notification);
      }
    }
  );

  // Handle notification tap/response
  const notificationResponseListener = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('Notification response:', response);
      const { jobId } = response.notification.request.content.data || {};
      if (jobId && notificationHandler) {
        notificationHandler({ type: 'tap', jobId });
      }
    }
  );

  return () => {
    notificationReceivedListener.remove();
    notificationResponseListener.remove();
  };
};

// Cancel all scheduled notifications
export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

// Get badge count
export const getBadgeCount = async () => {
  return await Notifications.getBadgeCountAsync();
};

// Set badge count
export const setBadgeCount = async (count) => {
  await Notifications.setBadgeCountAsync(count);
};

