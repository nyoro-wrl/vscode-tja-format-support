/**
 * 区切り文字で分割し、文字,開始位置,終了位置の配列を取得
 * @param str
 * @param separator
 * @returns
 */
export function splitWithPositions(
  str: string,
  separator: RegExp
): Array<{ text: string; start: number; end: number }> {
  const result = [];
  let start = 0;
  let match = separator.exec(str);
  while ((match = separator.exec(str))) {
    const end = match.index;
    if (end > start) {
      result.push({ text: str.substring(start, end), start: start, end: end });
    }
    start = separator.lastIndex;
  }
  if (start < str.length) {
    result.push({ text: str.substring(start), start: start, end: str.length });
  }
  return result;
}
