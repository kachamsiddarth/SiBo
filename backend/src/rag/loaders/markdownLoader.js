import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Discovers and loads official Razorpay Markdown documents from Rag/ or Rag/sources/
 */
export async function loadRagDocuments(baseDir) {
  const possiblePaths = [
    baseDir,
    path.join(baseDir, 'Rag'),
    path.join(baseDir, 'Rag/sources'),
    path.join(process.cwd(), 'Rag'),
    path.join(process.cwd(), 'Rag/sources'),
    path.resolve(process.cwd(), '..', 'Rag'),
    path.resolve(process.cwd(), '..', 'Rag', 'sources'),
  ];

  let targetDir = null;
  for (const p of possiblePaths) {
    if (p && fs.existsSync(p) && fs.statSync(p).isDirectory()) {
      const files = fs.readdirSync(p).filter((f) => f.endsWith('.md'));
      if (files.length > 0) {
        targetDir = p;
        break;
      }
    }
  }

  if (!targetDir) {
    throw new Error(`RAG source directory not found or contains no Markdown files in paths: ${possiblePaths.join(', ')}`);
  }

  console.log(`📂 Discovered RAG source Markdown directory: ${targetDir}`);
  const fileNames = fs.readdirSync(targetDir).filter((f) => f.endsWith('.md')).sort();

  const documents = fileNames.map((fileName) => {
    const filePath = path.join(targetDir, fileName);
    const rawContent = fs.readFileSync(filePath, 'utf8');

    // Extract title from first H1 line if present, else derive from filename
    const h1Match = rawContent.match(/^#\s+(.+)$/m);
    const title = h1Match ? h1Match[1].trim() : fileName.replace(/^\d+-/, '').replace('.md', '').replace(/-/g, ' ');

    // Extract source URL if present in header index note
    const urlMatch = rawContent.match(/https?:\/\/[^\s]+/);
    const sourceUrl = urlMatch ? urlMatch[0] : 'https://razorpay.com/docs/settlements';

    const hash = crypto.createHash('sha256').update(rawContent).digest('hex');

    return {
      fileName,
      filePath,
      title,
      sourceUrl,
      source: 'Razorpay Official Documentation',
      content: rawContent,
      hash,
    };
  });

  return documents;
}
