/**
 * AI가 생성한 조건 픽스처 — layout-result 대상 단위 지시를 넣은 뒤 (개선 후).
 *
 * 개선 전 결과는 fixtures/aiRuns.ts 에 그대로 남겨 두고 비교한다.
 * 프롬프트에 추가한 지시는 다음 한 가지다.
 *
 *   같은 구역에 반복되는 항목이 있으면 그 항목을 layout-result의 대상으로
 *   삼되, 반복 항목을 감싸는 상위 덩어리가 아니라 반복 항목 자체로 한다.
 *
 * "가장 작은 단위를 고르라"고 쓰지 않았다. 그렇게 쓰면 카드 안의 텍스트까지
 * 내려가 조건이 과도하게 세밀해진다.
 */

import type { AiRun } from "@/fixtures/aiRuns";

export const AI_RUNS_IMPROVED: AiRun[] = [
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
          "2": "메뉴 글자 4개가 같은 형태로 반복되고 있습니다. 반복되는 항목을 어떻게 표현할지 생각해보세요.",
          "3": "반복되는 메뉴 항목은 목록 요소로 묶어 표현합니다."
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
          "1": "상단 머리말의 메뉴 배치를 확인해보세요.",
          "2": "메뉴 항목들이 위아래로 쌓이지 않고 한 줄에 놓여 있습니다.",
          "3": "메뉴 항목 4개의 세로 위치가 모두 같고 가로로 나란히 배치되도록 하세요."
        }
      },
      {
        "id": "r3",
        "level": "required",
        "type": "layout-result",
        "target": "페이지 대표 소개 구역",
        "desc": "왼쪽 글 묶음과 오른쪽 대표 이미지가 좌우 두 칸으로 나란히 놓일 것",
        "accept": [
          {
            "columns": 2,
            "rows": 1
          }
        ],
        "hints": {
          "1": "제목과 큰 이미지가 있는 소개 영역의 배치를 확인해보세요.",
          "2": "글 묶음과 이미지가 위아래가 아니라 좌우로 놓여 있습니다.",
          "3": "글 묶음은 왼쪽, 이미지는 오른쪽에 같은 줄로 배치되도록 하세요."
        }
      },
      {
        "id": "r4",
        "level": "required",
        "type": "list-grouping",
        "target": "상품 목록",
        "desc": "'인기 상품' 아래 같은 구조의 상품 항목 6개를 목록으로 묶을 것",
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
          "1": "'인기 상품' 아래 영역을 다시 확인해보세요.",
          "2": "이미지, 이름, 가격으로 이루어진 같은 구조가 여러 번 반복되고 있습니다.",
          "3": "반복되는 상품 항목들은 목록 요소로 묶어 표현합니다."
        }
      },
      {
        "id": "r5",
        "level": "required",
        "type": "layout-result",
        "target": "상품 목록",
        "desc": "상품 항목 6개가 가로 3개씩 2행으로 놓일 것",
        "accept": [
          {
            "columns": 3,
            "rows": 2
          }
        ],
        "hints": {
          "1": "'인기 상품' 영역의 상품 배치를 확인해보세요.",
          "2": "상품이 한 줄로 이어지지 않고 여러 줄로 나뉘어 놓여 있습니다.",
          "3": "상품 항목 6개가 한 줄에 3개씩, 모두 2줄로 놓이도록 배치하세요."
        }
      },
      {
        "id": "r6",
        "level": "required",
        "type": "image-alt",
        "target": "대표 이미지 자리 / 상품 이미지 자리",
        "desc": "소개 구역의 대표 이미지와 각 상품 이미지에 대체 텍스트를 지정할 것",
        "accept": [
          {}
        ],
        "hints": {
          "1": "이미지가 들어가는 자리들을 다시 확인해보세요.",
          "2": "이미지를 볼 수 없는 사용자에게 어떤 내용인지 전달할 방법이 필요합니다.",
          "3": "의미가 있는 이미지에는 내용을 설명하는 대체 텍스트 속성을 지정하세요."
        }
      },
      {
        "id": "r7",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "사이트 머리말 / 주 메뉴",
        "desc": "페이지 상단 영역은 머리말 요소로, 주요 메뉴는 내비게이션 요소로 감싸는 것을 권장합니다"
      },
      {
        "id": "r8",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "페이지 최상위 제목 / 구역 제목",
        "desc": "'새로운 계절, 새로운 선택'은 페이지 최상위 제목, '인기 상품'은 하위 제목 수준으로 제목 요소를 단계에 맞게 사용하는 것을 권장합니다"
      },
      {
        "id": "r9",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "행동 유도 버튼형 링크",
        "desc": "'지금 둘러보기'가 다른 페이지로 이동하는 역할이라면 링크 요소로 표현하는 것을 권장합니다"
      },
      {
        "id": "r10",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "상품 목록 구역",
        "desc": "'인기 상품' 제목과 상품 목록을 하나의 구역 요소로 묶고, 각 상품 항목을 독립적인 콘텐츠 단위로 표현하는 것을 권장합니다"
      },
      {
        "id": "r11",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "사이트 바닥글",
        "desc": "저작권 문구가 있는 맨 아래 영역은 바닥글 요소로 감싸는 것을 권장합니다"
      }
    ],
    "example": {
      "html": "<div class=\"page\">\n  <header class=\"site-header\">\n    <p class=\"logo\">SEASON</p>\n    <nav class=\"main-nav\" aria-label=\"주 메뉴\">\n      <ul class=\"nav-list\">\n        <li><a href=\"/new\">신상품</a></li>\n        <li><a href=\"/best\">베스트</a></li>\n        <li><a href=\"/sale\">세일</a></li>\n        <li><a href=\"/support\">고객센터</a></li>\n      </ul>\n    </nav>\n  </header>\n\n  <section class=\"hero\">\n    <div class=\"hero-text\">\n      <h1>새로운 계절, 새로운 선택</h1>\n      <p>계절이 바뀌는 순간에 어울리는 물건들을 모았습니다. 오늘의 기분에 맞는 하나를 골라보세요.</p>\n      <a class=\"hero-button\" href=\"/new\">지금 둘러보기</a>\n    </div>\n    <img class=\"hero-image\" src=\"images/hero.jpg\" alt=\"가을 옷차림을 한 모델이 창가에 서 있는 모습\">\n  </section>\n\n  <section class=\"products\">\n    <h2>인기 상품</h2>\n    <ul class=\"product-list\">\n      <li>\n        <article class=\"product\">\n          <img src=\"images/product-1.jpg\" alt=\"베이지색 오버핏 코트\">\n          <h3>오버핏 울 코트</h3>\n          <p class=\"price\">189,000원</p>\n        </article>\n      </li>\n      <li>\n        <article class=\"product\">\n          <img src=\"images/product-2.jpg\" alt=\"회색 니트 스웨터\">\n          <h3>소프트 니트 스웨터</h3>\n          <p class=\"price\">79,000원</p>\n        </article>\n      </li>\n      <li>\n        <article class=\"product\">\n          <img src=\"images/product-3.jpg\" alt=\"검정색 가죽 크로스백\">\n          <h3>미니 크로스백</h3>\n          <p class=\"price\">124,000원</p>\n        </article>\n      </li>\n      <li>\n        <article class=\"product\">\n          <img src=\"images/product-4.jpg\" alt=\"흰색 스니커즈 한 켤레\">\n          <h3>데일리 스니커즈</h3>\n          <p class=\"price\">98,000원</p>\n        </article>\n      </li>\n      <li>\n        <article class=\"product\">\n          <img src=\"images/product-5.jpg\" alt=\"체크무늬 머플러\">\n          <h3>체크 머플러</h3>\n          <p class=\"price\">45,000원</p>\n        </article>\n      </li>\n      <li>\n        <article class=\"product\">\n          <img src=\"images/product-6.jpg\" alt=\"갈색 가죽 벨트\">\n          <h3>베이직 가죽 벨트</h3>\n          <p class=\"price\">52,000원</p>\n        </article>\n      </li>\n    </ul>\n  </section>\n\n  <footer class=\"site-footer\">\n    <p>&copy; 2024 SEASON. All rights reserved.</p>\n  </footer>\n</div>",
      "css": ".page {\n  max-width: 1080px;\n  margin: 0 auto;\n  padding: 0 24px;\n  font-family: system-ui, sans-serif;\n  color: #222;\n}\n\n.site-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 20px 0;\n  border-bottom: 1px solid #e5e5e5;\n}\n\n.logo {\n  margin: 0;\n  font-size: 20px;\n  font-weight: 700;\n  letter-spacing: 0.1em;\n}\n\n.nav-list {\n  display: flex;\n  gap: 24px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n\n.nav-list a {\n  color: #333;\n  font-size: 15px;\n  text-decoration: none;\n}\n\n.nav-list a:hover {\n  text-decoration: underline;\n}\n\n.hero {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 40px;\n  align-items: center;\n  padding: 56px 0;\n}\n\n.hero-text h1 {\n  margin: 0 0 16px;\n  font-size: 36px;\n  line-height: 1.3;\n}\n\n.hero-text p {\n  margin: 0 0 24px;\n  font-size: 16px;\n  line-height: 1.7;\n  color: #555;\n}\n\n.hero-button {\n  display: inline-block;\n  padding: 12px 28px;\n  background-color: #222;\n  color: #fff;\n  border-radius: 4px;\n  font-size: 15px;\n  text-decoration: none;\n}\n\n.hero-button:hover {\n  background-color: #444;\n}\n\n.hero-image {\n  display: block;\n  width: 100%;\n  height: auto;\n  border-radius: 8px;\n  background-color: #f0f0f0;\n}\n\n.products {\n  padding: 24px 0 56px;\n}\n\n.products h2 {\n  margin: 0 0 24px;\n  font-size: 24px;\n}\n\n.product-list {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 32px 24px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n\n.product img {\n  display: block;\n  width: 100%;\n  height: auto;\n  border-radius: 6px;\n  background-color: #f0f0f0;\n}\n\n.product h3 {\n  margin: 12px 0 6px;\n  font-size: 16px;\n}\n\n.price {\n  margin: 0;\n  font-size: 15px;\n  color: #666;\n}\n\n.site-footer {\n  padding: 24px 0;\n  border-top: 1px solid #e5e5e5;\n  text-align: center;\n}\n\n.site-footer p {\n  margin: 0;\n  font-size: 14px;\n  color: #777;\n}"
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
        "desc": "상단 메뉴 항목 4개를 목록으로 묶을 것",
        "accept": [
          {
            "groupCount": 1,
            "itemsPerGroup": 4
          }
        ],
        "hints": {
          "1": "페이지 상단 오른쪽 메뉴 영역을 다시 확인해보세요.",
          "2": "메뉴 항목 4개가 같은 구조로 반복되고 있습니다. 이런 반복을 어떻게 표현할지 생각해보세요.",
          "3": "반복되는 메뉴 항목은 목록 요소로 묶어 표현합니다."
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
          "1": "상단 메뉴 항목들의 배치를 다시 확인해보세요.",
          "2": "메뉴 항목 4개의 세로 위치가 모두 같고 가로로 이어져 있습니다.",
          "3": "메뉴 항목들이 한 행에 가로로 나란히 놓이도록 배치하세요."
        }
      },
      {
        "id": "r3",
        "level": "required",
        "type": "layout-result",
        "target": "주요 소개 영역",
        "desc": "소개 영역의 텍스트 묶음과 대표 이미지가 좌우 두 칸으로 나란히 놓일 것",
        "accept": [
          {
            "columns": 2,
            "rows": 1
          }
        ],
        "hints": {
          "1": "제목과 큰 회색 이미지가 있는 소개 영역의 배치를 확인해보세요.",
          "2": "왼쪽에는 글 묶음, 오른쪽에는 이미지가 같은 줄에 놓여 있습니다.",
          "3": "글 묶음과 이미지가 좌우 두 칸으로 나란히 배치되도록 하세요."
        }
      },
      {
        "id": "r4",
        "level": "required",
        "type": "image-alt",
        "target": "대표 이미지 및 상품 이미지",
        "desc": "구역 내 의미 있는 이미지에 대체 텍스트를 제공할 것",
        "accept": [
          {}
        ],
        "hints": {
          "1": "이미지가 들어가는 자리들을 다시 확인해보세요.",
          "2": "이미지는 화면을 볼 수 없는 사용자에게도 내용이 전달되어야 합니다.",
          "3": "각 이미지에 내용을 설명하는 대체 텍스트를 지정하세요. 장식용이라면 빈 대체 텍스트를 명시합니다."
        }
      },
      {
        "id": "r5",
        "level": "required",
        "type": "list-grouping",
        "target": "상품 목록",
        "desc": "인기 상품 항목 6개를 목록으로 묶을 것 (행 단위로 나누어 묶어도 됨)",
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
          "1": "'인기 상품' 아래 상품 카드 영역을 다시 확인해보세요.",
          "2": "이미지·이름·가격으로 이루어진 같은 구조의 카드가 반복되고 있습니다.",
          "3": "반복되는 상품 카드는 목록 요소로 묶어 표현합니다."
        }
      },
      {
        "id": "r6",
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
          "1": "상품 카드들이 화면에서 어떻게 놓여 있는지 확인해보세요.",
          "2": "카드가 한 줄에 3개씩, 두 줄로 정렬되어 있습니다.",
          "3": "상품 카드 6개가 3열 2행 형태로 배치되도록 하세요."
        }
      },
      {
        "id": "r7",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "사이트 머리말",
        "desc": "로고와 메뉴가 있는 상단 영역은 header로, 메뉴 묶음은 nav로 감싸는 것을 권장합니다"
      },
      {
        "id": "r8",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "페이지 최상위 제목 / 구역 제목",
        "desc": "'새로운 계절, 새로운 선택'은 페이지 최상위 제목, '인기 상품'은 그 아래 단계의 제목으로 제목 요소의 단계를 맞추는 것을 권장합니다"
      },
      {
        "id": "r9",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "상품 항목",
        "desc": "각 상품 카드는 article 등 독립적인 내용 단위로 표현할 수 있습니다"
      },
      {
        "id": "r10",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "행동 유도 버튼",
        "desc": "'지금 둘러보기'가 다른 페이지로 이동한다면 a, 페이지 내 동작이라면 button으로 표현하는 것을 권장합니다"
      },
      {
        "id": "r11",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "사이트 꼬리말",
        "desc": "저작권 문구가 있는 하단 영역은 footer로 감싸는 것을 권장합니다"
      }
    ],
    "example": {
      "html": "<div class=\"page\">\n  <header class=\"site-header\">\n    <p class=\"logo\">SEASON</p>\n    <nav class=\"main-nav\" aria-label=\"주 메뉴\">\n      <ul class=\"main-nav__list\">\n        <li><a href=\"/new\">신상품</a></li>\n        <li><a href=\"/best\">베스트</a></li>\n        <li><a href=\"/sale\">세일</a></li>\n        <li><a href=\"/support\">고객센터</a></li>\n      </ul>\n    </nav>\n  </header>\n\n  <main>\n    <section class=\"hero\">\n      <div class=\"hero__text\">\n        <h1>새로운 계절, 새로운 선택</h1>\n        <p>이번 시즌 가장 사랑받은 아이템을 한자리에 모았습니다.</p>\n        <a class=\"button\" href=\"/new\">지금 둘러보기</a>\n      </div>\n      <img class=\"hero__image\" src=\"images/hero.jpg\" alt=\"봄 신상품 코트를 입은 모델\">\n    </section>\n\n    <section class=\"products\">\n      <h2>인기 상품</h2>\n      <ul class=\"product-list\">\n        <li>\n          <article class=\"product-card\">\n            <img src=\"images/product-1.jpg\" alt=\"베이지색 트렌치 코트\">\n            <h3>트렌치 코트</h3>\n            <p class=\"product-card__price\">129,000원</p>\n          </article>\n        </li>\n        <li>\n          <article class=\"product-card\">\n            <img src=\"images/product-2.jpg\" alt=\"흰색 라운드 티셔츠\">\n            <h3>코튼 티셔츠</h3>\n            <p class=\"product-card__price\">24,000원</p>\n          </article>\n        </li>\n        <li>\n          <article class=\"product-card\">\n            <img src=\"images/product-3.jpg\" alt=\"연청 데님 팬츠\">\n            <h3>데님 팬츠</h3>\n            <p class=\"product-card__price\">69,000원</p>\n          </article>\n        </li>\n        <li>\n          <article class=\"product-card\">\n            <img src=\"images/product-4.jpg\" alt=\"회색 니트 가디건\">\n            <h3>니트 가디건</h3>\n            <p class=\"product-card__price\">89,000원</p>\n          </article>\n        </li>\n        <li>\n          <article class=\"product-card\">\n            <img src=\"images/product-5.jpg\" alt=\"검은색 가죽 크로스백\">\n            <h3>크로스백</h3>\n            <p class=\"product-card__price\">112,000원</p>\n          </article>\n        </li>\n        <li>\n          <article class=\"product-card\">\n            <img src=\"images/product-6.jpg\" alt=\"흰색 캔버스 스니커즈\">\n            <h3>캔버스 스니커즈</h3>\n            <p class=\"product-card__price\">58,000원</p>\n          </article>\n        </li>\n      </ul>\n    </section>\n  </main>\n\n  <footer class=\"site-footer\">\n    <p>&copy; 2024 SEASON. All rights reserved.</p>\n  </footer>\n</div>",
      "css": "* {\n  box-sizing: border-box;\n}\n\nbody {\n  margin: 0;\n  font-family: \"Helvetica Neue\", Arial, sans-serif;\n  color: #222;\n  line-height: 1.6;\n}\n\n.page {\n  max-width: 1080px;\n  margin: 0 auto;\n  padding: 0 24px;\n}\n\n.site-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 20px 0;\n  border-bottom: 1px solid #e5e5e5;\n}\n\n.logo {\n  margin: 0;\n  font-size: 20px;\n  font-weight: bold;\n  letter-spacing: 0.1em;\n}\n\n.main-nav__list {\n  display: flex;\n  gap: 24px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n\n.main-nav__list a {\n  color: #333;\n  text-decoration: none;\n  font-size: 15px;\n}\n\n.main-nav__list a:hover,\n.main-nav__list a:focus {\n  text-decoration: underline;\n}\n\n.hero {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 40px;\n  align-items: center;\n  padding: 56px 0;\n}\n\n.hero__text h1 {\n  margin: 0 0 16px;\n  font-size: 36px;\n  line-height: 1.3;\n}\n\n.hero__text p {\n  margin: 0 0 28px;\n  color: #555;\n}\n\n.hero__image {\n  display: block;\n  width: 100%;\n  height: 320px;\n  object-fit: cover;\n  background-color: #d9d9d9;\n}\n\n.button {\n  display: inline-block;\n  padding: 12px 28px;\n  background-color: #222;\n  color: #fff;\n  text-decoration: none;\n  font-size: 15px;\n}\n\n.button:hover,\n.button:focus {\n  background-color: #444;\n}\n\n.products {\n  padding: 24px 0 64px;\n}\n\n.products h2 {\n  margin: 0 0 24px;\n  font-size: 24px;\n}\n\n.product-list {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 32px 24px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n\n.product-card img {\n  display: block;\n  width: 100%;\n  height: 200px;\n  object-fit: cover;\n  background-color: #d9d9d9;\n}\n\n.product-card h3 {\n  margin: 12px 0 4px;\n  font-size: 16px;\n}\n\n.product-card__price {\n  margin: 0;\n  color: #555;\n  font-size: 15px;\n}\n\n.site-footer {\n  padding: 24px 0;\n  border-top: 1px solid #e5e5e5;\n  color: #777;\n  font-size: 14px;\n  text-align: center;\n}\n\n.site-footer p {\n  margin: 0;\n}"
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
        "desc": "머리말 오른쪽에 반복되는 메뉴 항목 4개를 목록으로 묶을 것",
        "accept": [
          {
            "groupCount": 1,
            "itemsPerGroup": 4
          }
        ],
        "hints": {
          "1": "페이지 맨 위 오른쪽 메뉴 영역을 다시 확인해보세요.",
          "2": "'신상품·베스트·세일·문의'가 같은 구조로 반복되고 있습니다. 이런 반복을 어떻게 표현할지 생각해보세요.",
          "3": "반복되는 메뉴 항목 4개는 하나의 목록으로 묶어 표현합니다."
        }
      },
      {
        "id": "r2",
        "level": "required",
        "type": "layout-result",
        "target": "메뉴 항목",
        "desc": "메뉴 항목 4개가 가로 한 줄로 나란히 놓일 것",
        "accept": [
          {
            "columns": 4,
            "rows": 1
          }
        ],
        "hints": {
          "1": "머리말의 메뉴 항목들이 화면에서 어떻게 배치되어 있는지 살펴보세요.",
          "2": "메뉴 항목 4개가 위아래로 쌓이지 않고 같은 높이에 나란히 놓여 있습니다.",
          "3": "메뉴 항목 4개의 세로 위치가 같아지도록 가로 한 줄 배치를 만드세요."
        }
      },
      {
        "id": "r3",
        "level": "required",
        "type": "layout-result",
        "target": "페이지 주요 소개 영역",
        "desc": "소개 영역의 텍스트 묶음과 대표 이미지가 좌우 2단으로 나란히 놓일 것",
        "accept": [
          {
            "columns": 2,
            "rows": 1
          }
        ],
        "hints": {
          "1": "제목과 큰 이미지가 있는 상단 소개 영역의 배치를 확인해보세요.",
          "2": "글 묶음은 왼쪽, 이미지는 오른쪽에 같은 줄에 놓여 있습니다.",
          "3": "텍스트 묶음과 이미지 두 덩이가 가로로 나란히 놓이도록 2단 배치를 만드세요."
        }
      },
      {
        "id": "r4",
        "level": "required",
        "type": "list-grouping",
        "target": "상품 목록",
        "desc": "'인기 상품'의 반복되는 상품 항목 6개를 목록으로 묶을 것",
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
          "1": "'인기 상품' 아래 상품들이 놓인 영역을 다시 확인해보세요.",
          "2": "이미지·이름·가격으로 이루어진 같은 구조가 여러 번 반복되고 있습니다.",
          "3": "반복되는 상품 항목들은 목록 요소로 묶어 표현합니다. 행 단위로 나눠 묶어도 됩니다."
        }
      },
      {
        "id": "r5",
        "level": "required",
        "type": "layout-result",
        "target": "상품 항목",
        "desc": "상품 항목 6개가 가로 3개씩 2행으로 놓일 것",
        "accept": [
          {
            "columns": 3,
            "rows": 2
          }
        ],
        "hints": {
          "1": "'인기 상품' 목록이 화면에서 어떤 모양으로 놓여 있는지 살펴보세요.",
          "2": "상품이 한 줄에 3개씩, 두 줄로 정렬되어 있습니다.",
          "3": "상품 항목 6개가 가로 3개씩 2행을 이루도록 배치하세요."
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
          "1": "페이지에 사용된 이미지들을 다시 확인해보세요.",
          "2": "이미지를 볼 수 없는 사용자에게 어떤 내용인지 전달할 방법이 필요합니다.",
          "3": "의미 있는 이미지에는 내용을 설명하는 대체 텍스트 속성을 넣어야 합니다."
        }
      },
      {
        "id": "r7",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "주 메뉴",
        "desc": "머리말의 주요 메뉴 영역은 nav로 감싸는 것을 권장합니다"
      },
      {
        "id": "r8",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "사이트 머리말 / 사이트 꼬리말",
        "desc": "페이지 상단 로고·메뉴 영역은 header, 하단 저작권 영역은 footer로 표현하는 것을 권장합니다"
      },
      {
        "id": "r9",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "제목 요소",
        "desc": "'새로운 계절, 새로운 선택'을 페이지 최상위 제목으로, '인기 상품'을 그 하위 구역 제목으로 두어 제목 단계를 순서대로 구성하는 것을 권장합니다"
      },
      {
        "id": "r10",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "상품 항목",
        "desc": "이미지·이름·가격이 한 덩이를 이루는 상품 항목은 article 등 독립된 단위로 표현할 수 있습니다"
      },
      {
        "id": "r11",
        "level": "recommended",
        "type": "semantic-suggestion",
        "target": "행동 유도 버튼",
        "desc": "'지금 둘러보기'가 다른 페이지로 이동한다면 a, 화면 내 동작을 수행한다면 button으로 표현하는 것을 권장합니다"
      }
    ],
    "example": {
      "html": "<div class=\"page\">\n  <header class=\"site-header\">\n    <a class=\"logo\" href=\"index.html\">SEASON SHOP</a>\n    <nav class=\"main-nav\" aria-label=\"주 메뉴\">\n      <ul class=\"main-nav__list\">\n        <li><a href=\"new.html\">신상품</a></li>\n        <li><a href=\"best.html\">베스트</a></li>\n        <li><a href=\"sale.html\">세일</a></li>\n        <li><a href=\"contact.html\">문의</a></li>\n      </ul>\n    </nav>\n  </header>\n\n  <main>\n    <section class=\"hero\">\n      <div class=\"hero__text\">\n        <h1 class=\"hero__title\">새로운 계절, 새로운 선택</h1>\n        <p class=\"hero__desc\">가볍게 걸치고 오래 입는 이번 시즌 추천 아이템을 한자리에 모았습니다.</p>\n        <a class=\"hero__cta\" href=\"new.html\">지금 둘러보기</a>\n      </div>\n      <div class=\"hero__media\">\n        <img src=\"images/hero-season.jpg\" alt=\"봄 시즌 신상품 코디를 입은 모델\" width=\"640\" height=\"480\">\n      </div>\n    </section>\n\n    <section class=\"products\">\n      <h2 class=\"products__title\">인기 상품</h2>\n      <ul class=\"products__list\">\n        <li>\n          <article class=\"product\">\n            <img src=\"images/product-01.jpg\" alt=\"베이지색 코튼 셔츠\" width=\"320\" height=\"320\">\n            <h3 class=\"product__name\">코튼 오버셔츠</h3>\n            <p class=\"product__price\">39,000원</p>\n          </article>\n        </li>\n        <li>\n          <article class=\"product\">\n            <img src=\"images/product-02.jpg\" alt=\"검은색 슬림 슬랙스\" width=\"320\" height=\"320\">\n            <h3 class=\"product__name\">테이퍼드 슬랙스</h3>\n            <p class=\"product__price\">45,000원</p>\n          </article>\n        </li>\n        <li>\n          <article class=\"product\">\n            <img src=\"images/product-03.jpg\" alt=\"아이보리색 니트 카디건\" width=\"320\" height=\"320\">\n            <h3 class=\"product__name\">라이트 니트 카디건</h3>\n            <p class=\"product__price\">52,000원</p>\n          </article>\n        </li>\n        <li>\n          <article class=\"product\">\n            <img src=\"images/product-04.jpg\" alt=\"연청색 데님 재킷\" width=\"320\" height=\"320\">\n            <h3 class=\"product__name\">워시드 데님 재킷</h3>\n            <p class=\"product__price\">78,000원</p>\n          </article>\n        </li>\n        <li>\n          <article class=\"product\">\n            <img src=\"images/product-05.jpg\" alt=\"흰색 반팔 티셔츠\" width=\"320\" height=\"320\">\n            <h3 class=\"product__name\">베이직 반팔 티셔츠</h3>\n            <p class=\"product__price\">19,000원</p>\n          </article>\n        </li>\n        <li>\n          <article class=\"product\">\n            <img src=\"images/product-06.jpg\" alt=\"갈색 가죽 크로스백\" width=\"320\" height=\"320\">\n            <h3 class=\"product__name\">레더 크로스백</h3>\n            <p class=\"product__price\">64,000원</p>\n          </article>\n        </li>\n      </ul>\n    </section>\n  </main>\n\n  <footer class=\"site-footer\">\n    <p>&copy; 2024 SEASON SHOP. All rights reserved.</p>\n  </footer>\n</div>",
      "css": ".page {\n  max-width: 1080px;\n  margin: 0 auto;\n  padding: 0 20px;\n  font-family: system-ui, \"Malgun Gothic\", sans-serif;\n  color: #222;\n  line-height: 1.6;\n}\n\n.site-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 20px 0;\n  border-bottom: 1px solid #e5e5e5;\n}\n\n.logo {\n  font-size: 20px;\n  font-weight: 700;\n  letter-spacing: 0.05em;\n  color: #222;\n  text-decoration: none;\n}\n\n.main-nav__list {\n  display: flex;\n  gap: 24px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n\n.main-nav__list a {\n  color: #444;\n  text-decoration: none;\n}\n\n.main-nav__list a:hover,\n.main-nav__list a:focus {\n  color: #0b62d0;\n  text-decoration: underline;\n}\n\n.hero {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 40px;\n  align-items: center;\n  padding: 56px 0;\n}\n\n.hero__title {\n  margin: 0 0 16px;\n  font-size: 34px;\n  line-height: 1.3;\n}\n\n.hero__desc {\n  margin: 0 0 24px;\n  color: #555;\n}\n\n.hero__cta {\n  display: inline-block;\n  padding: 12px 24px;\n  background-color: #0b62d0;\n  color: #fff;\n  border-radius: 4px;\n  text-decoration: none;\n}\n\n.hero__cta:hover,\n.hero__cta:focus {\n  background-color: #094a9e;\n}\n\n.hero__media img {\n  display: block;\n  width: 100%;\n  height: auto;\n  border-radius: 8px;\n}\n\n.products {\n  padding: 40px 0 64px;\n}\n\n.products__title {\n  margin: 0 0 24px;\n  font-size: 24px;\n}\n\n.products__list {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 32px 24px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n\n.product img {\n  display: block;\n  width: 100%;\n  height: auto;\n  border-radius: 6px;\n  background-color: #f2f2f2;\n}\n\n.product__name {\n  margin: 12px 0 6px;\n  font-size: 16px;\n}\n\n.product__price {\n  margin: 0;\n  font-weight: 700;\n}\n\n.site-footer {\n  padding: 24px 0;\n  border-top: 1px solid #e5e5e5;\n  color: #777;\n  font-size: 14px;\n  text-align: center;\n}"
    }
  }
];
