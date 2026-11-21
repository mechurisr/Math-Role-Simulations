// 03 지진 분석관: 화면 연결. 계산은 model/, 그리기는 view/, 미션 문구는 missions/
// 엔진만 import 할 것 (다른 에피소드 import 금지 — pnpm check:boundaries 가 막음)
import '@series/engine/css/ui/theme.css';
import '@series/engine/css/ui/components.css';
import '@series/engine/css/tutorial/tutorial.css';
import '@series/engine/css/calculator/calculator.css';
import { applyLang, bindLangButton, defineStrings, onLangChange, tr } from '@series/engine/i18n';
import { bindInfoTips, byId as $, fitCanvas, load, onThemeChange, readCssVars, save, THEME_KEYS, type CanvasSize } from '@series/engine/ui';
import { startFixedStepLoop } from '@series/engine/sim';
import { createTutorial } from '@series/engine/tutorial';
import { createCalculator } from '@series/engine/calculator';
import { nextMission, parseDone, resumeIndex } from './model/progress';
import { sArrival } from './model/waves';
import { missionSteps, type Control, type Game, type MissionStep, type Scene } from './missions/index';
import { createAnswer } from './view/answer';
import { drawRace, raceNote } from './view/race';
import { STRINGS } from './strings';
import './style.css';

defineStrings(STRINGS);

const DT = 1 / 60, RACE_REAL_S = 2.5;   // 두 파 애니메이션을 실제 약 2.5초에 보여 줌 (화면 표현용)
const race = $<HTMLCanvasElement>('race'), rctx = race.getContext('2d')!, distIn = $<HTMLInputElement>('dist');
const S = { distance: 84 };
let C = readCssVars(THEME_KEYS), rsize: CanvasSize | undefined, anim: number | null = null, animSpeed = 1;

function draw() {
  if (!rsize) return;
  drawRace(rctx, rsize, C, S.distance, anim);
  $('distV').textContent = S.distance + ' km';
  $('raceNote').textContent = raceNote(S.distance);
}

// 거리가 바뀌면 지진이 다시 난 것처럼 두 파를 처음부터 보여 줌
function replay() { anim = 0; animSpeed = Math.max(1, (sArrival(S.distance) + 2) / RACE_REAL_S); race.dataset.running = '1'; }
function step() {
  if (anim === null) return false;
  anim += DT * animSpeed;
  if (anim >= sArrival(S.distance) + 1) { anim = null; race.dataset.running = ''; return false; }
  return true;
}

const CONTROLS: Record<Control, string> = { dist: 'distCtl' };
function configure(c: Scene) {
  if (c.distance !== undefined && c.distance !== S.distance) { S.distance = c.distance; distIn.value = String(S.distance); replay(); }
  (Object.keys(CONTROLS) as Control[]).forEach(k => { $(CONTROLS[k]).hidden = !c.open.includes(k); });
  draw();
}
const FREE: Scene = { open: ['dist'] };
const game: Game = { configure, target: c => c === 'race' ? $('raceBox') : $(CONTROLS[c]) };

const DONE_KEY = 'seismic-analyst:done';
const done = parseDone(load(DONE_KEY));
const STEPS = missionSteps(game);
function markDone(m: string) { if (!done.includes(m)) { done.push(m); save(DONE_KEY, JSON.stringify(done)); } }

const answer = createAnswer(raw => tut.emit('answer', raw));
const tut = createTutorial({
  steps: STEPS, episode: 'seismic-analyst', ctrl: $('tutCtrl'),
  resume: () => resumeIndex(STEPS.map(s => s.mission), done),
  onEnd: () => { configure(FREE); calc.setAvailable(true); },
  onAction: el => tut.emit('act', el.dataset.act),
  onRender: () => {
    const c = tut.current(); if (!c) return;
    const step = c.step as MissionStep;
    answer.show(step.answer);
    // 계산기는 답 입력란이 보이는 단계에서만 (02와 같은 규칙, kitty-specs/floating-calculator-01M755VB spec 5절)
    calc.setAvailable(!!step.answer);
    if (step.mission && step.done?.(c.state)) markDone(step.mission);
  },
});
const calc = createCalculator({ avoid: () => $('tut'), reveal: () => $('tutCtrl') });
calc.onResult(answer.setCalcResult);

// 진행 기록이 있으면 이어서 할지 묻고, 없으면 바로 시작 (FR-008)
const pending = () => nextMission(STEPS.map(s => s.mission), done);
function askResume() {
  const m = pending(); $('resumeBox').hidden = !m;
  if (m) $('resumeGo').textContent = tr(`이어서 하기 (${m}부터)`, `Continue from ${m}`);
  return !!m;
}
function openMissions(fresh: boolean) {
  if (fresh) { done.length = 0; save(DONE_KEY, '[]'); }
  $('resumeBox').hidden = true; tut.start();
}
$('tutOpen').onclick = () => { if (!askResume()) tut.start(); };
$('resumeGo').onclick = () => openMissions(false);
$('resumeNew').onclick = () => openMissions(true);

distIn.addEventListener('input', () => { S.distance = +distIn.value; replay(); draw(); tut.emit('dist', S.distance); });
bindInfoTips($('tut'));
// 테마 색: 시스템·data-theme 전환과, 스타일이 늦게 적용되는 첫 로드(WebKit, Issue #36) 모두에서 다시 읽음
onThemeChange(() => { C = readCssVars(THEME_KEYS); draw(); });
window.addEventListener('resize', () => { rsize = fitCanvas(race); draw(); });
onLangChange(() => { draw(); if (tut.current()) tut.render(false); if (!$('resumeBox').hidden) askResume(); });
bindLangButton($('langBtn'));
applyLang(); rsize = fitCanvas(race); distIn.value = String(S.distance);
startFixedStepLoop({ dt: DT, active: () => race.dataset.running === '1', step, frame: draw });
if (!askResume()) tut.autoStart();
