import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useData } from '../store';
import { formatEntryDate, getEntryBody, getEntryGallery, getEntryKind, getEntryTitle } from '../utils/contentEntries';

interface EntryDetailProps {
  kind: 'news' | 'pleinair';
}

export default function EntryDetail({ kind }: EntryDetailProps) {
  const { id } = useParams();
  const { news } = useData();
  const item = news.find((entry) => entry.id === id && getEntryKind(entry) === kind);

  if (!item) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-stone-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-bold text-stone-900">Запись не найдена</h1>
        <p className="mt-3 text-stone-500">Возможно, она была удалена или еще не загрузилась.</p>
        <Link
          to={kind === 'news' ? '/news' : '/pleinairs'}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white hover:bg-stone-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Вернуться назад
        </Link>
      </div>
    );
  }

  const gallery = getEntryGallery(item);
  const body = getEntryBody(item);
  const backPath = kind === 'news' ? '/news' : '/pleinairs';
  const backLabel = kind === 'news' ? 'Ко всем новостям' : 'Ко всем пленерам';

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Link to={backPath} className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-900">
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      <article className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white">
        <div className="border-b border-stone-100 px-6 py-6 md:px-10">
          <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">{formatEntryDate(item.date)}</span>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-stone-900 md:text-5xl">{getEntryTitle(item)}</h1>
        </div>

        {body && (
          <div className="px-6 py-6 md:px-10">
            <div className="max-w-3xl whitespace-pre-wrap text-base leading-8 text-stone-700 md:text-lg">{body}</div>
          </div>
        )}

        {gallery.length > 0 && (
          <div className="px-6 pb-6 md:px-10 md:pb-10">
            <div className="grid gap-4 md:grid-cols-2">
              {gallery.map((image, index) => (
                <div key={`${image}-${index}`} className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
                  <img src={image} alt={`${getEntryTitle(item)} ${index + 1}`} className="h-full w-full object-contain" />
                </div>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
