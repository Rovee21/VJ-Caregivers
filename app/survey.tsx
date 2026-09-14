import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, AppState, AppStateStatus, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { cancelInactivityReminder, refreshInactivityReminderAfterSubmission } from '../services/notifications';
import { saveSurvey } from '../services/api';
import { clearAllParticipantData, clearThankYouTimeoutState, getParticipantId, hasThankYouTimedOut, setThankYouBackgroundTimestamp } from '../services/storage';

const THANK_YOU_TIMEOUT_MS = 5 * 60 * 1000;

export default function SurveyScreen() {
  const { recordingId } = useLocalSearchParams<{ recordingId?: string }>();
  const router = useRouter();
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const emotions = [
    { label: 'Happy', emoji: '😊', color: '#FFD93D' },
    { label: 'Sad', emoji: '😢', color: '#6BCB77' },
    { label: 'Angry', emoji: '😠', color: '#FF6B6B' },
    { label: 'Anxious', emoji: '😰', color: '#4D96FF' },
    { label: 'Calm', emoji: '😌', color: '#95E1D3' },
    { label: 'Excited', emoji: '🤩', color: '#FFA07A' },
    { label: 'Tired', emoji: '😴', color: '#B4A7D6' },
  ];

  const stressLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (!showThankYou) {
        return;
      }

      if (nextState === 'background' || nextState === 'inactive') {
        await setThankYouBackgroundTimestamp(Date.now());
        return;
      }

      if ((previousState === 'background' || previousState === 'inactive') && nextState === 'active') {
        const didTimeout = await hasThankYouTimedOut(THANK_YOU_TIMEOUT_MS);

        if (didTimeout) {
          await clearThankYouTimeoutState();
          setShowThankYou(false);
          setSelectedEmotion(null);
          setStressLevel(null);
          router.replace('/');
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [showThankYou, router]);

  const handleConfirm = async () => {
    if (!selectedEmotion || stressLevel === null) {
        Alert.alert('Incomplete', 'Please select both emotion and stress level');
        return;
    }

    try {
        // Save survey data to backend
        await saveSurvey({
        recording_id: parseInt(recordingId || '0'),
        emotion: selectedEmotion,
        stress_level: stressLevel,
        });

      await refreshInactivityReminderAfterSubmission();
      await clearThankYouTimeoutState();
      setShowThankYou(true);
    } catch (error) {
      Alert.alert('Save Failed', 'Could not save survey. Please try again.');
      console.error('Survey save error:', error);
    }
  };

  const handleDeleteRequestPress = () => {
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    if (isDeletingData) {
      return;
    }

    setShowDeleteModal(false);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeletingData(true);
      await getParticipantId();
      await cancelInactivityReminder();
      await clearAllParticipantData();
      setShowDeleteModal(false);
      Alert.alert('Deletion completed', 'Your data has been deleted.', [
        {
          text: 'OK',
          onPress: () => router.replace('/enroll'),
        },
      ]);
    } catch (error) {
      console.error('Delete flow error:', error);
      Alert.alert('Delete Failed', 'We could not delete your data right now. Please try again.');
    } finally {
      setIsDeletingData(false);
    }
  };

  const deleteModal = (
    <Modal
      animationType="fade"
      transparent
      visible={showDeleteModal}
      onRequestClose={handleCancelDelete}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Delete My Data</Text>
          <Text style={styles.modalText}>
            Are you sure you want to delete your data?
          </Text>
          <Text style={styles.modalListTitle}>This will permanently delete:</Text>
          <Text style={styles.modalListItem}>• Your account information</Text>
          <Text style={styles.modalListItem}>• Your voice recordings</Text>
          <Text style={styles.modalListItem}>• Your survey responses</Text>
          <Text style={styles.modalListItem}>• Related study data and metadata</Text>
          <Text style={styles.modalWarning}>This action cannot be undone.</Text>

          <TouchableOpacity
            style={[styles.modalPrimaryButton, isDeletingData && styles.modalButtonDisabled]}
            onPress={handleConfirmDelete}
            disabled={isDeletingData}
          >
            <Text style={styles.modalPrimaryButtonText}>
              {isDeletingData ? 'Deleting...' : 'Yes, Delete My Data'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalSecondaryButton}
            onPress={handleCancelDelete}
            disabled={isDeletingData}
          >
            <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (showThankYou) {
    return (
      <>
        <View style={styles.thankYouContainer}>
          <Text style={styles.checkmark}>✓</Text>
          <Text style={styles.thankYouTitle}>All done!</Text>
          <Text style={styles.thankYouText}>
            Your recording is safe!
          </Text>
          <Text style={styles.thankYouSubtext}>
            Please close the app and have a wonderful day!!
          </Text>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={async () => {
              await clearThankYouTimeoutState();
              router.replace('/');
            }}
          >
            <Text style={styles.homeButtonText}>Go to Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
          style={styles.historyButton}
          onPress={async () => {
            await clearThankYouTimeoutState();
            router.push('/history' as any);
          }}
          >
          <Text style={styles.historyButtonText}>📊 View History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteRequestPress}
          >
            <Text style={styles.deleteButtonText}>Delete My Data</Text>
          </TouchableOpacity>
        </View>
        {deleteModal}
      </>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Emotion Selection */}
        <Text style={styles.sectionTitle}>What was your feeling when it happened?</Text>
        
        <View style={styles.emotionGrid}>
          {emotions.map((emotion) => (
            <TouchableOpacity
              key={emotion.label}
              style={[
                styles.emotionButton,
                { backgroundColor: emotion.color },
                selectedEmotion === emotion.label && styles.emotionButtonSelected,
              ]}
              onPress={() => setSelectedEmotion(emotion.label)}
            >
              <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
              <Text style={styles.emotionLabel}>{emotion.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stress Level */}
        <Text style={styles.sectionTitle}>Rate your stress level</Text>
        <Text style={styles.stressSubtitle}>1 = Very Low, 10 = Very High</Text>
        
        <View style={styles.stressGrid}>
          {stressLevels.map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.stressButton,
                stressLevel === level && styles.stressButtonSelected,
              ]}
              onPress={() => setStressLevel(level)}
            >
              <Text
                style={[
                  styles.stressText,
                  stressLevel === level && styles.stressTextSelected,
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {selectedEmotion && stressLevel !== null && (
        <View style={styles.confirmFooter}>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmText}>✓ Confirm</Text>
          </TouchableOpacity>
        </View>
      )}

      {deleteModal}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E6',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  stressSubtitle: {
    fontSize: 22,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  emotionButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
  },
  emotionButtonSelected: {
    borderWidth: 4,
    borderColor: '#333',
  },
  emotionEmoji: {
    fontSize: 40,
    marginBottom: 5,
  },
  emotionLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  stressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  stressButton: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 15,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  stressButtonSelected: {
    backgroundColor: '#FFB366',
    borderWidth: 3,
    borderColor: '#333',
  },
  stressText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
  },
  stressTextSelected: {
    color: '#333',
  },
  confirmFooter: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
    backgroundColor: '#FFF5E6',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    padding: 20,
    borderRadius: 30,
  },
  confirmText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  thankYouContainer: {
    flex: 1,
    backgroundColor: '#FFF5E6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  checkmark: {
    fontSize: 120,
    color: '#4CAF50',
    marginBottom: 30,
  },
  thankYouTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  thankYouText: {
    fontSize: 28,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  thankYouSubtext: {
    fontSize: 25,
    color: '#888',
    textAlign: 'center',
  },
  homeButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  homeButtonText: {
    fontSize: 20,
    color: 'white',
    fontWeight: '600',
  },
  historyButton: {
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  historyButtonText: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#A63D40',
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    marginTop: 15,
    padding: 12,
  },
  deleteButtonText: {
    color: '#7A1F24',
    fontSize: 20,
    fontWeight: '700',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFF5E6',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 420,
  },
  modalTitle: {
    color: '#333',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 14,
    textAlign: 'center',
  },
  modalText: {
    color: '#333',
    fontSize: 20,
    lineHeight: 28,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalListTitle: {
    color: '#333',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  modalListItem: {
    color: '#333',
    fontSize: 19,
    lineHeight: 28,
    marginBottom: 6,
  },
  modalWarning: {
    color: '#7A1F24',
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 20,
    marginTop: 10,
    textAlign: 'center',
  },
  modalPrimaryButton: {
    backgroundColor: '#A63D40',
    borderRadius: 12,
    padding: 16,
  },
  modalPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalSecondaryButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#333',
    borderRadius: 12,
    borderWidth: 2,
    marginTop: 12,
    padding: 16,
  },
  modalSecondaryButtonText: {
    color: '#333',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.7,
  },
});
