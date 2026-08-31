/**
 * 업로드한 시안 이미지를 저장용으로 다듬는다.
 *
 * 고해상도 PNG를 그대로 IndexedDB에 넣으면 몇 장만으로 할당량에 걸린다.
 * 학습 목표가 시맨틱·레이아웃이라 픽셀 정확도가 필요하지 않으므로,
 * 가로 폭을 제한하고 WebP로 변환해 용량을 줄인다.
 */

/** 시안 표시와 구역 오버레이에 충분한 폭. */
const MAX_WIDTH = 1600;
const WEBP_QUALITY = 0.85;

export type PreparedImage = {
  blob: Blob;
  /** 변환 후 크기. 구역 bounds 환산에 쓴다. */
  width: number;
  height: number;
  /** 변환 전 원본 크기. 사용자에게 보여줄 정보. */
  originalWidth: number;
  originalHeight: number;
  originalBytes: number;
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 읽을 수 없습니다."));
    };
    image.src = url;
  });
}

export async function prepareDesignImage(file: File): Promise<PreparedImage> {
  const image = await loadImage(file);

  const scale = Math.min(1, MAX_WIDTH / image.naturalWidth);
  const width = Math.round(image.naturalWidth * scale);
  const height = Math.round(image.naturalHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("이미지를 변환할 수 없습니다.");
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", WEBP_QUALITY);
  });
  if (!blob) throw new Error("이미지를 변환할 수 없습니다.");

  return {
    blob,
    width,
    height,
    originalWidth: image.naturalWidth,
    originalHeight: image.naturalHeight,
    originalBytes: file.size,
  };
}

/** 바이트 수를 사람이 읽는 크기로. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
