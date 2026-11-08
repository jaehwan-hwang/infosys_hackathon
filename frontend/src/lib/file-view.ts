/**
 * 팀이 올린 HTML 파일(발표 자료 등)을 화면으로 보여주기 위한 도우미.
 *
 * 파일 저장소(Supabase)는 보안 때문에 HTML을 글자(text/plain)로만 내준다. 그대로 열면
 * 평가자가 슬라이드 대신 소스 코드를 보게 되므로, 우리 저장소에 올라간 HTML은 /view로 보내
 * 격리된 틀(sandbox iframe) 안에서 그린다.
 */

/** 우리 파일 저장소의 공개 주소인가. /view는 이 주소만 그린다 — 아무 주소나 그리면 남의 페이지를 우리 도메인에 띄울 수 있다. */
export function isStorageUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".supabase.co") &&
      url.pathname.startsWith("/storage/v1/object/public/")
    );
  } catch {
    return false;
  }
}

function isHtmlFile(raw: string): boolean {
  try {
    return /\.html?$/i.test(new URL(raw).pathname);
  } catch {
    return false;
  }
}

/** 링크를 걸 주소. 저장소에 올라간 HTML이면 /view로, 나머지는 그대로. */
export function viewableHref(raw: string): string {
  return isStorageUrl(raw) && isHtmlFile(raw) ? `/view?src=${encodeURIComponent(raw)}` : raw;
}
