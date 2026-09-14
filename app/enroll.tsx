import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { enrollParticipant } from '../services/api';
import { saveParticipantData } from '../services/storage';

export default function EnrollScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleEnroll = async () => {
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your email address');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phoneNumber.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    const digitsOnlyPhone = normalizedPhone.replace(/\D/g, '');
    if (normalizedPhone && (digitsOnlyPhone.length < 10 || digitsOnlyPhone.length > 15)) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    try {
      const trimmedName = name.trim();
      const data = await enrollParticipant({
        fullName: trimmedName,
        email: normalizedEmail,
        ...(digitsOnlyPhone ? { phoneNumber: digitsOnlyPhone } : {}),
      });
      const firstName = trimmedName ? trimmedName.split(' ')[0] : '';
      
      await saveParticipantData(data.participantId, firstName);
      router.replace('/');
    } catch (error: any) {
      console.error('Enrollment error:', error);
      Alert.alert('Error', `Failed to enroll: ${error.message || error}`);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title}>Welcome to{'\n'}Voice Journal Study</Text>
          
          <Text style={styles.subtitle}>
            Please enter your details.
            {'\n'}
            Phone number is optional.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., John Doe"
              autoCapitalize="words"
              maxLength={50}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="e.g., john@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              maxLength={100}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="e.g., 1234567890"
              keyboardType="phone-pad"
              maxLength={20}
            />
          </View>

          <TouchableOpacity 
            style={styles.button}
            onPress={handleEnroll}
          >
            <Text style={styles.buttonText}>Start Study</Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            Your details will be saved.{'\n'}
            You won&apos;t need to enter them again.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E6',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
    minHeight: 600,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
  },
  inputContainer: {
    marginBottom: 25,
  },
  label: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 15,
    fontSize: 20,
    borderWidth: 2,
    borderColor: '#FFB366',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 22,
    borderRadius: 30,
    marginTop: 20,
  },
  buttonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  note: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 30,
    lineHeight: 24,
  },
});
