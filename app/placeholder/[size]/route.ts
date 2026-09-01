/**
 * 자리표시 이미지 (F-05-07).
 *
 * 학습자가 쓸 이미지 파일이 없으므로 앱이 대신 내준다. `/placeholder/300x200.svg`
 * 처럼 크기를 경로에 적는다.
 *
 * data URL로 넘기는 방법도 있으나 가장 짧게 만들어도 123자, 크기 라벨을 넣으면
 * 264자라 `src` 값이 코드를 덮는다. 실제 경로를 쓰는 편이 실무 모양에 가깝고
 * 에디터에서도 읽힌다.
 */

/** 시안보다 큰 이미지는 쓸 일이 없다. 무리한 값으로 큰 SVG를 만들지 않도록 막는다. */
const MAX_SIZE = 4000;

function parseSize(raw: string): { width: number; height: number } | null {
  // `300x200`과 `300x200.svg`를 모두 받는다. 확장자가 있는 편이 이미지처럼 보인다.
  const match = /^(\d{1,4})x(\d{1,4})(?:\.svg)?$/i.exec(raw);
  if (!match) return null;

  const width = Number(match[1]);
  const height = Number(match[2]);
  if (width < 1 || height < 1 || width > MAX_SIZE || height > MAX_SIZE) return null;

  return { width, height };
}

/**
 * 회색 바탕에 크기를 적은 SVG.
 *
 * 글꼴을 지정하지 않아 보는 쪽 기본 글꼴을 따른다. 자리표시에는 충분하고
 * 문자열도 짧아진다. 작은 이미지에서는 글자가 넘치므로 크기에 맞춰 줄인다.
 */
function buildSvg(width: number, height: number): string {
  const label = `${width}×${height}`;
  const fontSize = Math.max(9, Math.min(16, Math.floor(Math.min(width / 6, height / 3))));
  const fits = width >= 60 && height >= 24;

  const text = fits
    ? `<text x="50%" y="50%" dy="0.35em" fill="#8a8a8a" font-size="${fontSize}" text-anchor="middle">${label}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="자리표시 이미지 ${label}"><rect width="${width}" height="${height}" fill="#dcdcdc"/>${text}</svg>`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const parsed = parseSize(size);

  if (!parsed) {
    return new Response("크기는 `300x200` 형식으로 적어 주세요.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(buildSvg(parsed.width, parsed.height), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // 크기가 같으면 내용도 같다. 미리보기가 타이핑마다 갱신되므로 캐시가 필요하다.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
