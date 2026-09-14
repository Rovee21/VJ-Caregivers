import { Audio } from 'expo-av';
import { useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getParticipantFirstName, isEnrolled } from '../services/storage';

export default function WelcomeScreen() {
  const [checking, setChecking] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [participantName, setParticipantName] = useState('');
  const [hasMicPermission, setHasMicPermission] = useState(false);

  useEffect(() => {
    Audio.getPermissionsAsync().then(({ status }) => {
      setHasMicPermission(status === 'granted');
    });
  }, []);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    checkEnrollment();
  }, []);

  async function checkEnrollment() {
    const isUserEnrolled = await isEnrolled();
    setEnrolled(isUserEnrolled);
    setChecking(false);

    if (!isUserEnrolled && segments[0] !== 'enroll') {
      router.replace('/enroll');
      return; // stop here, nothing else needed yet
    }

    // Enrolled — always fetch name whether new or returning
    const firstName = await getParticipantFirstName();
    setParticipantName(firstName || '');
  }

  if (checking) {
    return null; // Or loading screen
  }

  const handleContinue = () => {
    router.replace('/recording');
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContainer}
      style={styles.container}
    >
      {/* Header - Fixed spacing from top */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>🎤 Voice Journal</Text>
      </View>
      
      {/* Main Content - Centered */}
      <View style={styles.content}>
        {participantName ? (
          <Text style={styles.greeting}>Welcome, {participantName}!</Text>
        ) : (
          <Text style={styles.greeting}>Welcome!</Text>
        )}
        
        <Text style={styles.subGreeting}>Let's get started!</Text>
        
        {/* Microphone Icon */}
        <Text style={styles.micIcon}>🎙️</Text>
        
        {/* <Text style={styles.permissionText}>
          We need access to your microphone to hear you{'\n'}
          (When the prompt appears, click "Allow")
        </Text> */}
        
        {!hasMicPermission && (
          <Text style={styles.permissionText}>
            We need access to your microphone to hear you{'\n'}
            (When the prompt appears, click "Allow")
          </Text>
        )}

        <Text style={styles.instructionText}>
          Please find a quiet location for recording
        </Text>
      </View>
      
      {/* Continue Button - Bottom */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>CONTINUE</Text>
        </TouchableOpacity>
      </View>

      {hasMicPermission && (
      <TouchableOpacity
      style={styles.historyButton}
      onPress={() => router.push('/history' as any)}
      >
      <Text style={styles.historyButtonText}>📊 View History</Text>
      </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E6',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subGreeting: {
    fontSize: 30,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  micIcon: {
    fontSize: 100,
    marginVertical: 30,
  },
  permissionText: {
    fontSize: 25,
    color: '#666',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  instructionText: {
    fontSize: 22,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#FFB366',
    padding: 20,
    borderRadius: 30,
  },
  buttonText: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  historyButton: {
    backgroundColor: '#dcb0d7ff',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  historyButtonText: {
    fontSize: 18,
    color: '#000d1aff',
    fontWeight: '600',
  },
});
