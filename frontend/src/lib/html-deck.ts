/**
 * 팀이 올린 HTML 발표 자료를 격리된 틀(sandbox iframe) 안에서 제대로 돌게 손보는 도우미.
 *
 * 1) 글자 인코딩: 한글 HTML 중에는 EUC-KR로 저장된 것이 있다. UTF-8로만 읽으면 한글이 깨지므로
 *    <meta charset>을 보고, 선언이 없는데 UTF-8로 읽어 깨지면 EUC-KR로 다시 읽는다.
 * 2) 브라우저 저장소: 격리된 틀에서는 localStorage·sessionStorage·cookie에 손대는 순간 오류가 나,
 *    슬라이드 위치를 저장하는 발표 도구(reveal.js 등)의 스크립트가 통째로 멈춘다.
 *    문서 맨 앞에 메모리로 대신하는 작은 스크립트를 넣어 오류 없이 돌게 한다.
 */

export function decodeHtml(buf: ArrayBuffer): string {
  const head = new TextDecoder("latin1").decode(buf.slice(0, 4096));
  const declared = /<meta[^>]+charset\s*=\s*["']?\s*([\w-]+)/i.exec(head)?.[1]?.toLowerCase();

  const tryDecode = (label: string): string | null => {
    try {
      return new TextDecoder(label).decode(buf);
    } catch {
      return null;
    }
  };

  if (declared && declared !== "utf-8" && declared !== "utf8") {
    const decoded = tryDecode(declared);
    if (decoded !== null) return decoded;
  }

  const utf8 = new TextDecoder("utf-8").decode(buf);
  // 선언 없이 UTF-8로 읽었는데 깨진 글자(�)가 많으면 EUC-KR 파일로 본다
  if (!declared) {
    const broken = (utf8.match(/�/g) ?? []).length;
    if (broken > 5) {
      const euckr = tryDecode("euc-kr");
      if (euckr !== null) return euckr;
    }
  }
  return utf8;
}

const STORAGE_SHIM = `<script>(function(){
function mem(){var d={};return{getItem:function(k){return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null},
setItem:function(k,v){d[k]=String(v)},removeItem:function(k){delete d[k]},clear:function(){d={}},
key:function(i){return Object.keys(d)[i]||null},get length(){return Object.keys(d).length}}}
["localStorage","sessionStorage"].forEach(function(n){try{window[n].getItem("_")}catch(e){
try{Object.defineProperty(window,n,{value:mem(),configurable:true})}catch(_){}}});
try{void document.cookie}catch(e){try{Object.defineProperty(document,"cookie",
{get:function(){return""},set:function(){},configurable:true})}catch(_){}}
})();</script>`;

/** 문서 맨 앞(<head> 바로 뒤, 없으면 맨 처음)에 저장소 대체 스크립트를 넣는다. */
export function prepareDeckHtml(html: string): string {
  const headOpen = /<head[^>]*>/i.exec(html);
  if (headOpen) {
    const at = headOpen.index + headOpen[0].length;
    return html.slice(0, at) + STORAGE_SHIM + html.slice(at);
  }
  return STORAGE_SHIM + html;
}
