// Единый набор работ для всех трёх вариантов.
// Тексты и цифры взяты из текущего сайта (site/index.html) — только то, что там подтверждено.
const A = import.meta.env.BASE_URL;

export const PERSON = {
  name: 'Abdulloh Zokirov',
  role: 'Сайты, API, Telegram-боты и motion-видео',
  lead: 'Делаю сайты и Telegram-сервисы от идеи до работающего продукта, подключаю API и собираю моушн-ролики, которые их объясняют.',
  telegram: 'https://t.me/Abdulloh_ZokirovN',
  telegramHandle: '@Abdulloh_ZokirovN',
  site: 'https://abdullohzokirov.uz/',
  siteLabel: 'abdullohzokirov.uz',
  showreel: { src: A + 'media/showreel.mp4', poster: A + 'img/showreel.jpg', title: 'Шоурил', len: '45 с' },
};

export const SERVICES = [
  { id: 'web', label: 'Сайты' },
  { id: 'api', label: 'API' },
  { id: 'bot', label: 'Telegram-боты' },
  { id: 'motion', label: 'Motion' },
];

export const PROJECTS = [
  {
    id: 'multitarjima',
    name: 'MultiTarjima',
    kind: 'Веб-приложение',
    services: ['web'],
    role: 'CEO · приложение для изучения английского',
    summary: 'Английский текст из учебника или статьи превращается в личный словарь: отмечаете незнакомые слова, получаете перевод на узбекский или русский и тесты по ним.',
    steps: [
      ['Вставьте текст', 'Вручную или через камеру.'],
      ['Отметьте слова', 'Незнакомые слова подсвечиваются прямо в тексте.'],
      ['Переводите и повторяйте', 'Перевод на узбекский или русский, тесты и история.'],
    ],
    tags: ['EN → UZ / RU', 'Тесты по словам', 'Камера'],
    link: { href: 'https://www.multitarjima.xyz/', label: 'multitarjima.xyz' },
    poster: A + 'img/multitarjima-loop.jpg', video: A + 'media/multitarjima-loop.mp4', ratio: 520 / 680,
    gallery: [A + 'img/mt-s1.jpg', A + 'img/mt-s2.jpg', A + 'img/multitarjima-home.jpg'],
    accent: '#4f6bff',
  },
  {
    id: 'vibeschool',
    name: 'Vibe School',
    kind: 'Сайт и промо-ролик',
    services: ['web', 'motion'],
    role: 'Сайт и промо-ролик · платформа курсов',
    summary: 'Платформа курсов про ИИ, дизайн, маркетинг и бизнес. Маскот Вайби ведёт по каталогу, за уроки начисляются баллы, а автор получает деньги только после дня на проверку.',
    steps: [
      ['Курсы и уроки', 'Каталог про ИИ, дизайн, маркетинг и бизнес.'],
      ['Честная оплата', 'День на проверку, и только потом автор получает деньги.'],
      ['Vibe Plus', 'Материалы Plus, скидка 10% и вдвое больше баллов.'],
    ],
    tags: ['vibeschool.uz', 'Маскот Вайби', 'Ролик 50 с'],
    link: { href: 'https://vibeschool.uz/', label: 'vibeschool.uz' },
    poster: A + 'img/vibeschool-loop.jpg', video: A + 'media/vibeschool-loop.mp4', ratio: 540 / 960,
    full: { src: A + 'media/vibeschool-full.mp4', poster: A + 'img/vibeschool-full.jpg', title: 'Vibe School — промо, 50 секунд', vertical: true },
    gallery: [A + 'img/vibe-s1.jpg', A + 'img/vibe-s2.jpg', A + 'img/vibeschool-full.jpg'],
    accent: '#7b5cff',
  },
  {
    id: 'tstars',
    name: 'T Stars',
    kind: 'Telegram Mini App · платежи',
    services: ['bot', 'api'],
    role: 'Основатель · Mini App и бот @Tobunabot',
    summary: 'Telegram Stars, Premium и аренда подарков в одном боте. Внутри — оплата картами, подключение TON-кошелька и проверка ссылки из Fragment: пользователь проходит путь от выбора до подарка в профиле, не выходя из Telegram.',
    steps: [
      ['Выберите подарок', 'Аренда от 2 632 сум в день.'],
      ['Оплатите картой', 'UzCard, Humo, Click, Payme прямо в боте.'],
      ['Подключите кошелёк', 'TON Connect на Fragment и QR-код.'],
      ['Вставьте ссылку', 'Бот проверяет её и оформляет аренду.'],
    ],
    tags: ['UzCard · Humo · Click · Payme', 'TON Connect', 'Fragment'],
    api: ['Telegram Bot API', 'Mini App', 'UzCard · Humo', 'Click · Payme', 'TON Connect', 'Fragment'],
    link: { href: 'https://t.me/Tobunabot', label: '@Tobunabot' },
    poster: A + 'img/tstars-loop.jpg', video: A + 'media/tstars-loop.mp4', ratio: 540 / 960,
    full: { src: A + 'media/tstars-full.mp4', poster: A + 'img/tstars-full.jpg', title: 'T Stars: аренда подарка за 1 минуту', vertical: true },
    gallery: [A + 'img/tstars-s1.jpg', A + 'img/tstars-s2.jpg', A + 'img/tstars-full.jpg'],
    accent: '#2fb8ff',
  },
  {
    id: 'aiobuna',
    name: 'AI Obuna',
    kind: 'Telegram-бот',
    services: ['bot'],
    role: 'Основатель · Telegram-бот подписок',
    summary: 'Подписки на цифровые сервисы для работы, учёбы и творчества в одном боте: ChatGPT, Gemini, CapCut, Canva, ElevenLabs. Каталог, заказ и профиль прямо в Telegram.',
    steps: [
      ['Каталог', 'ChatGPT, Gemini, CapCut, Canva, ElevenLabs.'],
      ['Заказ', 'Выбор тарифа и оформление в чате.'],
      ['Профиль', 'Активные подписки в одном месте.'],
    ],
    tags: ['ChatGPT', 'Gemini', 'CapCut', 'Canva'],
    link: { href: 'https://t.me/Aiobunabot', label: '@Aiobunabot' },
    poster: A + 'img/aiobuna-loop.jpg', video: A + 'media/aiobuna-loop.mp4', ratio: 560 / 680,
    gallery: [A + 'img/ao-s1.jpg', A + 'img/ao-s2.jpg', A + 'img/aiobuna-loop.jpg'],
    accent: '#3ccf91',
  },
  {
    id: 'yandexgo',
    name: 'Yandex Go',
    kind: 'Motion · концепт-ролик',
    services: ['motion'],
    role: 'Концепт-ролики · моушн из интерфейса',
    summary: 'Два концепт-ролика: «Нужно такси? Пара касаний» — от поиска адреса до машины на карте за 15 секунд, и ролик с озвучкой о том, как доехать, поесть и купить продукты в одном приложении.',
    steps: [
      ['Такси', '15 секунд: адрес, тариф, машина на карте.'],
      ['Одно приложение', '17 секунд с озвучкой: поездки, еда, продукты.'],
    ],
    tags: ['Концепт', '15 с + 17 с', '9:16'],
    poster: A + 'img/yandexgo-taxi.jpg', video: A + 'media/yandexgo-taxi.mp4', ratio: 540 / 960,
    full: { src: A + 'media/yandexgo-app.mp4', poster: A + 'img/yandexgo-app.jpg', title: 'Yandex Go — одно приложение (концепт)', vertical: true },
    gallery: [A + 'img/yandexgo-taxi.jpg', A + 'img/yandexgo-app.jpg', A + 'img/uzum-tezkor.jpg'],
    galleryVideos: [A + 'media/yandexgo-taxi.mp4', A + 'media/yandexgo-app.mp4', A + 'media/uzum-tezkor.mp4'],
    accent: '#ffcc00',
  },
];

export const byId = id => PROJECTS.find(p => p.id === id);

// Облегчённый режим: prefers-reduced-motion, ?lite, слабое устройство или экономия трафика.
export function liteMode() {
  const q = new URLSearchParams(location.search);
  if (q.has('full')) return false;
  if (q.has('lite')) return true;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  const c = navigator.connection;
  if (c && (c.saveData || /2g/.test(c.effectiveType || ''))) return true;
  if ((navigator.hardwareConcurrency || 8) <= 2) return true;
  if (navigator.deviceMemory && navigator.deviceMemory <= 2) return true;
  return false;
}
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
