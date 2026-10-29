/** Fictional sample data for Townlist: areas, categories, listings, and message threads. */
import type { ImageSourcePropType } from 'react-native';

// ---------------------------------------------------------------- photos

export const PHOTOS = {
  bicycle: require('./assets/listings/bicycle.webp'),
  chairRoom: require('./assets/listings/chair-room.webp'),
  livingRoom: require('./assets/listings/living-room.webp'),
  apartment: require('./assets/listings/apartment.webp'),
  balcony: require('./assets/listings/balcony.webp'),
  desk: require('./assets/listings/desk.webp'),
  studio: require('./assets/listings/studio.webp'),
  cafe: require('./assets/listings/cafe.webp'),
} as const;
export type PhotoKey = keyof typeof PHOTOS;
export const PHOTO_KEYS = Object.keys(PHOTOS) as PhotoKey[];
export const PHOTO_LABELS: Record<PhotoKey, string> = {
  bicycle: 'Bicycle',
  chairRoom: 'Reading nook',
  livingRoom: 'Living room',
  apartment: 'Apartment',
  balcony: 'Balcony',
  desk: 'Desk',
  studio: 'Studio',
  cafe: 'Café',
};

/** A listing photo: a bundled asset key or an image URI picked by the user. */
export type Photo = { id: string; src: PhotoKey | string; caption?: string };
export const photoSource = (photo: Photo): ImageSourcePropType | string =>
  photo.src in PHOTOS ? PHOTOS[photo.src as PhotoKey] : photo.src;

// ---------------------------------------------------------------- areas

export type Region = { id: string; label: string };
export type City = { id: string; name: string; region: string; x: number; y: number; hoods: string[] };

export const REGIONS: Region[] = [
  { id: 'northwest', label: 'Northwest' },
  { id: 'west', label: 'West Coast' },
  { id: 'mountain', label: 'Mountain' },
  { id: 'midwest', label: 'Midwest' },
  { id: 'northeast', label: 'Northeast' },
  { id: 'south', label: 'South' },
];

/** Positions are in miles on a flat map, used to compute "nearby" distances. */
export const CITIES: City[] = [
  { id: 'alder-bay', name: 'alder bay', region: 'northwest', x: 0, y: 0, hoods: ['downtown', 'northside', 'midtown', 'west end', 'east village', 'riverside', 'harbor district', 'university hill'] },
  { id: 'millbrook', name: 'millbrook', region: 'northwest', x: 9, y: 8, hoods: ['old town', 'mill district', 'brookside'] },
  { id: 'cedar-point', name: 'cedar point', region: 'northwest', x: -14, y: 16, hoods: ['the point', 'lakeview', 'cedar heights'] },
  { id: 'fernwood', name: 'fernwood', region: 'northwest', x: 22, y: -19, hoods: ['fern hollow', 'station square', 'south fernwood'] },
  { id: 'granite-falls', name: 'granite falls', region: 'northwest', x: 46, y: 31, hoods: ['falls center', 'quarry hill'] },
  { id: 'port-juniper', name: 'port juniper', region: 'northwest', x: -58, y: 44, hoods: ['the docks', 'juniper park', 'eastport'] },
  { id: 'kestrel-island', name: 'kestrel island', region: 'northwest', x: -92, y: -12, hoods: ['ferry landing', 'north shore'] },
  { id: 'solana-vista', name: 'solana vista', region: 'west', x: 140, y: 690, hoods: ['mission flats', 'vista heights', 'seawall'] },
  { id: 'mesa-linda', name: 'mesa linda', region: 'west', x: 210, y: 760, hoods: ['arroyo', 'old mesa'] },
  { id: 'oak-hollow', name: 'oak hollow', region: 'west', x: 95, y: 540, hoods: ['hollow center', 'vineyard row'] },
  { id: 'bayview-heights', name: 'bayview heights', region: 'west', x: 60, y: 610, hoods: ['the heights', 'pier side'] },
  { id: 'ridgeway', name: 'ridgeway', region: 'mountain', x: 640, y: 420, hoods: ['upper ridge', 'canyon road'] },
  { id: 'silver-fork', name: 'silver fork', region: 'mountain', x: 720, y: 360, hoods: ['mine row', 'riverbend'] },
  { id: 'pinecrest', name: 'pinecrest', region: 'mountain', x: 590, y: 520, hoods: ['pine center', 'trailhead'] },
  { id: 'lakeport', name: 'lakeport', region: 'midwest', x: 1520, y: 300, hoods: ['lakefront', 'warehouse district', 'west lakeport'] },
  { id: 'prairie-junction', name: 'prairie junction', region: 'midwest', x: 1380, y: 420, hoods: ['the junction', 'grain row'] },
  { id: 'cobalt-creek', name: 'cobalt creek', region: 'midwest', x: 1460, y: 510, hoods: ['creekside', 'market square'] },
  { id: 'harborview', name: 'harborview', region: 'northeast', x: 2350, y: 210, hoods: ['wharf', 'beacon hill', 'south harbor'] },
  { id: 'elm-hollow', name: 'elm hollow', region: 'northeast', x: 2290, y: 260, hoods: ['the green', 'elm row'] },
  { id: 'stonebridge', name: 'stonebridge', region: 'northeast', x: 2240, y: 330, hoods: ['bridge street', 'mill pond'] },
  { id: 'magnolia-springs', name: 'magnolia springs', region: 'south', x: 1850, y: 980, hoods: ['the springs', 'old square'] },
  { id: 'bayou-cross', name: 'bayou cross', region: 'south', x: 1600, y: 1100, hoods: ['crossroads', 'bayou side'] },
  { id: 'red-clay', name: 'red clay', region: 'south', x: 1980, y: 900, hoods: ['clay hills', 'depot district'] },
];
export const HOME_CITY = 'alder-bay';
export const cityById = (id: string) => CITIES.find((city) => city.id === id) ?? CITIES[0];
export const distance = (a: City, b: City) => Math.round(Math.hypot(a.x - b.x, a.y - b.y));

// ---------------------------------------------------------------- categories

export type SectionId = 'sale' | 'housing' | 'jobs' | 'services' | 'community' | 'gigs';
export type Sub = { id: string; label: string };
export type Section = { id: SectionId; label: string; icon: string; blurb: string; subs: Sub[] };

const subs = (labels: string[]): Sub[] => labels.map((label) => ({ id: label.replace(/[^a-z0-9]+/g, '-'), label }));

export const SECTIONS: Section[] = [
  {
    id: 'sale',
    label: 'for sale',
    icon: 'shop',
    blurb: 'furniture, bikes, electronics',
    subs: subs(['antiques', 'appliances', 'arts+crafts', 'baby+kid', 'bikes', 'books', 'cars+trucks', 'cell phones', 'clothes+acc', 'computers', 'electronics', 'farm+garden', 'free stuff', 'furniture', 'general', 'household', 'musical instruments', 'photo+video', 'sporting', 'tools', 'toys+games']),
  },
  {
    id: 'housing',
    label: 'housing',
    icon: 'home',
    blurb: 'apartments, rooms, sublets',
    subs: subs(['apts/housing', 'rooms/shared', 'sublets/temporary', 'housing wanted', 'housing swap', 'vacation rentals', 'parking/storage', 'office/commercial', 'real estate for sale']),
  },
  {
    id: 'jobs',
    label: 'jobs',
    icon: 'package',
    blurb: 'full time, part time, local',
    subs: subs(['admin/office', 'art/media/design', 'customer service', 'education', 'food/bev/hosp', 'general labor', 'healthcare', 'retail/wholesale', 'sales', 'skilled trade', 'software/qa', 'transport']),
  },
  {
    id: 'services',
    label: 'services',
    icon: 'tuning',
    blurb: 'repairs, lessons, moving',
    subs: subs(['automotive', 'beauty', 'computer', 'creative', 'cycle', 'event', 'household', 'labor/move', 'lessons', 'pet', 'skilled trade', 'write/ed/translate']),
  },
  {
    id: 'community',
    label: 'community',
    icon: 'user',
    blurb: 'events, groups, lost+found',
    subs: subs(['activities', 'artists', 'childcare', 'classes', 'events', 'general', 'groups', 'lost+found', 'musicians', 'pets', 'rideshare', 'volunteers']),
  },
  {
    id: 'gigs',
    label: 'gigs',
    icon: 'bolt',
    blurb: 'short jobs, odd jobs',
    subs: subs(['computer', 'creative', 'crew', 'domestic', 'event', 'labor', 'talent', 'writing']),
  },
];
export const sectionById = (id: SectionId) => SECTIONS.find((section) => section.id === id) ?? SECTIONS[0];
export const subLabel = (section: SectionId, sub: string) =>
  sectionById(section).subs.find((item) => item.id === sub)?.label ?? sub;
export const sub = (label: string) => label.replace(/[^a-z0-9]+/g, '-');

// ---------------------------------------------------------------- post types

export type PostType = { id: string; label: string; hint: string; section: SectionId };
export const POST_TYPES: PostType[] = [
  { id: 'owner', label: 'for sale by owner', hint: "I'm selling something I own", section: 'sale' },
  { id: 'dealer', label: 'for sale by dealer', hint: "I'm a business selling goods", section: 'sale' },
  { id: 'wanted', label: 'wanted by owner', hint: "I'm looking to buy something", section: 'sale' },
  { id: 'housing', label: 'housing offered', hint: 'I have a place to rent, sublet, or share', section: 'housing' },
  { id: 'housing-wanted', label: 'housing wanted', hint: "I'm looking for a place", section: 'housing' },
  { id: 'job', label: 'job offered', hint: "I'm hiring for a position", section: 'jobs' },
  { id: 'gig', label: 'gig offered', hint: "I'm hiring for a short-term or odd job", section: 'gigs' },
  { id: 'service', label: 'service offered', hint: "I'm offering a service", section: 'services' },
  { id: 'community', label: 'community', hint: 'groups, lost+found, rideshare, and more', section: 'community' },
  { id: 'event', label: 'event / class', hint: "I'm promoting an event or class", section: 'community' },
];
export const postTypeById = (id: string) => POST_TYPES.find((type) => type.id === id) ?? POST_TYPES[0];

// ---------------------------------------------------------------- listings

export type Attr = { label: string; value: string };
export type Listing = {
  id: string;
  title: string;
  /** null when the post has no single price (jobs, events, wanted ads). */
  price: number | null;
  /** Shown after the price, such as "/mo" or "/hr". */
  per?: string;
  section: SectionId;
  sub: string;
  postType: string;
  cityId: string;
  hood: string;
  postedAt: number;
  updatedAt?: number;
  body: string;
  photos: Photo[];
  attrs: Attr[];
  seller: string;
  mine?: boolean;
};

const NOW = Date.now();
const MIN = 60_000;
const ago = (minutes: number) => NOW - minutes * MIN;
const pics = (id: string, ...keys: PhotoKey[]): Photo[] => keys.map((key, index) => ({ id: `${id}-${index}`, src: key }));

export const LISTINGS: Listing[] = [
  {
    id: '7801', title: 'Commuter bike, 54cm, new tires', price: 220, section: 'sale', sub: sub('bikes'), postType: 'owner',
    cityId: 'alder-bay', hood: 'downtown', postedAt: ago(38), seller: 'Alex',
    photos: pics('7801', 'bicycle'),
    attrs: [{ label: 'condition', value: 'excellent' }, { label: 'bicycle type', value: 'hybrid/comfort' }, { label: 'frame size', value: '54 cm' }, { label: 'make / manufacturer', value: 'Larkspur Cycles' }, { label: 'model name / number', value: 'Metro 7' }, { label: 'wheel size', value: '700C' }],
    body: 'Reliable city bike I rode to work for two years. New tires and brake pads last month, shifts cleanly through all 7 gears. Comfortable upright seat, rear rack included.\n\nFits riders about 5\'6" to 5\'11". Pickup near the downtown library. Cash or app payment.',
  },
  {
    id: '7802', title: 'Mid century lounge chair, fresh upholstery', price: 145, section: 'sale', sub: sub('furniture'), postType: 'owner',
    cityId: 'alder-bay', hood: 'northside', postedAt: ago(95), updatedAt: ago(20), seller: 'Morgan',
    photos: pics('7802', 'chairRoom', 'livingRoom'),
    attrs: [{ label: 'condition', value: 'good' }, { label: 'make / manufacturer', value: 'unknown' }, { label: 'size / dimensions', value: '30 x 32 x 31 in' }, { label: 'color', value: 'walnut / mustard' }],
    body: 'Solid wood lounge chair, reupholstered last year in a mustard wool blend. A few small marks on the arms, otherwise lovely and very comfortable for reading.\n\nI\'m on the second floor, you\'ll need to carry it down. No holds without a deposit.',
  },
  {
    id: '7803', title: 'Sunny 1BR near the park, in-unit laundry', price: 1350, per: '/mo', section: 'housing', sub: sub('apts/housing'), postType: 'housing',
    cityId: 'alder-bay', hood: 'midtown', postedAt: ago(140), seller: 'Dana',
    photos: pics('7803', 'apartment', 'balcony', 'livingRoom'),
    attrs: [{ label: 'bedrooms', value: '1BR / 1Ba' }, { label: 'size', value: '640 ft²' }, { label: 'available', value: 'nov 15' }, { label: 'laundry', value: 'w/d in unit' }, { label: 'parking', value: 'street parking' }, { label: 'pets', value: 'cats are OK - purrr' }],
    body: 'Bright corner one bedroom on the third floor with a small balcony facing the park. Hardwood floors, updated kitchen, washer and dryer in the unit.\n\nOne year lease, first month and deposit to move in. Water and trash included. Showings this weekend, message to pick a time.',
  },
  {
    id: '7804', title: '35mm film camera with two lenses', price: 310, section: 'sale', sub: sub('photo+video'), postType: 'owner',
    cityId: 'alder-bay', hood: 'west end', postedAt: ago(60 * 20), seller: 'Jamie',
    photos: pics('7804', 'studio'),
    attrs: [{ label: 'condition', value: 'like new' }, { label: 'make / manufacturer', value: 'Orrin Optics' }, { label: 'model name / number', value: 'OM-35 SLR' }],
    body: 'Well cared for 35mm SLR. Light meter works, shutter speeds sound right. Includes a 50mm f/1.8, a 28mm wide lens, strap, and a padded case.\n\nHappy to meet at a camera shop so you can test it.',
  },
  {
    id: '7805', title: 'Writing desk with two drawers', price: 85, section: 'sale', sub: sub('furniture'), postType: 'owner',
    cityId: 'alder-bay', hood: 'east village', postedAt: ago(60 * 26), seller: 'Riley',
    photos: pics('7805', 'desk', 'studio'),
    attrs: [{ label: 'condition', value: 'good' }, { label: 'size / dimensions', value: '42 x 22 x 30 in' }, { label: 'material', value: 'solid pine' }],
    body: 'Compact desk that fits a small bedroom office. Drawers slide smoothly. Light scratches on the top that you could sand out.',
  },
  {
    id: '7806', title: 'Part time café team member, mornings', price: null, section: 'jobs', sub: sub('food/bev/hosp'), postType: 'job',
    cityId: 'alder-bay', hood: 'downtown', postedAt: ago(60 * 30), seller: 'Little Corner Café',
    photos: pics('7806', 'cafe'),
    attrs: [{ label: 'compensation', value: '$18/hr plus tips' }, { label: 'employment type', value: 'part-time' }, { label: 'job title', value: 'barista / counter' }],
    body: 'Neighborhood café looking for a friendly teammate for weekday mornings, 6:30 to 11:30. Experience with espresso is a plus but we will train the right person.\n\nReply with a few lines about yourself and your availability.',
  },
  {
    id: '7807', title: 'Large monstera with ceramic pot', price: 45, section: 'sale', sub: sub('farm+garden'), postType: 'owner',
    cityId: 'alder-bay', hood: 'northside', postedAt: ago(60 * 44), seller: 'Taylor',
    photos: pics('7807', 'balcony'),
    attrs: [{ label: 'condition', value: 'excellent' }, { label: 'size / dimensions', value: 'about 4 ft tall' }],
    body: 'Healthy monstera with lots of new growth, moving and can\'t take it. Comes in the cream ceramic pot. Bring a car with room.',
  },
  {
    id: '7808', title: 'Private room in friendly shared house', price: 790, per: '/mo', section: 'housing', sub: sub('rooms/shared'), postType: 'housing',
    cityId: 'alder-bay', hood: 'riverside', postedAt: ago(60 * 50), seller: 'Casey',
    photos: pics('7808', 'livingRoom', 'apartment'),
    attrs: [{ label: 'bedrooms', value: '1 room / shared bath' }, { label: 'available', value: 'dec 1' }, { label: 'laundry', value: 'w/d in bldg' }, { label: 'housemates', value: '3' }],
    body: 'Furnished private room in a bright four bedroom house near the river trail. Utilities and internet included. We cook together sometimes and keep the shared spaces tidy.\n\nLooking for someone respectful who works or studies nearby.',
  },
  {
    id: '7809', title: 'Bike tune ups and flat repair, mobile', price: 35, section: 'services', sub: sub('cycle'), postType: 'service',
    cityId: 'alder-bay', hood: 'midtown', postedAt: ago(60 * 70), seller: 'Sam\'s Spokes',
    photos: pics('7809', 'bicycle'),
    attrs: [{ label: 'service type', value: 'cycle' }, { label: 'rate', value: 'tune up from $35' }],
    body: 'I come to you. Basic tune up (brakes, gears, chain, tire pressure) from $35. Flat repair $15 plus tube. Evenings and weekends.',
  },
  {
    id: '7810', title: 'Weekend neighborhood book swap', price: null, section: 'community', sub: sub('events'), postType: 'event',
    cityId: 'alder-bay', hood: 'riverside', postedAt: ago(60 * 75), seller: 'Riverside Reading Circle',
    photos: pics('7810', 'chairRoom'),
    attrs: [{ label: 'event date', value: 'saturday, 10am to noon' }, { label: 'cost', value: 'free' }],
    body: 'Bring a book, take a book, meet your neighbors. Coffee and cookies at the community table next to the boathouse. Kids\' books especially welcome.',
  },
  {
    id: '7811', title: 'Portable bluetooth speaker', price: 38, section: 'sale', sub: sub('electronics'), postType: 'owner',
    cityId: 'alder-bay', hood: 'downtown', postedAt: ago(60 * 98), seller: 'Chris',
    photos: [],
    attrs: [{ label: 'condition', value: 'good' }, { label: 'make / manufacturer', value: 'Tidewave' }, { label: 'model name / number', value: 'Pulse Mini' }],
    body: 'Compact speaker, about 10 hours of battery. Includes charging cable. Small scuff on the bottom.',
  },
  {
    id: '7812', title: 'Patient math tutoring, grades 6-12', price: 30, per: '/hr', section: 'services', sub: sub('lessons'), postType: 'service',
    cityId: 'alder-bay', hood: 'university hill', postedAt: ago(60 * 100), seller: 'Pat',
    photos: [],
    attrs: [{ label: 'service type', value: 'lessons & tutoring' }, { label: 'rate', value: '$30/hr' }],
    body: 'Former teacher offering patient, encouraging tutoring for middle and high school math through precalculus. In person at the library or online.',
  },
  {
    id: '7813', title: 'Free: moving boxes and packing paper', price: 0, section: 'sale', sub: sub('free stuff'), postType: 'owner',
    cityId: 'alder-bay', hood: 'harbor district', postedAt: ago(12), seller: 'Jordan',
    photos: [],
    attrs: [{ label: 'condition', value: 'good' }],
    body: 'About 30 boxes in mixed sizes plus a big bag of packing paper. On the porch, take what you need. I\'ll delete the post when they\'re gone.',
  },
  {
    id: '7814', title: 'Studio sublet, january to march', price: 1050, per: '/mo', section: 'housing', sub: sub('sublets/temporary'), postType: 'housing',
    cityId: 'alder-bay', hood: 'west end', postedAt: ago(60 * 5), seller: 'Noa',
    photos: pics('7814', 'studio', 'desk'),
    attrs: [{ label: 'bedrooms', value: 'studio / 1Ba' }, { label: 'size', value: '420 ft²' }, { label: 'available', value: 'jan 2' }, { label: 'furnished', value: 'yes' }],
    body: 'Fully furnished studio while I\'m away for work. Fast internet, a real desk, and a quiet street. Utilities included. Short interview over video.',
  },
  {
    id: '7815', title: 'Graphic designer for a menu refresh', price: null, section: 'gigs', sub: sub('creative'), postType: 'gig',
    cityId: 'alder-bay', hood: 'east village', postedAt: ago(60 * 7), seller: 'Harbor Noodle Co.',
    photos: [],
    attrs: [{ label: 'compensation', value: '$400 flat' }, { label: 'gig type', value: 'paid' }],
    body: 'Small restaurant needs a cleaner, more readable menu (two pages, print and web). Please include a link to past work. Two week timeline.',
  },
  {
    id: '7816', title: 'Help moving a couch up two flights', price: null, section: 'gigs', sub: sub('labor'), postType: 'gig',
    cityId: 'alder-bay', hood: 'midtown', postedAt: ago(60 * 3), seller: 'Elliot',
    photos: [],
    attrs: [{ label: 'compensation', value: '$60 for about an hour' }, { label: 'gig type', value: 'paid' }],
    body: 'Need two strong people Sunday morning to bring a couch up to a third floor walkup. Should take under an hour.',
  },
  {
    id: '7817', title: 'Found: grey cat with a blue collar', price: null, section: 'community', sub: sub('lost+found'), postType: 'community',
    cityId: 'alder-bay', hood: 'northside', postedAt: ago(60 * 9), seller: 'Neighbor on Fir St',
    photos: [],
    attrs: [],
    body: 'Friendly grey cat with a blue collar (no tag) hanging around Fir and 9th since Tuesday. Describe a distinguishing mark and I\'ll send a photo.',
  },
  {
    id: '7818', title: 'Front desk coordinator, dental office', price: null, section: 'jobs', sub: sub('admin/office'), postType: 'job',
    cityId: 'alder-bay', hood: 'harbor district', postedAt: ago(60 * 52), seller: 'Harborside Dental',
    photos: [],
    attrs: [{ label: 'compensation', value: '$22 to $25/hr' }, { label: 'employment type', value: 'full-time' }, { label: 'benefits', value: 'health, dental, PTO' }],
    body: 'Busy family practice hiring a friendly, organized front desk coordinator. Scheduling, check-in, and phones. Monday to Thursday.',
  },
  {
    id: '7819', title: 'Upright piano, you move', price: 0, section: 'sale', sub: sub('musical instruments'), postType: 'owner',
    cityId: 'alder-bay', hood: 'university hill', postedAt: ago(60 * 120), seller: 'Robin',
    photos: [],
    attrs: [{ label: 'condition', value: 'fair' }, { label: 'make / manufacturer', value: 'Hallett & Sons' }],
    body: 'Free upright piano, needs tuning. Ground floor, two steps to the driveway. You must bring movers.',
  },
  {
    id: '7820', title: 'Mesh office chair, adjustable arms', price: 60, section: 'sale', sub: sub('furniture'), postType: 'dealer',
    cityId: 'alder-bay', hood: 'downtown', postedAt: ago(60 * 140), seller: 'Second Shift Office Supply',
    photos: pics('7820', 'desk'),
    attrs: [{ label: 'condition', value: 'excellent' }, { label: 'make / manufacturer', value: 'Fulcrum' }, { label: 'model name / number', value: 'Task 200' }, { label: 'quantity', value: '12 available' }],
    body: 'Refurbished office chairs from a downtown office move. Adjustable height, arms, and tilt. Showroom open weekdays 10 to 5.',
  },
  // nearby areas
  {
    id: '7821', title: 'Two bedroom townhouse with garage', price: 1780, per: '/mo', section: 'housing', sub: sub('apts/housing'), postType: 'housing',
    cityId: 'millbrook', hood: 'old town', postedAt: ago(60 * 4), seller: 'Brookside Property Co.',
    photos: pics('7821', 'livingRoom', 'balcony'),
    attrs: [{ label: 'bedrooms', value: '2BR / 1.5Ba' }, { label: 'size', value: '1,050 ft²' }, { label: 'available', value: 'now' }, { label: 'parking', value: 'attached garage' }, { label: 'pets', value: 'dogs are OK - wooof' }],
    body: 'End unit townhouse with an attached garage and small yard. Dishwasher, gas range, washer/dryer hookups. Walk to the old town shops.',
  },
  {
    id: '7822', title: 'Kids balance bike', price: 25, section: 'sale', sub: sub('baby+kid'), postType: 'owner',
    cityId: 'millbrook', hood: 'brookside', postedAt: ago(60 * 15), seller: 'Lee',
    photos: pics('7822', 'bicycle'),
    attrs: [{ label: 'condition', value: 'good' }, { label: 'size / dimensions', value: '12 in wheels' }],
    body: 'Outgrown balance bike. Adjustable seat. Some stickers on the frame.',
  },
  {
    id: '7823', title: 'Cozy cabin weekend rental by the lake', price: 140, per: '/night', section: 'housing', sub: sub('vacation rentals'), postType: 'housing',
    cityId: 'cedar-point', hood: 'lakeview', postedAt: ago(60 * 33), seller: 'Marisol',
    photos: pics('7823', 'balcony', 'chairRoom'),
    attrs: [{ label: 'bedrooms', value: '2BR / 1Ba' }, { label: 'sleeps', value: '4' }],
    body: 'Quiet cabin with a deck facing the water. Two night minimum. Kayaks available. No parties.',
  },
  {
    id: '7824', title: 'Line cook, evenings', price: null, section: 'jobs', sub: sub('food/bev/hosp'), postType: 'job',
    cityId: 'cedar-point', hood: 'the point', postedAt: ago(60 * 61), seller: 'Point Tavern',
    photos: pics('7824', 'cafe'),
    attrs: [{ label: 'compensation', value: '$21/hr + shared tips' }, { label: 'employment type', value: 'full-time' }],
    body: 'Scratch kitchen hiring an evening line cook. One year of experience preferred. Family meal every shift.',
  },
  {
    id: '7825', title: 'Handyman: shelves, doors, small repairs', price: 55, per: '/hr', section: 'services', sub: sub('skilled trade'), postType: 'service',
    cityId: 'fernwood', hood: 'station square', postedAt: ago(60 * 80), seller: 'Fernwood Fixit',
    photos: [],
    attrs: [{ label: 'service type', value: 'skilled trade' }, { label: 'rate', value: '$55/hr, 1 hr minimum' }, { label: 'license', value: 'insured' }],
    body: 'Hanging shelves and TVs, sticky doors, drywall patches, furniture assembly. Reliable and tidy. Free estimates.',
  },
  {
    id: '7826', title: 'Community garden plots open for spring', price: null, section: 'community', sub: sub('groups'), postType: 'community',
    cityId: 'millbrook', hood: 'mill district', postedAt: ago(60 * 90), seller: 'Mill District Gardeners',
    photos: pics('7826', 'balcony'),
    attrs: [{ label: 'cost', value: '$20/season' }],
    body: 'We have six 10x10 plots open at the mill district garden. Water and tools included. Join our info session next Thursday.',
  },
  {
    id: '7827', title: 'Vintage record player, works great', price: 120, section: 'sale', sub: sub('electronics'), postType: 'owner',
    cityId: 'granite-falls', hood: 'falls center', postedAt: ago(60 * 110), seller: 'Quinn',
    photos: [],
    attrs: [{ label: 'condition', value: 'good' }, { label: 'make / manufacturer', value: 'Soundcraft Home' }],
    body: 'Belt drive turntable with built-in speakers. New belt and needle. Plays 33 and 45.',
  },
  // farther away
  {
    id: '7828', title: 'Surfboard, 8 ft funboard', price: 260, section: 'sale', sub: sub('sporting'), postType: 'owner',
    cityId: 'solana-vista', hood: 'seawall', postedAt: ago(60 * 6), seller: 'Kai',
    photos: [],
    attrs: [{ label: 'condition', value: 'good' }, { label: 'size / dimensions', value: "8'0\"" }],
    body: 'Great beginner board, a couple of repaired dings. Fins and leash included.',
  },
  {
    id: '7829', title: 'Loft apartment in the warehouse district', price: 1600, per: '/mo', section: 'housing', sub: sub('apts/housing'), postType: 'housing',
    cityId: 'lakeport', hood: 'warehouse district', postedAt: ago(60 * 18), seller: 'Lakeport Lofts',
    photos: pics('7829', 'studio', 'apartment'),
    attrs: [{ label: 'bedrooms', value: '1BR / 1Ba' }, { label: 'size', value: '900 ft²' }, { label: 'available', value: 'dec 1' }],
    body: 'Open loft with 14 ft ceilings and big windows. Brick walls, concrete floors, rooftop deck.',
  },
  // your own posts
  {
    id: '7830', title: 'Oak bookshelf, five shelves', price: 70, section: 'sale', sub: sub('furniture'), postType: 'owner',
    cityId: 'alder-bay', hood: 'east village', postedAt: ago(60 * 28), seller: 'You', mine: true,
    photos: pics('7830', 'livingRoom'),
    attrs: [{ label: 'condition', value: 'good' }, { label: 'size / dimensions', value: '36 x 12 x 72 in' }],
    body: 'Sturdy oak bookshelf. Comes apart into two pieces for moving. Smoke free home.',
  },
  {
    id: '7831', title: 'Sit-on-top kayak with paddle', price: 300, section: 'sale', sub: sub('sporting'), postType: 'owner',
    cityId: 'alder-bay', hood: 'east village', postedAt: ago(60 * 46), seller: 'You', mine: true,
    photos: [],
    attrs: [{ label: 'condition', value: 'excellent' }, { label: 'size / dimensions', value: '10 ft' }],
    body: 'Stable recreational kayak, used a handful of times on the bay. Paddle and dry bag included.',
  },
];

// ---------------------------------------------------------------- messages

export type Message = { id: string; from: 'me' | 'them'; text: string; at: number };
export type Thread = {
  id: string;
  listingId: string;
  /** The other person in the conversation. */
  name: string;
  role: 'buying' | 'selling';
  unread: number;
  messages: Message[];
};

const msgs = (id: string, items: [Message['from'], string, number][]): Message[] =>
  items.map(([from, text, minutesAgo], index) => ({ id: `${id}-${index}`, from, text, at: ago(minutesAgo) }));

export const THREADS: Thread[] = [
  {
    id: 't1', listingId: '7802', name: 'Morgan', role: 'buying', unread: 1,
    messages: msgs('t1', [
      ['me', 'Hi! Is the lounge chair still available?', 80],
      ['them', 'Yes it is. Are you able to pick up this week?', 62],
      ['me', 'I could come Saturday morning. Would you take $125?', 55],
      ['them', 'I can do $135 if you can get it down the stairs yourself. Saturday at 10 works.', 18],
    ]),
  },
  {
    id: 't2', listingId: '7830', name: 'Priya', role: 'selling', unread: 2,
    messages: msgs('t2', [
      ['them', 'Hello, how deep are the shelves? Trying to fit oversized art books.', 300],
      ['me', 'Hi Priya, they are 11.5 inches deep inside.', 260],
      ['them', 'Perfect. Could I see it tomorrow after 5?', 40],
      ['them', 'Also, does it come apart? I have a hatchback.', 39],
    ]),
  },
  {
    id: 't3', listingId: '7803', name: 'Dana', role: 'buying', unread: 0,
    messages: msgs('t3', [
      ['me', 'Hi Dana, I\'m interested in the 1BR. Are you showing it this weekend?', 60 * 26],
      ['them', 'Hi! Showings are Saturday 1 to 3 and Sunday 11 to 1. Which works?', 60 * 24],
      ['me', 'Sunday at 11:30 please. Is a cat OK?', 60 * 23],
      ['them', 'Cats are fine with a $200 pet deposit. See you Sunday, unit 3C, buzz the front door.', 60 * 22],
      ['me', 'Great, see you then.', 60 * 22 - 5],
    ]),
  },
  {
    id: 't4', listingId: '7831', name: 'Wes', role: 'selling', unread: 0,
    messages: msgs('t4', [
      ['them', 'would u take 150 for the kayak', 60 * 40],
      ['me', 'Thanks for the offer, but I\'m firm at $300. It includes the paddle and dry bag.', 60 * 39],
      ['them', 'ok 200 cash today?', 60 * 39 - 10],
      ['me', 'I\'ll pass for now, but I\'ll let you know if it doesn\'t sell.', 60 * 38],
    ]),
  },
  {
    id: 't5', listingId: '7806', name: 'Little Corner Café', role: 'buying', unread: 0,
    messages: msgs('t5', [
      ['me', 'Hi, I have two years of barista experience and I\'m free weekday mornings. Happy to send a resume.', 60 * 28],
      ['them', 'Thanks for reaching out! Could you come by Thursday at 2 for a quick chat and a trial shot?', 60 * 27],
      ['me', 'Thursday at 2 works. See you then!', 60 * 27 - 15],
    ]),
  },
  {
    id: 't6', listingId: '7809', name: "Sam's Spokes", role: 'buying', unread: 0,
    messages: msgs('t6', [
      ['me', 'Do you have time for a tune up on Wednesday evening? Downtown.', 60 * 70],
      ['them', 'Wednesday after 6 works. Send me the cross streets and I\'ll text when I\'m close.', 60 * 69],
    ]),
  },
];

// ---------------------------------------------------------------- formatting

export const money = (value: number) => (value === 0 ? 'free' : '$' + value.toLocaleString('en-US'));
export const priceText = (listing: Pick<Listing, 'price' | 'per'>) =>
  listing.price === null ? '' : money(listing.price) + (listing.price > 0 && listing.per ? listing.per : '');

export function ageText(at: number, now = Date.now()) {
  const minutes = Math.max(0, Math.round((now - at) / MIN));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
export function dateText(at: number) {
  const date = new Date(at);
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${hours % 12 || 12}:${minutes}${hours < 12 ? 'am' : 'pm'}`;
}

export function clockText(at: number, now = Date.now()) {
  const date = new Date(at);
  const sameDay = new Date(now).toDateString() === date.toDateString();
  if (sameDay) {
    const hours = date.getHours();
    return `${hours % 12 || 12}:${String(date.getMinutes()).padStart(2, '0')} ${hours < 12 ? 'am' : 'pm'}`;
  }
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}
