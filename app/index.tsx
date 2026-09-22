import { Redirect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenCard } from '@/components/screen-card';
import { Palette } from '@/constants/palette';
import {
  CaregiverProfile,
  getCaregiverProfile,
  hasSeenOrientation,
  isSignedInThisSession,
} from '@/services/storage';

type Status = 'checking' | 'needsIntake' | 'needsOrientation' | 'ready';

export default function HomeScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('checking');
  const [profile, setProfile] = useState<CaregiverProfile | null>(null);

  useEffect(() => {
    async function checkStatus() {
      if (!isSignedInThisSession()) {
        setStatus('needsIntake');
        return;
      }

      if (!(await hasSeenOrientation())) {
        setStatus('needsOrientation');
        return;
      }

      setProfile(await getCaregiverProfile());
      setStatus('ready');
    }

    checkStatus();
  }, []);

  // Using <Redirect> instead of an imperative router.replace() here — this
  // effect can resolve before expo-router's root layout has finished
  // mounting, and calling router.replace() that early throws. <Redirect>
  // is designed to be rendered declaratively and handles that timing itself.
  if (status === 'needsIntake') {
    return <Redirect href="/intake" />;
  }

  if (status === 'needsOrientation') {
    return <Redirect href="/welcome" />;
  }

  if (status !== 'ready' || !profile) {
    return null;
  }

  return (
    <ScreenCard>
      <View style={styles.content}>
        <Text style={styles.greeting}>Hi, {profile.caregiverFirstName}</Text>
        <Text style={styles.subGreeting}>
          Ready for today’s check-in about {profile.recipientName}?
        </Text>
      </View>

      <View style={styles.spacer} />

      <TouchableOpacity style={styles.button} onPress={() => router.push('/checkin/voice-self')}>
        <Text style={styles.buttonText}>Start today’s check-in</Text>
      </TouchableOpacity>
    </ScreenCard>
  );
}

const styles = StyleSheet.create({
  content: {
    marginTop: 20,
  },
  greeting: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Palette.textPrimary,
    marginBottom: 10,
  },
  subGreeting: {
    fontSize: 16,
    color: Palette.textSecondary,
    lineHeight: 22,
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
