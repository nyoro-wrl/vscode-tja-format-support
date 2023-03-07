interface SplitPosition {
  value: string;
  start: number;
  end: number;
}

export function splitStringWithRegexDelimiter(
  input: string,
  delimiter: RegExp
): [SplitPosition[], SplitPosition[]] {
  const tokens: SplitPosition[] = [];
  const delimiters: SplitPosition[] = [];
  let match;
  let start = 0;
  while ((match = delimiter.exec(input)) !== null) {
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
      end: delimiter.lastIndex,
    });
    start = delimiter.lastIndex;
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
