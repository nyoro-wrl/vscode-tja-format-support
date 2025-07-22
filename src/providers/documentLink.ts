import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { documents } from "../extension";
import { headers } from "../constants/headers";
import { HeaderNode, ParameterNode } from "../types/node";

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
    "PREIMAGE"
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
    const headerNodes = root.filter<HeaderNode>((x) => x instanceof HeaderNode);
    
    for (const headerNode of headerNodes) {
      const headerName = headerNode.properties.name.toUpperCase();
      
      // ファイルパス指定ヘッダーかチェック
      if (!this.filePathHeaders.includes(headerName)) {
        continue;
      }

      // パラメータ（ファイルパス）を取得
      const parameterNode = headerNode.find<ParameterNode>((x) => x instanceof ParameterNode);
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
      const link = new vscode.DocumentLink(
        parameterNode.range,
        vscode.Uri.file(absolutePath)
      );
      
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
        return `音源ファイルを開く: ${filePath}`;
      case "SONG":
        return `課題曲ファイルを開く: ${filePath}`;
      case "SIDEREV":
        return `表裏対応ファイルを開く: ${filePath}`;
      case "BGIMAGE":
        return `背景画像を開く: ${filePath}`;
      case "BGMOVIE":
        return `背景動画を開く: ${filePath}`;
      case "PREIMAGE":
        return `選曲画面画像を開く: ${filePath}`;
      default:
        return `ファイルを開く: ${filePath}`;
    }
  }
}