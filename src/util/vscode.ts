import { Range } from "vscode";

export function unionRanges(...ranges: Range[]): Range | undefined {
  if (ranges.length === 0) {
    return;
  }
  let unionRange = ranges[0];
  for (const range of ranges.slice(1)) {
    unionRange = unionRange.union(range);
  }
  return unionRange;
}
