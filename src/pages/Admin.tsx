import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Edit3, LogOut, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CatalogItem, Member, NewsItem, PressItem, getCatalogAuthorName, resolveMemberIdByAuthor, useStore } from '../store';
import {
  EntryKind,
  formatEntryDate,
  fromDateTimeInputValue,
  getEntryGallery,
  getEntryKind,
  getEntryTitle,
  parseEntryContent,
  serializeEntryContent,
  sortEntriesByDate,
  toDateTimeInputValue,
} from '../utils/contentEntries';

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

  const transliterated = nameWithoutExt
    .split('')
    .map((char) => cyrillicToLatin[char] ?? char)
    .join('');
  const sanitized = transliterated
    .replace(/[^a-zA-Z0-9\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return `${sanitized || 'image'}.${ext}`;
};

const uploadSingleImage = async (file: File): Promise<string | null> => {
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

const uploadMultipleImages = async (files: File[]) => {
  const uploaded: string[] = [];
  for (const file of files) {
    const url = await uploadSingleImage(file);
    if (url) {
      uploaded.push(url);
    }
  }
  return uploaded;
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

type AdminTab = 'news' | 'pleinairs' | 'members' | 'catalog' | 'press';

type EntryFormState = {
  title: string;
  body: string;
  image: string;
  gallery: string[];
  date: string;
};

const createEntryFormState = (): EntryFormState => ({
  title: '',
  body: '',
  image: '',
  gallery: [],
  date: toDateTimeInputValue(new Date().toISOString()),
});

function ImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    const url = await uploadSingleImage(file);
    if (url) {
      onChange(url);
    }
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      <label className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-3 transition-colors hover:bg-stone-100">
        <Upload className="h-4 w-4 text-stone-400" />
        <span className="text-sm text-stone-500">{uploading ? 'Загрузка...' : 'Загрузить обложку'}</span>
        <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={uploading} />
      </label>
      {value && <img src={value} alt="preview" className="h-40 w-full rounded-lg border border-stone-200 object-cover" />}
    </div>
  );
}

function GalleryUpload({
  value,
  onChange,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    setUploading(true);
    const urls = await uploadMultipleImages(files);
    if (urls.length) {
      onChange([...value, ...urls]);
    }
    setUploading(false);
  };

  return (
    <div className="space-y-3">
      <label className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-3 transition-colors hover:bg-stone-100">
        <Upload className="h-4 w-4 text-stone-400" />
        <span className="text-sm text-stone-500">{uploading ? 'Загрузка фото...' : 'Загрузить несколько фото'}</span>
        <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" disabled={uploading} />
      </label>

      {value.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {value.map((image, index) => (
            <div key={`${image}-${index}`} className="relative overflow-hidden rounded-lg border border-stone-200 bg-white">
              <img src={image} alt={`gallery-${index + 1}`} className="h-28 w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, currentIndex) => currentIndex !== index))}
                className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-stone-500 transition-colors hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
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

  const [activeTab, setActiveTab] = useState<AdminTab>('news');

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
      <div className="mx-auto mt-12 max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h2 className="mb-6 text-center text-2xl font-bold text-stone-900">Вход в панель управления</h2>
        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Логин</label>
            <input
              type="text"
              value={loginVal}
              onChange={(event) => setLoginVal(event.target.value)}
              className="w-full rounded-lg border border-stone-300 px-4 py-2 outline-none focus:ring-2 focus:ring-stone-400"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-stone-300 px-4 py-2 outline-none focus:ring-2 focus:ring-stone-400"
              required
            />
          </div>
          <button type="submit" className="w-full rounded-lg bg-stone-900 py-2 text-white transition-colors hover:bg-stone-800">
            Войти
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between border-b border-stone-200 pb-4">
        <h1 className="text-3xl font-bold text-stone-900">Управление сайтом</h1>
        <button
          onClick={() => {
            setIsAuthenticated(false);
            sessionStorage.removeItem('adminAuth');
          }}
          className="flex items-center gap-2 text-stone-500 transition-colors hover:text-stone-800"
        >
          <LogOut className="h-5 w-5" /> Выйти
        </button>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {[
          { id: 'news', label: 'Новости' },
          { id: 'pleinairs', label: 'Пленеры' },
          { id: 'members', label: 'Участники' },
          { id: 'catalog', label: 'Каталог' },
          { id: 'press', label: 'Пресса' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-stone-900 text-white'
                : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        {activeTab === 'news' && (
          <AdminEntries
            kind="news"
            items={news}
            addNews={addNews}
            updateNews={updateNews}
            deleteNews={deleteNews}
          />
        )}
        {activeTab === 'pleinairs' && (
          <AdminEntries
            kind="pleinair"
            items={news}
            addNews={addNews}
            updateNews={updateNews}
            deleteNews={deleteNews}
          />
        )}
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

function AdminEntries({
  kind,
  items,
  addNews,
  updateNews,
  deleteNews,
}: {
  kind: EntryKind;
  items: NewsItem[];
  addNews: (item: Omit<NewsItem, 'id'>) => void;
  updateNews: (id: string, item: Omit<NewsItem, 'id'>) => void;
  deleteNews: (id: string) => void;
}) {
  const [form, setForm] = useState<EntryFormState>(createEntryFormState());
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredItems = sortEntriesByDate(items.filter((item) => getEntryKind(item) === kind));
  const labels = kind === 'news'
    ? { singular: 'новость', action: 'новости' }
    : { singular: 'пленер', action: 'пленера' };

  const swapEntryDates = (currentItem: NewsItem, targetItem: NewsItem) => {
    updateNews(currentItem.id, {
      title: currentItem.title,
      content: currentItem.content,
      image: currentItem.image,
      date: targetItem.date,
    });

    updateNews(targetItem.id, {
      title: targetItem.title,
      content: targetItem.content,
      image: targetItem.image,
      date: currentItem.date,
    });
  };

  const moveItem = (itemId: string, direction: 'up' | 'down') => {
    const currentIndex = filteredItems.findIndex((item) => item.id === itemId);
    if (currentIndex === -1) {
      return;
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const targetItem = filteredItems[targetIndex];
    const currentItem = filteredItems[currentIndex];

    if (!targetItem || !currentItem) {
      return;
    }

    swapEntryDates(currentItem, targetItem);
  };

  const resetForm = () => {
    setForm(createEntryFormState());
    setEditingId(null);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    const cleanedGallery = form.gallery.filter((image) => image && image !== form.image);
    const previewImage = form.image || cleanedGallery[0] || '';
    const gallery = previewImage ? cleanedGallery.filter((image) => image !== previewImage) : cleanedGallery.slice(1);
    const payload: Omit<NewsItem, 'id'> = {
      title: form.title.trim(),
      image: previewImage || undefined,
      date: fromDateTimeInputValue(form.date),
      content: serializeEntryContent({
        body: form.body,
        kind,
        gallery,
      }),
    };

    if (!payload.title && !form.body.trim() && !payload.image && gallery.length === 0) {
      return;
    }

    if (editingId) {
      updateNews(editingId, payload);
    } else {
      addNews(payload);
    }

    resetForm();
  };

  const startEditing = (item: NewsItem) => {
    const parsedContent = parseEntryContent(item.content);
    setForm({
      title: item.title,
      body: parsedContent.body ?? '',
      image: item.image ?? '',
      gallery: parsedContent.gallery ?? [],
      date: toDateTimeInputValue(item.date),
    });
    setEditingId(item.id);
  };

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-stone-800">
        {editingId ? `Редактировать ${labels.singular}` : `Добавить ${labels.singular}`}
      </h2>
      <form onSubmit={submit} className="mb-8 space-y-4 rounded-xl bg-stone-50 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <input
            type="text"
            placeholder="Заголовок"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            className="w-full rounded-lg border border-stone-300 p-2"
          />
          <input
            type="datetime-local"
            value={form.date}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
            className="w-full rounded-lg border border-stone-300 p-2 text-stone-700"
            required
          />
        </div>
        <textarea
          placeholder={kind === 'news' ? 'Текст новости' : 'Что было на пленере или анонс предстоящего пленера'}
          value={form.body}
          onChange={(event) => setForm({ ...form, body: event.target.value })}
          className="min-h-[140px] w-full rounded-lg border border-stone-300 p-2"
        />
        <ImageUpload value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
        <GalleryUpload value={form.gallery} onChange={(urls) => setForm({ ...form, gallery: urls })} />
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-white hover:bg-stone-800">
            {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editingId ? 'Сохранить' : `Добавить ${labels.singular}`}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-stone-600 hover:bg-stone-50"
            >
              <X className="h-4 w-4" /> Отмена
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {filteredItems.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-stone-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {item.image && <img src={item.image} alt={getEntryTitle(item)} className="h-14 w-14 flex-shrink-0 rounded-lg object-cover" />}
              <div className="min-w-0">
                <h3 className="break-words font-semibold text-stone-900">{getEntryTitle(item)}</h3>
                <p className="text-sm text-stone-400">{formatEntryDate(item.date)} • {getEntryGallery(item).length} фото</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => moveItem(item.id, 'up')}
                disabled={filteredItems[0]?.id === item.id}
                className="p-2 text-stone-400 transition-colors hover:text-stone-700 disabled:cursor-not-allowed disabled:opacity-30"
                title="Поднять выше"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
              <button
                onClick={() => moveItem(item.id, 'down')}
                disabled={filteredItems[filteredItems.length - 1]?.id === item.id}
                className="p-2 text-stone-400 transition-colors hover:text-stone-700 disabled:cursor-not-allowed disabled:opacity-30"
                title="Опустить ниже"
              >
                <ArrowDown className="h-5 w-5" />
              </button>
              <button onClick={() => startEditing(item)} className="p-2 text-stone-400 transition-colors hover:text-stone-700">
                <Edit3 className="h-5 w-5" />
              </button>
              <button onClick={() => deleteNews(item.id)} className="p-2 text-stone-400 transition-colors hover:text-red-500">
                <Trash2 className="h-5 w-5" />
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
      <h2 className="mb-4 text-xl font-bold text-stone-800">{editingId ? 'Редактировать участника' : 'Добавить участника'}</h2>
      <form onSubmit={submit} className="mb-8 space-y-4 rounded-xl bg-stone-50 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            type="text"
            placeholder="Имя"
            required
            value={form.firstName}
            onChange={(event) => setForm({ ...form, firstName: event.target.value })}
            className="w-full rounded-lg border border-stone-300 p-2"
          />
          <input
            type="text"
            placeholder="Фамилия"
            required
            value={form.lastName}
            onChange={(event) => setForm({ ...form, lastName: event.target.value })}
            className="w-full rounded-lg border border-stone-300 p-2"
          />
        </div>
        <textarea
          placeholder="Краткая биография"
          required
          value={form.bio}
          onChange={(event) => setForm({ ...form, bio: event.target.value })}
          className="min-h-[120px] w-full rounded-lg border border-stone-300 p-2"
        />
        <ImageUpload value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-white hover:bg-stone-800">
            {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editingId ? 'Сохранить' : 'Добавить'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-stone-600 hover:bg-stone-50"
            >
              <X className="h-4 w-4" /> Отмена
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {sortedMembers.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-stone-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              {item.image && <img src={item.image} alt={item.name} className="h-12 w-12 flex-shrink-0 rounded-full object-cover" />}
              <div className="min-w-0">
                <p className="break-words font-semibold text-stone-900">{item.name}</p>
                <p className="line-clamp-2 text-sm text-stone-400">{item.bio}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button onClick={() => startEditing(item)} className="p-2 text-stone-400 transition-colors hover:text-stone-700">
                <Edit3 className="h-5 w-5" />
              </button>
              <button onClick={() => deleteMember(item.id)} className="p-2 text-stone-400 transition-colors hover:text-red-500">
                <Trash2 className="h-5 w-5" />
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
  const sortedCatalog = [...catalog].sort(
    (a, b) => getCatalogAuthorName(a, members).localeCompare(getCatalogAuthorName(b, members), 'ru') || a.title.localeCompare(b.title, 'ru')
  );

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
      <h2 className="mb-1 text-xl font-bold text-stone-800">{editingId ? 'Редактировать картину' : 'Добавить картину в каталог'}</h2>
      <p className="mb-4 text-sm text-stone-400">
        Работа привязывается к участнику по внутреннему ID, поэтому переименование больше не отрывает картины от автора.
      </p>
      <form onSubmit={submit} className="mb-8 space-y-4 rounded-xl bg-stone-50 p-4">
        <input
          type="text"
          placeholder="Название картины"
          required
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          className="w-full rounded-lg border border-stone-300 p-2"
        />
        <select
          value={form.author}
          onChange={(event) => setForm({ ...form, author: event.target.value })}
          className="w-full rounded-lg border border-stone-300 bg-white p-2 text-stone-700"
          required
        >
          <option value="">Выберите автора</option>
          {sortedMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Описание (размер, техника — необязательно)"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          className="w-full rounded-lg border border-stone-300 p-2"
        />
        <ImageUpload value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-white hover:bg-stone-800">
            {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editingId ? 'Сохранить' : 'Добавить'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-stone-600 hover:bg-stone-50"
            >
              <X className="h-4 w-4" /> Отмена
            </button>
          )}
        </div>
      </form>
      <div className="space-y-3">
        {sortedCatalog.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-stone-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              {item.image && <img src={item.image} alt={item.title} className="h-14 w-14 flex-shrink-0 rounded-lg object-cover" />}
              <div className="min-w-0">
                <p className="break-words font-semibold text-stone-900">{item.title}</p>
                <p className="text-sm text-stone-400">{getCatalogAuthorName(item, members)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => {
                  setForm({
                    title: item.title,
                    author: resolveMemberIdByAuthor(item.author, members) ?? '',
                    description: item.description ?? '',
                    image: item.image,
                  });
                  setEditingId(item.id);
                }}
                className="p-2 text-stone-400 transition-colors hover:text-stone-700"
              >
                <Edit3 className="h-5 w-5" />
              </button>
              <button onClick={() => deleteCatalogItem(item.id)} className="p-2 text-stone-400 transition-colors hover:text-red-500">
                <Trash2 className="h-5 w-5" />
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
      <h2 className="mb-4 text-xl font-bold text-stone-800">{editingId ? 'Редактировать публикацию' : 'Добавить ссылку на прессу'}</h2>
      <form onSubmit={submit} className="mb-8 space-y-4 rounded-xl bg-stone-50 p-4">
        <input
          type="text"
          placeholder="Заголовок статьи"
          required
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          className="w-full rounded-lg border border-stone-300 p-2"
        />
        <input
          type="text"
          placeholder="Название издания"
          required
          value={form.source}
          onChange={(event) => setForm({ ...form, source: event.target.value })}
          className="w-full rounded-lg border border-stone-300 p-2"
        />
        <input
          type="url"
          placeholder="Ссылка (URL)"
          required
          value={form.url}
          onChange={(event) => setForm({ ...form, url: event.target.value })}
          className="w-full rounded-lg border border-stone-300 p-2"
        />
        <textarea
          placeholder="Короткая цитата/выдержка"
          required
          value={form.snippet}
          onChange={(event) => setForm({ ...form, snippet: event.target.value })}
          className="w-full rounded-lg border border-stone-300 p-2"
        />
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-white hover:bg-stone-800">
            {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editingId ? 'Сохранить' : 'Добавить'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-stone-600 hover:bg-stone-50"
            >
              <X className="h-4 w-4" /> Отмена
            </button>
          )}
        </div>
      </form>
      <div className="space-y-3">
        {press.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-stone-100 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="break-words text-stone-900">
              <b>{item.source}</b>: {item.title}
            </span>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => {
                  setForm({ title: item.title, source: item.source, url: item.url, snippet: item.snippet });
                  setEditingId(item.id);
                }}
                className="p-2 text-stone-400 transition-colors hover:text-stone-700"
              >
                <Edit3 className="h-5 w-5" />
              </button>
              <button onClick={() => deletePressItem(item.id)} className="p-2 text-stone-400 transition-colors hover:text-red-500">
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
