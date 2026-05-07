-- ============================================
-- SeaVantage Cargo Watchlist (사선사 트래킹 감시)
-- SeaVantage Cargo Insight API에 화물 등록 후 주기적으로 상태 조회.
-- 상태 변화 시에만 스냅샷 적재 (UNI-PASS Watchlist와 동일 패턴).
--
-- 실행: Supabase SQL Editor에서 이 파일 내용 전체 복사 → Run
-- ============================================

CREATE TABLE IF NOT EXISTS seavantage_watch (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- SeaVantage 등록 키
  carrier_code text NOT NULL,         -- 4자리 (MAEU, CMAU, ONEY 등)
  mbl_no text,
  booking_no text,
  container_no text,

  -- SeaVantage가 POST /cargo 응답으로 반환한 documentId
  document_id text,

  -- 사용자 메타
  memo text,
  custom_column1 text,
  custom_column2 text,
  custom_column3 text,

  -- 최근 상태 캐시 (목록 화면 빠른 표시용)
  last_checked_at timestamptz,
  last_bl_status text,                -- BEFORE/PROCESSING/ON/PENDING/END/NOT_FOUND
  last_initial_eta text,
  last_initial_etd text,
  last_location_count int DEFAULT 0,
  cargo_info jsonb,                   -- 마지막 응답 요약 (locations 등)
  last_error text,

  -- 감시 중단
  is_closed boolean DEFAULT false,
  closed_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 활성 watch 중복 방지 (carrier + 키 조합)
CREATE UNIQUE INDEX IF NOT EXISTS seavantage_watch_key_active_idx
  ON seavantage_watch (
    carrier_code,
    COALESCE(mbl_no, ''),
    COALESCE(booking_no, ''),
    COALESCE(container_no, '')
  )
  WHERE is_closed = false;

CREATE INDEX IF NOT EXISTS seavantage_watch_is_closed_idx
  ON seavantage_watch (is_closed);

CREATE INDEX IF NOT EXISTS seavantage_watch_last_checked_at_idx
  ON seavantage_watch (last_checked_at);


-- 상태 변화 스냅샷
CREATE TABLE IF NOT EXISTS seavantage_watch_snapshot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  watch_id uuid NOT NULL REFERENCES seavantage_watch(id) ON DELETE CASCADE,

  checked_at timestamptz DEFAULT now(),

  bl_status text,
  initial_eta text,
  initial_etd text,
  location_count int DEFAULT 0,

  raw_response jsonb,
  change_summary text
);

CREATE INDEX IF NOT EXISTS seavantage_watch_snapshot_watch_id_idx
  ON seavantage_watch_snapshot (watch_id);

CREATE INDEX IF NOT EXISTS seavantage_watch_snapshot_checked_at_idx
  ON seavantage_watch_snapshot (checked_at DESC);


-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION seavantage_watch_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS seavantage_watch_updated_at_trigger ON seavantage_watch;
CREATE TRIGGER seavantage_watch_updated_at_trigger
  BEFORE UPDATE ON seavantage_watch
  FOR EACH ROW EXECUTE FUNCTION seavantage_watch_set_updated_at();
