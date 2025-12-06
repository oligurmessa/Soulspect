import { NextRequest, NextResponse } from 'next/server';
import { embeddingService } from '@/lib/embeddingService';
import { chromaHttpService } from '@/lib/chromaHttpClient';
import { runLlamaPrompt } from '@/lib/vertexai';

export async function GET(request: NextRequest) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      deepinfra_api_key: !!process.env.DEEPINFRA_API_KEY,
      chroma_url: process.env.CHROMA_URL || 'http://localhost:8000',
      google_cloud_project: process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_ID,
      firebase_service_account: !!process.env.FIREBASE_CLIENT_EMAIL
    },
    services: {
      embedding: { status: 'unknown', error: null as string | null },
      chroma: { status: 'unknown', error: null as string | null },
      llama: { status: 'unknown', error: null as string | null }
    }
  };

  // Test DeepInfra Embedding Service
  try {
    if (!process.env.DEEPINFRA_API_KEY) {
      diagnostics.services.embedding = {
        status: 'not_configured',
        error: 'DEEPINFRA_API_KEY not set'
      };
    } else {
      await embeddingService.createEmbedding('test');
      diagnostics.services.embedding = { status: 'working', error: null };
    }
  } catch (error: any) {
    diagnostics.services.embedding = {
      status: 'error',
      error: error.message
    };
  }

  // Test ChromaDB Service
  try {
    if (!process.env.CHROMA_URL) {
      diagnostics.services.chroma = {
        status: 'not_configured',
        error: 'CHROMA_URL not set'
      };
    } else {
      await chromaHttpService.testConnection();
      await chromaHttpService.getCollectionStats();
      diagnostics.services.chroma = { status: 'working', error: null };
    }
  } catch (error: any) {
    diagnostics.services.chroma = {
      status: 'error',
      error: error.message
    };
  }

  // Test Llama Service  
  try {
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_ID) {
      diagnostics.services.llama = {
        status: 'not_configured',
        error: 'Google Cloud Project ID not set'
      };
    } else {
      await runLlamaPrompt('Hello');
      diagnostics.services.llama = { status: 'working', error: null };
    }
  } catch (error: any) {
    diagnostics.services.llama = {
      status: 'error',
      error: error.message
    };
  }

  return NextResponse.json(diagnostics, { status: 200 });
}