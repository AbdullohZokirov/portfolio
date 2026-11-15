// 01 · Кино. Хромированный компьютер: камера на прокрутке влетает в его экран и летит к работам.
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './styles/case.css';
import './styles/main.css';
import { frameGeometry, roundedMask, glowTexture } from './lib/zshape.js';
import { PERSON, liteMode, reducedMotion, finePointer } from './lib/data.js';
import { onFrame, magnetic, smoothScroll, scrollToY, clamp, lerp, range } from './lib/motion.js';
import { createCase } from './lib/case.js';

const V3 = THREE.Vector3;
const LITE = liteMode(), RM = reducedMotion();

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const runway = $('#runway'), contact = $('#contact'), overlay = $('.overlay'), flash = $('.flash');
const caps = $$('[data-cap]'), chapterBtns = $$('.chapters [data-go]');
const lenis = smoothScroll();
gsap.registerPlugin(ScrollTrigger);

// ---------- одна плёнка: GSAP-таймлайн, привязанный к прокрутке (gsap-scrolltrigger + gsap-core) ----------
// Таймлайн длиной 1 = весь пролёт. STATE.p читает Three.js-камера, остальное (подписи, вспышка,
// кашетирование кадра) — твины на том же таймлайне, поэтому всё обратимо и синхронно при скролле назад.
// Хореография (choreograph): ведущий — проход камеры сквозь Z; текст героя уходит ДО него,
// подпись первой работы появляется ПОСЛЕ того, как камера встала; вспышка и кашеты — на моменте удара.
const STATE = { p: 0, flare: 0, roll: 0 };
// Прогресс растянут: первые главы занимают 42% плёнки, дальше длинный показ роликов и финал.
// W() переводит старые отметки (0…1 до показа роликов) в новую шкалу.
const W = x => x * 0.48 / 0.65; // первые главы — те же ~700vh, что и раньше
const TOUR = [{ id: 'uzum', p: 0.545 }, { id: 'reel', p: 0.6 }, { id: 'reklama', p: 0.655 }, { id: 'yandexgo', p: 0.71 }, { id: 'design', p: 0.765 }];
const LABELS = { hero: 0, portal: W(0.192), site: W(0.315), bot: W(0.53), motion: 0.505, ...Object.fromEntries(TOUR.map(t => [t.id, t.p])), finale: 1 };
const WINDOWS = [[-1, W(0.06)], [W(0.255), W(0.375)], [W(0.475), W(0.585)], [0.488, 0.52], [0.9, 2]];
// центры переходов: сайты→телеграм, телеграм→стена, стена→первый ролик, между роликами, последний→финал
const CUTS = [W(0.445), W(0.65), 0.527, ...TOUR.slice(1).map((t, i) => (TOUR[i].p + t.p) / 2), 0.8];
let pT = 0, pCur = 0, tl;
const runwayY = p => runway.offsetTop + p * (runway.offsetHeight - innerHeight);
const STOPS = [0, LABELS.site, LABELS.bot, LABELS.motion];
const snap = p => STOPS.reduce((a, b) => Math.abs(b - p) < Math.abs(a - p) ? b : a, 0);
const bars = $$('.bar-cine'), leak = $('.leak');
const mm = gsap.matchMedia();
mm.add({ motion: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)', touch: '(hover: none)' }, ctx => {
  const { reduce, touch } = ctx.conditions;
  const still = reduce || LITE;
  tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: runway, start: 'top top', end: 'bottom bottom', invalidateOnRefresh: true,
      scrub: still ? true : touch ? 0.6 : 1.1,
      snap: touch && !still ? { snapTo: 'labelsDirectional', duration: { min: 0.35, max: 0.9 }, delay: 0.14, ease: 'power2.inOut' } : false,
      onUpdate: s => { pT = s.progress; },
    },
  });
  Object.entries(LABELS).forEach(([k, v]) => tl.addLabel(k, v));
  tl.to(STATE, { p: 1, duration: 1 }, 0);
  caps.forEach((c, i) => {
    const [a, b] = WINDOWS[i], dy = still ? 0 : 14;
    if (i === 0) { tl.to(c, { autoAlpha: 0, y: still ? 0 : -36, duration: 0.032, ease: 'power2.in' }, 0.016); return; }
    tl.fromTo(c, { autoAlpha: 0, y: dy }, { autoAlpha: 1, y: 0, duration: 0.014, ease: 'power2.out', immediateRender: false }, a - 0.012);
    if (b < 1.5) tl.to(c, { autoAlpha: 0, y: -dy, duration: 0.012, ease: 'power1.inOut' }, b);
  });
  if (!still) {
    const k = 0.646;
    // главный момент: влёт в экран компьютера
    tl.to(bars, { scaleY: 1, duration: 0.03 * k, ease: 'power2.out' }, W(0.15))
      .to(STATE, { flare: 1, duration: 0.03 * k, ease: 'power2.in' }, W(0.162))
      .to(STATE, { roll: 1, duration: 0.03 * k, ease: 'power1.inOut' }, W(0.172))
      .fromTo(flash, { opacity: 0 }, { opacity: 0.92, duration: 0.008 * k, ease: 'power2.out', immediateRender: false }, W(0.184))
      .to(flash, { opacity: 0, duration: 0.028 * k, ease: 'power2.out' }, W(0.192))
      .to(STATE, { flare: 0, duration: 0.03 * k }, W(0.194))
      .to(STATE, { roll: 0, duration: 0.04 * k, ease: 'power2.out' }, W(0.2))
      .to(bars, { scaleY: 0, duration: 0.04 * k, ease: 'power2.inOut' }, W(0.21));
    // переходы между работами: световой засвет пролетает по кадру, камера кренится, кадр на миг сужается
    gsap.set(leak, { x: '-80vw', opacity: 0 });
    CUTS.forEach((t, i) => {
      const dir = i % 2 ? 1 : -1;
      tl.to(leak, { keyframes: { x: ['-80vw', '170vw'], opacity: [0, 1, 1, 0] }, duration: 0.024, ease: 'power1.inOut' }, t - 0.012)
        .to(STATE, { keyframes: { roll: [0, dir * 0.75, 0] }, duration: 0.03, ease: 'power1.inOut' }, t - 0.015)
        .to(bars, { keyframes: { scaleY: [0, 0.55, 0] }, duration: 0.03, ease: 'power1.inOut' }, t - 0.015);
    });
  }
  return () => { STATE.flare = 0; STATE.roll = 0; };
});
function go(i) {
  if (i >= 4) return scrollToY(lenis, contact.offsetTop, 2.2);
  const key = ['hero', 'site', 'bot', 'motion'][i];
  const y = tl?.scrollTrigger ? tl.scrollTrigger.labelToScroll(key) : runwayY(STOPS[i]);
  scrollToY(lenis, y, RM ? 0 : 1.8 + Math.abs(STOPS[i] - pT) * 2);
}
$$('[data-go]').forEach(b => b.addEventListener('click', () => go(+b.dataset.go)));
$$('[data-jump-contact]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); go(4); }));
$$('.btn-main, .btn-xl').forEach(b => magnetic(b));

// сборщик задачи: чипы → готовый текст → копируем и открываем Telegram
const brief = $('[data-brief]');
if (brief) {
  const out = $('[data-brief-text]'), status = $('[data-brief-status]');
  const text = () => {
    const need = [...brief.querySelectorAll('[name=need]:checked')].map(i => i.value);
    const when = brief.querySelector('[name=when]:checked')?.value;
    return `Здравствуйте, Абдуллох! Нужно: ${need.length ? need.join(', ') : 'сайт'}. Срок: ${when}.`;
  };
  const sync = () => { out.textContent = text(); status.textContent = ''; };
  brief.addEventListener('change', sync); sync();
  brief.addEventListener('submit', async e => {
    e.preventDefault();
    let copied = false;
    try { await navigator.clipboard.writeText(text()); copied = true; } catch {}
    status.textContent = copied ? 'Текст скопирован — вставьте его в чат.' : 'Откроется Telegram — перепишите текст из рамки выше.';
    window.open('https://t.me/Abdulloh_ZokirovN', '_blank', 'noopener');
  });
}

// уход оверлея на блок связи и активная глава в шапке
let lastCh = -1;
function updateCaps() {
  const out = 1 - range(scrollY, runwayY(1) + innerHeight * 0.05, runwayY(1) + innerHeight * 0.55);
  overlay.style.opacity = out < 1 ? out.toFixed(3) : '';
}

// ---------- кейс ----------
let screens = {}, camera, renderer, renderOn = true, push = { v: 0 }, caseTarget = null;
function screenRect(id) {
  const s = screens[id]; if (!s || !camera) return null;
  const { w, h } = s; const pts = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of pts) {
    const v = new V3(x, y, 0).applyMatrix4(s.screen.matrixWorld).project(camera);
    if (v.z > 1) return null;
    const sx = (v.x + 1) / 2 * innerWidth, sy = (1 - v.y) / 2 * innerHeight;
    x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
  }
  return { x0, y0, x1, y1 };
}
const insetOf = r => r ? `inset(${Math.max(0, r.y0)}px ${Math.max(0, innerWidth - r.x1)}px ${Math.max(0, innerHeight - r.y1)}px ${Math.max(0, r.x0)}px round 18px)` : 'inset(50% 50% 50% 50% round 18px)';
const EASE = 'cubic-bezier(.7,0,.2,1)';
const kase = createCase({
  backLabel: 'Назад в сцену',
  async animateIn(el, ctx, p) {
    caseTarget = p.id;
    if (ctx.quick || RM) { await el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 }).finished; renderOn = false; return; }
    const r = screenRect(p.id);
    gsap.to(push, { v: 1, duration: 0.9, ease: 'power3.inOut' });
    const a = el.animate([{ clipPath: insetOf(r), opacity: 0.6 }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', opacity: 1 }], { duration: 820, easing: EASE, fill: 'forwards' });
    el.querySelector('.case-intro')?.animate([{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: 380, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
    await a.finished; a.commitStyles?.(); a.cancel(); el.style.clipPath = '';
    renderOn = false;
  },
  async animateOut(el, ctx, p) {
    renderOn = true;
    if (ctx.quick || RM) { await el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).finished; push.v = 0; return; }
    gsap.to(push, { v: 0, duration: 0.9, ease: 'power3.inOut' });
    await new Promise(r => requestAnimationFrame(r));
    const target = screenRect(p.id);
    await el.animate([{ clipPath: 'inset(0px 0px 0px 0px round 0px)', opacity: 1 }, { clipPath: insetOf(target), opacity: 0.2 }], { duration: 640, easing: EASE, fill: 'forwards' }).finished;
  },
  onClose() { caseTarget = null; },
  onContact() { },
});
$$('[data-case]').forEach(b => b.addEventListener('click', () => kase.open(b.dataset.case)));

// ---------- 3D ----------
let ok = true;
try {
  renderer = new THREE.WebGLRenderer({ canvas: $('.gl'), antialias: !LITE, powerPreference: 'high-performance' });
  if (!renderer.getContext()) throw 0;
} catch { ok = false; document.documentElement.classList.add('no-gl'); }

if (!ok) {
  onFrame(() => { pCur = RM ? snap(pT) : STATE.p; updateCaps(); });
} else {
  const DPR = Math.min(devicePixelRatio || 1, LITE ? 1 : 1.75);
  renderer.setPixelRatio(DPR);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.FogExp2(0x000000, 0.045);
  const pmrem = new THREE.PMREMGenerator(renderer);
  // Своя «студия» для отражений: чёрная комната и несколько софтбоксов.
  // Вращая её, мы заставляем блики скользить по граням Z.
  function studio() {
    const s = new THREE.Scene();
    s.add(new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), new THREE.MeshBasicMaterial({ color: 0x050506, side: THREE.BackSide })));
    const box = (w, h, color, x, y, z, ry = 0, rx = 0) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.rotation.set(rx, ry, 0); s.add(m);
    };
    box(14, 2.2, new THREE.Color(4, 3.8, 3.5), 0, 9, 0, 0, Math.PI / 2);          // верхний свет
    box(1.4, 12, new THREE.Color(5, 3.2, 1.6), -11, 1, 3, Math.PI / 2);           // тёплая полоса
    box(1.0, 12, new THREE.Color(1.6, 2.4, 4.2), 11, 1, -2, -Math.PI / 2);        // холодная полоса
    box(9, 0.5, new THREE.Color(3, 3, 3), 0, -1, -12);                            // контровой
    box(3, 3, new THREE.Color(2.2, 2.2, 2.2), 6, 4, 10, Math.PI);                 // заполняющий
    box(18, 7, new THREE.Color(0.05, 0.05, 0.06), 0, 0, 13, Math.PI);            // тёмный фронт: хром отражает темноту
    box(16, 0.18, new THREE.Color(6, 5.6, 5.2), 0, 3.2, 12, Math.PI);           // узкие блики-линии
    box(10, 3.2, new THREE.Color(1.3, 1.25, 1.2), 0, 6.5, 9, Math.PI, -0.5);    // мягкий софтбокс сверху-спереди
    box(16, 0.1, new THREE.Color(3, 1.6, 0.8), 0, -2.6, 12, Math.PI);
    box(0.14, 9, new THREE.Color(1.4, 1.8, 4), -7, 0, 11, Math.PI);
    return s;
  }
  scene.environment = pmrem.fromScene(studio(), 0.02).texture;
  scene.environmentIntensity = 1;

  camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.03, 120);

  // Рамка экрана из жидкого хрома с радужной плёнкой: сквозь её проём камера уходит к работам
  const zMat = new THREE.MeshPhysicalMaterial({
    color: 0xf2f2f2, metalness: 1, roughness: 0.07, clearcoat: 1, clearcoatRoughness: 0.05,
    iridescence: 0.75, iridescenceIOR: 1.6, iridescenceThicknessRange: [180, 820],
  });
  // монитор: рамка экрана + подбородок + ножка + подставка, всё из одного хрома
  const zGroup = new THREE.Group(); scene.add(zGroup);
  const bezel = new THREE.Mesh(frameGeometry({ w: 4.8, h: 3.2, r: 0.32, border: 0.2, depth: 0.34, bevel: 0.11, segments: LITE ? 3 : 10 }), zMat);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.15, 0.16), zMat);
  neck.position.set(0, -2.05, -0.32); neck.rotation.x = -0.12;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.15, 0.12, 48), zMat);
  base.scale.set(1, 1, 0.55); base.position.set(0, -2.66, -0.42);
  zGroup.add(bezel, neck, base);
  // 3D-курсор мыши рядом с экраном: подсказка «компьютер / интерфейс»
  const arrow = new THREE.Shape();
  [[0, 0], [0, -1.0], [0.26, -0.76], [0.44, -1.14], [0.6, -1.06], [0.42, -0.69], [0.76, -0.69]].forEach(([x, y], i) => i ? arrow.lineTo(x, y) : arrow.moveTo(x, y));
  arrow.closePath();
  const cursorGeo = new THREE.ExtrudeGeometry(arrow, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 6 });
  cursorGeo.translate(-0.3, 0.55, -0.06);
  const cursor3d = new THREE.Mesh(cursorGeo, new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.15, clearcoat: 1, emissive: 0x111111 }));
  cursor3d.position.set(2.15, -0.75, 0.75); cursor3d.scale.setScalar(0.62);
  zGroup.add(cursor3d);

  // Экран монитора: «включается» терминал, печатает, что я делаю, и листает обложки работ.
  // При влёте камеры экран растворяется — камера проходит внутрь.
  const SW = 1024, SH = 652;
  const scv = document.createElement('canvas'); scv.width = SW; scv.height = SH;
  const sx = scv.getContext('2d');
  const screenTex = new THREE.CanvasTexture(scv); screenTex.colorSpace = THREE.SRGBColorSpace;
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, alphaMap: roundedMask(512, 326, 0.05), transparent: true, toneMapped: false, depthWrite: false });
  const screenPlane = new THREE.Mesh(new THREE.PlaneGeometry(4.36, 2.78), screenMat);
  screenPlane.position.z = 0.02; zGroup.add(screenPlane);
  const thumbs = ['img/multitarjima-loop.jpg', 'img/tstars-loop.jpg', 'img/uzum-tezkor.jpg', 'img/vibeschool-loop.jpg', 'img/yandexgo-taxi.jpg', 'img/aiobuna-loop.jpg']
    .map(src => { const im = new Image(); im.src = import.meta.env.BASE_URL + src; return im; });
  const LINES = ['$ abdulloh --portfolio', '→ сайты и веб-приложения', '→ telegram-боты и API', '→ motion-видео', '✓ готово · листайте вниз'];
  let screenClock = 0, lastDraw = -1;
  function drawScreen(t) {
    const g = sx.createLinearGradient(0, 0, SW, SH); g.addColorStop(0, '#0b0d12'); g.addColorStop(1, '#141018');
    sx.fillStyle = g; sx.fillRect(0, 0, SW, SH);
    // окно терминала
    sx.fillStyle = 'rgba(255,255,255,.05)'; sx.fillRect(0, 0, SW, 44);
    ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { sx.fillStyle = c; sx.beginPath(); sx.arc(30 + i * 24, 22, 7, 0, 7); sx.fill(); });
    sx.fillStyle = 'rgba(236,232,223,.5)'; sx.font = '500 18px "Golos Text", system-ui'; sx.fillText('abdulloh — portfolio', 120, 28);
    // печать строк
    const cps = 26, total = LINES.join('').length, cycle = total / cps + 4.5, k = t % cycle;
    let left = Math.floor(k * cps);
    sx.font = '26px ui-monospace, Consolas, monospace';
    LINES.forEach((ln, i) => {
      const shown = ln.slice(0, Math.max(0, Math.min(ln.length, left))); left -= ln.length;
      sx.fillStyle = i === 0 ? '#ff8a55' : i === LINES.length - 1 ? '#7cf0a8' : '#e9e4da';
      sx.fillText(shown, 40, 110 + i * 52);
      if (left < 0 && left > -ln.length - 1 && Math.floor(t * 2) % 2 === 0) { const w = sx.measureText(shown).width; sx.fillRect(44 + w, 88 + i * 52, 14, 28); }
    });
    // справа — обложки работ, плавная смена
    const n = thumbs.length, f = Math.abs(t || 0) / 1.8, i0 = ((Math.floor(f) % n) + n) % n, mix = Math.min(1, (f % 1) / 0.35);
    const bx = 600, by = 70, bw = 380, bh = 540;
    sx.save(); sx.beginPath(); sx.roundRect(bx, by, bw, bh, 22); sx.clip();
    sx.fillStyle = '#1b1d24'; sx.fillRect(bx, by, bw, bh);
    const draw = (im, a) => { if (!im || !im.complete || !im.naturalWidth) return; const r = Math.max(bw / im.naturalWidth, bh / im.naturalHeight); const w = im.naturalWidth * r, h = im.naturalHeight * r; sx.globalAlpha = a; sx.drawImage(im, bx + (bw - w) / 2, by + (bh - h) / 2, w, h); sx.globalAlpha = 1; };
    draw(thumbs[(i0 + n - 1) % n], 1); draw(thumbs[i0], mix);
    sx.restore();
    sx.strokeStyle = 'rgba(255,255,255,.12)'; sx.lineWidth = 2; sx.beginPath(); sx.roundRect(bx, by, bw, bh, 22); sx.stroke();
    // блик стекла
    const gl = sx.createLinearGradient(0, 0, SW, SH); gl.addColorStop(0, 'rgba(255,255,255,.07)'); gl.addColorStop(.4, 'rgba(255,255,255,0)');
    sx.fillStyle = gl; sx.fillRect(0, 0, SW, SH);
    screenTex.needsUpdate = true;
  }
  const PORTAL = new V3(0, 0, 0); // центр проёма рамки

  // Фон: подвижный «шейдерный градиент» (идея Shader Gradient из DesignBookmark → 3D & Motion),
  // два тёплых и холодных пятна света в темноте + дизеринг против полос.
  const bgMat = new THREE.ShaderMaterial({
    uniforms: { t: { value: 0 }, p: { value: 0 }, bolt: { value: 0 }, boltX: { value: 0.5 }, seed: { value: 1 }, c1: { value: new THREE.Color('#ff6a2b') }, c2: { value: new THREE.Color('#2f46ff') } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }',
    fragmentShader: `
      uniform float t, p, bolt, boltX, seed; uniform vec3 c1, c2; varying vec2 vUv;
      float h(vec2 q){ return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 q){ vec2 i = floor(q), f = fract(q); f = f*f*(3.0-2.0*f);
        return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 q){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ s += a*n(q); q *= 2.03; a *= 0.5; } return s; }
      void main(){
        vec2 uv = vUv; vec2 q = uv * 2.2; float tt = t * 0.05;
        float w = fbm(q + vec2(tt, -tt*0.7) + fbm(q*1.4 - tt) * 1.3);
        float m1 = smoothstep(0.42, 0.95, w) * smoothstep(0.95, 0.1, distance(uv, vec2(0.62 + 0.1*sin(tt*3.0), 0.42 + p*0.25)));
        float m2 = smoothstep(0.45, 1.0, fbm(q*1.2 - vec2(tt*0.8, tt))) * smoothstep(0.9, 0.1, distance(uv, vec2(0.28, 0.66 - p*0.2)));
        vec3 col = c1 * m1 * 0.62 + c2 * m2 * 0.5;
        // молния: ломаная линия сверху вниз, ствол + ответвление, холодное свечение и вспышка неба
        if (bolt > 0.001) {
          float y = 1.0 - uv.y;
          float jag = (fbm(vec2(y * 9.0, seed)) - 0.5) * 0.16 + (n(vec2(y * 40.0, seed * 3.1)) - 0.5) * 0.025;
          float x0 = boltX + jag * smoothstep(0.0, 0.15, y);
          float len = smoothstep(0.78, 0.7, y);
          float dd = abs(uv.x - x0);
          float core = exp(-dd * 900.0) * len, glowB = exp(-dd * 38.0) * len;
          float yb = clamp((y - 0.32) / 0.3, 0.0, 1.0);
          float xb = x0 + yb * 0.12 * sign(seed - 0.5) + (n(vec2(y * 30.0, seed * 7.0)) - 0.5) * 0.03;
          float br = exp(-abs(uv.x - xb) * 1100.0) * step(0.32, y) * smoothstep(0.62, 0.5, y);
          vec3 cold = vec3(0.72, 0.8, 1.0);
          col += cold * (core * 2.2 + br * 1.3 + glowB * 0.35) * bolt;
          col += cold * 0.12 * bolt * smoothstep(1.1, 0.0, distance(uv, vec2(boltX, 1.0)));
        }
        col += (h(uv * 1000.0 + t) - 0.5) / 255.0;
        gl_FragColor = vec4(col, 1.0);
      }`,
    depthWrite: false, depthTest: false, fog: false,
  });
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
  bg.frustumCulled = false; bg.renderOrder = -1; scene.add(bg);

  // свет
  scene.add(new THREE.AmbientLight(0x404858, 0.4));
  const key = new THREE.DirectionalLight(0xffd6a8, 2.2); key.position.set(4, 5, 6); scene.add(key);
  const boltLight = new THREE.DirectionalLight(0xc8d6ff, 0); boltLight.position.set(0, 8, 3); scene.add(boltLight);
  const rim = new THREE.PointLight(0x4a62ff, 60, 22, 2); rim.position.set(-4.5, 2.5, -2.5); scene.add(rim);
  const sweep = new THREE.SpotLight(0xff7a3d, 300, 30, 0.34, 0.85, 1.6); sweep.position.set(-6, 3, 5); sweep.target = zGroup; scene.add(sweep);


  // пыль в луче
  if (!LITE) {
    const N = 700, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 14; pos[i * 3 + 1] = Math.random() * 6 - 2; pos[i * 3 + 2] = 6 - Math.random() * 48; }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffd2b0, size: 0.024, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false })));
  }

  // экраны с работами
  const texLoader = new THREE.TextureLoader();
  function makeScreen({ id, w, h, poster, video, accent, pos, rotY, win }) {
    const group = new THREE.Group(); group.position.copy(pos); group.rotation.y = rotY;
    const mask = roundedMask(512, Math.round(512 * h / w), 0.055);
    const frame = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.14, h + 0.14), new THREE.MeshStandardMaterial({ color: 0x17191d, metalness: 0.9, roughness: 0.28, alphaMap: roundedMask(512, Math.round(512 * (h + .14) / (w + .14)), 0.06), alphaTest: 0.5 }));
    frame.position.z = -0.02;
    const back = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, h + 0.1, 0.08), new THREE.MeshStandardMaterial({ color: 0x0d0e11, metalness: 0.8, roughness: 0.4 }));
    back.position.z = -0.08;
    const posterTex = texLoader.load(poster); posterTex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: posterTex, alphaMap: mask, alphaTest: 0.5, toneMapped: false });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(w * 3, h * 2.2), new THREE.MeshBasicMaterial({ map: glowTexture(accent), transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.position.z = -0.25;
    const light = new THREE.PointLight(new THREE.Color(accent), 8, 9, 2); light.position.set(0, 0, 1.6);
    group.add(glow, back, frame, screen, light); scene.add(group);
    const s = { id, w, h, group, screen, mat, win, pos, rotY, el: null, wanted: false };
    s.ensure = () => {
      if (s.el) return;
      const v = s.el = document.createElement('video');
      Object.assign(v, { src: video, muted: true, loop: true, playsInline: true, preload: 'auto' });
      v.setAttribute('playsinline', '');
      v.addEventListener('loadeddata', () => { const t = new THREE.VideoTexture(v); t.colorSpace = THREE.SRGBColorSpace; mat.map = t; mat.needsUpdate = true; });
    };
    s.setActive = on => {
      if (on === s.wanted) return; s.wanted = on;
      if (on) { s.ensure(); s.el.play().catch(() => {}); } else if (s.el) s.el.pause();
    };
    return s;
  }
  const P = id => ({ multitarjima: '#4f6bff', tstars: '#2fb8ff', yandexgo: '#ffcc00' }[id]);
  const A = import.meta.env.BASE_URL;
  // глава 1 — сайты
  screens.multitarjima = makeScreen({ id: 'multitarjima', w: 2.6, h: 3.4, poster: A + 'img/multitarjima-loop.jpg', video: A + 'media/multitarjima-loop.mp4', accent: P('multitarjima'), pos: new V3(-0.6, 0, -9), rotY: 0.16, win: [W(0.12), W(0.42)] });
  screens.vibeschool = makeScreen({ id: 'vibeschool', w: 1.95, h: 3.46, poster: A + 'img/vibeschool-loop.jpg', video: A + 'media/vibeschool-loop.mp4', accent: '#7b5cff', pos: new V3(2.15, -0.05, -9.7), rotY: -0.1, win: [W(0.12), W(0.42)] });
  // глава 2 — Telegram и API
  screens.tstars = makeScreen({ id: 'tstars', w: 2.14, h: 3.8, poster: A + 'img/tstars-loop.jpg', video: A + 'media/tstars-loop.mp4', accent: P('tstars'), pos: new V3(1.7, 0.1, -21), rotY: -0.2, win: [W(0.4), W(0.64)] });
  screens.aiobuna = makeScreen({ id: 'aiobuna', w: 2.75, h: 3.34, poster: A + 'img/aiobuna-loop.jpg', video: A + 'media/aiobuna-loop.mp4', accent: '#3ccf91', pos: new V3(-1.3, 0, -21.7), rotY: 0.14, win: [W(0.4), W(0.64)] });
  // глава 3 — стена роликов вокруг шоурила
  const reel = makeScreen({ id: 'reel', w: 6.4, h: 3.6, poster: A + 'img/showreel.jpg', video: PERSON.showreel.src, accent: '#ffb45e', pos: new V3(-0.9, 0.7, -33), rotY: 0.06, win: [0.44, 1.01] });
  screens.yandexgo = makeScreen({ id: 'yandexgo', w: 1.6, h: 2.85, poster: A + 'img/yandexgo-taxi.jpg', video: A + 'media/yandexgo-taxi.mp4', accent: P('yandexgo'), pos: new V3(3.25, -0.45, -31.7), rotY: -0.32, win: [0.44, 1.01] });
  screens.uzum = makeScreen({ id: 'uzum', w: 1.6, h: 2.85, poster: A + 'img/uzum-tezkor.jpg', video: A + 'media/uzum-tezkor.mp4', accent: '#7a3cff', pos: new V3(-5.0, -0.35, -31.8), rotY: 0.34, win: [0.44, 1.01] });
  screens.design = makeScreen({ id: 'design', w: 1.45, h: 2.58, poster: A + 'img/design-promo.jpg', video: A + 'media/design-promo.mp4', accent: '#ff5a2b', pos: new V3(6.3, 1.7, -33.4), rotY: 0.02, win: [0.44, 1.01] });
  screens.reklama = makeScreen({ id: 'reklama', w: 3.4, h: 1.91, poster: A + 'img/reklama.jpg', video: A + 'media/reklama.mp4', accent: '#ff4a2b', pos: new V3(-1.1, -2.15, -32.7), rotY: 0.04, win: [0.44, 1.01] });
  screens.reel = reel;
  const allScreens = Object.values(screens);

  // звук каждого ролика включается вручную, только один за раз
  const soundBtns = $$('[data-sound]');
  const syncSound = () => soundBtns.forEach(b => { const v = screens[b.dataset.sound]?.el; const on = !!v && !v.muted; b.setAttribute('aria-pressed', String(on)); b.textContent = on ? 'Выключить звук' : 'Смотреть со звуком'; });
  soundBtns.forEach(b => b.addEventListener('click', () => {
    const sc = screens[b.dataset.sound]; sc.setActive(true);
    const turnOn = sc.el.muted;
    allScreens.forEach(x => { if (x.el) x.el.muted = true; });
    if (turnOn) { sc.el.muted = false; sc.el.volume = 1; sc.el.currentTime = 0; sc.el.play().catch(() => {}); }
    syncSound();
  }));
  const TOUR_IDS = TOUR.map(t => t.id);
  allScreens.forEach(x => { x.dim = 1; });

  // ---------- траектория камеры ----------
  let curvePos, curveLook, keys;
  function frameFor(s, side, near = 1, center = false) {
    const a = innerWidth / innerHeight, portrait = a < 0.9;
    const fov = portrait ? 52 : 38, t = Math.tan(THREE.MathUtils.degToRad(fov / 2));
    const n = new V3(Math.sin(s.rotY), 0, Math.cos(s.rotY)), right = new V3(Math.cos(s.rotY), 0, -Math.sin(s.rotY));
    let d = Math.max(s.h / ((portrait ? 0.46 : 0.66) * 2 * t), s.w / ((portrait ? 0.84 : 0.5) * 2 * t * a)) * near;
    const off = new V3();
    if (center) { /* ролик строго по центру кадра */ } else if (portrait) off.y = -2 * d * t * 0.17; else off.addScaledVector(right, -side * 2 * d * t * a * 0.19);
    const look = s.pos.clone().add(off);
    return { pos: look.clone().addScaledVector(n, d), look, fov };
  }
  function buildKeys() {
    const a = innerWidth / innerHeight, portrait = a < 0.9;
    const hero = frameFor({ pos: new V3(0, -0.5, 0), rotY: 0, w: 5.2, h: 5.9 }, 0, portrait ? 1.0 : 0.86);
    if (portrait) { hero.pos.y += 0.15; hero.look.y += 0.15; }
    const hero2 = frameFor({ pos: new V3(0, -0.2, 0), rotY: 0, w: 5.0, h: 3.6 }, 0, portrait ? 0.8 : 0.85);
    const c1 = portrait ? screens.multitarjima : { pos: new V3(0.75, 0, -9.35), rotY: 0.03, w: 5.4, h: 3.6 };
    const c2 = portrait ? screens.tstars : { pos: new V3(0.2, 0.05, -21.35), rotY: -0.03, w: 5.6, h: 3.9 };
    const s1 = frameFor(c1, 1), s1b = frameFor(c1, 1, 0.93);
    const s2 = frameFor(c2, -1), s2b = frameFor(c2, -1, 0.93);
    // стена роликов: на компьютере видна целиком, на телефоне камера смотрит на шоурил и Yandex Go
    const s3 = portrait ? frameFor(screens.reel, 0, 0.9) : { pos: new V3(1.4, 0.35, -23.1), look: new V3(-1.3, -0.1, -33), fov: 44 };
    const s3b = portrait ? frameFor(screens.reel, 0, 0.85) : { pos: new V3(1.25, 0.32, -23.9), look: new V3(-1.3, -0.1, -33), fov: 44 };
    const NEAR = { reel: portrait ? 0.6 : 0.62, reklama: portrait ? 0.85 : 0.7 };
    const tour = TOUR.flatMap(t => {
      const n = NEAR[t.id] || (portrait ? 0.92 : 0.8), a = frameFor(screens[t.id], 0, n, true), b = frameFor(screens[t.id], 0, n * 0.9, true);
      return [{ p: t.p - 0.019, ...a }, { p: t.p + 0.019, ...b }];
    });
    const k = [
      { p: 0.0, ...hero },
      { p: W(0.075), ...hero2 },
      { p: W(0.145), pos: PORTAL.clone().add(new V3(0.02, 0.02, 3.2)), look: PORTAL.clone(), fov: portrait ? 50 : 36 },
      { p: W(0.192), pos: PORTAL.clone().add(new V3(0, 0, 0.12)), look: PORTAL.clone().add(new V3(-0.3, 0.1, -6)), fov: portrait ? 78 : 64 },
      { p: W(0.225), pos: PORTAL.clone().add(new V3(-0.2, 0.15, -1.4)), look: s1.look.clone(), fov: portrait ? 58 : 46 },
      { p: W(0.29), ...s1 }, { p: W(0.37), ...s1b },
      { p: W(0.445), pos: s1b.pos.clone().lerp(s2.pos, 0.55).add(new V3(-0.4, 4.4, 0)), look: s2.look.clone().add(new V3(-0.6, 0.2, 0)), fov: s2.fov + 6 },
      { p: W(0.505), ...s2 }, { p: W(0.575), ...s2b },
      { p: W(0.65), pos: s2b.pos.clone().lerp(s3.pos, 0.5).add(new V3(0, 4.4, 0)), look: s3.look.clone().add(new V3(0.6, 0.3, 0)), fov: s3.fov + 8 },
      { p: 0.495, ...s3 }, { p: 0.515, ...s3b },
      ...tour,
      { p: 0.84, pos: new V3(5.6, 2.4, -24), look: new V3(0, 0.3, -31), fov: portrait ? 60 : 46 },
      { p: 1.0, pos: new V3(portrait ? 9 : 8, 4.6, -3.5), look: new V3(0, -0.2, -20), fov: portrait ? 62 : 42 },
    ];
    keys = k;
    curvePos = new THREE.CatmullRomCurve3(k.map(x => x.pos), false, 'centripetal');
    curveLook = new THREE.CatmullRomCurve3(k.map(x => x.look), false, 'centripetal');
  }
  function sample(p) {
    p = clamp(p, 0, 1);
    let i = 0; while (i < keys.length - 2 && p > keys[i + 1].p) i++;
    const a = keys[i], b = keys[i + 1], t = range(p, a.p, b.p);
    const e = t * t * (3 - 2 * t) * 0.5 + t * 0.5; // мягче на стыках, но без остановок
    const u = (i + e) / (keys.length - 1);
    return { pos: curvePos.getPoint(u), look: curveLook.getPoint(u), fov: lerp(a.fov, b.fov, e) };
  }

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    buildKeys();
  }
  resize(); addEventListener('resize', resize);
  ScrollTrigger.addEventListener('refresh', buildKeys); // кадрирование пересчитывается вместе с позициями прокрутки

  // ---------- курсор ----------
  const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  const FINE = finePointer();
  let touchOn = false, tiltX = 0, tiltY = 0, hasTilt = false;
  if (FINE) addEventListener('pointermove', e => { ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = e.clientY / innerHeight * 2 - 1; }, { passive: true });
  else if (!RM) {
    // палец по экрану поворачивает компьютер и двигает свет; отпустили — возвращается
    addEventListener('pointerdown', e => { touchOn = true; ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = e.clientY / innerHeight * 2 - 1;
      // тап по первому экрану (не по кнопке) — разряд молнии
      if (pCur < W(0.06) && !e.target.closest('a,button')) { strikeAt = time; nextStrike = time + 7; bgMat.uniforms.boltX.value = clamp(e.clientX / innerWidth, 0.15, 0.85); bgMat.uniforms.seed.value = Math.random() * 10; }
    }, { passive: true });
    addEventListener('pointermove', e => { if (touchOn) { ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = e.clientY / innerHeight * 2 - 1; } }, { passive: true });
    addEventListener('pointerup', () => { touchOn = false; }, { passive: true });
    addEventListener('pointercancel', () => { touchOn = false; }, { passive: true });
    // наклон телефона (Android сразу; на iOS — если браузер даёт доступ)
    addEventListener('deviceorientation', e => { if (e.gamma == null) return; hasTilt = true; tiltX = clamp(e.gamma / 25, -1, 1); tiltY = clamp((e.beta - 50) / 25, -1, 1); }, { passive: true });
  }

  // ---------- кадр ----------
  const camRight = new V3(), camUp = new V3(), tmp = new V3();
  let lastSnap = -1, time = 0, strikeAt = -10, nextStrike = 1.6;
  onFrame((dt, now) => {
    if (document.hidden) return;
    time += dt;
    if (RM) {
      const s = snap(pT >= 0.9 ? 1 : pT); const target = pT >= 0.9 ? 1 : s;
      if (target !== lastSnap) { lastSnap = target; pCur = target; renderer.domElement.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240 }); }
    } else pCur = STATE.p; // сглаживание даёт scrub таймлайна
    updateCaps();
    if (!renderOn) return;

    if (!FINE && !touchOn) {
      // без касания: наклон телефона или медленный «облёт» света, чтобы сцена жила и на телефоне
      ptr.x = hasTilt ? tiltX : Math.sin(time * 0.45) * 0.75;
      ptr.y = hasTilt ? tiltY : Math.sin(time * 0.31) * 0.35;
    }
    ptr.sx = lerp(ptr.sx, ptr.x, 1 - Math.exp(-dt * 4)); ptr.sy = lerp(ptr.sy, ptr.y, 1 - Math.exp(-dt * 4));
    const c = sample(pCur);
    // курсорный параллакс поверх основного движения
    camera.position.copy(c.pos); camera.lookAt(c.look); camera.updateMatrixWorld();
    camRight.setFromMatrixColumn(camera.matrixWorld, 0); camUp.setFromMatrixColumn(camera.matrixWorld, 1);
    const near = range(pCur, W(0.13), W(0.2)) * (1 - range(pCur, W(0.2), W(0.24))); // у проёма параллакс гасим
    const par = (RM ? 0 : 1) * (1 - near) * 0.14;
    camera.position.addScaledVector(camRight, ptr.sx * par).addScaledVector(camUp, -ptr.sy * par * 0.7);
    // толчок камеры к экрану при открытии кейса
    if (push.v > 0.001 && caseTarget && screens[caseTarget]) {
      screens[caseTarget].screen.getWorldPosition(tmp);
      camera.position.lerp(tmp, push.v * 0.55);
    }
    camera.lookAt(c.look);
    if (STATE.roll) camera.rotateZ(STATE.roll * 0.17);
    camera.fov = c.fov - push.v * 6; camera.updateProjectionMatrix();

    // Z: лёгкий поворот за курсором, свет скользит по граням
    const calm = 1 - range(pCur, W(0.07), W(0.14));
    zGroup.rotation.y = lerp(zGroup.rotation.y, ptr.sx * 0.38 * calm + Math.sin(time * 0.35) * 0.12 * calm, 0.08);
    zGroup.rotation.x = lerp(zGroup.rotation.x, ptr.sy * 0.22 * calm + Math.cos(time * 0.27) * 0.04 * calm, 0.08);
    cursor3d.rotation.y = Math.sin(time * 0.9) * 0.5; cursor3d.position.y = -0.75 + Math.sin(time * 1.3) * 0.08;
    bgMat.uniforms.t.value = time; bgMat.uniforms.p.value = pCur;
    // экран монитора: рисуем ~30 к/с, пока он виден; растворяется перед влётом
    const screenOn = 1 - range(pCur, W(0.1), W(0.15));
    screenMat.opacity = screenOn; screenPlane.visible = screenOn > 0.01;
    if (screenPlane.visible && time - lastDraw > 1 / 30) { lastDraw = time; drawScreen(RM ? 99 : time); }
    // молния: редкие разряды на первом экране + удар в монитор в момент влёта (привязан к STATE.flare)
    let b = 0;
    if (!RM && !LITE) {
      if (pCur < W(0.06)) {
        if (time > nextStrike) { strikeAt = time; nextStrike = time + 7 + Math.random() * 4; bgMat.uniforms.boltX.value = 0.2 + Math.random() * 0.6; bgMat.uniforms.seed.value = Math.random() * 10; }
        const k = time - strikeAt;
        b = k < 0 ? 0 : k < 0.05 ? k / 0.05 : k < 0.08 ? 1 - (k - 0.05) / 0.03 * 0.8 : k < 0.12 ? 0.2 + (k - 0.08) / 0.04 * 0.7 : Math.max(0, 0.9 * (1 - (k - 0.12) / 0.3));
      }
      if (STATE.flare > 0.01) { b = Math.max(b, STATE.flare); bgMat.uniforms.boltX.value = 0.5; }
    }
    bgMat.uniforms.bolt.value = b;
    boltLight.intensity = b * 7;
    scene.environmentIntensity = 1 + b * 1.2;
    sweep.position.x = Math.sin(time * 0.45) * 6.5 + ptr.sx * 2;
    sweep.position.y = 3 + Math.cos(time * 0.3) * 1.2;
    scene.environmentRotation.y = time * 0.12 + ptr.sx * 0.5;
    scene.environmentRotation.x = ptr.sy * 0.15;
    // финал: Z в конце коридора подсвечивается
    zMat.emissive.setRGB(0.25, 0.14, 0.04).multiplyScalar(range(pCur, 0.88, 1) + STATE.flare * 2.6);


    // видео подгружаются, когда камера рядом
    for (const s of allScreens) {
      const [a, b] = s.win;
      if (pCur > a - 0.1) s.ensure();
      s.setActive((pCur > a && pCur < b) || pCur > 0.88);
    }
    // показ роликов: ролик в фокусе крупнее и ярче, остальные приглушены; звук гаснет, когда уходим с ролика
    const focus = TOUR.find(t => pCur > t.p - 0.026 && pCur < t.p + 0.026);
    let soundChanged = false;
    for (const id of TOUR_IDS) {
      const sc = screens[id], on = !focus || focus.id === id;
      sc.dim = lerp(sc.dim, on ? 1 : 0.22, 0.12); sc.mat.color.setScalar(sc.dim);
      const sTarget = focus && focus.id === id ? 1.07 : 1; sc.group.scale.setScalar(lerp(sc.group.scale.x, sTarget, 0.1));
      if (sc.el && !sc.el.muted && !(focus && focus.id === id)) { sc.el.muted = true; soundChanged = true; }
    }
    if (soundChanged) syncSound();

    renderer.render(scene, camera);
  });

  // быстрый старт: первый кадр сразу, ролик первой работы — после загрузки страницы
  addEventListener('load', () => setTimeout(() => screens.multitarjima.ensure(), 600));
}
