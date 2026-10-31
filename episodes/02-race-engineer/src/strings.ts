// HTML에 고정된 문구 (data-i18n)
import { P } from '@series/engine/i18n';

export const STRINGS = {
  docTitle: P('레이스 엔지니어', 'Race Engineer'),
  title: P('레이스 <span>엔지니어</span>', 'Race <span>Engineer</span>'),
  lead: P('드라이버가 묻습니다. "얼마까지 밟아도 돼?" 타이어의 한계를 계산해 무전으로 알려 주세요.', 'Your driver asks, "How fast can I take it?" Work out the limit of the tyres and radio it in.'),
  tutOpen: P('미션 시작', 'Start missions'),
  aStage: P('위에서 내려다본 코너', 'A corner seen from above'),
  aGraph: P('속도에 따른 힘 그래프', 'Force against speed graph'),
  aNotes: P('모델의 단순화', 'What the model simplifies'),
  aForces: P('힘 비교', 'Force comparison'),
  aPanel: P('조작 패널', 'Controls'),
  reqL: P('필요한 힘', 'Force needed'),
  availL: P('낼 수 있는 힘', 'Force available'),
  speedL: P('진입 속도', 'Entry speed'),
  radiusL: P('코너 반지름', 'Corner radius'),
  surfaceL: P('노면', 'Track surface'),
  dry: P('건조', 'Dry'),
  wet: P('젖음', 'Wet'),
  wingL: P('리어 윙', 'Rear wing'),
  wingNone: P('없음', 'None'),
  wingMid: P('중간', 'Medium'),
  wingHigh: P('높음', 'High'),
  go: P('출발', 'Go'),
};
