import React, { useState } from 'react';
import { User, X, Image as ImageIcon } from 'lucide-react';
import { countCatalogItemsForMember, getCatalogAuthorName, isCatalogItemOwnedByMember, useData } from '../store';

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const formatMemberBio = (bio: string) => {
  const sectionMarkers = [
    'Телефон:',
    'E-mail:',
    'Email:',
    'BIO',
    'Образование:',
    'Членство:',
    'Выставки:',
    'Курсы',
    'Профессиональный опыт',
    'Публикации',
  ];

  let formatted = bio.replace(/\r\n?/g, '\n').trim();

  sectionMarkers.forEach((marker) => {
    formatted = formatted.replace(new RegExp(`\\s*(${escapeRegExp(marker)})`, 'g'), '\n\n$1');
  });

  formatted = formatted
    .replace(/;\s+(?=(?:с\s+)?\d{4})/g, ';\n')
    .replace(/\.\s+(?=\d{4}\s*[-–])/g, '.\n')
    .replace(/\s+(?=(?:с\s+)?\d{4}\s*[-–])/g, '\n')
    .replace(/\s+-\s+п\s+(?=\d{4})/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return formatted.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
};

export default function Members() {
  const { members, catalog } = useData();
  const [selected, setSelected] = useState<typeof members[0] | null>(null);
  const [lightbox, setLightbox] = useState<typeof catalog[0] | null>(null);

  const sortedMembers = [...members].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  const memberWorks = selected ? catalog.filter((item) => isCatalogItemOwnedByMember(item, selected, members)) : [];

  return (
    <div className="space-y-8">
      <div className="border-b border-stone-200 pb-6 mb-8 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-stone-800 tracking-tight">Участники сообщества</h1>
        <p className="text-stone-500 mt-2 text-base">
          Художники-пастелисты Казахстана, объединяющие традиции и современный взгляд на живопись.
        </p>
      </div>

      {sortedMembers.length === 0 ? (
        <div className="text-center py-12 text-stone-400">Участников пока нет.</div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-2xl border border-stone-100 overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => setSelected(member)}
            >
              <div className="aspect-square bg-stone-50 relative overflow-hidden">
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-200">
                    <User className="w-16 h-16" />
                  </div>
                )}
                <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/20 transition-colors duration-300" />
              </div>
              <div className="p-5">
                <h3 className="text-base font-bold text-stone-900 mb-1">{member.name}</h3>
                <span className="inline-block mt-3 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                  {countCatalogItemsForMember(catalog, member, members)} работ
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelected(null);
            }
          }}
        >
          <div className="bg-white rounded-3xl max-w-4xl w-full my-8 overflow-hidden shadow-2xl">
            <div className="relative bg-stone-50 p-8 flex flex-col sm:flex-row gap-6 items-start border-b border-stone-100">
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-stone-200">
                {selected.image ? (
                  <img src={selected.image} alt={selected.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300">
                    <User className="w-10 h-10" />
                  </div>
                )}
              </div>
              <div className="flex-1 pt-1">
                <h2 className="text-2xl font-bold text-stone-900 mb-2">{selected.name}</h2>
                <div className="space-y-4 text-stone-600">
                  {formatMemberBio(selected.bio).map((paragraph, index) => (
                    <p key={`${selected.id}-bio-${index}`} className="whitespace-pre-wrap leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8">
              <h3 className="text-lg font-bold text-stone-800 mb-5">
                Работы художника
                <span className="ml-2 text-sm font-normal text-stone-400">({memberWorks.length})</span>
              </h3>

              {memberWorks.length === 0 ? (
                <div className="text-center py-12 text-stone-400 flex flex-col items-center gap-3">
                  <ImageIcon className="w-10 h-10 text-stone-200" />
                  <p>Работы этого художника пока не добавлены в каталог.</p>
                  <p className="text-sm text-stone-300">
                    Добавьте работы в каталог, указав имя автора: <b className="text-stone-400">{selected.name}</b>
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {memberWorks.map((work) => (
                    <div
                      key={work.id}
                      className="group cursor-pointer rounded-xl overflow-hidden relative"
                      onClick={() => setLightbox(work)}
                    >
                      <div className="aspect-[4/3] bg-stone-100">
                        <img
                          src={work.image}
                          alt={work.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                        <p className="text-white font-semibold text-sm">{work.title}</p>
                        {work.description && <p className="text-stone-300 text-xs">{work.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white/60 hover:text-white p-2">
            <X className="w-8 h-8" />
          </button>
          <div className="max-w-5xl w-full flex flex-col items-center" onClick={(event) => event.stopPropagation()}>
            <img src={lightbox.image} alt={lightbox.title} className="max-h-[80vh] object-contain rounded-lg shadow-2xl" />
            <div className="text-center mt-4">
              <h3 className="text-2xl font-bold text-white">{lightbox.title}</h3>
              <p className="text-stone-400 mt-1">{getCatalogAuthorName(lightbox, members)}</p>
              {lightbox.description && <p className="text-stone-500 text-sm mt-1">{lightbox.description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
