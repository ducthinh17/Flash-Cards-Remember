import { Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { BookOpen, PlusCircle, Trash2 } from "lucide-react";

export default function Collections() {
  const { collections, vocabItems, deleteCollection } = useStore();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Collections</h1>
          <p className="text-gray-500 mt-1">Manage your vocabulary projects and topics.</p>
        </div>
        <Link 
          to="/import"
          className="hidden md:flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          New Collection
        </Link>
      </header>

      {collections.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center max-w-lg mx-auto mt-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">No collections yet</h2>
          <p className="text-gray-500 mb-6">Create your first collection by importing some vocabulary.</p>
          <Link 
            to="/import"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            Add Vocabulary
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map(collection => {
            const collectionItems = vocabItems.filter(v => v.collectionId === collection.id);
            const uniqueLessons = new Set(collectionItems.map(v => v.lessonTitle)).size;
            
            return (
              <div key={collection.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-1" title={collection.name}>
                      {collection.name}
                    </h3>
                    <button 
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this collection?')) {
                          deleteCollection(collection.id);
                        }
                      }}
                      className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                      title="Delete Collection"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-4 mt-4 text-sm text-gray-500">
                    <div>
                      <span className="font-medium text-gray-900">{uniqueLessons}</span> lessons
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{collectionItems.length}</span> words
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex gap-2">
                  <Link 
                    to={`/collections/${collection.id}`}
                    className="flex-1 text-center bg-white border border-gray-200 text-gray-700 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Open
                  </Link>
                  <Link 
                    to={`/study/${collection.id}`}
                    className="flex-1 text-center bg-blue-50 text-blue-700 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    Study
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
