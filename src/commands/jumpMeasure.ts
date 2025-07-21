import * as vscode from "vscode";
import { Selection, TextEditor, TextEditorEdit } from "vscode";
import { BranchSectionNode, ChartNode, MeasureNode } from "../types/node";

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
        return "整数を入力してください";
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
  if (input === undefined || input === "") {
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

    const items: { label: string; value: string }[] = [];
    if (nBranch !== undefined) {
      items.push({ label: "普通 (Normal)", value: "N" });
    }
    if (eBranch !== undefined) {
      items.push({ label: "玄人 (Expert)", value: "E" });
    }
    if (mBranch !== undefined) {
      items.push({ label: "達人 (Master)", value: "M" });
    }

    const selectedItem = await vscode.window.showQuickPick(items, {
      placeHolder: "移動先の譜面分岐を選択してください",
    });
    if (selectedItem === undefined) {
      return;
    }

    let measureNode: MeasureNode | undefined;
    if (selectedItem.value === "N") {
      measureNode = nBranch;
    } else if (selectedItem.value === "E") {
      measureNode = eBranch;
    } else if (selectedItem.value === "M") {
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
