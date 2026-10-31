// 위에서 본 코너. 반지름의 상대적 크기만 보여 주는 도식이며 축척은 맞지 않음
import type { CanvasSize, ThemeColors } from '@series/engine/ui';
import { tr } from '@series/engine/i18n';

const R_MIN = 40, R_MAX = 200;   // 슬라이더 범위 (m)
export const ENTRY = 0.35;       // 코너 진입 구간: 표시되는 필요한 힘이 0에서 실제 값까지 오르는 비율 (표현일 뿐 판정에 안 씀, research R4)

// 표시되는 힘의 비율: 진입 구간에서 0 → 1
export const rampAt = (p: number) => Math.min(1, p / ENTRY);
// 힘이 ratio(낼 수 있는 힘 / 필요한 힘)에 닿는 진행도. 여기서 접선으로 미끄러짐
export const slipAt = (ratio: number) => Math.min(1, ratio) * ENTRY;

export interface SceneRun { p: number; slipP: number | null; slide: number }   // p: 호 위 진행도 0~1, slide: 미끄러진 거리 비율

export function drawScene(cx: CanvasRenderingContext2D, size: CanvasSize, C: ThemeColors, radius: number, run: SceneRun | null) {
  const { w, h, d } = size;
  cx.setTransform(d, 0, 0, d, 0, 0); cx.fillStyle = C.sky; cx.fillRect(0, 0, w, h);
  const ox = w * .12, oy = h * .94, span = Math.min(w * .78, h * .82);
  const R = span * (.42 + .58 * (radius - R_MIN) / (R_MAX - R_MIN)), lane = 30;
  // 도로: 중심 (ox, oy), 각도 0(오른쪽)에서 -90°(위)까지 도는 호와 앞뒤 직선
  cx.lineCap = 'butt'; cx.lineWidth = lane; cx.strokeStyle = C.ground;
  cx.beginPath(); cx.moveTo(ox + R, h + 20); cx.lineTo(ox + R, oy); cx.arc(ox, oy, R, 0, -Math.PI / 2, true); cx.lineTo(ox - 30, oy - R); cx.stroke();
  cx.lineWidth = 1; cx.setLineDash([6, 7]); cx.strokeStyle = C.ink;
  cx.beginPath(); cx.arc(ox, oy, R, 0, -Math.PI / 2, true); cx.stroke(); cx.setLineDash([]);
  // 반지름 표시
  cx.strokeStyle = C.muted; cx.beginPath(); cx.moveTo(ox, oy); cx.lineTo(ox + R * Math.SQRT1_2, oy - R * Math.SQRT1_2); cx.stroke();
  cx.fillStyle = C.ink; cx.font = '500 14px "IBM Plex Mono",monospace'; cx.fillText('r = ' + radius + ' m', ox + 36, oy - 8);
  cx.fillStyle = C.muted; cx.font = '11px "IBM Plex Sans KR",sans-serif'; cx.fillText(tr('도식 (축척 아님)', 'Schematic, not to scale'), 8, 16);
  if (!run) { car(cx, ox + R, oy, -Math.PI / 2, C.accent); return; }
  const at = run.slipP ?? run.p, th = -at * Math.PI / 2, px = ox + R * Math.cos(th), py = oy + R * Math.sin(th), head = th - Math.PI / 2;
  if (run.slipP === null) { car(cx, px, py, head, C.accent); return; }
  // 그 지점의 접선 방향으로 곧게 미끄러짐
  const dist = run.slide * (w + h), x = px + dist * Math.cos(head), y = py + dist * Math.sin(head);
  cx.strokeStyle = C.bad; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(px, py); cx.lineTo(x, y); cx.stroke();
  car(cx, x, y, head + run.slide * .8, C.bad);
}

function car(cx: CanvasRenderingContext2D, x: number, y: number, heading: number, color: string) {
  cx.save(); cx.translate(x, y); cx.rotate(heading); cx.fillStyle = color;
  cx.beginPath(); cx.roundRect(-11, -6, 22, 12, 3); cx.fill();
  cx.fillStyle = '#fff'; cx.fillRect(3, -4, 4, 8);
  cx.restore();
}
