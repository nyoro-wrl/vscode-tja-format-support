import * as vscode from "vscode";
import { documents } from "../extension";
import { NoteNode } from "../types/node";

export class TjaCodeActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

  async provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeAction[]> {
    const actions: vscode.CodeAction[] = [];

    // 風船音符の打数未定義の警告をチェック
    for (const diagnostic of context.diagnostics) {
      if (token.isCancellationRequested) {
        return actions;
      }
      if (diagnostic.message.startsWith("打数が定義されていません。")) {
        const action = this.createBalloonParameterQuickFix(document, diagnostic, token);
        if (action) {
          actions.push(action);
        }
      } else if (diagnostic.message === "風船音符がありません。") {
        const action = this.createUnusedBalloonParameterQuickFix(document, diagnostic);
        if (action) {
          actions.push(action);
        }
      } else if (diagnostic.message === "#END がありません。") {
        const action = this.createEndCommandQuickFix(document, diagnostic);
        if (action) {
          actions.push(action);
        }
      } else if (diagnostic.code === "redundant-command") {
        const action = this.createRedundantCommandQuickFix(document, diagnostic);
        if (action) {
          actions.push(action);
        }
      }
    }

    return actions;
  }

  private createBalloonParameterQuickFix(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic,
    token: vscode.CancellationToken
  ): vscode.CodeAction | undefined {
    const root = documents.parse(document, token);
    if (!root) {
      return undefined;
    }

    // Extract exact balloon note position and balloonId from diagnostic message
    const positionMatch = diagnostic.message.match(/\[(\d+):(\d+):(\d+)\]/);
    let balloonNote: NoteNode | undefined;

    if (positionMatch) {
      // Use exact position and balloonId from diagnostic message
      const line = parseInt(positionMatch[1]);
      const character = parseInt(positionMatch[2]);
      const balloonId = parseInt(positionMatch[3]);
      const exactPosition = new vscode.Position(line, character);

      // Find the specific balloon note with matching position and balloonId
      balloonNote = root.find<NoteNode>(
        (x) =>
          x instanceof NoteNode &&
          x.range.contains(exactPosition) &&
          x.properties.note.balloonId === balloonId,
        undefined,
        undefined,
        token
      );

      if (!balloonNote) {
        // Fallback: try with just position
        balloonNote = root.find<NoteNode>(
          (x) =>
            x instanceof NoteNode &&
            x.range.contains(exactPosition) &&
            x.properties.note.balloonId !== undefined,
          undefined,
          undefined,
          token
        );
      }
    } else {
      // Fallback: find balloon note at diagnostic range
      balloonNote = root.find<NoteNode>(
        (x) =>
          x instanceof NoteNode &&
          x.range.contains(diagnostic.range.start) &&
          x.properties.note.balloonId !== undefined,
        undefined,
        undefined,
        token
      );
    }

    if (!balloonNote) {
      return undefined;
    }

    const action = new vscode.CodeAction("風船音符の打数を設定", vscode.CodeActionKind.QuickFix);
    action.diagnostics = [diagnostic];

    // Create custom command to position cursor and trigger rename
    // Use the balloon note's center position to ensure we target the exact balloon note
    const targetPosition = new vscode.Position(
      balloonNote.range.start.line,
      balloonNote.range.start.character +
        Math.floor((balloonNote.range.end.character - balloonNote.range.start.character) / 2)
    );

    action.command = {
      command: "tja.balloonParameterQuickFix",
      title: "風船音符の打数を設定",
      arguments: [document.uri, targetPosition],
    };

    action.isPreferred = true;

    return action;
  }

  private createUnusedBalloonParameterQuickFix(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction | undefined {
    const action = new vscode.CodeAction("削除", vscode.CodeActionKind.QuickFix);
    action.diagnostics = [diagnostic];

    // Use the diagnostic range directly (which already includes the correct range)
    const edit = new vscode.WorkspaceEdit();
    edit.delete(document.uri, diagnostic.range);
    action.edit = edit;
    action.isPreferred = true;

    return action;
  }

  private createEndCommandQuickFix(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction | undefined {
    const action = new vscode.CodeAction("#END の作成", vscode.CodeActionKind.QuickFix);
    action.diagnostics = [diagnostic];

    // Insert #END at the line after the diagnostic position
    const edit = new vscode.WorkspaceEdit();
    const diagnosticLine = diagnostic.range.start.line;
    const insertPosition = new vscode.Position(diagnosticLine + 1, 0);
    const insertText = "\n#END";

    edit.insert(document.uri, insertPosition, insertText);
    action.edit = edit;
    action.isPreferred = true;

    return action;
  }

  private createRedundantCommandQuickFix(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction | undefined {
    const action = new vscode.CodeAction("不要な命令を削除", vscode.CodeActionKind.QuickFix);
    action.diagnostics = [diagnostic];

    // Calculate the range to delete (include the entire line)
    const lineStart = new vscode.Position(diagnostic.range.start.line, 0);
    const lineEnd = new vscode.Position(diagnostic.range.start.line + 1, 0);
    const deleteRange = new vscode.Range(lineStart, lineEnd);

    const edit = new vscode.WorkspaceEdit();
    edit.delete(document.uri, deleteRange);
    action.edit = edit;
    action.isPreferred = true;

    return action;
  }
}
