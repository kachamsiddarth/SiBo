import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL: z.string().default('https://placeholder.supabase.co'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('placeholder_service_role_key'),
  SUPABASE_ANON_KEY: z.string().default('placeholder_anon_key'),
  GROQ_API_KEY: z.string().default('placeholder_groq_api_key'),
  GROQ_MODEL: z.string().default('openai/gpt-oss-120b'),
  HF_TOKEN: z.string().default('placeholder_hf_token'),
  HF_EMBEDDING_MODEL: z.string().default('Qwen/Qwen3-Embedding-0.6B'),
});

let parsedEnv;

try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Environment configuration error:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
  } else {
    console.error('❌ Unknown environment configuration error:', error);
  }
  // Fallback defaults for dev startup inspection if invalid
  parsedEnv = envSchema.parse({});
}

export const env = parsedEnv;

export function validateSecretsForProduction() {
  const warnings = [];
  if (env.SUPABASE_URL.includes('placeholder')) warnings.push('SUPABASE_URL is missing or placeholder');
  if (env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')) warnings.push('SUPABASE_SERVICE_ROLE_KEY is missing or placeholder');
  if (env.GROQ_API_KEY.includes('placeholder')) warnings.push('GROQ_API_KEY is missing or placeholder');
  if (env.HF_TOKEN.includes('placeholder')) warnings.push('HF_TOKEN is missing or placeholder');

  if (warnings.length > 0) {
    console.warn('⚠️ Environment warning: Some API credentials are using placeholder values:');
    warnings.forEach((w) => console.warn(`  - ${w}`));
    console.warn('  Ensure real keys are added to .env before executing DB migration, RAG, or AI workflows.');
  } else {
    console.log('✅ All environment secrets are loaded.');
  }
}
