import { NextRequest, NextResponse } from 'next/server';
import { embeddingService } from '@/lib/embeddingService';
import { chromaHttpService } from '@/lib/chromaHttpClient';

interface PipelineTestResult {
  timestamp: string;
  testQuery: string;
  environment: {
    deepinfra_api_key: boolean;
    chroma_url: string;
    chroma_api_key: boolean;
    chroma_tenant: string;
    chroma_database: string;
  };
  tests: {
    embedding_generation: TestStep;
    chroma_connection: TestStep;
    vector_storage: TestStep;
    vector_retrieval: TestStep;
    end_to_end_flow: TestStep;
  };
  performance: {
    embedding_time_ms: number;
    storage_time_ms: number;
    search_time_ms: number;
    total_time_ms: number;
  };
  vector_details: {
    model: string;
    dimensions: number;
    sample_vector_length: number;
    sample_vector_preview: number[];
  };
  test_data: {
    stored_documents: any[];
    search_results: any[];
    similarity_scores: number[];
  };
}

interface TestStep {
  status: 'success' | 'error' | 'not_tested';
  message: string;
  details?: any;
  error?: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Parse the test query from request body
  let testQuery = 'happiness and joy in daily life';
  try {
    const body = await request.json();
    testQuery = body.query || testQuery;
  } catch (error) {
    // Use default query if parsing fails
  }

  const result: PipelineTestResult = {
    timestamp: new Date().toISOString(),
    testQuery,
    environment: {
      deepinfra_api_key: !!process.env.DEEPINFRA_API_KEY,
      chroma_url: process.env.CHROMA_URL || 'http://localhost:8000',
      chroma_api_key: !!process.env.CHROMA_API_KEY,
      chroma_tenant: process.env.CHROMA_TENANT || 'default_tenant',
      chroma_database: process.env.CHROMA_DATABASE || 'default_database',
    },
    tests: {
      embedding_generation: { status: 'not_tested', message: 'Not tested yet' },
      chroma_connection: { status: 'not_tested', message: 'Not tested yet' },
      vector_storage: { status: 'not_tested', message: 'Not tested yet' },
      vector_retrieval: { status: 'not_tested', message: 'Not tested yet' },
      end_to_end_flow: { status: 'not_tested', message: 'Not tested yet' },
    },
    performance: {
      embedding_time_ms: 0,
      storage_time_ms: 0,
      search_time_ms: 0,
      total_time_ms: 0,
    },
    vector_details: {
      model: '',
      dimensions: 0,
      sample_vector_length: 0,
      sample_vector_preview: [],
    },
    test_data: {
      stored_documents: [],
      search_results: [],
      similarity_scores: [],
    },
  };

  // Test 1: Embedding Generation (Qwen3-Embedding-8B via DeepInfra)
  let testEmbedding: number[] = [];
  const embeddingStartTime = Date.now();

  try {
    if (!process.env.DEEPINFRA_API_KEY) {
      throw new Error('DEEPINFRA_API_KEY not configured');
    }

    testEmbedding = await embeddingService.createEmbedding(testQuery);
    const embeddingTime = Date.now() - embeddingStartTime;
    result.performance.embedding_time_ms = embeddingTime;

    const modelInfo = embeddingService.getModelInfo();
    result.vector_details = {
      model: modelInfo.model,
      dimensions: modelInfo.dimensions,
      sample_vector_length: testEmbedding.length,
      sample_vector_preview: testEmbedding.slice(0, 10), // First 10 dimensions
    };

    result.tests.embedding_generation = {
      status: 'success',
      message: `Generated ${testEmbedding.length}D embedding in ${embeddingTime}ms`,
      details: {
        model: modelInfo.model,
        provider: modelInfo.provider,
        vector_length: testEmbedding.length,
        expected_dimensions: modelInfo.dimensions,
        time_ms: embeddingTime,
      },
    };
  } catch (error: any) {
    result.tests.embedding_generation = {
      status: 'error',
      message: 'Failed to generate embedding',
      error: error.message,
    };
  }

  // Test 2: ChromaDB Connection
  try {
    const connectionResult = await chromaHttpService.testConnection();
    if (!connectionResult) {
      throw new Error('Connection test returned false');
    }

    const stats = await chromaHttpService.getCollectionStats();
    result.tests.chroma_connection = {
      status: 'success',
      message: 'ChromaDB connection successful',
      details: {
        url: result.environment.chroma_url,
        collection_count: stats.count,
        model: stats.model,
        dimensions: stats.dimensions,
      },
    };
  } catch (error: any) {
    result.tests.chroma_connection = {
      status: 'error',
      message: 'ChromaDB connection failed',
      error: error.message,
    };
  }

  // Test 3: Vector Storage (Save Workflow)
  const storageStartTime = Date.now();
  const testUserId = 'test_user_vector_pipeline';
  const testDocuments = [
    {
      momentId: 'test_moment_1',
      content: 'I felt incredibly happy today after spending time with friends and family. The joy was overwhelming and made me feel grateful for life.',
      metadata: {
        type: 'journal_entry',
        timestamp: Date.now(),
        mood: 5,
        emotions: ['happiness', 'joy', 'gratitude'],
        triggers: ['social_interaction', 'family_time'],
      },
    },
    {
      momentId: 'test_moment_2',
      content: 'Had a challenging day at work but learned something new. Growth comes from pushing through difficult moments.',
      metadata: {
        type: 'reflection',
        timestamp: Date.now(),
        mood: 3,
        emotions: ['determination', 'growth'],
        triggers: ['work_challenges', 'learning'],
      },
    },
    {
      momentId: 'test_moment_3',
      content: 'Beautiful sunset tonight filled me with peace and serenity. Nature has a way of calming the soul.',
      metadata: {
        type: 'observation',
        timestamp: Date.now(),
        mood: 4,
        emotions: ['peace', 'serenity', 'wonder'],
        triggers: ['nature', 'sunset'],
      },
    },
  ];

  try {
    // Clean up any existing test data first
    for (const doc of testDocuments) {
      try {
        await chromaHttpService.deleteMoment(testUserId, doc.momentId);
      } catch (error) {
        // Ignore deletion errors - document might not exist
      }
    }

    // Store test documents
    for (const doc of testDocuments) {
      await chromaHttpService.indexMoment(testUserId, doc.momentId, doc.content, doc.metadata);
    }

    const storageTime = Date.now() - storageStartTime;
    result.performance.storage_time_ms = storageTime;
    result.test_data.stored_documents = testDocuments;

    result.tests.vector_storage = {
      status: 'success',
      message: `Stored ${testDocuments.length} test documents in ${storageTime}ms`,
      details: {
        documents_stored: testDocuments.length,
        time_ms: storageTime,
        user_id: testUserId,
        moment_ids: testDocuments.map(d => d.momentId),
      },
    };
  } catch (error: any) {
    result.tests.vector_storage = {
      status: 'error',
      message: 'Failed to store vectors in ChromaDB',
      error: error.message,
    };
  }

  // Test 4: Vector Retrieval (Query Workflow)
  const searchStartTime = Date.now();

  try {
    const searchResults = await chromaHttpService.searchMoments(testUserId, testQuery, {
      topK: 5,
      includeMetadata: true,
    });

    const searchTime = Date.now() - searchStartTime;
    result.performance.search_time_ms = searchTime;
    result.test_data.search_results = searchResults;
    result.test_data.similarity_scores = searchResults.map(r => r.score);

    result.tests.vector_retrieval = {
      status: 'success',
      message: `Found ${searchResults.length} similar documents in ${searchTime}ms`,
      details: {
        query: testQuery,
        results_count: searchResults.length,
        time_ms: searchTime,
        top_similarity_score: searchResults.length > 0 ? Math.max(...searchResults.map(r => r.score)) : 0,
        avg_similarity_score: searchResults.length > 0 ? searchResults.reduce((sum, r) => sum + r.score, 0) / searchResults.length : 0,
      },
    };
  } catch (error: any) {
    result.tests.vector_retrieval = {
      status: 'error',
      message: 'Failed to retrieve vectors from ChromaDB',
      error: error.message,
    };
  }

  // Test 5: End-to-End Flow Assessment
  const coreTests: (keyof PipelineTestResult['tests'])[] = ['embedding_generation', 'vector_storage', 'vector_retrieval'];
  const coreTestsPassed = coreTests.every(testName => result.tests[testName].status === 'success');
  const totalTime = Date.now() - startTime;
  result.performance.total_time_ms = totalTime;

  if (coreTestsPassed) {
    const highSimilarityCount = result.test_data.similarity_scores.filter(score => score > 0.7).length;
    const avgSimilarity = result.test_data.similarity_scores.length > 0
      ? result.test_data.similarity_scores.reduce((sum, score) => sum + score, 0) / result.test_data.similarity_scores.length
      : 0;

    result.tests.end_to_end_flow = {
      status: 'success',
      message: `Complete pipeline functional in ${totalTime}ms`,
      details: {
        total_time_ms: totalTime,
        embedding_dimensions_correct: testEmbedding.length === 4096,
        documents_retrievable: result.test_data.search_results.length > 0,
        semantic_search_working: avgSimilarity > 0.3,
        high_similarity_results: highSimilarityCount,
        average_similarity: Math.round(avgSimilarity * 1000) / 1000,
        pipeline_health: 'EXCELLENT',
      },
    };
  } else {
    const failedCoreTests = coreTests.filter(testName => result.tests[testName].status === 'error');

    result.tests.end_to_end_flow = {
      status: 'error',
      message: 'Core pipeline has failures',
      error: `Failed core tests: ${failedCoreTests.join(', ')}`,
      details: {
        failed_tests: failedCoreTests,
        pipeline_health: 'DEGRADED',
      },
    };
  }

  // Clean up test data
  try {
    for (const doc of testDocuments) {
      await chromaHttpService.deleteMoment(testUserId, doc.momentId);
    }
  } catch (error) {
    console.warn('Failed to clean up test data:', error);
  }

  return NextResponse.json(result, {
    status: coreTestsPassed ? 200 : 500,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Vector Pipeline Test API',
    description: 'POST to run comprehensive vector pipeline tests',
    usage: {
      method: 'POST',
      body: {
        query: 'optional test query (defaults to "happiness and joy in daily life")',
      },
    },
    tests_performed: [
      'Qwen3-Embedding-8B via DeepInfra',
      'ChromaDB connection and authentication',
      'Vector storage (save workflow)',
      'Vector retrieval (query workflow)',
      'End-to-end pipeline assessment',
    ],
  });
}