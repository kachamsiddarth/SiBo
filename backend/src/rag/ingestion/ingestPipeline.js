import { loadRagDocuments } from '../loaders/markdownLoader.js';
import { splitMarkdownDocument } from '../splitters/textSplitter.js';
import { getEmbeddingsForChunks } from '../embeddings/hfEmbeddings.js';
import { supabase } from '../../config/supabase.js';

/**
 * Runs the idempotent RAG document ingestion pipeline against Supabase pgvector.
 */
export async function runRagIngestion(options = {}) {
  const forceReingest = options.forceReingest || false;
  console.log('🚀 RAG Ingestion Pipeline Started...');

  const summary = {
    discoveredDocs: 0,
    processedDocs: 0,
    skippedDocs: 0,
    totalChunksCreated: 0,
    totalEmbeddingsStored: 0,
    errors: [],
  };

  try {
    const documents = await loadRagDocuments(options.baseDir || process.cwd());
    summary.discoveredDocs = documents.length;
    console.log(`📄 Discovered ${documents.length} Razorpay Markdown source document(s).`);

    for (const doc of documents) {
      console.log(`\n📖 Processing document: ${doc.fileName} ("${doc.title}")`);

      // 1. Check if document exists in rag_documents table
      const { data: existingDoc, error: checkErr } = await supabase
        .from('rag_documents')
        .select('id, file_path, source_url')
        .eq('file_path', doc.filePath)
        .maybeSingle();

      if (checkErr) {
        console.error(`❌ Database check error for ${doc.fileName}:`, checkErr.message);
        summary.errors.push({ file: doc.fileName, error: checkErr.message });
        continue;
      }

      let documentId = existingDoc ? existingDoc.id : null;

      if (existingDoc && !forceReingest) {
        // Check if chunks already exist for this document
        const { count, error: countErr } = await supabase
          .from('rag_chunks')
          .select('id', { count: 'exact', head: true })
          .eq('document_id', existingDoc.id);

        if (!countErr && count > 0) {
          console.log(`⏩ Document "${doc.title}" already ingested (${count} chunks exist). Skipping.`);
          summary.skippedDocs++;
          continue;
        }
      }

      // 2. Upsert document record in rag_documents
      if (!documentId) {
        const { data: insertedDoc, error: insertDocErr } = await supabase
          .from('rag_documents')
          .insert([
            {
              title: doc.title,
              source: doc.source,
              source_url: doc.sourceUrl,
              file_path: doc.filePath,
            },
          ])
          .select('id')
          .single();

        if (insertDocErr) {
          console.error(`❌ Failed to insert document record for ${doc.fileName}:`, insertDocErr.message);
          summary.errors.push({ file: doc.fileName, error: insertDocErr.message });
          continue;
        }
        documentId = insertedDoc.id;
      } else if (forceReingest) {
        // Clear existing chunks for re-ingestion
        await supabase.from('rag_chunks').delete().eq('document_id', documentId);
      }

      // 3. Split document into chunks
      const chunks = await splitMarkdownDocument(doc);
      console.log(`✂️ Created ${chunks.length} text chunks for "${doc.title}".`);
      summary.totalChunksCreated += chunks.length;

      // 4. Generate embeddings for all chunks
      const embeddedChunks = await getEmbeddingsForChunks(chunks);

      // 5. Insert chunks into rag_chunks table in Supabase
      const chunkRecords = embeddedChunks.map((c) => ({
        document_id: documentId,
        title: c.title,
        section: c.section,
        content: c.content,
        chunk_index: c.chunkIndex,
        metadata: c.metadata,
        embedding: c.embedding,
      }));

      const { data: insertedChunks, error: chunkInsertErr } = await supabase
        .from('rag_chunks')
        .insert(chunkRecords)
        .select('id');

      if (chunkInsertErr) {
        console.error(`❌ Failed to store chunks in Supabase for ${doc.fileName}:`, chunkInsertErr.message);
        summary.errors.push({ file: doc.fileName, error: chunkInsertErr.message });
        continue;
      }

      const insertedCount = insertedChunks ? insertedChunks.length : chunkRecords.length;
      console.log(`✅ Successfully stored ${insertedCount} vector chunks (1024d) in Supabase pgvector!`);
      summary.totalEmbeddingsStored += insertedCount;
      summary.processedDocs++;
    }

    console.log('\n🎉 RAG Ingestion Pipeline Completed!');
    console.log(`  - Discovered Docs: ${summary.discoveredDocs}`);
    console.log(`  - Processed Docs: ${summary.processedDocs}`);
    console.log(`  - Skipped Docs: ${summary.skippedDocs}`);
    console.log(`  - Chunks Created: ${summary.totalChunksCreated}`);
    console.log(`  - Embeddings Stored: ${summary.totalEmbeddingsStored}`);
    if (summary.errors.length > 0) {
      console.warn(`  - Warnings/Errors: ${summary.errors.length}`);
    }

    return summary;
  } catch (error) {
    console.error('❌ Fatal error during RAG ingestion pipeline:', error.message || error);
    throw error;
  }
}
