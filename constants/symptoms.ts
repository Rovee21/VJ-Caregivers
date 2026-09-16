import { CareRecipientCondition } from '@/services/api';

export interface SymptomOption {
  key: string;
  label: string;
  emoji: string;
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
      { key: 'calm_good_day', label: 'Calm / good day', emoji: '😌' },
      { key: 'agitated', label: 'Agitated', emoji: '😤' },
      { key: 'confused', label: 'Confused', emoji: '😵' },
      { key: 'anxious', label: 'Anxious', emoji: '😰' },
      { key: 'sad_withdrawn', label: 'Sad / withdrawn', emoji: '😔' },
      { key: 'irritable', label: 'Irritable', emoji: '😠' },
      { key: 'sleep_trouble', label: 'Sleep trouble', emoji: '🛌' },
      { key: 'wandering', label: 'Wandering', emoji: '🚶' },
      { key: 'repetitive', label: 'Repetitive', emoji: '🔁' },
    ],
  },
  cancer: {
    label: 'Cancer',
    symptoms: [
      { key: 'comfortable_good_day', label: 'Comfortable / good day', emoji: '😌' },
      { key: 'pain', label: 'Pain', emoji: '😣' },
      { key: 'tired_low_energy', label: 'Tired / low energy', emoji: '😩' },
      { key: 'drowsy', label: 'Drowsy', emoji: '🥱' },
      { key: 'nausea', label: 'Nausea', emoji: '🤢' },
      { key: 'poor_appetite', label: 'Poor appetite', emoji: '🍽️' },
      { key: 'short_of_breath', label: 'Short of breath', emoji: '😮‍💨' },
      { key: 'anxious', label: 'Anxious', emoji: '😰' },
      { key: 'sad_low_mood', label: 'Sad / low mood', emoji: '😔' },
      { key: 'constipation', label: 'Constipation', emoji: '😖' },
    ],
  },
};

export const SKIP_SYMPTOMS_KEY = 'skip';
