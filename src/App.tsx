import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Menu, X, Palette, Image as ImageIcon, Users, BookOpen, Newspaper, Lock } from 'lucide-react';

import Home from './pages/Home';
import News from './pages/News';
import Members from './pages/Members';
import Catalog from './pages/Catalog';
import Press from './pages/Press';
import Admin from './pages/Admin';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const closeMenu = () => setIsMenuOpen(false);

  React.useEffect(() => {
    // Import store dynamically or use it here
    import('./store').then(({ useStore }) => {
      useStore.getState().fetchFromSupabase();
    });
  }, []);

  const navLinks = [
    { path: '/', label: 'Главная', icon: <Palette className="w-4 h-4 mr-2" /> },
    { path: '/news', label: 'Новости', icon: <Newspaper className="w-4 h-4 mr-2" /> },
    { path: '/members', label: 'Участники', icon: <Users className="w-4 h-4 mr-2" /> },
    { path: '/catalog', label: 'Каталог', icon: <ImageIcon className="w-4 h-4 mr-2" /> },
    { path: '/press', label: 'Пресса', icon: <BookOpen className="w-4 h-4 mr-2" /> },
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-rose-600 font-bold text-xl" onClick={closeMenu}>
            <Palette className="w-6 h-6" />
            <span className="hidden sm:inline">Пастелисты Казахстана</span>
            <span className="sm:hidden">Пастель КЗ</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center text-sm font-medium transition-colors hover:text-rose-600 ${
                  location.pathname === link.path ? 'text-rose-600 border-b-2 border-rose-600' : 'text-stone-600'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-stone-600 hover:text-rose-600 focus:outline-none"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <nav className="md:hidden bg-white border-t border-stone-100 px-4 py-2 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={closeMenu}
                className={`flex items-center p-3 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === link.path ? 'bg-rose-50 text-rose-600' : 'text-stone-600 hover:bg-stone-50 hover:text-rose-600'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<News />} />
          <Route path="/members" element={<Members />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/press" element={<Press />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-300 py-8 text-center text-sm">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center gap-4">
          <p>© {new Date().getFullYear()} Сообщество пастелистов Казахстана. Алматы.</p>
          <Link to="/admin" className="text-stone-600 hover:text-rose-400 transition-colors flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Вход для администратора
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default App;
