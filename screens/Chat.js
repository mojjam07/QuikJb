import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, Alert, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Card, Title, Paragraph, FAB } from 'react-native-paper';
import { collection, addDoc, onSnapshot, query, orderBy, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

const { width } = Dimensions.get('window');

const ChatScreen = ({ route, navigation }) => {
  const { jobId, jobTitle, otherUserId, otherUserEmail } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef();

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) {
      Alert.alert('Error', 'User not authenticated');
      navigation.goBack();
      return;
    }

    // Create a unique chat ID based on job and users
    const chatId = [jobId, currentUser.uid, otherUserId].sort().join('_');

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messagesData = [];
      querySnapshot.forEach((doc) => {
        messagesData.push({ id: doc.id, ...doc.data() });
      });
      setMessages(messagesData);
      setLoading(false);
    }, (error) => {
      Alert.alert('Error', 'Failed to load messages');
      console.error('Error loading messages:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [jobId, otherUserId, currentUser, navigation]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const chatId = [jobId, currentUser.uid, otherUserId].sort().join('_');
      const messagesRef = collection(db, 'chats', chatId, 'messages');

      await addDoc(messagesRef, {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        senderEmail: currentUser.email,
        timestamp: new Date(),
      });

      setNewMessage('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
      console.error('Error sending message:', error);
    }
  };

  const approveSeeker = async () => {
    try {
      const jobRef = doc(db, 'jobs', jobId);
      const jobDoc = await getDoc(jobRef);

      if (jobDoc.exists()) {
        const jobData = jobDoc.data();
        const approvedSeekers = jobData.approvedSeekers || [];

        if (!approvedSeekers.includes(otherUserId)) {
          approvedSeekers.push(otherUserId);
          await updateDoc(jobRef, {
            approvedSeekers: approvedSeekers,
          });
          Alert.alert('Success', 'Seeker approved! They can now take the job.');
        } else {
          Alert.alert('Info', 'Seeker is already approved.');
        }
      } else {
        Alert.alert('Error', 'Job not found.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to approve seeker');
      console.error('Error approving seeker:', error);
    }
  };

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.senderId === currentUser.uid;

    return (
      <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
        <Card style={[styles.messageCard, isOwnMessage ? styles.ownMessageCard : styles.otherMessageCard]}>
          <Card.Content style={styles.messageContent}>
            {!isOwnMessage && (
              <Paragraph style={styles.senderEmail}>{item.senderEmail}</Paragraph>
            )}
            <Paragraph style={styles.messageText}>{item.text}</Paragraph>
            <Paragraph style={styles.timestamp}>
              {item.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Paragraph>
          </Card.Content>
        </Card>
      </View>
    );
  };



  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Paragraph>Loading chat...</Paragraph>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <Title style={styles.title}>Chat - {jobTitle}</Title>
          <Paragraph style={styles.subtitle}>Chatting with: {otherUserEmail}</Paragraph>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          onLayout={() => flatListRef.current?.scrollToEnd()}
        />

        <View style={styles.inputContainer}>
          <TextInput
            mode="outlined"
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            style={styles.textInput}
            multiline
            maxLength={500}
          />
          <Button mode="contained" onPress={sendMessage} style={styles.sendButton}>
            Send
          </Button>
        </View>

        {/* Approval button for job posters */}
        {currentUser.uid !== otherUserId && (
          <View style={styles.approvalContainer}>
            <Button
              mode="outlined"
              onPress={approveSeeker}
              style={styles.approveButton}
              color="#4CAF50"
            >
              Approve Seeker
            </Button>
          </View>
        )}
      </KeyboardAvoidingView>


    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    flex: 1,
    padding: 10,
  },
  messageContainer: {
    marginVertical: 5,
    maxWidth: width * 0.8,
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageCard: {
    elevation: 2,
  },
  ownMessageCard: {
    backgroundColor: '#9050ebff',
  },
  otherMessageCard: {
    backgroundColor: '#fff',
  },
  messageContent: {
    padding: 8,
  },
  senderEmail: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    marginRight: 10,
  },
  sendButton: {
    alignSelf: 'flex-end',
  },

  approvalContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  approveButton: {
    marginTop: 10,
  },
});

export default ChatScreen;
