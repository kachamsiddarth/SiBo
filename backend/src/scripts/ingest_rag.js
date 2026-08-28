import { runRagIngestion } from '../rag/ingestion/ingestPipeline.js';

async function main() {
  console.log('🏁 Executing RAG document ingestion script...');
  const forceReingest = process.argv.includes('--force');

  try {
    const summary = await runRagIngestion({ forceReingest });
    console.log('✅ RAG Ingestion finished successfully:', summary);
    process.exit(0);
  } catch (error) {
    console.error('❌ RAG Ingestion failed:', error);
    process.exit(1);
  }
}

main();
