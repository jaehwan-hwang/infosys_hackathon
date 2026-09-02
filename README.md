# 정보시스템학과 해커톤 웹사이트

한양대학교 정보시스템학과 학생회 해커톤 운영 웹사이트. 랜딩 페이지, 팀 등록, 트랙별 산출물 제출, 학생 투표·교수 평가, 운영진 대시보드를 포함합니다.

기획 내용은 [hackathon_plan.md](hackathon_plan.md)를 참고하세요.

---

## 구성

```
infosys_hackathon/
├── backend/     Spring Boot 3.5 + JPA (REST API)
├── frontend/    Next.js 16 + TypeScript + Tailwind 4
└── hackathon_plan.md
```

| 영역 | 스택 |
|---|---|
| 프론트엔드 | Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Auth.js(NextAuth) v5 |
| 백엔드 | Spring Boot 3.5, Java 17, Spring Data JPA, Spring Security |
| DB | PostgreSQL (Supabase) — 로컬 개발은 H2 인메모리 |
| 파일 저장소 | Supabase Storage |
| 인증 | Google OAuth (@hanyang.ac.kr 도메인 제한) → 백엔드 자체 JWT |

---

## 빠르게 실행하기

로컬에서는 H2 인메모리 DB로 뜨기 때문에 별도 설정 없이 바로 실행됩니다.

**터미널 1 — 백엔드** (PowerShell 또는 Git Bash)

```bash
cd backend && ./gradlew bootRun
```

**터미널 2 — 프론트엔드** (PowerShell 또는 Git Bash)

```bash
cd frontend && npm install && npm run dev
```

프론트엔드는 `frontend/.env.local`이 필요합니다. `.env.example`을 복사해 만드세요.

```bash
cd frontend && cp .env.example .env.local
```

Google OAuth를 아직 발급받지 않았다면 로그인만 동작하지 않고, 랜딩·자가진단 페이지는 그대로 확인할 수 있습니다.

- 프론트엔드 http://localhost:3000
- 백엔드 API http://localhost:8080

최초 기동 시 활성 행사 1건과 트랙별 기본 평가 항목 12개가 자동 생성됩니다 (`DataSeeder`).

---

## 설정

### 1. Google OAuth 클라이언트 발급

1. [Google Cloud Console](https://console.cloud.google.com/) → 새 프로젝트 생성
2. **API 및 서비스 → OAuth 동의 화면** → 외부(External) 선택 후 앱 정보 입력
3. **API 및 서비스 → 사용자 인증 정보 → OAuth 클라이언트 ID 만들기** → 웹 애플리케이션
4. 승인된 리디렉션 URI에 아래를 등록
   - 로컬: `http://localhost:3000/api/auth/callback/google`
   - 배포: `https://<프론트엔드 도메인>/api/auth/callback/google`
5. 발급된 클라이언트 ID/시크릿을 환경변수에 넣습니다.

### 2. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성 (무료 티어)
2. **Project Settings → Database → Connection string → JDBC**에서 접속 정보 확인
3. **Storage → New bucket**으로 `submissions` 버킷 생성, **Public** 체크
4. **Project Settings → API**에서 `service_role` 키 확인 (서버에만 두고 절대 프론트에 노출하지 않습니다)

### 3. 환경변수

**백엔드** (`backend/` — 환경변수 또는 `application-prod.yml`)

| 변수 | 설명 | 예시 |
|---|---|---|
| `DB_URL` | Supabase JDBC URL | `jdbc:postgresql://db.xxx.supabase.co:5432/postgres` |
| `DB_USERNAME` | DB 사용자 | `postgres` |
| `DB_PASSWORD` | DB 비밀번호 | |
| `JPA_DDL_AUTO` | 운영은 `validate` 또는 `update` | `update` |
| `JWT_SECRET` | 자체 토큰 서명 키 (32바이트 이상) | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID | |
| `ALLOWED_EMAIL_DOMAINS` | 허용 이메일 도메인 | `hanyang.ac.kr` |
| `ADMIN_EMAILS` | 초기 운영진 이메일 (쉼표 구분) | `admin@hanyang.ac.kr` |
| `PROFESSOR_EMAILS` | 초기 교수 이메일 (쉼표 구분) | |
| `CORS_ALLOWED_ORIGINS` | 프론트엔드 주소 | `https://hackathon.example.com` |
| `SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | service_role 키 | |
| `SUPABASE_BUCKET` | 버킷 이름 | `submissions` |
| `MAX_UPLOAD_MB` | 업로드 용량 상한 | `50` |

**프론트엔드** (`frontend/.env.local`)

`.env.example` 참고. `AUTH_SECRET`은 아래로 생성합니다.

```bash
openssl rand -base64 32
```

> `SUPABASE_SERVICE_KEY`와 `JWT_SECRET`은 절대 저장소에 커밋하지 마세요. `.env.local`은 git에서 제외되어 있습니다.

---

## 무료로 배포하기

세 조각 모두 무료 티어로 운영할 수 있습니다.

| 조각 | 서비스 | 비고 |
|---|---|---|
| 프론트엔드 | **Vercel** Hobby | Next.js 기본 지원, 무료 |
| DB + 파일 | **Supabase** Free | 500MB DB, 1GB 스토리지. 7일 미사용 시 일시정지되나 재개 가능 |
| 백엔드 | **Oracle Cloud Always Free** (권장) 또는 **Google Cloud Run** | 아래 참고 |

### 백엔드 호스팅 선택

행사 당일에는 전원이 동시에 투표하므로 **콜드 스타트가 없는 쪽**이 안전합니다.

- **Oracle Cloud Always Free** — ARM 4코어/24GB VM이 영구 무료. 항상 켜져 있어 행사 당일에 가장 안정적입니다. 카드 등록(과금 없음)이 필요하고, 서울 리전은 용량이 없을 때가 있습니다.
- **Google Cloud Run** — 월 200만 요청까지 무료. 0으로 축소되어 첫 요청이 느립니다(Java 콜드 스타트 수 초). 행사 당일만 `--min-instances=1`로 올리면 콜드 스타트가 사라지고, 이틀치 비용은 1달러 미만입니다.
- **Render Free** — 15분 미사용 시 잠들고 깨어나는 데 약 50초가 걸립니다. 512MB 메모리도 빠듯해 행사 당일 용도로는 권장하지 않습니다.

**권장 조합**: 평소에는 Cloud Run(0원), 행사 이틀만 `min-instances=1`로 전환.

### 배포 절차 요약

```bash
# 백엔드 JAR 빌드
cd backend && ./gradlew bootJar
```

```bash
# 프론트엔드는 Vercel에 저장소를 연결하면 자동 배포됩니다
```

배포 후 반드시 확인할 것:

1. Google OAuth 리디렉션 URI에 배포 도메인 추가
2. 백엔드 `CORS_ALLOWED_ORIGINS`에 프론트엔드 도메인 추가
3. 프론트엔드 `NEXT_PUBLIC_API_BASE_URL`을 백엔드 도메인으로 변경
4. `JPA_DDL_AUTO=update`로 최초 1회 기동해 테이블 생성 후, `validate`로 변경 권장

---

## 행사 당일 운영 순서

운영진 대시보드(`/admin`)에서 진행합니다.

1. **행사 전** — 마감 시각·팀 인원 설정, 교수 계정에 `PROFESSOR` 권한 부여
2. **제출 마감** — 별도 조작 불필요. 설정한 시각이 지나면 서버가 자동으로 잠급니다
3. **발표 종료 직후** — 해당 트랙의 **평가 열기**
4. **평가 종료** — **평가 닫기**
5. **집계 확인** — `집계` 탭에서 순위 확인 (참가자에게는 아직 비공개)
6. **시상식** — **결과 공개하기**를 눌러 `/results`를 개방
7. **행사 후** — `참가자 명단` / `제출 현황` / `최종 순위표` CSV 내보내기

---

## 구현된 규칙

기획서의 판정 규칙은 모두 **서버에서 최종 확정**됩니다. 프론트엔드는 같은 규칙으로 즉시 안내만 하고, 실제 차단·배정은 백엔드가 담당합니다.

### 트랙 자동 배정

`SelfCheck.java` / `track-rules.ts` — 두 구현이 128개 입력 조합 전부에서 일치하는 것을 확인했습니다.

- 즉시 Summit 사유(실무 경험 / 수상 이력 / 배포 서비스) 중 **하나라도** 해당 → Summit
- 아니면 체크리스트 4개 중 **3개 이상** → Summit, 그 외 Sprint
- Spark를 직접 고르면 자가진단과 무관하게 Spark 확정

### 제출

- 마감 판정은 **서버 시계**로만 합니다. 브라우저 시계를 조작해도 마감 후 제출은 거부됩니다
- 카운트다운은 서버 시각과의 차이를 보정해 표시합니다
- Spark 트랙에 소스코드·배포 링크가 들어오면 서버가 거부합니다 (기획서 2장의 코드 제출 금지)
- 트랙별 필수 항목은 `Submission.findMissingRequirements()`가 판정합니다

### 평가

부정 투표를 세 겹으로 막습니다.

1. `(평가자, 대상팀)` 유니크 제약으로 DB가 중복 행을 거부
2. 같은 평가자가 다시 제출하면 새 행 대신 기존 평가를 덮어씀
3. 자기 팀은 목록에서 제외되고 서버에서도 차단

학생 투표는 본인이 참가한 트랙 안에서만, 교수 평가는 Summit 트랙만 대상입니다.

### 점수 산식

항목 점수는 제출 시점에 100점 만점으로 정규화됩니다.

```
평가 총점 = Σ (항목 점수 / 항목 만점 × 항목 가중치) × 100
```

트랙별 최종 점수:

```
Spark  = 학생 투표 평균
Sprint = 학생 투표 평균
Summit = 교수 평가 평균 × 0.7 + 학생 투표 평균 × 0.3
```

> Summit에서 한쪽 평가가 아직 없으면, 없는 쪽의 가중치를 0으로 두는 대신 존재하는 평가만으로 재정규화합니다. 그렇지 않으면 교수 평가 전 학생 점수가 30%로 눌려 순위가 왜곡됩니다.

동점 팀은 같은 순위를 받고 다음 순위를 건너뜁니다 (1, 2, 2, 4).

---

## 테스트

```bash
cd backend && ./gradlew test
```

`SelfCheckTest` (트랙 배정 규칙, 경계값 포함), `EvaluationScoringTest` (가중 총점 정규화·재평가·반올림)를 포함합니다.

```bash
cd frontend && npm run type-check
```

---

## 아직 정해야 할 항목

기획서 9장의 미정 항목 중 코드에 반영이 필요한 것들입니다. 대부분 운영진 대시보드나 환경변수로 바꿀 수 있습니다.

| 항목 | 어디서 설정하나 |
|---|---|
| 해커톤 정식 명칭·테마 | `/admin` 또는 `DataSeeder` |
| 참가 신청 기간, 제출 마감 시각 | `/admin` |
| 팀 인원 상·하한 | `/admin` (현재 1~5명) |
| 트랙별 평가 항목·가중치 | `/admin` (기본값은 기획서 2장 기준으로 생성됨) |
| 교수·운영진 계정 | `/admin` 권한 탭 또는 `ADMIN_EMAILS`/`PROFESSOR_EMAILS` |
| 문의처 | `/admin` |
| 업로드 용량 제한 | `MAX_UPLOAD_MB` (현재 50MB) |
| 개인정보 처리방침 문구 | `frontend/src/app/privacy/page.tsx` — **학생회 검토 필요** |
| 시상 내역 | `/admin` 수상 등록 |

---

## API

모든 응답은 아래 형식입니다.

```json
{ "timestamp": 1788324017250, "data": { }, "message": "Success" }
```

실패 시 `errorCode`(`ISD###-4xx`)와 한국어 `message`가 담깁니다. 필드 검증 실패는 `data`에 필드별 상세가 배열로 들어갑니다.

| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| `GET` | `/api/v1/event` | 공개 | 행사 정보·마감·개방 상태 |
| `GET` | `/api/v1/event/criteria` | 공개 | 트랙별 평가 기준 |
| `POST` | `/api/v1/teams/self-check` | 공개 | 자가진단 결과 |
| `GET` | `/api/v1/results` | 공개 | 최종 순위 (공개 전 403) |
| `POST` | `/api/v1/auth/google` | 공개 | Google ID 토큰 → 자체 토큰 |
| `GET` | `/api/v1/auth/me` | 로그인 | 내 정보 |
| `PUT` | `/api/v1/auth/me/profile` | 로그인 | 학번·성명 등록 |
| `POST` | `/api/v1/teams` | 로그인 | 팀 등록 |
| `GET` | `/api/v1/teams/me` | 로그인 | 내 팀 |
| `PUT` | `/api/v1/submissions/me` | 조장 | 산출물 저장 |
| `POST` | `/api/v1/submissions/me/finalize` | 조장 | 최종 제출 확정 |
| `POST` | `/api/v1/submissions/me/files` | 조장 | 파일 업로드 |
| `GET` | `/api/v1/evaluations/targets` | 로그인 | 평가 대상 팀 |
| `POST` | `/api/v1/evaluations` | 로그인 | 학생 투표 |
| `POST` | `/api/v1/evaluations/professor` | 교수 | 교수 평가 |
| `GET` | `/api/v1/admin/dashboard` | 운영진 | 현황 요약 |
| `POST` | `/api/v1/admin/event/voting` | 운영진 | 평가 열기/닫기 |
| `POST` | `/api/v1/admin/event/publish` | 운영진 | 결과 공개 |
| `GET` | `/api/v1/admin/export/{kind}` | 운영진 | CSV 내보내기 |
