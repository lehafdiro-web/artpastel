import React from 'react';
import { useData } from '../store';
import { ExternalLink } from 'lucide-react';

export default function Press() {
  const { press } = useData();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="border-b border-stone-200 pb-4 mb-8">
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">О нас пишут</h1>
        <p className="text-stone-500 mt-2">Публикации, интервью и статьи о сообществе пастелистов Казахстана в СМИ.</p>
      </div>

      {press.length === 0 ? (
        <div className="text-center py-12 text-stone-400">Публикаций пока нет.</div>
      ) : (
        <div className="space-y-6">
          {press.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white p-6 rounded-2xl shadow-sm border border-stone-100 hover:border-amber-300 hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">{item.source}</span>
                <ExternalLink className="w-5 h-5 text-stone-300 group-hover:text-amber-600 transition-colors" />
              </div>
              <h2 className="text-xl font-bold text-stone-900 mb-3 group-hover:text-stone-700 transition-colors">{item.title}</h2>
              <blockquote className="border-l-4 border-stone-200 pl-4 py-1 text-stone-600 italic bg-stone-50 rounded-r-lg pr-4">
                «{item.snippet}»
              </blockquote>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
