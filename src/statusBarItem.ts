import * as vscode from "vscode";
import { Position, StatusBarAlignment, StatusBarItem, TextDocument } from "vscode";
import { jumpMeasureCommand } from "./commands/jumpMeasure";
import { tja } from "./constants/language";
import { documents } from "./extension";
import { ChartNode, MeasureNode } from "./types/node";

export class MeasureStatusBarItem implements vscode.Disposable {
  private statusBarItem: StatusBarItem;
  private readonly disposables: vscode.Disposable[] = [];

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      "tja.measure",
      StatusBarAlignment.Right,
      201
    );
    this.statusBarItem.name = "小節数";
    this.statusBarItem.command = jumpMeasureCommand;
    this.statusBarItem.tooltip = jumpMeasureCommand.tooltip;
    this.disposables.push(this.statusBarItem);

    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument(async (document) => {
        if (document.languageId !== tja) {
          this.hide();
        }
      }),
      vscode.window.onDidChangeVisibleTextEditors(async (textEditors) => {
        this.hide();
      }),
      vscode.window.onDidChangeTextEditorSelection(async (event) => {
        const document = event.textEditor.document;
        if (document.languageId === tja) {
          this.update(document, event.textEditor.selection.active);
        }
      }),
      documents.onDidFirstParsedTextDocument.event(async (document) => {
        if (document.languageId !== tja) {
          return;
        }
        const activeTextEditor = vscode.window.activeTextEditor;
        if (document === activeTextEditor?.document) {
          this.update(document, activeTextEditor.selection.active);
        }
      })
    );
  }

  dispose() {
    this.disposables.forEach((x) => x.dispose());
  }

  update(document: TextDocument, position: Position): void {
    const root = documents.parse(document);

    // カーソル位置の小節を検索
    const measureNode = root.findDepth<MeasureNode>(
      (x) =>
        x instanceof MeasureNode &&
        x.range.start.line <= position.line &&
        x.range.end.line >= position.line
    );
    const measure = measureNode?.properties.startChartState.measure;
    // 最大小節数を取得
    const maxMeasure = measureNode?.findParent<ChartNode>((x) => x instanceof ChartNode)?.properties
      .measure;
    if (measure !== undefined && maxMeasure !== undefined) {
      this.statusBarItem.text = `小節: ${measure} / ${maxMeasure}`;
      this.statusBarItem.show();
    } else {
      this.statusBarItem.text = "";
      this.statusBarItem.hide();
    }
  }

  hide() {
    this.statusBarItem.hide();
  }
}
