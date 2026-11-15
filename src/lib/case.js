// Кейс проекта: полноэкранный слой поверх сцены. Один компонент на все три варианта,
// оформление и анимации входа/выхода задаёт каждый вариант сам (hooks animateIn / animateOut).
import { PROJECTS, PERSON } from './data.js';
import { attachPlayer } from './player.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function createCase({ animateIn, animateOut, backLabel = 'Назад к работам', onClose, onContact } = {}) {
  const el = document.createElement('div');
  el.className = 'case';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'case-title');
  el.hidden = true;
  document.body.appendChild(el);
  let current = null, lastFocus = null, busy = false;

  function render(p) {
    const i = PROJECTS.indexOf(p), next = PROJECTS[(i + 1) % PROJECTS.length];
    const gal = p.gallery.map((src, k) => {
      const v = p.galleryVideos && p.galleryVideos[k];
      return v
        ? `<figure class="case-shot is-video"><video src="${v}" poster="${src}" muted loop playsinline preload="none" aria-label="${esc(p.name)}: ролик ${k + 1}"></video></figure>`
        : `<figure class="case-shot"><img src="${src}" alt="${esc(p.name)}: экран ${k + 1}" loading="lazy" decoding="async"></figure>`;
    }).join('');
    el.innerHTML = `
      <div class="case-scroll" data-case-scroll>
        <header class="case-top">
          <button class="case-back" type="button" data-case-close><span aria-hidden="true">←</span> ${backLabel}</button>
          <span class="case-count">${String(i + 1).padStart(2, '0')} / ${String(PROJECTS.length).padStart(2, '0')}</span>
        </header>
        <section class="case-hero">
          <div class="case-media" data-case-media style="--ratio:${p.ratio}">
            <video class="case-video" src="${p.video}" poster="${p.poster}" autoplay muted loop playsinline preload="metadata" aria-label="${esc(p.name)}: ролик"></video>
          </div>
          <div class="case-intro">
            <p class="case-kind" data-case-kind>${esc(p.kind)}</p>
            <h2 id="case-title" class="case-title" data-case-title>${esc(p.name)}</h2>
            <p class="case-role">${esc(p.role)}</p>
            <p class="case-summary">${esc(p.summary)}</p>
            <ul class="case-tags">${p.tags.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
            <div class="case-actions">
              ${p.link ? `<a class="case-btn case-btn-main" href="${p.link.href}" target="_blank" rel="noopener">${esc(p.link.label)} ↗</a>` : ''}
              ${p.full ? `<button class="case-btn" type="button" data-case-full>Весь ролик</button>` : ''}
            </div>
          </div>
        </section>
        <section class="case-steps" aria-label="Как это работает">
          <ol>${p.steps.map((s, k) => `<li><span class="case-step-n">${String(k + 1).padStart(2, '0')}</span><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p></li>`).join('')}</ol>
        </section>
        <section class="case-gallery" aria-label="Экраны проекта">${gal}</section>
        <footer class="case-foot">
          <button class="case-next" type="button" data-case-next="${next.id}"><span>Следующий проект</span><strong>${esc(next.name)} →</strong></button>
          <a class="case-btn case-btn-main" href="${PERSON.telegram}" target="_blank" rel="noopener" data-case-contact>Обсудить похожую задачу</a>
        </footer>
      </div>`;
    const video = el.querySelector('.case-video');
    attachPlayer(video, el.querySelector('[data-case-media]'), { label: p.name });
    el.querySelector('[data-case-full]')?.addEventListener('click', () => {
      video.src = p.full.src; video.poster = p.full.poster; video.loop = false;
      video.muted = false; video.currentTime = 0; video.play().catch(() => { video.muted = true; video.play(); });
    });
    // ролики галереи играют, только пока видны
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause()), { root: el.querySelector('[data-case-scroll]'), threshold: 0.4 });
    el.querySelectorAll('.case-shot video').forEach(v => io.observe(v));
  }

  async function open(p, ctx = {}) {
    if (busy) return; busy = true;
    if (typeof p === 'string') p = PROJECTS.find(x => x.id === p);
    lastFocus = document.activeElement;
    current = p; render(p);
    el.hidden = false; document.documentElement.classList.add('case-open');
    if (animateIn) await animateIn(el, ctx, p); else el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
    el.querySelector('[data-case-close]').focus({ preventScroll: true });
    busy = false;
  }
  async function close(ctx = {}) {
    if (busy || !current) return; busy = true;
    el.querySelectorAll('video').forEach(v => v.pause());
    if (animateOut) await animateOut(el, ctx, current); else await el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220 }).finished;
    el.hidden = true; el.innerHTML = ''; document.documentElement.classList.remove('case-open');
    const p = current; current = null; busy = false;
    onClose && onClose(p);
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
  }
  el.addEventListener('click', async e => {
    if (e.target.closest('[data-case-close]')) close();
    const n = e.target.closest('[data-case-next]');
    if (n) { await close({ quick: true }); open(n.dataset.caseNext, { quick: true }); }
    if (e.target.closest('[data-case-contact]') && onContact) onContact();
  });
  addEventListener('keydown', e => {
    if (!current) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') { // простая ловушка фокуса
      const f = [...el.querySelectorAll('button, a[href], [tabindex="0"]')].filter(x => x.offsetParent);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  return { el, open, close, get current() { return current; } };
}
