import React, { useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { BookOpen, CalendarRange, Image as ImageIcon, Lock, Menu, Newspaper, Palette, Users, X } from 'lucide-react';

import Admin from './pages/Admin';
import Catalog from './pages/Catalog';
import EntryDetail from './pages/EntryDetail';
import Home from './pages/Home';
import Members from './pages/Members';
import News from './pages/News';
import Pleinairs from './pages/Pleinairs';
import Press from './pages/Press';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const closeMenu = () => setIsMenuOpen(false);

  React.useEffect(() => {
    import('./store').then(({ useStore }) => {
      useStore.getState().fetchFromSupabase();
    });
  }, []);

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === path;
    }

    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const navLinks = [
    { path: '/', label: 'Главная', icon: <Palette className="mr-2 h-4 w-4" /> },
    { path: '/news', label: 'Новости', icon: <Newspaper className="mr-2 h-4 w-4" /> },
    { path: '/pleinairs', label: 'Пленеры', icon: <CalendarRange className="mr-2 h-4 w-4" /> },
    { path: '/members', label: 'Участники', icon: <Users className="mr-2 h-4 w-4" /> },
    { path: '/catalog', label: 'Каталог', icon: <ImageIcon className="mr-2 h-4 w-4" /> },
    { path: '/press', label: 'Пресса', icon: <BookOpen className="mr-2 h-4 w-4" /> },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 font-sans text-stone-900">
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-amber-900" onClick={closeMenu}>
            <Palette className="h-6 w-6 text-amber-700" />
            <span className="hidden sm:inline">Пастелисты Казахстана</span>
            <span className="sm:hidden">Пастель KZ</span>
          </Link>

          <nav className="hidden gap-2 md:flex">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    active ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <button className="p-2 text-stone-600 hover:text-stone-900 focus:outline-none md:hidden" onClick={() => setIsMenuOpen((open) => !open)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <nav className="flex flex-col gap-2 border-t border-stone-100 bg-white px-4 py-2 md:hidden">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeMenu}
                  className={`flex items-center rounded-xl p-3 text-sm font-medium transition-colors ${
                    active ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<EntryDetail kind="news" />} />
          <Route path="/pleinairs" element={<Pleinairs />} />
          <Route path="/pleinairs/:id" element={<EntryDetail kind="pleinair" />} />
          <Route path="/members" element={<Members />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/press" element={<Press />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>

      <footer className="bg-stone-900 py-8 text-center text-sm text-stone-300">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4">
          <p>© {new Date().getFullYear()} Сообщество пастелистов Казахстана. Алматы.</p>
          <Link to="/admin" className="flex items-center gap-1 text-stone-500 transition-colors hover:text-amber-300">
            <Lock className="h-3 w-3" />
            Вход для администратора
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default App;
