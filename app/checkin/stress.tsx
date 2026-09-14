import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenCard } from '@/components/screen-card';
import { ScreenHeader } from '@/components/screen-header';
import { Palette } from '@/constants/palette';
import { useCheckIn } from './_layout';

export default function StressScreen() {
  const router = useRouter();
  const { stressLevel, setStressLevel } = useCheckIn();

  return (
    <ScreenCard>
      <ScreenHeader label="About you" rightText="3 of 6" />

      <Text style={styles.title}>How stressed do you feel right now?</Text>

      <View style={styles.readoutArea}>
        <View style={styles.readoutRow}>
          <Text style={styles.readoutNumber}>{stressLevel}</Text>
          <Text style={styles.readoutDenominator}> / 10</Text>
        </View>

        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={10}
          step={1}
          value={stressLevel}
          onValueChange={setStressLevel}
          minimumTrackTintColor={Palette.accent}
          maximumTrackTintColor={Palette.border}
          thumbTintColor={Palette.accent}
        />

        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelText}>0 none</Text>
          <Text style={styles.sliderLabelText}>10 extreme</Text>
        </View>
      </View>

      <View style={styles.spacer} />

      <TouchableOpacity style={styles.button} onPress={() => router.push('/checkin/symptoms')}>
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
    marginBottom: 20,
    lineHeight: 28,
  },
  readoutArea: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 180,
  },
  readoutRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 24,
  },
  readoutNumber: {
    fontSize: 56,
    fontWeight: 'bold',
    color: Palette.textPrimary,
  },
  readoutDenominator: {
    fontSize: 20,
    color: Palette.textSecondary,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sliderLabelText: {
    fontSize: 13,
    color: Palette.textSecondary,
    fontWeight: '600',
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
