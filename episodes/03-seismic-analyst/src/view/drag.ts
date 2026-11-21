// 끌기 도우미: 포인터를 잡아(setPointerCapture) 누르는 동안 위치를 요소 기준 CSS px로 알려 줌.
// touch-action:none이라 끄는 동안 페이지가 스크롤되지 않음 (US4 시나리오 5와 같은 요구)
export function bindPointerDrag(el: HTMLElement, onMove: (x: number, y: number, start: boolean) => void): () => void {
  let dragging = false;
  el.style.touchAction = 'none';
  const at = (e: PointerEvent, start: boolean) => { const r = el.getBoundingClientRect(); onMove(e.clientX - r.left, e.clientY - r.top, start); };
  const down = (e: PointerEvent) => { dragging = true; el.setPointerCapture(e.pointerId); at(e, true); };
  const move = (e: PointerEvent) => { if (dragging) at(e, false); };
  const up = () => { dragging = false; };
  el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  return () => {
    el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
  };
}
