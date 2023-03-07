import { Range } from "vscode";
import { commands } from "../constants/commands";
import { headers } from "../constants/headers";
import { Token } from "./lexer";
import { Separator } from "./statement";

/**
 * ノードの種類
 *
 *     "Global" // 全体
 *     "GlobalHeaders" // 共通ヘッダー
 *     "CourseHeaders" // 難易度別ヘッダー
 *     "Course" // 難易度
 *     "Header" // ヘッダー
 *     "Command" // 命令
 *     "Directive" // ヘッダー・命令の名前
 *     "Parameters" // パラメーターの塊
 *     "Parameter" // パラメーター
 *     "Delimiter" // パラメーターの区切り文字
 *     "Chart" // 譜面
 *     "Measure" // 小節
 *     "Note" // ノーツ
 *     "MeasureEnd" // 小節の終わり
 */
export type NodeKind =
  | "Global"
  | "GlobalHeaders"
  | "CourseHeaders"
  | "Course"
  | "Header"
  | "Command"
  | "Directive"
  | "Parameters"
  | "Parameter"
  | "Delimiter"
  | "Chart"
  | "Measure"
  | "Note"
  | "MeasureEnd";

interface IComments {
  comments: Comment[];
}

interface Comment {
  kind: NodeKind;
  text: string;
  range: Range;
}

export interface INode {
  readonly kind: NodeKind;
  children: readonly INode[];
  ranges: readonly Range[];
  readonly range: Range;
}

export class Node implements INode {
  readonly kind: NodeKind;
  private parent: Node | undefined;
  private _children: Node[] = [];
  protected _ranges: Range[] = [];
  private _range: Range;

  get children(): readonly Node[] {
    return this._children;
  }

  get ranges(): readonly Range[] {
    return this._ranges;
  }

  get range(): Range {
    return this._range;
  }

  constructor(kind: NodeKind, range: Range, parent: Node | undefined) {
    this.kind = kind;
    this.parent = parent;
    this._range = range;
    this.pushRange(range);
  }

  /**
   * childrenにNodeを追加
   * @param node
   */
  public push(node: Node): void {
    this._children.push(node);
    this.pushRange(...node.ranges);
  }

  protected pushRange(...ranges: Range[]): void {
    for (const range of ranges) {
      this._ranges.push(range);
    }
    this._ranges = mergeRanges(this._ranges);
    const range = unionRanges(this._ranges);
    if (range !== undefined) {
      this._range = range;
    }
    if (this.parent !== undefined) {
      this.parent.pushRange(...this._ranges);
    }
  }
}

export class ParameterNode extends Node {
  readonly separator: Separator;

  constructor(kind: NodeKind, range: Range, separator: Separator, parent: Node | undefined) {
    super(kind, range, parent);
    this.separator = separator;
  }
}

export class HeaderNode extends ParameterNode {
  constructor(token: Token, parent: Node | undefined) {
    const separator = headers.get(token.value)?.separator ?? "Unknown";
    super("Header", token.range, separator, parent);
  }
}

export class CommandNode extends ParameterNode {
  constructor(token: Token, parent: Node | undefined) {
    const separator = commands.get(token.value)?.separator ?? "Unknown";
    super("Command", token.range, separator, parent);
  }
}

export class TextNode extends Node {
  readonly text: string;

  constructor(kind: NodeKind, token: Token, parent: Node | undefined) {
    super(kind, token.range, parent);
    this.text = token.value;
  }
}

/**
 * Range[]内の重複する範囲を統合する
 * @param ranges
 * @returns
 */
function mergeRanges(ranges: Range[]): Range[] {
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
