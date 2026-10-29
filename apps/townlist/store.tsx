/** App state for Townlist: navigation stacks, area, listings, favorites, and messages. */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CITIES,
  HOME_CITY,
  LISTINGS,
  THREADS,
  cityById,
  distance,
  type Listing,
  type SectionId,
  type Thread,
} from './data';

export type Tab = 'browse' | 'saved' | 'post' | 'messages';
export type Sort = 'newest' | 'price-asc' | 'price-desc';
export type Filter = {
  query: string;
  section?: SectionId;
  sub?: string;
  hasImage?: boolean;
  today?: boolean;
  min?: string;
  max?: string;
  sort?: Sort;
};
export type Route =
  | { name: 'home' }
  | { name: 'categories'; section?: SectionId }
  | { name: 'cities' }
  | { name: 'results'; filter: Filter }
  | { name: 'listing'; id: string }
  | { name: 'threads' }
  | { name: 'thread'; id: string }
  | { name: 'saved' }
  | { name: 'post' };
export type SavedSearch = { id: string; filter: Filter; cityId: string; radius: number };

const ROOTS: Record<Tab, Route> = {
  browse: { name: 'home' },
  saved: { name: 'saved' },
  post: { name: 'post' },
  messages: { name: 'threads' },
};
const STORAGE = 'plocks-townlist-example:v2';
const DAY = 24 * 60 * 60_000;

type Persisted = {
  posts: Listing[];
  favorites: string[];
  hidden: string[];
  threads: Thread[];
  cityId: string;
  radius: number;
  searches: SavedSearch[];
};

function useTownlistState() {
  const [tab, setTab] = useState<Tab>('browse');
  const [stacks, setStacks] = useState<Record<Tab, Route[]>>({
    browse: [ROOTS.browse],
    saved: [ROOTS.saved],
    post: [ROOTS.post],
    messages: [ROOTS.messages],
  });
  const [posts, setPosts] = useState<Listing[]>(LISTINGS.filter((item) => item.mine));
  const [favorites, setFavorites] = useState<string[]>(['7803', '7804']);
  const [hidden, setHidden] = useState<string[]>([]);
  const [flagged, setFlagged] = useState<string[]>([]);
  const [threads, setThreads] = useState<Thread[]>(THREADS);
  const [cityId, setCityId] = useState(HOME_CITY);
  const [radius, setRadius] = useState(25);
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [ready, setReady] = useState(false);
  const replyTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE)
      .then((raw) => {
        if (!raw) return;
        const data = JSON.parse(raw) as Partial<Persisted>;
        if (Array.isArray(data.posts)) setPosts(data.posts);
        if (Array.isArray(data.favorites)) setFavorites(data.favorites);
        if (Array.isArray(data.hidden)) setHidden(data.hidden);
        if (Array.isArray(data.threads)) setThreads(data.threads);
        if (Array.isArray(data.searches)) setSearches(data.searches);
        if (typeof data.cityId === 'string' && CITIES.some((city) => city.id === data.cityId)) setCityId(data.cityId);
        if (typeof data.radius === 'number') setRadius(data.radius);
      })
      .catch(() => {})
      .finally(() => setReady(true));
    const timers = replyTimers.current;
    return () => timers.forEach(clearTimeout);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const data: Persisted = { posts, favorites, hidden, threads, cityId, radius, searches };
    AsyncStorage.setItem(STORAGE, JSON.stringify(data)).catch(() => {});
  }, [ready, posts, favorites, hidden, threads, cityId, radius, searches]);

  const listings = useMemo(() => [...posts, ...LISTINGS.filter((item) => !item.mine)], [posts]);
  const listingById = useCallback((id: string) => listings.find((item) => item.id === id), [listings]);
  const city = cityById(cityId);

  /** Listings in the current area (city plus anything within the search radius). */
  const inArea = useCallback(
    (item: Listing) => item.cityId === cityId || distance(city, cityById(item.cityId)) <= radius,
    [city, cityId, radius],
  );

  const search = useCallback(
    (filter: Filter, options: { includeHidden?: boolean } = {}) => {
      const words = filter.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const min = Number(filter.min);
      const max = Number(filter.max);
      const now = Date.now();
      const found = listings.filter(
        (item) =>
          inArea(item) &&
          (options.includeHidden || !hidden.includes(item.id)) &&
          (!filter.section || item.section === filter.section) &&
          (!filter.sub || item.sub === filter.sub) &&
          (!filter.hasImage || item.photos.length > 0) &&
          (!filter.today || now - item.postedAt < DAY) &&
          (!filter.min || (item.price ?? 0) >= min) &&
          (!filter.max || (item.price ?? 0) <= max) &&
          words.every((word) => `${item.title} ${item.body} ${item.hood}`.toLowerCase().includes(word)),
      );
      const sort = filter.sort ?? 'newest';
      return found.sort((a, b) =>
        sort === 'newest' ? b.postedAt - a.postedAt : sort === 'price-asc' ? (a.price ?? 0) - (b.price ?? 0) : (b.price ?? 0) - (a.price ?? 0),
      );
    },
    [listings, inArea, hidden],
  );

  const stack = stacks[tab];
  const route = stack[stack.length - 1];
  const push = useCallback(
    (next: Route) => setStacks((old) => ({ ...old, [tab]: [...old[tab], next] })),
    [tab],
  );
  const replace = useCallback(
    (next: Route) => setStacks((old) => ({ ...old, [tab]: [...old[tab].slice(0, -1), next] })),
    [tab],
  );
  const back = useCallback(
    () => setStacks((old) => ({ ...old, [tab]: old[tab].length > 1 ? old[tab].slice(0, -1) : old[tab] })),
    [tab],
  );
  const goTab = useCallback(
    (next: Tab, reset = false) => {
      if (next === tab || reset) setStacks((old) => ({ ...old, [next]: [ROOTS[next]] }));
      setTab(next);
    },
    [tab],
  );
  /** Jump to a tab with a route on top of its root. */
  const openIn = useCallback((next: Tab, target: Route) => {
    setStacks((old) => ({ ...old, [next]: [ROOTS[next], target] }));
    setTab(next);
  }, []);

  const toggle = (setter: typeof setFavorites) => (id: string) =>
    setter((old) => (old.includes(id) ? old.filter((item) => item !== id) : [...old, id]));

  function publish(listing: Listing) {
    setPosts((old) => [listing, ...old]);
  }
  function removePost(id: string) {
    setPosts((old) => old.filter((item) => item.id !== id));
  }

  /** Starts (or continues) a conversation about a listing; returns the thread id. */
  function reply(listing: Listing, text: string) {
    const existing = threads.find((item) => item.listingId === listing.id);
    const id = existing?.id ?? `t-${Date.now()}`;
    const message = { id: `${id}-${Date.now()}`, from: 'me' as const, text, at: Date.now() };
    setThreads((old) =>
      existing
        ? old.map((item) => (item.id === id ? { ...item, messages: [...item.messages, message] } : item))
        : [{ id, listingId: listing.id, name: listing.seller, role: 'buying', unread: 0, messages: [message] }, ...old],
    );
    scheduleAutoReply(id, listing.seller);
    return id;
  }
  function send(threadId: string, text: string) {
    const message = { id: `${threadId}-${Date.now()}`, from: 'me' as const, text, at: Date.now() };
    setThreads((old) => old.map((item) => (item.id === threadId ? { ...item, messages: [...item.messages, message] } : item)));
    const thread = threads.find((item) => item.id === threadId);
    if (thread) scheduleAutoReply(threadId, thread.name);
  }
  function scheduleAutoReply(threadId: string, name: string) {
    const timer = setTimeout(() => {
      setThreads((old) =>
        old.map((item) =>
          item.id === threadId
            ? {
                ...item,
                unread: item.unread + 1,
                messages: [
                  ...item.messages,
                  { id: `${threadId}-r${Date.now()}`, from: 'them', text: `Thanks for the message! This is a demo reply from ${name}.`, at: Date.now() },
                ],
              }
            : item,
        ),
      );
    }, 2200);
    replyTimers.current.push(timer);
  }
  function markRead(threadId: string) {
    setThreads((old) => old.map((item) => (item.id === threadId && item.unread ? { ...item, unread: 0 } : item)));
  }
  function saveSearch(filter: Filter) {
    setSearches((old) => [{ id: `s-${Date.now()}`, filter, cityId, radius }, ...old]);
  }
  function removeSearch(id: string) {
    setSearches((old) => old.filter((item) => item.id !== id));
  }
  function runSearch(saved: SavedSearch) {
    setCityId(saved.cityId);
    setRadius(saved.radius);
    openIn('browse', { name: 'results', filter: saved.filter });
  }

  return {
    tab,
    route,
    canGoBack: stack.length > 1,
    push,
    replace,
    back,
    goTab,
    openIn,
    listings,
    posts,
    listingById,
    search,
    inArea,
    city,
    cityId,
    setCityId,
    radius,
    setRadius,
    favorites,
    toggleFavorite: toggle(setFavorites),
    hidden,
    toggleHidden: toggle(setHidden),
    flagged,
    flag: (id: string) => setFlagged((old) => (old.includes(id) ? old : [...old, id])),
    publish,
    removePost,
    threads,
    reply,
    send,
    markRead,
    unread: threads.reduce((sum, item) => sum + item.unread, 0),
    searches,
    saveSearch,
    removeSearch,
    runSearch,
  };
}

export type Store = ReturnType<typeof useTownlistState>;
const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const store = useTownlistState();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore needs StoreProvider');
  return store;
}
