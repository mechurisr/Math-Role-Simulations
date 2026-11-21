// M1 두 파의 경주, M2 시간 차로 거리 구하기. 상황 → 직접 보기 → 의미 → 계산 → 왜 중요한가 (FR-010).
// 정답·풀이: kitty-specs/seismic-analyst-01M7YB3D/answers.md
import { P, tr } from '@series/engine/i18n';
import { quizStep, type StepState } from '@series/engine/tutorial';
import { frac, math, mi, mo, row, sub } from '@series/engine/ui';
import { M2_SP_TIME, VP, VS } from '../model/constants';
import { judgeIntermediate, judgeValue } from '../model/judge';
import { LEAD, readSp, recordFor } from '../model/seismogram';
import { distanceFromSp, spTime } from '../model/waves';
import { formulaBox } from '../view/symbols';
import { answerOn, feedback, type Game, type MissionStep } from './index';

const CH1 = P('1장 두 파의 경주', 'Ch.1 The race of two waves');
const CH2 = P('2장 시간 차로 거리 구하기', 'Ch.2 Distance from the gap');
const M1_KM = 210;
const SEEN = [84, 168, 252];
const sp1 = (km: number) => spTime(km).toFixed(1);

export const distanceSteps = (g: Game): MissionStep[] => [
  { ch: CH1, title: P('재난 문자 발송팀이 기다립니다', 'The alert team is waiting'),
    enter: () => g.configure({ distance: 84, open: [] }),
    target: () => [g.target('race')],
    body: () => '<p>' + tr('당신은 지진 관측소의 <b>지진 분석관</b>입니다. 방금 땅이 흔들렸고, 관측소 기계가 흔들림을 기록했습니다.', 'You are a <b>seismic analyst</b> at an earthquake observatory. The ground has just shaken and the station has recorded it.') + '</p>'
      + '<p>' + tr('재난 문자 발송팀이 묻습니다. <b>"어디서 났어요? 어느 지역에 경보를 보내야 하죠?"</b> 지진이 시작된 곳 바로 위의 땅을 <b>진앙</b>이라고 합니다. 진앙의 위치를 찾아 알려 주는 것이 당신의 임무입니다.', 'The emergency alert team asks, <b>"Where was it? Which region gets the alert?"</b> The spot on the surface right above where the quake started is the <b>epicentre</b>. Your job is to find it and tell them.') + '</p>'
      + '<p>' + tr('틀린 곳을 알려 주면 흔들리지도 않은 지역에 경보가 가고, 정작 위험한 지역은 모르고 지나갑니다. 먼저 관측소가 진앙에서 <b>얼마나 떨어져 있는지</b>부터 알아봅시다.', 'Get it wrong and the alert goes to a region that did not shake while the dangerous one is missed. First, find out <b>how far</b> the station is from the epicentre.') + '</p>' },
  { ch: CH1, title: P('두 가지 파가 출발합니다', 'Two kinds of wave set off'),
    enter: () => g.configure({ distance: 84, open: ['dist'] }),
    target: () => [g.target('race'), g.target('dist')],
    on: { dist: s => { s.moved = true; } },
    gate: s => !!s.moved, waitLabel: P('거리를 바꿔 보세요', 'Change the distance'),
    body: s => '<p>' + tr('지진이 나면 진앙에서 두 가지 파가 <b>동시에</b> 출발합니다.', 'When a quake strikes, two kinds of wave leave the epicentre <b>at the same moment</b>.') + '</p>'
      + `<p><span class="bl">P</span> ${tr(`파: 빠릅니다. 이 게임에서는 1초에 ${VP} km를 갑니다.`, `wave: fast. In this game it travels ${VP} km each second.`)}<br><span class="o">S</span> ${tr(`파: 느립니다. 1초에 ${VS} km를 갑니다.`, `wave: slower, ${VS} km each second.`)}</p>`
      + '<p>' + tr('그래서 관측소에는 언제나 P파가 먼저 오고 S파가 나중에 옵니다. 둘이 도착한 시각의 차이를 <b>S-P 시간</b>이라고 합니다. 거리 슬라이더를 움직여 관측소를 멀리 두고, 아래 시간 막대에서 두 파가 도착하는 시각을 보세요.', 'So the P wave always reaches the station first and the S wave later. The gap between the two arrivals is the <b>S-P time</b>. Move the distance slider to put the station further away and watch the arrival times on the timeline below.') + '</p>'
      + (s.moved ? '<p class="fb good">' + tr('멀수록 두 파 사이의 간격이 벌어집니다. 달리기에서 빠른 사람과 느린 사람의 차이가 거리가 길수록 벌어지는 것과 같습니다.', 'The further away, the wider the gap. Like a fast and a slow runner: the longer the race, the bigger the gap.') + '</p>' : '') },
  { ...quizStep({ ch: CH1, title: P('M1 예상해 보기', 'M1 Make a guess'),
    intro: () => '<p>' + tr('계산하기 전에 먼저 예상해 보세요. 틀려도 괜찮습니다.', 'Guess before you calculate. It is fine to be wrong.') + '</p>',
    quiz: { q: P('관측소까지 거리가 두 배가 되면 S-P 시간은 어떻게 될까요?', 'If the station is twice as far away, what happens to the S-P time?'),
      options: [P('그대로다', 'It stays the same'), P('두 배가 된다', 'It doubles'), P('네 배가 된다', 'It becomes four times as long')], answer: 1,
      explain: P('두 파 모두 두 배 먼 길을 가니 걸리는 시간이 각각 두 배가 되고, 그 차이도 두 배가 됩니다. 직접 재서 확인해 봅시다.', 'Both waves travel twice as far, so each takes twice as long, and the gap doubles too. Measure it to check.'),
      hint: P('P파와 S파가 각각 두 배 먼 길을 가면 걸리는 시간은 어떻게 될까요?', 'If each wave goes twice as far, how long does each take?') } }),
    mission: 'M1', enter: () => g.configure({ distance: 84, open: [] }) },
  { ch: CH1, title: P('M1 직접 재 보기', 'M1 Measure it'), mission: 'M1',
    enter: s => { s.seen = {}; g.configure({ distance: SEEN[0], open: [] }); s.seen[SEEN[0]] = true; },
    target: () => [g.target('race')],
    on: { act: (s, a) => { const km = +(a as string); g.configure({ distance: km, open: [] }); s.seen[km] = true; } },
    gate: s => SEEN.every(km => s.seen?.[km]), waitLabel: P('세 거리를 모두 눌러 보세요', 'Try all three distances'),
    body: s => '<p>' + tr('버튼으로 관측소를 옮겨 가며 S-P 시간을 재 보세요.', 'Move the station with the buttons and measure the S-P time.') + '</p>'
      + `<p class="pick-btns">${SEEN.map(km => `<button class="act" data-act="${km}">${km} km</button>`).join('')}</p>`
      + `<table><tr><td>${tr('거리', 'Distance')}</td><td>${tr('S-P 시간', 'S-P time')}</td></tr>`
      + SEEN.map(km => `<tr><td>${km} km</td><td>${s.seen?.[km] ? sp1(km) + ' s' : '?'}</td></tr>`).join('') + '</table>' },
  { ch: CH1, title: P('M1 이 표가 뜻하는 것', 'M1 What the table means'), mission: 'M1',
    enter: () => g.configure({ distance: 168, open: [] }),
    body: () => '<p>' + tr(`84 km에서 10 s, 168 km에서 20 s, 252 km에서 30 s입니다. 거리가 2배, 3배가 되면 S-P 시간도 정확히 2배, 3배가 됩니다. 이런 관계를 <b>비례</b>한다고 합니다.`, 'At 84 km it is 10 s, at 168 km 20 s, at 252 km 30 s. Twice or three times the distance gives exactly twice or three times the S-P time. We say the two are <b>proportional</b>.') + '</p>'
      + '<p>' + tr(`<b>왜 그럴까요?</b> 84 km를 가는 데 P파는 84 ÷ ${VP} = 14 s, S파는 84 ÷ ${VS} = 24 s가 걸려 차이가 10 s입니다. 거리가 두 배면 두 파의 시간이 모두 두 배(28 s, 48 s)가 되어 차이도 20 s가 됩니다.`, `<b>Why?</b> To go 84 km the P wave takes 84 ÷ ${VP} = 14 s and the S wave 84 ÷ ${VS} = 24 s, a gap of 10 s. Double the distance and both times double (28 s and 48 s), so the gap doubles to 20 s.`) + '</p>' },
  { ch: CH1, title: P('M1 다른 관측소', 'M1 Another station'), mission: 'M1', ctrl: true,
    enter: () => g.configure({ distance: 168, open: [] }),
    answer: { title: P(`진앙에서 ${M1_KM} km 떨어진 관측소`, `A station ${M1_KM} km from the epicentre`), fields: [{ label: P('S-P 시간', 'S-P time'), unit: 's' }] },
    gate: s => !!s.ok, waitLabel: P('S-P 시간을 보내세요', 'Send the S-P time'),
    on: answerOn(raw => judgeValue(raw[0], spTime(M1_KM), 0.5, { positive: true })),
    body: s => '<p>' + tr(`이번에는 슬라이더가 없습니다. 진앙에서 <b>${M1_KM} km</b> 떨어진 다른 관측소에서는 S-P 시간이 얼마일까요? 앞의 표를 써서 구해 보내세요.`, `No slider this time. Another station is <b>${M1_KM} km</b> from the epicentre. What is its S-P time? Use the table to work it out and send it.`) + '</p>'
      + '<p class="small">' + tr('84 km에서 10 s였습니다. 210 km는 84 km의 몇 배일까요?', 'It was 10 s at 84 km. How many times 84 km is 210 km?') + '</p>'
      + feedback(s.v, tr('맞습니다. 210 = 84 × 2.5이니 10 × 2.5 = <b>25 s</b>입니다.', 'Right. 210 = 84 × 2.5, so 10 × 2.5 = <b>25 s</b>.'), tr('거리가 84 km의 몇 배인지 구해 10 s에 곱해 보세요.', 'Find how many times 84 km the distance is and multiply 10 s by that.')) },
  { ch: CH1, title: P('M1 왜 중요할까요', 'M1 Why it matters'), mission: 'M1', done: () => true,
    enter: () => g.configure({ distance: 210, open: [] }),
    body: () => '<p>' + tr('거리를 알면 S-P 시간을 알 수 있었습니다. 그런데 분석관에게 필요한 것은 <b>거꾸로</b>입니다. 관측소에는 S-P 시간이 기록되고, 우리가 모르는 것은 거리입니다.', 'Knowing the distance gave us the S-P time. An analyst needs it the <b>other way round</b>: the station records the S-P time, and the distance is what we do not know.') + '</p>'
      + '<p>' + tr('비례하니까 거꾸로도 됩니다. S-P 시간이 25 s면 거리는 210 km입니다. 다음 장에서는 진짜 지진 기록에서 S-P 시간을 직접 읽고 거리를 계산합니다.', 'Because they are proportional, it works backwards too: an S-P time of 25 s means 210 km. Next, you read the S-P time off a real-looking seismogram and work out the distance.') + '</p>' },
  ...recordSteps(g),
];

const vp = sub(mi('V'), mi('P')), vs = sub(mi('V'), mi('S')), dt = row(mo('Δ'), mi('t'));
export const distanceFormula = () => math(mi('d'), mo('='), dt, mo('×'), frac(row(vp, vs), row(vp, mo('−'), vs)));

// M2 판독 판정 뒤 어느 마커가 어긋났는지 짚는 힌트
function readHint(g: Game) {
  const r = recordFor(M2_SP_TIME), m = g.markers();
  if (Math.abs(m.p - r.pArrival) > 0.3) return tr('P 마커를 잔잔하던 선이 <b>처음 흔들리기 시작하는 곳</b>에 놓아 보세요.', 'Put the P marker where the quiet line <b>first starts to wiggle</b>.');
  return tr('S 마커를 흔들림이 <b>갑자기 훨씬 커지는 곳</b>에 놓아 보세요.', 'Put the S marker where the shaking <b>suddenly gets much bigger</b>.');
}
function onRead(g: Game, s: StepState) {
  const m = g.markers();
  s.v = judgeIntermediate(readSp(m.p, m.s), M2_SP_TIME, 0.3);
  if (s.v.ok) { s.ok = true; g.confirmRecord(); }
}

const recordSteps = (g: Game): MissionStep[] => [
  { ch: CH2, title: P('지진 기록 읽는 법', 'How to read a seismogram'), mission: 'M2',
    enter: () => g.configure({ panel: 'record', record: M2_SP_TIME, open: [] }),
    target: () => [g.target('record')],
    body: () => '<p>' + tr('새 지진이 났고, 관측소 한 곳의 <b>지진 기록</b>이 도착했습니다. 지진 기록은 땅이 흔들린 모습을 시간에 따라 그린 그래프입니다. 가로축은 시간, 위아래로 움직이는 선이 흔들림입니다.', 'A new quake has struck and the <b>seismogram</b> from one station has arrived. A seismogram draws how the ground shook over time: time runs left to right, and the wiggling line is the shaking.') + '</p>'
      + '<p>' + tr(`가로축은 <b>기록을 시작한 때부터</b>의 시간입니다. 지진이 언제 났는지는 기록에 없습니다. 그래서 P파가 도착한 시각만으로는 거리를 알 수 없고, 두 파의 <b>도착 시각 차이</b>를 읽어야 합니다.`, 'The time axis starts when the <b>recording started</b>. The record does not say when the quake happened, so the P arrival time alone cannot give the distance. You have to read the <b>gap between the two arrivals</b>.') + '</p>'
      + '<p>' + tr('처음에는 거의 잔잔합니다. 선이 처음 흔들리기 시작하는 곳이 <span class="bl">P파</span>가 도착한 때이고, 흔들림이 갑자기 훨씬 커지는 곳이 <span class="o">S파</span>가 도착한 때입니다.', 'At first it is almost still. Where the line first starts to wiggle, the <span class="bl">P wave</span> has arrived. Where the shaking suddenly gets much bigger, the <span class="o">S wave</span> has arrived.') + '</p>' },
  { ch: CH2, title: P('M2 기록 판독', 'M2 Read the record'), mission: 'M2',
    enter: () => g.configure({ panel: 'record', record: M2_SP_TIME, open: [] }),
    target: () => [g.target('record')],
    on: { act: (s, a) => { if (a === 'read') onRead(g, s); } },
    gate: s => !!s.ok, waitLabel: P('판독을 통과해 보세요', 'Pass the reading'),
    body: s => '<p>' + tr('마커를 끌거나 ◀ ▶ 버튼으로 0.1 s씩 옮겨 <span class="bl">P</span> 마커는 P파 첫 도착에, <span class="o">S</span> 마커는 S파 첫 도착에 놓으세요. 다 놓았으면 <b>판독 확인</b>을 누르세요.', 'Drag the markers or nudge them 0.1 s at a time with ◀ ▶. Put the <span class="bl">P</span> marker on the first P arrival and the <span class="o">S</span> marker on the first S arrival, then press <b>Check reading</b>.') + '</p>'
      + `<p class="pick-btns"><button class="act" data-act="read"${s.ok ? ' disabled' : ''}>${tr('판독 확인', 'Check reading')}</button></p>`
      + (s.v?.ok ? `<p class="fb good">${tr(`판독 통과. 확정된 값 <b>${M2_SP_TIME.toFixed(1)} s</b>로 계산하세요. 마커도 정확한 위치로 맞췄습니다.`, `Reading passed. Use the confirmed value, <b>${M2_SP_TIME.toFixed(1)} s</b>. The markers have been set to the exact spots.`)}</p>`
        : feedback(s.v, '', readHint(g))) },
  { ch: CH2, title: P('M2 거리 식 만들기', 'M2 Build the distance formula'), mission: 'M2',
    enter: () => g.configure({ panel: 'record', record: M2_SP_TIME, confirmed: true, open: [] }),
    body: () => '<p>' + tr(`먼저 숫자로 해 봅시다. 1장의 84 km에서 P파는 84 ÷ ${VP} = 14 s, S파는 84 ÷ ${VS} = 24 s가 걸려 차이가 10 s였습니다.`, `Start with numbers. At 84 km in chapter 1, the P wave took 84 ÷ ${VP} = 14 s and the S wave 84 ÷ ${VS} = 24 s, a gap of 10 s.`) + '</p>'
      + '<p>' + tr('거리를 d라고 하면 같은 일을 식으로 쓸 수 있습니다. S파가 걸린 시간에서 P파가 걸린 시간을 빼면 S-P 시간 Δt입니다.', 'Call the distance d and write the same thing as a formula. The S wave time minus the P wave time is the S-P time Δt.') + '</p>'
      + math(frac(mi('d'), vs), mo('−'), frac(mi('d'), vp), mo('='), dt)
      + '<p>' + tr('d로 묶으면 d × (1/3.5 − 1/6) = Δt입니다. 1/3.5 − 1/6 = 5/42이니, 양쪽을 5/42로 나누면 d = Δt × 42/5 = <b>8.4 × Δt</b>입니다. 같은 식을 기호로 쓰면 이렇습니다.', 'Factor out d: d × (1/3.5 − 1/6) = Δt. Since 1/3.5 − 1/6 = 5/42, dividing both sides by 5/42 gives d = Δt × 42/5 = <b>8.4 × Δt</b>. In symbols:') + '</p>'
      + distanceFormula()
      + '<p>' + tr('확인: Δt = 10 s면 8.4 × 10 = 84 km로 1장과 같습니다. S-P 시간이 1 s 늘 때마다 진앙이 8.4 km 더 멉니다.', 'Check: Δt = 10 s gives 8.4 × 10 = 84 km, as in chapter 1. Every extra second of S-P time puts the epicentre 8.4 km further away.') + '</p>' },
  { ch: CH2, title: P('M2 거리 보내기', 'M2 Send the distance'), mission: 'M2', ctrl: true,
    enter: () => g.configure({ panel: 'record', record: M2_SP_TIME, confirmed: true, open: [] }),
    answer: { title: P(`확정된 S-P 시간 ${M2_SP_TIME.toFixed(1)} s`, `Confirmed S-P time ${M2_SP_TIME.toFixed(1)} s`), fields: [{ label: P('거리', 'Distance'), unit: 'km' }] },
    gate: s => !!s.ok, waitLabel: P('거리를 보내세요', 'Send the distance'),
    on: answerOn(raw => judgeValue(raw[0], distanceFromSp(M2_SP_TIME), 2, { positive: true })),
    body: s => '<p>' + tr('판독한 S-P 시간으로 진앙까지의 거리를 계산해 발송팀에 보내세요.', 'Work out the distance to the epicentre from the S-P time you read and send it to the alert team.') + '</p>'
      + formulaBox(distanceFormula(), ['d', 'dt', 'vp', 'vs'])
      + feedback(s.v, tr(`맞습니다. 8.4 × ${M2_SP_TIME} = <b>${distanceFromSp(M2_SP_TIME).toFixed(0)} km</b>입니다.`, `Right. 8.4 × ${M2_SP_TIME} = <b>${distanceFromSp(M2_SP_TIME).toFixed(0)} km</b>.`), tr('S-P 시간에 8.4를 곱합니다.', 'Multiply the S-P time by 8.4.')) },
  { ch: CH2, title: P('M2 거리만으로는 부족합니다', 'M2 Distance is not enough'), mission: 'M2', done: () => true,
    enter: () => g.configure({ panel: 'record', record: M2_SP_TIME, confirmed: true, open: [] }),
    body: () => '<p>' + tr(`발송팀이 다시 묻습니다. <b>"${distanceFromSp(M2_SP_TIME).toFixed(0)} km라고요? 어느 쪽으로요?"</b>`, `The alert team asks again: <b>"${distanceFromSp(M2_SP_TIME).toFixed(0)} km? In which direction?"</b>`) + '</p>'
      + '<p>' + tr('관측소 하나의 기록으로는 거리만 알 수 있고 방향은 모릅니다. 진앙은 관측소에서 그만큼 떨어진 곳이면 북쪽이든 동쪽이든 어디든 될 수 있습니다. 다음 장에서는 이 "어디든"이 지도에서 어떤 모양인지 봅니다.', 'One station only gives the distance, not the direction. The epicentre could be anywhere that far away, north, east or any other way. Next, see what shape that "anywhere" makes on a map.') + '</p>'
      + `<p class="small">${tr(`참고: 기록은 P파 도착 ${LEAD} s 전부터 시작합니다.`, `Note: the record starts ${LEAD} s before the P wave arrives.`)}</p>` },
];
