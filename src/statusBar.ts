import * as vscode from "vscode";
import { Range, StatusBarAlignment } from "vscode";
import { getRoot } from "./parser";
import { CommandNode, MeasureNode } from "./types/node";

const measureStatusBarItem = vscode.window.createStatusBarItem(StatusBarAlignment.Right, 200);
measureStatusBarItem.name = "NowMeasure";

export const measureStatusBar = vscode.window.onDidChangeTextEditorSelection((event) => {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const selection = editor.selection;
    const range: Range = selection;
    const position = selection.active;
    const root = getRoot(event.textEditor.document);
    // カーソル位置の小節を検索
    const measure = root.find(
      (x) =>
        (x instanceof MeasureNode ||
          (x instanceof CommandNode && x.properties.measure !== undefined)) &&
        x.range !== undefined &&
        x.range.start.line <= position.line &&
        x.range.end.line >= position.line
    ) as MeasureNode | CommandNode | undefined;
    if (measure !== undefined) {
      measureStatusBarItem.text = "小節: " + measure.properties.measure;
      measureStatusBarItem.show();
    } else {
      measureStatusBarItem.hide();
    }
  }
});
