import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // exFAT 볼륨에서 macOS가 만드는 AppleDouble 메타데이터 파일.
    // 소스가 아니므로 검사 대상에서 제외한다.
    "**/._*",
  ]),
]);

export default eslintConfig;
