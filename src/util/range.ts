import { Range } from "vscode";

/**
 * Range[]内の重複する範囲を統合する
 * @param ranges
 * @returns
 */
export function mergeRanges(ranges: Range[]): Range[] {
  // 配列の要素を範囲の開始位置でソートする
  ranges.sort((a, b) => {
    if (a.start.isBefore(b.start)) {
      return -1;
    } else if (a.start.isAfter(b.start)) {
      return 1;
    } else {
      return 0;
    }
  });

  const mergedRanges: Range[] = [];

  // 配列の要素を順番に比較して、範囲を統合する
  let currentRange: Range | undefined = ranges[0];
  for (let i = 1; i < ranges.length; i++) {
    const range = ranges[i];

    // 現在の範囲と比較範囲の重なりを求める
    const intersection = currentRange.intersection(range);

    if (!intersection) {
      // 重なりがない場合は現在の範囲を結果に追加して比較範囲に移る
      mergedRanges.push(currentRange);
      currentRange = range;
    } else {
      // 重なりがある場合は現在の範囲を更新する
      currentRange = currentRange.union(range);
    }
  }

  // 最後の範囲を結果に追加する
  if (currentRange) {
    mergedRanges.push(currentRange);
  }

  return mergedRanges;
}

/**
 * Range[]を一つにまとめる
 * @param ranges
 * @returns
 */
export function unionRanges(ranges: readonly Range[]): Range | undefined {
  if (ranges.length === 0) {
    return undefined;
  }

  let minStart = ranges[0].start;
  let maxEnd = ranges[0].end;

  for (let i = 1; i < ranges.length; i++) {
    const range = ranges[i];

    if (range.start.isBefore(minStart)) {
      minStart = range.start;
    }

    if (range.end.isAfter(maxEnd)) {
      maxEnd = range.end;
    }
  }

  return new Range(minStart, maxEnd);
}
