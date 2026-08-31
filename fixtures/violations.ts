/**
 * 위반 코드 픽스처 — 미탐 측정용 (PRD 8.2).
 *
 * 각 항목은 조건 하나를 의도적으로 위반한다. 판정이 이를 잡아내지 못하면
 * 학습자는 잘못 작성한 코드를 정답으로 인식하게 되며, 이 실패는 조용히
 * 지나가므로 오탐률만 측정해서는 드러나지 않는다.
 *
 * 위반 코드는 조건을 보고 작성해도 무방하다. 의도적 위반이 목적이다.
 */

export type Violation = {
  id: string;
  /** 무엇을 위반했는지. */
  intent: string;
  /** 실패해야 하는 조건 id. 엔진 상시 조건은 유형 이름을 쓴다. */
  expectedFailures: string[];
  html: string;
  css: string;
};

const MENU = ["신상품", "베스트", "세일", "문의"];
const PRODUCTS = [
  { name: "니트 스웨터", price: "59,000원" },
  { name: "코튼 셔츠", price: "39,000원" },
  { name: "데님 팬츠", price: "69,000원" },
  { name: "울 코트", price: "189,000원" },
  { name: "레더 백", price: "129,000원" },
  { name: "스니커즈", price: "89,000원" },
];

type Options = {
  /** 메뉴를 목록으로 묶지 않는다. */
  menuAsDivs?: boolean;
  /** 상품을 목록으로 묶지 않는다. */
  productsAsDivs?: boolean;
  /** 상품을 2개짜리 목록 3벌로 묶는다. */
  productsInPairs?: boolean;
  /** 첫 상품 이미지의 alt를 없앤다. */
  dropAlt?: boolean;
  /** 구역 제목을 h3으로 써서 제목 단계를 건너뛴다. */
  skipHeading?: boolean;
  /** 구역 제목을 h1로 써서 최상위 제목을 둘로 만든다. */
  extraH1?: boolean;
};

function card(index: number, options: Options): string {
  const product = PRODUCTS[index];
  const alt = options.dropAlt && index === 0 ? "" : ` alt="${product.name}"`;
  return `<img src="${product.name}.jpg"${alt}>
      <h3>${product.name}</h3>
      <p class="price">${product.price}</p>`;
}

function buildHtml(options: Options): string {
  const menuItems = MENU.map((item) =>
    options.menuAsDivs
      ? `      <div class="menu-item"><a href="#">${item}</a></div>`
      : `      <li><a href="#">${item}</a></li>`,
  ).join("\n");

  const menu = options.menuAsDivs
    ? `    <div class="menu">\n${menuItems}\n    </div>`
    : `    <ul class="menu">\n${menuItems}\n    </ul>`;

  let products: string;
  if (options.productsAsDivs) {
    products = `    <div class="product-list">
${PRODUCTS.map((_, index) => `      <div class="card">\n      ${card(index, options)}\n      </div>`).join("\n")}
    </div>`;
  } else if (options.productsInPairs) {
    products = [0, 2, 4]
      .map(
        (start) => `    <ul class="product-list">
${[start, start + 1]
  .map((index) => `      <li class="card">\n      ${card(index, options)}\n      </li>`)
  .join("\n")}
    </ul>`,
      )
      .join("\n");
  } else {
    products = `    <ul class="product-list">
${PRODUCTS.map((_, index) => `      <li class="card">\n      ${card(index, options)}\n      </li>`).join("\n")}
    </ul>`;
  }

  const sectionHeading = options.extraH1 ? "h1" : options.skipHeading ? "h3" : "h2";

  return `<header class="header">
  <a class="logo" href="#">SHOP</a>
  <nav>
${menu}
  </nav>
</header>

<main>
  <section class="hero">
    <div class="hero-text">
      <h1>새로운 계절,<br>새로운 선택</h1>
      <p class="lead">가을 신상품을 지금 만나보세요.</p>
      <a class="button" href="#">지금 둘러보기</a>
    </div>
    <img class="hero-image" src="hero.jpg" alt="가을 신상품 화보">
  </section>

  <section class="products">
    <${sectionHeading}>인기 상품</${sectionHeading}>
${products}
  </section>
</main>

<footer class="footer">
  <p><small>&copy; 2026 SHOP. All rights reserved.</small></p>
</footer>`;
}

const BASE_CSS = `body { margin: 0; font-family: sans-serif; color: #18181b; }
ul { list-style: none; margin: 0; padding: 0; }
a { color: inherit; text-decoration: none; }
.header, main, .footer { max-width: 1200px; margin: 0 auto; }

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 64px;
  height: 88px;
  border-bottom: 1px solid #e4e4e7;
}
.logo { font-size: 24px; font-weight: 700; }
.menu { display: flex; gap: 32px; }
.menu-item, .menu li { font-size: 15px; color: #3f3f46; }

.hero { display: flex; align-items: center; gap: 64px; padding: 72px 64px; }
.hero-text { flex: 1; }
.hero h1 { font-size: 48px; line-height: 1.25; margin: 0; }
.lead { font-size: 17px; color: #71717a; margin: 24px 0 32px; }
.button { display: inline-block; padding: 16px 40px; border-radius: 26px; background: #2563eb; color: #fff; font-weight: 600; }
.hero-image { width: 496px; height: 340px; border-radius: 12px; background: #e4e4e7; }

.products { padding: 0 64px 80px; }
.products h1, .products h2, .products h3 { font-size: 32px; margin: 0 0 44px; }
.product-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; margin-bottom: 32px; }
.card img { display: block; width: 100%; height: 220px; border-radius: 10px; background: #f4f4f5; }
.card h3 { font-size: 16px; margin: 20px 0 8px; }
.price { font-size: 15px; color: #52525b; margin: 0; }

.footer { padding: 40px 64px; background: #fafafa; text-align: center; }
.footer p { margin: 0; color: #71717a; font-size: 14px; }`;

/** 메뉴를 세로로 쌓는 CSS. */
const MENU_STACKED_CSS = `${BASE_CSS}\n.menu { display: block; }`;

/** 상품을 한 열로 쌓는 CSS. */
const PRODUCTS_STACKED_CSS = `${BASE_CSS}\n.product-list { grid-template-columns: 1fr; }`;

/** 2개짜리 목록 3벌을 가로로 늘어놓아 배치는 시안과 같게 유지한다. */
const PAIRS_CSS = `${BASE_CSS}
.products { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
.products h1, .products h2, .products h3 { grid-column: 1 / -1; }
.product-list { display: block; margin-bottom: 0; }
.product-list .card + .card { margin-top: 32px; }`;

export const VIOLATIONS: Violation[] = [
  {
    id: "V1",
    intent: "상품 카드를 목록으로 묶지 않고 div로 나열",
    expectedFailures: ["r3"],
    html: buildHtml({ productsAsDivs: true }),
    css: BASE_CSS,
  },
  {
    id: "V2",
    intent: "상품 카드를 세로 한 열로 쌓음",
    expectedFailures: ["r4"],
    html: buildHtml({}),
    css: PRODUCTS_STACKED_CSS,
  },
  {
    id: "V3",
    intent: "상품 이미지 하나에 대체 텍스트 누락",
    expectedFailures: ["r5"],
    html: buildHtml({ dropAlt: true }),
    css: BASE_CSS,
  },
  {
    id: "V4",
    intent: "구역 제목을 h3으로 써서 제목 단계를 건너뜀",
    expectedFailures: ["heading-order"],
    html: buildHtml({ skipHeading: true }),
    css: BASE_CSS,
  },
  {
    id: "V5",
    intent: "구역 제목을 h1로 써서 최상위 제목이 둘",
    expectedFailures: ["heading-single"],
    html: buildHtml({ extraH1: true }),
    css: BASE_CSS,
  },
  {
    id: "V6",
    intent: "상품을 2개짜리 목록 3벌로 묶음 (accept에 없는 해석)",
    expectedFailures: ["r3"],
    html: buildHtml({ productsInPairs: true }),
    css: PAIRS_CSS,
  },
  {
    id: "V7",
    intent: "메뉴 항목을 세로로 쌓음",
    expectedFailures: ["r2"],
    html: buildHtml({}),
    css: MENU_STACKED_CSS,
  },
  {
    id: "V8",
    intent: "메뉴 항목을 목록으로 묶지 않고 div로 나열",
    expectedFailures: ["r1"],
    html: buildHtml({ menuAsDivs: true }),
    css: BASE_CSS,
  },
];

/** 폼 검증용 위반 코드. */
export const FORM_VIOLATION = {
  intent: "검색 입력창에 레이블을 연결하지 않음",
  expectedFailures: ["f1"],
  html: `<h1>검색</h1>
<form>
  <span>검색어</span>
  <input type="search" name="q">
  <button type="submit">검색</button>
</form>`,
  css: "",
};
