export type Message = {
  id: string;
  text: string;
  time: string;
  outgoing: boolean;
};

export type Chat = {
  id: string;
  name: string;
  initials: string;
  color: string;
  isGroup?: boolean;
  online?: boolean;
  unread: number;
  messages: Message[];
};

export const SEED_CHATS: Chat[] = [
  {
    id: 'maria', name: 'Maria Chen', initials: 'MC', color: '#D7936C', online: true, unread: 2,
    messages: [
      { id: 'm1', text: 'Hey! Are we still on for coffee this afternoon?', time: '10:31 AM', outgoing: false },
      { id: 'm2', text: 'Absolutely. I found a little place near the park ☕', time: '10:34 AM', outgoing: true },
      { id: 'm3', text: 'Perfect, I can be there around 3.', time: '10:42 AM', outgoing: false },
      { id: 'm4', text: 'I will send you the address in a minute!', time: '10:42 AM', outgoing: false },
    ],
  },
  {
    id: 'design', name: 'Design Team', initials: 'DT', color: '#806DB9', isGroup: true, unread: 3,
    messages: [
      { id: 'd1', text: 'Morning team! The new concepts are ready to review.', time: '9:12 AM', outgoing: false },
      { id: 'd2', text: 'These look great. The colors are really coming together.', time: '9:18 AM', outgoing: true },
      { id: 'd3', text: 'I added my notes to the board.', time: '9:24 AM', outgoing: false },
    ],
  },
  {
    id: 'dad', name: 'Dad', initials: 'D', color: '#729A87', unread: 0,
    messages: [
      { id: 'f1', text: 'Just checked in. Everything is going well here!', time: 'Yesterday', outgoing: false },
      { id: 'f2', text: 'Glad to hear it. Talk this weekend?', time: 'Yesterday', outgoing: true },
      { id: 'f3', text: 'Sounds good ❤️', time: 'Yesterday', outgoing: false },
    ],
  },
  {
    id: 'alex', name: 'Alex Rivera', initials: 'AR', color: '#6D9AB2', online: true, unread: 0,
    messages: [
      { id: 'a1', text: 'I finished that playlist I told you about.', time: 'Yesterday', outgoing: false },
      { id: 'a2', text: 'Send it over! I need something new to listen to.', time: 'Yesterday', outgoing: true },
      { id: 'a3', text: 'You are going to love the last track 🎵', time: 'Yesterday', outgoing: false },
    ],
  },
  {
    id: 'weekend', name: 'Weekend Plans', initials: 'WP', color: '#C38A80', isGroup: true, unread: 0,
    messages: [
      { id: 'w1', text: 'Should we do a picnic on Saturday?', time: 'Monday', outgoing: false },
      { id: 'w2', text: 'I can bring snacks and a blanket.', time: 'Monday', outgoing: true },
      { id: 'w3', text: 'Saturday works for everyone! 🌿', time: 'Monday', outgoing: false },
    ],
  },
  {
    id: 'priya', name: 'Priya Shah', initials: 'PS', color: '#B38EAB', unread: 0,
    messages: [
      { id: 'p1', text: 'Thank you for the recommendation!', time: 'Monday', outgoing: false },
      { id: 'p2', text: 'Anytime. Let me know what you think.', time: 'Monday', outgoing: true },
    ],
  },
];

export type Status = { id: string; chatId: string; caption: string; color: string; time: string };
export const STATUSES: Status[] = [
  { id: 's1', chatId: 'maria', caption: 'A little sunshine goes a long way ☀️', color: '#A6C7A6', time: 'Today, 9:30 AM' },
  { id: 's2', chatId: 'alex', caption: 'Found a new favorite corner of the city.', color: '#9FBBD0', time: 'Today, 8:14 AM' },
  { id: 's3', chatId: 'priya', caption: 'Taking the scenic route home 🌸', color: '#D7AEC7', time: 'Yesterday, 6:20 PM' },
];

export type RecentCall = { id: string; chatId: string; time: string; type: 'voice' | 'video'; missed?: boolean };
export const RECENT_CALLS: RecentCall[] = [
  { id: 'c1', chatId: 'maria', time: 'Today, 11:02 AM', type: 'voice' },
  { id: 'c2', chatId: 'dad', time: 'Yesterday, 7:45 PM', type: 'video', missed: true },
  { id: 'c3', chatId: 'alex', time: 'Monday, 4:18 PM', type: 'voice' },
];

export function timeNow(): string {
  return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
