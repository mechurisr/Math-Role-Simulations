// km 지도: 격자, 관측소, 원(범위 밖은 잘림), 교점(깜빡임), 직선, 후보 점 (FR-001, FR-004, FR-005).
// y는 위가 북쪽. 계산은 model/에서 하고 여기서는 그리기만
import { tr } from '@series/engine/i18n';
import type { CanvasSize, ThemeColors } from '@series/engine/ui';
import { intersect, type Circle, type Intersection } from '../model/circles';
import { COASTLINE } from '../model/coastline';
import type { Point } from '../model/constants';
import type { Line } from '../model/line';

export type Tone = 'a' | 'b' | 'c' | 'ink';
export interface MapStation { id: string; pos: Point; tone: Tone }
export interface MapCircle { circle: Circle; tone: Tone }
export interface MapLine { line: Line; tone: Tone; dashed?: boolean }
export interface MapPoint { p: Point; label?: string; kind: 'candidate' | 'cross' | 'answer'; state?: 'good' | 'bad' }
export interface MapScene {
  stations: MapStation[]; circles: MapCircle[]; lines?: MapLine[]; points?: MapPoint[];
  crossings?: [number, number];   // 교점을 깜빡여 보여 줄 두 원의 번호
  coast?: boolean;                 // M7: 해안선 층 (원점 35.0°N 128.0°E, model/geo.ts와 같은 환산)
  note?: string;                   // 지도 아래 문구 (교점 문구가 없을 때)
}
export interface MapView { x0: number; x1: number; y0: number; y1: number; grid: number }
export const FULL_VIEW: MapView = { x0: 0, x1: 200, y0: 0, y1: 200, grid: 20 };

const toneColor = (C: ThemeColors, t: Tone) => t === 'a' ? C.blue : t === 'b' ? C.accent : t === 'c' ? C.good : C.ink;

// 지도 사각형의 위치와 크기 (그리기와 탭 위치 변환이 같은 값을 씀)
const PAD = { L: 30, T: 8, R: 8, B: 24 };
const box = ({ w, h }: CanvasSize) => ({ ox: PAD.L, oy: PAD.T, side: Math.min(w - PAD.L - PAD.R, h - PAD.T - PAD.B) });

// 탭한 위치(캔버스 CSS px) → 지도 km. 지도 밖이면 null
export function pickAt(size: CanvasSize, px: number, py: number, view: MapView = FULL_VIEW): Point | null {
  const { ox, oy, side } = box(size);
  if (side <= 0 || px < ox || px > ox + side || py < oy || py > oy + side) return null;
  return { x: view.x0 + (px - ox) / side * (view.x1 - view.x0), y: view.y0 + (oy + side - py) / side * (view.y1 - view.y0) };
}

export function drawMap(cx: CanvasRenderingContext2D, size: CanvasSize, C: ThemeColors, scene: MapScene, view: MapView = FULL_VIEW) {
  const { w, h, d } = size, R = PAD.R, { ox, oy, side } = box(size);
  if (side <= 0) return;   // 숨겨진 캔버스(크기 0)는 그리지 않음
  const sx = (x: number) => ox + (x - view.x0) / (view.x1 - view.x0) * side;
  const sy = (y: number) => oy + side - (y - view.y0) / (view.y1 - view.y0) * side;
  const k = side / (view.x1 - view.x0);   // km → px
  cx.setTransform(d, 0, 0, d, 0, 0);
  cx.fillStyle = C.panel; cx.fillRect(0, 0, w, h);
  cx.fillStyle = scene.coast ? C.sky : C.bg; cx.fillRect(ox, oy, side, side);
  if (scene.coast) {
    // 육지: 바다보다 조금 진하게 (evenodd), 해안선은 얇은 선
    cx.save(); cx.beginPath(); cx.rect(ox, oy, side, side); cx.clip();
    cx.beginPath();
    for (const r of COASTLINE) { cx.moveTo(sx(r[0]), sy(r[1])); for (let i = 2; i < r.length; i += 2) cx.lineTo(sx(r[i]), sy(r[i + 1])); cx.closePath(); }
    cx.globalAlpha = 0.3; cx.fillStyle = C.ground; cx.fill('evenodd'); cx.globalAlpha = 1;
    cx.strokeStyle = C.ground2; cx.lineWidth = 1; cx.stroke();
    cx.restore();
  }
  const font = getComputedStyle(document.body).fontFamily;
  cx.font = '10px ' + font; cx.fillStyle = C.muted; cx.strokeStyle = C.line; cx.lineWidth = 1;
  for (let v = view.x0; v <= view.x1 + 1e-9; v += view.grid) {
    cx.beginPath(); cx.moveTo(sx(v), oy); cx.lineTo(sx(v), oy + side); cx.stroke();
    cx.textAlign = 'center'; cx.fillText(String(v), sx(v), oy + side + 12);
  }
  for (let v = view.y0; v <= view.y1 + 1e-9; v += view.grid) {
    cx.beginPath(); cx.moveTo(ox, sy(v)); cx.lineTo(ox + side, sy(v)); cx.stroke();
    cx.textAlign = 'right'; cx.fillText(String(v), ox - 4, sy(v) + 3);
  }
  cx.textAlign = 'right'; cx.fillText('km', w - R, oy + side + 22);

  // 지도 안만 그림: 범위 밖으로 나가는 원·직선은 가장자리에서 잘림 (spec 지도 범위)
  cx.save(); cx.beginPath(); cx.rect(ox, oy, side, side); cx.clip();
  for (const c of scene.circles) {
    cx.strokeStyle = toneColor(C, c.tone); cx.lineWidth = 2;
    cx.beginPath(); cx.arc(sx(c.circle.center.x), sy(c.circle.center.y), c.circle.r * k, 0, 2 * Math.PI); cx.stroke();
  }
  for (const l of scene.lines ?? []) drawLine(cx, l, toneColor(C, l.tone), view, sx, sy);
  if (scene.crossings) {
    const [i, j] = scene.crossings, r = intersect(scene.circles[i].circle, scene.circles[j].circle);
    const pts = r.count === 2 ? r.points : r.count === 1 ? [r.point] : [];
    const pulse = 5 + 3 * Math.sin(performance.now() / 180);   // 깜빡임
    cx.strokeStyle = C.bad; cx.lineWidth = 2.5;
    for (const p of pts) { cx.beginPath(); cx.arc(sx(p.x), sy(p.y), pulse, 0, 2 * Math.PI); cx.stroke(); }
  }
  for (const p of scene.points ?? []) {
    const x = sx(p.p.x), y = sy(p.p.y);
    cx.fillStyle = p.state === 'good' ? C.good : p.state === 'bad' ? C.bad : p.kind === 'answer' ? C.bad : C.ink;
    cx.beginPath(); cx.arc(x, y, p.kind === 'answer' ? 6 : 4, 0, 2 * Math.PI); cx.fill();
    if (p.label) { cx.font = 'bold 11px ' + font; cx.textAlign = 'left'; cx.fillText(p.label, x + 6, y - 5); }
  }
  for (const s of scene.stations) {
    const x = sx(s.pos.x), y = sy(s.pos.y);
    cx.fillStyle = toneColor(C, s.tone);
    cx.beginPath(); cx.moveTo(x, y - 9); cx.lineTo(x - 7, y + 5); cx.lineTo(x + 7, y + 5); cx.closePath(); cx.fill();
    cx.font = 'bold 12px ' + font; cx.textAlign = 'left'; cx.fillText(s.id, x + 8, y + 4);
  }
  cx.restore();
}

// 지도 범위로 자른 선분. b = 0이면 수직선
function drawLine(cx: CanvasRenderingContext2D, { line: { a, b, c }, dashed }: MapLine, color: string, v: MapView, sx: (x: number) => number, sy: (y: number) => number) {
  const pts: Point[] = [];
  if (Math.abs(b) > 1e-12) for (const x of [v.x0, v.x1]) pts.push({ x, y: (c - a * x) / b });
  if (Math.abs(a) > 1e-12) for (const y of [v.y0, v.y1]) pts.push({ x: (c - b * y) / a, y });
  if (pts.length < 2) return;
  cx.strokeStyle = color; cx.lineWidth = 2; cx.setLineDash(dashed ? [6, 4] : []);
  cx.beginPath(); cx.moveTo(sx(pts[0].x), sy(pts[0].y));
  for (const p of pts.slice(1)) cx.lineTo(sx(p.x), sy(p.y));
  cx.stroke(); cx.setLineDash([]);
}

// 교점 개수 문구 (FR-005, US2 시나리오 2)
export function crossingNote(r: Intersection) {
  if (r.count === 2) return tr('교점 2개', '2 crossings');
  if (r.count === 1) return tr('교점 1개 (두 원이 접함)', '1 crossing (the circles touch)');
  return r.reason === 'inside' ? tr('교점 없음 (한 원이 다른 원 안)', 'No crossing (one circle is inside the other)') : tr('교점 없음 (두 원이 떨어져 있음)', 'No crossing (the circles are apart)');
}
