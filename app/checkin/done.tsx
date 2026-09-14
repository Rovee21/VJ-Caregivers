import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenCard } from '@/components/screen-card';
import { ScreenHeader } from '@/components/screen-header';
import { Palette } from '@/constants/palette';
import { refreshInactivityReminderAfterSubmission } from '@/services/notifications';
import {
  clearThankYouTimeoutState,
  getCaregiverProfile,
  hasThankYouTimedOut,
  setThankYouBackgroundTimestamp,
} from '@/services/storage';

const DONE_SCREEN_TIMEOUT_MS = 5 * 60 * 1000;

export default function DoneScreen() {
  const router = useRouter();
  const [caregiverFirstName, setCaregiverFirstName] = useState('');
  const [entryNumber, setEntryNumber] = useState(0);
  const [targetEntries, setTargetEntries] = useState(12);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    getCaregiverProfile().then((profile) => {
      if (profile) {
        setCaregiverFirstName(profile.caregiverFirstName);
        setEntryNumber(profile.completedEntryCount);
        setTargetEntries(profile.targetEntryCount);
      }
    });

    refreshInactivityReminderAfterSubmission();
    clearThankYouTimeoutState();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === 'background' || nextState === 'inactive') {
        await setThankYouBackgroundTimestamp(Date.now());
        return;
      }

      if ((previousState === 'background' || previousState === 'inactive') && nextState === 'active') {
        const didTimeout = await hasThankYouTimedOut(DONE_SCREEN_TIMEOUT_MS);

        if (didTimeout) {
          await clearThankYouTimeoutState();
          router.replace('/');
        }
      }
    });

    return () => subscription.remove();
  }, [router]);

  return (
    <ScreenCard>
      <ScreenHeader rightText="6 of 6" />

      <View style={styles.content}>
        <View style={styles.checkCircle}>
          <Text style={styles.checkmark}>✓</Text>
        </View>

        <Text style={styles.title}>All set for today</Text>
        <Text style={styles.subtitle}>
          Thanks, {caregiverFirstName || 'friend'} — that’s entry {entryNumber} of {targetEntries}.
        </Text>
      </View>

      <View style={styles.spacer} />

      <TouchableOpacity style={styles.button} onPress={() => router.replace('/history')}>
        <Text style={styles.buttonText}>View history</Text>
      </TouchableOpacity>
    </ScreenCard>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    marginTop: 30,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.badgeBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkmark: {
    fontSize: 30,
    color: Palette.accent,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Palette.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: Palette.textSecondary,
    textAlign: 'center',
  },
  spacer: {
    flex: 1,
    minHeight: 40,
  },
  button: {
    backgroundColor: Palette.primary,
    padding: 18,
    borderRadius: 30,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Palette.primaryText,
    textAlign: 'center',
  },
});
