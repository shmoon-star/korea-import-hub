# CLAUDE.md — korea-import-hub

> 한국 수입 운영 데이터 허브. 외부 API(관세청 UNI-PASS, 사선사 트래킹 등)에서 데이터를 수집해 Supabase에 적재. SAP는 직접 호출하지 않고, 다른 시스템이 이 허브의 데이터를 일괄로 가져가서 SAP에 반영함.

## 1. 프로젝트 정의

이 앱은 **단방향 데이터 풀**:
```
   외부 API ──pull──▶ korea-import-hub ──store──▶ Supabase ──pull──▶ (다른 시스템) ──▶ SAP
   (UNI-PASS,                          (이 프로젝트의
    사선사,                              경계는 여기까지)
    ...)
```

**SAP 직접 연동은 이 앱의 스코프 밖.** CPI/RFC/VPC 같은 거 신경 안 씀.

## 2. 기술 스택

| 항목 | 내용 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| React | 19 |
| DB | Supabase (PostgreSQL) — 새 프로젝트 (mwms-lite와 분리) |
| Styling | Tailwind v4 |
| Excel | xlsx (벌크 업로드용) |

## 3. 주요 기능 (현재 상태)

### 구현됨 (mwms-lite에서 이식)
- **수입 통관 진행정보 조회** — 관세청 UNI-PASS API001 (`retrieveCargCsclPrgsInfo`)
  - 즉시 조회 (DB 저장 없음)
  - Watchlist 등록 → 주기 갱신 → 상태 변화 스냅샷 적재
  - xlsx/csv 벌크 등록, 전체 CSV export
  - UI: `/customs`

### 추후 추가 예정
- 사선사 트래킹 (선사/포워더 API 또는 스크래핑)
- 자동 갱신 cron (3시간 주기) — Vercel Pro 또는 외부 스케줄러
- SAP가 가져갈 read API 정의 (예: `GET /api/export/customs-watch?since=...`)

## 4. 디렉토리 구조

```
src/
├── app/
│   ├── customs/page.tsx            # UNI-PASS 통관 추적 UI
│   ├── api/customs/                # UNI-PASS 호출 + watchlist CRUD
│   │   ├── import-progress/        # 즉시 조회 (DB 저장 X)
│   │   └── watch/                  # 등록/조회/갱신/이력/벌크/export
│   └── page.tsx                    # 랜딩
└── lib/
    ├── unipass.ts                  # UNI-PASS API 공용 유틸
    ├── normalize-headers.ts        # xlsx 헤더 \r\n 정규화
    └── supabase/admin.ts           # service role client (서버 전용)

supabase/migrations/
├── customs_watch.sql               # 1차: 테이블 + 인덱스 + 트리거
└── customs_watch_add_cargo_info.sql # 2차: cargo_info jsonb 컬럼 추가
```

## 5. 환경변수

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | service role (서버 전용) |
| `UNIPASS_API_KEY` | 관세청 UNI-PASS OpenAPI 키 (`crkyCn` 파라미터) |

`.env.local.example` 참고.

## 6. 초기 셋업 (한 번만)

1. **Supabase 새 프로젝트 생성** (supabase.com)
2. SQL Editor에서 `supabase/migrations/customs_watch.sql` 실행
3. SQL Editor에서 `supabase/migrations/customs_watch_add_cargo_info.sql` 실행
4. Project Settings → API → URL/anon/service_role 복사 → `.env.local`
5. UNI-PASS API 키 (`UNIPASS_API_KEY`) 입력
6. `npm run dev` → http://localhost:3000/customs

## 7. 작업 시 규칙

- **SAP 호출 코드 작성 금지** — 이 앱의 스코프 밖
- **데이터는 Supabase에만 쌓기** — 다른 시스템(ERP/SCM Hub 등)으로 직접 push X
- **mwms-lite와 DB 공유 X** — 의도적으로 분리됨
- API 응답은 `{ ok, data, error? }` 통일
- snapshot 테이블이 곧 이력 (별도 ledger 없음)
