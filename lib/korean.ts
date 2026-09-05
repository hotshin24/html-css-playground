/**
 * 한국어 조사 처리.
 *
 * 화면 문구에 값이 끼어들면 받침에 따라 조사가 달라진다. `을(를)` 같은 괄호
 * 표기는 읽기 나쁘고, 사용자가 붙인 제목이 값으로 들어오는 자리에서는 미리
 * 정해 둘 수도 없다. 판정 문구와 화면 문구가 같은 규칙을 쓰도록 한곳에 둔다.
 */

/** 마지막 글자에 받침이 있는지. */
export function hasFinalConsonant(text: string): boolean {
  const trimmed = text.trimEnd();
  if (!trimmed) return false;

  const code = trimmed.charCodeAt(trimmed.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

/** 받침 유무에 따라 조사를 고른다. */
export function josa(text: string, withFinal: string, withoutFinal: string): string {
  return hasFinalConsonant(text) ? withFinal : withoutFinal;
}
