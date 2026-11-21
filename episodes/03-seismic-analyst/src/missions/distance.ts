// M1 두 파의 경주. 상황 → 직접 보기 → 의미 → 계산 → 왜 중요한가 (FR-010).
// 정답·풀이: kitty-specs/seismic-analyst-01M7YB3D/answers.md
import { P, tr } from '@series/engine/i18n';
import { quizStep } from '@series/engine/tutorial';
import { VP, VS } from '../model/constants';
import { judgeValue } from '../model/judge';
import { spTime } from '../model/waves';
import { answerOn, feedback, type Game, type MissionStep } from './index';

const CH1 = P('1장 두 파의 경주', 'Ch.1 The race of two waves');
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
];
