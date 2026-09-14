import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { VoiceRecordScreen } from '@/components/voice-record-screen';
import { getCaregiverProfile } from '@/services/storage';
import { useCheckIn } from './_layout';

export default function VoiceSelfScreen() {
  const router = useRouter();
  const { setSelfClip } = useCheckIn();
  const [caregiverFirstName, setCaregiverFirstName] = useState('');

  useEffect(() => {
    getCaregiverProfile().then((profile) => {
      setCaregiverFirstName(profile?.caregiverFirstName || '');
    });
  }, []);

  return (
    <VoiceRecordScreen
      label="About you"
      step={1}
      totalSteps={6}
      title={`${caregiverFirstName ? `${caregiverFirstName}, h` : 'H'}ow are you feeling today?`}
      subtitle="Please share what went well and what was hard, and how it’s affected your mood."
      maxSeconds={180}
      onNext={(clip) => {
        setSelfClip(clip);
        router.push('/checkin/emotions');
      }}
    />
  );
}
