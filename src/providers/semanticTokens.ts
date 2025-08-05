import * as vscode from "vscode";
import { documents } from "../extension";
import { HeadersNode, MeasureEndNode, NoteNode, HeaderNode } from "../types/node";
import { Configs } from "../configs";

export const legend = new vscode.SemanticTokensLegend([
  "roll",
  "rollBig",
  "balloon",
  "balloonBig",
  "fuze",
  "gogo",
  "normal",
  "expert",
  "master",
  "gogoMeasureEnd",
  "header",
]);

// TODO vscode.window.createTextEditorDecorationTypeを使って色付けしたほうが速いかも？

/**
 * セマンティックトークンの付与
 */
export class DocumentSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
  async provideDocumentSemanticTokens(
    document?: vscode.TextDocument,
    token?: vscode.CancellationToken
  ): Promise<vscode.SemanticTokens> {
    const tokensBuilder = new vscode.SemanticTokensBuilder(legend);
    const config = new Configs();
    const gogotimeHighlight = config.gogotimeHighlight.get();
    const branchHighlight = config.branchHighlight.get();

    if (document === undefined) {
      return tokensBuilder.build();
    }

    const root = documents.parse(document, token);
    if (root === undefined) {
      return tokensBuilder.build();
    }
    const notes = root.filter<NoteNode>(
      (x) =>
        x instanceof NoteNode &&
        (((x.properties.isGogotime === true || x.properties.branchState !== "None") &&
          x.value === "0") ||
          x.properties.rollState !== "None"),
      { return: (x) => x instanceof HeadersNode, continue: true, token }
    );
    for (const note of notes) {
      if (token?.isCancellationRequested) {
        return tokensBuilder.build();
      }
      if (note.properties.rollState === "None" && note.value === "0") {
        if (note.properties.isGogotime && gogotimeHighlight) {
          tokensBuilder.push(note.range, "gogo");
        } else if (branchHighlight) {
          if (note.properties.branchState === "Normal") {
            tokensBuilder.push(note.range, "normal");
          } else if (note.properties.branchState === "Expert") {
            tokensBuilder.push(note.range, "expert");
          } else if (note.properties.branchState === "Master") {
            tokensBuilder.push(note.range, "master");
          }
        }
      } else if (note.properties.rollState === "Roll") {
        tokensBuilder.push(note.range, "roll");
      } else if (note.properties.rollState === "RollBig") {
        tokensBuilder.push(note.range, "rollBig");
      } else if (note.properties.rollState === "Balloon") {
        tokensBuilder.push(note.range, "balloon");
      } else if (note.properties.rollState === "BalloonBig") {
        tokensBuilder.push(note.range, "balloonBig");
      } else if (note.properties.rollState === "Fuze") {
        tokensBuilder.push(note.range, "fuze");
      }
    }
    if (branchHighlight) {
      const measureEnds = root.filter(
        (x) => x instanceof MeasureEndNode && x.properties.isGogotime === true,
        { return: (x) => x instanceof HeadersNode, continue: false, token }
      );
      for (const measureEnd of measureEnds) {
        tokensBuilder.push(measureEnd.range, "gogoMeasureEnd");
      }
    }

    // ヘッダーのハイライト処理（正規のHeaderNodeのヘッダー名部分のみ）
    const headerNodes = root.filter<HeaderNode>((x) => x instanceof HeaderNode, {
      return: () => false,
      continue: true,
      token,
    });
    for (const headerNode of headerNodes) {
      if (token?.isCancellationRequested) {
        return tokensBuilder.build();
      }
      // ヘッダー名の部分のみをハイライト（コロンとパラメーターは完全に除外）
      const line = document.lineAt(headerNode.range.start.line).text;
      const headerMatch = line.match(/^\s*([A-Z0-9]+):/);
      if (headerMatch) {
        const headerName = headerMatch[1];
        const whitespaceMatch = line.match(/^(\s*)/);
        const leadingWhitespace = whitespaceMatch ? whitespaceMatch[1].length : 0;
        const headerNameRange = new vscode.Range(
          headerNode.range.start.line,
          leadingWhitespace,
          headerNode.range.start.line,
          leadingWhitespace + headerName.length
        );
        tokensBuilder.push(headerNameRange, "header");
      }
    }

    return tokensBuilder.build();
  }
}
