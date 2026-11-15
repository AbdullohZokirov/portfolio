// Плеер по мотивам Glass player (Kokonut UI) + Scrubber (SmoothUI).
// Видео стартует без звука, звук включается только вручную.
const ICON = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>',
  muted: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
  sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 010 7M18.6 6a8.5 8.5 0 010 12" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
};
const fmt = s => { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

export function attachPlayer(video, host, { label = 'Видео', compact = false } = {}) {
  video.muted = true; video.playsInline = true; video.setAttribute('playsinline', '');
  const bar = document.createElement('div');
  bar.className = 'zp' + (compact ? ' zp-compact' : '');
  bar.innerHTML = `
    <button class="zp-btn zp-play" type="button" aria-label="Пауза">${ICON.pause}</button>
    <div class="zp-track" role="slider" tabindex="0" aria-label="Перемотка: ${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <div class="zp-rail"><div class="zp-fill"></div></div><div class="zp-knob"></div>
    </div>
    <span class="zp-time" aria-hidden="true">0:00</span>
    <button class="zp-btn zp-sound" type="button" aria-pressed="false">${ICON.muted}<span>Звук</span></button>`;
  host.appendChild(bar);
  const play = bar.querySelector('.zp-play'), snd = bar.querySelector('.zp-sound');
  const track = bar.querySelector('.zp-track'), fill = bar.querySelector('.zp-fill'), knob = bar.querySelector('.zp-knob'), time = bar.querySelector('.zp-time');

  const syncPlay = () => { const p = video.paused; play.innerHTML = p ? ICON.play : ICON.pause; play.setAttribute('aria-label', p ? 'Смотреть' : 'Пауза'); };
  const syncSound = () => { const m = video.muted; snd.innerHTML = (m ? ICON.muted : ICON.sound) + `<span>${m ? 'Звук' : 'Звук вкл.'}</span>`; snd.setAttribute('aria-pressed', String(!m)); snd.setAttribute('aria-label', m ? 'Включить звук' : 'Выключить звук'); };
  const syncTime = () => {
    const d = video.duration || 0, r = d ? video.currentTime / d : 0;
    fill.style.transform = `scaleX(${r})`; knob.style.left = `${r * 100}%`;
    track.setAttribute('aria-valuenow', Math.round(r * 100)); time.textContent = fmt(video.currentTime);
  };
  play.addEventListener('click', () => { video.paused ? video.play().catch(() => {}) : video.pause(); });
  snd.addEventListener('click', () => { video.muted = !video.muted; if (!video.muted) { video.volume = 1; video.play().catch(() => {}); } });
  video.addEventListener('play', syncPlay); video.addEventListener('pause', syncPlay);
  video.addEventListener('volumechange', syncSound); video.addEventListener('timeupdate', syncTime);

  let drag = false;
  const seek = x => { const r = track.getBoundingClientRect(); const k = Math.min(1, Math.max(0, (x - r.left) / r.width)); if (video.duration) video.currentTime = k * video.duration; syncTime(); };
  track.addEventListener('pointerdown', e => { drag = true; track.setPointerCapture(e.pointerId); bar.classList.add('is-scrub'); seek(e.clientX); });
  track.addEventListener('pointermove', e => drag && seek(e.clientX));
  track.addEventListener('pointerup', () => { drag = false; bar.classList.remove('is-scrub'); });
  track.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') video.currentTime = Math.min(video.duration || 0, video.currentTime + 5);
    else if (e.key === 'ArrowLeft') video.currentTime = Math.max(0, video.currentTime - 5);
    else return; e.preventDefault();
  });
  syncPlay(); syncSound();
  return { bar, sync() { syncPlay(); syncSound(); syncTime(); } };
}
