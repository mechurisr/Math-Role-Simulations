// 02 레이스 엔지니어: 화면 연결. 계산은 model/, 그리기는 view/
import '@series/engine/css/ui/theme.css';
import '@series/engine/css/ui/components.css';
import '@series/engine/css/tutorial/tutorial.css';
import { applyLang, bindLangButton, defineStrings, onLangChange, tr } from '@series/engine/i18n';
import { byId as $, fitCanvas, onThemeChange, readCssVars, THEME_KEYS, type CanvasSize } from '@series/engine/ui';
import { startFixedStepLoop } from '@series/engine/sim';
import { G, MASS, TOP_SPEED_KMH, type Surface, type Wing } from './model/constants';
import { availableForce, cornerValues, gripLimit, holdsGrip, kmhToMs, msToKmh, requiredForce, type CornerSetup } from './model/corner';
import { drawBars } from './view/bars';
import { drawScene, rampAt, slipAt, type SceneRun } from './view/scene';
import { STRINGS } from './strings';
import './style.css';

defineStrings(STRINGS);

const DT = 1 / 60, LAP = 2.2, SLIDE = 1;   // 호 한 번 도는 시간, 미끄러지는 시간 (s, 화면 표현용)
const stage = $<HTMLCanvasElement>('stage'), ctx = stage.getContext('2d')!;
const speedIn = $<HTMLInputElement>('speed'), radiusIn = $<HTMLInputElement>('radius');
const S: CornerSetup & { speed: number } = { speed: 120, radius: 80, surface: 'dry', wing: 'none' };
let C = readCssVars(THEME_KEYS), size: CanvasSize | undefined, run: SceneRun | null = null, passed = false;

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

function draw() {
  if (!size) return;
  drawScene(ctx, size, C, S.radius, run);
  const { req, avail } = forces(), { mu, k } = cornerValues(S);
  drawBars(req, avail, run ? req * rampAt(run.slipP ?? run.p) : req);
  $('speedV').textContent = S.speed + ' km/h'; $('radiusV').textContent = S.radius + ' m';
  $('cond').textContent = `m = ${MASS} kg · g = ${G} m/s² · μ = ${mu} · k = ${k} kg/m · r = ${S.radius} m`;
  $('limit').textContent = limitText();
}

function setResult(outcome: '' | 'pass' | 'slid') {
  stage.dataset.outcome = outcome;
  $('status').textContent = outcome === 'pass' ? tr('코너 통과', 'Through the corner') : outcome === 'slid' ? tr('필요한 힘이 낼 수 있는 힘을 넘어 미끄러졌습니다', 'It needed more force than the tyres had, so the car slid') : '';
}

function go() {
  // 판정은 계산으로 먼저 정하고 애니메이션은 결과만 보여 줌
  const { req, avail } = forces();
  passed = holdsGrip(gripLimit(cornerValues(S)), S.speed);
  run = { p: 0, slipP: null, slide: 0 };
  if (!passed) run.slipP = slipAt(avail / req);
  setResult(''); stage.dataset.running = '1';
}

function step() {
  if (!run) return false;
  if (run.slipP !== null && run.p >= run.slipP) run.slide += DT / SLIDE; else run.p += DT / LAP;
  if (run.p >= 1 || run.slide >= 1) { setResult(passed ? 'pass' : 'slid'); stage.dataset.running = ''; return false; }
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

speedIn.addEventListener('input', () => { S.speed = +speedIn.value; clearRun(); });
radiusIn.addEventListener('input', () => { S.radius = +radiusIn.value; clearRun(); });
bindMode('surface', v => { S.surface = v as Surface; });
bindMode('wing', v => { S.wing = v as Wing; });
$('go').onclick = go;
onThemeChange(() => { C = readCssVars(THEME_KEYS); draw(); });
window.addEventListener('resize', () => { size = fitCanvas(stage); draw(); });
onLangChange(draw);
bindLangButton($('langBtn'));
applyLang(); size = fitCanvas(stage);
startFixedStepLoop({ dt: DT, active: () => stage.dataset.running === '1', step, frame: draw });
