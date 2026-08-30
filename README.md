# HTML/CSS 학습 플레이그라운드

웹 디자인 시안을 보고 직접 HTML/CSS를 작성하며 **시맨틱 마크업**과 **레이아웃 구현** 능력을 훈련하는 학습 도구입니다.

상세 사양은 [docs/PRD_HTMLCSS_Playground_v0.3.md](docs/PRD_HTMLCSS_Playground_v0.3.md)를 참조하세요.

## 기술 스택

| 항목 | 선택 |
|---|---|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 |
| 에디터 | CodeMirror 6 (확장 직접 조립, `basicSetup` 미사용) |
| 코드 렌더링 | iframe sandbox |
| 저장 | localStorage (향후 IndexedDB → Supabase 교체 예정) |

## 개발

```bash
npm run dev
```

http://localhost:3000 에서 확인합니다.

### `prebuild` 스크립트에 관하여

작업 경로가 exFAT 볼륨이라 macOS가 파일마다 AppleDouble 메타데이터 파일(`._*`)을 만듭니다. Turbopack은 `.next` 캐시 디렉터리의 파일명을 숫자로 파싱하므로 이 파일이 있으면 빌드가 실패합니다. `prebuild`에서 이를 정리합니다. 리눅스 환경(Vercel)에서는 대상 파일이 없어 무해하게 통과합니다.

## 디렉터리

```
app/            라우트, 레이아웃, 전역 스타일
components/     화면 구성 요소
lib/            에디터 확장 구성, 저장 계층
docs/           PRD
```

저장소 접근은 `lib/storage/` 안에만 두고 컴포넌트에서 직접 호출하지 않습니다. 저장소 교체를 위해 인터페이스는 Promise 반환으로 통일합니다.
