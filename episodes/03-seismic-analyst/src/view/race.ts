// M1 두 파의 경주: 위는 진앙에서 관측소까지 퍼지는 P·S 파면, 아래는 두 파의 도착 시각 막대 (FR-002).
// 값은 model/waves.ts에서만 계산한다. 그리기는 화면 표현이다.
import { tr } from '@series/engine/i18n';
import type { CanvasSize, ThemeColors } from '@series/engine/ui';
import { RACE_MAX_KM, VP, VS } from '../model/constants';
import { pArrival, sArrival, spTime } from '../model/waves';

const T_MAX = 90;   // 시간 축 끝 (s). 300 km에서 S파 도착 85.7 s가 들어가게

// t: 애니메이션 중인 지진 발생 뒤 시각 (s). null이면 다 끝난 상태(두 파 모두 도착)
export function drawRace(cx: CanvasRenderingContext2D, size: CanvasSize, C: ThemeColors, d: number, t: number | null) {
  const { w, h, d: dpr } = size;
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cx.fillStyle = C.panel; cx.fillRect(0, 0, w, h);
  const pad = 22, sceneH = h * 0.56, x0 = pad, x1 = w - pad, gy = sceneH * 0.62;
  const kmToX = (km: number) => x0 + km / RACE_MAX_KM * (x1 - x0);
  const sx = kmToX(d), tp = pArrival(d), ts = sArrival(d), now = t ?? ts + 1;

  // 땅과 거리 눈금
  cx.strokeStyle = C.line; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(x0, gy); cx.lineTo(x1, gy); cx.stroke();
  cx.fillStyle = C.muted; cx.font = '11px ' + getComputedStyle(document.body).fontFamily; cx.textAlign = 'center';
  for (let km = 0; km <= RACE_MAX_KM; km += 50) { const x = kmToX(km); cx.fillRect(x, gy, 1, 4); cx.fillText(String(km), x, gy + 15); }
  cx.textAlign = 'right'; cx.fillText('km', x1, gy + 28);

  // 파면: 진앙에서 반원으로 퍼짐. 관측소를 지나면 더 그리지 않음
  const front = (v: 'P' | 'S', color: string) => {
    const reach = Math.min(now * (v === 'P' ? VP : VS), d);
    if (reach <= 0) return;
    // 세로 반지름은 장면 높이로 줄인 타원 (땅 위 반쪽만): 앞쪽 끝이 관측소에 닿는 순간이 도착
    const rx = kmToX(reach) - x0, ry = Math.min(rx, gy - 8);
    cx.strokeStyle = color; cx.lineWidth = 2.5; cx.beginPath(); cx.ellipse(x0, gy, rx, ry, 0, Math.PI, 2 * Math.PI); cx.stroke();
    const a = Math.PI * 1.75;
    cx.fillStyle = color; cx.textAlign = 'center'; cx.fillText(v, x0 + rx * Math.cos(a) + 8, gy + ry * Math.sin(a) - 4);
  };
  front('S', C.accent); front('P', C.blue);

  // 진앙(별)과 관측소(삼각형)
  cx.fillStyle = C.bad; star(cx, x0, gy, 7);
  cx.fillStyle = C.ink; cx.beginPath(); cx.moveTo(sx, gy - 14); cx.lineTo(sx - 8, gy); cx.lineTo(sx + 8, gy); cx.closePath(); cx.fill();
  cx.textAlign = 'left'; cx.fillStyle = C.muted; cx.fillText(tr('진앙', 'Epicentre'), x0 - 6, gy - 12);
  cx.textAlign = 'center'; cx.fillText(tr('관측소', 'Station'), Math.min(Math.max(sx, x0 + 30), x1 - 20), gy - 20);

  // 아래: 시간 막대
  const ty = sceneH + (h - sceneH) * 0.45, tToX = (s: number) => x0 + s / T_MAX * (x1 - x0);
  cx.strokeStyle = C.line; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(x0, ty); cx.lineTo(x1, ty); cx.stroke();
  cx.fillStyle = C.muted; cx.textAlign = 'center';
  for (let s = 0; s <= T_MAX; s += 10) { const x = tToX(s); cx.fillRect(x, ty, 1, 4); if (s % 20 === 0) cx.fillText(String(s), x, ty + 15); }
  cx.textAlign = 'right'; cx.fillText(tr('지진 발생 뒤 시간 (s)', 'Time after the quake (s)'), x1, ty + 28);
  // 지금 시각 커서
  if (t !== null) { cx.fillStyle = C.ink; cx.fillRect(tToX(Math.min(t, T_MAX)) - 1, ty - 16, 2, 16); }
  const mark = (s: number, color: string, label: string) => {
    if (now < s) return;
    const x = tToX(s); cx.fillStyle = color; cx.fillRect(x - 1.5, ty - 18, 3, 18); cx.textAlign = 'center'; cx.fillText(label, x, ty - 22);
  };
  if (now >= ts && d > 0) {
    // S-P 구간
    cx.fillStyle = C.accent; cx.globalAlpha = .18; cx.fillRect(tToX(tp), ty - 12, tToX(ts) - tToX(tp), 12); cx.globalAlpha = 1;
  }
  mark(tp, C.blue, 'P'); mark(ts, C.accent, 'S');
}

function star(cx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  cx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; cx.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); }
  cx.closePath(); cx.fill();
}

// 캔버스 아래 숫자 줄 (e2e와 화면 읽기 프로그램이 읽음)
export const raceNote = (d: number) =>
  `P ${pArrival(d).toFixed(1)} s · S ${sArrival(d).toFixed(1)} s · ` + tr('S-P 시간', 'S-P time') + ` ${spTime(d).toFixed(1)} s`;
