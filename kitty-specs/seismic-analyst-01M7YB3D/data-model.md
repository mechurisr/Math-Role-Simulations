# Data Model: 지진 분석관

## 값 객체

### Point · Station

```ts
type Point = { x: number; y: number };          // km, 지도 평면
type Station = { id: string; pos: Point; spTime: number }; // spTime: 정답용 S-P 시간 (s)
```

### Circle · Line

```ts
type Circle = { center: Point; r: number };     // r > 0 (km)
type Line = { a: number; b: number; c: number }; // ax + by = c, (a, b) ≠ (0, 0)
```

불변식: 두 원의 직선은 원 P − 원 Q로 만든다 — a = 2(Q.x − P.x), b = 2(Q.y − P.y), c = (Q.x² + Q.y² − r_Q²) − (P.x² + P.y² − r_P²). 같은 중심의 두 원에서는 만들지 않는다.

### Intersection (판별 유니언)

```ts
type Intersection =
  | { count: 0; reason: 'apart' | 'inside' }
  | { count: 1; point: Point }
  | { count: 2; points: [Point, Point] };
```

불변식: 개수를 먼저 판정하고, count = 0이면 교점을 계산하지 않는다.

### Seismogram

```ts
type Seismogram = { pArrival: number; sArrival: number; end: number }; // 기록 시작부터의 초, pArrival = 3
```

불변식: sArrival − pArrival = 그 관측소의 S-P 시간, end = sArrival + 5. 지진 발생 시각은 담지 않는다.

### GeoPoint

```ts
type GeoPoint = { lat: number; lon: number };   // 도
```

`toKm(GeoPoint): Point`는 C-010 고정값만 쓴다 (원점 35.0°N·128.0°E, φ_ref 36.0°, R 6371 km).

## 판정

```ts
type Verdict =
  | { ok: true; confirmed?: number | Point }    // 중간값이면 확정된 정답값을 함께 돌려줌
  | { ok: false; reason: 'tooHigh' | 'tooLow' | 'far' | 'notSameLine' | 'wrongPoint' | 'wrongChoice' | 'invalid' };
```

- 중간값(판독값·거리·반지름): 통과하면 `confirmed`에 정답값. 화면과 다음 판정은 이 값을 쓴다
- 최종 답(거리·좌표·직선·잔차 제곱합): 학습자 입력 원값으로 판정
- `invalid`: 비었거나 숫자 아님, 거리·반지름 ≤ 0, 직선 a = b = 0, S 마커가 P 마커보다 앞

## 미션 상태

```ts
type MissionId = 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6' | 'M7' | 'M8';
type Progress = { done: MissionId[] };
```

M7 관측소별 단계: `reading → distance → drawn` (앞 단계를 통과해야 다음이 열림). 세 관측소가 모두 `drawn`이 되면 좌표 입력이 열린다.

## 상수 (`model/constants.ts`, 출처는 answers.md 물리값 표)

| 이름 | 값 |
|---|---|
| VP, VS | 6.0, 3.5 km/s [game value] |
| PRACTICE_STATIONS | A (16, 77) 12.5 s · B (100, 77) 7.5 s · C (184, 140) 10.0 s |
| M2_RECORD | P 3.0 s, S 18.0 s, 구간 0 ~ 23.0 s |
| M3_CANDIDATES | (121, 77), (79, 161), (16, 182), (100, 100), (40, 183) |
| GYEONGJU_EPICENTER | 35.7808°N, 129.2162°E (USGS us10006p1f), 깊이 13 km |
| M7_STATIONS | (30, 40) 11.0 s · (110, 30) 6.8 s · (80, 170) 10.5 s [game value] |
| M8_READINGS | A 12.0 s · B 7.0 s · C 10.5 s |
| M8_VIEW | x 88 ~ 108, y 128 ~ 148, 시작점 (100, 140) |
