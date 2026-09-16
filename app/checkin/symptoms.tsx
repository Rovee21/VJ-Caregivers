import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MultiSelectChipGrid } from '@/components/multi-select-chip-grid';
import { ScreenCard } from '@/components/screen-card';
import { ScreenHeader } from '@/components/screen-header';
import { Palette } from '@/constants/palette';
import { SYMPTOM_CONFIG } from '@/constants/symptoms';
import { CareRecipientCondition } from '@/services/api';
import { getCaregiverProfile } from '@/services/storage';
import { useCheckIn } from './_layout';

export default function SymptomsScreen() {
  const router = useRouter();
  const { symptoms, setSymptoms, setSymptomsSkipped } = useCheckIn();
  const [recipientName, setRecipientName] = useState('');
  const [condition, setCondition] = useState<CareRecipientCondition>('dementia');

  useEffect(() => {
    getCaregiverProfile().then((profile) => {
      if (profile) {
        setRecipientName(profile.recipientName);
        setCondition(profile.recipientCondition);
      }
    });
  }, []);

  const config = SYMPTOM_CONFIG[condition];

  const toggle = (key: string) => {
    setSymptoms(symptoms.includes(key) ? symptoms.filter((item) => item !== key) : [...symptoms, key]);
  };

  const goNext = () => router.push('/checkin/voice-recipient');

  const handleSkip = () => {
    setSymptoms([]);
    setSymptomsSkipped(true);
    goNext();
  };

  const handleNext = () => {
    setSymptomsSkipped(false);
    goNext();
  };

  return (
    <ScreenCard>
      <ScreenHeader label={`About ${recipientName}`} rightText="4 of 6" />

      <Text style={styles.title}>Did {recipientName} show any of these today?</Text>
      <Text style={styles.subtitle}>Tap all that apply. ({config.label} arm)</Text>

      <MultiSelectChipGrid
        items={config.symptoms}
        selected={symptoms}
        onToggle={toggle}
        layout="wrap"
      />

      <TouchableOpacity onPress={handleSkip}>
        <Text style={styles.skipText}>Skip — nothing notable today</Text>
      </TouchableOpacity>

      <View style={styles.spacer} />

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </ScreenCard>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Palette.textPrimary,
    marginBottom: 4,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    color: Palette.textSecondary,
    marginBottom: 18,
  },
  skipText: {
    fontSize: 15,
    color: Palette.accent,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  spacer: {
    flex: 1,
    minHeight: 20,
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
