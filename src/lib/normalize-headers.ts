/**
 * 헤더 키의 whitespace(공백/개행/탭 시퀀스)를 단일 공백으로 정규화.
 * xlsx의 wrap된 셀 헤더에 "\r\n"이 섞여 들어오는 경우를 흡수.
 */
export function normalizeHeaderKeys(row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k.replace(/\s+/g, " ").trim()] = v;
  }
  return out;
}
