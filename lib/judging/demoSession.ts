/**
 * 화면 연결 확인을 위한 임시 학습 세션.
 *
 * 조건 JSON은 8번 작업에서 작성한다. 정답 코드(7번)를 시안만 보고 써야 하므로
 * 지금 시안에 맞는 조건을 만들면 그 독립성이 깨진다. 따라서 여기에는
 * **AI 생성 조건을 두지 않고**, 파라미터가 없고 검사 내용이 고정된 엔진 상시
 * 조건만으로 화면을 연결한다.
 *
 * 3단계에서 소스 등록·AI 분석이 붙으면 이 파일은 사라진다.
 */

import type { SectionInput } from "@/lib/judging/combined";
import type { RecommendedCondition } from "@/lib/judging/schema";

/** 현재 학습 중인 구역. */
export const DEMO_CURRENT_SECTION_ID = "sec-02";

/** 최상위 제목이 있는 구역. 이 구역부터 문서 전체 범위 조건이 적용된다. */
export const DEMO_MAIN_TITLE_SECTION_ID = "sec-02";

/** 안내만 하고 통과를 막지 않는 조건. */
export const DEMO_RECOMMENDED: RecommendedCondition[] = [
  {
    id: "s1",
    level: "recommended",
    target: "주 메뉴",
    desc: "주요 내비게이션 영역은 nav로 감싸는 것을 권장합니다.",
  },
  {
    id: "s2",
    level: "recommended",
    target: "제품 타일",
    desc: "반복되는 카드는 article로 표현할 수 있습니다.",
  },
];

/**
 * 구역 구성.
 *
 * 첫 구역은 시도를 소진해 예시가 공개된 상태로 둔다. 결합 판정에서 학습자
 * 코드 대신 예시 코드가 쓰이고, 그 사실이 화면에 표시되는지 확인하기 위한
 * 것이다 (F-08-08).
 */
export function buildDemoSections(currentHtml: string, currentCss: string): SectionInput[] {
  return [
    {
      id: "sec-01",
      order: 1,
      status: "revealed",
      // 최상위 제목을 둘 쓴 채 소진한 상태. 그대로 결합하면 이후 구역이
      // 무엇을 작성해도 통과할 수 없다.
      code: { html: "<h1>SHOP</h1><h1>메뉴</h1>", css: "" },
      example: { html: '<header><a href="#">SHOP</a></header>', css: "" },
    },
    {
      id: "sec-02",
      order: 2,
      status: "in_progress",
      code: { html: currentHtml, css: currentCss },
      example: {
        html: "<h1>새로운 계절, 새로운 선택</h1>",
        css: "",
      },
    },
    {
      id: "sec-03",
      order: 3,
      status: "locked",
      code: { html: "", css: "" },
      example: { html: "", css: "" },
    },
  ];
}
