import React, { useMemo, useState } from 'react';
import { Edit3, LogOut, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CatalogItem, Member, NewsItem, PressItem, useStore } from '../store';

const sanitizeFileName = (fileName: string): string => {
  const ext = fileName.split('.').pop() ?? '';
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  const cyrillicToLatin: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
    А: 'A', Б: 'B', В: 'V', Г: 'G', Д: 'D', Е: 'E', Ё: 'Yo', Ж: 'Zh', З: 'Z',
    И: 'I', Й: 'Y', К: 'K', Л: 'L', М: 'M', Н: 'N', О: 'O', П: 'P', Р: 'R',
    С: 'S', Т: 'T', У: 'U', Ф: 'F', Х: 'H', Ц: 'Ts', Ч: 'Ch', Ш: 'Sh', Щ: 'Sch',
    Ъ: '', Ы: 'Y', Ь: '', Э: 'E', Ю: 'Yu', Я: 'Ya',
  };

  const transliterated = nameWithoutExt.split('').map((char) => cyrillicToLatin[char] ?? char).join('');
  const sanitized = transliterated
    .replace(/[^a-zA-Z0-9\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return `${sanitized}.${ext}`;
};

const uploadImage = async (file: File): Promise<string | null> => {
  if (!supabase) {
    return null;
  }

  const fileName = `${Date.now()}-${sanitizeFileName(file.name)}`;
  const { error } = await supabase.storage.from('images').upload(fileName, file);
  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data } = supabase.storage.from('images').getPublicUrl(fileName);
  return data.publicUrl;
};

const combineFullName = (firstName: string, lastName: string) => [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

const splitFullName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) {
    return { firstName: parts[0] ?? '', lastName: '' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
};

const sortByName = <T extends { name: string }>(items: T[]) => [...items].sort((a, b) => a.name.localeCompare(b.name, 'ru'));

function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    const url = await uploadImage(file);
    if (url) {
      onChange(url);
    }
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
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('adminAuth') === 'true');
  const [loginVal, setLoginVal] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const {
    news, addNews, updateNews, deleteNews,
    members, addMember, updateMember, deleteMember,
    catalog, addCatalogItem, updateCatalogItem, deleteCatalogItem,
    press, addPressItem, updatePressItem, deletePressItem,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'news' | 'members' | 'catalog' | 'press'>('news');

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    if (loginVal === 'admin' && password === '[{paste!isty}]') {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
      setError('');
    } else {
      setError('Неверный логин или пароль');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-2xl shadow-sm border border-stone-200">
        <h2 className="text-2xl font-bold text-center mb-6 text-stone-900">Вход в панель управления</h2>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Логин</label>
            <input
              type="text"
              value={loginVal}
              onChange={(event) => setLoginVal(event.target.value)}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-400 outline-none"
              required
            />
          </div>
          <button type="submit" className="w-full bg-stone-900 text-white py-2 rounded-lg hover:bg-stone-800 transition-colors">
            Войти
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b border-stone-200 pb-4">
        <h1 className="text-3xl font-bold text-stone-900">Управление сайтом</h1>
        <button
          onClick={() => {
            setIsAuthenticated(false);
            sessionStorage.removeItem('adminAuth');
          }}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors"
        >
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
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'news' | 'members' | 'catalog' | 'press')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-stone-900 text-white'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
        {activeTab === 'news' && <AdminNews news={news} addNews={addNews} updateNews={updateNews} deleteNews={deleteNews} />}
        {activeTab === 'members' && (
          <AdminMembers members={members} addMember={addMember} updateMember={updateMember} deleteMember={deleteMember} />
        )}
        {activeTab === 'catalog' && (
          <AdminCatalog
            catalog={catalog}
            members={members}
            addCatalogItem={addCatalogItem}
            updateCatalogItem={updateCatalogItem}
            deleteCatalogItem={deleteCatalogItem}
          />
        )}
        {activeTab === 'press' && (
          <AdminPress press={press} addPressItem={addPressItem} updatePressItem={updatePressItem} deletePressItem={deletePressItem} />
        )}
      </div>
    </div>
  );
}

function AdminNews({
  news,
  addNews,
  updateNews,
  deleteNews,
}: {
  news: NewsItem[];
  addNews: (item: Omit<NewsItem, 'id' | 'date'>) => void;
  updateNews: (id: string, item: Omit<NewsItem, 'id' | 'date'>) => void;
  deleteNews: (id: string) => void;
}) {
  const [form, setForm] = useState({ title: '', content: '', image: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const sortedNews = [...news].sort((a, b) => (a.date < b.date ? 1 : -1));

  const resetForm = () => {
    setForm({ title: '', content: '', image: '' });
    setEditingId(null);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (editingId) {
      updateNews(editingId, form);
    } else {
      addNews(form);
    }
    resetForm();
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-stone-800">{editingId ? 'Редактировать новость' : 'Добавить новость'}</h2>
      <form onSubmit={submit} className="space-y-4 mb-8 bg-stone-50 p-4 rounded-xl">
        <input
          type="text"
          placeholder="Заголовок"
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          className="w-full p-2 border border-stone-300 rounded-lg"
        />
        <textarea
          placeholder="Текст новости"
          value={form.content}
          onChange={(event) => setForm({ ...form, content: event.target.value })}
          className="w-full p-2 border border-stone-300 rounded-lg min-h-[120px]"
        />
        <ImageUpload value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 flex items-center gap-2">
            {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {editingId ? 'Сохранить' : 'Добавить'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-white text-stone-600 px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-50 flex items-center gap-2"
            >
              <X className="w-4 h-4" /> Отмена
            </button>
          )}
        </div>
      </form>
      <div className="space-y-3">
        {sortedNews.map((item) => (
          <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-stone-100 rounded-lg bg-white">
            <div className="min-w-0">
              <h3 className="font-semibold text-stone-900 break-words">{item.title || 'Новость без заголовка'}</h3>
              <p className="text-sm text-stone-400">{new Date(item.date).toLocaleDateString('ru-RU')}</p>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => {
                  setForm({ title: item.title, content: item.content, image: item.image ?? '' });
                  setEditingId(item.id);
                }}
                className="text-stone-400 hover:text-stone-700 transition-colors p-2"
              >
                <Edit3 className="w-5 h-5" />
              </button>
              <button onClick={() => deleteNews(item.id)} className="text-stone-400 hover:text-red-500 p-2 transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminMembers({
  members,
  addMember,
  updateMember,
  deleteMember,
}: {
  members: Member[];
  addMember: (item: Omit<Member, 'id'>) => void;
  updateMember: (id: string, item: Omit<Member, 'id'>) => void;
  deleteMember: (id: string) => void;
}) {
  const [form, setForm] = useState({ firstName: '', lastName: '', bio: '', image: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const sortedMembers = useMemo(() => sortByName(members), [members]);

  const resetForm = () => {
    setForm({ firstName: '', lastName: '', bio: '', image: '' });
    setEditingId(null);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      name: combineFullName(form.firstName, form.lastName),
      bio: form.bio.trim(),
      image: form.image,
    };

    if (!payload.name || !payload.bio) {
      return;
    }

    if (editingId) {
      updateMember(editingId, payload);
    } else {
      addMember(payload);
    }

    resetForm();
  };

  const startEditing = (member: Member) => {
    const { firstName, lastName } = splitFullName(member.name);
    setForm({ firstName, lastName, bio: member.bio, image: member.image ?? '' });
    setEditingId(member.id);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-stone-800">{editingId ? 'Редактировать участника' : 'Добавить участника'}</h2>
      <form onSubmit={submit} className="space-y-4 mb-8 bg-stone-50 p-4 rounded-xl">
        <div className="grid sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Имя"
            required
            value={form.firstName}
            onChange={(event) => setForm({ ...form, firstName: event.target.value })}
            className="w-full p-2 border border-stone-300 rounded-lg"
          />
          <input
            type="text"
            placeholder="Фамилия"
            required
            value={form.lastName}
            onChange={(event) => setForm({ ...form, lastName: event.target.value })}
            className="w-full p-2 border border-stone-300 rounded-lg"
          />
        </div>
        <textarea
          placeholder="Краткая биография"
          required
          value={form.bio}
          onChange={(event) => setForm({ ...form, bio: event.target.value })}
          className="w-full p-2 border border-stone-300 rounded-lg min-h-[120px]"
        />
        <ImageUpload value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 flex items-center gap-2">
            {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {editingId ? 'Сохранить' : 'Добавить'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-white text-stone-600 px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-50 flex items-center gap-2"
            >
              <X className="w-4 h-4" /> Отмена
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {sortedMembers.map((item) => (
          <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-stone-100 rounded-lg bg-white">
            <div className="flex items-center gap-3 min-w-0">
              {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />}
              <div className="min-w-0">
                <p className="font-semibold text-stone-900 break-words">{item.name}</p>
                <p className="text-sm text-stone-400 line-clamp-2">{item.bio}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button onClick={() => startEditing(item)} className="text-stone-400 hover:text-stone-700 transition-colors p-2">
                <Edit3 className="w-5 h-5" />
              </button>
              <button onClick={() => deleteMember(item.id)} className="text-stone-400 hover:text-red-500 transition-colors p-2">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminCatalog({
  catalog,
  members,
  addCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
}: {
  catalog: CatalogItem[];
  members: Member[];
  addCatalogItem: (item: Omit<CatalogItem, 'id'>) => void;
  updateCatalogItem: (id: string, item: Omit<CatalogItem, 'id'>) => void;
  deleteCatalogItem: (id: string) => void;
}) {
  const [form, setForm] = useState({ title: '', author: '', description: '', image: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const sortedMembers = useMemo(() => sortByName(members), [members]);
  const memberNames = sortedMembers.map((member) => member.name);
  const sortedCatalog = [...catalog].sort((a, b) => a.author.localeCompare(b.author, 'ru') || a.title.localeCompare(b.title, 'ru'));

  const resetForm = () => {
    setForm({ title: '', author: '', description: '', image: '' });
    setEditingId(null);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (editingId) {
      updateCatalogItem(editingId, form);
    } else {
      addCatalogItem(form);
    }
    resetForm();
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-1 text-stone-800">{editingId ? 'Редактировать картину' : 'Добавить картину в каталог'}</h2>
      <p className="text-sm text-stone-400 mb-4">Имя автора должно совпадать с именем участника, тогда работа появится в его портфолио.</p>
      <form onSubmit={submit} className="space-y-4 mb-8 bg-stone-50 p-4 rounded-xl">
        <input
          type="text"
          placeholder="Название картины"
          required
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          className="w-full p-2 border border-stone-300 rounded-lg"
        />
        <select
          value={form.author}
          onChange={(event) => setForm({ ...form, author: event.target.value })}
          className="w-full p-2 border border-stone-300 rounded-lg text-stone-700 bg-white"
          required
        >
          <option value="">Выберите автора</option>
          {memberNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Описание (размер, техника — необязательно)"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          className="w-full p-2 border border-stone-300 rounded-lg"
        />
        <ImageUpload value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 flex items-center gap-2">
            {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {editingId ? 'Сохранить' : 'Добавить'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-white text-stone-600 px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-50 flex items-center gap-2"
            >
              <X className="w-4 h-4" /> Отмена
            </button>
          )}
        </div>
      </form>
      <div className="space-y-3">
        {sortedCatalog.map((item) => (
          <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-stone-100 rounded-lg bg-white">
            <div className="flex items-center gap-3 min-w-0">
              {item.image && <img src={item.image} alt={item.title} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />}
              <div className="min-w-0">
                <p className="font-semibold text-stone-900 break-words">{item.title}</p>
                <p className="text-sm text-stone-400">{item.author}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => {
                  setForm({ title: item.title, author: item.author, description: item.description ?? '', image: item.image });
                  setEditingId(item.id);
                }}
                className="text-stone-400 hover:text-stone-700 transition-colors p-2"
              >
                <Edit3 className="w-5 h-5" />
              </button>
              <button onClick={() => deleteCatalogItem(item.id)} className="text-stone-400 hover:text-red-500 transition-colors p-2">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminPress({
  press,
  addPressItem,
  updatePressItem,
  deletePressItem,
}: {
  press: PressItem[];
  addPressItem: (item: Omit<PressItem, 'id'>) => void;
  updatePressItem: (id: string, item: Omit<PressItem, 'id'>) => void;
  deletePressItem: (id: string) => void;
}) {
  const [form, setForm] = useState({ title: '', source: '', url: '', snippet: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => {
    setForm({ title: '', source: '', url: '', snippet: '' });
    setEditingId(null);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (editingId) {
      updatePressItem(editingId, form);
    } else {
      addPressItem(form);
    }
    resetForm();
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-stone-800">{editingId ? 'Редактировать публикацию' : 'Добавить ссылку на прессу'}</h2>
      <form onSubmit={submit} className="space-y-4 mb-8 bg-stone-50 p-4 rounded-xl">
        <input
          type="text"
          placeholder="Заголовок статьи"
          required
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          className="w-full p-2 border border-stone-300 rounded-lg"
        />
        <input
          type="text"
          placeholder="Название издания"
          required
          value={form.source}
          onChange={(event) => setForm({ ...form, source: event.target.value })}
          className="w-full p-2 border border-stone-300 rounded-lg"
        />
        <input
          type="url"
          placeholder="Ссылка (URL)"
          required
          value={form.url}
          onChange={(event) => setForm({ ...form, url: event.target.value })}
          className="w-full p-2 border border-stone-300 rounded-lg"
        />
        <textarea
          placeholder="Короткая цитата/выдержка"
          required
          value={form.snippet}
          onChange={(event) => setForm({ ...form, snippet: event.target.value })}
          className="w-full p-2 border border-stone-300 rounded-lg"
        />
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 flex items-center gap-2">
            {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {editingId ? 'Сохранить' : 'Добавить'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-white text-stone-600 px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-50 flex items-center gap-2"
            >
              <X className="w-4 h-4" /> Отмена
            </button>
          )}
        </div>
      </form>
      <div className="space-y-3">
        {press.map((item) => (
          <div key={item.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-stone-100 rounded-lg bg-white">
            <span className="text-stone-900 break-words">
              <b>{item.source}</b>: {item.title}
            </span>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => {
                  setForm({ title: item.title, source: item.source, url: item.url, snippet: item.snippet });
                  setEditingId(item.id);
                }}
                className="text-stone-400 hover:text-stone-700 transition-colors p-2"
              >
                <Edit3 className="w-5 h-5" />
              </button>
              <button onClick={() => deletePressItem(item.id)} className="text-stone-400 hover:text-red-500 transition-colors p-2">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
