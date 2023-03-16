import * as vscode from "vscode";
import { FoldingRange, FoldingRangeProvider } from "vscode";
import { documents } from "../extension";
import { BranchNode, BranchSectionNode, ChartNode, Node } from "../types/node";

export class DefaultFoldingRangeProvider implements FoldingRangeProvider {
  provideFoldingRanges(
    document: vscode.TextDocument,
    context: vscode.FoldingContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.FoldingRange[]> {
    const folds: vscode.FoldingRange[] = [];
    const root = documents.parse(document);
    const nodes: Node[] = [];
    nodes.push(
      ...root.filter(
        (x) => x instanceof ChartNode || x instanceof BranchNode || x instanceof BranchSectionNode
      )
    );
    for (const node of nodes) {
      const fold = new FoldingRange(node.range.start.line, node.range.end.line);
      folds.push(fold);
    }
    return folds;
  }
}
