// Объёмная монограмма Z: контур, экструзия с фаской. Общая для «Кино» и «Галереи».
import * as THREE from 'three';

export function zShape() {
  const s = new THREE.Shape();
  const t = 0.52; // толщина горизонталей
  s.moveTo(-1, 1.2); s.lineTo(1, 1.2); s.lineTo(1, 1.2 - t);
  s.lineTo(-0.38, -1.2 + t); s.lineTo(1, -1.2 + t); s.lineTo(1, -1.2);
  s.lineTo(-1, -1.2); s.lineTo(-1, -1.2 + t); s.lineTo(0.38, 1.2 - t);
  s.lineTo(-1, 1.2 - t); s.closePath();
  return s;
}

export function zGeometry({ depth = 0.5, bevel = 0.07, segments = 6 } = {}) {
  const g = new THREE.ExtrudeGeometry(zShape(), {
    depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: segments, curveSegments: 4,
  });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  return g;
}

// Рамка экрана: скруглённый прямоугольник с проёмом. Камера пролетает сквозь проём к работам.
function rrect(path, w, h, r) {
  const x = -w / 2, y = -h / 2;
  path.moveTo(x + r, y); path.lineTo(x + w - r, y); path.quadraticCurveTo(x + w, y, x + w, y + r);
  path.lineTo(x + w, y + h - r); path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  path.lineTo(x + r, y + h); path.quadraticCurveTo(x, y + h, x, y + h - r);
  path.lineTo(x, y + r); path.quadraticCurveTo(x, y, x + r, y);
  return path;
}
export function frameGeometry({ w = 2.8, h = 4.4, r = 0.5, border = 0.26, depth = 0.42, bevel = 0.12, segments = 10 } = {}) {
  const outer = rrect(new THREE.Shape(), w, h, r);
  outer.holes.push(rrect(new THREE.Path(), w - border * 2, h - border * 2, Math.max(0.05, r - border * 0.6)));
  const g = new THREE.ExtrudeGeometry(outer, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.9, bevelSegments: segments, curveSegments: 24 });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  return g;
}

// Текстура со скруглённым прямоугольником — маска для экранов.
export function roundedMask(w = 512, h = 512, r = 0.08) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); const R = Math.min(w, h) * r;
  x.fillStyle = '#000'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff';
  x.beginPath(); x.roundRect(2, 2, w - 4, h - 4, R); x.fill();
  const tex = new THREE.CanvasTexture(c); return tex;
}

export function glowTexture(color = '#ffffff') {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d'); const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, color); g.addColorStop(0.35, color + '55'); g.addColorStop(1, color + '00');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
