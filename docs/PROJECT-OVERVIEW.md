# Korea Import Hub — 프로젝트 기획·개발 개요

> 무신사 수입 운영 데이터를 외부 5개 채널에서 모아 사내 SCM Hub로 보내는 통합 미들웨어.
> 실무자에게는 화물 흐름을, 전산에는 SAP 송신용 정제 데이터를 동시에 제공.

**Repo**: `shmoon-star/korea-import-hub` · **Live**: https://korea-import-hub.vercel.app
**Stack**: Next.js 16 · TypeScript · Supabase · Vercel · ExcelJS

---

## 1. 배경 / 왜 이 시스템을 만들었나

### 1-1. 수입 운영 데이터의 파편화

무신사의 수입 운영은 다음과 같이 **여러 외부 시스템에 데이터가 흩어져** 있다:

| 데이터 소스 | 들고 있는 정보 | 문제 |
|---|---|---|
| 관세청 UNI-PASS | 입항 / 통관 진행 / 반출완료 | 입항 후 시점만, 사후성 |
| SeaVantage Cargo Insight | 선박 위치 / POL/POD 일정 / 환적 | 입항 전까지만 유효 |
| ReadyKorea xTrade | 관세사 신고 가격 / 세액 / HS code | 라인 단위 디테일이 핵심 가치 |
| E2E Logistics PO PF | 100+ 공급사 CRD / 수량 / Booking / 문서 | 이메일 기반 수동 전달 위주 |
| 사내 SCM Hub | PO / WMS / 재고 / SAP 송신 | 사내망 (OCMP) — 외부 채널과 직접 연결 안 됨 |

→ **한 화물의 진짜 상태**(어디 있고, 언제 도착하고, 얼마인지)를 알려면 **사람이 5개 시스템을 열어 맞춰봐야** 했다.

### 1-2. 시스템적 제약

- **SAP MM 미사용** (전사 결정) → MM 표준 매입 추적 불가
- **해외법인은 SAP 자체 부재** (일본/대만/베트남 등)
- **SCM Hub는 사내망 전용** → 외부 인터넷 채널이 직접 송신 불가
- **PLM PO**는 합의 단계 미확정 (무탠 일부 케이스만)

→ 어떤 식으로든 **외부 인터넷에 떠 있는 hub가 사내망 SCM Hub와의 다리**를 놓아야 한다.

### 1-3. 두 사용자, 두 화면

같은 데이터에 두 종류의 소비자가 있다:

| 소비자 | 필요 | 화면 |
|---|---|---|
| **실무자** | "내 PO 어디까지 왔어?" | 통합 타임라인 (수입 화물 흐름도) |
| **전산** | "SAP에 보낼 정제 데이터" | 송신 큐 (데이터 모음) |

같은 source 데이터를 두 다른 view로 — 이 hub의 핵심 가치 명제.

---

## 2. 시스템 포지셔닝

### 2-1. 한 줄 정의

> **Korea Import Hub** = 외부 채널 데이터 수집 + 통합 가시화 + 사내 SCM Hub 송신 자동화 미들웨어.
> SAP에 직접 push하지 **않음**. 사내 SCM Hub까지가 우리 책임 종착지.

### 2-2. 비-목적 (이걸로 안 한다)

- ❌ ERP 대체 — SAP 자체를 쓰지 않음
- ❌ WMS 실행 — 입출고는 mwms-lite/SCM Hub
- ❌ Finance / 원가회계 가공 — SAP 단 + 시스템 개발사 책임
- ❌ PO 발행 — SCM Hub PO가 단일 진실
- ❌ 직접 SAP 송신 — VPC peering 부재 + 사내망 격리

---

## 3. 아키텍처 (전체 데이터 흐름)

```
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL CHANNELS (공용 인터넷, 외부 SaaS)                 │
│                                                             │
│  ① UNI-PASS          (관세청 OpenAPI · 사후 통관)            │
│  ② SeaVantage        (Cargo Insight · 선박 트래킹)           │
│  ③ ReadyKorea        (xTrade · 관세사 신고가격 라인별)       │
│  ④ E2E Forwarder PF  (CRD/Booking/문서)                     │
│  ⑤ Air Freight       (TBD)                                  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS pull (cron 폴링) / push
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  KOREA IMPORT HUB (Vercel · 공용 인터넷)                    │
│  - 외부 채널 어댑터 (lib/unipass.ts, lib/seavantage.ts ...)  │
│  - Watchlist / Snapshot 패턴 (변화 감지 시에만 적재)         │
│  - 통합 가시화 (수입 화물 흐름도 — 10단계)                   │
│  - 정제 데이터 큐 (데이터 모음)                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  SUPABASE (PostgreSQL · 이 hub의 DB)                        │
│  - customs_watch / seavantage_watch / 향후 readykorea_*      │
│  - *_snapshot (상태 변화 이력)                               │
│  - data_mart_send_queue (TBD)                               │
└──────────────────────────┬──────────────────────────────────┘
                           │ pull (사내 SCM Hub) 또는 push
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  사내 SCM Hub (OCMP AWS · 사내망)                            │
│  - SCM Hub PO (단일 진실 source · 2026년 단일화 목표)        │
│  - WMS 입출고 / 재고 통합                                    │
│  - 우리 hub 데이터 수신                                      │
└──────────────────────────┬──────────────────────────────────┘
                           │ start-point quantity 등 핵심
                           ▼
                       SAP CPI ──▶ SAP
                                    └─ Finance · 원가 회계
                                       (SAP 단 + 시스템 개발사 책임)
```

**핵심**: 우리 hub는 **사내망에 들어가지 않는다.** Vercel 공용 인터넷에서 동작하고, 사내 SCM Hub와 데이터를 주고받는 형태(API or 파일)로 연결.

---

## 4. 사이드바 구조 (실무 흐름 순)

```
┌─ Korea Import Hub (사이드바 240px 고정) ────┐
│                                              │
│  EXTERNAL CHANNELS (흐름 순)                 │
│  ├ SCM Hub               (PO 출발점, TBD)    │
│  ├ Forwarder             (E2E PF, TBD)       │
│  ├ Shipment Tracking     (SeaVantage, 50 carriers) │
│  ├ Air Freight           (TBD)               │
│  ├ ReadyKorea 통관        (xTrade, TBD)       │
│  └ Customs Tracking      (UNI-PASS, ✅ 동작)  │
│                                              │
│  ╔══════════════════════════════════════╗   │
│  ║ ★ 실무 확인용 (표면적 메인)           ║   │
│  ║ → 수입 화물 흐름도 (10단계 통합)      ║   │
│  ╚══════════════════════════════════════╝   │
│                                              │
│  ╔══════════════════════════════════════╗   │
│  ║ ★ 데이터 모음 (숨은 메인)             ║   │
│  ║ → SCM Hub 송신용 정제 (TBD)           ║   │
│  ╚══════════════════════════════════════╝   │
│                                              │
│  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄    │
│                                              │
│  ERP — TBD                          (dim)    │
│  └ SAP                                       │
│                                              │
│  Overseas · 해외지사 — TBD          (dim)    │
│  └ 해외지사 화물 흐름도                      │
└──────────────────────────────────────────────┘
```

**디자인 원칙**:
- **흐름 순서대로** 배치 (PO 발행 → Forwarder → 운송 → 통관)
- **별 표시(★)** = 메인 채널 (실무·전산 두 입구)
- **dim 처리** = TBD 그룹 (불확실한 영역 시각적 분리)
- **사이드바 고정** = 어느 페이지에서나 같은 메뉴, 빠른 이동

---

## 5. 핵심 화면 — 수입 화물 흐름도 (10단계)

실무자 메인 화면. 한 PO/BL의 단계별 진행을 외부 채널 5개 + WMS 데이터로 통합 표시.

| # | 단계 | 출처 | 우리 시스템 |
|---|---|---|---|
| 1 | PO 발행 | SCM Hub PO | `/tools/scm-hub` (TBD) |
| 2 | PO 전달 (SCM Hub → Forwarder) | SCM Hub → Forwarder | (hand-off) |
| 3 | CRD 입력 | Forwarder (E2E) | `/tools/forwarder` (TBD) |
| 4 | Booking 확정 | Forwarder (E2E) | `/tools/forwarder` (TBD) |
| 5 | 출항 (Loaded) | SeaVantage | `/tools/shipment-tracking` |
| 6 | 운송 중 | SeaVantage | `/tools/shipment-tracking` |
| 7 | 입항 | SeaVantage + UNI-PASS | both |
| 8 | 수입신고 / 통관 | ReadyKorea + UNI-PASS | `/tools/readykorea-customs` (TBD) + UNI-PASS |
| 9 | 통관완료 / 반출 | UNI-PASS | `/tools/customs-tracking` ✅ |
| 10 | 입고 완료 | WMS / SCM Hub | `/tools/scm-hub` (TBD) |

**UI**: 가로 stepper + 단계 클릭 시 상세 데이터 패널. 각 단계는 출처별 색상 배지(SCM Hub=amber, Forwarder=blue, SeaVantage=green, UNI-PASS=pink, WMS=indigo).

---

## 6. 데이터 모음 (전산 송신용)

같은 source 데이터를 SCM Hub 송신용으로 정제.

### 6-1. 두 카테고리

**① 운영 데이터 — PO 진행/상태**
- PO 식별 (PO#/SKU#/Color/Size)
- CRD (Cargo Ready Date / 수량 / CBM / 중량)
- Booking (Vessel/POL/POD/ETD/ETA)
- BL (MBL / HBL / Carrier)
- 통관 진행 (UNI-PASS) / 관세사 진행 (ReadyKorea)
- 문서 (INV/PKG/Export Decl)

**② 원가 / Finance 데이터** (SAP 파이낸스 직결)
- 운임 (BL 단위, Container 분배, 거래조건별 — Forwarder)
  - 해상운임 / BAF / CAF / EBS / LSS / CFS / THC / 부대비
- 신고가격 + 세액 (PO/SKU 라인별 — ReadyKorea)
  - 단가 / 수량 / USD / 환율 / KRW
  - 관세 / 부가세 / 기타
  - HS code / FTA 협정세율
- 원가 매칭 검증 (공급사 INV vs Forwarder INV)

→ 두 카테고리 합쳐서 SCM Hub로 송신 → SAP에서 부킹 + 원가회계 반영.

### 6-2. 송신 큐 (TBD)

| 상태 | 의미 |
|---|---|
| pending | 수집 됐지만 누락 필드 있음 |
| ready | 필드 다 채워짐, 다음 송신 사이클 |
| sent | SCM Hub 송신 완료 (ack 미수신) |
| acked | SCM Hub가 정상 적재 ack |
| failed | 송신/적재 실패 + 에러 reason |

---

## 7. 해외지사 — 현실 반영

**핵심 메시지**: 해외지사용으로는 **PO 통합이 아니라 화물·운임 가시성 + 정산 자료**가 현실적 목표.

### 7-1. 운영 컨텍스트

- 무신사 협력 벤더 80+, 공장 100+ — 직접 컨트롤 불가
- 중국·JV는 자체 관리, 소규모 해외지사(일본/대만/베트남)는 **무역조직(한국)이 생산지 관리 대신**
- FOB 거래 + 베트남 콘솔리데이션 + **삼국거래** (한국↔일본/대만 결제)

### 7-2. 삼국거래 파이낸스 메커니즘

```
공장 ──FOB 직배송 (한국 미경유)──▶ 일본/대만 무신사 → 판매

가격 = 원가 + 마크업 + 로열티 + 운임/부대비

장점:
  ⚡ 스피드 (한국 미경유 → 빠른 회전)
  💰 관세 메리트 (통관 중복 회피)
  🛡️ 위험 헤징 (마크업·로열티 분배)
  📦 재고 압력 감소
```

### 7-3. 소싱·무역팀 역할 분담 (Ex-Factory 기준)

| 단계 | 책임 주체 | 역할 |
|---|---|---|
| Ex-Factory 이전 | **소싱** | 라벨링/부자재/패키징, 공동납기 조율, 완성품까지 책임 (무탠 글로벌 관리) |
| Ex-Factory 이후 | **무역팀** | 콘솔리데이터+Forwarder+선사 협업, FOB 컨테이너화, 운임 정산, 판매계획 반영 |

### 7-4. Single-Shipper 컨테이너 구조의 가치

| 일반 Multi-Shipper | 무신사 Single-Shipper |
|---|---|
| 컨테이너 안 수십 벤더사 섞임 | 화물 단일 화주(무신사 한국)로 묶임 |
| 벤더별 페이먼트·통관 N회 | 페이먼트 1회·통관 1회 (한국↔일본/대만) |
| 분쟁·지연 영향 분산 | 책임 단일·FCL 효율 극대화 |

### 7-5. 시스템 한계

- SAP MM 전사 미사용 + 해외법인 SAP 부재
- PLM PO 가정 단계 (무탠 일부만)
- PLM PO ≠ SAP MM (매입 추적/원가 회계 기능 부재)
- 일본/대만 SAP 미사용 → 매입 전산화 경로 없음

### 7-6. PO 관리 결정 포인트 (선결 과제)

| 옵션 | 판정 | 비고 |
|---|---|---|
| A. SAP | ❌ 현실적 X | 해외법인 SAP 부재 + 전사 MM 미사용 |
| B. PLM | ⚠️ 부분 가능 | 무탠 일부, SAP MM 대체 불가 |
| C. SCM Hub | 🟡 검토 가능 | 현재 국내 한정, 자연스러운 데이터 흐름 |
| D. 해외지사 자체 ERP | 🟢 분권 가능 | 회계·삼국거래 자연 처리, 통합성 부족 |

→ 결정 전엔 **Forwarder Booking을 임시 키**로 사용해 진행 가능.

---

## 8. 외부 채널별 연동 상태

| 채널 | 상태 | 다음 액션 | 막힘 사유 |
|---|---|---|---|
| **UNI-PASS** | ✅ 동작 중 | 데이터 쌓이는 중 | — |
| **SeaVantage** | 🔴 403 권한 막힘 | 허소정 책임 회신 대기 | 계정 권한/IP 화이트리스트 추정 |
| **ReadyKorea** | ❓ 영업 컨택 전 | RKO-Registration@wisetechglobal.com 메일 | 공개 페이지에 API 사양 미공개 |
| **Forwarder (E2E)** | ❓ 사양 미확보 | E2E 담당자 회신 (체크리스트 11개) | API 형태 미공개 (PDF는 UI 가이드뿐) |
| **Air Freight** | ❓ 데이터 소스 미정 | 항공 비중·캐리어·AWB 입수 시점 결정 | 후보 5개 (FlightAware/Cargo iQ/항공사/Forwarder/SaaS) |
| **SCM Hub** | ❓ 사내 협의 전 | endpoint·인증·SHIF 시트 확보 | 사내 사양 |

→ 페이지(`/tools/<channel>`)마다 받아야 할 체크리스트 박혀있음. 메일 작성 시 그대로 복사 가능.

---

## 9. 벤더 통합 전략 — All-in-One 어그리게이터 vs 직접 연동

### 9-1. 배경 — E2E 미팅 (2026-05-08)

E2E (Consolidator + Forwarder, PDF로 분석한 그 회사)와의 미팅에서 확인:

- E2E 시스템 안에 **이미 ReadyKorea / SeaVantage / UNI-PASS 데이터가 통합 표시**되어 있음
- SeaVantage 데이터의 정확도, 선사 자동제공 데이터의 부정확함을 **E2E가 직접 사람 손으로 보정** 중 ("한 땀 한 땀" 데이터 엔트리)
- 그 결과 E2E 솔루션 안에서 **모든 정보를 한 곳에서 볼 수 있는 상황**이 된 상태

E2E의 제안:

> **"PO만 우리(E2E)에게 주면, 모든 데이터 핸들링을 우리가 처리해서 정제된 자료를 너희에게 보내주겠다 — E2E의 운임 자료까지 포함해서"**

### 9-2. 문제 — 디펜던시 락인

이 제안을 그대로 받아들이면:

- ⛓️ E2E의 시스템·계약·가격 정책에 영영 끌려간다
- 🔒 다른 포워더로 전환하기 어려워짐 (데이터 마이그레이션 비용 폭증)
- ❓ 데이터 소유권/접근권이 모호해짐
- ⚠️ E2E가 ReadyKorea·SeaVantage와의 관계를 변경하면 우리도 영향

→ **단기 편의 ↔ 장기 자유**의 트레이드오프. **이 hub 프로젝트의 존재 이유 자체와 모순**.

### 9-3. 한편, 우리도 모든 API 직접 관리는 비현실적

- 외부 채널 API 개수: **5개 + 향후 추가** (ReadyKorea/SeaVantage/UNI-PASS/E2E/Air + α)
- 각 API마다 별도 인증·rate limit·schema 변경·SLA·문서화 부담
- API들이 수시로 업데이트되는데 모두 따라가는 게 테크 팀의 일이 아님

→ **100% 직접 관리도 답이 아님.** 어느 정도의 외부 위탁이 필요.

### 9-4. 답 — All-in-One 어그리게이터 전략

**컨셉**: 외부 API들을 모두 받아 정제 데이터를 우리한테 주는 **포워더-중립적 어그리게이터 솔루션 업체**를 찾거나 우리가 만든다.

```
✗ E2E 종속 모델 (위험):
   ReadyKorea ──┐
   SeaVantage ──┼──▶  E2E  ──▶  우리
   UNI-PASS  ──┘   (단일 의존)

✓ 어그리게이터 모델 (목표):
   ReadyKorea ──┐
   SeaVantage ──┤
   UNI-PASS  ──┼──▶  Aggregator  ──▶  우리
   E2E       ──┤    (포워더 중립)
   향후 포워더 ─┘
```

**솔루션 업체 선정 기준** (5개):

1. **포워더 중립** — 특정 포워더에 묶이지 않음
2. **데이터 소유권 우리** — export·migration 가능, vendor lock-in 회피
3. **확장성** — 다음 포워더가 같은 시스템에 plug-in 가능
4. **API 관리 부담 흡수** — 외부 API 변경 대응을 솔루션 업체가 책임
5. **(선택) 자체 구축 옵션 가용** — 솔루션이 없으면 우리가 만든다

**E2E와의 관계 재정의**:

- E2E = **포워더 역할로만** 사용 (CRD/Booking/문서)
- E2E가 제공하는 **통합 솔루션 부분은 사용하지 않음**
- E2E 외 다른 포워더도 같은 어그리게이터에 plug-in 가능해야 함

### 9-5. 현재 hub 프로젝트의 위치 — 사실상 자체 어그리게이터의 1단계

지금 이 시스템은:

| 선정 기준 | 현재 상태 |
|---|---|
| ① 포워더 중립 | ✅ 특정 포워더 의존 X |
| ② 데이터 소유권 | ✅ Supabase에 우리 보관 |
| ③ 확장성 | ✅ 새 채널 추가 패턴 (4-layer) 정립 |
| ④ API 관리 부담 | ⚠️ 우리가 부담 중 (테크) |
| ⑤ 자체 구축 옵션 | ✅ 진행 중 |

→ ④ 부담을 줄이는 게 핵심 과제.

### 9-6. 향후 두 갈래 옵션

**옵션 A — 외부 어그리게이터 솔루션 발견**
- 시장에 좋은 후보가 나오면 그 솔루션 위에 우리 hub를 얇게 얹는다
- 예: 외부 API 변경 대응을 솔루션 업체에 맡기고, 우리는 비즈니스 로직만

**옵션 B — 자체 어그리게이터로 키움**
- 이 hub를 그대로 키워서 다른 포워더·법인도 합류 가능한 플랫폼으로
- 무신사 안에서만 쓰지 말고 SaaS 가능성도 열어둠 (장기)

→ 지금은 **B 방향**으로 진행 중. 시장에 더 좋은 A 솔루션이 나타나면 전환 검토.

### 9-7. 한계 — 어그리게이터를 우리가 직접 하는 것의 부담

직접 어그리게이터 모델을 끝까지 끌고 가면:

- 🔧 **데이터 보정 부담** — SeaVantage 같은 외부 데이터의 정확도가 떨어지면 우리가 한 땀 한 땀 보정해야 함 (E2E가 지금 하고 있는 그 일)
- 📤 **PO 분산 부담** — Forwarder/SeaVantage/ReadyKorea 등 모든 외부 시스템에 PO 정보를 따로따로 줘야 함 (각 시스템이 PO를 알아야 트래킹 가능)

→ 우리가 모든 채널에 PO 입력 + 모든 채널의 데이터 품질을 책임지는 건 **장기적으로 무리**.

### 9-8. 답 — PO Gateway 모델 (전략 정제)

핵심 통찰: **우리는 PO 발급의 출처**다 (SCM Hub PO). 그렇다면 PO를 한 곳에서 발급하고 **여러 외부가 가져갈 수 있는 Gateway만 운영**하면 된다. 데이터 통합·보정은 그걸 가져간 외부에 맡긴다.

```
┌─────────────────────┐
│   우리 hub          │
│  ┌───────────────┐  │
│  │ PO Gateway API │  │  ← open (Forwarder/선사가 pull)
│  └───────┬───────┘  │
└──────────┼──────────┘
           │ PO 발급
           ▼
┌─────────────────────────────────────┐
│  Forwarder A / 선사 B / 솔루션 C    │
│  - 자기 시스템 안에서                │
│    ReadyKorea + SeaVantage +        │
│    UNI-PASS 등 통합·보정 책임       │
└──────────┬──────────────────────────┘
           │ 정제된 결과 push (또는 우리가 pull)
           ▼
┌─────────────────────┐
│   우리 hub          │
│  - DB 적재          │
│  - 두 패널로 노출    │
└─────────────────────┘
```

### 9-9. 협상 레버리지 — 물량 전략

이 Gateway 모델이 작동하려면 외부 Forwarder/선사가 "이거 받아갈 만하다"고 판단해야 함. 그 도구가 **물량**:

- **우리는 무신사 수입 물량의 출처** — 협상 카드
- **통합 솔루션 갖춘 Forwarder/선사**에게 물량을 몰아주는 전략
- 그들 입장: 솔루션 + 우리 물량 = 안정적 수익. 가져갈 동기 충분
- 우리 입장: 한 번 통합된 데이터만 받으면 됨 (락인 회피는 PO Gateway 표준화로)

→ "우리 PO Gateway → 어떤 Forwarder/선사가 가져갈 수 있는가" 이걸 시장에 묻는 RFI/RFP가 다음 단계.

### 9-10. 테크의 결정 포인트

지금 우리는 두 길의 갈림길:

| 옵션 | 의미 | 부담 |
|---|---|---|
| **직접 연동 유지** | 우리가 ReadyKorea/SeaVantage/UNI-PASS API 직접 호출·보정 | 데이터 품질 우리가 책임 |
| **외부 통합 받기** | PO Gateway만 운영, 통합·보정은 외부 위탁 (E2E 링크 모델 변형) | 외부 솔루션 의존 + 표준 인터페이스 설계 부담 |

**테크가 결정하면**: 그 결정에 따라 hub 구조 변경.
- 결정 전엔 **양쪽 다 가능한 형태**로 진행 (현재 hub는 외부 API 직접 호출하지만, PO Gateway 추가는 호환됨)
- E2E의 링크 모델로 가는 것도 **전략적으로 나쁘지 않음** — 단 PO Gateway 표준 인터페이스로만 받는다는 조건

### 9-11. 최종 모습 — 두 패널만 노출

이 hub의 사용자 노출 화면을 단순화:

```
┌─ 우리 hub ─────────────────────────┐
│                                     │
│  ① SAP 전송 패널 (전산용)           │
│     - 자동 송신 큐                  │
│     - 매핑/누락/실패 알림           │
│     - 사람이 매일 보지 않음          │
│                                     │
│  ② 모니터링 패널 (실무자용)         │
│     - 수입 화물 흐름도              │
│     - 통합 타임라인 (10단계)         │
│     - 사람이 매일 보는 화면          │
│                                     │
└─────────────────────────────────────┘

  (drill-down 시 원천 소스 페이지로)
       ↓
┌─ ReadyKorea / SeaVantage / UNI-PASS / Forwarder ─┐
│  (서브 메뉴 — 깊이 들어가는 사람만)              │
└────────────────────────────────────────────────────┘
```

→ 메인 = **두 패널만**. 외부 채널 페이지들은 drill-down용 서브.
   사이드바 재구성 가능 (★ 메인 두 개를 위로, External Channels를 아래로).

### 9-12. 다음 액션 (refined)

- [ ] **PO Gateway API 설계** — 표준 인터페이스 (스키마/인증/푸시-풀 옵션)
- [ ] All-in-One 솔루션 업체 시장 조사 + RFI/RFP (Gateway 표준 받을 수 있는 vendor)
- [ ] E2E와의 파트너십 = **포워더 역할 + Gateway 데이터 수신자**로 명문화
- [ ] 두 패널 화면 강화 — SAP 전송 패널은 아직 placeholder (TBD)
- [ ] 사이드바 재구성 검토 — 두 패널을 위로, 외부 채널을 drill-down 서브로 강등
- [ ] 자체 hub의 어그리게이터 기능 강화 (테크가 직접 연동 유지 결정 시)

### 9-13. Tech의 결정 — 두 길

이 시점에서 결정해야 할 것은 단 하나, **테크가 어디까지 책임지나**:

**길 A. 직접 어그리게이터**
- 통관 / 선사 / 포워더 등 **여러 웹 소스의 자료를 우리 테크가 모두 모음**
- 외부 API 변경·정확도·보정 모두 우리가 책임
- 자유도는 최대, 부담도 최대

**길 B. 솔루션 프로바이더 겸 포워더 활용**
- 대표 포워더(또는 솔루션 업체)가 **영구 connection으로 PO를 받아가** 정보를 채워옴
- ReadyKorea/SeaVantage 등의 역할을 그 한 곳에서 통합 처리
- 우리는 그 결과를 받기만 함

**락인 우려는 과장된 것 같다** — 결정적 단서:

> **PO만 우리가 가지고 있으면**, 통관(ReadyKorea)·선사(SeaVantage) 등의 역할은
> 우리도 내부에서 충분히 대체·재구현 가능하다.
> 즉 **PO 보유** = 협상 우위 + 비상 시 복원 능력 = lock-in 회피.

→ 따라서 길 B를 선택해도 lock-in은 진짜 문제가 아님. 단순화의 가치가 더 큼.

### 9-14. "두 줄"의 단순화 — Hub의 진짜 기능

위 결정의 결과로 hub의 역할은 **두 줄(line)로 충분**:

```
┌─────────────────────────────────────────────────────────┐
│  ① SAP 전송용 자료                                       │
│     - SAP 측에서 필드/로직 정의 (이번 프로젝트)          │
│     - 그 정의대로 우리는 정제만 해서 보내주기           │
│     - 파이낸스로 들어가야 할 정보 한정 (전부 X)         │
│                                                          │
│  ② 모니터링 화면                                         │
│     - 실무자 위주 — 수입 화물 흐름                       │
│     - DB를 꾸며서 화면 노출                             │
│     - 외부 솔루션이 보내준 자료 그대로 활용             │
└─────────────────────────────────────────────────────────┘

Hub의 책임:
  - 두 출력 사이의 연관성 검증 (테이블 간 일치)
  - SAP 보낼 것 / 사람이 볼 것의 매핑
```

→ **너무 복잡하게 가지 않아도 됨.** Hub는 "정제 + 노출" 두 줄로 끝.

### 9-15. Forwarder의 진짜 역할 — Consolidator (데이터 책임의 위치)

또 다른 결정적 통찰:

- Forwarder는 운임/Booking을 다루지만 **콘솔리데이터 역할이 더 큼**
- 콘솔리데이터 = 100+ 공장에서 화물을 모으고, 그 과정의 모든 데이터를 들고 있음
- 따라서 **데이터의 책임 자체가 콘솔리데이터(=우리에게 데이터를 주는 쪽)에게 있다**
- 우리는 그 데이터를 **지금 바로 써야 하는** 사용자

**함의**:
- 데이터 정확도/보정은 콘솔리데이터의 책임 영역
- 우리가 한 땀 한 땀 보정하는 게 아니라, 콘솔리데이터에 책임 묻기
- 그 책임을 못 질 콘솔리데이터는 우리 물량을 받을 자격이 없음 (= 협상 카드)

→ §9-9의 물량 전략과 직결: **데이터 책임 + 통합 능력 둘 다 갖춘 콘솔리데이터/Forwarder에 물량 배분**.

---

## 10. 기술 구조

### 10-1. 디렉토리

```
src/
├── app/
│   ├── (app)/                      # 사이드바 레이아웃
│   │   ├── layout.tsx              # 사이드바 + main (margin 240)
│   │   ├── tools/
│   │   │   ├── scm-hub/            (placeholder)
│   │   │   ├── forwarder/          (placeholder)
│   │   │   ├── shipment-tracking/  (✅ 50 carriers)
│   │   │   ├── airplane-tracking/  (placeholder)
│   │   │   ├── readykorea-customs/ (placeholder)
│   │   │   ├── customs-tracking/   (✅ UNI-PASS 동작)
│   │   │   └── sap/                (placeholder)
│   │   ├── cargo-flow/             # 수입 화물 흐름도 (10단계 stepper)
│   │   ├── data-mart/              # 데이터 모음 (placeholder)
│   │   └── overseas-flow/          # 해외지사 (배경+한계+결정)
│   ├── api/
│   │   ├── customs/                # ✅ UNI-PASS Watchlist 풀스택
│   │   └── seavantage/             # ✅ Cargo Insight Watchlist 풀스택 (권한 대기)
│   ├── layout.tsx                  # 루트 (Geist 폰트)
│   └── page.tsx                    # → /tools/customs-tracking 리다이렉트
├── components/
│   ├── Sidebar.tsx                 # ✅ 5 그룹, fixed, dim/highlight
│   ├── CargoDetail.tsx             # ✅ SeaVantage 응답 구조화
│   └── CustomsDetail.tsx           # ✅ UNI-PASS cargo_info 구조화
├── lib/
│   ├── unipass.ts                  # ✅ UNI-PASS API client
│   ├── seavantage.ts               # ✅ Cargo Insight API client
│   └── supabase/                   # client / server / admin
└── ...

supabase/migrations/
├── customs_watch.sql               # ✅ 적용됨
├── customs_watch_add_cargo_info.sql# ✅ 적용됨
└── seavantage_watch.sql            # ⏳ Supabase에 실행 필요 (사용자)
```

### 10-2. 패턴 (재사용 templates)

각 외부 채널은 동일한 4-layer 패턴을 따른다:

```
DB (supabase/migrations/<channel>_watch.sql)
  └─ <channel>_watch (등록된 화물)
  └─ <channel>_watch_snapshot (변화 이력)

lib (src/lib/<channel>.ts)
  └─ create / search / delete / diff 함수
  └─ HTTP Auth / 환경변수 처리

API (src/app/api/<channel>/...)
  └─ /watch GET (목록) POST (등록 + 외부 API 호출)
  └─ /watch/[id] PATCH/DELETE
  └─ /watch/[id]/refresh (단건 갱신)
  └─ /watch/[id]/history (스냅샷 타임라인)
  └─ /watch/refresh-all (cron 대상)

UI (src/app/(app)/tools/<channel>/page.tsx)
  └─ 즉시조회 + Watchlist 등록/갱신/이력
  └─ <ChannelDetail> 컴포넌트로 구조화 표시
```

→ ReadyKorea / Forwarder도 같은 패턴으로 30분 내 스캐폴딩 가능. SeaVantage는 이미 풀스택 완성.

### 10-3. 환경변수

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# UNI-PASS
UNIPASS_API_KEY            # mwms-lite와 동일 키 재사용

# SeaVantage Cargo Insight
SEAVANTAGE_API_USER        # Basic Auth user
SEAVANTAGE_API_PASS        # Basic Auth pass
SEAVANTAGE_API_BASE        # 기본값 https://insight.seavantage.com/api

APP_BASE_URL               # 이메일 링크용 (추후)
```

---

## 11. 다음 단계 (우선순위)

### Phase 1 — 외부 채널 답변 받기 (현재)

- [ ] SeaVantage 403 권한 해결 → 50 carriers 본격 가동
- [ ] ReadyKorea 영업/기술 회신 (체크리스트 11개)
- [ ] E2E Forwarder API 사양 받기
- [ ] SCM Hub 측 endpoint·인증·SHIF 시트 확보

### Phase 2 — 풀 연동 구현 (사양 받은 채널부터)

- [ ] ReadyKorea Watchlist 풀스택 (UNI-PASS 패턴 복제)
- [ ] Forwarder PO/CRD/Booking 연동 + 문서 binary
- [ ] SCM Hub PO 매핑 (국내) — 우리 데이터 키 일치
- [ ] 수입 화물 흐름도 — mock 데이터 → 실제 데이터 활성화

### Phase 3 — 데이터 모음 (송신 큐)

- [ ] data_mart_send_queue 테이블 설계
- [ ] 운영 / 원가 두 카테고리 매핑 spec
- [ ] cron route — SCM Hub push 또는 pull 대응
- [ ] 매핑 누락/실패 알림 UI

### Phase 4 — 확장

- [ ] Air Freight 데이터 소스 결정 + 연동
- [ ] 해외지사 — Forwarder Booking 임시 키로 시작
- [ ] PLM PO 합의 진행 시 키 매핑 추가
- [ ] 통합 알림 (단계 지연 / 매핑 누락 / 송신 실패)

---

## 12. 의사결정 이력 (큰 줄거리)

| 시점 | 결정 | 근거 |
|---|---|---|
| 초기 | mwms-lite와 분리된 새 프로젝트 | 통관 데이터 join 불필요 + 독립 SaaS 가능성 |
| 초기 | Vercel 배포 (사내망 X) | VPC peering 부재. 사내 SCM Hub와는 API로 연결 |
| 초기 | 새 Supabase (mwms-lite와 분리) | 조인 안 함, 독립성 확보 |
| 채널 결정 | UNI-PASS는 즉시 동작 (mwms-lite 코드 이식) | 검증 완료된 자산 재활용 |
| 채널 결정 | SeaVantage Basic Auth · Vercel icn1 region | 한국 정부 API 호환 + 외부 인터넷 가능 |
| 종착지 | SAP 직접 X / SCM Hub까지만 | 사내망 격리 + SCM Hub PO 단일화 정책 |
| 사이드바 | 흐름 순 + ★ 메인 2개 + dim TBD | 실무 + 전산 동시 입구, 불확실 영역 분리 |
| 흐름도 | 10단계 가로 stepper | 정보 과다 해소 + 클릭 인터랙션 |
| 해외지사 | "PO 통합" 포기, "화물·운임 가시화"에 집중 | SAP/PLM 가정 미확정의 현실 직시 |
| 2026-05-08 (E2E 미팅 후) | E2E의 통합 솔루션 제안 거절 / 포워더 역할로만 사용 | 디펜던시 락인 회피. All-in-One 어그리게이터를 별도로 모색 |
| 2026-05-09 | PO Gateway 모델 + 두 패널 노출 전략 채택 | 우리는 어그리게이터 X, PO 발급의 출처. PO Gateway만 운영하고 통합은 외부 위탁. 사용자 화면은 SAP 전송 + 모니터링 두 개로 단순화 |
| 2026-05-09 (정제) | Hub = "두 줄"로 단순화. 락인 우려는 과장 | PO 보유 = 락인 회피. 길 A(직접 어그리게이터) vs 길 B(솔루션 포워더) 중 길 B 선호 + 단순화 우선. 데이터 책임은 콘솔리데이터(데이터 주는 쪽) |

---

## 13. 용어 정리

| 용어 | 의미 |
|---|---|
| **SCM Hub** | 무신사 사내 SCM 통합 시스템 (OCMP AWS). PO/WMS/재고 관리 |
| **CPI** | SAP Cloud Platform Integration (SAP BTP) — SCM Hub와 SAP의 다리 |
| **CRD** | Cargo Ready Date — 화물 준비 완료 예정일 |
| **CLP** | Container Load Plan — 컨테이너 적재 계획 |
| **POL/POD** | Port of Loading / Port of Discharge |
| **MBL/HBL** | Master Bill of Lading / House Bill of Lading |
| **FCL/LCL** | Full Container Load / Less than Container Load |
| **무탠** | 무신사 자체 브랜드 (Mootan) |
| **xTrade** | ReadyKorea의 무역관리 SaaS (WiseTech Global 자회사) |
| **E2E** | 100+ 공급사가 사용하는 Consolidator+Forwarder 통합 플랫폼 |
| **Mootan PLM** | PLM에서 Mootan 일부 케이스가 다뤄짐 (전사 PO 합의 미확정) |

---

## 부록 — 스크린샷 / 외부 자료

- SeaVantage Cargo API Swagger: https://insight.seavantage.com/api/swagger-ui/index.html?urls.primaryName=Cargo
- SeaVantage Supported Carrier (50개): Monday.com 보드
- E2E PO Management PF Supplier User Guide v.3 (PDF)
- ReadyKorea xTrade 페이지: https://www.readykorea.co.kr/document/product/xtrade

---

*이 문서는 페이지 내부에 박힌 컨텍스트의 종합 본. 페이지를 직접 보면 같은 정보를 더 시각적으로 확인 가능.*
