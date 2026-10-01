import { redirect } from "next/navigation";

/** 팀 등록은 "팀" 화면 안으로 합쳤다. */
export default function RegisterRedirect() {
  redirect("/team");
}
