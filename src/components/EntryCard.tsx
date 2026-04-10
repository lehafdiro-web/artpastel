import React from 'react';
import { Link } from 'react-router-dom';
import type { NewsItem } from '../store';
import { formatEntryDate, getEntryImageCount, getEntryPreviewImage, getEntrySummary, getEntryTitle } from '../utils/contentEntries';

interface EntryCardProps {
  item: NewsItem;
  to: string;
  compact?: boolean;
}

export default function EntryCard({ item, to, compact = false }: EntryCardProps) {
  const previewImage = getEntryPreviewImage(item);
  const imageCount = getEntryImageCount(item);

  return (
    <Link
      to={to}
      className={`group block rounded-2xl border border-stone-200 bg-white transition-all hover:border-amber-300 hover:shadow-md ${
        compact ? 'p-4' : 'overflow-hidden'
      }`}
    >
      <div className={`${compact ? 'flex gap-4' : 'md:flex'}`}>
        {previewImage && (
          <div className={`${compact ? 'w-24 h-24 flex-shrink-0' : 'md:w-2/5 flex-shrink-0 bg-stone-100 p-3 md:p-4'}`}>
            <div
              className={`overflow-hidden rounded-xl bg-stone-50 flex items-center justify-center ${
                compact ? 'w-full h-full' : 'h-[240px] md:h-full md:min-h-[320px]'
              }`}
            >
              <img
                src={previewImage}
                alt={getEntryTitle(item)}
                className={`max-w-full max-h-full ${compact ? 'object-cover w-full h-full' : 'object-contain'}`}
              />
            </div>
          </div>
        )}

        <div className={`min-w-0 ${compact ? 'flex-1 py-1' : `p-6 flex flex-col justify-center ${previewImage ? 'md:w-3/5' : 'w-full'}`}`}>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            {formatEntryDate(item.date)}
          </span>
          <h2 className={`${compact ? 'text-base' : 'text-xl md:text-2xl'} font-bold leading-snug text-stone-900 group-hover:text-amber-800 transition-colors`}>
            {getEntryTitle(item)}
          </h2>
          <p className={`mt-2 whitespace-pre-wrap text-stone-600 ${compact ? 'text-sm line-clamp-3' : 'leading-relaxed'}`}>
            {getEntrySummary(item)}
          </p>
          <div className="mt-4 flex items-center justify-between text-sm text-stone-500">
            <span>{imageCount > 1 ? `${imageCount} фото` : imageCount === 1 ? '1 фото' : 'Подробнее'}</span>
            <span className="font-medium text-amber-700 group-hover:text-amber-800">Открыть</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
