export const AI_CONFIG = {
  gemini: {
    model: process.env.GEMINI_MODEL || 'gemini-pro',
    temperature: 0.7,
    maxTokens: 2048,
    apiKey: process.env.GEMINI_API_KEY
  },
  openai: {
    model: process.env.OPENAI_MODEL || 'gpt-4',
    temperature: 0.7,
    apiKey: process.env.OPENAI_API_KEY
  },
  vertex: {
    projectId: process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_ID,
    accessToken: process.env.GOOGLE_ACCESS_TOKEN,
    endpoint: 'us-central1-aiplatform.googleapis.com',
    region: 'us-central1',
    model: 'llama-3-3-70b-instruct-maas'
  },
  deepinfra: {
    apiKey: process.env.DEEPINFRA_API_KEY,
    baseUrl: 'https://api.deepinfra.com/v1/openai',
    embeddingModel: 'Qwen/Qwen3-Embedding-8B'
  },
  embedding: {
    model: 'text-embedding-ada-002',
    dimensions: 1536
  }
} as const;