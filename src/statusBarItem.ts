import * as vscode from "vscode";
import { Position, StatusBarAlignment, StatusBarItem, TextDocument } from "vscode";
import { jumpBranchCommand } from "./commands/jumpBranch";
import { jumpMeasureCommand } from "./commands/jumpMeasure";
import { documents } from "./extension";
import {
  BranchSectionNode,
  ChartNode,
  EBranchSectionNode,
  MBranchSectionNode,
  MeasureNode,
  NBranchSectionNode,
} from "./types/node";

export class MeasureStatusBarItem implements vscode.Disposable {
  private statusBarItem: StatusBarItem;
  private readonly disposables: vscode.Disposable[] = [];

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      "tja.measure",
      StatusBarAlignment.Right,
      200
    );
    this.statusBarItem.name = "小節";
    this.statusBarItem.command = jumpMeasureCommand;
    this.statusBarItem.tooltip = jumpMeasureCommand.tooltip;
    this.disposables.push(this.statusBarItem);

    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument(async (document) => {
        if (document.languageId !== "tja") {
          this.hide();
        }
      }),
      vscode.window.onDidChangeVisibleTextEditors(async (textEditors) => {
        this.hide();
      }),
      vscode.window.onDidChangeTextEditorSelection(async (event) => {
        const document = event.textEditor.document;
        if (document.languageId === "tja") {
          this.update(document, event.textEditor.selection.active);
        }
      }),
      documents.onDidFirstParsedTextDocument.event(async (document) => {
        if (document.languageId !== "tja") {
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
    const measureNode = root.findLast(
      (x) =>
        x instanceof MeasureNode &&
        x.range !== undefined &&
        x.range.start.line <= position.line &&
        x.range.end.line >= position.line
    ) as MeasureNode | undefined;
    const measure = measureNode?.properties.startChartState.measure;
    // 最大小節数を取得
    const maxMeasure = (
      measureNode?.findParent((x) => x instanceof ChartNode) as ChartNode | undefined
    )?.properties.measure;
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

export class BranchStatusBarItem implements vscode.Disposable {
  private statusBarItem: StatusBarItem;
  private readonly disposables: vscode.Disposable[] = [];

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      "tja.branch",
      StatusBarAlignment.Right,
      201
    );
    this.statusBarItem.name = "譜面分岐";
    this.statusBarItem.command = jumpBranchCommand;
    this.statusBarItem.tooltip = jumpBranchCommand.tooltip;
    this.disposables.push(this.statusBarItem);

    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument(async (document) => {
        if (document.languageId !== "tja") {
          this.hide();
        }
      }),
      vscode.window.onDidChangeVisibleTextEditors(async (textEditors) => {
        this.hide();
      }),
      vscode.window.onDidChangeTextEditorSelection(async (event) => {
        const document = event.textEditor.document;
        if (document.languageId === "tja") {
          this.update(document, event.textEditor.selection.active);
        }
      }),
      documents.onDidFirstParsedTextDocument.event(async (document) => {
        if (document.languageId !== "tja") {
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

    // カーソル位置の譜面分岐を検索
    const branchSectionNode = root.find(
      (x) =>
        x instanceof BranchSectionNode &&
        x.range !== undefined &&
        x.range.start.line <= position.line &&
        x.range.end.line >= position.line
    ) as BranchSectionNode | undefined;

    let text: string | undefined;
    if (branchSectionNode instanceof NBranchSectionNode) {
      text = "普通譜面";
    } else if (branchSectionNode instanceof EBranchSectionNode) {
      text = "玄人譜面";
    } else if (branchSectionNode instanceof MBranchSectionNode) {
      text = "達人譜面";
    }

    if (text !== undefined) {
      this.statusBarItem.text = text;
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
