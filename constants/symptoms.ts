import { CareRecipientCondition } from '@/services/api';

export interface SymptomOption {
  key: string;
  label: string;
}

export interface SymptomConfig {
  label: string;
  symptoms: SymptomOption[];
}

// Condition-keyed so adding a new arm to the study is a config addition,
// not a new screen.
export const SYMPTOM_CONFIG: Record<CareRecipientCondition, SymptomConfig> = {
  dementia: {
    label: 'Dementia',
    symptoms: [
      { key: 'calm_good_day', label: 'Calm / good day' },
      { key: 'agitated', label: 'Agitated' },
      { key: 'confused', label: 'Confused' },
      { key: 'anxious', label: 'Anxious' },
      { key: 'sad_withdrawn', label: 'Sad / withdrawn' },
      { key: 'irritable', label: 'Irritable' },
      { key: 'sleep_trouble', label: 'Sleep trouble' },
      { key: 'wandering', label: 'Wandering' },
      { key: 'repetitive', label: 'Repetitive' },
    ],
  },
  cancer: {
    label: 'Cancer',
    symptoms: [
      { key: 'comfortable_good_day', label: 'Comfortable / good day' },
      { key: 'pain', label: 'Pain' },
      { key: 'tired_low_energy', label: 'Tired / low energy' },
      { key: 'drowsy', label: 'Drowsy' },
      { key: 'nausea', label: 'Nausea' },
      { key: 'poor_appetite', label: 'Poor appetite' },
      { key: 'short_of_breath', label: 'Short of breath' },
      { key: 'anxious', label: 'Anxious' },
      { key: 'sad_low_mood', label: 'Sad / low mood' },
      { key: 'constipation', label: 'Constipation' },
    ],
  },
};

export const SKIP_SYMPTOMS_KEY = 'skip';
