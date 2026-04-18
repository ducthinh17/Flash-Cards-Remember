import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { normalizeLine, isLessonHeader, parseVocabLine } from "../lib/parser";
import { extractTextFromPdf, extractTextFromTxt } from "../lib/pdf";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, PlusCircle, FolderOpen, Keyboard, Eye } from "lucide-react";
import { VocabItem } from "../types";

export default function Import() {
  const navigate = useNavigate();
  const { collections, addCollection, addVocabItems } = useStore();
  
  const [text, setText] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  
  const [preview, setPreview] = useState<{
    lessons: number;
    words: number;
    skipped: number;
    parsedItems: Omit<VocabItem, 'id' | 'createdAt' | 'correctCount' | 'wrongCount'>[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError("");
    try {
      let extractedText = "";
      if (file.type === "application/pdf") {
        extractedText = await extractTextFromPdf(file);
      } else if (file.type === "text/plain") {
        extractedText = await extractTextFromTxt(file);
      } else {
        throw new Error("Unsupported file type. Please upload a PDF or TXT file.");
      }
      
      if (!extractedText.trim()) {
        throw new Error("No extractable text found in the file.");
      }
      
      setText(extractedText);
      processText(extractedText);
    } catch (err: any) {
      setError(err.message || "Failed to process file.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const processText = (inputText: string = text) => {
    if (!inputText.trim()) {
      setPreview(null);
      return;
    }

    const lines = inputText.split('\n');
    let currentLesson = "Default Lesson";
    const parsedItems: Omit<VocabItem, 'id' | 'createdAt' | 'correctCount' | 'wrongCount'>[] = [];
    let skipped = 0;
    const lessonsSet = new Set<string>();

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const line = normalizeLine(rawLine);
      if (!line) continue;

      if (isLessonHeader(line)) {
        currentLesson = line;
        lessonsSet.add(currentLesson);
        continue;
      }

      const parsed = parseVocabLine(line);
      if (parsed) {
        parsedItems.push({
          ...parsed,
          lessonTitle: currentLesson,
          collectionId: "", // Will be set on save
          easeFactor: 2.5,
          interval: 0,
          isHard: false
        });
        lessonsSet.add(currentLesson);
      } else {
        skipped++;
      }
    }

    setPreview({
      lessons: lessonsSet.size,
      words: parsedItems.length,
      skipped,
      parsedItems,
    });
  };

  const handleSave = () => {
    if (!preview || preview.words === 0) {
      setError("No valid vocabulary found to save.");
      return;
    }

    let targetCollectionId = collectionId;

    if (!targetCollectionId) {
      if (!newCollectionName.trim()) {
        setError("Please select or create a collection.");
        return;
      }
      const newCol = addCollection(newCollectionName.trim());
      targetCollectionId = newCol.id;
    }

    const itemsToSave = preview.parsedItems.map(item => ({
      ...item,
      collectionId: targetCollectionId,
    }));

    addVocabItems(itemsToSave);
    navigate(`/collections/${targetCollectionId}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <PlusCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          Add New Vocabulary
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Upload a PDF or TXT file, or paste your vocabulary list.</p>
      </header>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-xl flex items-start gap-3 border border-red-100 dark:border-red-800/50">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Collection Selection */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <FolderOpen className="w-5 h-5 text-indigo-500" />
              1. Choose Collection
            </h2>
            <div className="space-y-4">
              {collections.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Existing Collection</label>
                  <select 
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    value={collectionId}
                    onChange={(e) => {
                      setCollectionId(e.target.value);
                      if (e.target.value) setNewCollectionName("");
                    }}
                  >
                    <option value="">-- Select --</option>
                    {collections.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="relative">
                {collections.length > 0 && <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-200 dark:border-gray-700"></div></div>}
                {collections.length > 0 && <div className="relative flex justify-center"><span className="px-2 bg-white dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 uppercase transition-colors">Or create new</span></div>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Collection Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. IELTS Reading Test 3"
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  value={newCollectionName}
                  onChange={(e) => {
                    setNewCollectionName(e.target.value);
                    if (e.target.value) setCollectionId("");
                  }}
                />
              </div>
            </div>
          </section>

          {/* Input Area */}
          <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Keyboard className="w-5 h-5 text-emerald-500" />
              2. Input Vocabulary
            </h2>
            
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer mb-4"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".txt,.pdf"
                onChange={handleFileUpload}
              />
              <UploadCloud className="w-10 h-10 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">Click to upload PDF or TXT</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Text will be extracted automatically</p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-200 dark:border-gray-700"></div></div>
              <div className="relative flex justify-center"><span className="px-2 bg-white dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 uppercase transition-colors">Or paste text</span></div>
            </div>

            <textarea
              className="w-full h-48 mt-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="Lesson 1&#10;polymer (n, C): polyme&#10;take off (phrasal verb): phát triển nhanh chóng"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => processText()}
                disabled={!text.trim() || isProcessing}
                className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-2.5 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? "Processing..." : "Process Text"}
              </button>
              <button 
                onClick={() => { setText(""); setPreview(null); setError(""); }}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Clear
              </button>
            </div>
          </section>
        </div>

        {/* Preview Area */}
        <div>
          <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col transition-colors">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-purple-500" />
              3. Import Preview
            </h2>
            
            {!preview ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                <FileText className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">Process text to see preview</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl text-center transition-colors">
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Words</p>
                    <p className="text-2xl font-semibold text-blue-900 dark:text-blue-100">{preview.words}</p>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-xl text-center transition-colors">
                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Lessons</p>
                    <p className="text-2xl font-semibold text-indigo-900 dark:text-indigo-100">{preview.lessons}</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-xl text-center transition-colors">
                    <p className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">Skipped</p>
                    <p className="text-2xl font-semibold text-orange-900 dark:text-orange-100">{preview.skipped}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-[200px] border border-gray-100 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900/50 mb-6 transition-colors">
                  {preview.parsedItems.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="mb-3 last:mb-0 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.lessonTitle}</div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-gray-900 dark:text-white">{item.term}</span>
                        <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded transition-colors">{item.type}</span>
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">{item.meaning}</div>
                    </div>
                  ))}
                  {preview.words > 5 && (
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                      + {preview.words - 5} more words
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleSave}
                  disabled={preview.words === 0}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Save Vocabulary
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
