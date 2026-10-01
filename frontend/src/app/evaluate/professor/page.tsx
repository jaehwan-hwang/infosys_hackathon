import { redirect } from "next/navigation";

/** 교수 평가는 /evaluate 안으로 합쳤다. 예전 주소로 들어오면 그쪽으로 보낸다. */
export default function ProfessorEvaluateRedirect() {
  redirect("/evaluate");
}
