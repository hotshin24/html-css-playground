/**
 * AI가 생성한 조건 픽스처 — PRD 8.2 재측정용.
 *
 * 같은 시안(`public/sample-design.svg`를 PNG로 변환한 것)을 통짜 모드로 3회
 * 분석해 받은 결과다. 캐시 키에 회차를 섞어 서로 독립된 호출로 받았다.
 *
 * **커밋해 두는 이유:** 판정 로직을 고칠 때마다 API를 다시 부르면 조건이
 * 매번 달라져 수치 변화가 판정 변경 때문인지 조건 변경 때문인지 구분할 수
 * 없다. 조건을 고정해야 판정 로직 변경의 효과만 분리해 볼 수 있다.
 *
 * `example`은 3단계가 만든 모범 예시다. 조건을 보고 만들어진 코드이므로
 * 시안만 보고 작성한 fixtures/solutions.ts 와는 성격이 다르며, 오탐 집계에서
 * 구분한다.
 */

export type AiRun = {
  id: string;
  rubric: unknown[];
  example: { html: string; css: string };
};

export const AI_RUNS: AiRun[] = [
  {
    "id": "run1",
    "rubric": [
      {
        "id": "r1",
        "level": "required",
        "type": "list-grouping",
        "target": "주 메뉴",
        "desc": "상단 오른쪽에 반복되는 메뉴 항목 4개를 목록으로 묶을 것",
        "accept": [
          {
            "groupCount": 1,
            "itemsPerGroup": 4
          }
        ],
        "hints": {
          "1": "페이지 맨 위 오른쪽 메뉴 영역을 다시 확인해보세요.",
          "2": "같은 형태의 메뉴 항목이 네 번 반복되고 있습니다. 이런 반복을 어떻게 표현할지 생각해보세요.",
          "3": "반복되는 메뉴 항목들은 하나의 목록 요소로 묶어 표현합니다."
        }
      },
      {
        "id": "r2",
        "level": "required",
        "type": "layout-result",
        "target": "사이트 머리말",
        "desc": "로고와 메뉴가 같은 가로줄에 놓이고, 로고는 왼쪽 끝, 메뉴는 오른쪽 끝에 위치할 것",
        "accept": [
          {
            "columns": 2,
            "rows": 1
          }
        ],
        "hints": {
          "1": "머리말 영역의 가로 배치를 다시 확인해보세요.",
          "2": "로고와 메뉴가 위아래로 쌓이지 않고 한 줄에 나란히 놓여야 합니다.",
          "3": "로고는 왼쪽 끝, 메뉴 묶음은 오른쪽 끝에 오도록 두 덩어리를 같은 줄에 배치하세요."
        }
      },
      {
        "id": "r3",
        "level": "required",
        "type": "layout-result",
        "target": "소개 영역",
        "desc": "왼쪽 텍스트 묶음과 오른쪽 대표 이미지가 한 줄에 좌우로 나란히 놓일 것",
        "accept": [
          {
            "columns": 2,
            "rows": 1
          }
        ],
        "hints": {
          "1": "큰 제목이 있는 소개 영역의 배치를 확인해보세요.",
          "2": "텍스트 묶음과 이미지가 세로로 쌓이지 않고 좌우로 나뉘어 보입니다.",
          "3": "텍스트 덩어리와 이미지 덩어리를 같은 가로줄의 두 칸으로 놓이게 만드세요."
        }
      },
      {
        "id": "r4",
        "level": "required",
        "type": "list-grouping",
        "target": "상품 목록",
        "desc": "이미지·이름·가격이 같은 구조로 반복되는 상품 항목 6개를 목록으로 묶을 것",
        "accept": [
          {
            "groupCount": 1,
            "itemsPerGroup": 6
          },
          {
            "groupCount": 2,
            "itemsPerGroup": 3
          }
        ],
        "hints": {
          "1": "'인기 상품' 아래 카드들이 놓인 영역을 확인해보세요.",
          "2": "이미지, 이름, 가격이 동일한 구조로 여섯 번 반복되고 있습니다.",
          "3": "반복되는 상품 카드들은 목록 요소로 묶고, 각 카드를 하나의 항목으로 표현하세요."
        }
      },
      {
        "id": "r5",
        "level": "required",
        "type": "layout-result",
        "target": "상품 목록",
        "desc": "상품 카드 6개가 가로 3개씩 2행으로 놓일 것",
        "accept": [
          {
            "columns": 3,
            "rows": 2
          }
        ],
        "hints": {
          "1": "'인기 상품' 아래 카드들이 어떻게 늘어서 있는지 확인해보세요.",
          "2": "카드가 한 줄에 세 개씩, 두 줄로 나뉘어 보입니다.",
          "3": "상품 카드 6개가 가로 3개씩 2행을 이루도록 배치하세요."
        }
      },
      {
        "id": "r6",
        "level": "required",
        "type": "image-alt",
        "target": "대표 이미지 및 상품 이미지",
        "desc": "소개 영역의 대표 이미지와 각 상품 이미지에 대체 텍스트를 제공할 것",
        "accept": [
          {}
        ],
        "hints": {
          "1": "이미지가 들어가는 자리들을 다시 살펴보세요.",
          "2": "이미지가 보이지 않는 상황에서도 내용을 알 수 있어야 합니다.",
          "3": "의미를 가진 이미지에는 대체 텍스트 속성을 빠짐없이 넣어주세요."
        }
      },
      {
        "id": "r7",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "사이트 머리말 / 사이트 꼬리말",
        "desc": "페이지 최상단 영역은 header, 최하단 저작권 영역은 footer로 표현하는 것을 권장합니다"
      },
      {
        "id": "r8",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "주 메뉴",
        "desc": "주요 내비게이션 링크 묶음은 nav로 감싸는 것을 권장합니다"
      },
      {
        "id": "r9",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "제목 요소",
        "desc": "'새로운 계절, 새로운 선택'을 페이지 최상위 제목으로, '인기 상품'을 그 하위 단계 제목으로 두어 제목 단계를 순서대로 구성하는 것을 권장합니다"
      },
      {
        "id": "r10",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "상품 목록 구역 / 상품 항목",
        "desc": "'인기 상품' 묶음은 제목을 가진 하나의 구역(section)으로, 각 상품 카드는 article 등 독립 단위로 표현할 수 있습니다"
      },
      {
        "id": "r11",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "행동 유도 버튼",
        "desc": "'지금 둘러보기'가 다른 페이지로 이동하는 것이라면 링크로, 페이지 내 동작이라면 버튼으로 표현하는 것을 권장합니다"
      }
    ],
    "example": {
      "html": "<div class=\"page\">\n  <header class=\"site-header\">\n    <p class=\"logo\">SEASON</p>\n    <nav class=\"main-nav\" aria-label=\"주 메뉴\">\n      <ul class=\"main-nav__list\">\n        <li><a href=\"#new\">신상품</a></li>\n        <li><a href=\"#best\">베스트</a></li>\n        <li><a href=\"#sale\">세일</a></li>\n        <li><a href=\"#support\">고객지원</a></li>\n      </ul>\n    </nav>\n  </header>\n\n  <main>\n    <section class=\"intro\">\n      <div class=\"intro__text\">\n        <h1>새로운 계절, 새로운 선택</h1>\n        <p>가볍고 편안한 소재로 만든 이번 시즌 신상품을 만나보세요. 매일의 옷차림이 조금 더 즐거워집니다.</p>\n        <a class=\"button\" href=\"/products\">지금 둘러보기</a>\n      </div>\n      <div class=\"intro__media\">\n        <img src=\"images/hero.jpg\" alt=\"밝은 색 니트를 입고 창가에 서 있는 모델\">\n      </div>\n    </section>\n\n    <section class=\"products\" id=\"best\">\n      <h2>인기 상품</h2>\n      <ul class=\"product-list\">\n        <li>\n          <article class=\"product-card\">\n            <img src=\"images/product-1.jpg\" alt=\"베이지색 오버사이즈 니트 스웨터\">\n            <h3 class=\"product-card__name\">오버사이즈 니트 스웨터</h3>\n            <p class=\"product-card__price\">59,000원</p>\n          </article>\n        </li>\n        <li>\n          <article class=\"product-card\">\n            <img src=\"images/product-2.jpg\" alt=\"연청색 와이드 데님 팬츠\">\n            <h3 class=\"product-card__name\">와이드 데님 팬츠</h3>\n            <p class=\"product-card__price\">72,000원</p>\n          </article>\n        </li>\n        <li>\n          <article class=\"product-card\">\n            <img src=\"images/product-3.jpg\" alt=\"흰색 반팔 코튼 티셔츠\">\n            <h3 class=\"product-card__name\">코튼 반팔 티셔츠</h3>\n            <p class=\"product-card__price\">24,000원</p>\n          </article>\n        </li>\n        <li>\n          <article class=\"product-card\">\n            <img src=\"images/product-4.jpg\" alt=\"검은색 싱글 버튼 재킷\">\n            <h3 class=\"product-card__name\">싱글 버튼 재킷</h3>\n            <p class=\"product-card__price\">128,000원</p>\n          </article>\n        </li>\n        <li>\n          <article class=\"product-card\">\n            <img src=\"images/product-5.jpg\" alt=\"체크 무늬 머플러\">\n            <h3 class=\"product-card__name\">체크 머플러</h3>\n            <p class=\"product-card__price\">38,000원</p>\n          </article>\n        </li>\n        <li>\n          <article class=\"product-card\">\n            <img src=\"images/product-6.jpg\" alt=\"갈색 가죽 크로스백\">\n            <h3 class=\"product-card__name\">가죽 크로스백\n            </h3>\n            <p class=\"product-card__price\">96,000원</p>\n          </article>\n        </li>\n      </ul>\n    </section>\n  </main>\n\n  <footer class=\"site-footer\">\n    <p>&copy; 2024 SEASON. All rights reserved.</p>\n  </footer>\n</div>",
      "css": ".page {\n  max-width: 1080px;\n  margin: 0 auto;\n  padding: 0 24px;\n  font-family: system-ui, sans-serif;\n  color: #222;\n}\n\n.site-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 24px;\n  padding: 20px 0;\n  border-bottom: 1px solid #e5e5e5;\n}\n\n.logo {\n  margin: 0;\n  font-size: 22px;\n  font-weight: 700;\n  letter-spacing: 2px;\n}\n\n.main-nav__list {\n  display: flex;\n  gap: 24px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n\n.main-nav__list a {\n  color: #333;\n  text-decoration: none;\n  font-size: 15px;\n}\n\n.main-nav__list a:hover {\n  text-decoration: underline;\n}\n\n.intro {\n  display: flex;\n  align-items: center;\n  gap: 40px;\n  padding: 64px 0;\n}\n\n.intro__text {\n  flex: 1 1 50%;\n}\n\n.intro__media {\n  flex: 1 1 50%;\n}\n\n.intro__media img {\n  display: block;\n  width: 100%;\n  height: 320px;\n  object-fit: cover;\n  background-color: #f0f0f0;\n  border-radius: 8px;\n}\n\n.intro h1 {\n  margin: 0 0 16px;\n  font-size: 36px;\n  line-height: 1.3;\n}\n\n.intro p {\n  margin: 0 0 28px;\n  font-size: 16px;\n  line-height: 1.7;\n  color: #555;\n}\n\n.button {\n  display: inline-block;\n  padding: 12px 24px;\n  background-color: #222;\n  color: #fff;\n  text-decoration: none;\n  border-radius: 4px;\n  font-size: 15px;\n}\n\n.button:hover {\n  background-color: #444;\n}\n\n.products {\n  padding-bottom: 64px;\n}\n\n.products h2 {\n  margin: 0 0 28px;\n  font-size: 24px;\n}\n\n.product-list {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 32px 24px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n\n.product-card img {\n  display: block;\n  width: 100%;\n  height: 220px;\n  object-fit: cover;\n  background-color: #f0f0f0;\n  border-radius: 6px;\n}\n\n.product-card__name {\n  margin: 14px 0 6px;\n  font-size: 16px;\n  font-weight: 600;\n}\n\n.product-card__price {\n  margin: 0;\n  font-size: 15px;\n  color: #666;\n}\n\n.site-footer {\n  padding: 24px 0;\n  border-top: 1px solid #e5e5e5;\n  font-size: 14px;\n  color: #777;\n}\n\n.site-footer p {\n  margin: 0;\n}"
    }
  },
  {
    "id": "run2",
    "rubric": [
      {
        "id": "r1",
        "level": "required",
        "type": "list-grouping",
        "target": "주 메뉴",
        "desc": "상단 오른쪽의 메뉴 항목 4개(신상품·베스트·세일·문의)를 목록으로 묶을 것",
        "accept": [
          {
            "groupCount": 1,
            "itemsPerGroup": 4
          }
        ],
        "hints": {
          "1": "머리말 오른쪽 영역의 구조를 다시 확인해보세요.",
          "2": "같은 형태의 메뉴 글자가 나란히 반복되고 있습니다. 이런 반복을 무엇으로 표현할지 생각해보세요.",
          "3": "반복되는 메뉴 항목들은 하나의 목록 요소 안에 항목으로 넣어 묶습니다."
        }
      },
      {
        "id": "r2",
        "level": "required",
        "type": "layout-result",
        "target": "주 메뉴",
        "desc": "메뉴 항목 4개가 한 줄에 가로로 나란히 놓일 것",
        "accept": [
          {
            "columns": 4,
            "rows": 1
          }
        ],
        "hints": {
          "1": "머리말 메뉴의 배치 결과를 확인해보세요.",
          "2": "메뉴 항목들이 세로로 쌓이지 않고 한 줄에 놓여야 합니다.",
          "3": "네 개의 메뉴 항목이 같은 세로 위치에서 가로로 이어지도록 배치하세요."
        }
      },
      {
        "id": "r3",
        "level": "required",
        "type": "layout-result",
        "target": "주요 소개 영역",
        "desc": "왼쪽 텍스트 묶음과 오른쪽 대표 이미지가 한 줄에 좌우로 나란히 놓일 것",
        "accept": [
          {
            "columns": 2,
            "rows": 1
          }
        ],
        "hints": {
          "1": "큰 제목과 오른쪽 큰 회색 상자의 배치를 확인해보세요.",
          "2": "두 덩어리가 위아래로 쌓이지 않고 좌우로 나뉘어 있습니다.",
          "3": "텍스트 묶음은 왼쪽, 이미지 영역은 오른쪽에 같은 줄에서 나란히 오도록 배치하세요."
        }
      },
      {
        "id": "r4",
        "level": "required",
        "type": "list-grouping",
        "target": "상품 목록",
        "desc": "'인기 상품' 아래의 상품 카드 6개(이미지·이름·가격)를 목록으로 묶을 것",
        "accept": [
          {
            "groupCount": 1,
            "itemsPerGroup": 6
          },
          {
            "groupCount": 2,
            "itemsPerGroup": 3
          }
        ],
        "hints": {
          "1": "'인기 상품' 아래 영역의 구조를 다시 확인해보세요.",
          "2": "이미지·이름·가격이 같은 구조로 여섯 번 반복되고 있습니다.",
          "3": "동일한 구조로 반복되는 상품 카드는 목록 요소의 항목으로 묶어 표현하세요."
        }
      },
      {
        "id": "r5",
        "level": "required",
        "type": "layout-result",
        "target": "상품 목록",
        "desc": "상품 카드 6개가 가로 3개씩 2행으로 놓일 것",
        "accept": [
          {
            "columns": 3,
            "rows": 2
          }
        ],
        "hints": {
          "1": "상품 카드들의 배치 결과를 확인해보세요.",
          "2": "카드가 한 줄에 세 개씩, 두 줄로 놓여 있습니다.",
          "3": "여섯 개의 카드가 가로 3개씩 두 줄을 이루도록 배치하세요."
        }
      },
      {
        "id": "r6",
        "level": "required",
        "type": "image-alt",
        "target": "대표 이미지 자리 / 상품 이미지 자리",
        "desc": "내용을 전달하는 이미지에는 대체 텍스트를 지정할 것",
        "accept": [
          {}
        ],
        "hints": {
          "1": "이미지가 들어가는 자리들을 다시 확인해보세요.",
          "2": "이미지를 볼 수 없는 사용자에게도 내용이 전달되어야 합니다.",
          "3": "의미를 가진 이미지에는 그 내용을 설명하는 대체 텍스트 속성을 채워주세요."
        }
      },
      {
        "id": "r7",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "사이트 머리말",
        "desc": "로고와 메뉴가 있는 상단 영역은 header로 감싸는 것을 권장합니다"
      },
      {
        "id": "r8",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "주 메뉴",
        "desc": "주요 내비게이션 목록은 nav로 감싸는 것을 권장합니다"
      },
      {
        "id": "r9",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "페이지 최상위 제목",
        "desc": "'새로운 계절, 새로운 선택'은 페이지의 최상위 제목이므로 h1으로 표현하는 것을 권장합니다"
      },
      {
        "id": "r10",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "구역 제목",
        "desc": "'인기 상품'은 상품 목록 구역의 제목이므로 제목 요소(h2 등)로 표현하는 것을 권장합니다"
      },
      {
        "id": "r11",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "상품 카드",
        "desc": "독립적으로 읽히는 상품 카드는 article로 표현할 수 있습니다"
      },
      {
        "id": "r12",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "사이트 바닥글",
        "desc": "저작권 문구가 있는 하단 영역은 footer로 감싸는 것을 권장합니다"
      }
    ],
    "example": {
      "html": "<div class=\"page\">\n  <header class=\"site-header\">\n    <a class=\"logo\" href=\"#\">SHOP</a>\n    <nav class=\"main-nav\">\n      <ul class=\"nav-list\">\n        <li><a href=\"#\">신상품</a></li>\n        <li><a href=\"#\">베스트</a></li>\n        <li><a href=\"#\">세일</a></li>\n        <li><a href=\"#\">문의</a></li>\n      </ul>\n    </nav>\n  </header>\n\n  <main>\n    <section class=\"hero\">\n      <div class=\"hero-text\">\n        <h1>새로운 계절, 새로운 선택</h1>\n        <p>가볍게 시작하는 이번 시즌 추천 아이템을 만나보세요.</p>\n        <a class=\"hero-button\" href=\"#\">지금 둘러보기</a>\n      </div>\n      <div class=\"hero-image\">\n        <img src=\"images/hero.jpg\" alt=\"봄 시즌 신상품을 착용한 모델\">\n      </div>\n    </section>\n\n    <section class=\"products\">\n      <h2>인기 상품</h2>\n      <ul class=\"product-list\">\n        <li>\n          <article class=\"product-card\">\n            <img src=\"images/product-1.jpg\" alt=\"베이직 코튼 티셔츠\">\n            <h3>베이직 코튼 티셔츠</h3>\n            <p class=\"price\">19,000원</p>\n          </article>\n        </li>\n        <li>\n          <article class=\"product-card\">\n            <img src=\"images/product-2.jpg\" alt=\"와이드 데님 팬츠\">\n            <h3>와이드 데님 팬츠</h3>\n            <p class=\"price\">49,000원</p>\n          </article>\n        </li>\n        <li>\n          <article class=\"product-card\">\n            <img src=\"images/product-3.jpg\" alt=\"라운드넥 니트 가디건\">\n            <h3>라운드넥 니트 가디건</h3>\n            <p class=\"price\">62,000원</p>\n          </article>\n        </li>\n        <li>\n          <article class=\"product-card\">\n            <img src=\"images/product-4.jpg\" alt=\"린넨 셔츠 블라우스\">\n            <h3>린넨 셔츠 블라우스</h3>\n            <p class=\"price\">38,000원</p>\n          </article>\n        </li>\n        <li>\n          <article class=\"product-card\">\n            <img src=\"images/product-5.jpg\" alt=\"캔버스 숄더백\">\n            <h3>캔버스 숄더백</h3>\n            <p class=\"price\">28,000원</p>\n          </article>\n        </li>\n        <li>\n          <article class=\"product-card\">\n            <img src=\"images/product-6.jpg\" alt=\"레더 로우 스니커즈\">\n            <h3>레더 로우 스니커즈</h3>\n            <p class=\"price\">75,000원</p>\n          </article>\n        </li>\n      </ul>\n    </section>\n  </main>\n\n  <footer class=\"site-footer\">\n    <p>&copy; 2024 SHOP. All rights reserved.</p>\n  </footer>\n</div>",
      "css": ".page {\n  max-width: 1080px;\n  margin: 0 auto;\n  padding: 0 24px;\n  font-family: system-ui, sans-serif;\n  color: #222;\n}\n\n.site-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 20px 0;\n  border-bottom: 1px solid #e5e5e5;\n}\n\n.logo {\n  font-size: 22px;\n  font-weight: bold;\n  letter-spacing: 2px;\n  text-decoration: none;\n  color: #222;\n}\n\n.nav-list {\n  display: flex;\n  gap: 28px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n\n.nav-list a {\n  text-decoration: none;\n  color: #444;\n  font-size: 15px;\n}\n\n.nav-list a:hover {\n  color: #000;\n}\n\n.hero {\n  display: flex;\n  align-items: center;\n  gap: 40px;\n  padding: 56px 0;\n}\n\n.hero-text {\n  flex: 1;\n}\n\n.hero-text h1 {\n  margin: 0 0 16px;\n  font-size: 40px;\n  line-height: 1.3;\n}\n\n.hero-text p {\n  margin: 0 0 24px;\n  font-size: 16px;\n  color: #666;\n}\n\n.hero-button {\n  display: inline-block;\n  padding: 12px 24px;\n  background-color: #222;\n  color: #fff;\n  text-decoration: none;\n  font-size: 15px;\n}\n\n.hero-image {\n  flex: 1;\n}\n\n.hero-image img {\n  display: block;\n  width: 100%;\n  height: 320px;\n  object-fit: cover;\n  background-color: #ddd;\n}\n\n.products {\n  padding: 24px 0 56px;\n}\n\n.products h2 {\n  margin: 0 0 24px;\n  font-size: 24px;\n}\n\n.product-list {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 32px 24px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n\n.product-card img {\n  display: block;\n  width: 100%;\n  height: 220px;\n  object-fit: cover;\n  background-color: #ddd;\n}\n\n.product-card h3 {\n  margin: 12px 0 6px;\n  font-size: 16px;\n  font-weight: normal;\n}\n\n.price {\n  margin: 0;\n  font-size: 15px;\n  font-weight: bold;\n}\n\n.site-footer {\n  padding: 24px 0;\n  border-top: 1px solid #e5e5e5;\n  text-align: center;\n}\n\n.site-footer p {\n  margin: 0;\n  font-size: 14px;\n  color: #888;\n}"
    }
  },
  {
    "id": "run3",
    "rubric": [
      {
        "id": "r1",
        "level": "required",
        "type": "list-grouping",
        "target": "주 메뉴",
        "desc": "상단 오른쪽에 반복되는 메뉴 항목 4개를 목록으로 묶을 것",
        "accept": [
          {
            "groupCount": 1,
            "itemsPerGroup": 4
          }
        ],
        "hints": {
          "1": "페이지 맨 위 오른쪽 메뉴 영역을 다시 확인해보세요.",
          "2": "같은 성격의 메뉴 항목이 네 개 나란히 반복되고 있습니다.",
          "3": "반복되는 메뉴 항목들은 하나의 목록 요소로 묶어 표현합니다."
        }
      },
      {
        "id": "r2",
        "level": "required",
        "type": "layout-result",
        "target": "주 메뉴",
        "desc": "메뉴 항목 4개가 가로 한 줄로 나란히 놓일 것",
        "accept": [
          {
            "columns": 4,
            "rows": 1
          }
        ],
        "hints": {
          "1": "상단 메뉴의 배치 결과를 확인해보세요.",
          "2": "메뉴 항목 네 개가 세로로 쌓이지 않고 같은 높이에 놓여 있습니다.",
          "3": "메뉴 항목 네 개가 가로 한 줄로 나열되도록 배치하세요."
        }
      },
      {
        "id": "r3",
        "level": "required",
        "type": "layout-result",
        "target": "도입 소개 영역",
        "desc": "왼쪽 텍스트 묶음과 오른쪽 이미지 자리가 가로로 나란히 2개 배치될 것",
        "accept": [
          {
            "columns": 2,
            "rows": 1
          }
        ],
        "hints": {
          "1": "큰 제목이 있는 도입 영역의 좌우 배치를 확인해보세요.",
          "2": "글 묶음과 이미지가 위아래가 아니라 좌우로 놓여 있습니다.",
          "3": "도입 영역의 두 덩어리가 가로 2개로 나란히 놓이도록 배치하세요."
        }
      },
      {
        "id": "r4",
        "level": "required",
        "type": "list-grouping",
        "target": "상품 카드 목록",
        "desc": "동일한 구조의 상품 카드 6개를 목록으로 묶을 것",
        "accept": [
          {
            "groupCount": 1,
            "itemsPerGroup": 6
          },
          {
            "groupCount": 2,
            "itemsPerGroup": 3
          }
        ],
        "hints": {
          "1": "'인기 상품' 아래 카드 영역을 다시 확인해보세요.",
          "2": "이미지, 이름, 가격이라는 같은 구조가 여섯 번 반복되고 있습니다.",
          "3": "반복되는 상품 카드는 목록 요소로 묶어 각 카드를 항목으로 표현하세요."
        }
      },
      {
        "id": "r5",
        "level": "required",
        "type": "layout-result",
        "target": "상품 카드 목록",
        "desc": "상품 카드 6개가 가로 3개씩 2행으로 놓일 것",
        "accept": [
          {
            "columns": 3,
            "rows": 2
          }
        ],
        "hints": {
          "1": "'인기 상품' 영역의 카드 배치 결과를 확인해보세요.",
          "2": "카드가 한 줄에 세 개씩, 두 줄로 나뉘어 놓여 있습니다.",
          "3": "상품 카드 여섯 개가 가로 3개씩 2행을 이루도록 배치하세요."
        }
      },
      {
        "id": "r6",
        "level": "required",
        "type": "image-alt",
        "target": "대표 이미지 자리 및 상품 이미지 자리",
        "desc": "내용을 전달하는 이미지에는 대체 텍스트를 제공할 것",
        "accept": [
          {}
        ],
        "hints": {
          "1": "도입 영역과 상품 카드의 이미지 부분을 확인해보세요.",
          "2": "이미지를 볼 수 없는 사용자에게도 내용이 전달되어야 합니다.",
          "3": "의미를 가진 이미지에는 대체 텍스트 속성을 반드시 채워 넣으세요."
        }
      },
      {
        "id": "r7",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "사이트 머리말",
        "desc": "로고와 메뉴가 있는 상단 영역은 머리말 요소로, 메뉴 묶음은 내비게이션 요소로 감싸는 것을 권장합니다"
      },
      {
        "id": "r8",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "페이지 주 제목 / 구역 제목",
        "desc": "'새로운 계절, 새로운 선택'과 '인기 상품'은 중요도에 맞는 제목 요소로 표현하는 것을 권장합니다"
      },
      {
        "id": "r9",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "상품 카드",
        "desc": "독립적으로 읽히는 상품 카드는 article 등 의미 있는 요소로 표현할 수 있습니다"
      },
      {
        "id": "r10",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "사이트 바닥글",
        "desc": "저작권 문구가 있는 맨 아래 영역은 바닥글 요소로 감싸는 것을 권장합니다"
      }
    ],
    "example": {
      "html": "<div class=\"page\">\n  <header class=\"site-header\">\n    <p class=\"logo\">SEASON SHOP</p>\n    <nav class=\"main-nav\" aria-label=\"주 메뉴\">\n      <ul class=\"main-nav__list\">\n        <li><a href=\"#new\">신상품</a></li>\n        <li><a href=\"#best\">인기상품</a></li>\n        <li><a href=\"#event\">이벤트</a></li>\n        <li><a href=\"#support\">고객센터</a></li>\n      </ul>\n    </nav>\n  </header>\n\n  <main>\n    <section class=\"hero\">\n      <div class=\"hero__text\">\n        <h1>새로운 계절, 새로운 선택</h1>\n        <p>가볍게 걸치고 오래 입는 이번 시즌 추천 아이템을 모았습니다.</p>\n        <a class=\"hero__button\" href=\"#best\">상품 보러가기</a>\n      </div>\n      <div class=\"hero__media\">\n        <img src=\"images/hero-season.jpg\" alt=\"봄 신상품 코트를 입은 모델이 거리를 걷는 모습\" width=\"560\" height=\"380\">\n      </div>\n    </section>\n\n    <section class=\"products\" id=\"best\">\n      <h2>인기 상품</h2>\n      <ul class=\"product-list\">\n        <li>\n          <article class=\"product-card\">\n            <img src=\"images/product-01.jpg\" alt=\"베이지색 싱글 트렌치코트\" width=\"320\" height=\"320\">\n            <h3 class=\"product-card__name\">클래식 트렌치코트</h3>\n            <p class=\"product-card__price\">129,000원</p>\n          </article>\n        </li>\n        <li>\n          <article class=\"product-card\">\n            <img src=\"images/product-02.jpg\" alt=\"흰색 반팔 코튼 티셔츠\" width=\"320\" height=\"320\">\n            <h3 class=\"product-card__name\">데일리 코튼 티셔츠</h3>\n            <p class=\"product-card__price\">19,000원</p>\n          </article>\n        </li>\n        <li>\n          <article class=\"product-card\">\n            <img src=\"images/product-03.jpg\" alt=\"연청색 와이드 데님 팬츠\" width=\"320\" height=\"320\">\n            <h3 class=\"product-card__name\">와이드 데님 팬츠</h3>\n            <p class=\"product-card__price\">59,000원</p>\n          </article>\n        </li>\n        <li>\n          <article class=\"product-card\">\n            <img src=\"images/product-04.jpg\" alt=\"회색 라운드넥 니트 스웨터\" width=\"320\" height=\"320\">\n            <h3 class=\"product-card__name\">라운드넥 니트</h3>\n            <p class=\"product-card__price\">45,000원</p>\n          </article>\n        </li>\n        <li>\n          <article class=\"product-card\">\n            <img src=\"images/product-05.jpg\" alt=\"검정색 캔버스 크로스백\" width=\"320\" height=\"320\">\n            <h3 class=\"product-card__name\">캔버스 크로스백</h3>\n            <p class=\"product-card__price\">38,000원</p>\n          </article>\n        </li>\n        <li>\n          <article class=\"product-card\">\n            <img src=\"images/product-06.jpg\" alt=\"흰색 가죽 로우탑 스니커즈\" width=\"320\" height=\"320\">\n            <h3 class=\"product-card__name\">레더 스니커즈</h3>\n            <p class=\"product-card__price\">78,000원</p>\n          </article>\n        </li>\n      </ul>\n    </section>\n  </main>\n\n  <footer class=\"site-footer\">\n    <p>&copy; 2024 SEASON SHOP. All rights reserved.</p>\n  </footer>\n</div>",
      "css": ".page {\n  max-width: 1080px;\n  margin: 0 auto;\n  padding: 0 20px;\n  font-family: \"Helvetica Neue\", Arial, sans-serif;\n  color: #222;\n  line-height: 1.6;\n}\n\n.site-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 24px;\n  padding: 20px 0;\n  border-bottom: 1px solid #e5e5e5;\n}\n\n.logo {\n  margin: 0;\n  font-size: 20px;\n  font-weight: bold;\n  letter-spacing: 0.08em;\n}\n\n.main-nav__list {\n  display: flex;\n  gap: 24px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n\n.main-nav__list a {\n  color: #444;\n  font-size: 15px;\n  text-decoration: none;\n}\n\n.main-nav__list a:hover,\n.main-nav__list a:focus {\n  color: #000;\n  text-decoration: underline;\n}\n\n.hero {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 40px;\n  align-items: center;\n  padding: 56px 0;\n}\n\n.hero h1 {\n  margin: 0 0 16px;\n  font-size: 36px;\n  line-height: 1.3;\n}\n\n.hero__text p {\n  margin: 0 0 24px;\n  color: #555;\n}\n\n.hero__button {\n  display: inline-block;\n  padding: 12px 24px;\n  background-color: #222;\n  color: #fff;\n  text-decoration: none;\n  border-radius: 4px;\n}\n\n.hero__button:hover,\n.hero__button:focus {\n  background-color: #000;\n}\n\n.hero__media img {\n  display: block;\n  width: 100%;\n  height: auto;\n  border-radius: 8px;\n}\n\n.products {\n  padding-bottom: 56px;\n}\n\n.products h2 {\n  margin: 0 0 24px;\n  font-size: 26px;\n}\n\n.product-list {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 32px 24px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n\n.product-card img {\n  display: block;\n  width: 100%;\n  height: auto;\n  border-radius: 6px;\n  background-color: #f2f2f2;\n}\n\n.product-card__name {\n  margin: 12px 0 4px;\n  font-size: 16px;\n}\n\n.product-card__price {\n  margin: 0;\n  color: #555;\n  font-size: 15px;\n}\n\n.site-footer {\n  padding: 24px 0;\n  border-top: 1px solid #e5e5e5;\n  color: #777;\n  font-size: 14px;\n  text-align: center;\n}\n\n.site-footer p {\n  margin: 0;\n}"
    }
  }
];
