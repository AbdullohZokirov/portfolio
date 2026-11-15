import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// Маленький пружинный движок по мотивам DesignBookmark Motion Studies:
// пружина задаётся «жёсткостью и затуханием», один общий rAF-цикл.
export function S(x, k = 300, c = 26) { return { x, v: 0, t: x, k, c }; }
export function step(s, dt) {
  const n = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / n;
  for (let i = 0; i < n; i++) {
    const a = -s.k * (s.x - s.t) - s.c * s.v;
    s.v += a * h; s.x += s.v * h;
  }
  if (Math.abs(s.x - s.t) < 1e-4 && Math.abs(s.v) < 1e-4) { s.x = s.t; s.v = 0; }
}
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = t => t * t * (3 - 2 * t);
export const range = (v, a, b) => clamp((v - a) / (b - a), 0, 1);

const subs = new Set();
let last = 0, running = false;
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
  last = now;
  subs.forEach(f => f(dt, now / 1000));
  if (subs.size) requestAnimationFrame(tick); else running = false;
}
export function onFrame(f) {
  subs.add(f);
  if (!running) { running = true; last = performance.now(); requestAnimationFrame(tick); }
  return () => subs.delete(f);
}

// Magnetic button (DesignBookmark): внутри радиуса кнопка тянется к курсору,
// подпись — чуть сильнее, чтобы ощущалась глубина. Вне радиуса — пружиной назад.
export function magnetic(el, { radius = 120, pull = 0.32 } = {}) {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const label = el.querySelector('[data-mag-label]') || el.firstElementChild;
  const bx = S(0, 170, 13), by = S(0, 170, 13), lx = S(0, 220, 15), ly = S(0, 220, 15), sc = S(1, 400, 18);
  let px = null, py = null, idle = 0;
  addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; }, { passive: true });
  el.addEventListener('pointerdown', () => { sc.t = 0.94; });
  el.addEventListener('pointerup', () => { sc.t = 1; sc.v = 3; });
  onFrame(dt => {
    if (px === null) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2 - bx.x, cy = r.top + r.height / 2 - by.x;
    const dx = px - cx, dy = py - cy, d = Math.hypot(dx, dy);
    const k = d < radius ? 1 - d / radius * 0.35 : 0;
    bx.t = dx * pull * k; by.t = dy * (pull + 0.06) * k;
    lx.t = dx * 0.14 * k; ly.t = dy * 0.18 * k;
    if (sc.t >= 1) sc.t = 1 + 0.05 * k;
    [bx, by, lx, ly, sc].forEach(s => step(s, dt));
    const moving = Math.abs(bx.x) + Math.abs(by.x) > 0.05 || k > 0;
    if (!moving && ++idle > 2) return; idle = 0;
    el.style.transform = `translate(${bx.x.toFixed(2)}px,${by.x.toFixed(2)}px) scale(${sc.x.toFixed(4)})`;
    if (label && label !== el) label.style.transform = `translate(${lx.x.toFixed(2)}px,${ly.x.toFixed(2)}px)`;
  });
}

// Плавная прокрутка: Lenis + ScrollTrigger (колесо, тачпад; на тач-экранах — нативный свайп).
export function smoothScroll() {
  gsap.registerPlugin(ScrollTrigger);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !Lenis) return null;
  const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9, smoothWheel: true, syncTouch: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}
export function scrollToY(lenis, y, duration = 1.6) {
  if (lenis) lenis.scrollTo(y, { duration, easing: t => 1 - Math.pow(1 - t, 4) });
  else window.scrollTo({ top: y, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}
