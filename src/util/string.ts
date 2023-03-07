interface SplitPosition {
  value: string;
  start: number;
  end: number;
}

/**
 * 区切り文字で分割し、文字,開始位置,終了位置の配列を取得
 * @param separator
 * @param str
 * @returns
 */
export function splitWithPositions(
  separator: RegExp,
  str: string
): [parts: SplitPosition[], delimiters: SplitPosition[]] {
  const parts: SplitPosition[] = [];
  const delimiters: SplitPosition[] = [];
  let start = 0;

  // 区切り文字の位置を取得し、区切り文字とその位置を配列に格納する
  str.split(separator).forEach((value, index) => {
    const end = start + value.length;
    parts.push({ value, start, end });

    const match = str.slice(end).match(separator);
    if (match) {
      const delimiterStart = end;
      const delimiterEnd = delimiterStart + match[0].length;
      delimiters.push({ value: match[0], start: delimiterStart, end: delimiterEnd });
    }

    start = end + (match ? match[0].length : 0);
  });

  return [parts, delimiters];
}
