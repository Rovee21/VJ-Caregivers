import { Stack } from 'expo-router';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { VoiceClip } from '@/services/api';
import { generateLocalId } from '@/services/storage';

interface CheckInState {
  checkInId: string;
  selfClip: VoiceClip | null;
  emotions: string[];
  stressLevel: number;
  symptoms: string[];
  symptomsSkipped: boolean;
}

interface CheckInContextValue extends CheckInState {
  setSelfClip: (clip: VoiceClip | null) => void;
  setEmotions: (emotions: string[]) => void;
  setStressLevel: (level: number) => void;
  setSymptoms: (symptoms: string[]) => void;
  setSymptomsSkipped: (skipped: boolean) => void;
  reset: () => void;
}

// A function, not a static object — every check-in (including after
// reset()) needs its own fresh checkInId, not the same one reused all
// session.
function createInitialState(): CheckInState {
  return {
    checkInId: generateLocalId(),
    selfClip: null,
    emotions: [],
    stressLevel: 5,
    symptoms: [],
    symptomsSkipped: false,
  };
}

const CheckInContext = createContext<CheckInContextValue | null>(null);

export function useCheckIn(): CheckInContextValue {
  const context = useContext(CheckInContext);

  if (!context) {
    throw new Error('useCheckIn must be used within the check-in flow');
  }

  return context;
}

function CheckInProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CheckInState>(createInitialState);

  const value = useMemo<CheckInContextValue>(
    () => ({
      ...state,
      setSelfClip: (selfClip) => setState((prev) => ({ ...prev, selfClip })),
      setEmotions: (emotions) => setState((prev) => ({ ...prev, emotions })),
      setStressLevel: (stressLevel) => setState((prev) => ({ ...prev, stressLevel })),
      setSymptoms: (symptoms) => setState((prev) => ({ ...prev, symptoms })),
      setSymptomsSkipped: (symptomsSkipped) => setState((prev) => ({ ...prev, symptomsSkipped })),
      reset: () => setState(createInitialState()),
    }),
    [state]
  );

  return <CheckInContext.Provider value={value}>{children}</CheckInContext.Provider>;
}

export default function CheckInLayout() {
  return (
    <CheckInProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
      >
        <Stack.Screen name="voice-self" />
        <Stack.Screen name="emotions" />
        <Stack.Screen name="stress" />
        <Stack.Screen name="symptoms" />
        <Stack.Screen name="voice-recipient" />
        <Stack.Screen name="done" />
      </Stack>
    </CheckInProvider>
  );
}
