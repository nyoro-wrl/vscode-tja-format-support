interface SplitPosition {
  value: string;
  start: number;
  end: number;
}

/**
 * 区切り文字で分割し、分割した文字列とそれぞれの区切り文字の{文字列,開始位置,終了位置}を取得
 * @param input
 * @param sepalater
 * @returns
 */
export function splitString(input: string, sepalater: RegExp): [SplitPosition[], SplitPosition[]] {
  const tokens: SplitPosition[] = [];
  const delimiters: SplitPosition[] = [];
  let match;
  let start = 0;
  while ((match = sepalater.exec(input)) !== null) {
    if (match.index !== start) {
      tokens.push({
        value: input.slice(start, match.index),
        start,
        end: match.index,
      });
    }
    delimiters.push({
      value: match[0],
      start: match.index,
      end: sepalater.lastIndex,
    });
    start = sepalater.lastIndex;
  }
  if (start !== input.length) {
    tokens.push({
      value: input.slice(start),
      start,
      end: input.length,
    });
  }
  return [tokens, delimiters];
}
