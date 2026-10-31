// 02 레이스 엔지니어: 화면 연결. 계산은 model/, 그리기는 view/
import '@series/engine/css/ui/theme.css';
import '@series/engine/css/ui/components.css';
import '@series/engine/css/tutorial/tutorial.css';
import { applyLang, bindLangButton, defineStrings, onLangChange, tr } from '@series/engine/i18n';
import { bindInfoTips, byId as $, fitCanvas, load, onThemeChange, readCssVars, save, THEME_KEYS, type CanvasSize } from '@series/engine/ui';
import { startFixedStepLoop } from '@series/engine/sim';
import { createTutorial } from '@series/engine/tutorial';
import { DOWNFORCE, G, MASS, TOP_SPEED_KMH, type Surface, type Wing } from './model/constants';
import { availableForce, cornerValues, gripLimit, holdsGrip, kmhToMs, msToKmh, requiredForce, type CornerSetup } from './model/corner';
import { circleRadius, insideCircle, lateralAccel } from './model/friction-circle';
import { graphRange } from './model/graph-range';
import { nextMission, parseDone, resumeIndex } from './model/progress';
import { missionSteps, type Control, type Game, type MissionStep, type Scene } from './missions/index';
import { drawBars } from './view/bars';
import { bindCircleDrag, circleNote, drawCircle } from './view/circle';
import { drawGraph, graphNote } from './view/graph';
import { notesHtml } from './view/notes';
import { createRadio } from './view/radio';
import { drawScene, rampAt, slipAt, type SceneRun } from './view/scene';
import { STRINGS } from './strings';
import './style.css';

defineStrings(STRINGS);

const BAR_MARGIN = 1.25;   // 막대 끝 = 최고 속도에서 낼 수 있는 힘 × 이 값. 필요한 힘이 그보다 크면 막대가 꽉 차고 숫자로 보임
const DT = 1 / 60, LAP = 2.2, SLIDE = 1;   // 호 한 번 도는 시간, 미끄러지는 시간 (s, 화면 표현용)
const stage = $<HTMLCanvasElement>('stage'), ctx = stage.getContext('2d')!, graph = $<HTMLCanvasElement>('graph'), gctx = graph.getContext('2d')!, circle = $<HTMLCanvasElement>('circle'), cctx = circle.getContext('2d')!;
const speedIn = $<HTMLInputElement>('speed'), radiusIn = $<HTMLInputElement>('radius');
const S: CornerSetup & { speed: number } = { speed: 120, radius: 80, surface: 'dry', wing: 'none' };
let C = readCssVars(THEME_KEYS), size: CanvasSize | undefined, gsize: CanvasSize | undefined, csize: CanvasSize | undefined, brake = 0, wingOpen = true, run: SceneRun | null = null, passed = false;

function forces() {
  const { mu, k } = cornerValues(S), v = kmhToMs(S.speed);
  return { req: requiredForce(v, S.radius), avail: availableForce(v, mu, k) };
}

function limitText() {
  const l = gripLimit(cornerValues(S));
  if (l.kind === 'none') return tr('그립 한계: 한계 없음', 'Grip limit: no limit');
  if (l.kind === 'aboveTopSpeed') return tr('그립 한계 > 최고 속도 ', 'Grip limit > top speed ') + TOP_SPEED_KMH + ' km/h';
  return tr('그립 한계: ', 'Grip limit: ') + msToKmh(l.speed).toFixed(1) + ' km/h';
}

const condition = () => { const { mu, k } = cornerValues(S); return `m = ${MASS} kg · g = ${G} m/s² · μ = ${mu} · k = ${k} kg/m · r = ${S.radius} m`; };

function draw() {
  if (!size) return;
  const { req, avail } = forces(), shownReq = run ? req * rampAt(run.slipP ?? run.p) : req;
  drawScene(ctx, size, C, S.radius, run, shownReq / Math.max(req, avail));
  // 윙을 바꿀 수 있으면 눈금을 윙 높음에 맞춰 공유: 그래야 윙을 세울 때 파랑 막대가 길어짐
  const { mu, k } = cornerValues(S), barK = wingOpen ? DOWNFORCE.high : k;
  drawBars(req, avail, availableForce(kmhToMs(TOP_SPEED_KMH), mu, barK) * BAR_MARGIN, shownReq);
  $('speedV').textContent = S.speed + ' km/h'; $('radiusV').textContent = S.radius + ' m';
  $('cond').textContent = condition();
  $('limit').textContent = limitText();
  if (csize && !$('circleBox').hidden) {
    const { mu, k } = cornerValues(S), v = kmhToMs(S.speed), radius = circleRadius(v, mu, k), lateral = lateralAccel(v, S.radius);
    const c = { radius, lateral, brake, inside: insideCircle(brake, lateral, radius) };
    drawCircle(cctx, csize, C, c); $('circleNote').textContent = circleNote(c);
  }
  if (gsize && !$('graphBox').hidden) {
    const range = graphRange(gripLimit(cornerValues(S)));
    drawGraph(gctx, gsize, C, cornerValues(S), range); $('graphNote').textContent = graphNote(range);
  }
}

function setResult(outcome: '' | 'pass' | 'slid') {
  stage.dataset.outcome = outcome;
  $('status').textContent = outcome === 'pass' ? tr('코너 통과', 'Through the corner') : outcome === 'slid' ? tr('필요한 힘이 낼 수 있는 힘을 넘어 미끄러졌습니다', 'It needed more force than the tyres had, so the car slid') : '';
}

function go(forceSlide?: boolean) {
  // 판정은 계산으로 먼저 정하고 애니메이션은 결과만 보여 줌
  const { req, avail } = forces();
  passed = forceSlide === undefined ? holdsGrip(gripLimit(cornerValues(S)), S.speed) : !forceSlide;
  run = { p: 0, slipP: null, slide: 0 };
  if (!passed) run.slipP = slipAt(Math.min(1, avail / req));
  setResult(''); stage.dataset.running = '1';
}

function step() {
  if (!run) return false;
  if (run.slipP !== null && run.p >= run.slipP) run.slide += DT / SLIDE; else run.p += DT / LAP;
  if (run.p >= 1 || run.slide >= 1) { setResult(passed ? 'pass' : 'slid'); stage.dataset.running = ''; tut.emit('drive', { kmh: S.speed, slid: !passed }); return false; }
  return true;
}

function bindMode(id: string, pick: (v: string) => void) {
  const box = $(id);
  box.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest('button'); if (!b) return;
    box.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    pick(b.dataset.v!); clearRun();
  });
}
const clearRun = () => { run = null; setResult(''); stage.dataset.running = ''; draw(); };

const CONTROLS: Record<Control, string> = { speed: 'speedCtl', radius: 'radiusCtl', surface: 'surfaceCtl', wing: 'wingCtl', go: 'goCtl' };
const press = (id: string, v: string) => $(id).querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
const setBrake = (v: number) => { brake = Math.min(30, v); $<HTMLInputElement>('brake').value = String(brake); draw(); };
const refreshCard = () => { if (tut.current()) tut.render(false); };

// 미션이 정한 조건을 넣고, 바꿀 수 없는 조작은 숨김 (360px에서 장면과 조작이 함께 보이게)
function configure(c: Scene) {
  Object.assign(S, { speed: c.speed ?? S.speed, radius: c.radius ?? S.radius, surface: c.surface ?? S.surface, wing: c.wing ?? S.wing });
  speedIn.value = String(S.speed); radiusIn.value = String(S.radius); press('surface', S.surface); press('wing', S.wing);
  (Object.keys(CONTROLS) as Control[]).forEach(k => { $(CONTROLS[k]).hidden = !c.open.includes(k); });
  wingOpen = c.open.includes('wing');
  $('limit').hidden = !c.limit; $('graphBox').hidden = !c.graph; $('circleBox').hidden = !c.circle; $('forcesBox').classList.toggle('graph-on', !!(c.graph || c.circle));
  if (c.graph) gsize = fitCanvas(graph);
  if (c.circle) { csize = fitCanvas(circle); setBrake(0); }
  clearRun();
}
const FREE: Scene = { open: ['speed', 'radius', 'surface', 'wing', 'go'], limit: true, graph: true };
const game: Game = {
  configure, condition,
  values: () => cornerValues(S),
  clearRadio: () => radio.clear(),
  drive(kmh, slide) { S.speed = Math.max(60, Math.min(340, kmh)); speedIn.value = String(S.speed); go(slide); },
  target: c => c === 'stage' ? stage : c === 'forces' ? $('forcesBox') : $(CONTROLS[c]),
};

const DONE_KEY = 'race-engineer:done';
const done = parseDone(load(DONE_KEY));
const STEPS = missionSteps(game);
function markDone(m: string) { if (!done.includes(m)) { done.push(m); save(DONE_KEY, JSON.stringify(done)); } }

const radio = createRadio(a => tut.emit('radio', a));
const tut = createTutorial({
  steps: STEPS, episode: 'race-engineer', ctrl: $('tutCtrl'),
  resume: () => resumeIndex(STEPS.map(s => s.mission), done),
  onEnd: () => configure(FREE),
  onAction: el => tut.emit('act', el.dataset.act),
  onRender: () => {
    const c = tut.current(); if (!c) return;
    const step = c.step as MissionStep;
    radio.show(step.radio);
    if (step.radioHidden?.(c.state)) $('tutCtrl').hidden = true;
    if (step.mission && step.done?.(c.state)) markDone(step.mission);
  },
});

// 진행 기록이 있으면 이어서 할지 묻고, 없으면 바로 시작
const pending = () => nextMission(STEPS.map(s => s.mission), done);
function askResume() {
  const m = pending(); $('resumeBox').hidden = !m;
  if (m) $('resumeGo').textContent = tr(`이어서 하기 (${m}부터)`, `Continue from ${m}`);
  return !!m;
}
function openMissions(fresh: boolean) {
  if (fresh) { done.length = 0; save(DONE_KEY, '[]'); save('race-engineer:m7', '[]'); }
  $('resumeBox').hidden = true; tut.start();
}
$('tutOpen').onclick = () => { if (!askResume()) tut.start(); };
$('resumeGo').onclick = () => openMissions(false);
$('resumeNew').onclick = () => openMissions(true);

speedIn.addEventListener('input', () => { S.speed = +speedIn.value; clearRun(); tut.emit('speed', S.speed); refreshCard(); });
radiusIn.addEventListener('input', () => { S.radius = +radiusIn.value; clearRun(); tut.emit('setup', gripLimit(cornerValues(S)).kind); refreshCard(); });
bindMode('surface', v => { S.surface = v as Surface; });
bindMode('wing', v => { S.wing = v as Wing; tut.emit('wing', v); });
$('go').onclick = () => go();
bindInfoTips($('tut'));
bindCircleDrag(circle, () => { const { mu, k } = cornerValues(S); return circleRadius(kmhToMs(S.speed), mu, k); }, setBrake);
onThemeChange(() => { C = readCssVars(THEME_KEYS); draw(); });
window.addEventListener('resize', () => { size = fitCanvas(stage); if (!$('graphBox').hidden) gsize = fitCanvas(graph); if (!$('circleBox').hidden) csize = fitCanvas(circle); draw(); });
const showNotes = () => { $('notes').innerHTML = '<h2>' + tr('이 모델이 뺀 것', 'What this model leaves out') + '</h2>' + notesHtml(); };
onLangChange(() => { draw(); showNotes(); refreshCard(); if (!$('resumeBox').hidden) askResume(); });
bindLangButton($('langBtn'));
applyLang(); showNotes(); size = fitCanvas(stage);
startFixedStepLoop({ dt: DT, active: () => stage.dataset.running === '1', step, frame: draw });
if (!askResume()) tut.autoStart();
