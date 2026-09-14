import { requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { uploadRecording } from '../services/api';
import { getParticipantId } from '../services/storage';

export default function RecordingScreen() {
//   const audioRecorder = useAudioRecorder({
//     extension: '.m4a',
//     sampleRate: 44100,
  const router = useRouter();
  const audioRecorder = useAudioRecorder({
    extension: '.m4a',
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    android: {
      outputFormat: 'mpeg4',
      audioEncoder: 'aac',
    },
    ios: {
      audioQuality: 127,
    },
    web: {
      mimeType: 'audio/webm',
    },
  });
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [intervalId, setIntervalId] = useState<number | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [savedUri, setSavedUri] = useState<string | null>(null);

  // Placeholder question
  const questionOfDay = "What was your most memorable event today? Please share by recording it";

  useEffect(() => {
    // Request permission on mount
    requestPermission();
  }, []);

  async function requestPermission() {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'We need microphone access to record.');
      }
    } catch (error) {
      console.error('Permission error:', error);
    }
  }

  async function testConnection() {
    try {
        const response = await fetch('https://9ramak72jh.us-east-2.awsapprunner.com/api/recordings/');
        //const response = await fetch('https://web-production-14cc6.up.railway.app/api/recordings/');
        //const response = await fetch('http://10.3.21.241:8000/api/recordings/');
        //const response = await fetch('https://selectable-changelessly-sharilyn.ngrok-free.dev/api/recordings/');
        const data = await response.json();
        Alert.alert('Success!', `Connected! Got ${data.length} recordings`);
    } catch (error) {
        Alert.alert('Connection Failed', String(error));
    }
  }

  async function startRecording() {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });

      await audioRecorder.prepareToRecordAsync();
      await audioRecorder.record();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      const id = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 300) { // 5 minutes
            stopRecording();
            return 300;
          }
          return prev + 1;
        });
      }, 1000);
      
      setIntervalId(id);
    } catch (err) {
      Alert.alert('Error', 'Failed to start recording');
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    try {
        if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
        }

        // Stop recording
        await audioRecorder.stop();
        setIsRecording(false);
        
        // Debug: Check all recorder properties
        console.log('AudioRecorder state after stop:', {
            isRecording: audioRecorder.isRecording,
            uri: audioRecorder.uri,
            currentTime: audioRecorder.currentTime,
            id: audioRecorder.id
        });
        
        // Get URI from the recorder object
        const uri = audioRecorder.uri;
        
        console.log('Recording stopped, URI:', uri);
        
        if (!uri) {
        Alert.alert('Error', 'Recording failed - no file saved');
        return;
        }
        
        setSavedUri(uri);
        setShowConfirmation(true);
    } catch (err) {
        console.error('Failed to stop recording', err);
        Alert.alert('Error', 'Failed to stop recording');
    }
  }

  function handleReRecord() {
    setShowConfirmation(false);
    setRecordingTime(0);
    setSavedUri(null);
  }

  async function handleSubmit() {
    setShowConfirmation(false);
    
    try {
        // Get participant ID
        const participantId = await getParticipantId();
        if (!participantId) {
            Alert.alert('Error', 'Participant information not found. Please re-enroll.');
            return;
        }
        
        // Upload recording to backend
        const recordingId = await uploadRecording({
        audio_file: savedUri,
        question: questionOfDay,
        duration: recordingTime,
        participant_id: participantId,
        });
        
        // Navigate to survey with recording ID
        router.replace({ 
            pathname: '/survey', 
            params: { recordingId: recordingId.toString() } 
        });
    } catch (error) {
        Alert.alert('Upload Failed', 'Could not save recording. Please try again.');
        console.error('Upload error:', error);
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function formatDate(): string {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    };
    return today.toLocaleDateString('en-US', options);
  }

  const maxTime = 300; // 5 minutes

  return (
    // <View style={styles.container}>
    <ScrollView 
      contentContainerStyle={styles.scrollContainer}
      style={styles.container}
    >
        {/* Show confirmation dialog if recording stopped */}
        {showConfirmation ? (
        <View style={styles.confirmationContainer}>
            <Text style={styles.confirmTitle}>Recording Complete!</Text>
            <Text style={styles.confirmDuration}>
            Duration: {formatTime(recordingTime)}
            </Text>
            <Text style={styles.confirmQuestion}>
            Are you sure you want to submit this recording?
            </Text>
            
            <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
            >
            <Text style={styles.submitButtonText}>✓ Yes, Submit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
            style={styles.reRecordButton}
            onPress={handleReRecord}
            >
            <Text style={styles.reRecordButtonText}>🔄 No, Record Again</Text>
            </TouchableOpacity>
        </View>
        ) : (
        <>
            {/* Date Header */}
            <Text style={styles.dateText}>{formatDate()}</Text>

            {/* Question of the Day */}
            <View style={styles.questionContainer}>
            <Text style={styles.questionText}>{questionOfDay}</Text>
            </View>

            {/* Add this new instruction text */}
            <Text style={styles.instructionSubtext}>
              Please find a quiet place to record your audio.
            </Text>

            {/* Recording Button */}
            <View style={styles.recordingArea}>
            <TouchableOpacity 
                style={[
                styles.recordButton,
                isRecording && styles.recordButtonActive
                ]}
                onPress={isRecording ? stopRecording : startRecording}
                activeOpacity={0.8}
            >
                <Text style={styles.micIcon}>🎙️</Text>
                <Text style={styles.recordButtonText}>
                {isRecording ? 'RECORDING...\nTAP TO STOP' : 'PRESS AND LET GO\nTO RECORD'}
                </Text>
            </TouchableOpacity>

            {/* Timer Display */}
            <Text style={styles.timerText}>
                {formatTime(recordingTime)} / {formatTime(maxTime)}
            </Text>

            {/* Test Connection Button */}
            {/* <TouchableOpacity 
              style={styles.submitButton}
              onPress={testConnection}
            >
              <Text style={styles.submitButtonText}>TEST CONNECTION</Text>
            </TouchableOpacity>
            
            {isRecording && (
                <Text style={styles.instructionText}>Tap to stop.</Text>
            )} */}
            </View>

            {/* <View style={styles.spacer} /> */}
        </>
        )}
    </ScrollView>
    // </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E6',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  dateText: {
    fontSize: 27,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
    color: '#333',
  },
  questionContainer: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionText: {
    fontSize: 28,
    textAlign: 'center',
    color: '#333',
    lineHeight: 28,
    fontWeight: '500',
  },
  recordingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 350,
  },
  instructionSubtext: {
    fontSize: 22,
    color: '#666',
    textAlign: 'center',
    // minHeight: 350,
    // marginBottom: 30,
    // marginTop: 15,
    fontStyle: 'italic',
  },
  recordButton: {
    width: 240,
    height: 240,
    borderRadius: 125,
    backgroundColor: '#FFB366',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  micIcon: {
    fontSize: 75,
    marginBottom: 15,
  },
  recordButtonText: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    lineHeight: 20,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 25,
    color: '#333',
  },
  // instructionText: {
  //   fontSize: 18,
  //   color: '#666',
  //   marginTop: 15,
  // },
  // spacer: {
  //   height: 40,
  // },
  confirmationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    minHeight: 500,
  },
  confirmTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmDuration: {
    fontSize: 25,
    color: '#666',
    marginBottom: 30,
  },
  confirmQuestion: {
    fontSize: 25,
    color: '#333',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 28,
    paddingHorizontal: 10,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 22,
    borderRadius: 30,
    width: '100%',
    marginBottom: 15,
  },
  submitButtonText: {
    fontSize: 25,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  reRecordButton: {
    backgroundColor: '#FFB366',
    padding: 22,
    borderRadius: 30,
    width: '100%',
  },
  reRecordButtonText: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
});