import * as vscode from "vscode";
import { Position, StatusBarAlignment, TextDocument } from "vscode";
import { jumpMeasureCommand } from "../commands/jumpMeasure";
import { tja } from "../constants/language";
import { activeTjaFile, documents } from "../extension";
import {
  BranchNode,
  BranchSectionNode,
  ChartNode,
  ChartTokenNode,
  MeasureNode,
} from "../types/node";
import { Note } from "../types/note";
import { Configs } from "../configs";
import { changeLiteModeCommand } from "../commands/changeLiteMode";

/**
 * カーソル位置の小節番号表示
 */
export class MeasureStatusBarItem implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;
  private readonly disposables: vscode.Disposable[] = [];

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      "tja.measure",
      StatusBarAlignment.Right,
      200
    );
    this.statusBarItem.name = "小節数";
    this.statusBarItem.tooltip = jumpMeasureCommand.tooltip;
    this.disposables.push(this.statusBarItem);

    this.disposables.push(
      activeTjaFile.onDidClose.event(async () => {
        this.hide();
      }),
      vscode.window.onDidChangeTextEditorSelection(async (event) => {
        const document = event.textEditor.document;
        if (document.languageId === tja) {
          if (event.textEditor.selections.length > 1 || !event.textEditor.selection.isSingleLine) {
            this.hide();
          } else {
            this.update(document, event.textEditor.selection.active);
          }
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
      }),
      vscode.workspace.onDidChangeConfiguration(async (event) => {
        if (event.affectsConfiguration(new Configs().liteMode.getName())) {
          const textEditor = vscode.window.activeTextEditor;
          if (textEditor !== undefined && textEditor.document.languageId === tja) {
            this.update(textEditor.document, textEditor.selection.active);
          }
        }
      })
    );
  }

  dispose() {
    this.disposables.forEach((x) => x.dispose());
  }

  /**
   * 表示状態の更新
   * @param document
   * @param position
   */
  private update(document: TextDocument, position: Position): void {
    const root = documents.parse(document);
    if (root === undefined) {
      this.statusBarItem.hide();
      return;
    }

    // カーソル位置の小節を検索
    const measureNode = root.findDepth<MeasureNode>(
      (x) =>
        x instanceof MeasureNode &&
        x.range.start.line <= position.line &&
        x.range.end.line >= position.line
    );
    const measure = measureNode?.properties.startChartState.measure;
    const chartNode = measureNode?.findParent<ChartNode>((x) => x instanceof ChartNode);
    // 最大小節数を取得
    const maxMeasure = chartNode?.properties.info.measure;
    if (measure !== undefined && chartNode !== undefined && maxMeasure !== undefined) {
      this.statusBarItem.text = `小節: ${measure} / ${maxMeasure}`;
      this.statusBarItem.command = { ...jumpMeasureCommand, arguments: [chartNode] };
      this.statusBarItem.show();
    } else {
      this.statusBarItem.text = "";
      this.statusBarItem.hide();
    }
  }

  /**
   * 非表示
   */
  private hide() {
    this.statusBarItem.hide();
  }
}

export class ComboStatusBarItem implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;
  private readonly disposables: vscode.Disposable[] = [];

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      "tja.combo",
      StatusBarAlignment.Right,
      201
    );
    this.statusBarItem.name = "コンボ数";
    this.disposables.push(this.statusBarItem);

    this.disposables.push(
      activeTjaFile.onDidClose.event(async () => {
        this.hide();
      }),
      vscode.window.onDidChangeTextEditorSelection(async (event) => {
        const document = event.textEditor.document;
        if (document.languageId === tja) {
          if (event.textEditor.selections.length > 1 || !event.textEditor.selection.isEmpty) {
            this.hide();
          } else {
            this.update(document, event.textEditor.selection.active);
          }
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
      }),
      vscode.workspace.onDidChangeConfiguration(async (event) => {
        if (event.affectsConfiguration(new Configs().liteMode.getName())) {
          const textEditor = vscode.window.activeTextEditor;
          if (textEditor !== undefined && textEditor.document.languageId === tja) {
            this.update(textEditor.document, textEditor.selection.active);
          }
        }
      })
    );
  }

  dispose() {
    this.disposables.forEach((x) => x.dispose());
  }

  /**
   * 表示状態の更新
   * @param document
   * @param position
   */
  private update(document: TextDocument, position: Position): void {
    const root = documents.parse(document);
    if (root === undefined) {
      this.statusBarItem.hide();
      return;
    }

    // カーソル位置のコンボ数を検索
    const chart = root.find<ChartNode>((x) => x instanceof ChartNode && x.range.contains(position));
    const chartToken = chart?.find(
      (x) => x instanceof ChartTokenNode && x.range.contains(position)
    );
    if (chart === undefined || chartToken === undefined) {
      this.statusBarItem.text = "";
      this.statusBarItem.hide();
      return;
    }

    const previewBranches = chart.filter<BranchNode>(
      (x) => x instanceof BranchNode && x.range.end.line < position.line
    );
    const branchSection = chart.find<BranchSectionNode>(
      (x) => x instanceof BranchSectionNode && x.range.contains(position)
    );
    const notes = chart.properties.info.notes;

    const nowNotes = notes.filter(
      (x) =>
        x.range.start.line < position.line ||
        (x.range.start.line === position.line && x.range.start.character <= position.character)
    );
    const nowBranchNotes =
      branchSection?.properties.notes.filter(
        (x) =>
          x.range.start.line < position.line ||
          (x.range.start.line === position.line && x.range.start.character <= position.character)
      ) ?? [];
    nowNotes.push(...nowBranchNotes);
    const nowNormalNotes: Note[] = [];
    const nowExpertNotes: Note[] = [];
    const nowMasterNotes: Note[] = [];
    if (branchSection === undefined) {
      for (const previewBranch of previewBranches) {
        nowNormalNotes.push(...previewBranch.properties.normalNotes);
        nowExpertNotes.push(...previewBranch.properties.expertNotes);
        nowMasterNotes.push(...previewBranch.properties.masterNotes);
      }
    } else {
      for (const previewBranch of previewBranches) {
        if (branchSection.properties.kind === "N") {
          nowNotes.push(...previewBranch.properties.normalNotes);
        } else if (branchSection.properties.kind === "E") {
          nowNotes.push(...previewBranch.properties.expertNotes);
        } else {
          nowNotes.push(...previewBranch.properties.masterNotes);
        }
      }
    }
    const combo = nowNotes.filter((x) => x.isCombo).length;
    const normalCombo = combo + nowNormalNotes.filter((x) => x.isCombo).length;
    const expertCombo = combo + nowExpertNotes.filter((x) => x.isCombo).length;
    const masterCombo = combo + nowMasterNotes.filter((x) => x.isCombo).length;
    const texts: string[] = [];
    if (combo === normalCombo && combo === expertCombo && combo === masterCombo) {
      texts.push(combo.toString());
    } else {
      if (previewBranches.some((x) => x.properties.hasNormal)) {
        texts.push(normalCombo.toString());
      }
      if (previewBranches.some((x) => x.properties.hasExpert)) {
        texts.push(expertCombo.toString());
      }
      if (previewBranches.some((x) => x.properties.hasMaster)) {
        texts.push(masterCombo.toString());
      }
    }
    this.statusBarItem.text = `コンボ数: ${texts.join(", ")}`;
    this.statusBarItem.show();
  }

  /**
   * 非表示
   */
  private hide() {
    this.statusBarItem.hide();
  }
}

export class LiteModeStatusBarItem implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;
  private readonly disposables: vscode.Disposable[] = [];

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      "tja.mode",
      StatusBarAlignment.Right,
      199
    );
    this.disposables.push(this.statusBarItem);

    this.disposables.push(
      activeTjaFile.onDidOpen.event(async () => {
        this.show();
      }),
      activeTjaFile.onDidClose.event(async () => {
        this.hide();
      }),
      vscode.workspace.onDidChangeConfiguration(async (event) => {
        if (event.affectsConfiguration(new Configs().liteMode.getName())) {
          const document = vscode.window.activeTextEditor?.document;
          if (document !== undefined && document.languageId === tja) {
            this.show();
          }
        }
      })
    );

    // 初期化時に有効にする
    const document = vscode.window.activeTextEditor?.document;
    if (document !== undefined && document.languageId === tja) {
      this.show();
    }
  }

  dispose() {
    this.disposables.forEach((x) => x.dispose());
  }

  private show() {
    const isLiteMode = new Configs().liteMode.get();
    const modeText = isLiteMode ? "軽量モード" : "通常モード";
    const reverseModeText = !isLiteMode ? "軽量モード" : "通常モード";
    this.statusBarItem.text = "TJA:" + modeText;
    this.statusBarItem.tooltip = reverseModeText + "に切り替え";
    this.statusBarItem.command = {
      ...changeLiteModeCommand,
      arguments: [!isLiteMode],
    };
    this.statusBarItem.backgroundColor = isLiteMode
      ? new vscode.ThemeColor("statusBarItem.warningBackground")
      : undefined;
    this.statusBarItem.show();
  }

  /**
   * 非表示
   */
  private hide() {
    this.statusBarItem.hide();
  }
}
