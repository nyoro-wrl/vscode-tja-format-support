import * as vscode from "vscode";
import { documents } from "../extension";
import { MeasureNode, ChartTokenNode, ChartNode } from "../types/node";

/**
 * 小節カウント表示のInlayHintsProvider
 */
export class MeasureCountInlayHintsProvider implements vscode.InlayHintsProvider {
  async provideInlayHints(
    document: vscode.TextDocument,
    range: vscode.Range,
    token: vscode.CancellationToken
  ): Promise<vscode.InlayHint[]> {
    const hints: vscode.InlayHint[] = [];

    // 設定確認
    const config = vscode.workspace.getConfiguration("tjaFormatSupport");
    const measureCountHintEnabled = config.get<boolean>("measureCountHint", true);

    if (!measureCountHintEnabled) {
      return hints;
    }

    const root = documents.parse(document, token);
    if (!root) {
      return hints;
    }

    // ドキュメントの行レベルで新しい小節の開始を検出
    const measureHintLines = this.findMeasureStartLines(document, range);

    // AST情報で小節番号を取得
    for (const hintLine of measureHintLines) {
      const measureNumber = this.getMeasureNumberAtLine(root, hintLine.line);
      if (measureNumber !== undefined) {
        const hint = new vscode.InlayHint(
          new vscode.Position(hintLine.line, hintLine.endCharacter),
          ` // ${measureNumber}`
        );
        hints.push(hint);
      }
    }

    return hints;
  }

  /**
   * ドキュメント行レベルで新しい小節の開始行を検出
   */
  private findMeasureStartLines(
    document: vscode.TextDocument,
    range: vscode.Range
  ): Array<{ line: number; endCharacter: number }> {
    const measureStartLines: Array<{ line: number; endCharacter: number }> = [];
    let lastNoteDataLine = -1;
    let lastCommandLine = -1;
    let lastStartCommandLine = -1; // #START命令の行を追跡

    for (
      let lineNum = range.start.line;
      lineNum <= range.end.line && lineNum < document.lineCount;
      lineNum++
    ) {
      const lineText = document.lineAt(lineNum).text.trim();

      if (lineText === "") {
        continue; // 空行はスキップ
      }

      // 現在の行が音符データかチェック
      if (this.isNoteDataLine(lineText)) {
        // 新しい小節の開始を判定
        let isNewMeasureStart = false;

        if (lineNum === 0) {
          // 最初の行
          isNewMeasureStart = true;
        } else if (lastNoteDataLine === -1) {
          // 最初の音符データ行
          isNewMeasureStart = true;
        } else if (this.hasEmptyLineBetween(document, lastNoteDataLine, lineNum)) {
          // 前の音符データ行と現在の行の間に空行がある
          isNewMeasureStart = true;
        } else if (
          lastCommandLine > lastNoteDataLine &&
          this.hasEmptyLineBetween(document, lastCommandLine, lineNum)
        ) {
          // 命令行の後に空行がある場合
          isNewMeasureStart = true;
        }

        // #START命令の直後は表示しない特例
        if (isNewMeasureStart && lastStartCommandLine > lastNoteDataLine) {
          isNewMeasureStart = false;
        }

        if (isNewMeasureStart) {
          measureStartLines.push({
            line: lineNum,
            endCharacter: document.lineAt(lineNum).text.length,
          });
        }

        lastNoteDataLine = lineNum;
      } else if (lineText.startsWith("#")) {
        lastCommandLine = lineNum;

        // #START命令を特別に記録
        if (lineText.toUpperCase().startsWith("#START")) {
          lastStartCommandLine = lineNum;
        }
      }
    }

    return measureStartLines;
  }

  /**
   * 指定された行の間に空行があるかチェック
   */
  private hasEmptyLineBetween(
    document: vscode.TextDocument,
    startLine: number,
    endLine: number
  ): boolean {
    for (let lineNum = startLine + 1; lineNum < endLine; lineNum++) {
      if (document.lineAt(lineNum).text.trim() === "") {
        return true;
      }
    }
    return false;
  }

  /**
   * 指定行の小節番号をASTから取得
   */
  private getMeasureNumberAtLine(root: any, lineNumber: number): number | undefined {
    // 指定した行を含むMeasureNodeを検索
    const measureNode = root.find(
      (x: any) =>
        x instanceof MeasureNode &&
        x.range.start.line <= lineNumber &&
        lineNumber <= x.range.end.line
    );

    return measureNode?.properties?.measure;
  }

  /**
   * 音符データの行かどうかをチェック
   */
  private isNoteDataLine(text: string): boolean {
    // 音符データ（数字、カンマ、改行記号）を含む行をチェック
    const notePattern = /^[0-9,\s]+$/;
    return notePattern.test(text.trim()) && text.trim().length > 0;
  }
}
