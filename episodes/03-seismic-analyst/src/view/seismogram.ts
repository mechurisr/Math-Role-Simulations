// 지진 기록 판독: 기록을 그리고 P·S 마커를 끌거나 ◀ ▶ 버튼으로 0.1 s씩 옮긴다 (FR-003, research R4).
// 360px에서 23 s 구간이면 1 s ≈ 14 px라 버튼이 주된 정밀 조작 수단이다
import { tr } from '@series/engine/i18n';
import { byId as $, type CanvasSize, type ThemeColors } from '@series/engine/ui';
import { amplitude, readSp, snapTenth, type Seismogram } from '../model/seismogram';
import { bindPointerDrag } from './drag';

export type Marker = 'p' | 's';
const PAD = 14;

export function createSeismogram(canvas: HTMLCanvasElement, onChange: () => void) {
  const cx = canvas.getContext('2d')!;
  let rec: Seismogram | null = null, m = { p: 0, s: 0 }, grab: Marker = 'p', locked = false;
  const tToX = (t: number, w: number) => PAD + t / rec!.end * (w - 2 * PAD);
  const xToT = (x: number, w: number) => (x - PAD) / (w - 2 * PAD) * rec!.end;
  const clamp = (t: number) => Math.min(rec!.end, Math.max(0, snapTenth(t)));
  function set(k: Marker, t: number) { if (!rec || locked) return; m[k] = clamp(t); onChange(); }

  bindPointerDrag(canvas, (x, _y, start) => {
    if (!rec || locked) return;
    const t = xToT(x, canvas.getBoundingClientRect().width);
    // 누르는 순간 더 가까운 마커를 잡고, 끄는 동안 그 마커만 움직임
    if (start) grab = Math.abs(t - m.p) <= Math.abs(t - m.s) ? 'p' : 's';
    set(grab, t);
  });
  for (const k of ['p', 's'] as Marker[]) {
    $(`${k}Minus`).onclick = () => set(k, m[k] - 0.1);
    $(`${k}Plus`).onclick = () => set(k, m[k] + 0.1);
  }

  function draw(size: CanvasSize, C: ThemeColors) {
    if (!rec || size.w < 60 || size.h < 60) return;   // 숨겨진 캔버스(크기 0)는 그리지 않음
    const { w, h, d } = size, mid = h * 0.45, amp = h * 0.38;
    cx.setTransform(d, 0, 0, d, 0, 0); cx.fillStyle = C.panel; cx.fillRect(0, 0, w, h);
    // 시간 눈금: 1 s마다, 5 s마다 숫자
    const font = getComputedStyle(document.body).fontFamily;
    cx.font = '11px ' + font; cx.textAlign = 'center';
    const ay = h - 22;
    cx.strokeStyle = C.line; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(PAD, ay); cx.lineTo(w - PAD, ay); cx.stroke();
    for (let t = 0; t <= rec.end + 1e-9; t += 1) {
      const x = tToX(t, w); cx.fillStyle = C.muted; cx.fillRect(x, ay, 1, t % 5 === 0 ? 6 : 3);
      if (t % 5 === 0) cx.fillText(String(t), x, ay + 16);
    }
    // 기록 선
    cx.strokeStyle = C.ink; cx.lineWidth = 1.2; cx.beginPath();
    const n = Math.max(200, Math.round(w * 2));
    for (let i = 0; i <= n; i++) { const t = i / n * rec.end, y = mid - amplitude(rec, t) * amp; i ? cx.lineTo(tToX(t, w), y) : cx.moveTo(tToX(t, w), y); }
    cx.stroke();
    // 마커
    const mark = (k: Marker, color: string) => {
      const x = tToX(m[k], w);
      cx.strokeStyle = color; cx.lineWidth = 2.5; cx.beginPath(); cx.moveTo(x, 4); cx.lineTo(x, ay); cx.stroke();
      cx.fillStyle = color; cx.beginPath(); cx.arc(x, 12, 9, 0, 7); cx.fill();
      cx.fillStyle = C.panel; cx.font = 'bold 11px ' + font; cx.fillText(k.toUpperCase(), x, 16);
    };
    mark('p', C.blue); mark('s', C.accent);
  }

  function note() {
    if (!rec) return '';
    const sp = readSp(m.p, m.s);
    $('pV').textContent = m.p.toFixed(1) + ' s'; $('sV').textContent = m.s.toFixed(1) + ' s';
    for (const id of ['pMinus', 'pPlus', 'sMinus', 'sPlus']) $<HTMLButtonElement>(id).disabled = locked;
    return 'S-P = ' + (sp === 'invalid' ? tr('S가 P보다 뒤에 와야 합니다', 'S must come after P') : sp.toFixed(1) + ' s');
  }

  return {
    draw, note,
    // 새 기록을 열 때 마커를 처음 위치로 (P는 앞쪽, S는 끝쪽)
    load(r: Seismogram) { rec = r; m = { p: 1, s: snapTenth(r.end - 1) }; locked = false; },
    markers: () => ({ ...m }),
    // 판독이 통과하면 정답 위치로 맞추고 더 움직이지 않음 (중간값 확정 규칙)
    confirm() { if (!rec) return; m = { p: rec.pArrival, s: rec.sArrival }; locked = true; onChange(); },
  };
}
