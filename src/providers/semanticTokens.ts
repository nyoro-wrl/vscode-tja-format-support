import * as vscode from "vscode";
import { DocumentSemanticTokensProvider, SemanticTokensLegend } from "vscode";
import { documents } from "../extension";
import { MeasureEndNode, NoteNode } from "../types/node";

export const legend = new SemanticTokensLegend([
  "roll",
  "rollBig",
  "balloon",
  "balloonBig",
  "gogo",
  "normal",
  "expert",
  "master",
  "gogoMeasureEnd",
]);

export class DefaultDocumentSemanticTokensProvider implements DocumentSemanticTokensProvider {
  provideDocumentSemanticTokens(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.SemanticTokens> {
    const tokensBuilder = new vscode.SemanticTokensBuilder(legend);
    const root = documents.parse(document);
    const notes = root.filter<NoteNode>(
      (x) =>
        x instanceof NoteNode &&
        (((x.properties.isGogotime === true || x.properties.branchState !== "None") &&
          x.value === "0") ||
          x.properties.rollState !== "None")
    );
    for (const note of notes) {
      if (note.properties.rollState === "None" && note.value === "0") {
        if (note.properties.isGogotime) {
          tokensBuilder.push(note.range, "gogo");
        } else if (note.properties.branchState === "Normal") {
          tokensBuilder.push(note.range, "normal");
        } else if (note.properties.branchState === "Expert") {
          tokensBuilder.push(note.range, "expert");
        } else if (note.properties.branchState === "Master") {
          tokensBuilder.push(note.range, "master");
        }
      } else if (note.properties.rollState === "Roll") {
        tokensBuilder.push(note.range, "roll");
      } else if (note.properties.rollState === "RollBig") {
        tokensBuilder.push(note.range, "rollBig");
      } else if (note.properties.rollState === "Balloon") {
        tokensBuilder.push(note.range, "balloon");
      } else if (note.properties.rollState === "BalloonBig") {
        tokensBuilder.push(note.range, "balloonBig");
      }
    }
    const measureEnds = root.filter(
      (x) => x instanceof MeasureEndNode && x.properties.isGogotime === true
    );
    for (const measureEnd of measureEnds) {
      tokensBuilder.push(measureEnd.range, "gogoMeasureEnd");
    }
    return tokensBuilder.build();
  }
}
