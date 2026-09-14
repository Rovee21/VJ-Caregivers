import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChipItem, MultiSelectChipGrid } from '@/components/multi-select-chip-grid';
import { ScreenCard } from '@/components/screen-card';
import { ScreenHeader } from '@/components/screen-header';
import { Palette } from '@/constants/palette';
import { useCheckIn } from './_layout';

const EMOTIONS: ChipItem[] = [
  { key: 'happy_joyful', label: 'Happy\njoyful', emoji: '😊' },
  { key: 'calm_relaxed', label: 'Calm\nrelaxed', emoji: '😌' },
  { key: 'sad_down', label: 'Sad\ndown', emoji: '😢' },
  { key: 'anxious_worried', label: 'Anxious\nworried', emoji: '😰' },
  { key: 'frustrated_angry', label: 'Frustrated\nangry', emoji: '😠' },
  { key: 'tired_drained', label: 'Tired\ndrained', emoji: '😴' },
  { key: 'okay_neutral', label: 'Okay / neutral', emoji: '😐' },
];

export default function EmotionsScreen() {
  const router = useRouter();
  const { emotions, setEmotions } = useCheckIn();

  const toggle = (key: string) => {
    setEmotions(
      emotions.includes(key) ? emotions.filter((item) => item !== key) : [...emotions, key]
    );
  };

  return (
    <ScreenCard>
      <ScreenHeader label="About you" rightText="2 of 6" />

      <Text style={styles.title}>Which emotions fit right now?</Text>
      <Text style={styles.subtitle}>Tap any that apply.</Text>

      <MultiSelectChipGrid
        items={EMOTIONS}
        selected={emotions}
        onToggle={toggle}
        layout="grid"
        lastItemFullWidth
      />

      <View style={styles.spacer} />

      <TouchableOpacity
        style={[styles.button, emotions.length === 0 && styles.buttonDisabled]}
        onPress={() => router.push('/checkin/stress')}
        disabled={emotions.length === 0}
      >
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
  spacer: {
    flex: 1,
    minHeight: 20,
  },
  button: {
    backgroundColor: Palette.primary,
    padding: 18,
    borderRadius: 30,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Palette.primaryText,
    textAlign: 'center',
  },
});
