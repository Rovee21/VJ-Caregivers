// Replace with YOUR computer's IP address from ipconfig
// const API_BASE_URL = 'https://web-production-14cc6.up.railway.app/api';
//const API_BASE_URL = 'https://selectable-changelessly-sharilyn.ngrok-free.dev/api';
export const API_BASE_URL = 'https://9ramak72jh.us-east-2.awsapprunner.com/api';

export interface EnrollmentData {
  fullName: string;
  email: string;
  phoneNumber?: string;
}

export interface EnrollmentResponse {
  participantId: string;
  fullName: string;
  message: string;
}

// Add this function
export async function enrollParticipant(data: EnrollmentData): Promise<EnrollmentResponse> {
  try {
    const payload = {
      fullName: data.fullName,
      email: data.email,
      ...(data.phoneNumber ? { phoneNumber: data.phoneNumber } : {}),
    };

    const response = await fetch(`${API_BASE_URL}/participants/`, {  // Uses shared URL + trailing slash
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Enrollment failed');
    }

    return result;
  } catch (error) {
    console.error('Enrollment error:', error);
    throw error;
  }
}

export interface RecordingData {
  audio_file: any;
  question: string;
  duration: number;
  participant_id: string;
}

export interface SurveyData {
  recording_id: number;
  emotion: string;
  stress_level: number;
}

export interface DeleteParticipantResponse {
  success?: boolean;
  deletedParticipantId?: string;
  message?: string;
}

// Upload audio recording
export async function uploadRecording(data: RecordingData): Promise<number> {
  try {
    console.log('=== UPLOAD DEBUG ===');
    console.log('Audio URI:', data.audio_file);
    console.log('Question:', data.question);
    console.log('Duration:', data.duration);
    console.log('Participant ID:', data.participant_id);
    
    const formData = new FormData();
    
    // Add audio file
    formData.append('audio', {
      uri: data.audio_file,
      type: 'audio/m4a',
      name: `recording_${Date.now()}.m4a`,
    } as any);
    
    formData.append('question', data.question);
    formData.append('duration', data.duration.toString());
    formData.append('participantId', data.participant_id);

    console.log('FormData created, sending request...');

    const response = await fetch(`${API_BASE_URL}/upload-recording/`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response data:', result);
    
    if (!response.ok) {
      throw new Error(result.error || 'Upload failed');
    }

    return result.recordingId; 
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

// Save survey data
export async function saveSurvey(data: SurveyData): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/save-survey/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Survey save failed');
    }
  } catch (error) {
    console.error('Survey save error:', error);
    throw error;
  }
}

export async function deleteParticipantData(
  participantId: string
): Promise<DeleteParticipantResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/participants/${participantId}/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Deletion failed');
    }

    return result;
  } catch (error) {
    console.error('Delete participant error:', error);
    throw error;
  }
}

// Get all recordings (for testing)
export async function getAllRecordings(): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/recordings/`);
    return await response.json();
  } catch (error) {
    console.error('Fetch recordings error:', error);
    return [];
  }
}
