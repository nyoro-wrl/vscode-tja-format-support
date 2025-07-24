import { Position, TextDocument, MarkdownString, CancellationToken } from "vscode";
import { documents } from "../extension";
import {
  ChartStateProperties,
  ChartNode,
  ChartTokenNode,
  ChartStateCommandNode,
  BranchNode,
} from "../types/node";
import { ChartState } from "../types/state";
import { ParameterDefinition } from "../types/header";
import { Separator } from "../types/statement";
import path = require("path");

/**
 * 特定位置の譜面状態を取得
 * @param document
 * @param position
 * @param token
 * @returns
 */
export function getChartState(
  document: TextDocument,
  position: Position,
  token?: CancellationToken
): ChartStateProperties | undefined {
  const root = documents.parse(document, token);
  if (root === undefined) {
    return;
  }
  let chartState: ChartStateProperties = new ChartState();
  const nowNode = root.findDepth((x) => x.range.contains(position), { continue: true, token });
  if (nowNode === undefined) {
    return;
  }
  const isBranchNode = nowNode.findParent((x) => x instanceof BranchNode, { token }) !== undefined;
  const chartNode = root.find<ChartNode>(
    (x) => x instanceof ChartNode && x.range.contains(position),
    { token }
  );
  if (chartNode !== undefined) {
    const beforeChartStateNode = chartNode.findLastRange<
      ChartTokenNode | ChartStateCommandNode | BranchNode
    >(
      (x) =>
        (x instanceof ChartTokenNode ||
          x instanceof ChartStateCommandNode ||
          (!isBranchNode && x instanceof BranchNode)) &&
        (x.range.start.line < position.line ||
          (x.range.start.line === position.line && x.range.start.character < position.character)),
      { continue: true, token }
    );
    if (beforeChartStateNode === undefined) {
      return;
    } else if (beforeChartStateNode instanceof ChartTokenNode) {
      chartState = beforeChartStateNode.properties;
    } else if (beforeChartStateNode instanceof ChartStateCommandNode) {
      chartState = beforeChartStateNode.properties.chartState;
    } else if (beforeChartStateNode instanceof BranchNode) {
      chartState = beforeChartStateNode.properties.endChartState;
    } else {
      return;
    }
  }
  return chartState;
}

/**
 * 指定位置が行頭かどうか（手前の空文字を無視する）
 * @param document
 * @param position
 * @returns
 */
export function isStartOfLineIgnoringWhitespace(
  document: TextDocument,
  position: Position
): boolean {
  // 行が存在するかチェック
  if (position.line >= document.lineCount) {
    return false;
  }

  const line = document.lineAt(position.line);

  // 行頭の空白文字を除いた最初の文字の位置を取得
  const firstNonWhitespaceIndex = line.firstNonWhitespaceCharacterIndex;

  // 現在位置が、空白を除いた行頭以前にあるかチェック
  return position.character <= firstNonWhitespaceIndex;
}

/**
 * 指定位置が行末かどうか（後ろの空文字を無視する）
 * @param document
 * @param position
 * @returns
 */
export function isEndOfLineIgnoringWhitespace(document: TextDocument, position: Position): boolean {
  // 行が存在するかチェック
  if (position.line >= document.lineCount) {
    return false;
  }

  const line = document.lineAt(position.line);

  // 行末の空白文字を除いた文字列の長さを取得
  const trimmedLength = line.text.trimEnd().length;

  // 現在位置が、空白を除いた行末以降にあるかチェック
  return position.character >= trimmedLength;
}

export function isTmg(document: TextDocument | undefined): boolean {
  if (document) {
    return path.extname(document.fileName) === ".tmg";
  } else {
    return false;
  }
}

/**
 * 命令をTMG形式に変換する
 * @param text
 * @returns
 */
export function toTmgCommandText(text: string): string {
  const regex = /(#)?([A-Z0-9]+)(\s+)?(.+)?/;
  const match = text.match(regex);

  if (!match) {
    return text;
  }

  let [, sharp, name, spaces, parameter] = match;

  if (sharp === undefined) {
    sharp = "";
  }

  if (spaces && parameter) {
    return sharp + name + "(" + parameter.replace(/\s+/g, ",") + ")";
  }

  return sharp + name + "()";
}

export function toPercent(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * 最大公約数を計算
 * @param a
 * @param b
 * @returns
 */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * 最大公約数を計算
 * @param arr
 * @returns
 */
export function gcdArray(arr: number[]): number {
  let currentGcd = arr[0];
  for (let i = 1; i < arr.length; i++) {
    currentGcd = gcd(currentGcd, arr[i]);
  }
  return currentGcd;
}

declare global {
  interface Array<T> {
    /**
     * 重複の削除
     */
    unique(): Array<T>;
    /**
     * 重複を削除して重複した数の順番に並び替える
     * @param order
     */
    uniqueSorted(order?: "asc" | "desc"): Array<T>;
  }
}

Array.prototype.unique = function <T>(): Array<T> {
  return [...new Set(this)];
};

Array.prototype.uniqueSorted = function <T>(order: "asc" | "desc" = "desc"): Array<T> {
  const uniqueElements = this.unique();
  const frequencyMap: Record<string, number> = {};

  // 各要素の出現回数をカウント
  for (const item of this) {
    const key = JSON.stringify(item);
    frequencyMap[key] = (frequencyMap[key] || 0) + 1;
  }

  // 出現回数に応じて並び替え
  return uniqueElements.sort((a, b) => {
    const aCount = frequencyMap[JSON.stringify(a)];
    const bCount = frequencyMap[JSON.stringify(b)];
    if (order === "asc") {
      return aCount - bCount;
    } else {
      return bCount - aCount;
    }
  });
};

/**
 * Separatorタイプから実際の区切り文字を取得
 * @param separator 区切り文字タイプ
 * @returns 実際の区切り文字（文字列）
 */
export function getSeparatorChar(separator: Separator): string {
  switch (separator) {
    case "Comma":
      return ",";
    case "Space":
      return " ";
    case "None":
    case "Unknown":
    default:
      return ""; // 区切り文字が存在しない
  }
}

/**
 * 指定位置がコメント内かどうかを判定
 * @param line 行のテキスト
 * @param position カーソル位置
 * @returns コメント内の場合true
 */
export function isInComment(line: string, position: Position): boolean {
  // コメント開始位置を計算
  const commentStart = line.indexOf("//");
  return commentStart !== -1 && position.character >= commentStart;
}

/**
 * パラメータ定義からsyntax文字列を生成
 * @param name ヘッダー名
 * @param parameters パラメータ定義配列
 * @param separator 区切り文字タイプ
 * @returns Markdown形式のsyntax文字列
 */
export function generateSyntax(
  name: string,
  parameters: readonly ParameterDefinition[],
  separator: Separator = "Comma"
): string {
  const separatorChar = getSeparatorChar(separator);

  // 区切り文字が存在しない場合は最初のパラメータのみ表示
  if (separatorChar === "" && parameters.length > 0) {
    const firstParam = parameters[0];
    const paramPart = `<${firstParam[0]}>`;
    return new MarkdownString().appendCodeblock(`${name}:${paramPart}`).value;
  }

  const paramPart = parameters.map(([paramName]) => `<${paramName}>`).join(separatorChar);
  return new MarkdownString().appendCodeblock(`${name}:${paramPart}`).value;
}
