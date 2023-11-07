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

/**
 * 最小公倍数を計算
 * @param a
 * @param b
 * @returns
 */
function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

/**
 * 最小公倍数を計算
 * @param arr
 * @returns
 */
function lcmArray(arr: number[]): number {
  let currentLcm = arr[0];
  for (let i = 1; i < arr.length; i++) {
    currentLcm = lcm(currentLcm, arr[i]);
  }
  return currentLcm;
}
