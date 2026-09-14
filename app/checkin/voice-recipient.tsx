import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { VoiceRecordScreen } from '@/components/voice-record-screen';
import { submitCheckIn, VoiceClip } from '@/services/api';
import { getCaregiverProfile, incrementCompletedEntryCount } from '@/services/storage';
import { useCheckIn } from './_layout';

export default function VoiceRecipientScreen() {
  const router = useRouter();
  const checkIn = useCheckIn();
  const [recipientName, setRecipientName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCaregiverProfile().then((profile) => {
      setRecipientName(profile?.recipientName || 'them');
    });
  }, []);

  const handleNext = async (clip: VoiceClip) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const profile = await getCaregiverProfile();

      if (!profile || !checkIn.selfClip) {
        Alert.alert('Something went wrong', 'Please restart today’s check-in.');
        router.replace('/');
        return;
      }

      await submitCheckIn({
        caregiverId: profile.caregiverId,
        selfRecording: checkIn.selfClip,
        emotions: checkIn.emotions,
        stressLevel: checkIn.stressLevel,
        symptoms: checkIn.symptoms,
        symptomsSkipped: checkIn.symptomsSkipped,
        recipientRecording: clip,
      });

      await incrementCompletedEntryCount();
      checkIn.reset();
      router.replace('/checkin/done');
    } catch (error) {
      console.error('Check-in submission error:', error);
      Alert.alert('Save failed', 'Could not save your check-in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <VoiceRecordScreen
      label={`About ${recipientName}`}
      step={5}
      totalSteps={6}
      title={`Tell me about how ${recipientName} is doing today, and how it has affected you.`}
      maxSeconds={180}
      nextLabel={submitting ? 'Saving…' : 'Done'}
      onNext={handleNext}
    />
  );
}
