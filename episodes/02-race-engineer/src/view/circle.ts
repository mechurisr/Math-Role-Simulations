// 마찰원: 횡가속도 기준선을 따라 점을 끌어 제동 가속도를 고름. 슬라이더는 키보드용으로 같이 둠
import { tr } from '@series/engine/i18n';
import { byId as $, linearScale, type CanvasSize, type ThemeColors } from '@series/engine/ui';

export interface CircleView { radius: number; lateral: number; brake: number; inside: boolean }

export function drawCircle(cx: CanvasRenderingContext2D, size: CanvasSize, C: ThemeColors, c: CircleView) {
  const { w, h, d } = size, ox = w / 2, oy = h / 2, px = (Math.min(w, h) / 2 - 12) / (c.radius * 1.02);
  cx.setTransform(d, 0, 0, d, 0, 0); cx.clearRect(0, 0, w, h);
  cx.strokeStyle = C.muted; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(8, oy); cx.lineTo(w - 8, oy); cx.moveTo(ox, 4); cx.lineTo(ox, h - 4); cx.stroke();
  cx.strokeStyle = C.blue; cx.lineWidth = 2; cx.beginPath(); cx.arc(ox, oy, c.radius * px, 0, 7); cx.stroke();
  const x = ox + c.lateral * px, y = oy - c.brake * px;
  cx.setLineDash([4, 4]); cx.strokeStyle = C.accent; cx.beginPath(); cx.moveTo(x, 4); cx.lineTo(x, oy); cx.stroke(); cx.setLineDash([]);
  cx.fillStyle = c.inside ? C.good : C.bad; cx.beginPath(); cx.arc(x, y, 9, 0, 7); cx.fill();
  cx.fillStyle = C.ink; cx.font = '500 13px "IBM Plex Mono",monospace'; cx.textAlign = 'right'; cx.fillText(c.brake.toFixed(1), x - 14, y + 4); cx.textAlign = 'left';
}

export const circleNote = (c: CircleView) => tr('제동 ', 'Braking ') + c.brake.toFixed(1) + ' m/s² · ' + tr('횡가속도 ', 'Lateral ') + c.lateral.toFixed(1) + ' · ' + tr('원의 반지름 ', 'Circle radius ') + c.radius.toFixed(1) + ' · ' + (c.inside ? tr('원 안: 안정', 'Inside: stable') : tr('원 밖: 미끄러짐', 'Outside: sliding'));

// 끌기: 캔버스의 세로 위치를 제동값으로. touch-action:none이라 페이지가 스크롤되지 않음
export function bindCircleDrag(canvas: HTMLCanvasElement, radius: () => number, onBrake: (v: number) => void) {
  let dragging = false;
  const move = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect(), oy = r.height / 2, px = (Math.min(r.width, r.height) / 2 - 12) / (radius() * 1.02);
    onBrake(Math.max(0, linearScale(oy, oy - px, 0, 1)(e.clientY - r.top)));
  };
  canvas.addEventListener('pointerdown', e => { dragging = true; canvas.setPointerCapture(e.pointerId); move(e); });
  canvas.addEventListener('pointermove', e => { if (dragging) move(e); });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('pointercancel', () => { dragging = false; });
  $('brake').addEventListener('input', e => onBrake(+(e.target as HTMLInputElement).value));
}
