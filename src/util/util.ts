import { Position, TextDocument } from "vscode";
import { documents } from "../extension";
import {
  ChartStateProperties,
  ChartNode,
  ChartTokenNode,
  ChartStateCommandNode,
  BranchNode,
} from "../types/node";
import { ChartState } from "../types/state";
import path = require("path");

/**
 * 特定位置の譜面状態を取得
 * @param document
 * @param position
 * @returns
 */
export function getChartState(
  document: TextDocument,
  position: Position
): ChartStateProperties | undefined {
  const root = documents.parse(document);
  if (root === undefined) {
    return;
  }
  let chartState: ChartStateProperties = new ChartState();
  const nowNode = root.findDepth((x) => x.range.contains(position), true);
  if (nowNode === undefined) {
    return;
  }
  const isBranchNode = nowNode.findParent((x) => x instanceof BranchNode) !== undefined;
  const chartNode = root.find<ChartNode>(
    (x) => x instanceof ChartNode && x.range.contains(position)
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
      true
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
