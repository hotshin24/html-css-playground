/** 저장소 키. 접두사로 이 앱의 데이터임을 구분한다. */
export const STORAGE_KEYS = {
  editorSettings: "hcp:editor-settings",
  draft: "hcp:draft",
  layout: "hcp:layout",
} as const;

/** 1단계 더미 데이터. 소스 등록·구역 편집 화면이 생기면 실제 데이터로 교체한다. */
export const DUMMY_SESSION = {
  sectionIndex: 2,
  sectionTotal: 5,
  sectionName: "히어로",
  attemptTotal: 3,
  /** 작성 코드를 구역별로 저장하기 위한 식별자. */
  sectionId: "demo-sec-01",
} as const;

/** 열 너비 비율. 세 값의 합이 1이 되도록 유지한다. */
export type ColumnRatios = [number, number, number];

/** HTML/CSS 에디터의 높이 비율. 두 값의 합이 1이 되도록 유지한다. */
export type EditorRowRatios = [number, number];

export const DEFAULT_COLUMN_RATIOS: ColumnRatios = [0.26, 0.4, 0.34];
export const DEFAULT_EDITOR_ROW_RATIOS: EditorRowRatios = [0.5, 0.5];

/** 각 열의 최소 너비(px). 순서는 시안 / 에디터 / 미리보기. */
export const MIN_COLUMN_PX: ColumnRatios = [160, 260, 200];

/** HTML·CSS 에디터 각각의 최소 높이(px). */
export const MIN_EDITOR_ROW_PX = 96;

/** 리사이저 손잡이의 두께(px). */
export const RESIZER_PX = 6;

/** 키보드 방향키로 리사이저를 움직일 때의 이동량(px). */
export const RESIZER_KEY_STEP_PX = 16;

/** 타이핑이 멈춘 뒤 미리보기를 갱신하기까지의 대기 시간(ms). */
export const PREVIEW_DEBOUNCE_MS = 300;

/** 변경이 멈춘 뒤 저장하기까지의 대기 시간(ms). */
export const SAVE_DEBOUNCE_MS = 500;

/** 에디터 설정. 설정 패널의 토글 두 개에 대응한다. */
export type EditorSettings = {
  /**
   * 코드 이름 제안.
   * 태그 이름, HTML 속성 이름·값, CSS 속성명·값 제안을 하나로 묶어 제어한다.
   * 학습자가 이름을 직접 떠올리는 것이 훈련의 핵심이므로 기본은 꺼짐이다.
   */
  nameSuggestions: boolean;
  /** 줄바꿈. */
  lineWrap: boolean;
};

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  nameSuggestions: false,
  lineWrap: true,
};
