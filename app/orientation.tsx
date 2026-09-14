import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenCard } from '@/components/screen-card';
import { ScreenHeader } from '@/components/screen-header';
import { Palette } from '@/constants/palette';
import { markOrientationSeen } from '@/services/storage';

const STEPS = ['Tell us about your day (voice)', 'A few quick taps', 'Done'];

export default function OrientationScreen() {
  const router = useRouter();

  const handleStart = async () => {
    await markOrientationSeen();
    router.replace('/');
  };

  return (
    <ScreenCard>
      <ScreenHeader label="Before you start" rightText="first launch" />

      <Text style={styles.title}>Most days take about{'\n'}2 minutes</Text>

      <View style={styles.stepList}>
        {STEPS.map((step, index) => (
          <View key={step} style={styles.stepRow}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.footnote}>Aim for at least 3 check-ins a week for 4 weeks.</Text>

      <View style={styles.spacer} />

      <TouchableOpacity style={styles.button} onPress={handleStart}>
        <Text style={styles.buttonText}>Got it, let’s start</Text>
      </TouchableOpacity>
    </ScreenCard>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Palette.textPrimary,
    marginBottom: 24,
    lineHeight: 30,
  },
  stepList: {
    marginBottom: 24,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Palette.badgeBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  stepNumberText: {
    color: Palette.badgeText,
    fontWeight: '700',
    fontSize: 13,
  },
  stepText: {
    fontSize: 16,
    color: Palette.textPrimary,
  },
  footnote: {
    fontSize: 14,
    color: Palette.textSecondary,
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
