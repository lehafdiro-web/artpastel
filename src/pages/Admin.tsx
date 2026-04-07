import React, { useState } from 'react';
import { useStore } from '../store';
import { Trash2, Plus, LogOut, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';

const sanitizeFileName = (fileName: string): string => {
  const ext = fileName.split('.').pop() ?? '';
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  const cyrillicToLatin: Record<string, string> = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z',
    'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
    'с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch',
    'ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
    'А':'A','Б':'B','В':'V','Г':'G','Д':'D','Е':'E','Ё':'Yo','Ж':'Zh','З':'Z',
    'И':'I','Й':'Y','К':'K','Л':'L','М':'M','Н':'N','О':'O','П':'P','Р':'R',
    'С':'S','Т':'T','У':'U','Ф':'F','Х':'H','Ц':'Ts','Ч':'Ch','Ш':'Sh','Щ':'Sch',
    'Ъ':'','Ы':'Y','Ь':'','Э':'E','Ю':'Yu','Я':'Ya',
  };
  const transliterated = nameWithoutExt.split('').map(c => cyrillicToLatin[c] ?? c).join('');
  const sanitized = transliterated
    .replace(/[^a-zA-Z0-9\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${sanitized}.${ext}`;
};

const uploadImage = async (file: File): Promise<string | null> => {
  if (!supabase) return null;
  const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`;
  const { error } = await supabase.storage.from('images').upload(fileName, file);
  if (error) { console.error('Upload error:', error); return null; }
  const { data } = supabase.storage.from('images').getPublicUrl(fileName);
  return data.publicUrl;
};

const ImageUpload = ({ value, onChange }: { value: string; onChange: (url: string) => void }) => {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file);
    if (url) onChange(url);
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 cursor-pointer w-full p-3 border border-dashed border-stone-300 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors">
        <Upload className="w-4 h-4 text-stone-400" />
        <span className="text-sm text-stone-500">{uploading ? 'Загрузка...' : 'Загрузить картинку'}</span>
        <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading} />
      </label>
      {value && <img src={value} alt="preview" className="w-full h-40 object-cover rounded-lg border border-stone-200" />}
    </div>
  );
};

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    sessionStorage.getItem('adminAuth') === 'true'
  );
  const [loginVal, setLoginVal] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const {
    news, addNews, deleteNews,
    members, addMember, deleteMember,
    catalog, addCatalogItem, deleteCatalogItem,
    press, addPressItem, deletePressItem,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'news' | 'members' | 'catalog' | 'press'>('news');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginVal === 'admin' && password === '[{paste!isty}]') {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
      setError('');
    } else {
      setError('Неверный логин или пароль');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuth');
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
        <h2 className="text-2xl font-bold text-center mb-6 text-stone-900">Вход в панель управления</h2>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Логин</label>
            <input type="text" value={loginVal} onChange={e => setLoginVal(e.target.value)}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Пароль</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400 outline-none" required />
          </div>
          <button type="submit" className="w-full bg-stone-900 text-white py-2 rounded-lg hover:bg-stone-800 transition-colors">Войти</button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b border-stone-200 pb-4">
        <h1 className="text-3xl font-bold text-stone-900">Управление сайтом</h1>
        <button onClick={handleLogout} className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors">
          <LogOut className="w-5 h-5" /> Выйти
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { id: 'news', label: 'Новости' },
          { id: 'members', label: 'Участники' },
          { id: 'catalog', label: 'Каталог' },
          { id: 'press', label: 'Пресса' },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-stone-900 text-white'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
        {activeTab === 'news' && <AdminNews news={news} addNews={addNews} deleteNews={deleteNews} />}
        {activeTab === 'members' && <AdminMembers members={members} addMember={addMember} deleteMember={deleteMember} />}
        {activeTab === 'catalog' && <AdminCatalog catalog={catalog} members={members} addCatalogItem={addCatalogItem} deleteCatalogItem={deleteCatalogItem} />}
        {activeTab === 'press' && <AdminPress press={press} addPressItem={addPressItem} deletePressItem={deletePressItem} />}
      </div>
    </div>
  );
}

function AdminNews({ news, addNews, deleteNews }: any) {
  const [form, setForm] = useState({ title: '', content: '', image: '' });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    addNews(form);
    setForm({ title: '', content: '', image: '' });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-stone-800">Добавить новость</h2>
      <form onSubmit={add} className="space-y-4 mb-8 bg-stone-50 p-4 rounded-xl">
        <input type="text" placeholder="Заголовок" required value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })} className="w-full p-2 border border-stone-300 rounded-lg" />
        <textarea placeholder="Текст новости" required value={form.content}
          onChange={e => setForm({ ...form, content: e.target.value })} className="w-full p-2 border border-stone-300 rounded-lg min-h-[120px]" />
        <ImageUpload value={form.image} onChange={url => setForm({ ...form, image: url })} />
        <button type="submit" className="bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Добавить
        </button>
      </form>
      <div className="space-y-3">
        {news.map((item: any) => (
          <div key={item.id} className="flex justify-between items-center p-4 border border-stone-100 rounded-lg bg-white">
            <div>
              <h3 className="font-semibold text-stone-900">{item.title}</h3>
              <p className="text-sm text-stone-400">{new Date(item.date).toLocaleDateString('ru-RU')}</p>
            </div>
            <button onClick={() => deleteNews(item.id)} className="text-stone-400 hover:text-red-500 p-2 transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminMembers({ members, addMember, deleteMember }: any) {
  const [form, setForm] = useState({ name: '', bio: '', image: '' });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    addMember(form);
    setForm({ name: '', bio: '', image: '' });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-stone-800">Добавить участника</h2>
      <form onSubmit={add} className="space-y-4 mb-8 bg-stone-50 p-4 rounded-xl">
        <input type="text" placeholder="Имя и Фамилия" required value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })} className="w-full p-2 border border-stone-300 rounded-lg" />
        <textarea placeholder="Краткая биография" required value={form.bio}
          onChange={e => setForm({ ...form, bio: e.target.value })} className="w-full p-2 border border-stone-300 rounded-lg" />
        <ImageUpload value={form.image} onChange={url => setForm({ ...form, image: url })} />
        <button type="submit" className="bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Добавить
        </button>
      </form>
      <div className="space-y-3">
        {members.map((item: any) => (
          <div key={item.id} className="flex justify-between items-center p-4 border border-stone-100 rounded-lg bg-white">
            <div className="flex items-center gap-3">
              {item.image && <img src={item.image} alt="" className="w-10 h-10 rounded-full object-cover" />}
              <span className="font-semibold text-stone-900">{item.name}</span>
            </div>
            <button onClick={() => deleteMember(item.id)} className="text-stone-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminCatalog({ catalog, members, addCatalogItem, deleteCatalogItem }: any) {
  const [form, setForm] = useState({ title: '', author: '', description: '', image: '' });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    addCatalogItem(form);
    setForm({ title: '', author: '', description: '', image: '' });
  };

  const memberNames: string[] = members.map((m: any) => m.name);

  return (
    <div>
      <h2 className="text-xl font-bold mb-1 text-stone-800">Добавить картину в каталог</h2>
      <p className="text-sm text-stone-400 mb-4">Имя автора должно совпадать с именем участника — тогда работа появится в его портфолио.</p>
      <form onSubmit={add} className="space-y-4 mb-8 bg-stone-50 p-4 rounded-xl">
        <input type="text" placeholder="Название картины" required value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })} className="w-full p-2 border border-stone-300 rounded-lg" />

        {/* Author dropdown from members list */}
        <div>
          <select
            value={form.author}
            onChange={e => setForm({ ...form, author: e.target.value })}
            className="w-full p-2 border border-stone-300 rounded-lg text-stone-700 bg-white"
            required
          >
            <option value="">Выберите автора</option>
            {memberNames.map((name: string) => (
              <option key={name} value={name}>{name}</option>
            ))}
            <option value="__custom">Другой автор...</option>
          </select>
          {form.author === '__custom' && (
            <input
              type="text"
              placeholder="Введите имя автора"
              className="w-full p-2 border border-stone-300 rounded-lg mt-2"
              onChange={e => setForm({ ...form, author: e.target.value })}
            />
          )}
        </div>

        <input type="text" placeholder="Описание (размер, техника — необязательно)" value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })} className="w-full p-2 border border-stone-300 rounded-lg" />
        <ImageUpload value={form.image} onChange={url => setForm({ ...form, image: url })} />
        <button type="submit" className="bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Добавить
        </button>
      </form>
      <div className="space-y-3">
        {catalog.map((item: any) => (
          <div key={item.id} className="flex justify-between items-center p-4 border border-stone-100 rounded-lg bg-white">
            <div className="flex items-center gap-3">
              {item.image && <img src={item.image} alt="" className="w-14 h-14 rounded-lg object-cover" />}
              <div>
                <p className="font-semibold text-stone-900">{item.title}</p>
                <p className="text-sm text-stone-400">{item.author}</p>
              </div>
            </div>
            <button onClick={() => deleteCatalogItem(item.id)} className="text-stone-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminPress({ press, addPressItem, deletePressItem }: any) {
  const [form, setForm] = useState({ title: '', source: '', url: '', snippet: '' });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    addPressItem(form);
    setForm({ title: '', source: '', url: '', snippet: '' });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-stone-800">Добавить ссылку на прессу</h2>
      <form onSubmit={add} className="space-y-4 mb-8 bg-stone-50 p-4 rounded-xl">
        <input type="text" placeholder="Заголовок статьи" required value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })} className="w-full p-2 border border-stone-300 rounded-lg" />
        <input type="text" placeholder="Название издания (TengriNews, Vesti.kz...)" required value={form.source}
          onChange={e => setForm({ ...form, source: e.target.value })} className="w-full p-2 border border-stone-300 rounded-lg" />
        <input type="url" placeholder="Ссылка (URL)" required value={form.url}
          onChange={e => setForm({ ...form, url: e.target.value })} className="w-full p-2 border border-stone-300 rounded-lg" />
        <textarea placeholder="Короткая цитата/выдержка" required value={form.snippet}
          onChange={e => setForm({ ...form, snippet: e.target.value })} className="w-full p-2 border border-stone-300 rounded-lg" />
        <button type="submit" className="bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Добавить
        </button>
      </form>
      <div className="space-y-3">
        {press.map((item: any) => (
          <div key={item.id} className="flex justify-between items-center p-4 border border-stone-100 rounded-lg bg-white">
            <span className="text-stone-900"><b>{item.source}</b>: {item.title}</span>
            <button onClick={() => deletePressItem(item.id)} className="text-stone-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
