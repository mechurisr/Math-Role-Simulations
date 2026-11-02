// v–힘 그래프: 필요한 힘과 낼 수 있는 힘 곡선, 교점, 최고 속도 선
import { tr } from '@series/engine/i18n';
import { drawAxes, drawCurve, linearScale, type CanvasSize, type ThemeColors } from '@series/engine/ui';
import { TOP_SPEED_KMH } from '../model/constants';
import { availableForce, kmhToMs, requiredForce, type CornerValues } from '../model/corner';
import type { GraphRange } from '../model/graph-range';

export const graphNote = (g: GraphRange) => g.state === 'noCrossing' ? tr('교점 없음 (한계 없음)', 'No crossing (no limit)')
  : g.state === 'offAxis' ? tr('교점이 축 밖 (1000 km/h 너머)', 'Crossing is off the axis (beyond 1000 km/h)')
  : g.crossingKmh! > TOP_SPEED_KMH ? tr('교점이 최고 속도 너머', 'Crossing is past the top speed')   // spec: 최고 속도를 넘는 한계는 숫자로 보이지 않음
  : tr('교점 ', 'Crossing ') + g.crossingKmh!.toFixed(1) + ' km/h';

export function drawGraph(cx: CanvasRenderingContext2D, size: CanvasSize, C: ThemeColors, c: CornerValues, g: GraphRange) {
  const { w, h, d } = size, b = { left: 44, top: 10, right: w - 10, bottom: h - 26 };
  cx.setTransform(d, 0, 0, d, 0, 0); cx.clearRect(0, 0, w, h);
  const req = (x: number) => requiredForce(kmhToMs(x), c.radius) / 1000, avail = (x: number) => availableForce(kmhToMs(x), c.mu, c.k) / 1000;
  const top = Math.max(req(g.xMaxKmh), avail(g.xMaxKmh)) * 1.05;
  const sx = linearScale(0, g.xMaxKmh, b.left, b.right), sy = linearScale(0, top, b.bottom, b.top);
  drawAxes(cx, b, C.muted);
  cx.setLineDash([4, 4]); cx.strokeStyle = C.muted; cx.beginPath(); cx.moveTo(sx(TOP_SPEED_KMH), b.top); cx.lineTo(sx(TOP_SPEED_KMH), b.bottom); cx.stroke(); cx.setLineDash([]);
  drawCurve(cx, 0, g.xMaxKmh, 60, req, sx, sy, C.accent);
  drawCurve(cx, 0, g.xMaxKmh, 60, avail, sx, sy, C.blue);
  cx.fillStyle = C.ink; cx.font = '11px "IBM Plex Mono",monospace';
  cx.fillText('0', b.left - 10, b.bottom + 13); cx.fillText(TOP_SPEED_KMH + '', sx(TOP_SPEED_KMH) - 10, b.bottom + 13);
  cx.fillText(g.xMaxKmh.toFixed(0) + ' km/h', Math.max(sx(TOP_SPEED_KMH) + 18, b.right - 58), b.bottom + 24 - 11);
  cx.fillText((top).toFixed(0), 4, b.top + 10); cx.fillText('kN', 4, b.top + 24);
  if (g.crossingKmh === null) return;
  const x = sx(g.crossingKmh), y = sy(req(g.crossingKmh));
  cx.fillStyle = C.ink; cx.beginPath(); cx.arc(x, y, 4.5, 0, 7); cx.fill();
}
