import { VocabItem, LessonGroup } from "../types";

export function normalizeLine(line: string): string {
  // Remove leading bullets like ● • - * and trim
  return line.replace(/^[\s●•\-*]+/, "").trim().replace(/\s+/g, " ");
}

export function isLessonHeader(line: string): boolean {
  // Check against common explicit header markers
  if (/^(reading passage|lesson|unit|topic|week|day|chapter|part|section)\b/i.test(line)) return true;
  
  // Also treat lines starting with "#" or "##" as headers (Markdown style)
  if (/^#{1,3}\s/.test(line)) return true;

  // No longer greedily matching any short line without colon/parentheses
  return false;
}

export function parseVocabLine(line: string): { term: string; type: string; meaning: string } | null {
  // Regex: ^(.+?)\s*\(([^)]+)\)\s*:\s*(.+)$
  const match = line.match(/^(.+?)\s*\(([^)]+)\)\s*:\s*(.+)$/);
  if (match) {
    return {
      term: match[1].trim(),
      type: match[2].trim(),
      meaning: match[3].trim(),
    };
  }
  return null;
}

export function groupItemsByLesson(items: VocabItem[]): LessonGroup[] {
  const groups = new Map<string, VocabItem[]>();
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!groups.has(item.lessonTitle)) {
      groups.set(item.lessonTitle, []);
    }
    groups.get(item.lessonTitle)!.push(item);
  }
  
  return Array.from(groups.entries()).map(([title, lessonItems]) => ({
    title,
    collectionId: lessonItems[0]?.collectionId || "",
    items: lessonItems,
    total: lessonItems.length,
  }));
}
