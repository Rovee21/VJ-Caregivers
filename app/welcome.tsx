import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenCard } from '@/components/screen-card';
import { ScreenHeader } from '@/components/screen-header';
import { Palette } from '@/constants/palette';
import { SYMPTOM_CONFIG } from '@/constants/symptoms';
import { CaregiverProfile, getCaregiverProfile, hasSeenOrientation } from '@/services/storage';

export default function WelcomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<CaregiverProfile | null>(null);

  useEffect(() => {
    getCaregiverProfile().then(setProfile);
  }, []);

  const handleContinue = async () => {
    const oriented = await hasSeenOrientation();
    router.replace(oriented ? '/' : '/orientation');
  };

  if (!profile) {
    return null;
  }

  return (
    <ScreenCard>
      <ScreenHeader label="Setup" rightText="first launch" />

      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{profile.caregiverFirstName.charAt(0).toUpperCase()}</Text>
      </View>

      <Text style={styles.title}>Welcome, {profile.caregiverFirstName}!</Text>
      <Text style={styles.subtitle}>
        You’re checking in about your care for {profile.recipientName}.
      </Text>

      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Care recipient</Text>
          <Text style={styles.infoValue}>{profile.recipientName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Condition</Text>
          <Text style={styles.infoValue}>{SYMPTOM_CONFIG[profile.recipientCondition].label}</Text>
        </View>
      </View>

      <Text style={styles.note}>Not right? Contact your study coordinator to update this.</Text>

      <View style={styles.spacer} />

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </ScreenCard>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.badgeBackground,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Palette.badgeText,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Palette.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: Palette.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  infoBox: {
    backgroundColor: Palette.infoBoxBackground,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 15,
    color: Palette.textSecondary,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Palette.textPrimary,
  },
  note: {
    fontSize: 13,
    color: Palette.textSecondary,
    textAlign: 'center',
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
