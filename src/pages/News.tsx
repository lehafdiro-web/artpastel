import React from 'react';
import { useData } from '../store';

export default function News() {
  const { news } = useData();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="border-b border-stone-200 pb-4 mb-8">
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Новости сообщества</h1>
        <p className="text-stone-500 mt-2">События, выставки, мастер-классы и жизнь пастелистов Алматы.</p>
      </div>

      {news.length === 0 ? (
        <div className="text-center py-12 text-stone-400">Новостей пока нет.</div>
      ) : (
        <div className="grid gap-8">
          {news.map((item) => (
            <article key={item.id} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden md:flex">
              {item.image && (
                <div className="md:w-2/5 h-56 md:h-auto flex-shrink-0">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className={`p-6 flex flex-col justify-center ${item.image ? 'md:w-3/5' : 'w-full'}`}>
                <span className="text-xs font-semibold text-amber-700 mb-2 block uppercase tracking-wider">
                  {new Date(item.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <h2 className="text-xl font-bold text-stone-900 mb-3 leading-snug">{item.title}</h2>
                <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">{item.content}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
