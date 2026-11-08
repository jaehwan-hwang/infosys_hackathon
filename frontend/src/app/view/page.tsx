import type { Metadata } from "next";
import { isStorageUrl } from "@/lib/file-view";

export const metadata: Metadata = {
  title: "자료 보기",
  robots: { index: false, follow: false },
};

/**
 * 팀이 올린 HTML 파일을 화면으로 보여준다.
 *
 * 파일 저장소는 HTML을 글자(text/plain)로만 내주므로, 서버에서 내용을 받아 격리된 틀
 * (sandbox iframe, srcDoc)에 그린다. allow-same-origin을 주지 않아 그 안의 스크립트는
 * 우리 사이트의 로그인 정보·쿠키에 닿지 못하고, 바깥 창을 옮기지도 못한다.
 * 우리 저장소 주소만 받는다.
 */
export default async function ViewPage({
  searchParams,
}: {
  searchParams: Promise<{ src?: string | string[] }>;
}) {
  const raw = (await searchParams).src;
  const src = Array.isArray(raw) ? raw[0] : raw;

  if (!src || !isStorageUrl(src)) {
    return <Notice title="열 수 없는 자료입니다" body="이 사이트에 올라간 파일만 열 수 있습니다." />;
  }

  let html: string;
  try {
    const res = await fetch(src, { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    html = await res.text();
  } catch {
    return (
      <Notice
        title="자료를 불러오지 못했습니다"
        body="잠시 뒤 다시 시도해 주세요. 계속 안 되면 팀에 링크로 다시 제출해 달라고 요청해 주세요."
      />
    );
  }

  return (
    <div className="px-3 pb-3 sm:px-5">
      <iframe
        title="팀 제출 자료"
        srcDoc={html}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-modals"
        allow="fullscreen"
        allowFullScreen
        className="block h-[calc(100dvh-6rem)] w-full rounded-2xl border-2 border-current/15 bg-white"
      />
    </div>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <section className="mx-auto w-full max-w-xl px-5 py-20 text-center">
      <h1 className="font-display text-2xl tracking-tight">{title}</h1>
      <p className="mt-3 text-sm text-muted">{body}</p>
    </section>
  );
}
