import * as vscode from "vscode";
import { documents } from "../extension";
import {
  BranchNode,
  BranchSectionNode,
  ChartNode,
  MeasureNode,
  Node,
  SongNode,
} from "../types/node";

/**
 * コードの折りたたみ機能
 */
export class FoldingRangeProvider implements vscode.FoldingRangeProvider {
  async provideFoldingRanges(
    document: vscode.TextDocument,
    context: vscode.FoldingContext,
    token: vscode.CancellationToken
  ): Promise<vscode.FoldingRange[]> {
    const folds: vscode.FoldingRange[] = [];
    const root = documents.parse(document, token);
    if (root === undefined) {
      return folds;
    }
    const nodes: Node[] = [];
    nodes.push(
      ...root.filter(
        (x) =>
          x instanceof ChartNode ||
          x instanceof SongNode ||
          x instanceof BranchNode ||
          x instanceof BranchSectionNode,
        true,
        (x) => x instanceof MeasureNode || x instanceof BranchSectionNode,
        undefined,
        token
      )
    );
    for (const node of nodes) {
      if (token.isCancellationRequested) {
        return folds;
      }
      const fold = new vscode.FoldingRange(node.range.start.line, node.range.end.line);
      folds.push(fold);
    }
    return folds;
  }
}
