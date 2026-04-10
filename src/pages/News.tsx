import React from 'react';
import EntryCard from '../components/EntryCard';
import { useData } from '../store';
import { getEntryKind, sortEntriesByDate } from '../utils/contentEntries';

export default function News() {
  const { news } = useData();
  const communityNews = sortEntriesByDate(news.filter((item) => getEntryKind(item) === 'news'));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="mb-8 border-b border-stone-200 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">Новости сообщества</h1>
        <p className="mt-2 text-stone-500">События, выставки, анонсы и фоторепортажи пастелистов Казахстана.</p>
      </div>

      {communityNews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center text-stone-400">
          Новостей пока нет.
        </div>
      ) : (
        <div className="grid gap-8">
          {communityNews.map((item) => (
            <EntryCard key={item.id} item={item} to={`/news/${item.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
