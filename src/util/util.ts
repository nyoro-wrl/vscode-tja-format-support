import { Position, TextDocument } from "vscode";
import { documents } from "../extension";
import {
  ChartStateProperties,
  ChartNode,
  ChartTokenNode,
  ChartStateCommandNode,
  BranchNode,
  CommandNode,
} from "../types/node";
import { ChartState } from "../types/state";

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
  let chartState: ChartStateProperties = new ChartState();
  const nowNode = root.findDepth((x) => x.range.contains(position), true);
  if (nowNode === undefined) {
    return undefined;
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

export function toPercent(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(value);
}
