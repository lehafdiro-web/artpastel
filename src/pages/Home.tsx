import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../store';
import { ArrowRight, Brush } from 'lucide-react';

export default function Home() {
  const { news, press } = useData();
  const recentNews = news.slice(0, 3);
  const recentPress = press.slice(0, 2);
  const heroImage = '/imported/works/001-svetlana-kushkova.jpeg';

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative rounded-2xl overflow-hidden bg-stone-800 text-white min-h-[420px] flex items-center">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Пастельная работа из коллекции сообщества"
            className="w-full h-full object-cover opacity-40"
          />
        </div>
        <div className="relative z-10 px-8 py-12 md:px-16 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Сообщество пастелистов Казахстана
          </h1>
          <p className="text-lg text-stone-300 mb-8 max-w-2xl leading-relaxed">
            Мы объединяем художников Алматы и всего Казахстана, работающих в удивительной технике пастели. Наша цель — развитие, поддержка и популяризация пастельной живописи.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/catalog"
              className="bg-white text-stone-900 px-6 py-3 rounded-full font-medium hover:bg-stone-100 transition-colors inline-flex items-center gap-2"
            >
              <Brush className="w-5 h-5" />
              Галерея работ
            </Link>
            <Link
              to="/members"
              className="bg-stone-700 border border-stone-600 text-white px-6 py-3 rounded-full font-medium hover:bg-stone-600 transition-colors"
            >
              Наши художники
            </Link>
          </div>
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Recent News */}
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
              recentNews.map(item => (
                <div key={item.id} className="flex gap-4 group">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-24 h-24 object-cover rounded-xl flex-shrink-0"
                    />
                  )}
                  <div>
                    <span className="text-xs font-medium text-stone-400 mb-1 block">
                      {new Date(item.date).toLocaleDateString('ru-RU')}
                    </span>
                    <h3 className="font-semibold text-base text-stone-900 group-hover:text-amber-700 transition-colors mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-stone-600 leading-relaxed">{item.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Press */}
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
              recentPress.map(item => (
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
