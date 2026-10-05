import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenCard } from '@/components/screen-card';
import { ScreenHeader } from '@/components/screen-header';
import { Palette } from '@/constants/palette';
import { CareRecipientCondition, createCaregiverProfile } from '../services/api';
import { saveCaregiverProfile } from '../services/storage';

const CONDITIONS: { key: CareRecipientCondition; label: string }[] = [
  { key: 'dementia', label: 'Dementia' },
  { key: 'cancer', label: 'Cancer' },
];

export default function IntakeScreen() {
  const router = useRouter();
  const [caregiverFirstName, setCaregiverFirstName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [condition, setCondition] = useState<CareRecipientCondition | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canContinue = caregiverFirstName.trim() && recipientName.trim() && condition && !submitting;

  const handleContinue = async () => {
    if (!caregiverFirstName.trim() || !recipientName.trim()) {
      Alert.alert('Almost there', 'Please enter both your name and your care recipient’s name.');
      return;
    }

    if (!condition) {
      Alert.alert('Almost there', 'Please select the condition you’re caring for.');
      return;
    }

    setSubmitting(true);

    try {
      const profile = await createCaregiverProfile({
        caregiverFirstName: caregiverFirstName.trim(),
        recipientName: recipientName.trim(),
        recipientCondition: condition,
      });

      await saveCaregiverProfile(profile);
      router.replace('/welcome');
    } catch (error: any) {
      Alert.alert('Could not continue', error.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
      <ScreenCard>
        <ScreenHeader label="Get started" rightText="first launch" />

        <Text style={styles.title}>Tell us about your{'\n'}care situation</Text>
        <Text style={styles.subtitle}>This helps us tailor your daily check-ins.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Your first name</Text>
          <TextInput
            style={styles.input}
            value={caregiverFirstName}
            onChangeText={setCaregiverFirstName}
            placeholder="e.g., Mary"
            placeholderTextColor={Palette.textSecondary}
            autoCapitalize="words"
            maxLength={50}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Care recipient’s name</Text>
          <TextInput
            style={styles.input}
            value={recipientName}
            onChangeText={setRecipientName}
            placeholder="e.g., John"
            placeholderTextColor={Palette.textSecondary}
            autoCapitalize="words"
            maxLength={50}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Condition</Text>
          <View style={styles.conditionRow}>
            {CONDITIONS.map((option) => {
              const isSelected = condition === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[styles.conditionChip, isSelected && styles.conditionChipSelected]}
                  onPress={() => setCondition(option.key)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.conditionText, isSelected && styles.conditionTextSelected]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity
          style={[styles.button, !canContinue && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
        >
          <Text style={styles.buttonText}>{submitting ? 'Saving…' : 'Continue'}</Text>
        </TouchableOpacity>
      </ScreenCard>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Palette.textPrimary,
    marginBottom: 10,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 15,
    color: Palette.textSecondary,
    lineHeight: 21,
    marginBottom: 24,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Palette.cardBackground,
    borderWidth: 1.5,
    borderColor: Palette.chipBorder,
    borderRadius: 14,
    padding: 16,
    fontSize: 17,
    color: Palette.textPrimary,
  },
  conditionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  conditionChip: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Palette.chipBorder,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
  },
  conditionChipSelected: {
    borderColor: Palette.chipSelectedBorder,
    backgroundColor: Palette.infoBoxBackground,
  },
  conditionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  conditionTextSelected: {
    color: Palette.chipSelectedBorder,
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
