import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useStore } from "../store/useStore";
import { groupItemsByLesson } from "../lib/parser";
import { ArrowLeft, Play, BrainCircuit, BookOpen, Search, Pencil, Trash2, X, Check, FolderOpen, List } from "lucide-react";
import { VocabItem } from "../types";

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { collections, vocabItems, deleteVocabItem, updateVocabItem } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState<VocabItem | null>(null);

  const collection = collections.find(c => c.id === id);
  const collectionItems = vocabItems.filter(v => v.collectionId === id);
  const lessonGroups = groupItemsByLesson(collectionItems);

  const filteredItems = collectionItems.filter(
    item => 
      item.term.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.meaning.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateVocabItem(editingItem.id, {
        term: editingItem.term,
        meaning: editingItem.meaning,
        type: editingItem.type,
        lessonTitle: editingItem.lessonTitle
      });
      setEditingItem(null);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    if (window.confirm("Are you sure you want to delete this vocabulary item?")) {
      deleteVocabItem(itemId);
    }
  };

  if (!collection) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Collection not found</h2>
        <button onClick={() => navigate('/collections')} className="text-blue-600 dark:text-blue-400 mt-4 hover:underline">
          Go back to collections
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <button 
          onClick={() => navigate('/collections')}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Collections
        </button>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
              <FolderOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              {collection.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {lessonGroups.length} lessons • {collectionItems.length} words
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link 
              to={`/study/${collection.id}`}
              className="flex justify-center items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Study All
            </Link>
            <Link 
              to={`/quiz/${collection.id}`}
              className="flex justify-center items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              Quiz All
            </Link>
            <Link 
              to={`/active-recall/${collection.id}`}
              className="flex justify-center items-center gap-2 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-4 py-2 rounded-lg font-medium hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
            >
              <BrainCircuit className="w-4 h-4" />
              Recall All
            </Link>
          </div>
        </div>
      </header>

      {lessonGroups.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-12 text-center max-w-lg mx-auto mt-12">
          <p className="text-gray-500 dark:text-gray-400 mb-6">This collection is empty.</p>
          <Link 
            to="/import"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Add Vocabulary
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lessonGroups.map((group, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">{group.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{group.total} words</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <Link 
                    to={`/study/${collection.id}/${encodeURIComponent(group.title)}`}
                    className="flex-1 min-w-[70px] flex items-center justify-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 py-2 rounded-lg text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Study
                  </Link>
                  <Link 
                    to={`/quiz/${collection.id}/${encodeURIComponent(group.title)}`}
                    className="flex-1 min-w-[70px] flex items-center justify-center gap-1 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Quiz
                  </Link>
                  <Link 
                    to={`/active-recall/${collection.id}/${encodeURIComponent(group.title)}`}
                    className="flex-1 min-w-[70px] flex items-center justify-center gap-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 py-2 rounded-lg text-xs font-medium hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                  >
                    <BrainCircuit className="w-3.5 h-3.5" />
                    Recall
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <List className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                Vocabulary List
              </h2>
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Search words..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-64 pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm dark:text-white"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-4 py-3 font-medium">Term</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Meaning</th>
                      <th className="px-4 py-3 font-medium">Lesson</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                          {searchQuery ? "No words found matching your search." : "No words available."}
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-normal min-w-[120px]">{item.term}</td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{item.type || '-'}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-normal min-w-[200px]">{item.meaning}</td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">{item.lessonTitle}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => setEditingItem(item)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Vocabulary</h3>
              <button onClick={() => setEditingItem(null)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateItem} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Term</label>
                <input 
                  type="text" 
                  value={editingItem.term}
                  onChange={e => setEditingItem({...editingItem, term: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type (Optional)</label>
                <input 
                  type="text" 
                  value={editingItem.type || ""}
                  onChange={e => setEditingItem({...editingItem, type: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
                  placeholder="e.g. n, v, adj"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lesson</label>
                <input 
                  type="text" 
                  list="lesson-options"
                  value={editingItem.lessonTitle}
                  onChange={e => setEditingItem({...editingItem, lessonTitle: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
                  placeholder="e.g. Lesson 1"
                  required
                />
                <datalist id="lesson-options">
                  {lessonGroups.map(group => (
                    <option key={group.title} value={group.title} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meaning</label>
                <textarea 
                  value={editingItem.meaning}
                  onChange={e => setEditingItem({...editingItem, meaning: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
                  rows={3}
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setEditingItem(null)}
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
