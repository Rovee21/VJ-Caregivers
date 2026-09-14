import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { API_BASE_URL } from '../services/api';
import { getParticipantId } from '../services/storage';

interface Recording {
  id: number;
  created_at: string;
  duration: number;
  emotion: string;
  stress_level: number;
  question: string;
}

interface MarkedDates {
  [date: string]: {
    marked: boolean;
    dotColor: string;
    selected?: boolean;
    selectedColor?: string;
  };
}

export default function HistoryScreen() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateRecordings, setSelectedDateRecordings] = useState<Recording[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const participantId = await getParticipantId();

      if (!participantId) {
        console.error('No participant ID found');
        setRecordings([]);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/participants/${participantId}/recordings/`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch recordings');
      }

      const data = await response.json();

      if (data.recordings && Array.isArray(data.recordings)) {
        setRecordings(data.recordings);
        markDatesWithRecordings(data.recordings);
      } else {
        setRecordings([]);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      setRecordings([]);
    } finally {
      setLoading(false);
    }
  };

  const markDatesWithRecordings = (recordingsList: Recording[]) => {
    const marked: MarkedDates = {};

    recordingsList.forEach((recording) => {
      const date = recording.created_at.split('T')[0]; // Get YYYY-MM-DD
      marked[date] = {
        marked: true,
        dotColor: '#007AFF',
      };
    });

    setMarkedDates(marked);
  };

  const handleDayPress = (day: { dateString: string }) => {
    const dateRecordings = recordings.filter(
      (recording) => recording.created_at.split('T')[0] === day.dateString
    );

    if (dateRecordings.length > 0) {
      setSelectedDate(day.dateString);
      setSelectedDateRecordings(dateRecordings);
      setModalVisible(true);

      // Update marked dates to highlight selected date
      const updatedMarked = { ...markedDates };
      Object.keys(updatedMarked).forEach((date) => {
        updatedMarked[date].selected = date === day.dateString;
        updatedMarked[date].selectedColor = date === day.dateString ? '#E3F2FD' : undefined;
      });
      setMarkedDates(updatedMarked);
    }
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // Local date, no UTC shift
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getEmotionEmoji = (emotion: string) => {
    const emojiMap: { [key: string]: string } = {
      Happy: '😊',
      Sad: '😢',
      Anxious: '😰',
      Angry: '😠',
      Calm: '😌',
      Excited: '🤗',
      Neutral: '😐',
    };
    return emojiMap[emotion] || '😐';
  };

  const getStressColor = (level: number) => {
    if (level <= 3) return '#4CAF50';
    if (level <= 6) return '#FF9800';
    return '#F44336';
  };

  const getTotalRecordings = () => recordings.length;

  const getDaysWithRecordings = () => Object.keys(markedDates).length;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recording History</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{getTotalRecordings()}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{getDaysWithRecordings()}</Text>
            <Text style={styles.statLabel}>Days</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <View style={styles.calendarContainer}>
          <Text style={styles.instructionText}>
            Tap any date with a dot to view recordings
          </Text>

          <Calendar
            markingType="dot"
            markedDates={markedDates}
            onDayPress={handleDayPress}
            theme={{
              todayTextColor: '#007AFF',
              selectedDayBackgroundColor: '#007AFF',
              dotColor: '#007AFF',
              selectedDotColor: '#FFFFFF',
              arrowColor: '#007AFF',
              monthTextColor: '#333',
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
            style={styles.calendar}
          />

          {recordings.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No recordings yet</Text>
              <Text style={styles.emptySubtext}>
                Start recording to see your history!
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal for selected date recordings */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDate && formatDate(selectedDate)}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {selectedDateRecordings.map((recording) => (
                <View key={recording.id} style={styles.recordingCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.timeText}>
                      🕐 {formatTime(recording.created_at)}
                    </Text>
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationText}>
                        ⏱️ {formatDuration(recording.duration)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.emotionRow}>
                      <Text style={styles.label}>Emotion:</Text>
                      <View style={styles.emotionBadge}>
                        <Text style={styles.emotionEmoji}>
                          {getEmotionEmoji(recording.emotion)}
                        </Text>
                        <Text style={styles.emotionText}>
                          {recording.emotion || 'Not recorded'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.stressRow}>
                      <Text style={styles.label}>Stress:</Text>
                      <View style={styles.stressIndicator}>
                        <View
                          style={[
                            styles.stressBar,
                            {
                              width: `${(recording.stress_level || 0) * 10}%`,
                              backgroundColor: getStressColor(
                                recording.stress_level || 0
                              ),
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.stressValue,
                            {
                              color: getStressColor(recording.stress_level || 0),
                            },
                          ]}
                        >
                          {recording.stress_level || 'N/A'}/10
                        </Text>
                      </View>
                    </View>

                    {/* {recording.question && (
                      <View style={styles.questionRow}>
                        <Text style={styles.questionLabel}>Question:</Text>
                        <Text style={styles.questionText} numberOfLines={2}>
                          {recording.question}
                        </Text>
                      </View>
                    )} */}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
    justifyContent: 'center',
  },
  statBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
    paddingBottom: 80,
  },
  calendarContainer: {
    padding: 20,
  },
  instructionText: {
    fontSize: 17,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '500',
  },
  calendar: {
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
    fontWeight: 'bold',
  },
  modalScrollView: {
    padding: 15,
  },
  recordingCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  timeText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  durationBadge: {
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  durationText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  cardBody: {
    gap: 10,
  },
  emotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  emotionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 90,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  emotionEmoji: {
    fontSize: 18,
  },
  emotionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  stressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stressIndicator: {
    flex: 1,
    marginLeft: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stressBar: {
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  stressValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  questionRow: {
    marginTop: 4,
  },
  questionLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  questionText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  backButton: {
    // position: 'absolute',
    marginHorizontal: 20,  // instead of left/right: 20
    marginBottom: 20,
    marginTop: 20,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
});