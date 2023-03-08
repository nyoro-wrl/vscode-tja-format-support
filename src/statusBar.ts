import * as vscode from "vscode";
import { StatusBarAlignment } from "vscode";
import { getRoot } from "./parser";
import { CommandNode, MeasureNode } from "./types/node";

const measureStatusBarItem = vscode.window.createStatusBarItem(StatusBarAlignment.Right, 200);
measureStatusBarItem.name = "Measure";

export const measureStatusBar = vscode.window.onDidChangeTextEditorSelection((event) => {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const selection = editor.selection;
    const position = selection.active;
    const root = getRoot(event.textEditor.document);
    if (root === undefined) {
      measureStatusBarItem.hide();
    } else {
      const measure = root.findChildren(
        (x) =>
          x.range !== undefined &&
          x.range.start.line <= position.line &&
          x.range.end.line >= position.line &&
          (x instanceof MeasureNode ||
            (x instanceof CommandNode && x.properties.measure !== undefined))
      ) as MeasureNode | undefined;
      if (measure !== undefined) {
        measureStatusBarItem.text = "小節: " + measure.properties.measure;
        measureStatusBarItem.show();
      } else {
        measureStatusBarItem.hide();
      }
    }
  }
});
