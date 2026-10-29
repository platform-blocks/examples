import { useMemo, useState, type ReactNode } from 'react';
import { useWindowDimensions } from 'react-native';
import {
  Badge,
  Block,
  Button,
  Checkbox,
  Chip,
  FileInput,
  Icon,
  IconButton,
  Image,
  Input,
  Select,
  Stepper,
  Text,
  TextArea,
  useToast,
} from '@plocks/ui';
import type { FileInputFile } from '@plocks/ui';
import { C } from '../theme';
import {
  CITIES,
  PHOTO_KEYS,
  PHOTO_LABELS,
  PHOTOS,
  POST_TYPES,
  REGIONS,
  cityById,
  photoSource,
  postTypeById,
  sectionById,
  subLabel,
  type Attr,
  type Listing,
  type Photo,
  type SectionId,
} from '../data';
import { useStore } from '../store';
import { MapBlock, Screen, SectionLabel, useWide } from '../components';
import { ListingBody } from './ListingView';

const STEPS = ['type', 'category', 'area', 'details', 'images', 'review'];
const MAX_PHOTOS = 12;

type Field = { key: string; label: string; options?: string[]; placeholder?: string; required?: boolean; numeric?: boolean };
type Toggle = { key: string; label: string };
type Spec = { price?: { label: string; per?: string; required: boolean }; fields: Field[]; toggles: Toggle[] };

const CONDITIONS = ['new', 'like new', 'excellent', 'good', 'fair', 'salvage'];

/** Category-specific form fields, like the real posting form. */
function specFor(typeId: string, section: SectionId, sub: string): Spec {
  switch (section) {
    case 'sale': {
      const wanted = typeId === 'wanted';
      const free = sub === 'free-stuff';
      const fields: Field[] = [
        { key: 'condition', label: 'condition', options: CONDITIONS, required: !wanted },
        { key: 'make', label: 'make / manufacturer', placeholder: 'e.g. Larkspur' },
        { key: 'model', label: 'model name / number', placeholder: 'e.g. Metro 7' },
        { key: 'size', label: 'size / dimensions', placeholder: 'e.g. 30 x 32 in' },
      ];
      if (sub === 'bikes') {
        fields.push(
          { key: 'bicycle type', label: 'bicycle type', options: ['road', 'mountain', 'hybrid/comfort', 'cargo', 'kids', 'electric', 'other'] },
          { key: 'frame size', label: 'frame size', placeholder: 'e.g. 54 cm' },
        );
      }
      if (sub === 'cars-trucks') {
        fields.push(
          { key: 'model year', label: 'model year', placeholder: 'e.g. 2016', numeric: true, required: true },
          { key: 'odometer', label: 'odometer', placeholder: 'miles', numeric: true, required: true },
        );
      }
      return {
        price: free ? undefined : { label: wanted ? 'max price' : 'price', required: !wanted },
        fields,
        toggles: [
          { key: 'cash only', label: 'cash only' },
          { key: 'delivery available', label: 'delivery available' },
          ...(typeId === 'dealer' ? [{ key: 'warranty', label: 'includes warranty' }] : []),
        ],
      };
    }
    case 'housing': {
      const wanted = typeId === 'housing-wanted' || sub === 'housing-wanted';
      const per = sub === 'vacation-rentals' ? '/night' : sub === 'real-estate-for-sale' ? undefined : '/mo';
      return {
        price: { label: wanted ? 'max budget' : sub === 'real-estate-for-sale' ? 'asking price' : 'rent', per, required: !wanted },
        fields: [
          { key: 'bedrooms', label: 'bedrooms', options: ['studio', '1BR', '2BR', '3BR', '4BR+', 'room'], required: true },
          { key: 'bathrooms', label: 'bathrooms', options: ['shared', '1', '1.5', '2', '2.5', '3+'] },
          { key: 'size', label: 'size (ft²)', placeholder: 'e.g. 640', numeric: true },
          { key: 'available', label: 'available on', placeholder: 'e.g. dec 1' },
          { key: 'laundry', label: 'laundry', options: ['w/d in unit', 'w/d hookups', 'laundry in bldg', 'laundry on site', 'no laundry on site'] },
          { key: 'parking', label: 'parking', options: ['attached garage', 'detached garage', 'carport', 'off-street parking', 'street parking', 'no parking'] },
        ],
        toggles: [
          { key: 'cats are OK', label: 'cats are OK - purrr' },
          { key: 'dogs are OK', label: 'dogs are OK - wooof' },
          { key: 'furnished', label: 'furnished' },
          { key: 'no smoking', label: 'no smoking' },
        ],
      };
    }
    case 'jobs':
      return {
        fields: [
          { key: 'compensation', label: 'compensation', placeholder: 'e.g. $18/hr plus tips', required: true },
          { key: 'employment type', label: 'employment type', options: ['full-time', 'part-time', 'contract', 'employee’s choice'], required: true },
          { key: 'job title', label: 'job title', placeholder: 'e.g. barista' },
          { key: 'company', label: 'company name', placeholder: 'optional' },
        ],
        toggles: [
          { key: 'remote', label: 'remote OK' },
          { key: 'internship', label: 'internship' },
          { key: 'non-profit', label: 'non-profit organization' },
        ],
      };
    case 'gigs':
      return {
        fields: [
          { key: 'gig type', label: 'pay', options: ['paid', 'unpaid'], required: true },
          { key: 'compensation', label: 'compensation', placeholder: 'e.g. $60 for an hour' },
        ],
        toggles: [{ key: 'same day', label: 'needed today' }],
      };
    case 'services':
      return {
        price: { label: 'starting rate', per: '/hr', required: false },
        fields: [
          { key: 'rate', label: 'rate details', placeholder: 'e.g. tune up from $35' },
          { key: 'service area', label: 'service area', placeholder: 'e.g. all of alder bay' },
        ],
        toggles: [
          { key: 'licensed', label: 'licensed' },
          { key: 'insured', label: 'insured' },
        ],
      };
    default:
      return {
        fields:
          typeId === 'event'
            ? [
                { key: 'event date', label: 'event date and time', placeholder: 'e.g. saturday, 10am to noon', required: true },
                { key: 'cost', label: 'cost', placeholder: 'e.g. free' },
              ]
            : [],
        toggles: typeId === 'event' ? [{ key: 'kid friendly', label: 'kid friendly' }] : [],
      };
  }
}

type Draft = {
  type?: string;
  sub?: string;
  cityId: string;
  hood?: string;
  postal: string;
  title: string;
  price: string;
  body: string;
  fields: Record<string, string>;
  toggles: Record<string, boolean>;
  photos: Photo[];
  showPhone: boolean;
};

function Choice({
  label,
  hint,
  selected,
  onPress,
  right,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  onPress: () => void;
  right?: ReactNode;
}) {
  return (
    <Block
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      direction="row"
      align="center"
      gap={12}
      py={10}
      px={12}
      bg={selected ? C.tint : C.white}
      borderBottomWidth={1}
      borderBottomColor={C.line}
      pressedStyle={{ opacity: 0.7 }}
    >
      <Block gap={0} w={18} h={18} radius={9} borderWidth={selected ? 5 : 1.5} borderColor={selected ? C.purple : C.lineStrong} bg={C.white} />
      <Block flex={1} miw={0} gap={1}>
        <Text c={selected ? C.purple : C.link} fw="semibold" size={15}>
          {label}
        </Text>
        {!!hint && (
          <Text c={C.muted} size={12}>
            {hint}
          </Text>
        )}
      </Block>
      {right}
    </Block>
  );
}

function Label({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <Text c={C.ink} fw="semibold" size={13} lh={18} mb={4}>
      {children}
      {required ? (
        <Text c={C.red} size={13} lh={18}>
          {' '}*
        </Text>
      ) : null}
    </Text>
  );
}

function newDraft(cityId: string): Draft {
  return { cityId, postal: '', title: '', price: '', body: '', fields: {}, toggles: {}, photos: [], showPhone: false };
}

export function Post() {
  const store = useStore();
  const toast = useToast();
  const wide = useWide();
  const { width } = useWindowDimensions();
  const tileW = wide ? 168 : Math.max(104, Math.floor((Math.min(width, 760) - 28 - 20) / 3));
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => newDraft(store.cityId));
  const [published, setPublished] = useState<string | null>(null);
  /** Picked files by photo id, so FileInput can be driven from the photo list. */
  const [files, setFiles] = useState<Record<string, FileInputFile>>({});
  const set = (patch: Partial<Draft>) => setDraft((old) => ({ ...old, ...patch }));

  const type = draft.type ? postTypeById(draft.type) : undefined;
  const section = type ? sectionById(type.section) : undefined;
  const city = cityById(draft.cityId);
  const spec = useMemo(() => (type && draft.sub ? specFor(type.id, type.section, draft.sub) : undefined), [type, draft.sub]);

  const missing: string[] = [];
  if (step >= 3 && spec) {
    if (!draft.title.trim()) missing.push('posting title');
    if (spec.price?.required && !draft.price.trim()) missing.push(spec.price.label);
    if (draft.body.trim().length < 10) missing.push('description');
    for (const field of spec.fields) if (field.required && !draft.fields[field.key]?.trim()) missing.push(field.label);
  }
  const canContinue = [!!type, !!draft.sub, !!draft.hood, missing.length === 0, true, true][step];

  const listing: Listing | undefined =
    type && draft.sub && spec
      ? {
          id: published ?? 'preview',
          title: draft.title.trim() || 'your posting title',
          price: draft.price.trim() ? Number(draft.price) : type.section === 'sale' && draft.sub === 'free-stuff' ? 0 : null,
          per: spec.price?.per,
          section: type.section,
          sub: draft.sub,
          postType: type.id,
          cityId: draft.cityId,
          hood: draft.hood ?? city.hoods[0],
          postedAt: Date.now(),
          body: draft.body.trim() || 'Your description will appear here.',
          photos: draft.photos,
          attrs: [
            ...spec.fields
              .filter((field) => draft.fields[field.key]?.trim())
              .map((field): Attr => ({ label: field.key, value: draft.fields[field.key].trim() })),
            ...spec.toggles.filter((toggle) => draft.toggles[toggle.key]).map((toggle): Attr => ({ label: toggle.label, value: 'yes' })),
          ],
          seller: 'You',
          mine: true,
        }
      : undefined;

  const addPhotos = (photos: Photo[]) => {
    setDraft((old) => {
      const room = MAX_PHOTOS - old.photos.length;
      if (photos.length > room) toast.show({ title: `Up to ${MAX_PHOTOS} images`, message: 'Remove one to add more.', autoHide: 2200 });
      return { ...old, photos: [...old.photos, ...photos.slice(0, Math.max(0, room))] };
    });
  };
  const fileValue = draft.photos.filter((photo) => files[photo.id]).map((photo) => files[photo.id]);
  const sampleCount = draft.photos.length - fileValue.length;
  const onFiles = (next: FileInputFile[]) => {
    const known = new Set(draft.photos.map((photo) => photo.id));
    const added = next.filter((file) => !known.has(file.id) && !file.error && (file.previewUrl || file.uri));
    const bad = next.filter((file) => file.error && !files[file.id]);
    if (bad.length) toast.show({ title: 'Some files were skipped', message: bad[0].error, autoHide: 2600 });
    setFiles((old) => ({ ...old, ...Object.fromEntries(next.map((file) => [file.id, file])) }));
    const kept = new Set(next.map((file) => file.id));
    const dropped = fileValue.filter((file) => !kept.has(file.id)).map((file) => file.id);
    if (dropped.length) setDraft((old) => ({ ...old, photos: old.photos.filter((photo) => !dropped.includes(photo.id)) }));
    if (added.length) addPhotos(added.map((file) => ({ id: file.id, src: (file.previewUrl || file.uri) as string, caption: file.name })));
  };
  const move = (index: number, delta: number) =>
    setDraft((old) => {
      const photos = [...old.photos];
      const target = index + delta;
      if (target < 0 || target >= photos.length) return old;
      [photos[index], photos[target]] = [photos[target], photos[index]];
      return { ...old, photos };
    });
  const remove = (id: string) => setDraft((old) => ({ ...old, photos: old.photos.filter((photo) => photo.id !== id) }));

  const publish = () => {
    if (!listing) return;
    const id = String(8000 + Math.floor(Math.random() * 1900));
    store.publish({ ...listing, id, postedAt: Date.now() });
    setPublished(id);
  };
  const reset = () => {
    setFiles({});
    setDraft(newDraft(store.cityId));
    setStep(0);
    setPublished(null);
  };

  if (published) {
    return (
      <Screen title="posting published" maw={620}>
        <Block gap={12} align="center" py={36}>
          <Block gap={0} w={64} h={64} radius={32} bg={C.greenPale} align="center" justify="center">
            <Icon name="check" color={C.green} size={32} />
          </Block>
          <Text c={C.ink} fw="bold" size={20} ta="center">
            Your posting is live
          </Text>
          <Text c={C.muted} size={14} ta="center" lh={20}>
            “{listing?.title}” is now in {subLabel(listing!.section, listing!.sub)} for {city.name}. Post id {published}.
          </Text>
          <Block gap={8} direction="row" mt={8} wrap justify="center">
            <Button title="view posting" color={C.purple} onPress={() => store.openIn('browse', { name: 'listing', id: published })} />
            <Button title="post another" variant="outline" color={C.purple} onPress={reset} />
          </Block>
        </Block>
      </Screen>
    );
  }

  const footer = (
    <Block gap={10} direction="row" align="center" justify="center" px={14} py={10} borderTopWidth={1} borderTopColor={C.line} bg={C.white}>
      <Block gap={10} direction="row" align="center" w="100%" maw={760}>
        <Button title="back" variant="outline" color={C.purple} disabled={step === 0} onPress={() => setStep(step - 1)} />
        <Text c={C.muted} size={12} flex={1} ta="center" numberOfLines={1}>
          {step === 3 && missing.length ? `needed: ${missing.join(', ')}` : `step ${step + 1} of ${STEPS.length}`}
        </Text>
        {step < STEPS.length - 1 ? (
          <Button title={step === 4 && !draft.photos.length ? 'skip images' : 'continue'} color={C.purple} disabled={!canContinue} onPress={() => setStep(step + 1)} />
        ) : (
          <Button title="publish" color={C.green} startSection={<Icon name="check" color={C.white} size={16} />} onPress={publish} />
        )}
      </Block>
    </Block>
  );

  const crumbs = [type?.label, draft.sub && type ? subLabel(type.section, draft.sub) : undefined, draft.hood ? `${draft.hood}, ${city.name}` : undefined].filter(Boolean);

  return (
    <Screen title="create a posting" subtitle={crumbs.length ? crumbs.join(' › ') : `posting to ${city.name}`} maw={760} footer={footer}>
      <Block gap={0} py={6} mb={10}>
        <Stepper
          active={step}
          onStepClick={(index) => index < step && setStep(index)}
          compact={!wide}
          size={wide ? 'sm' : 'xs'}
          color={C.purple}
          aria-label="Posting steps"
        >
          {STEPS.map((label) => (
            <Stepper.Step key={label} label={label} />
          ))}
        </Stepper>
      </Block>

      {step === 0 && (
        <>
          <Text c={C.ink} fw="bold" size={18}>
            what type of posting is this?
          </Text>
          <Text c={C.muted} size={13} mb={10}>
            choose the option that fits best
          </Text>
          <Block gap={0} borderWidth={1} borderColor={C.line} radius={6} overflow="hidden">
            {POST_TYPES.map((item) => (
              <Choice
                key={item.id}
                label={item.label}
                hint={item.hint}
                selected={draft.type === item.id}
                onPress={() => set({ type: item.id, sub: item.section === type?.section ? draft.sub : undefined, fields: {}, toggles: {} })}
                right={<Text c={C.faint} size={11}>{sectionById(item.section).label}</Text>}
              />
            ))}
          </Block>
        </>
      )}

      {step === 1 && section && (
        <>
          <Text c={C.ink} fw="bold" size={18}>
            choose a category
          </Text>
          <Text c={C.muted} size={13} mb={10}>
            {type?.label} · {section.label}
          </Text>
          <Block gap={0} direction="row" wrap borderWidth={1} borderColor={C.line} radius={6} overflow="hidden">
            {section.subs.map((item) => (
              <Block key={item.id} gap={0} w={wide ? '50%' : '100%'}>
                <Choice
                  label={item.label}
                  selected={draft.sub === item.id}
                  onPress={() => set({ sub: item.id, fields: {}, toggles: {}, price: item.id === 'free-stuff' ? '' : draft.price })}
                />
              </Block>
            ))}
          </Block>
        </>
      )}

      {step === 2 && (
        <>
          <Text c={C.ink} fw="bold" size={18}>
            where is this located?
          </Text>
          <Text c={C.muted} size={13} mb={12}>
            pick the area and neighborhood buyers will see
          </Text>
          <Label required>area</Label>
          <Select
            searchable
            options={REGIONS.flatMap((region) =>
              CITIES.filter((item) => item.region === region.id).map((item) => ({ label: item.name, value: item.id, description: region.label })),
            )}
            value={draft.cityId}
            onChange={(value) => value && set({ cityId: value, hood: undefined })}
            placeholder="choose an area"
            searchPlaceholder="search areas"
            mb={14}
            radius={6}
            accessibilityLabel="Area"
          />
          <Label required>neighborhood</Label>
          <Block gap={6} direction="row" wrap mb={14}>
            {city.hoods.map((hood) => (
              <Chip key={hood} size="sm" variant={draft.hood === hood ? 'filled' : 'outline'} color={C.purple} onPress={() => set({ hood })}>
                {hood}
              </Chip>
            ))}
          </Block>
          <Label>postal code</Label>
          <Input
            variant="outline"
            value={draft.postal}
            onChangeText={(postal) => set({ postal: postal.replace(/[^0-9]/g, '').slice(0, 5) })}
            placeholder="optional"
            keyboardType="number-pad"
            mb={14}
            w={160}
            radius={6}
            accessibilityLabel="Postal code"
          />
          {draft.hood && <MapBlock hood={draft.hood} cityId={draft.cityId} h={150} />}
        </>
      )}

      {step === 3 && spec && type && (
        <Block gap={14}>
          <Block gap={0}>
            <Text c={C.ink} fw="bold" size={18}>
              posting details
            </Text>
            <Text c={C.muted} size={13}>
              {type.label} › {subLabel(type.section, draft.sub!)}
            </Text>
          </Block>
          <Block gap={10} direction={wide ? 'row' : 'column'}>
            <Block gap={0} flex={wide ? 1 : undefined}>
              <Label required>posting title</Label>
              <Input variant="outline" value={draft.title} onChangeText={(title) => set({ title })} placeholder="e.g. commuter bike, 54cm" maxLength={70} mb={0} radius={6} accessibilityLabel="Posting title" />
            </Block>
            {spec.price && (
              <Block gap={0} w={wide ? 170 : undefined}>
                <Label required={spec.price.required}>
                  {spec.price.label}
                  {spec.price.per ? ` (${spec.price.per.slice(1)})` : ''}
                </Label>
                <Input
                  variant="outline"
                  value={draft.price}
                  onChangeText={(price) => set({ price: price.replace(/[^0-9]/g, '') })}
                  placeholder="0"
                  keyboardType="number-pad"
                  startSection={<Text c={C.muted}>$</Text>}
                  mb={0}
                  radius={6}
                  accessibilityLabel={spec.price.label}
                />
              </Block>
            )}
          </Block>
          <Block gap={0}>
            <Label required>description</Label>
            <TextArea variant="outline" value={draft.body} onChangeText={(body) => set({ body })} placeholder="Describe what you're posting. Leave a blank line between paragraphs." rows={6} mb={0} radius={6} accessibilityLabel="Description" />
            <Text c={C.faint} size={11} mt={4}>
              {draft.body.length} characters
            </Text>
          </Block>
          {spec.fields.length > 0 && (
            <>
              <SectionLabel mt={4}>{section?.label} details</SectionLabel>
              <Block gap={0} direction="row" wrap justify="space-between">
                {spec.fields.map((field) => (
                  <Block key={field.key} gap={0} w={wide ? '49%' : '100%'} pb={12}>
                    <Label required={field.required}>{field.label}</Label>
                    {field.options ? (
                      <Select
                        options={field.options.map((option) => ({ label: option, value: option }))}
                        value={draft.fields[field.key] ?? null}
                        onChange={(value) => set({ fields: { ...draft.fields, [field.key]: value ?? '' } })}
                        placeholder="-"
                        clearable={!field.required}
                        radius={6}
                        accessibilityLabel={field.label}
                      />
                    ) : (
                      <Input
                        variant="outline"
                        value={draft.fields[field.key] ?? ''}
                        onChangeText={(value) => set({ fields: { ...draft.fields, [field.key]: field.numeric ? value.replace(/[^0-9,]/g, '') : value } })}
                        placeholder={field.placeholder}
                        keyboardType={field.numeric ? 'number-pad' : 'default'}
                        mb={0}
                        radius={6}
                        accessibilityLabel={field.label}
                      />
                    )}
                  </Block>
                ))}
              </Block>
            </>
          )}
          {spec.toggles.length > 0 && (
            <Block gap={0} direction="row" wrap justify="space-between">
              {spec.toggles.map((toggle) => (
                <Block key={toggle.key} gap={0} w={wide ? '49%' : '100%'} pb={10}>
                  <Checkbox
                    label={toggle.label}
                    color={C.purple}
                    checked={!!draft.toggles[toggle.key]}
                    onChange={(checked) => set({ toggles: { ...draft.toggles, [toggle.key]: checked } })}
                  />
                </Block>
              ))}
            </Block>
          )}
          <SectionLabel mt={4}>contact</SectionLabel>
          <Block gap={8} p={12} radius={6} bg={C.paler} borderWidth={1} borderColor={C.line}>
            <Text c={C.body} size={13}>
              Replies come to your townlist messages through an anonymous relay email.
            </Text>
            <Checkbox label="also show my phone number" color={C.purple} checked={draft.showPhone} onChange={(showPhone) => set({ showPhone })} />
          </Block>
        </Block>
      )}

      {step === 4 && (
        <Block gap={12}>
          <Block gap={0}>
            <Text c={C.ink} fw="bold" size={18}>
              add images
            </Text>
            <Text c={C.muted} size={13}>
              up to {MAX_PHOTOS} images · the first one is the cover photo
            </Text>
          </Block>
          <FileInput
            variant="dropzone"
            accept={['image/*']}
            multiple
            maxFiles={MAX_PHOTOS - sampleCount}
            value={fileValue}
            maxSize={15 * 1024 * 1024}
            showFileList={false}
            imagePreview={{ enabled: true, maxWidth: 1200, maxHeight: 1200, quality: 0.82 }}
            placeholder="drop images here"
            onChange={onFiles}
            disabled={draft.photos.length >= MAX_PHOTOS}
            accessibilityLabel="Add images"
          />
          <Block gap={6}>
            <Text c={C.muted} size={12}>
              no photos handy? add sample images:
            </Text>
            <Block gap={6} direction="row" wrap>
              {PHOTO_KEYS.map((key) => (
                <Block
                  key={key}
                  gap={0}
                  onPress={() => addPhotos([{ id: `${key}-${Date.now()}`, src: key, caption: PHOTO_LABELS[key] }])}
                  accessibilityRole="button"
                  accessibilityLabel={`Add sample photo: ${PHOTO_LABELS[key]}`}
                  radius={4}
                  overflow="hidden"
                  borderWidth={1}
                  borderColor={C.line}
                  pressedStyle={{ opacity: 0.6 }}
                >
                  <Image src={PHOTOS[key]} w={wide ? 64 : 54} h={wide ? 48 : 42} resizeMode="cover" alt="" />
                </Block>
              ))}
            </Block>
          </Block>
          {draft.photos.length > 0 && (
            <>
              <SectionLabel right={<Text c={C.link} size={12} onPress={() => set({ photos: [] })}>remove all</Text>}>
                {draft.photos.length} of {MAX_PHOTOS} images
              </SectionLabel>
              <Block gap={10} direction="row" wrap>
                {draft.photos.map((photo, index) => (
                  <Block key={photo.id} gap={0} w={tileW} radius={6} overflow="hidden" borderWidth={index === 0 ? 2 : 1} borderColor={index === 0 ? C.purple : C.line} bg={C.white}>
                    <Block gap={0} position="relative">
                      <Image src={photoSource(photo)} w="100%" h={Math.round(tileW * 0.72)} resizeMode="cover" alt={photo.caption ?? `image ${index + 1}`} />
                      <Block gap={0} position="absolute" left={6} top={6}>
                        {index === 0 ? (
                          <Badge size="xs" variant="filled" color={C.purple}>
                            cover
                          </Badge>
                        ) : (
                          <Badge size="xs" variant="filled" color={C.ink}>
                            {index + 1}
                          </Badge>
                        )}
                      </Block>
                    </Block>
                    <Block gap={0} direction="row" align="center" justify="space-between" px={2}>
                      <IconButton icon="arrow-left" size="sm" variant="ghost" iconColor={C.body} disabled={index === 0} accessibilityLabel={`Move image ${index + 1} earlier`} onPress={() => move(index, -1)} />
                      <IconButton icon="arrow-right" size="sm" variant="ghost" iconColor={C.body} disabled={index === draft.photos.length - 1} accessibilityLabel={`Move image ${index + 1} later`} onPress={() => move(index, 1)} />
                      <IconButton icon="trash" size="sm" variant="ghost" iconColor={C.red} accessibilityLabel={`Remove image ${index + 1}`} onPress={() => remove(photo.id)} />
                    </Block>
                  </Block>
                ))}
              </Block>
            </>
          )}
        </Block>
      )}

      {step === 5 && listing && (
        <Block gap={12}>
          <Block gap={8} direction="row" align="center" p={10} radius={6} bg={C.amberPale}>
            <Icon name="eye" color={C.amber} size={16} />
            <Text c={C.amber} size={13} flex={1}>
              This is how your posting will look. Use back to edit.
            </Text>
          </Block>
          <Block gap={0} p={wide ? 16 : 10} radius={8} borderWidth={1} borderColor={C.lineStrong} borderStyle="dashed">
            <ListingBody listing={listing} preview />
          </Block>
          <Text c={C.muted} size={12}>
            By publishing you agree to the townlist demo terms. Your posting stays on this device.
          </Text>
        </Block>
      )}
    </Screen>
  );
}
