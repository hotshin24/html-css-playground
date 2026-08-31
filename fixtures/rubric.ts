/**
 * 판정 조건 픽스처.
 *
 * **`public/sample-design.svg`에서 도출했다.** 정답 코드(fixtures/solutions.ts)에
 * 맞춰 쓰지 않는다. 조건을 코드에 맞추면 독립성이 반대 방향으로 깨진다.
 *
 * AI 분석이 붙기 전까지 손으로 작성한 조건으로 판정 로직을 검증한다.
 * 통짜 모드이므로 구역은 하나이며 시안 전체를 범위로 한다 (PRD 6.6).
 *
 * 시안에서 읽은 사실
 * - 상단 메뉴 항목 4개가 가로 한 줄
 * - 히어로에 큰 제목, 설명, 버튼, 이미지 1개
 * - 인기 상품 카드 6개가 가로 3개씩 2행. 각 카드에 이미지·상품명·가격
 * - 폼 요소는 없다 → form-label 조건은 생성하지 않는다
 */

export const SAMPLE_ANALYSIS = {
  mainTitleSectionId: "sec-01",
  sections: [
    {
      id: "sec-01",
      order: 1,
      rubric: [
        {
          id: "r1",
          level: "required",
          type: "list-grouping",
          target: "주 메뉴",
          desc: "반복되는 메뉴 항목 4개를 목록으로 묶을 것",
          // 1차원 반복이라 반복 단위 해석이 갈리지 않는다.
          accept: [{ groupCount: 1, itemsPerGroup: 4 }],
          hints: {
            "1": "상단 메뉴 영역의 구조를 다시 확인해보세요.",
            "2": "메뉴 항목이 같은 구조로 반복되고 있습니다. 이런 반복을 어떻게 표현하는지 생각해보세요.",
            "3": "반복되는 메뉴 항목은 목록 요소로 묶습니다.",
          },
        },
        {
          id: "r2",
          level: "required",
          type: "layout-result",
          target: "주 메뉴",
          desc: "메뉴 항목 4개가 가로 한 줄로 놓일 것",
          accept: [{ columns: 4, rows: 1 }],
          hints: {
            "1": "상단 메뉴의 배치를 시안과 비교해보세요.",
            "2": "메뉴 항목이 세로로 쌓여 있지는 않은지 확인해보세요.",
            "3": "메뉴 항목 4개는 가로 한 줄로 배치해야 합니다.",
          },
        },
        {
          id: "r3",
          level: "required",
          type: "list-grouping",
          target: "인기 상품 카드",
          desc: "반복되는 상품 카드 6개를 목록으로 묶을 것",
          // 2차원 격자라 반복 단위를 카드로 볼 수도, 행으로 볼 수도 있다.
          accept: [
            { groupCount: 1, itemsPerGroup: 6 },
            { groupCount: 2, itemsPerGroup: 3 },
          ],
          hints: {
            "1": "인기 상품 영역의 구조를 다시 확인해보세요.",
            "2": "카드가 같은 구조로 여섯 번 반복되고 있습니다.",
            "3": "반복되는 상품 카드는 목록 요소로 묶습니다.",
          },
        },
        {
          id: "r4",
          level: "required",
          type: "layout-result",
          target: "인기 상품 카드",
          desc: "상품 카드 6개가 가로 3개씩 2행으로 놓일 것",
          accept: [{ columns: 3, rows: 2 }],
          hints: {
            "1": "인기 상품 영역의 배치를 시안과 비교해보세요.",
            "2": "카드가 한 줄에 몇 개씩 놓여야 하는지 시안에서 세어보세요.",
            "3": "상품 카드는 가로 3개씩 2행으로 배치해야 합니다.",
          },
        },
        {
          id: "r5",
          level: "required",
          type: "image-alt",
          target: "시안의 이미지",
          desc: "의미 있는 이미지에 대체 텍스트를 둘 것",
          hints: {
            "1": "이미지 요소의 속성을 다시 확인해보세요.",
            "2": "화면을 볼 수 없는 사용자에게 상품 이미지를 어떻게 설명할지 생각해보세요.",
            "3": "모든 이미지에는 대체 텍스트 속성이 필요합니다. 장식용이라면 빈 값으로 둡니다.",
          },
        },
        {
          id: "s1",
          level: "recommended",
          type: "semantic-suggestion",
          target: "주 메뉴",
          desc: "주요 내비게이션 영역은 nav로 감싸는 것을 권장합니다.",
        },
        {
          id: "s2",
          level: "recommended",
          type: "semantic-suggestion",
          target: "인기 상품 카드",
          desc: "반복되는 카드는 article로 표현할 수 있습니다.",
        },
        {
          id: "s3",
          level: "recommended",
          type: "semantic-suggestion",
          target: "저작권 표시",
          desc: "문서 하단의 저작권 표시는 footer로 감싸는 것을 권장합니다.",
        },
      ],
    },
  ],
};

/**
 * 폼 검증용 별도 픽스처.
 *
 * 시안에 폼이 없어 `form-label`을 위 조건에 넣을 수 없다. 그러나 유형 자체는
 * 판정 대상이므로, 검색 폼이 있는 최소 시안을 가정해 따로 둔다.
 */
export const FORM_ANALYSIS = {
  mainTitleSectionId: "form-01",
  sections: [
    {
      id: "form-01",
      order: 1,
      rubric: [
        {
          id: "f1",
          level: "required",
          type: "form-label",
          target: "검색 입력창",
          desc: "검색 입력창에 레이블을 연결할 것",
          hints: {
            "1": "입력창 주변의 설명 문구를 확인해보세요.",
            "2": "설명 문구와 입력창이 서로 연결되어 있는지 생각해보세요.",
            "3": "입력창에는 레이블을 연결해야 합니다.",
          },
        },
      ],
    },
  ],
};

export const FORM_SOLUTION = {
  html: `<h1>검색</h1>
<form>
  <label for="q">검색어</label>
  <input id="q" type="search" name="q">
  <button type="submit">검색</button>
</form>`,
  css: "",
};
