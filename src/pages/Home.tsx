import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Brush } from 'lucide-react';
import EntryCard from '../components/EntryCard';
import { useData } from '../store';
import { getEntryKind, sortEntriesByDate } from '../utils/contentEntries';

export default function Home() {
  const { news, press } = useData();
  const recentNews = sortEntriesByDate(news.filter((item) => getEntryKind(item) === 'news')).slice(0, 3);
  const recentPress = press.slice(0, 2);

  return (
    <div className="space-y-12">
      <section className="rounded-[2rem] border border-stone-200 bg-white px-8 py-12 md:px-14 md:py-16">
        <div className="max-w-4xl">
          <span className="inline-flex items-center rounded-full bg-stone-100 px-4 py-1.5 text-sm font-medium text-stone-600">
            Пастельное сообщество Казахстана
          </span>
          <h1 className="mt-6 mb-5 text-4xl font-bold leading-tight text-amber-900 md:text-6xl">Сообщество пастелистов Казахстана</h1>
          <p className="mb-8 max-w-3xl text-lg leading-relaxed text-stone-600 md:text-xl">
            Мы объединяем художников Алматы и всего Казахстана, работающих в удивительной технике пастели. Наша цель —
            развитие, поддержка и популяризация пастельной живописи.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3 font-medium text-white transition-colors hover:bg-stone-800"
            >
              <Brush className="h-5 w-5" />
              Галерея работ
            </Link>
            <Link
              to="/members"
              className="rounded-full border border-stone-300 bg-white px-6 py-3 font-medium text-stone-900 transition-colors hover:bg-stone-50"
            >
              Наши художники
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-12 md:grid-cols-2">
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-stone-800">Последние новости</h2>
            <Link to="/news" className="flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800">
              Все новости <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {recentNews.length === 0 ? (
              <p className="text-stone-400">Пока нет новостей.</p>
            ) : (
              recentNews.map((item) => <EntryCard key={item.id} item={item} to={`/news/${item.id}`} compact />)
            )}
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-stone-800">О нас пишут</h2>
            <Link to="/press" className="flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800">
              Вся пресса <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {recentPress.length === 0 ? (
              <p className="text-stone-400">Пока нет публикаций.</p>
            ) : (
              recentPress.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl border border-stone-200 bg-white p-5 transition-all hover:border-amber-300 hover:shadow-md"
                >
                  <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-amber-700">{item.source}</span>
                  <h3 className="mb-2 font-semibold text-stone-900">{item.title}</h3>
                  <p className="text-sm italic text-stone-500">«{item.snippet}»</p>
                </a>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
