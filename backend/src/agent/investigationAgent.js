import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { searchRagKnowledge } from '../rag/retriever/ragRetriever.js';
import { ChatGroq } from '@langchain/groq';
import { env } from '../config/env.js';

/**
 * Tool 1: Retrieve Payment Transaction Record
 */
export const getTransactionTool = new DynamicStructuredTool({
  name: 'getTransaction',
  description: 'Retrieve details of a payment/transaction record by its transaction_id.',
  schema: z.object({
    transaction_id: z.string().describe('The transaction_id of the payment record to retrieve')
  }),
  func: async ({ transaction_id }) => {
    const { data, error } = await supabase
      .from('payment_records')
      .select('*')
      .eq('transaction_id', transaction_id)
      .limit(1);

    if (error || !data || data.length === 0) {
      return JSON.stringify({ message: `No payment record found for transaction_id: ${transaction_id}` });
    }
    return JSON.stringify(data[0]);
  }
});

/**
 * Tool 2: Retrieve Settlement Record(s)
 */
export const getSettlementTool = new DynamicStructuredTool({
  name: 'getSettlement',
  description: 'Retrieve settlement record(s) corresponding to a transaction_id.',
  schema: z.object({
    transaction_id: z.string().describe('The transaction_id of the settlement record(s) to retrieve')
  }),
  func: async ({ transaction_id }) => {
    const { data, error } = await supabase
      .from('settlement_records')
      .select('*')
      .eq('transaction_id', transaction_id);

    if (error || !data || data.length === 0) {
      return JSON.stringify({ message: `No settlement record found for transaction_id: ${transaction_id}` });
    }
    return JSON.stringify(data);
  }
});

/**
 * Tool 3: Retrieve Deterministic Reconciliation Result
 */
export const getReconciliationResultTool = new DynamicStructuredTool({
  name: 'getReconciliationResult',
  description: 'Retrieve the deterministic reconciliation result and mathematical calculation evidence for a transaction.',
  schema: z.object({
    transaction_id: z.string().describe('The transaction_id to retrieve reconciliation results for')
  }),
  func: async ({ transaction_id }) => {
    const { data, error } = await supabase
      .from('reconciliation_results')
      .select('*')
      .eq('transaction_id', transaction_id)
      .limit(1);

    if (error || !data || data.length === 0) {
      return JSON.stringify({ message: `No deterministic reconciliation result found for transaction_id: ${transaction_id}` });
    }
    return JSON.stringify(data[0]);
  }
});

/**
 * Tool 4: Retrieve Exception Details
 */
export const getExceptionTool = new DynamicStructuredTool({
  name: 'getException',
  description: 'Retrieve exception details, category, difference, and evidence for a specific exception_id or transaction_id.',
  schema: z.object({
    exception_id: z.string().optional().describe('The UUID of the exception record'),
    transaction_id: z.string().optional().describe('The transaction_id of the exception')
  }),
  func: async ({ exception_id, transaction_id }) => {
    let query = supabase.from('exceptions').select('*, reconciliation_results(*)');

    if (exception_id) {
      query = query.eq('id', exception_id);
    } else if (transaction_id) {
      query = query.eq('transaction_id', transaction_id);
    } else {
      return JSON.stringify({ message: 'Must provide either exception_id or transaction_id.' });
    }

    const { data, error } = await query.limit(1);

    if (error || !data || data.length === 0) {
      return JSON.stringify({ message: 'Exception record not found.' });
    }
    return JSON.stringify(data[0]);
  }
});

/**
 * Tool 5: Search Razorpay Finance Knowledge Base (RAG)
 */
export const searchFinanceKnowledgeTool = new DynamicStructuredTool({
  name: 'searchFinanceKnowledge',
  description: 'Search official Razorpay documentation (settlement cycles, fees, taxes, breakup, APIs, FAQs) via RAG vector search.',
  schema: z.object({
    query: z.string().describe('Search query regarding Razorpay settlement rules, fees, tax calculations, or API semantics')
  }),
  func: async ({ query }) => {
    try {
      const results = await searchRagKnowledge(query, { topK: 3, matchThreshold: 0.15 });
      if (!results || results.length === 0) {
        return JSON.stringify({ message: `No documentation matches found for query: "${query}".` });
      }

      const formatted = results.map(r => ({
        title: r.title,
        section: r.section,
        content: r.content,
        similarity: r.similarity,
        source_url: r.metadata?.sourceUrl || r.metadata?.source_url || 'https://razorpay.com/docs/payments/settlements/'
      }));

      return JSON.stringify(formatted);
    } catch (err) {
      return JSON.stringify({ error: `RAG search failed: ${err.message}` });
    }
  }
});

/**
 * Investigates an exception using Groq LLM + LangChain RAG & Operational Data Tools
 * 
 * @param {string} exceptionId - UUID of the exception record to investigate
 * @returns {Promise<Object>} Persisted ai_investigations record
 */
export async function investigateException(exceptionId) {
  if (!exceptionId) {
    throw new Error('exceptionId is required for AI investigation.');
  }

  // 1. Fetch exception record from Supabase
  const { data: exception, error: excErr } = await supabase
    .from('exceptions')
    .select('*, reconciliation_results(*)')
    .eq('id', exceptionId)
    .single();

  if (excErr || !exception) {
    throw new Error(`Exception record not found: ${exceptionId}`);
  }

  // Update exception status to IN_PROGRESS
  await supabase
    .from('exceptions')
    .update({ ai_investigation_status: 'IN_PROGRESS' })
    .eq('id', exceptionId);

  const txnId = exception.transaction_id;
  const runId = exception.run_id;

  // 2. Direct data gather using operational tools
  const [txnStr, stStr, recStr] = await Promise.all([
    getTransactionTool.func({ transaction_id: txnId }),
    getSettlementTool.func({ transaction_id: txnId }),
    getReconciliationResultTool.func({ transaction_id: txnId })
  ]);

  const category = exception.category;
  const difference = exception.difference;
  const evidenceObj = exception.reconciliation_results?.evidence || {};

  // 3. Query RAG for domain knowledge relevant to the category
  let ragQuery = 'settlement fee tax calculation breakup';
  if (category === 'MISSING_SETTLEMENT') ragQuery = 'settlement cycle T+2 days unpaid settlement status';
  if (category === 'DUPLICATE_TRANSACTION') ragQuery = 'duplicate settlement transaction breakup API';
  if (category === 'COMPONENT_MISMATCH') ragQuery = 'settlement breakup fee GST tax adjustment refund';
  if (category === 'AMOUNT_MISMATCH') ragQuery = 'settlement amount mismatch dispute net payout';

  const ragStr = await searchFinanceKnowledgeTool.func({ query: ragQuery });
  const ragDocs = JSON.parse(ragStr);

  const sourceUrls = Array.isArray(ragDocs) 
    ? [...new Set(ragDocs.map(d => d.source_url).filter(Boolean))]
    : [];

  // 4. Initialize Groq LLM with structured output requirement
  const llm = new ChatGroq({
    apiKey: env.GROQ_API_KEY,
    model: env.GROQ_MODEL,
    temperature: 0.1,
  });

  const prompt = `
You are the AI Finance Controller for SiBo (Razorpay Buildathon Track 04).
You are investigating a financial reconciliation exception.

CRITICAL INSTRUCTIONS:
1. The deterministic reconciliation engine is the ABSOLUTE SOURCE OF TRUTH for math. DO NOT recalculate or change numbers.
2. Explain WHY this discrepancy occurred based strictly on the operational evidence and official Razorpay documentation provided below.
3. If evidence is insufficient, explicitly state that evidence is insufficient.
4. CITE official Razorpay documentation rules when applicable.
5. Return your analysis in valid JSON format.

OPERATIONAL EVIDENCE:
- Exception ID: ${exceptionId}
- Transaction ID: ${txnId}
- Category: ${category}
- Discrepancy Amount: ${difference}
- Payment Record: ${txnStr}
- Settlement Record(s): ${stStr}
- Deterministic Rec Result: ${recStr}
- Evidence Details: ${JSON.stringify(evidenceObj)}

OFFICIAL RAZORPAY DOCUMENTATION CONTEXT:
${JSON.stringify(ragDocs, null, 2)}

Provide your response in strictly valid JSON with the following schema:
{
  "summary": "Clear, 1-2 sentence executive summary of the exception and its cause.",
  "evidence": ["Bullet point 1 of operational evidence", "Bullet point 2..."],
  "reasoning": "Detailed technical analysis explaining why the discrepancy occurred according to Razorpay documentation and operational data.",
  "recommended_action": "Specific, actionable next step for the finance operations team.",
  "confidence": "high" | "medium" | "low",
  "status": "EXPLAINED" | "UNRESOLVED" | "MANUAL_REVIEW"
}
`;

  console.log(`🤖 Invoking Groq LLM (${env.GROQ_MODEL}) for exception investigation: ${exceptionId}...`);
  const response = await llm.invoke(prompt);
  const responseText = response.content;

  let parsedAnalysis;
  try {
    // Extract JSON block if surrounded by markdown code fences
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText;
    parsedAnalysis = JSON.parse(jsonString);
  } catch (err) {
    console.warn('⚠️ LLM output was not strict JSON, formatting fallback object.');
    parsedAnalysis = {
      summary: `Exception ${txnId} (${category}) investigated by AI.`,
      evidence: [
        `Transaction ID: ${txnId}`,
        `Discrepancy: ${difference}`,
        `Category: ${category}`
      ],
      reasoning: responseText,
      recommended_action: 'Perform manual review of settlement breakup and bank statement.',
      confidence: 'medium',
      status: 'MANUAL_REVIEW'
    };
  }

  // 5. Build record for ai_investigations table
  const aiInvestigationRecord = {
    exception_id: exceptionId,
    run_id: runId,
    summary: parsedAnalysis.summary || `Exception ${txnId} (${category}) analysis complete.`,
    evidence: parsedAnalysis.evidence || [],
    reasoning: parsedAnalysis.reasoning || 'Analysis completed.',
    recommended_action: parsedAnalysis.recommended_action || 'Review settlement details.',
    confidence: parsedAnalysis.confidence || 'medium',
    status: parsedAnalysis.status || 'EXPLAINED',
    sources_used: sourceUrls.map(url => ({ title: 'Razorpay Settlement Documentation', url }))
  };

  // 6. Persist investigation into Supabase ai_investigations table
  const { data: insertedInvestigation, error: invErr } = await supabase
    .from('ai_investigations')
    .insert([aiInvestigationRecord])
    .select()
    .single();

  if (invErr) {
    console.error('❌ Failed to insert into ai_investigations table:', invErr.message);
    throw new Error(`Failed to persist AI investigation: ${invErr.message}`);
  }

  // 7. Update status in exceptions table
  await supabase
    .from('exceptions')
    .update({
      status: parsedAnalysis.status || 'EXPLAINED',
      ai_investigation_status: 'COMPLETED',
      updated_at: new Date().toISOString()
    })
    .eq('id', exceptionId);

  console.log(`✅ AI Investigation complete for exception ${exceptionId}. Persisted as ${insertedInvestigation.id}`);

  return insertedInvestigation;
}

export default {
  getTransactionTool,
  getSettlementTool,
  getReconciliationResultTool,
  getExceptionTool,
  searchFinanceKnowledgeTool,
  investigateException
};
