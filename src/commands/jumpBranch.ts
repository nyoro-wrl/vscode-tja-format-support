import * as vscode from "vscode";
import { Selection, TextEditor, TextEditorEdit } from "vscode";
import { documents } from "../extension";
import {
  BranchNode,
  BranchSectionNode,
  EBranchSectionNode,
  MBranchSectionNode,
  NBranchSectionNode,
} from "../types/node";

export const jumpBranchCommand: vscode.Command = {
  command: "tja.jumpBranch",
  title: "jump branch",
  tooltip: "分岐に移動",
};
export async function jumpBranch(textEditor: TextEditor, edit: TextEditorEdit, ...args: any[]) {
  // 現在のカーソル位置が譜面分岐内か検証する
  const position = textEditor.selection.active;
  const root = documents.parse(textEditor.document);
  const branchNode = root.findLast(
    (x) => x instanceof BranchNode && x.range !== undefined && x.range.contains(position)
  ) as BranchNode | undefined;

  if (branchNode === undefined) {
    vscode.window.showErrorMessage("分岐外です");
    return;
  }

  const texts: string[] = [];
  if (branchNode.properties.normal) {
    texts.push("N");
  }
  if (branchNode.properties.expert) {
    texts.push("E");
  }
  if (branchNode.properties.master) {
    texts.push("M");
  }

  const input = await vscode.window.showInputBox({
    prompt: "移動先の譜面分岐を入力してください",
    placeHolder: texts.join(),
    validateInput: (text) => {
      if (!text) {
        return;
      }
      if (!texts.includes(text.toUpperCase())) {
        return `${texts.join()} のいずれかを入力してください`;
      }
    },
  });
  if (input === undefined) {
    return;
  }

  let branchSectionNode: BranchSectionNode | undefined;
  if (input.toUpperCase() === "N") {
    branchSectionNode = branchNode.find((x) => x instanceof NBranchSectionNode) as
      | NBranchSectionNode
      | undefined;
  } else if (input.toUpperCase() === "E") {
    branchSectionNode = branchNode.find((x) => x instanceof EBranchSectionNode) as
      | EBranchSectionNode
      | undefined;
  } else if (input.toUpperCase() === "M") {
    branchSectionNode = branchNode.find((x) => x instanceof MBranchSectionNode) as
      | MBranchSectionNode
      | undefined;
  }
  if (branchSectionNode?.range === undefined) {
    return;
  }
  textEditor.selection = new Selection(branchSectionNode.range.start, branchSectionNode.range.end);
  textEditor.revealRange(branchSectionNode.range, vscode.TextEditorRevealType.InCenter);
  // ステータスバーから呼ばれるため、フォーカスをドキュメントに戻す
  vscode.window.showTextDocument(textEditor.document);
}
