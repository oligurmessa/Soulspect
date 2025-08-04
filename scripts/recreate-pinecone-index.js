#!/usr/bin/env node

/**
 * Recreate Pinecone Index with Correct Dimensions
 * 
 * This script deletes and recreates the Pinecone index with the correct dimensions
 * WARNING: This will delete all existing vector data!
 */

const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.join(__dirname, '..', '.env.local') });

async function recreateIndex() {
  console.log('🚨 RECREATING PINECONE INDEX - ALL DATA WILL BE LOST!');
  console.log('⏳ Waiting 5 seconds... Press Ctrl+C to cancel\n');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    const { Pinecone } = await import('@pinecone-database/pinecone');
    
    const apiKey = process.env.PINECONE_API_KEY || process.env.NEXT_PUBLIC_PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error('No Pinecone API key found');
    }
    
    const pinecone = new Pinecone({ apiKey });
    const indexName = 'soulspect-index';
    
    console.log('🗑️ Deleting existing index...');
    try {
      await pinecone.deleteIndex(indexName);
      console.log('✅ Existing index deleted');
    } catch (error) {
      if (error.message.includes('404')) {
        console.log('ℹ️ Index did not exist');
      } else {
        throw error;
      }
    }
    
    console.log('⏳ Waiting for deletion to complete...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    console.log('🔨 Creating new index with correct dimensions...');
    await pinecone.createIndex({
      name: indexName,
      dimension: 3072, // Correct dimension for text-embedding-3-large
      metric: 'cosine',
      spec: {
        serverless: {
          cloud: 'aws',
          region: 'us-east-1',
        },
      },
    });
    
    console.log('✅ New index created successfully');
    console.log('⏳ Waiting for index to be ready...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    // Test the new index
    const index = pinecone.index(indexName);
    const stats = await index.describeIndexStats();
    
    console.log('📊 New Index Stats:', {
      dimension: stats.dimension,
      totalRecords: stats.totalRecordCount,
      indexFullness: stats.indexFullness,
    });
    
    console.log('\n🎉 Index recreation complete!');
    console.log('⚠️ Note: You will need to re-index all existing moments');
    
  } catch (error) {
    console.error('❌ Recreation failed:', error.message);
    process.exit(1);
  }
}

recreateIndex().catch(console.error);