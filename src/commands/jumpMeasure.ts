import * as vscode from "vscode";
import { Selection, TextEditor, TextEditorEdit } from "vscode";
import { BranchSectionNode, ChartNode, HeadersNode, MeasureNode } from "../types/node";

export const jumpMeasureCommand: vscode.Command = {
  command: "tja.jumpMeasure",
  title: "小節に移動",
  tooltip: "小節に移動",
};

/**
 * 小節のジャンプ機能
 * @param textEditor
 * @param edit
 * @param chartNode
 * @returns
 */
export async function jumpMeasure(
  textEditor: TextEditor,
  edit: TextEditorEdit,
  chartNode: ChartNode
): Promise<void> {
  const maxMeasure = chartNode.properties.info.measure;
  const input = await vscode.window.showInputBox({
    prompt: "移動先の小節番号を入力してください",
    placeHolder: `1 ~ ${maxMeasure}`,
    validateInput: (text) => {
      if (!text) {
        return;
      }
      if (Number.isNaN(Number(text))) {
        return "数値を入力してください";
      }
      const measure = Number(text);
      if (!Number.isInteger(measure)) {
        return "整数を入力してください";
      }
      const measureNodes = chartNode.filter(
        (x) => x instanceof MeasureNode && x.properties.startChartState.measure === measure
      );
      if (measureNodes.length === 0) {
        return "小節が見つかりません";
      }
    },
  });
  if (input === undefined) {
    return;
  }

  const measure = Number(input);
  const measureNodes = chartNode.filter<MeasureNode>(
    (x) => x instanceof MeasureNode && x.properties.startChartState.measure === measure
  );

  if (measureNodes.length === 1) {
    const measureNode = measureNodes[0];
    textEditor.selection = new Selection(measureNode.range.start, measureNode.range.end);
    textEditor.revealRange(measureNode.range, vscode.TextEditorRevealType.InCenter);
  } else if (measureNodes.length > 1) {
    // 小節が複数あるときの対応
    const nBranch = measureNodes.find(
      (x) => x.parent instanceof BranchSectionNode && x.parent.properties.kind === "N"
    );
    const eBranch = measureNodes.find(
      (x) => x.parent instanceof BranchSectionNode && x.parent.properties.kind === "E"
    );
    const mBranch = measureNodes.find(
      (x) => x.parent instanceof BranchSectionNode && x.parent.properties.kind === "M"
    );

    const texts: string[] = [];
    if (nBranch !== undefined) {
      texts.push("N");
    }
    if (eBranch !== undefined) {
      texts.push("E");
    }
    if (mBranch !== undefined) {
      texts.push("M");
    }

    const input = await vscode.window.showInputBox({
      prompt: "移動先の譜面分岐を入力してください",
      placeHolder: texts.join(", "),
      validateInput: (text) => {
        if (!text) {
          return;
        }
        if (!texts.includes(text.toUpperCase())) {
          return `${texts.join(", ")} のいずれかを入力してください`;
        }
      },
    });
    if (input === undefined) {
      return;
    }

    let measureNode: MeasureNode | undefined;
    if (input.toUpperCase() === "N") {
      measureNode = nBranch;
    } else if (input.toUpperCase() === "E") {
      measureNode = eBranch;
    } else if (input.toUpperCase() === "M") {
      measureNode = mBranch;
    }
    if (measureNode === undefined) {
      return;
    }
    textEditor.selection = new Selection(measureNode.range.start, measureNode.range.end);
    textEditor.revealRange(measureNode.range, vscode.TextEditorRevealType.InCenter);
  }
  // ステータスバーから呼ばれるため、フォーカスをドキュメントに戻す
  vscode.window.showTextDocument(textEditor.document);
}
