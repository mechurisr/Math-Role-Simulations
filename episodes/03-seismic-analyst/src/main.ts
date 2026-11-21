// 03 지진 분석관: 화면 연결. 계산은 model/, 그리기는 view/, 미션 문구는 missions/
// 엔진만 import 할 것 (다른 에피소드 import 금지 — pnpm check:boundaries 가 막음)
import '@series/engine/css/ui/theme.css';
import '@series/engine/css/ui/components.css';
import '@series/engine/css/tutorial/tutorial.css';
import '@series/engine/css/calculator/calculator.css';
import { applyLang, bindLangButton, defineStrings, onLangChange, tr } from '@series/engine/i18n';
import { bindInfoTips, byId as $, fitCanvas, load, onThemeChange, save, type CanvasSize } from '@series/engine/ui';
import { readColors } from './view/colors';
import { startFixedStepLoop } from '@series/engine/sim';
import { createTutorial } from '@series/engine/tutorial';
import { createCalculator } from '@series/engine/calculator';
import { nextMission, parseDone, resumeIndex } from './model/progress';
import { intersect } from './model/circles';
import { recordFor } from './model/seismogram';
import { sArrival } from './model/waves';
import { missionSteps, type Control, type Game, type MissionStep, type Panel, type Scene } from './missions/index';
import { createAnswer } from './view/answer';
import { crossingNote, drawMap, FULL_VIEW, pickAt, type MapScene } from './view/map';
import { bindPointerDrag } from './view/drag';
import { showResiduals } from './view/residual';
import { residuals, sumSquares } from './model/residual';
import { m8Circles } from './missions/residual';
import { PRACTICE_STATIONS, type Point } from './model/constants';
import { notesHtml } from './view/notes';
import { drawRace, raceNote } from './view/race';
import { createSeismogram } from './view/seismogram';
import { STRINGS } from './strings';
import './style.css';

defineStrings(STRINGS);

const DT = 1 / 60, RACE_REAL_S = 2.5;   // 두 파 애니메이션을 실제 약 2.5초에 보여 줌 (화면 표현용)
const race = $<HTMLCanvasElement>('race'), rctx = race.getContext('2d')!, distIn = $<HTMLInputElement>('dist'), recordCv = $<HTMLCanvasElement>('record');
const mapCv = $<HTMLCanvasElement>('map'), mctx = mapCv.getContext('2d')!, rBIn = $<HTMLInputElement>('rB');
const S: { distance: number; panel: Panel; record: number | null; map: MapScene | null; est: Point } = { distance: 84, panel: 'race', record: null, map: null, est: { x: 100, y: 140 } };
let C = readColors(), rsize: CanvasSize | undefined, ksize: CanvasSize | undefined, msize: CanvasSize | undefined, anim: number | null = null, animSpeed = 1;
const seis = createSeismogram(recordCv, () => { draw(); tut.emit('marker'); });

function draw() {
  if (rsize && S.panel === 'race') {
    drawRace(rctx, rsize, C, S.distance, anim);
    $('distV').textContent = S.distance + ' km';
    $('raceNote').textContent = raceNote(S.distance);
  }
  if (ksize && S.panel === 'record') { seis.draw(ksize, C); $('recordNote').textContent = seis.note(); }
  if (msize && S.panel === 'map' && S.map) {
    drawMap(mctx, msize, C, S.map);
    const x = S.map.crossings, note = x ? crossingNote(intersect(S.map.circles[x[0]].circle, S.map.circles[x[1]].circle)) : S.map.note ?? '';
    if ($('mapNote').textContent !== note) $('mapNote').textContent = note;
    $('rBV').textContent = rBIn.value + ' km';
  }
}

// M8 추정점: 지도 위에 그리고 잔차 막대·잔차 제곱합을 갱신 (FR-018)
const estOpen = () => !$('estBox').hidden;
function setEst(p: Point) {
  const v = S.map?.view ?? FULL_VIEW, snap = (n: number) => Math.round(n * 10) / 10;
  S.est = { x: Math.min(v.x1, Math.max(v.x0, snap(p.x))), y: Math.min(v.y1, Math.max(v.y0, snap(p.y))) };
  if (S.map) S.map = { ...S.map, points: [{ p: S.est, kind: 'answer' }] };
  showResiduals(PRACTICE_STATIONS.map(s => s.id), residuals(S.est, m8Circles()), sumSquares(S.est, m8Circles()), S.est);
}

// 거리가 바뀌면 지진이 다시 난 것처럼 두 파를 처음부터 보여 줌
function replay() { anim = 0; animSpeed = Math.max(1, (sArrival(S.distance) + 2) / RACE_REAL_S); race.dataset.running = '1'; }
function step() {
  if (anim === null) return false;
  anim += DT * animSpeed;
  if (anim >= sArrival(S.distance) + 1) { anim = null; race.dataset.running = ''; return false; }
  return true;
}

const CONTROLS: Record<Control, string> = { dist: 'distCtl', rB: 'rBCtl', est: 'estBox' };
const PANELS: Record<Panel, string> = { race: 'raceBox', record: 'recordBox', map: 'mapBox' };
function configure(c: Scene) {
  S.panel = c.panel ?? 'race';
  (Object.keys(PANELS) as Panel[]).forEach(k => { $(PANELS[k]).hidden = k !== S.panel; });
  if (S.panel === 'race') rsize = fitCanvas(race);
  if (c.distance !== undefined && c.distance !== S.distance) { S.distance = c.distance; distIn.value = String(S.distance); replay(); }
  // 같은 기록이면 마커를 그대로 둠 (단계를 오가도 판독 위치 유지). 확정 상태로 여는 단계는 정답 위치로
  if (c.record !== undefined && c.record !== S.record) { S.record = c.record; seis.load(recordFor(c.record)); }
  if (S.panel === 'record') { ksize = fitCanvas(recordCv); if (c.confirmed) seis.confirm(); }
  if (c.map) S.map = c.map;
  if (c.rB !== undefined) rBIn.value = String(c.rB);
  if (S.panel === 'map') msize = fitCanvas(mapCv);
  // 끌기는 M8 추정점 단계에서만. 다른 단계에서는 지도 위에서도 페이지를 스크롤할 수 있게
  mapCv.style.touchAction = c.open.includes('est') ? 'none' : 'manipulation';
  (Object.keys(CONTROLS) as Control[]).forEach(k => { $(CONTROLS[k]).hidden = !c.open.includes(k); });
  if (c.est) setEst(c.est);
  draw();
}
const FREE: Scene = { open: ['dist'] };
const game: Game = {
  configure, target: c => c in PANELS ? $(PANELS[c as Panel]) : $(CONTROLS[c as Control]),
  markers: () => seis.markers(),
  confirmRecord: () => seis.confirm(),
  estimate: () => ({ ...S.est }),
  nudgeEst: (dx, dy) => setEst({ x: S.est.x + dx * 0.1, y: S.est.y + dy * 0.1 }),
};

const DONE_KEY = 'seismic-analyst:done';
const done = parseDone(load(DONE_KEY));
const STEPS = missionSteps(game);
function markDone(m: string) { if (!done.includes(m)) { done.push(m); save(DONE_KEY, JSON.stringify(done)); } }
const MISSIONS = [...new Set(STEPS.map(s => s.mission).filter((m): m is string => !!m))];
// 확인용 바로가기 ?from=M7 (FR-020, 링크 없음, 02와 같은 규칙): 첫 시작만 그 미션의 첫 단계로 엶.
// 앞 미션을 끝낸 것으로 친 목록은 시작 위치 계산에만 쓰고 저장하지 않음. 모르는 값은 무시
const fromParam = new URLSearchParams(location.search).get('from')?.trim().toUpperCase() ?? '';
let from = MISSIONS.includes(fromParam) ? fromParam : null;
function startIndex() {
  const missions = STEPS.map(s => s.mission);
  if (!from) return resumeIndex(missions, done);
  const i = resumeIndex(missions, MISSIONS.slice(0, MISSIONS.indexOf(from))); from = null; return i;
}

const answer = createAnswer(raw => tut.emit('answer', raw));
const tut = createTutorial({
  steps: STEPS, episode: 'seismic-analyst', ctrl: $('tutCtrl'),
  resume: startIndex,
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

rBIn.addEventListener('input', () => tut.emit('rB', +rBIn.value));
// M8 추정점 끌기와 0.1 km 버튼 (touch-action은 configure가 단계마다 정함)
bindPointerDrag(mapCv, (x, y) => {
  if (!estOpen() || !msize) return;
  const p = pickAt(msize, x, y, S.map?.view); if (p) { setEst(p); tut.emit('est'); }
});
mapCv.style.touchAction = 'manipulation';
// 지도 탭: km 좌표를 현재 단계에 전달 (M7 진앙 고르기)
mapCv.addEventListener('click', e => { if (!msize) return; const r = mapCv.getBoundingClientRect(), p = pickAt(msize, e.clientX - r.left, e.clientY - r.top); if (p) tut.emit('pick', { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 }); });
distIn.addEventListener('input', () => { S.distance = +distIn.value; replay(); draw(); tut.emit('dist', S.distance); });
bindInfoTips($('tut'));
// 테마 색: 시스템·data-theme 전환과, 스타일이 늦게 적용되는 첫 로드(WebKit, Issue #36) 모두에서 다시 읽음
onThemeChange(() => { C = readColors(); draw(); });
window.addEventListener('resize', () => { if (S.panel === 'race') rsize = fitCanvas(race); if (S.panel === 'record') ksize = fitCanvas(recordCv); if (S.panel === 'map') msize = fitCanvas(mapCv); draw(); });
const showNotes = () => { $('notes').innerHTML = '<h2>' + tr('이 모델이 단순화한 것', 'What this model simplifies') + '</h2>' + notesHtml(); };
onLangChange(() => { draw(); showNotes(); if (tut.current()) tut.render(false); if (!$('resumeBox').hidden) askResume(); });
bindLangButton($('langBtn'));
applyLang(); showNotes(); rsize = fitCanvas(race); distIn.value = String(S.distance);
startFixedStepLoop({ dt: DT, active: () => race.dataset.running === '1', step, frame: draw });
if (from) tut.start(); else if (!askResume()) tut.autoStart();
