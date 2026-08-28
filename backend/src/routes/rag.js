import express from 'express';
import { searchRagKnowledge } from '../rag/retriever/ragRetriever.js';
import { runRagIngestion } from '../rag/ingestion/ingestPipeline.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

/**
 * @route   POST /api/rag/search
 * @desc    Execute semantic vector retrieval against Razorpay domain knowledge
 * @access  Public
 */
router.post('/rag/search', async (req, res, next) => {
  try {
    const { query, topK, matchThreshold } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        error: 'BadRequest',
        message: 'Request body must contain a non-empty string field "query".',
      });
    }

    const results = await searchRagKnowledge(query, {
      topK: topK ? parseInt(topK, 10) : 5,
      matchThreshold: matchThreshold ? parseFloat(matchThreshold) : 0.15,
    });

    return res.json({
      query: query.trim(),
      resultCount: results.length,
      results,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/rag/ingest
 * @desc    Trigger RAG document ingestion pipeline
 * @access  Public
 */
router.post('/rag/ingest', async (req, res, next) => {
  try {
    const { forceReingest } = req.body || {};
    const summary = await runRagIngestion({ forceReingest: !!forceReingest });

    return res.json({
      status: 'success',
      message: 'RAG ingestion completed successfully.',
      summary,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/rag/documents
 * @desc    Get summary of ingested RAG documents and vector chunk counts
 * @access  Public
 */
router.get('/rag/documents', async (req, res, next) => {
  try {
    const { data: docs, error: docErr } = await supabase
      .from('rag_documents')
      .select('id, title, source, source_url, file_path, created_at');

    if (docErr) throw docErr;

    const { count: totalChunks, error: chunkErr } = await supabase
      .from('rag_chunks')
      .select('id', { count: 'exact', head: true });

    if (chunkErr) throw chunkErr;

    return res.json({
      documents: docs || [],
      totalDocuments: docs ? docs.length : 0,
      totalVectorChunks: totalChunks || 0,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
