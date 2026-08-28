import { env } from '../config/env.js';

async function testQwenDirect() {
  const text = "Razorpay settlement cycle T+2 working days";
  
  // Test Hugging Face Router endpoint for Qwen/Qwen3-Embedding-0.6B
  const endpoint = `https://router.huggingface.co/hf-inference/models/${env.HF_EMBEDDING_MODEL}`;
  console.log(`Testing HF Router endpoint for ${env.HF_EMBEDDING_MODEL}: ${endpoint}...`);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.HF_TOKEN}`,
        'Content-Type': 'application/json',
        'x-use-cache': 'false',
      },
      body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
    });

    console.log(`HTTP Status: ${res.status}`);
    const textRes = await res.text();
    console.log(`Response body preview: ${textRes.slice(0, 300)}`);
    if (res.ok) {
      const data = JSON.parse(textRes);
      let vector = Array.isArray(data[0]) ? data[0] : data;
      if (Array.isArray(vector[0])) vector = vector[0];
      console.log(`✅ Qwen vector dimension:`, vector.length);
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

testQwenDirect();
