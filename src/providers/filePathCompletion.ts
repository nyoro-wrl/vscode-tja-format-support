import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { documents } from "../extension";

/**
 * ファイルパス指定ヘッダーのファイル補完プロバイダー
 */
export class FilePathCompletionProvider implements vscode.CompletionItemProvider {
  /**
   * ファイルパスを指定するヘッダー名の一覧
   */
  private readonly filePathHeaders = [
    "WAVE",
    "SONG",
    "SIDEREV",
    "BGIMAGE",
    "BGMOVIE",
    "PREIMAGE",
    "BGA",
    "LYRICS",
  ];

  /**
   * ヘッダー別のファイル拡張子フィルター
   */
  private readonly headerExtensions = new Map<string, string[]>([
    ["WAVE", [".wav", ".mp3", ".ogg", ".m4a", ".flac"]],
    ["SONG", [".tja", ".tjc"]],
    ["SIDEREV", [".tja", ".tjc"]],
    ["BGIMAGE", [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"]],
    ["BGMOVIE", [".mp4", ".avi", ".mov", ".wmv", ".webm"]],
    ["PREIMAGE", [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"]],
    ["BGA", [".mp4", ".avi", ".mov", ".wmv", ".webm"]],
    ["LYRICS", [".txt", ".lrc"]],
  ]);

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[]> {
    const root = documents.parse(document, token);
    if (!root) {
      return [];
    }

    // 現在行のテキストを確認してファイルパス指定ヘッダーかチェック
    const currentLine = document.lineAt(position.line).text;
    const headerMatch = currentLine.match(/^\s*([A-Z]+):\s*(.*)$/);

    if (!headerMatch) {
      return [];
    }

    const headerName = headerMatch[1].toUpperCase();
    if (!this.filePathHeaders.includes(headerName)) {
      return [];
    }

    // カーソルがコロンの後にあることを確認
    const colonIndex = currentLine.indexOf(":");
    if (colonIndex === -1 || position.character <= colonIndex) {
      return [];
    }

    // 現在のディレクトリから利用可能なファイルを取得
    const documentDir = path.dirname(document.uri.fsPath);
    const currentFileName = path.basename(document.uri.fsPath);

    // 現在のパラメータ値を取得
    const currentParameterValue = headerMatch[2].trim();

    const completionItems = await this.getFileCompletions(
      documentDir,
      headerName,
      currentFileName,
      currentParameterValue,
      position,
      document
    );

    return completionItems;
  }

  /**
   * 指定ディレクトリからファイル補完候補を取得
   */
  private async getFileCompletions(
    directoryPath: string,
    headerName: string,
    currentFileName?: string,
    currentParameterValue?: string,
    position?: vscode.Position,
    document?: vscode.TextDocument
  ): Promise<vscode.CompletionItem[]> {
    const completionItems: vscode.CompletionItem[] = [];

    try {
      const files = await fs.promises.readdir(directoryPath, { withFileTypes: true });
      const allowedExtensions = this.headerExtensions.get(headerName) || [];

      for (const file of files) {
        if (file.isFile()) {
          const fileName = file.name;

          // 隠しファイルを除外
          if (fileName.startsWith(".")) {
            continue;
          }

          // 自身のファイルを除外
          if (currentFileName && fileName === currentFileName) {
            continue;
          }

          const fileExt = path.extname(fileName).toLowerCase();

          const completionItem = new vscode.CompletionItem(
            fileName,
            vscode.CompletionItemKind.File
          );

          // ソート用の優先度を設定（推奨拡張子ほど上位に）
          completionItem.sortText = this.getSortText(headerName, fileExt, fileName);

          // 既存のパラメータ値を置換する範囲を設定
          if (position && document && currentParameterValue !== undefined) {
            const currentLine = document.lineAt(position.line).text;
            const colonIndex = currentLine.indexOf(":");
            const parameterStart = colonIndex + 1;

            // 空白をスキップして実際のパラメータ開始位置を取得
            let actualStart = parameterStart;
            while (actualStart < currentLine.length && currentLine[actualStart] === " ") {
              actualStart++;
            }

            const replaceRange = new vscode.Range(
              position.line,
              actualStart,
              position.line,
              currentLine.length
            );

            completionItem.range = replaceRange;
          }

          completionItems.push(completionItem);
        } else if (file.isDirectory()) {
          // サブディレクトリも候補に追加
          const completionItem = new vscode.CompletionItem(
            file.name + "/",
            vscode.CompletionItemKind.Folder
          );
          completionItem.detail = "フォルダ";
          completionItem.insertText = file.name + "/";
          completionItem.command = {
            command: "editor.action.triggerSuggest",
            title: "Re-trigger completions",
          };

          // フォルダにも同じ置換範囲を設定
          if (position && document && currentParameterValue !== undefined) {
            const currentLine = document.lineAt(position.line).text;
            const colonIndex = currentLine.indexOf(":");
            const parameterStart = colonIndex + 1;

            let actualStart = parameterStart;
            while (actualStart < currentLine.length && currentLine[actualStart] === " ") {
              actualStart++;
            }

            const replaceRange = new vscode.Range(
              position.line,
              actualStart,
              position.line,
              currentLine.length
            );

            completionItem.range = replaceRange;
          }

          completionItems.push(completionItem);
        }
      }
    } catch (error) {
      // ディレクトリアクセスエラーは無視
    }

    return completionItems;
  }

  /**
   * ソート用のテキストを生成（推奨拡張子を優先）
   */
  private getSortText(headerName: string, extension: string, fileName: string): string {
    const allowedExtensions = this.headerExtensions.get(headerName) || [];
    const index = allowedExtensions.indexOf(extension);

    if (index >= 0) {
      // 推奨拡張子の場合、インデックスに基づいて優先順位を設定
      return `0${index.toString().padStart(2, "0")}_${fileName}`;
    } else {
      // 非推奨拡張子の場合、拡張子別にグループ化して後ろに配置
      return `1${extension}_${fileName}`;
    }
  }
}
