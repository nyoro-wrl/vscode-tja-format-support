import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { documents } from "../extension";
import { HeaderNode, ParameterNode } from "../types/node";
import { t } from "../i18n";

/**
 * ファイルパス指定ヘッダーのドキュメントリンクプロバイダー
 */
export class TjaDocumentLinkProvider implements vscode.DocumentLinkProvider {
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

  async provideDocumentLinks(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.DocumentLink[]> {
    const links: vscode.DocumentLink[] = [];

    const root = documents.parse(document, token);
    if (!root) {
      return links;
    }

    // ファイルパス指定ヘッダーを検索
    const headerNodes = root.filter<HeaderNode>((x) => x instanceof HeaderNode, { token });

    for (const headerNode of headerNodes) {
      if (token.isCancellationRequested) {
        return links;
      }

      const headerName = headerNode.properties.name.toUpperCase();

      // ファイルパス指定ヘッダーかチェック
      if (!this.filePathHeaders.includes(headerName)) {
        continue;
      }

      // パラメータ（ファイルパス）を取得
      const parameterNode = headerNode.find<ParameterNode>((x) => x instanceof ParameterNode, {
        token,
      });
      if (!parameterNode || !parameterNode.value.trim()) {
        continue;
      }

      const filePath = parameterNode.value.trim();

      // 相対パスから絶対パスを構築
      const documentDir = path.dirname(document.uri.fsPath);
      const absolutePath = path.resolve(documentDir, filePath);

      // ファイルが存在するかチェック
      try {
        if (!fs.existsSync(absolutePath)) {
          continue; // ファイルが存在しない場合はスキップ
        }
      } catch (error) {
        continue; // アクセスエラーの場合もスキップ
      }

      // DocumentLinkを作成
      const link = new vscode.DocumentLink(parameterNode.range, vscode.Uri.file(absolutePath));

      // ツールチップを設定
      link.tooltip = this.getTooltipForHeader(headerName, filePath);

      links.push(link);
    }

    return links;
  }

  /**
   * ヘッダー種類に応じたツールチップを取得
   */
  private getTooltipForHeader(headerName: string, filePath: string): string {
    switch (headerName) {
      case "WAVE":
        return `${t("documentLinks.openAudioFile")}: ${filePath}`;
      case "SONG":
        return `${t("documentLinks.openSongFile")}: ${filePath}`;
      case "SIDEREV":
        return `${t("documentLinks.openSideRevFile")}: ${filePath}`;
      case "BGIMAGE":
        return `${t("documentLinks.openBackgroundImage")}: ${filePath}`;
      case "BGMOVIE":
        return `${t("documentLinks.openBackgroundMovie")}: ${filePath}`;
      case "PREIMAGE":
        return `${t("documentLinks.openPreviewImage")}: ${filePath}`;
      case "BGA":
        return `${t("documentLinks.openBgaFile")}: ${filePath}`;
      case "LYRICS":
        return `${t("documentLinks.openLyricsFile")}: ${filePath}`;
      default:
        return `${t("documentLinks.openFile")}: ${filePath}`;
    }
  }
}
