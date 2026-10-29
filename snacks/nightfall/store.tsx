import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { byId, PROFILES, type Profile, type Title } from './data';

export type Tab = 'home' | 'new' | 'my';
export type Filter = 'all' | 'series' | 'movie';
export type Rating = 'down' | 'up' | 'love';
export type Route =
  | { name: 'title'; id: string }
  | { name: 'player'; id: string; s?: number; e?: number; trailer?: string }
  | { name: 'search' }
  | { name: 'downloads' }
  | { name: 'notifications' };

interface Saved {
  myList: string[];
  progress: Record<string, number>;
  lastEp: Record<string, [number, number]>;
  ratings: Record<string, Rating>;
  reminders: string[];
  downloads: Record<string, number>;
  trailers: string[];
}

const STORAGE = 'plocks-nightfall-example:v2';
const INITIAL: Saved = {
  myList: ['stillwater', 'afterdark', 'tidekeepers'],
  progress: { wildwood: 0.42, 'nightshift:1:3': 0.19, 'dust:1:2': 0.63, 'nightshift:1:1': 1, 'nightshift:1:2': 1, 'dust:1:1': 1 },
  lastEp: { nightshift: [1, 3], dust: [1, 2] },
  ratings: { evergreen: 'love' },
  reminders: ['northern'],
  downloads: { goldenhour: 1 },
  trailers: ['glasshouse'],
};

export const progressKey = (id: string, s?: number, e?: number) => (s && e ? `${id}:${s}:${e}` : id);

function useNightfallState() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<Tab>('home');
  const [filter, setFilter] = useState<Filter>('all');
  const [genre, setGenre] = useState<string | null>(null);
  const [stack, setStack] = useState<Route[]>([]);
  const [saved, setSaved] = useState<Saved>(INITIAL);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE)
      .then((raw) => {
        if (raw) setSaved({ ...INITIAL, ...(JSON.parse(raw) as Partial<Saved>) });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE, JSON.stringify(saved)).catch(() => {});
  }, [saved, ready]);

  // Simulated downloads: anything below 1 creeps forward until it finishes.
  const downloading = Object.values(saved.downloads).some((value) => value < 1);
  useEffect(() => {
    if (!downloading) return;
    const timer = setInterval(() => {
      setSaved((old) => ({
        ...old,
        downloads: Object.fromEntries(
          Object.entries(old.downloads).map(([id, value]) => [id, value < 1 ? Math.min(1, value + 0.08) : value]),
        ),
      }));
    }, 350);
    return () => clearInterval(timer);
  }, [downloading]);

  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  const update = (patch: (old: Saved) => Partial<Saved>) => setSaved((old) => ({ ...old, ...patch(old) }));

  return {
    ...saved,
    profile,
    tab,
    filter,
    genre,
    stack,
    route: stack[stack.length - 1] as Route | undefined,
    selectProfile: (id: string | null) => {
      setProfile(PROFILES.find((item) => item.id === id) ?? null);
      setStack([]);
      setTab('home');
    },
    setTab: (next: Tab) => {
      setStack([]);
      setTab(next);
    },
    setFilter: (next: Filter, nextGenre: string | null = null) => {
      setStack([]);
      setTab('home');
      setFilter(next);
      setGenre(nextGenre);
    },
    push: (next: Route) => setStack((old) => [...old, next]),
    back: () => setStack((old) => old.slice(0, -1)),
    openTitle: (id: string) => setStack((old) => [...old, { name: 'title', id }]),
    play: (id: string, s?: number, e?: number) => {
      const title = byId(id);
      if (title.kind === 'series' && !s) [s, e] = saved.lastEp[id] ?? [1, 1];
      setStack((old) => [...old, { name: 'player', id, s, e }]);
    },
    playTrailer: (id: string, trailer: string) => {
      update((old) => ({ trailers: old.trailers.includes(id) ? old.trailers : [id, ...old.trailers] }));
      setStack((old) => [...old, { name: 'player', id, trailer }]);
    },
    toggleList: (id: string) => update((old) => ({ myList: toggle(old.myList, id) })),
    toggleReminder: (id: string) => update((old) => ({ reminders: toggle(old.reminders, id) })),
    rate: (id: string, value: Rating) =>
      update((old) => {
        const ratings = { ...old.ratings };
        if (ratings[id] === value) delete ratings[id];
        else ratings[id] = value;
        return { ratings };
      }),
    download: (id: string) => update((old) => ({ downloads: { ...old.downloads, [id]: old.downloads[id] ?? 0 } })),
    removeDownload: (id: string) =>
      update((old) => {
        const downloads = { ...old.downloads };
        delete downloads[id];
        return { downloads };
      }),
    setProgress: (key: string, value: number, id?: string, s?: number, e?: number) =>
      setSaved((old) => {
        if (Math.abs((old.progress[key] ?? 0) - value) < 0.01 && value !== 1) return old;
        const lastEp = id && s && e ? { ...old.lastEp, [id]: [s, e] as [number, number] } : old.lastEp;
        return { ...old, lastEp, progress: { ...old.progress, [key]: value } };
      }),
    /** Progress for the title's resume point (last episode for series). */
    resume: (title: Title) => {
      if (title.kind === 'movie') return { value: saved.progress[title.id] ?? 0, label: '' };
      const [s, e] = saved.lastEp[title.id] ?? [1, 1];
      return { value: saved.progress[progressKey(title.id, s, e)] ?? 0, label: `S${s}:E${e}`, s, e };
    },
  };
}

export type Nightfall = ReturnType<typeof useNightfallState>;
const Context = createContext<Nightfall | null>(null);

export function NightfallProvider({ children }: { children: ReactNode }) {
  return <Context.Provider value={useNightfallState()}>{children}</Context.Provider>;
}

export function useNightfall() {
  const value = useContext(Context);
  if (!value) throw new Error('useNightfall must be used inside NightfallProvider');
  return value;
}
