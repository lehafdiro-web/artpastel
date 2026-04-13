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
  addNews: (item: Omit<NewsItem, 'id'>) => void;
  updateNews: (id: string, item: Omit<NewsItem, 'id'>) => void;
  deleteNews: (id: string) => void;
  setNews: (items: NewsItem[]) => void;

  members: Member[];
  addMember: (item: Omit<Member, 'id'>) => void;
  updateMember: (id: string, item: Omit<Member, 'id'>) => void;
  deleteMember: (id: string) => void;
  setMembers: (items: Member[]) => void;

  catalog: CatalogItem[];
  addCatalogItem: (item: Omit<CatalogItem, 'id'>) => void;
  updateCatalogItem: (id: string, item: Omit<CatalogItem, 'id'>) => void;
  deleteCatalogItem: (id: string) => void;
  setCatalog: (items: CatalogItem[]) => void;

  press: PressItem[];
  addPressItem: (item: Omit<PressItem, 'id'>) => void;
  updatePressItem: (id: string, item: Omit<PressItem, 'id'>) => void;
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

const importedMembersById = new Map(importedMembers.map((member) => [member.id, normalizeMemberName(member.name)]));
const importedMemberIdByName = new Map(
  importedMembers.map((member) => [normalizeMemberName(member.name), member.id])
);

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
  const existingIds = new Set(normalizedCurrent.map((member) => member.id));
  const existingNames = new Set(normalizedCurrent.map((member) => member.name));
  const missingImported = imported
    .map(normalizeMember)
    .filter((member) => !existingIds.has(member.id) && !existingNames.has(member.name));

  return [...normalizedCurrent, ...missingImported];
};

const mergeCatalog = (current: CatalogItem[], imported: CatalogItem[]): CatalogItem[] => {
  const merged = new Map<string, CatalogItem>();
  const normalizedImported = imported.map(normalizeCatalogItem);
  const importedById = new Map(normalizedImported.map((item) => [item.id, item]));

  normalizedImported.forEach((item) => {
    merged.set(item.id, item);
  });

  current.map(normalizeCatalogItem).forEach((item) => {
    const importedItem = importedById.get(item.id);
    merged.set(item.id, {
      ...importedItem,
      ...item,
      description: item.description ?? importedItem?.description,
    });
  });

  return Array.from(merged.values());
};

const mergePortfolioState = (state: Pick<AppState, 'members' | 'catalog'>) => ({
  members: mergeMembers(state.members, importedMembers),
  catalog: mergeCatalog(state.catalog, importedCatalog),
});

const pushToSupabase = async (table: string, data: unknown) => {
  if (!supabase) {
    return true;
  }

  const { error } = await supabase.from(table).insert([data]);
  if (error) {
    console.error('Supabase insert error', error);
    return false;
  }

  return true;
};

const deleteFromSupabase = async (table: string, id: string) => {
  if (!supabase) {
    return true;
  }

  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) {
    console.error('Supabase delete error', error);
    return false;
  }

  return true;
};

const updateInSupabase = async (table: string, id: string, data: Record<string, unknown>) => {
  if (!supabase) {
    return true;
  }

  const { error } = await supabase.from(table).update(data).eq('id', id);
  if (error) {
    console.error('Supabase update error', error);
    return false;
  }

  return true;
};

const toCatalogSupabaseRow = (item: CatalogItem) => ({
  id: item.id,
  title: item.title,
  author: item.author,
  image: item.image,
});

export const resolveMemberIdByAuthor = (authorRef: string, members: Member[]) => {
  const normalizedAuthor = normalizeMemberName(authorRef);
  const byId = members.find((member) => member.id === authorRef);
  if (byId) {
    return byId.id;
  }

  const byName = members.find((member) => member.name === normalizedAuthor);
  if (byName) {
    return byName.id;
  }

  const importedId = importedMemberIdByName.get(normalizedAuthor);
  if (!importedId) {
    return null;
  }

  const currentImportedMember = members.find((member) => member.id === importedId);
  return currentImportedMember?.id ?? importedId;
};

export const getCatalogAuthorName = (item: CatalogItem, members: Member[]) => {
  const memberId = resolveMemberIdByAuthor(item.author, members);
  if (!memberId) {
    return normalizeMemberName(item.author);
  }

  const member = members.find((entry) => entry.id === memberId);
  return member?.name ?? importedMembersById.get(memberId) ?? normalizeMemberName(item.author);
};

export const isCatalogItemOwnedByMember = (item: CatalogItem, member: Member, members: Member[]) =>
  resolveMemberIdByAuthor(item.author, members) === member.id;

export const getCatalogAuthorKey = (item: CatalogItem, members: Member[]) =>
  resolveMemberIdByAuthor(item.author, members) ?? normalizeMemberName(item.author);

export const countCatalogItemsForMember = (catalog: CatalogItem[], member: Member, members: Member[]) =>
  catalog.filter((item) => isCatalogItemOwnedByMember(item, member, members)).length;

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      isAdmin: false,
      login: () => set({ isAdmin: true }),
      logout: () => set({ isAdmin: false }),

      news: [],
      addNews: (item) =>
        set((state) => {
          const newItem = { ...item, id: generateId(), date: item.date || new Date().toISOString() };
          pushToSupabase('news', newItem);
          return { news: [newItem, ...state.news] };
        }),
      updateNews: (id, item) =>
        set((state) => {
          const currentItem = state.news.find((newsItem) => newsItem.id === id);
          if (!currentItem) {
            return state;
          }

          const updatedItem = { ...currentItem, ...item, id };
          updateInSupabase('news', id, updatedItem);
          return { news: state.news.map((newsItem) => (newsItem.id === id ? updatedItem : newsItem)) };
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

          return {
            members: state.members.map((member) => (member.id === id ? updatedMember : member)),
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
          const newItem = normalizeCatalogItem({ ...item, id: generateId() });
          pushToSupabase('catalog', toCatalogSupabaseRow(newItem));
          return { catalog: [...state.catalog, newItem] };
        }),
      updateCatalogItem: (id, item) =>
        set((state) => {
          const currentItem = state.catalog.find((catalogItem) => catalogItem.id === id);
          if (!currentItem) {
            return state;
          }

          const updatedItem = normalizeCatalogItem({ ...currentItem, ...item, id });
          updateInSupabase('catalog', id, toCatalogSupabaseRow(updatedItem));
          return { catalog: state.catalog.map((catalogItem) => (catalogItem.id === id ? updatedItem : catalogItem)) };
        }),
      deleteCatalogItem: (id) =>
        set((state) => {
          deleteFromSupabase('catalog', id);
          return { catalog: state.catalog.filter((catalogItem) => catalogItem.id !== id) };
        }),
      setCatalog: (items) => set({ catalog: items }),

      press: [],
      addPressItem: (item) =>
        set((state) => {
          const newItem = { ...item, id: generateId() };
          pushToSupabase('press', newItem);
          return { press: [...state.press, newItem] };
        }),
      updatePressItem: (id, item) =>
        set((state) => {
          const currentItem = state.press.find((pressItem) => pressItem.id === id);
          if (!currentItem) {
            return state;
          }

          const updatedItem = { ...currentItem, ...item, id };
          updateInSupabase('press', id, updatedItem);
          return { press: state.press.map((pressItem) => (pressItem.id === id ? updatedItem : pressItem)) };
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
            news: newsData.data ?? [],
            members: mergeMembers(membersData.data ?? state.members, importedMembers),
            catalog: mergeCatalog(catalogData.data ?? state.catalog, importedCatalog),
            press: pressData.data ?? [],
          }));
        } catch (error) {
          console.error('Error fetching from Supabase', error);
          set((state) => ({
            ...mergePortfolioState(state),
            news: [],
            press: [],
          }));
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
