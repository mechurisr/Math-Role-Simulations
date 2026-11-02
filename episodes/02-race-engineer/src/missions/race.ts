// M7 레이스 무전: 코너 5개를 한 단계에서 차례로. 규칙: model/race-radio.ts
import { P, tr } from '@series/engine/i18n';
import type { StepState } from '@series/engine/tutorial';
import { save } from '@series/engine/ui';
import type { RadioAnswer, Verdict } from '../model/judge';
import { CORNERS, cornerWork, judgeCorner, NO_LIMIT_CORNER, racePassed } from '../model/race-radio';
import { notesHtml } from '../view/notes';
import { workBox } from './basic';
import { limitFormula } from './downforce';
import type { Game, MissionStep } from './index';

const CH7 = P('7장 레이스', 'Ch.7 Race');
const WHY: Partial<Record<Verdict['reason'], () => string>> = {
  pass: () => tr('성공', 'Good'), slid: () => tr('미끄러짐', 'Slid'), tooSlow: () => tr('시간 손실', 'Lost time'),
  wantedNoLimit: () => tr('한계 없는 코너', 'No limit here'), tooHigh: () => tr('한계가 있는 코너', 'This corner has a limit'),
};
const setCorner = (g: Game, s: StepState) => { g.configure({ ...CORNERS[s.i], open: [] }); g.clearRadio(); };
const reset = (g: Game, s: StepState) => { s.i = 0; s.vs = []; s.answered = false; setCorner(g, s); };
const results = (s: StepState) => (s.vs as Verdict[]).map(v => v.ok);

function resultTable(s: StepState) {
  return '<table>' + (s.vs as Verdict[]).map((v, i) => `<tr><td>${tr('코너', 'Corner')} ${i + 1}</td><td class="${v.ok ? 'good' : 'bad'}">${v.ok ? '✓' : '✗'} ${WHY[v.reason]?.() ?? ''}</td></tr>`).join('') + '</table>';
}

// 중간값은 다음 줄을 손으로 따라가도 같은 값이 나오는 자릿수로 표시 (v를 둘째 자리로 줄이면 코너 2가 324.22가 되어 답과 어긋남)
function cornerSolution(i: number) {
  const w = cornerWork(CORNERS[i]), s = w.solved;
  const given = `r = ${w.radius} m, μ = ${w.mu}, k = ${w.k}. m/r = ${w.mOverR.toFixed(4)}, μk = ${w.muK.toFixed(2)}`;
  const head = `<p class="solution"><b>${tr('코너', 'Corner')} ${i + 1} ${tr('풀이', 'solution')}</b><br>${given}<br>`;
  if (!s) return head + tr(`m/r이 μk 이하입니다. 속도를 올려도 낼 수 있는 힘이 필요한 힘보다 늘 커서 <b>한계 없음</b>입니다. 경계 반지름은 m ÷ μk = ${w.boundary.toFixed(2)} m이고, 이 코너는 그보다 넓습니다.`, `m/r is μk or less. However fast you go, the force available stays above the force needed, so there is <b>no limit</b>. The boundary radius is m ÷ μk = ${w.boundary.toFixed(2)} m, and this corner is wider.`) + '</p>';
  return head + tr('m/r이 μk보다 커서 한계가 있습니다. 속도를 올리면 필요한 힘이 그립보다 빨리 늘어나기 때문입니다.', 'm/r is greater than μk, so there is a limit: as speed rises, the force needed grows faster than the grip.')
    + `<br>v² = ${s.muMg.toFixed(0)} ÷ ${s.gap.toFixed(4)} = ${s.v2.toFixed(1)}<br>v = √${s.v2.toFixed(1)} = ${s.ms.toFixed(3)} m/s<br>${s.ms.toFixed(3)} × 3.6 = <b>${s.kmh.toFixed(2)} km/h</b></p>`;
}
const solutions = (s: StepState) => (s.vs as Verdict[]).map((v, i) => v.ok ? '' : cornerSolution(i)).join('');

export const raceSteps = (g: Game): MissionStep[] => [
  { ch: CH7, title: P('레이스 전날 밤', 'The night before the race'), mission: 'M7',
    enter: () => g.configure({ radius: 60, surface: 'dry', wing: 'mid', open: [] }),
    body: () => '<p>' + tr('내일 레이스에서는 코너 다섯 개를 혼자 판단합니다. 코너마다 노면과 윙이 정해져 있습니다. 항력이 없는 이 모델에서는 윙이 높을수록 늘 유리해서, 윙은 팀이 정해 줍니다.', 'Tomorrow you judge five corners alone. Each has a set surface and wing. With no drag in this model more wing always helps, so the team sets the wing for you.') + '</p>'
      + '<p>' + tr('코너를 받으면 이 순서로 판단하세요.', 'For each corner, work in this order.') + '</p>'
      + '<table>'
      + `<tr><td>1</td><td>${tr('μ와 k를 확인합니다', 'Check μ and k')}</td></tr>`
      + `<tr><td>2</td><td>${tr('m/r과 μk를 비교합니다. m/r이 μk 이하이면 한계 없음입니다', 'Compare m/r with μk. If m/r is μk or less, there is no limit')}</td></tr>`
      + `<tr><td>3</td><td>${tr('아니면 v² = μmg ÷ (m/r − μk)를 계산합니다', 'Otherwise, v² = μmg ÷ (m/r − μk)')}</td></tr>`
      + `<tr><td>4</td><td>${tr('v²의 제곱근을 구해 v(m/s)를 얻고, 3.6을 곱해 km/h로 바꿉니다', 'Take the square root of v² to get v in m/s, then multiply by 3.6 for km/h')}</td></tr></table>`
      + '<p>' + tr('한계를 넘으면 차가 밀려납니다. 한계의 97%보다 낮게 부르면 시간을 잃어 실패입니다. 5개 중 4개를 맞혀야 하고, 한계가 없는 코너의 판단은 반드시 맞혀야 합니다.', 'Over the limit, the car slides. Below 97% of the limit, you lose time and it counts as a miss. You need four of five, and the no-limit corner must be right.') + '</p>' },
  { ch: CH7, title: P('M7 레이스 무전', 'M7 Race radio'), mission: 'M7', ctrl: true,
    enter: s => reset(g, s),
    radio: { label: P('그립 한계 속도', 'Grip limit speed'), unit: 'km/h', noLimit: true },
    radioHidden: s => !!s.answered || s.i >= CORNERS.length,
    target: () => [g.target('stage')],
    gate: s => !!s.ok, waitLabel: P('코너 5개를 끝내세요', 'Finish the five corners'), done: s => !!s.ok,
    on: {
      radio: (s, a) => {
        const v = judgeCorner(CORNERS[s.i], a as RadioAnswer);
        s.note = v.reason === 'invalid' ? tr('양수를 입력하거나 "한계 없음"을 고르세요.', 'Enter a positive number or pick "No limit".') : '';
        if (v.reason === 'invalid') return;
        (s.vs as Verdict[]).push(v); s.answered = true;
        g.drive((a as RadioAnswer).kind === 'number' ? Number((a as { raw: string }).raw) : 340, v.reason === 'slid' || v.reason === 'tooHigh');
      },
      act: (s, act) => {
        if (act === 'retry') { reset(g, s); return; }
        s.i++; s.answered = false;
        if (s.i < CORNERS.length) { setCorner(g, s); return; }
        s.ok = racePassed(results(s));
        save('race-engineer:m7', JSON.stringify(results(s)));
        g.configure({ open: [] });
      },
    },
    body: s => {
      if (s.i >= CORNERS.length) return resultTable(s) + solutions(s) + (s.ok ? `<p class="fb good">${tr('완주했습니다. 드라이버가 고맙다고 합니다.', 'Race finished. Your driver says thanks.')}</p>`
        : `<p class="fb bad">${(s.vs as Verdict[])[NO_LIMIT_CORNER].ok ? tr('코너 4개 이상 성공해야 합니다.', 'You need at least four corners.') : tr('코너 4의 판단을 맞혀야 합니다. 경계 반지름을 다시 생각해 보세요.', 'You must get corner 4 right. Think about the boundary radius again.')}</p><p><button class="act" data-act="retry">${tr('다시 하기', 'Try again')}</button></p>`);
      const last = (s.vs as Verdict[])[s.i];
      return `<p><b>${tr('코너', 'Corner')} ${s.i + 1} / ${CORNERS.length}</b></p>` + workBox(g, limitFormula(), ['v', 'mu', 'm', 'g', 'k', 'r']) + '<p>' + tr('드라이버가 묻습니다. 그립 한계 속도를 부르세요. 차의 최고 속도가 아니라 그립의 한계를 묻습니다. 한계가 없으면 "한계 없음"을 고르세요.', 'The driver asks. Call the grip limit speed: the limit of the grip, not the top speed of the car. If there is no limit, pick "No limit".') + '</p>'
        + '<p>' + tr('답은 km/h로 부르세요 (m/s × 3.6).', 'Call the answer in km/h (m/s × 3.6).') + '</p>'
        + (s.note ? `<p class="fb bad">${s.note}</p>` : '')
        + (s.answered ? `<p class="fb ${last.ok ? 'good' : 'bad'}">${WHY[last.reason]?.() ?? ''}</p><p><button class="act" data-act="next">${s.i + 1 < CORNERS.length ? tr('다음 코너', 'Next corner') : tr('결과 보기', 'See results')}</button></p>` : '');
    } },
];

export const notesSteps = (g: Game): MissionStep[] => [
  { ch: P('마무리', 'Wrap-up'), title: P('이 모델이 뺀 것', 'What this model leaves out'),
    enter: () => g.configure({ open: [] }),
    body: () => '<p>' + tr('이 에피소드의 계산은 수학을 배우기 위한 단순 모델이며 실제 F1과 같지 않습니다.', 'The numbers here come from a simple model for learning the maths. It is not the same as real F1.') + '</p>' + notesHtml() },
];
