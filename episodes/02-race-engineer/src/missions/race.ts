// M7 레이스 무전: 코너 5개를 한 단계에서 차례로. 규칙: model/race-radio.ts
import { P, tr } from '@series/engine/i18n';
import type { StepState } from '@series/engine/tutorial';
import { save } from '@series/engine/ui';
import type { RadioAnswer, Verdict } from '../model/judge';
import { CORNERS, judgeCorner, NO_LIMIT_CORNER, racePassed } from '../model/race-radio';
import { notesHtml } from '../view/notes';
import { condLine } from './basic';
import type { Game, MissionStep } from './index';

const CH5 = P('5장 레이스', 'Ch.5 Race');
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

export const raceSteps = (g: Game): MissionStep[] => [
  { ch: CH5, title: P('M7 레이스 무전', 'M7 Race radio'), mission: 'M7', ctrl: true,
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
      if (s.i >= CORNERS.length) return resultTable(s) + (s.ok ? `<p class="fb good">${tr('완주했습니다. 드라이버가 고맙다고 합니다.', 'Race finished. Your driver says thanks.')}</p>`
        : `<p class="fb bad">${(s.vs as Verdict[])[NO_LIMIT_CORNER].ok ? tr('코너 4개 이상 성공해야 합니다.', 'You need at least four corners.') : tr('코너 4의 판단을 맞혀야 합니다. 경계 반지름을 다시 생각해 보세요.', 'You must get corner 4 right. Think about the boundary radius again.')}</p><p><button class="act" data-act="retry">${tr('다시 하기', 'Try again')}</button></p>`);
      const last = (s.vs as Verdict[])[s.i];
      return `<p><b>${tr('코너', 'Corner')} ${s.i + 1} / ${CORNERS.length}</b></p>` + condLine(g) + '<p>' + tr('미끄러지지 않는 그립 한계 속도를 부르세요. 차의 최고 속도가 아니라 그립의 한계를 묻습니다. 한계가 없다고 판단하면 "한계 없음"을 고르세요.', 'Call the grip limit speed. We want the limit of the grip, not the top speed of the car. If you think there is no limit, pick "No limit".') + '</p>'
        + (s.note ? `<p class="fb bad">${s.note}</p>` : '')
        + (s.answered ? `<p class="fb ${last.ok ? 'good' : 'bad'}">${WHY[last.reason]?.() ?? ''}</p><p><button class="act" data-act="next">${s.i + 1 < CORNERS.length ? tr('다음 코너', 'Next corner') : tr('결과 보기', 'See results')}</button></p>` : '');
    } },
  { ch: CH5, title: P('이 모델이 뺀 것', 'What this model leaves out'),
    enter: () => g.configure({ open: [] }),
    body: () => '<p>' + tr('이 에피소드의 계산은 수학을 배우기 위한 단순 모델이며 실제 F1과 같지 않습니다.', 'The numbers here come from a simple model for learning the maths. It is not the same as real F1.') + '</p>' + notesHtml() },
];
