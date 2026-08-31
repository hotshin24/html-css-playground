/**
 * 정답 코드 픽스처 — 오탐 측정용 (PRD 8.2).
 *
 * **`public/sample-design.svg`만 보고 작성했다.** 판정 조건 JSON을 쓰기 전에
 * 작성해 커밋한다. 조건을 알고 코드를 쓰면 AI가 생성한 기대값이 틀린 경우를
 * 잡을 수 없어, 검증이 스스로를 검증하는 구조가 된다.
 *
 * 같은 시안에 대해 올바른 구현이 여럿이라는 것이 이 도구의 전제이므로,
 * 시맨틱 선택과 배치 방식을 서로 다르게 가져간다.
 */

export type Solution = {
  id: string;
  /** 어떤 점이 다른 구현인지. */
  approach: string;
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

/** A — 시맨틱 요소를 적극적으로 쓰고 Flexbox로 배치 */
const SOLUTION_A: Solution = {
  id: "A",
  approach: "nav/section/article 사용, Flexbox 배치, 상품 목록은 평면 나열",
  html: `<header class="header">
  <a class="logo" href="#">SHOP</a>
  <nav>
    <ul class="menu">
${MENU.map((item) => `      <li><a href="#">${item}</a></li>`).join("\n")}
    </ul>
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
    <h2>인기 상품</h2>
    <ul class="product-list">
${PRODUCTS.map(
  (product) => `      <li>
        <article class="card">
          <img src="${product.name}.jpg" alt="${product.name}">
          <h3>${product.name}</h3>
          <p class="price">${product.price}</p>
        </article>
      </li>`,
).join("\n")}
    </ul>
  </section>
</main>

<footer class="footer">
  <p><small>&copy; 2026 SHOP. All rights reserved.</small></p>
</footer>`,
  css: `body { margin: 0; font-family: sans-serif; color: #18181b; }
.header, main, .footer { max-width: 1200px; margin: 0 auto; }

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 64px;
  height: 88px;
  border-bottom: 1px solid #e4e4e7;
}
.logo { font-size: 24px; font-weight: 700; text-decoration: none; color: inherit; }
.menu { display: flex; gap: 32px; list-style: none; margin: 0; padding: 0; }
.menu a { font-size: 15px; color: #3f3f46; text-decoration: none; }

.hero { display: flex; align-items: center; gap: 64px; padding: 72px 64px; }
.hero-text { flex: 1; }
.hero h1 { font-size: 48px; line-height: 1.25; margin: 0; }
.lead { font-size: 17px; color: #71717a; margin: 24px 0 32px; }
.button {
  display: inline-block;
  padding: 16px 40px;
  border-radius: 26px;
  background: #2563eb;
  color: #fff;
  font-weight: 600;
  text-decoration: none;
}
.hero-image { width: 496px; height: 340px; border-radius: 12px; background: #e4e4e7; }

.products { padding: 0 64px 80px; }
.products h2 { font-size: 32px; margin: 0 0 44px; }
.product-list { display: flex; flex-wrap: wrap; gap: 32px; list-style: none; margin: 0; padding: 0; }
.product-list > li { width: 336px; }
.card img { display: block; width: 100%; height: 220px; border-radius: 10px; background: #f4f4f5; }
.card h3 { font-size: 16px; margin: 20px 0 8px; }
.price { font-size: 15px; color: #52525b; margin: 0; }

.footer { padding: 40px 64px; background: #fafafa; text-align: center; }
.footer p { margin: 0; color: #71717a; font-size: 14px; }`,
};

/** B — 같은 시맨틱, CSS Grid 배치, 카드에 figure 사용 */
const SOLUTION_B: Solution = {
  id: "B",
  approach: "CSS Grid 배치, 카드 이미지를 figure로 감쌈, 상품 목록은 평면 나열",
  html: `<header class="header">
  <p class="logo"><a href="#">SHOP</a></p>
  <nav aria-label="주 메뉴">
    <ul>
${MENU.map((item) => `      <li><a href="#">${item}</a></li>`).join("\n")}
    </ul>
  </nav>
</header>

<main>
  <section class="hero">
    <div>
      <h1>새로운 계절, 새로운 선택</h1>
      <p>가을 신상품을 지금 만나보세요.</p>
      <a class="cta" href="#">지금 둘러보기</a>
    </div>
    <img src="hero.jpg" alt="">
  </section>

  <section>
    <h2>인기 상품</h2>
    <ul class="grid">
${PRODUCTS.map(
  (product) => `      <li>
        <figure>
          <img src="${product.name}.jpg" alt="${product.name} 상품 사진">
        </figure>
        <h3>${product.name}</h3>
        <p>${product.price}</p>
      </li>`,
).join("\n")}
    </ul>
  </section>
</main>

<footer>
  <p>&copy; 2026 SHOP. All rights reserved.</p>
</footer>`,
  css: `body { margin: 0 auto; max-width: 1200px; font-family: sans-serif; color: #18181b; }
ul { list-style: none; margin: 0; padding: 0; }
a { color: inherit; text-decoration: none; }

.header {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  height: 88px;
  padding: 0 64px;
  border-bottom: 1px solid #e4e4e7;
}
.logo { font-size: 24px; font-weight: 700; margin: 0; }
.header nav ul { display: grid; grid-auto-flow: column; gap: 32px; justify-content: end; }
.header nav a { font-size: 15px; color: #3f3f46; }

.hero {
  display: grid;
  grid-template-columns: 1fr 496px;
  gap: 64px;
  align-items: center;
  padding: 72px 64px;
}
.hero h1 { font-size: 48px; margin: 0 0 24px; }
.hero p { font-size: 17px; color: #71717a; margin: 0 0 32px; }
.cta {
  display: inline-block;
  padding: 16px 40px;
  border-radius: 26px;
  background: #2563eb;
  color: #fff;
  font-weight: 600;
}
.hero img { width: 496px; height: 340px; border-radius: 12px; background: #e4e4e7; }

main section { padding: 0 64px 80px; }
main h2 { font-size: 32px; margin: 0 0 44px; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
.grid figure { margin: 0; }
.grid img { display: block; width: 100%; height: 220px; border-radius: 10px; background: #f4f4f5; }
.grid h3 { font-size: 16px; margin: 20px 0 8px; }
.grid p { font-size: 15px; color: #52525b; margin: 0; }

footer { padding: 40px 64px; background: #fafafa; text-align: center; }
footer p { margin: 0; font-size: 14px; color: #71717a; }`,
};

/** C — 상품을 행 단위로 묶고 Flexbox로 배치 */
const SOLUTION_C: Solution = {
  id: "C",
  approach: "상품 목록을 행 단위 목록 2벌로 중첩, Flexbox 배치",
  html: `<header>
  <div class="logo"><a href="#">SHOP</a></div>
  <nav>
    <ul class="gnb">
${MENU.map((item) => `      <li><a href="#">${item}</a></li>`).join("\n")}
    </ul>
  </nav>
</header>

<main>
  <section class="visual">
    <div class="copy">
      <h1>새로운 계절,<br>새로운 선택</h1>
      <p>가을 신상품을 지금 만나보세요.</p>
      <a class="btn" href="#">지금 둘러보기</a>
    </div>
    <img src="visual.jpg" alt="가을 신상품">
  </section>

  <section class="best">
    <h2>인기 상품</h2>
${[0, 3]
  .map(
    (start) => `    <ul class="row">
${PRODUCTS.slice(start, start + 3)
  .map(
    (product) => `      <li class="item">
        <img src="${product.name}.jpg" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>${product.price}</p>
      </li>`,
  )
  .join("\n")}
    </ul>`,
  )
  .join("\n")}
  </section>
</main>

<footer>
  <small>&copy; 2026 SHOP. All rights reserved.</small>
</footer>`,
  css: `body { margin: 0; font-family: sans-serif; color: #18181b; }
ul { list-style: none; margin: 0; padding: 0; }
a { color: inherit; text-decoration: none; }
header, main, footer { max-width: 1200px; margin: 0 auto; }

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 88px;
  padding: 0 64px;
  border-bottom: 1px solid #e4e4e7;
}
.logo { font-size: 24px; font-weight: 700; }
.gnb { display: flex; gap: 32px; }
.gnb a { font-size: 15px; color: #3f3f46; }

.visual { display: flex; gap: 64px; align-items: center; padding: 72px 64px; }
.copy { flex: 1; }
.visual h1 { font-size: 48px; line-height: 1.25; margin: 0 0 24px; }
.visual p { font-size: 17px; color: #71717a; margin: 0 0 32px; }
.btn {
  display: inline-block;
  padding: 16px 40px;
  border-radius: 26px;
  background: #2563eb;
  color: #fff;
  font-weight: 600;
}
.visual img { width: 496px; height: 340px; border-radius: 12px; background: #e4e4e7; }

.best { padding: 0 64px 80px; }
.best h2 { font-size: 32px; margin: 0 0 44px; }
.row { display: flex; gap: 32px; margin-bottom: 32px; }
.item { width: 336px; }
.item img { display: block; width: 100%; height: 220px; border-radius: 10px; background: #f4f4f5; }
.item h3 { font-size: 16px; margin: 20px 0 8px; }
.item p { font-size: 15px; color: #52525b; margin: 0; }

footer { padding: 40px 64px; background: #fafafa; text-align: center; font-size: 14px; color: #71717a; }`,
};

/** D — div 위주로 쓰고 inline-block으로 배치 */
const SOLUTION_D: Solution = {
  id: "D",
  approach: "nav/section/article 없이 div 위주, inline-block 배치, 장식 이미지는 빈 alt",
  html: `<div class="top">
  <div class="brand"><a href="#">SHOP</a></div>
  <ul class="links">
${MENU.map((item) => `    <li><a href="#">${item}</a></li>`).join("\n")}
  </ul>
</div>

<div class="banner">
  <div class="banner-text">
    <h1>새로운 계절, 새로운 선택</h1>
    <p>가을 신상품을 지금 만나보세요.</p>
    <a class="go" href="#">지금 둘러보기</a>
  </div>
  <img class="banner-img" src="banner.jpg" alt="">
</div>

<div class="goods">
  <h2>인기 상품</h2>
  <ul class="goods-list">
${PRODUCTS.map(
  (product) => `    <li class="goods-item">
      <img src="${product.name}.jpg" alt="${product.name}">
      <h3>${product.name}</h3>
      <div class="cost">${product.price}</div>
    </li>`,
).join("\n")}
  </ul>
</div>

<div class="bottom">&copy; 2026 SHOP. All rights reserved.</div>`,
  css: `body { margin: 0; font-family: sans-serif; color: #18181b; }
ul { list-style: none; margin: 0; padding: 0; }
a { color: inherit; text-decoration: none; }
.top, .banner, .goods, .bottom { max-width: 1200px; margin: 0 auto; padding: 0 64px; }

.top { height: 88px; line-height: 88px; border-bottom: 1px solid #e4e4e7; }
.brand { display: inline-block; font-size: 24px; font-weight: 700; }
.links { display: inline-block; float: right; }
.links li { display: inline-block; margin-left: 32px; font-size: 15px; color: #3f3f46; }

.banner { padding-top: 72px; padding-bottom: 72px; }
.banner-text { display: inline-block; width: 560px; vertical-align: middle; }
.banner h1 { font-size: 48px; margin: 0 0 24px; }
.banner p { font-size: 17px; color: #71717a; margin: 0 0 32px; }
.go {
  display: inline-block;
  padding: 16px 40px;
  border-radius: 26px;
  background: #2563eb;
  color: #fff;
  font-weight: 600;
}
.banner-img { display: inline-block; width: 496px; height: 340px; border-radius: 12px; background: #e4e4e7; vertical-align: middle; }

.goods { padding-bottom: 80px; }
.goods h2 { font-size: 32px; margin: 0 0 44px; }
/* inline-block 사이의 공백 문자가 폭을 차지하므로 목록에서 글자 크기를 없앤다. */
.goods-list { font-size: 0; }
.goods-item {
  font-size: 15px;
  display: inline-block;
  width: 336px;
  margin-right: 32px;
  margin-bottom: 32px;
  vertical-align: top;
}
.goods-item:nth-child(3n) { margin-right: 0; }
.goods-item img { display: block; width: 100%; height: 220px; border-radius: 10px; background: #f4f4f5; }
.goods-item h3 { font-size: 16px; margin: 20px 0 8px; }
.cost { font-size: 15px; color: #52525b; }

.bottom { padding-top: 40px; padding-bottom: 40px; background: #fafafa; text-align: center; font-size: 14px; color: #71717a; }`,
};

export const SOLUTIONS: Solution[] = [SOLUTION_A, SOLUTION_B, SOLUTION_C, SOLUTION_D];
