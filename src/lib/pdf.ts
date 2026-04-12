import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    
    // We might need to handle newlines better, but for now we join with space
    // and let the parser handle it if there are clear delimiters.
    // Actually, getTextContent returns items that might be on different lines.
    // Let's try to reconstruct lines based on 'transform' y-coordinate if needed,
    // but a simpler approach is to join items that have a newline or large gap.
    // Let's just join with newline if the item has 'hasEOL' or if we just join all with newline.
    // Actually, pdfjs text items don't always have hasEOL.
    // Let's do a basic reconstruction:
    
    let lastY = -1;
    let text = '';
    for (const item of textContent.items as any[]) {
      if (lastY !== item.transform[5] && lastY !== -1) {
        text += '\n';
      }
      text += item.str;
      lastY = item.transform[5];
    }
    fullText += text + '\n';
  }
  
  return fullText;
}

export async function extractTextFromTxt(file: File): Promise<string> {
  return await file.text();
}
