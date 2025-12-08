// DISABLED: OpenAI Whisper transcription service removed
// import OpenAI from 'openai';
// import { DataSyncService } from './dataSyncService';

export class TranscriptionService {
  // DISABLED: OpenAI Whisper transcription removed
  static async transcribeAudio(audioBlob: Blob): Promise<string> {
    throw new Error('TranscriptionService disabled - OpenAI Whisper removed. Use alternative transcription service.');
  }

  // DISABLED: OpenAI Whisper transcription removed
  static async transcribeAndIndex(
    userId: string,
    entryId: string,
    audioBlob: Blob,
    duration: number
  ): Promise<string> {
    throw new Error('TranscriptionService disabled - OpenAI Whisper removed. Use alternative transcription service.');
  }

  // DISABLED: OpenAI Whisper transcription removed
  static async batchTranscribe(audioFiles: Array<{
    blob: Blob;
    id: string;
    userId: string;
    entryId: string;
    duration: number;
  }>): Promise<Array<{ id: string; transcript: string; error?: string }>> {
    throw new Error('TranscriptionService disabled - OpenAI Whisper removed. Use alternative transcription service.');
  }

  // DISABLED: OpenAI Whisper transcription removed
  static isAvailable(): boolean {
    return false;
  }
}

// Hook for using transcription in components
export const useTranscription = () => {
  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    throw new Error('TranscriptionService disabled - OpenAI Whisper removed.');
  };

  const transcribeAndIndex = async (
    userId: string,
    entryId: string,
    audioBlob: Blob,
    duration: number
  ): Promise<string> => {
    throw new Error('TranscriptionService disabled - OpenAI Whisper removed.');
  };

  return {
    transcribeAudio,
    transcribeAndIndex,
    isAvailable: TranscriptionService.isAvailable(),
  };
};