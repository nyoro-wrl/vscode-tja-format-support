import { Position, TextDocument } from "vscode";
import { documents } from "../extension";
// import { documents } from "../documents";
import {
  ChartStateProperties,
  ChartNode,
  ChartTokenNode,
  ChartStateCommandNode,
  BranchNode,
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
  const nowNode = root.findLast((x) => x.range !== undefined && x.range.contains(position));
  if (nowNode === undefined) {
    return undefined;
  }
  const isBranchNode = nowNode.findParent((x) => x instanceof BranchNode) !== undefined;
  const chartNode = root.find(
    (x) => x instanceof ChartNode && x.range !== undefined && x.range.contains(position)
  ) as ChartNode | undefined;
  if (chartNode !== undefined) {
    const beforeChartStateNode = chartNode.findLastRange(
      (x) =>
        (x instanceof ChartTokenNode ||
          x instanceof ChartStateCommandNode ||
          (!isBranchNode && x instanceof BranchNode)) &&
        x.range !== undefined &&
        (x.range.start.line < position.line ||
          (x.range.start.line === position.line && x.range.start.character < position.character))
    ) as ChartTokenNode | ChartStateCommandNode | BranchNode | undefined;
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
