// 모델의 단순화 고지 (FR-012). 실제 F1과 같다고 쓰지 않음 (C-004)
import { tr } from '@series/engine/i18n';

export const notesHtml = () => '<ul class="note-list">' + [
  tr('리어 윙의 항력을 뺐습니다. 실제로는 윙을 세우면 직선 속도가 줄어듭니다.', 'Rear wing drag is left out. In reality more wing costs straight-line speed.'),
  tr('타이어의 하중 민감도를 뺐습니다. 실제 타이어는 하중이 커지면 마찰계수가 조금씩 줄어, 다운포스 효과가 여기보다 작습니다.', 'Tyre load sensitivity is left out. Real tyres lose a little friction under load, so downforce helps less than shown here.'),
  tr('질량, 마찰계수, 다운포스 계수, 최고 속도는 게임용 값입니다.', 'Mass, friction, downforce coefficient and top speed are game values.'),
  tr('코너 반지름은 공개된 속도와 횡가속도로 역산했거나 게임용으로 정한 값이며 실제 코너를 잰 값이 아닙니다.', 'Corner radii are back-calculated from published speed and lateral g, or chosen for the game. They are not measured from real corners.'),
  tr('횡가속도가 실제 자료의 5 g보다 크게 나올 수 있습니다. 코너 2는 6.90 g입니다.', 'Lateral g can exceed the roughly 5 g in published figures. Corner 2 reaches 6.90 g.'),
].map(t => `<li>${t}</li>`).join('') + '</ul>';
