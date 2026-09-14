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
import { redeemSignInCode } from '../services/api';
import { markSignedInThisSession, saveCaregiverProfile } from '../services/storage';

export default function SignInScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!code.trim()) {
      Alert.alert('Enter your code', 'Please enter the code from your welcome email or packet.');
      return;
    }

    setSubmitting(true);

    try {
      const profile = await redeemSignInCode(code);
      await saveCaregiverProfile(profile);
      markSignedInThisSession();
      router.replace('/welcome');
    } catch (error: any) {
      Alert.alert('Sign in failed', error.message || 'Please check your code and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
      <ScreenCard
        belowCard={
          <Text style={styles.footer}>Trouble signing in? Contact your study coordinator.</Text>
        }
      >
        <ScreenHeader label="Sign in" rightText="first launch" />

        <Text style={styles.title}>Enter your Voice{'\n'}Journal code</Text>
        <Text style={styles.subtitle}>
          You’ll find this in the welcome email or packet from your study team.
        </Text>

        <TextInput
          style={styles.input}
          value={code}
          onChangeText={setCode}
          placeholder="Enter code"
          placeholderTextColor={Palette.textSecondary}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={40}
        />

        <View style={styles.spacer} />

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>{submitting ? 'Signing in…' : 'Continue'}</Text>
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
  input: {
    backgroundColor: Palette.cardBackground,
    borderWidth: 1.5,
    borderColor: Palette.chipBorder,
    borderRadius: 14,
    padding: 16,
    fontSize: 17,
    color: Palette.textPrimary,
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
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Palette.primaryText,
    textAlign: 'center',
  },
  footer: {
    fontSize: 13,
    color: Palette.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
});
