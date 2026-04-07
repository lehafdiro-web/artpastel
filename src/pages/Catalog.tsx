import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useData } from '../store';

export default function Catalog() {
  const { catalog } = useData();
  const [selectedImage, setSelectedImage] = useState<typeof catalog[0] | null>(null);
  const [filterAuthor, setFilterAuthor] = useState<string>('all');

  const authors = Array.from(new Set(catalog.map((item) => item.author))).sort((a, b) => a.localeCompare(b, 'ru'));
  const filtered = filterAuthor === 'all' ? catalog : catalog.filter((item) => item.author === filterAuthor);

  return (
    <div className="space-y-8">
      <div className="border-b border-stone-200 pb-6 mb-8 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Каталог работ</h1>
        <p className="text-stone-500 mt-2">Галерея картин наших участников, выполненных в технике сухой пастели.</p>
      </div>

      {authors.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-2">
          <button
            onClick={() => setFilterAuthor('all')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterAuthor === 'all'
                ? 'bg-stone-800 text-white'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            Все работы
          </button>
          {authors.map((author) => (
            <button
              key={author}
              onClick={() => setFilterAuthor(author)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filterAuthor === author
                  ? 'bg-stone-800 text-white'
                  : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {author}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-stone-400">В каталоге пока нет работ.</div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group cursor-pointer rounded-xl overflow-hidden relative shadow-sm hover:shadow-xl transition-all"
              onClick={() => setSelectedImage(item)}
            >
              <div className="aspect-[4/3] bg-stone-100">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <h3 className="text-white font-bold text-lg">{item.title}</h3>
                <p className="text-stone-300 text-sm">{item.author}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 text-white/70 hover:text-white p-2">
            <X className="w-8 h-8" />
          </button>
          <div className="max-w-5xl w-full flex flex-col items-center" onClick={(event) => event.stopPropagation()}>
            <img
              src={selectedImage.image}
              alt={selectedImage.title}
              className="max-h-[80vh] object-contain rounded-lg mb-4 shadow-2xl"
            />
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-1">{selectedImage.title}</h3>
              <button
                onClick={() => {
                  setFilterAuthor(selectedImage.author);
                  setSelectedImage(null);
                }}
                className="text-stone-300 hover:text-amber-400 transition-colors text-lg"
              >
                {selectedImage.author}
              </button>
              {selectedImage.description && <p className="text-stone-500 text-sm mt-1">{selectedImage.description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
