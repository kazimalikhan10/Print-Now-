const DEFAULT_HOURS = {
  monday: { open: '09:00', close: '21:00', closed: false },
  tuesday: { open: '09:00', close: '21:00', closed: false },
  wednesday: { open: '09:00', close: '21:00', closed: false },
  thursday: { open: '09:00', close: '21:00', closed: false },
  friday: { open: '09:00', close: '21:00', closed: false },
  saturday: { open: '09:00', close: '21:00', closed: false },
  sunday: { open: '09:00', close: '21:00', closed: false },
};

export const SHOP_DAYS = [
  ['monday', 'Monday'],
  ['tuesday', 'Tuesday'],
  ['wednesday', 'Wednesday'],
  ['thursday', 'Thursday'],
  ['friday', 'Friday'],
  ['saturday', 'Saturday'],
  ['sunday', 'Sunday'],
];

export function getDefaultBusinessHours() {
  return JSON.parse(JSON.stringify(DEFAULT_HOURS));
}

export function normalizeBusinessHours(hours) {
  const base = getDefaultBusinessHours();
  if (!hours) return base;
  return Object.fromEntries(
    SHOP_DAYS.map(([key]) => [key, { ...base[key], ...(hours[key] || {}) }]),
  );
}

function getParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
}

function minutes(value) {
  const [hour, minute] = String(value || '00:00').split(':').map(Number);
  return (hour * 60) + minute;
}

function dayKey(weekday) {
  return String(weekday || '').toLowerCase();
}

export function getShopOpenStatus(shop, now = new Date()) {
  const timeZone = shop?.timeZone || 'Asia/Kolkata';
  const hours = normalizeBusinessHours(shop?.businessHours);
  const parts = getParts(now, timeZone);
  const todayKey = dayKey(parts.weekday);
  const today = hours[todayKey];
  const currentMinutes = (Number(parts.hour) * 60) + Number(parts.minute);

  if (!today || today.closed) {
    return { isOpen: false, label: 'Closed now', todayKey, hours: today, timeZone };
  }

  const openMinutes = minutes(today.open);
  const closeMinutes = minutes(today.close);
  const overnight = closeMinutes <= openMinutes;
  const isOpen = overnight
    ? currentMinutes >= openMinutes || currentMinutes < closeMinutes
    : currentMinutes >= openMinutes && currentMinutes < closeMinutes;

  return {
    isOpen,
    label: isOpen ? 'Open now' : 'Closed now',
    todayKey,
    hours: today,
    timeZone,
  };
}

export function formatBusinessHours(day) {
  if (!day || day.closed) return 'Closed';
  const format = (value) => {
    const [h, m] = value.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
  };
  return `${format(day.open)} – ${format(day.close)}`;
}
