import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenCard } from '@/components/screen-card';
import { ScreenHeader } from '@/components/screen-header';
import { Palette } from '@/constants/palette';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { VoiceClip } from '@/services/api';

interface VoiceRecordScreenProps {
  label: string;
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  maxSeconds: number;
  nextLabel?: string;
  onNext: (clip: VoiceClip) => void;
}

export function VoiceRecordScreen({
  label,
  step,
  totalSteps,
  title,
  subtitle,
  maxSeconds,
  nextLabel = 'Next',
  onNext,
}: VoiceRecordScreenProps) {
  const recorder = useVoiceRecorder(maxSeconds);

  const handleNext = () => {
    if (!recorder.recordedUri) return;
    onNext({ uri: recorder.recordedUri, durationSeconds: recorder.recordingTime });
  };

  return (
    <ScreenCard>
      <ScreenHeader label={label} rightText={`${step} of ${totalSteps}`} />

      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.recordArea}>
        <TouchableOpacity
          style={[styles.recordButton, recorder.isRecording && styles.recordButtonActive]}
          onPress={recorder.isRecording ? recorder.stop : recorder.start}
          activeOpacity={0.8}
        >
          <Text style={styles.micIcon}>🎙️</Text>
        </TouchableOpacity>

        <Text style={styles.timerText}>
          {recorder.formattedTime} / {recorder.formattedMaxTime}
        </Text>

        {recorder.recordedUri && !recorder.isRecording ? (
          <TouchableOpacity onPress={recorder.reset}>
            <Text style={styles.reRecordText}>Record again</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.spacer} />

      <TouchableOpacity
        style={[styles.button, !recorder.recordedUri && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={!recorder.recordedUri}
      >
        <Text style={styles.buttonText}>{nextLabel}</Text>
      </TouchableOpacity>
    </ScreenCard>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Palette.textPrimary,
    marginBottom: 10,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 15,
    color: Palette.textSecondary,
    lineHeight: 21,
    marginBottom: 20,
  },
  recordArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 220,
  },
  recordButton: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#C96F4A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonActive: {
    backgroundColor: '#B33A3A',
  },
  micIcon: {
    fontSize: 40,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: Palette.textPrimary,
    marginTop: 16,
  },
  reRecordText: {
    marginTop: 12,
    fontSize: 14,
    color: Palette.primary,
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
