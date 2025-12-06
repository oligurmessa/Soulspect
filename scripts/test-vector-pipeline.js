#!/usr/bin/env node

/**
 * Vector Pipeline Test Script
 * 
 * Usage:
 *   node scripts/test-vector-pipeline.js
 *   node scripts/test-vector-pipeline.js "custom query here"
 */

const API_BASE = 'http://localhost:3000';

async function testVectorPipeline(query = null) {
  const url = `${API_BASE}/api/test-vector-pipeline`;
  
  try {
    console.log('🧪 Testing Vector Pipeline...\n');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query ? { query } : {}),
    });
    
    const result = await response.json();
    
    // Print summary
    console.log('📊 VECTOR PIPELINE TEST RESULTS');
    console.log('=' .repeat(50));
    console.log(`🕐 Test completed: ${result.timestamp}`);
    console.log(`🔍 Query: "${result.testQuery}"`);
    console.log('');
    
    // Print environment status
    console.log('🌍 ENVIRONMENT');
    console.log(`   DeepInfra API: ${result.environment.deepinfra_api_key ? '✅' : '❌'} (${result.environment.deepinfra_api_key ? 'configured' : 'missing'})`);
    console.log(`   ChromaDB URL: ${result.environment.chroma_url}`);
    console.log(`   ChromaDB Auth: ${result.environment.chroma_api_key ? '✅' : '❌'} (${result.environment.chroma_api_key ? 'configured' : 'missing'})`);
    console.log('');
    
    // Print test results
    console.log('🧪 TEST RESULTS');
    Object.entries(result.tests).forEach(([testName, test]) => {
      const status = test.status === 'success' ? '✅' : '❌';
      const displayName = testName.replace(/_/g, ' ').toUpperCase();
      console.log(`   ${status} ${displayName}: ${test.message}`);
      if (test.error) {
        console.log(`       Error: ${test.error}`);
      }
    });
    console.log('');
    
    // Print performance metrics
    console.log('⚡ PERFORMANCE');
    console.log(`   Embedding Generation: ${result.performance.embedding_time_ms}ms`);
    console.log(`   Vector Storage: ${result.performance.storage_time_ms}ms`);
    console.log(`   Vector Retrieval: ${result.performance.search_time_ms}ms`);
    console.log(`   Total Pipeline: ${result.performance.total_time_ms}ms`);
    console.log('');
    
    // Print vector details
    console.log('🔬 VECTOR DETAILS');
    console.log(`   Model: ${result.vector_details.model}`);
    console.log(`   Dimensions: ${result.vector_details.sample_vector_length}/${result.vector_details.dimensions}`);
    console.log(`   Sample Vector: [${result.vector_details.sample_vector_preview.map(v => v.toFixed(4)).join(', ')}...]`);
    console.log('');
    
    // Print search results
    if (result.test_data.search_results.length > 0) {
      console.log('🎯 SEMANTIC SEARCH RESULTS');
      result.test_data.search_results.forEach((result, index) => {
        const score = result.score.toFixed(4);
        const preview = result.document.substring(0, 60) + (result.document.length > 60 ? '...' : '');
        console.log(`   ${index + 1}. Score: ${score} | "${preview}"`);
      });
      console.log('');
    }
    
    // Print overall status
    const allPassed = Object.values(result.tests).every(test => test.status === 'success');
    console.log('🏁 PIPELINE HEALTH');
    if (allPassed) {
      console.log('   ✅ EXCELLENT - All systems operational!');
      console.log(`   🚀 Full pipeline completed in ${result.performance.total_time_ms}ms`);
    } else {
      console.log('   ⚠️  DEGRADED - Some issues detected');
      const failedTests = Object.entries(result.tests)
        .filter(([_, test]) => test.status === 'error')
        .map(([name, _]) => name.replace(/_/g, ' '));
      console.log(`   🔧 Failed components: ${failedTests.join(', ')}`);
    }
    
    console.log('\n' + '='.repeat(50));
    
    if (!response.ok) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error running vector pipeline test:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const query = process.argv[2];

// Run the test
testVectorPipeline(query);