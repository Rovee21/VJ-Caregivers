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
import { Palette } from '@/constants/palette';
import { CheckInHistoryEntry, getCheckInHistory } from '../services/api';
import { getCaregiverId } from '../services/storage';

interface MarkedDates {
  [date: string]: {
    marked: boolean;
    dotColor: string;
    selected?: boolean;
    selectedColor?: string;
  };
}

export default function HistoryScreen() {
  const [entries, setEntries] = useState<CheckInHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateEntries, setSelectedDateEntries] = useState<CheckInHistoryEntry[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount only
  }, []);

  const fetchHistory = async () => {
    try {
      const caregiverId = await getCaregiverId();

      if (!caregiverId) {
        setEntries([]);
        return;
      }

      const history = await getCheckInHistory(caregiverId);
      setEntries(history);
      markDates(history);
    } catch (error) {
      console.error('Error fetching history:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const markDates = (history: CheckInHistoryEntry[]) => {
    const marked: MarkedDates = {};

    history.forEach((entry) => {
      const date = entry.submittedAt.split('T')[0];
      marked[date] = { marked: true, dotColor: Palette.primary };
    });

    setMarkedDates(marked);
  };

  const handleDayPress = (day: { dateString: string }) => {
    const dateEntries = entries.filter((entry) => entry.submittedAt.split('T')[0] === day.dateString);

    if (dateEntries.length === 0) {
      return;
    }

    setSelectedDate(day.dateString);
    setSelectedDateEntries(dateEntries);
    setModalVisible(true);

    const updatedMarked = { ...markedDates };
    Object.keys(updatedMarked).forEach((date) => {
      updatedMarked[date].selected = date === day.dateString;
      updatedMarked[date].selectedColor = date === day.dateString ? Palette.badgeBackground : undefined;
    });
    setMarkedDates(updatedMarked);
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Palette.primary} />
        <Text style={styles.loadingText}>Loading your history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Check-in History</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{entries.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{Object.keys(markedDates).length}</Text>
            <Text style={styles.statLabel}>Days</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.calendarContainer}>
          <Text style={styles.instructionText}>Tap any date with a dot to view check-ins</Text>

          <Calendar
            markingType="dot"
            markedDates={markedDates}
            onDayPress={handleDayPress}
            theme={{
              todayTextColor: Palette.primary,
              selectedDayBackgroundColor: Palette.primary,
              dotColor: Palette.primary,
              selectedDotColor: '#FFFFFF',
              arrowColor: Palette.primary,
              monthTextColor: Palette.textPrimary,
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
            }}
            style={styles.calendar}
          />

          {entries.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No check-ins yet</Text>
              <Text style={styles.emptySubtext}>Complete today’s check-in to see it here.</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedDate && formatDate(selectedDate)}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {selectedDateEntries.map((entry) => (
                <View key={entry.id} style={styles.entryCard}>
                  <Text style={styles.timeText}>🕐 {formatTime(entry.submittedAt)}</Text>
                  <Text style={styles.label}>
                    Emotions: {entry.emotions.length > 0 ? entry.emotions.join(', ') : 'Not recorded'}
                  </Text>
                  <Text style={styles.label}>Stress: {entry.stressLevel}/10</Text>
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
  container: { flex: 1, backgroundColor: Palette.cardBackground },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Palette.cardBackground },
  loadingText: { marginTop: 10, fontSize: 16, color: Palette.textSecondary },
  header: { backgroundColor: Palette.primary, padding: 20, paddingTop: 50, paddingBottom: 20 },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: 'white', marginBottom: 15, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 15, justifyContent: 'center' },
  statBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  statLabel: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', marginTop: 2 },
  scrollView: { flex: 1 },
  calendarContainer: { padding: 20 },
  instructionText: { fontSize: 15, color: Palette.textSecondary, textAlign: 'center', marginBottom: 15, fontWeight: '500' },
  calendar: { borderRadius: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, marginTop: 20 },
  emptyText: { fontSize: 17, fontWeight: '600', color: Palette.textPrimary, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: Palette.textSecondary },
  backButton: { marginHorizontal: 20, marginBottom: 20, marginTop: 20, backgroundColor: Palette.primary, padding: 16, borderRadius: 30, alignItems: 'center' },
  backButtonText: { color: 'white', fontSize: 18, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Palette.cardBackground, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Palette.border },
  modalTitle: { fontSize: 19, fontWeight: 'bold', color: Palette.textPrimary },
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: Palette.badgeBackground, justifyContent: 'center', alignItems: 'center' },
  closeButtonText: { fontSize: 18, color: Palette.textPrimary, fontWeight: 'bold' },
  modalScrollView: { padding: 15 },
  entryCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 15, marginBottom: 12, gap: 6 },
  timeText: { fontSize: 15, color: Palette.textSecondary, fontWeight: '600', marginBottom: 4 },
  label: { fontSize: 15, color: Palette.textPrimary },
});
