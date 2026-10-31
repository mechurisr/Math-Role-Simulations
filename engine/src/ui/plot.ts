// 범용 그래프 도구: 값 → 픽셀 축척, 축, 곡선. 에피소드 상태를 모름
export interface PlotBox { left: number; top: number; right: number; bottom: number }

// 선형 축척: [d0, d1] → [r0, r1]. r1 < r0도 됨 (캔버스 y축은 아래로 증가)
export const linearScale = (d0: number, d1: number, r0: number, r1: number) => (v: number) => r0 + (v - d0) / (d1 - d0) * (r1 - r0);

export function drawAxes(cx: CanvasRenderingContext2D, b: PlotBox, color: string) {
  cx.strokeStyle = color; cx.lineWidth = 1; cx.setLineDash([]);
  cx.beginPath(); cx.moveTo(b.left, b.top); cx.lineTo(b.left, b.bottom); cx.lineTo(b.right, b.bottom); cx.stroke();
}

// x0~x1을 n칸으로 나눠 f(x)를 잇는 곡선
export function drawCurve(cx: CanvasRenderingContext2D, x0: number, x1: number, n: number, f: (x: number) => number, sx: (x: number) => number, sy: (y: number) => number, color: string) {
  cx.strokeStyle = color; cx.lineWidth = 2; cx.setLineDash([]); cx.beginPath();
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; i ? cx.lineTo(sx(x), sy(f(x))) : cx.moveTo(sx(x), sy(f(x))); }
  cx.stroke();
}
