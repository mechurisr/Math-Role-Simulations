#!/usr/bin/env node
// 03 지진 분석관 M7 해안선 만들기 (1회성, 결과만 커밋). Node 내장 모듈만 쓴다 (research R2).
//   1. 원본을 내려받아 scripts/data/ 에 둔다 (scripts/data/ 는 .gitignore — 원본은 커밋하지 않음)
//      curl -L -o scripts/data/ne_10m_land.geojson <아래 SOURCE>
//   2. node scripts/build-coastline.mjs
// 환산은 에피소드의 geo.ts를 그대로 import한다 (Node 26 타입 지우기). 해안선·관측소·USGS 점이 같은 식을 쓰게 (C-010, 스펙 검토 R5)
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { toKm } from '../episodes/03-seismic-analyst/src/model/geo.ts';

const ROOT = join(dirname(new URL(import.meta.url).pathname), '..');
const SOURCE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/ace5fed0eaf3c6c03c951e75b439ba8fffbc218e/geojson/ne_10m_land.geojson';
const SHA256 = '1ac90796408bc6ad6911d69448485d3c4dbf2190370080368a09976e1c9f7416';
const INPUT = join(ROOT, 'scripts/data/ne_10m_land.geojson');
const OUTPUT = join(ROOT, 'episodes/03-seismic-analyst/src/model/coastline.ts');
const LONLAT_BOX = { lon0: 127.5, lon1: 130.7, lat0: 34.5, lat1: 37.3 };   // 이 상자와 겹치는 고리만
const KM_BOX = { x0: -20, x1: 220, y0: -20, y1: 220 };                       // 지도 0~200 km + 여백
const ROUND = 0.1, MIN_STEP = 0.3;                                            // km

if (!existsSync(INPUT)) { console.error(`원본이 없습니다: ${INPUT}\n내려받기: curl -L -o scripts/data/ne_10m_land.geojson ${SOURCE}`); process.exit(1); }
const raw = readFileSync(INPUT);
const hash = createHash('sha256').update(raw).digest('hex');
if (hash !== SHA256) { console.error(`SHA-256이 다릅니다: ${hash}\n기대값: ${SHA256}`); process.exit(1); }

const geo = JSON.parse(raw.toString('utf8'));
const rings = [];
for (const f of geo.features) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of polys) for (const ring of poly) {
    let hit = false;
    for (const [lon, lat] of ring) if (lon >= LONLAT_BOX.lon0 && lon <= LONLAT_BOX.lon1 && lat >= LONLAT_BOX.lat0 && lat <= LONLAT_BOX.lat1) { hit = true; break; }
    if (hit) rings.push(ring.map(([lon, lat]) => toKm({ lat, lon })));
  }
}

// Sutherland–Hodgman: 볼록한 사각형으로 다각형 자르기 (채우기용. 상자 가장자리를 따라가는 변이 생길 수 있음)
function clip(poly) {
  const edges = [
    [p => p.x >= KM_BOX.x0, (a, b) => cut(a, b, 'x', KM_BOX.x0)], [p => p.x <= KM_BOX.x1, (a, b) => cut(a, b, 'x', KM_BOX.x1)],
    [p => p.y >= KM_BOX.y0, (a, b) => cut(a, b, 'y', KM_BOX.y0)], [p => p.y <= KM_BOX.y1, (a, b) => cut(a, b, 'y', KM_BOX.y1)],
  ];
  let out = poly;
  for (const [inside, inter] of edges) {
    const inp = out; out = [];
    for (let i = 0; i < inp.length; i++) {
      const cur = inp[i], prev = inp[(i + inp.length - 1) % inp.length];
      if (inside(cur)) { if (!inside(prev)) out.push(inter(prev, cur)); out.push(cur); }
      else if (inside(prev)) out.push(inter(prev, cur));
    }
    if (!out.length) break;
  }
  return out;
}
function cut(a, b, k, v) { const t = (v - a[k]) / (b[k] - a[k]); return { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y), [k]: v }; }

const r1 = v => Math.round(v / ROUND) * ROUND;
const out = [];
for (const ring of rings) {
  const c = clip(ring); if (c.length < 3) continue;
  const pts = [];
  for (const p of c) {
    const q = { x: r1(p.x), y: r1(p.y) }, last = pts[pts.length - 1];
    if (!last || Math.hypot(q.x - last.x, q.y - last.y) >= MIN_STEP) pts.push(q);
  }
  if (pts.length >= 3) out.push(pts.flatMap(p => [+p.x.toFixed(1), +p.y.toFixed(1)]));
}

const body = out.map(r => '  [' + r.join(',') + ']').join(',\n');
const ts = `// 생성 파일: 손대지 말 것. 만든 명령: node scripts/build-coastline.mjs
// 출처: Natural Earth 1:10m Land (퍼블릭 도메인, 저작자 표시 불필요 https://www.naturalearthdata.com/about/terms-of-use/)
//   ${SOURCE}
//   SHA-256 ${SHA256}
// 환산: model/geo.ts의 toKm (원점 35.0°N 128.0°E, 기준 위도 36.0°, R 6371 km). ${KM_BOX.x0} ~ ${KM_BOX.x1} km 상자로 자름, ${ROUND} km 반올림, ${MIN_STEP} km 미만 점 제거
// 고리마다 x0, y0, x1, y1, … (km). 육지 채우기는 evenodd
export const COASTLINE: readonly (readonly number[])[] = [
${body},
];
`;
writeFileSync(OUTPUT, ts);
console.log(`고리 ${out.length}개, 점 ${out.reduce((n, r) => n + r.length / 2, 0)}개, ${Buffer.byteLength(ts)} 바이트 → ${OUTPUT}`);
