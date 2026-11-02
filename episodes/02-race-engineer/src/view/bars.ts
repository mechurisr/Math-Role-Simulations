// 필요한 힘과 낼 수 있는 힘을 같은 눈금의 막대로 표시
import { byId as $ } from '@series/engine/ui';

const kN = (n: number) => (n / 1000).toFixed(1) + ' kN';

// top: 막대 끝의 힘. 속도와 상관없이 고정해야 파랑 막대가 실제 힘과 같은 방향으로 움직임
export function drawBars(req: number, avail: number, top: number, shownReq = req) {
  const pct = (f: number) => Math.min(100, f / top * 100) + '%';
  $('barReq').style.width = pct(shownReq); $('barAvail').style.width = pct(avail);
  $('barReq').classList.toggle('over', shownReq > avail);
  $('reqV').textContent = kN(shownReq); $('availV').textContent = kN(avail);
}
