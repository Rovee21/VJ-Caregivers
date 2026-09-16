import { requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

export function formatRecordingTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Shared start/stop/timer logic for any screen that records a voice clip
// capped at a fixed duration — used by both the "about you" and "about the
// recipient" check-in steps so the recording logic only lives in one place.
export function useVoiceRecorder(maxSeconds: number) {
  const audioRecorder = useAudioRecorder({
    extension: '.mp4',
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
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    requestRecordingPermissionsAsync().then((permission) => {
      if (!permission.granted) {
        Alert.alert('Permission needed', 'We need microphone access to record.');
      }
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  async function start() {
    try {
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await audioRecorder.prepareToRecordAsync();
      await audioRecorder.record();
      setIsRecording(true);
      setRecordingTime(0);
      setRecordedUri(null);

      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev + 1 >= maxSeconds) {
            stop();
            return maxSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  }

  async function stop() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    try {
      await audioRecorder.stop();
      setIsRecording(false);

      const uri = audioRecorder.uri;
      if (!uri) {
        Alert.alert('Error', 'Recording failed - no file saved');
        return;
      }

      setRecordedUri(uri);
    } catch (error) {
      console.error('Failed to stop recording', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  }

  function reset() {
    setRecordingTime(0);
    setRecordedUri(null);
  }

  return {
    isRecording,
    recordingTime,
    recordedUri,
    start,
    stop,
    reset,
    formattedTime: formatRecordingTime(recordingTime),
    formattedMaxTime: formatRecordingTime(maxSeconds),
  };
}
