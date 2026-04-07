import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Brush } from 'lucide-react';
import { useData } from '../store';

export default function Home() {
  const { news, press } = useData();
  const recentNews = news.slice(0, 3);
  const recentPress = press.slice(0, 2);

  return (
    <div className="space-y-12">
      <section className="rounded-[2rem] bg-white border border-stone-200 px-8 py-12 md:px-14 md:py-16">
        <div className="max-w-4xl">
          <span className="inline-flex items-center rounded-full bg-stone-100 px-4 py-1.5 text-sm font-medium text-stone-600">
            Пастельное сообщество Казахстана
          </span>
          <h1 className="text-4xl md:text-6xl font-bold mt-6 mb-5 leading-tight text-amber-900">
            Сообщество пастелистов Казахстана
          </h1>
          <p className="text-lg md:text-xl text-stone-600 max-w-3xl leading-relaxed mb-8">
            Мы объединяем художников Алматы и всего Казахстана, работающих в удивительной технике пастели.
            Наша цель — развитие, поддержка и популяризация пастельной живописи.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/catalog"
              className="bg-stone-900 text-white px-6 py-3 rounded-full font-medium hover:bg-stone-800 transition-colors inline-flex items-center gap-2"
            >
              <Brush className="w-5 h-5" />
              Галерея работ
            </Link>
            <Link
              to="/members"
              className="bg-white border border-stone-300 text-stone-900 px-6 py-3 rounded-full font-medium hover:bg-stone-50 transition-colors"
            >
              Наши художники
            </Link>
          </div>
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-12">
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-stone-800">Последние новости</h2>
            <Link to="/news" className="text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1 text-sm">
              Все новости <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-6">
            {recentNews.length === 0 ? (
              <p className="text-stone-400">Пока нет новостей.</p>
            ) : (
              recentNews.map((item) => (
                <div key={item.id} className="flex gap-4 group">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title || 'Новость сообщества'}
                      className="w-24 h-24 object-cover rounded-xl flex-shrink-0"
                    />
                  )}
                  <div>
                    <span className="text-xs font-medium text-stone-400 mb-1 block">
                      {new Date(item.date).toLocaleDateString('ru-RU')}
                    </span>
                    {item.title && (
                      <h3 className="font-semibold text-base text-stone-900 group-hover:text-amber-700 transition-colors mb-1">
                        {item.title}
                      </h3>
                    )}
                    {item.content && <p className="text-sm text-stone-600 leading-relaxed">{item.content}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-stone-800">О нас пишут</h2>
            <Link to="/press" className="text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1 text-sm">
              Вся пресса <ArrowRight className="w-4 h-4" />
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
                  className="block bg-white p-5 rounded-xl border border-stone-200 hover:border-amber-300 hover:shadow-md transition-all"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2 block">{item.source}</span>
                  <h3 className="font-semibold text-stone-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-stone-500 italic">«{item.snippet}»</p>
                </a>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
