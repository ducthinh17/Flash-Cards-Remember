import { VocabItem, LessonGroup } from "../types";

export function normalizeLine(line: string): string {
  // Remove leading bullets like ● • - * and trim
  return line.replace(/^[\s●•\-*]+/, "").trim().replace(/\s+/g, " ");
}

export function isLessonHeader(line: string): boolean {
  const lower = line.toLowerCase();
  if (lower.startsWith("reading passage")) return true;
  if (lower.startsWith("lesson")) return true;
  if (lower.startsWith("unit")) return true;
  if (lower.startsWith("topic")) return true;
  
  // If it's a short line without a colon, it might be a header
  if (line.length > 0 && line.length < 50 && !line.includes(":")) return true;
  
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
