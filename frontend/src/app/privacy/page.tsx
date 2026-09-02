import type { Metadata } from "next";
import { Card, Section } from "@/components/ui";

export const metadata: Metadata = { title: "개인정보 처리방침" };

/**
 * 개인정보 수집·이용 안내.
 *
 * 문구는 학생회에서 최종 검토 후 확정해야 한다. 특히 보유 기간과 문의처는
 * 실제 운영 방침에 맞춰 고쳐야 하는 값이다.
 */
export default function PrivacyPage() {
  return (
    <Section title="개인정보 수집·이용 안내">
      <div className="space-y-4">
        <Card>
          <h2 className="font-bold">1. 수집 항목</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            <li>· 성명, 학번, 한양대학교 이메일 주소</li>
            <li>· 소속 학과 (선택 입력)</li>
            <li>· 팀명 및 팀 구성 정보</li>
            <li>· 제출한 산출물 및 파일</li>
            <li>· 평가 점수 및 코멘트</li>
          </ul>
        </Card>

        <Card>
          <h2 className="font-bold">2. 수집·이용 목적</h2>
          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            <li>· 해커톤 참가자 신원 확인 및 참가 자격 검증</li>
            <li>· 팀 구성 및 참가자 연락</li>
            <li>· 산출물 제출 접수 및 심사 진행</li>
            <li>· 수상자 선정 및 시상</li>
          </ul>
        </Card>

        <Card>
          <h2 className="font-bold">3. 보유 및 이용 기간</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            수집된 개인정보는 행사 종료 후 3개월 이내에 파기합니다. 다만 수상 내역은 학과
            행사 기록 보존을 위해 성명과 팀명에 한해 별도 보관될 수 있습니다.
          </p>
        </Card>

        <Card>
          <h2 className="font-bold">4. 동의 거부 권리</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            개인정보 수집·이용에 동의를 거부할 권리가 있습니다. 다만 참가자 확인과 시상에
            필수적인 정보이므로, 거부 시 해커톤 참가가 제한됩니다.
          </p>
        </Card>

        <Card>
          <h2 className="font-bold">5. 제3자 제공</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            수집된 정보는 제3자에게 제공하지 않습니다. 다만 심사를 위해 제출한 산출물과
            팀명은 심사위원 및 참가 학생에게 공개됩니다. 평가 화면에서는 학번과 이메일이
            표시되지 않습니다.
          </p>
        </Card>

        <Card>
          <h2 className="font-bold">6. 문의</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            개인정보 관련 문의나 열람·삭제 요청은 정보시스템학과 학생회로 연락해 주세요.
          </p>
        </Card>
      </div>
    </Section>
  );
}
