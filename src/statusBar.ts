import * as vscode from "vscode";
import { StatusBarAlignment } from "vscode";
import { getRoot } from "./parser";
import { ChartNode, CommandNode, MeasureNode } from "./types/node";

const measureStatusBarItem = vscode.window.createStatusBarItem(StatusBarAlignment.Right, 200);
measureStatusBarItem.name = "小節";
measureStatusBarItem.command = {
  command: "tja.jumpMeasure",
  title: "小節に移動",
};
measureStatusBarItem.tooltip = "小節に移動";

export const measureStatusBar = vscode.window.onDidChangeTextEditorSelection((event) => {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const selection = editor.selection;
    const position = selection.active;
    const root = getRoot(event.textEditor.document);
    // カーソル位置の小節を検索
    const measureNode = root.find(
      (x) =>
        (x instanceof MeasureNode ||
          (x instanceof CommandNode && x.properties.measure !== undefined)) &&
        x.range !== undefined &&
        x.range.start.line <= position.line &&
        x.range.end.line >= position.line
    ) as MeasureNode | CommandNode | undefined;
    const measure = measureNode?.properties.measure;
    // 最大小節数を取得
    const maxMeasure = (
      measureNode?.findParent((x) => x instanceof ChartNode) as ChartNode | undefined
    )?.properties.measure;
    if (measure !== undefined && maxMeasure !== undefined) {
      measureStatusBarItem.text = `小節: ${measure} / ${maxMeasure}`;
      measureStatusBarItem.show();
    } else {
      measureStatusBarItem.hide();
    }
  }
});
