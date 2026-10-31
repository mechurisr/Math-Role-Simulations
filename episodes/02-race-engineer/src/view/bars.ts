// 필요한 힘과 낼 수 있는 힘을 같은 눈금의 막대로 표시
import { byId as $ } from '@series/engine/ui';

const kN = (n: number) => (n / 1000).toFixed(1) + ' kN';

export function drawBars(req: number, avail: number, shownReq = req) {
  const top = Math.max(req, avail) * 1.1;
  $('barReq').style.width = shownReq / top * 100 + '%'; $('barAvail').style.width = avail / top * 100 + '%';
  $('barReq').classList.toggle('over', shownReq > avail);
  $('reqV').textContent = kN(shownReq); $('availV').textContent = kN(avail);
}
