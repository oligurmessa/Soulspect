#!/usr/bin/env node

/**
 * Vector Database Test Script
 * 
 * This script tests the vector database connectivity and indexing functionality
 * Run with: node scripts/test-vector-db.js
 */

const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.join(__dirname, '..', '.env.local') });

async function testVectorDB() {
  console.log('🚀 Testing Vector Database Connection...\n');
  
  try {
    // Test environment variables
    console.log('📋 Environment Variables:');
    console.log('- PINECONE_API_KEY:', process.env.PINECONE_API_KEY ? '✅ Present' : '❌ Missing');
    console.log('- NEXT_PUBLIC_PINECONE_API_KEY:', process.env.NEXT_PUBLIC_PINECONE_API_KEY ? '✅ Present' : '❌ Missing');
    console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Present' : '❌ Missing');
    console.log('- NEXT_PUBLIC_OPENAI_API_KEY:', process.env.NEXT_PUBLIC_OPENAI_API_KEY ? '✅ Present' : '❌ Missing');
    console.log();

    // Test Pinecone connection
    console.log('🔍 Testing Pinecone Connection...');
    const { Pinecone } = await import('@pinecone-database/pinecone');
    
    const apiKey = process.env.PINECONE_API_KEY || process.env.NEXT_PUBLIC_PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error('No Pinecone API key found');
    }
    
    const pinecone = new Pinecone({ apiKey });
    const index = pinecone.index('soulspect-index');
    
    try {
      const stats = await index.describeIndexStats();
      console.log('✅ Pinecone connected successfully');
      console.log('📊 Index Stats:', {
        totalRecords: stats.totalRecordCount,
        dimension: stats.dimension,
        indexFullness: stats.indexFullness,
        namespaces: Object.keys(stats.namespaces || {}).length
      });
    } catch (pineconeError) {
      console.log('❌ Pinecone connection failed:', pineconeError.message);
      if (pineconeError.message.includes('404')) {
        console.log('💡 Index "soulspect-index" may not exist. Creating it...');
        
        try {
          await pinecone.createIndex({
            name: 'soulspect-index',
            dimension: 1536,
            metric: 'cosine',
            spec: {
              serverless: {
                cloud: 'aws',
                region: 'us-east-1',
              },
            },
          });
          console.log('✅ Index created successfully');
          
          // Wait for index to be ready
          console.log('⏳ Waiting for index to be ready...');
          await new Promise(resolve => setTimeout(resolve, 60000));
          
          const newStats = await index.describeIndexStats();
          console.log('✅ Index is now ready:', newStats);
        } catch (createError) {
          console.log('❌ Failed to create index:', createError.message);
        }
      }
    }
    console.log();

    // Test OpenAI connection
    console.log('🤖 Testing OpenAI Connection...');
    const OpenAI = await import('openai');
    
    const openaiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!openaiKey) {
      throw new Error('No OpenAI API key found');
    }
    
    const openai = new (OpenAI.default || OpenAI)({ apiKey: openaiKey });
    
    let embeddingResponse = null;
    try {
      embeddingResponse = await openai.embeddings.create({
        input: 'Test embedding generation',
        model: 'text-embedding-3-large',
      });
      
      console.log('✅ OpenAI connected successfully');
      console.log('📊 Embedding:', {
        dimensions: embeddingResponse.data[0].embedding.length,
        model: embeddingResponse.model,
        usage: embeddingResponse.usage
      });
    } catch (openaiError) {
      console.log('❌ OpenAI connection failed:', openaiError.message);
    }
    console.log();

    // Test vector indexing
    console.log('🔄 Testing Vector Indexing...');
    try {
      if (!embeddingResponse) {
        throw new Error('No embedding response available for testing');
      }
      
      const testVector = embeddingResponse.data[0].embedding;
      const testUserId = 'test-user-123';
      const testMomentId = 'test-moment-' + Date.now();
      
      await index.namespace('user_' + testUserId).upsert([
        {
          id: testMomentId,
          values: testVector,
          metadata: {
            userId: testUserId,
            momentId: testMomentId,
            momentType: 'journal',
            timestamp: Date.now(),
            preview: 'Test moment for vector indexing',
          },
        },
      ]);
      
      console.log('✅ Vector indexing successful');
      
      // Test vector search
      console.log('🔍 Testing Vector Search...');
      const searchResults = await index.namespace('user_' + testUserId).query({
        vector: testVector,
        topK: 5,
        includeMetadata: true,
        filter: { userId: testUserId },
      });
      
      console.log('✅ Vector search successful');
      console.log('📊 Search Results:', {
        matches: searchResults.matches?.length || 0,
        topScore: searchResults.matches?.[0]?.score || 0,
      });
      
      // Clean up test data
      await index.namespace('user_' + testUserId).deleteOne(testMomentId);
      console.log('🧹 Test data cleaned up');
      
    } catch (vectorError) {
      console.log('❌ Vector operations failed:', vectorError.message);
    }
    
    console.log('\n🎉 Vector Database Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testVectorDB().catch(console.error);