import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { importedCatalog, importedMembers } from './data/importedPortfolio';
import { supabase } from './lib/supabase';

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  image?: string;
  date: string;
}

export interface Member {
  id: string;
  name: string;
  bio: string;
  image?: string;
}

export interface CatalogItem {
  id: string;
  title: string;
  author: string;
  image: string;
  description?: string;
}

export interface PressItem {
  id: string;
  title: string;
  snippet: string;
  source: string;
  url: string;
}

interface AppState {
  isAdmin: boolean;
  login: () => void;
  logout: () => void;

  news: NewsItem[];
  addNews: (item: Omit<NewsItem, 'id' | 'date'>) => void;
  deleteNews: (id: string) => void;
  setNews: (items: NewsItem[]) => void;

  members: Member[];
  addMember: (item: Omit<Member, 'id'>) => void;
  updateMember: (id: string, item: Omit<Member, 'id'>) => void;
  deleteMember: (id: string) => void;
  setMembers: (items: Member[]) => void;

  catalog: CatalogItem[];
  addCatalogItem: (item: Omit<CatalogItem, 'id'>) => void;
  deleteCatalogItem: (id: string) => void;
  setCatalog: (items: CatalogItem[]) => void;

  press: PressItem[];
  addPressItem: (item: Omit<PressItem, 'id'>) => void;
  deletePressItem: (id: string) => void;
  setPress: (items: PressItem[]) => void;

  fetchFromSupabase: () => Promise<void>;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const memberNameOverrides: Record<string, string> = {
  'Какоткина Светлана': 'Светлана Какоткина',
  'Фидирко Анна': 'Анна Фидирко',
  'Семенова Елена': 'Елена Семенова',
  'Батищева Кристина': 'Кристина Батищева',
  'Куралбаев Дамир': 'Дамир Куралбаев',
  'Хакимжанова Айгуль': 'Айгуль Хакимжанова',
  'Трофимович Виктория': 'Виктория Трофимович',
};

const normalizeMemberName = (name: string) => memberNameOverrides[name] ?? name;

const normalizeMember = (member: Member): Member => ({
  ...member,
  name: normalizeMemberName(member.name),
});

const normalizeCatalogItem = (item: CatalogItem): CatalogItem => ({
  ...item,
  author: normalizeMemberName(item.author),
});

const mergeMembers = (current: Member[], imported: Member[]): Member[] => {
  const normalizedCurrent = current.map(normalizeMember);
  const normalizedImported = imported.map(normalizeMember);
  const existingNames = new Set(normalizedCurrent.map((member) => member.name));
  return [...normalizedCurrent, ...normalizedImported.filter((member) => !existingNames.has(member.name))];
};

const mergeCatalog = (current: CatalogItem[], imported: CatalogItem[]): CatalogItem[] => {
  const normalizedCurrent = current.map(normalizeCatalogItem);
  const normalizedImported = imported.map(normalizeCatalogItem);
  const existingKeys = new Set(normalizedCurrent.map((item) => `${item.author}::${item.title}`));
  return [...normalizedCurrent, ...normalizedImported.filter((item) => !existingKeys.has(`${item.author}::${item.title}`))];
};

const mergePortfolioState = (state: Pick<AppState, 'members' | 'catalog'>) => ({
  members: mergeMembers(state.members, importedMembers),
  catalog: mergeCatalog(state.catalog, importedCatalog),
});

const pushToSupabase = async (table: string, data: unknown) => {
  if (!supabase) {
    return;
  }

  try {
    await supabase.from(table).insert([data]);
  } catch (error) {
    console.error('Supabase insert error', error);
  }
};

const deleteFromSupabase = async (table: string, id: string) => {
  if (!supabase) {
    return;
  }

  try {
    await supabase.from(table).delete().eq('id', id);
  } catch (error) {
    console.error('Supabase delete error', error);
  }
};

const updateInSupabase = async (table: string, id: string, data: Record<string, unknown>) => {
  if (!supabase) {
    return;
  }

  try {
    await supabase.from(table).update(data).eq('id', id);
  } catch (error) {
    console.error('Supabase update error', error);
  }
};

const updateCatalogAuthorInSupabase = async (previousName: string, nextName: string) => {
  if (!supabase || previousName === nextName) {
    return;
  }

  try {
    await supabase.from('catalog').update({ author: nextName }).eq('author', previousName);
  } catch (error) {
    console.error('Supabase catalog author update error', error);
  }
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      isAdmin: false,
      login: () => set({ isAdmin: true }),
      logout: () => set({ isAdmin: false }),

      news: [
        {
          id: '1',
          title: 'Открытие выставки "Степная пастель"',
          content: 'Приглашаем всех на выставку работ художников-пастелистов в Алматы.',
          image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80',
          date: new Date().toISOString(),
        },
      ],
      addNews: (item) =>
        set((state) => {
          const newItem = { ...item, id: generateId(), date: new Date().toISOString() };
          pushToSupabase('news', newItem);
          return { news: [newItem, ...state.news] };
        }),
      deleteNews: (id) =>
        set((state) => {
          deleteFromSupabase('news', id);
          return { news: state.news.filter((newsItem) => newsItem.id !== id) };
        }),
      setNews: (items) => set({ news: items }),

      members: importedMembers.map(normalizeMember),
      addMember: (item) =>
        set((state) => {
          const newItem = normalizeMember({ ...item, id: generateId() });
          pushToSupabase('members', newItem);
          return { members: [...state.members, newItem] };
        }),
      updateMember: (id, item) =>
        set((state) => {
          const currentMember = state.members.find((member) => member.id === id);
          if (!currentMember) {
            return state;
          }

          const updatedMember = normalizeMember({ ...item, id });
          updateInSupabase('members', id, updatedMember);
          updateCatalogAuthorInSupabase(currentMember.name, updatedMember.name);

          return {
            members: state.members.map((member) => (member.id === id ? updatedMember : member)),
            catalog: state.catalog.map((catalogItem) =>
              catalogItem.author === currentMember.name
                ? { ...catalogItem, author: updatedMember.name }
                : catalogItem
            ),
          };
        }),
      deleteMember: (id) =>
        set((state) => {
          deleteFromSupabase('members', id);
          return { members: state.members.filter((member) => member.id !== id) };
        }),
      setMembers: (items) => set({ members: items }),

      catalog: importedCatalog.map(normalizeCatalogItem),
      addCatalogItem: (item) =>
        set((state) => {
          const newItem = { ...item, id: generateId() };
          pushToSupabase('catalog', newItem);
          return { catalog: [...state.catalog, newItem] };
        }),
      deleteCatalogItem: (id) =>
        set((state) => {
          deleteFromSupabase('catalog', id);
          return { catalog: state.catalog.filter((catalogItem) => catalogItem.id !== id) };
        }),
      setCatalog: (items) => set({ catalog: items }),

      press: [
        {
          id: '1',
          title: 'Возрождение пастельной живописи',
          source: 'ArtKZ Magazine',
          url: 'https://example.com',
          snippet: 'Сообщество пастелистов из Алматы привлекает всё больше внимания...',
        },
      ],
      addPressItem: (item) =>
        set((state) => {
          const newItem = { ...item, id: generateId() };
          pushToSupabase('press', newItem);
          return { press: [...state.press, newItem] };
        }),
      deletePressItem: (id) =>
        set((state) => {
          deleteFromSupabase('press', id);
          return { press: state.press.filter((pressItem) => pressItem.id !== id) };
        }),
      setPress: (items) => set({ press: items }),

      fetchFromSupabase: async () => {
        if (!supabase) {
          set((state) => mergePortfolioState(state));
          return;
        }

        try {
          const [newsData, membersData, catalogData, pressData] = await Promise.all([
            supabase.from('news').select('*').order('date', { ascending: false }),
            supabase.from('members').select('*'),
            supabase.from('catalog').select('*'),
            supabase.from('press').select('*'),
          ]);

          set((state) => ({
            news: newsData.data && newsData.data.length > 0 ? newsData.data : state.news,
            members: mergeMembers(
              membersData.data && membersData.data.length > 0 ? membersData.data : state.members,
              importedMembers
            ),
            catalog: mergeCatalog(
              catalogData.data && catalogData.data.length > 0 ? catalogData.data : state.catalog,
              importedCatalog
            ),
            press: pressData.data && pressData.data.length > 0 ? pressData.data : state.press,
          }));
        } catch (error) {
          console.error('Error fetching from Supabase', error);
          set((state) => mergePortfolioState(state));
        }
      },
    }),
    {
      name: 'pastel-almaty-storage',
    }
  )
);

export function useData() {
  const store = useStore();
  return {
    news: store.news,
    setNews: store.setNews,
    members: store.members,
    setMembers: store.setMembers,
    catalog: store.catalog,
    setCatalog: store.setCatalog,
    press: store.press,
    setPress: store.setPress,
  };
}
