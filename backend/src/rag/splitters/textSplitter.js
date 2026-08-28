import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

/**
 * Splits Markdown document content into contextual chunks while preserving header context.
 */
export async function splitMarkdownDocument(document, options = {}) {
  const chunkSize = options.chunkSize || 800;
  const chunkOverlap = options.chunkOverlap || 150;

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators: ['\n## ', '\n### ', '\n#### ', '\n\n', '\n', ' ', ''],
  });

  const rawChunks = await splitter.splitText(document.content);

  const chunks = rawChunks.map((chunkContent, index) => {
    // Extract section header if present in chunk or default to document title
    const sectionMatch = chunkContent.match(/^#{2,4}\s+(.+)$/m);
    const section = sectionMatch ? sectionMatch[1].trim() : 'General';

    return {
      chunkIndex: index,
      title: document.title,
      section,
      content: chunkContent.trim(),
      metadata: {
        documentTitle: document.title,
        fileName: document.fileName,
        sourceUrl: document.sourceUrl,
        section,
        chunkIndex: index,
        contentLength: chunkContent.length,
      },
    };
  });

  return chunks;
}
