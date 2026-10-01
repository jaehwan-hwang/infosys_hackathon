import { redirect } from "next/navigation";

/** 결과물 제출은 "팀" 화면의 우리 팀 탭 안으로 합쳤다. */
export default function SubmitRedirect() {
  redirect("/team");
}
