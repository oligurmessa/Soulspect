import OpenAI from 'openai';
import { DataSyncService } from './dataSyncService';

// Lazy initialization to avoid build errors
let openai: OpenAI | null = null;

const getOpenAI = () => {
  if (!openai && process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    });
  }
  return openai;
};

export class TranscriptionService {
  // Transcribe audio blob to text
  static async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      // Convert blob to file
      const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
      
      const ai = getOpenAI();
      if (!ai) {
        throw new Error('OpenAI not available (missing API key)');
      }
      
      const response = await ai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en', // Can be made dynamic based on user preference
        response_format: 'text',
      });

      return response;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  // Transcribe and index audio with automatic sync
  static async transcribeAndIndex(
    userId: string,
    entryId: string,
    audioBlob: Blob,
    duration: number
  ): Promise<string> {
    try {
      // Get transcription
      const transcript = await this.transcribeAudio(audioBlob);
      
      // Index in vector database
      await DataSyncService.indexVoiceTranscript(userId, entryId, transcript, duration);
      
      return transcript;
    } catch (error) {
      console.error('Error in transcribe and index:', error);
      throw error;
    }
  }

  // Batch transcribe multiple audio files
  static async batchTranscribe(audioFiles: Array<{
    blob: Blob;
    id: string;
    userId: string;
    entryId: string;
    duration: number;
  }>): Promise<Array<{ id: string; transcript: string; error?: string }>> {
    const results = [];

    for (const file of audioFiles) {
      try {
        const transcript = await this.transcribeAndIndex(
          file.userId,
          file.entryId,
          file.blob,
          file.duration
        );
        
        results.push({
          id: file.id,
          transcript,
        });
      } catch (error) {
        results.push({
          id: file.id,
          transcript: '',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  // Check if transcription service is available
  static isAvailable(): boolean {
    return !!process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  }
}

// Hook for using transcription in components
export const useTranscription = () => {
  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    if (!TranscriptionService.isAvailable()) {
      throw new Error('OpenAI API key not configured');
    }
    
    return TranscriptionService.transcribeAudio(audioBlob);
  };

  const transcribeAndIndex = async (
    userId: string,
    entryId: string,
    audioBlob: Blob,
    duration: number
  ): Promise<string> => {
    if (!TranscriptionService.isAvailable()) {
      throw new Error('OpenAI API key not configured');
    }
    
    return TranscriptionService.transcribeAndIndex(userId, entryId, audioBlob, duration);
  };

  return {
    transcribeAudio,
    transcribeAndIndex,
    isAvailable: TranscriptionService.isAvailable(),
  };
};