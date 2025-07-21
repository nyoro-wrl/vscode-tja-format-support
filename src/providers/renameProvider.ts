import * as vscode from "vscode";
import { headers } from "../constants/headers";
import { documents } from "../extension";
import { HeaderNode, ParameterNode, StyleNode, NoteNode, RootNode } from "../types/node";

export class BalloonParameterRenameProvider implements vscode.RenameProvider {
  async provideRenameEdits(
    document: vscode.TextDocument,
    position: vscode.Position,
    newName: string,
    token: vscode.CancellationToken
  ): Promise<vscode.WorkspaceEdit | undefined> {
    if (!/^\d+$/.test(newName)) {
      throw new Error("風船音符の打数は整数で入力してください");
    }

    const root = documents.parse(document, token);
    if (!root) {
      return undefined;
    }

    // Try to find balloon header parameter first
    const balloonHeaderResult = this.findBalloonHeaderParameter(document, position, root);
    if (balloonHeaderResult) {
      const workspaceEdit = new vscode.WorkspaceEdit();
      workspaceEdit.replace(document.uri, balloonHeaderResult.range, newName);
      return workspaceEdit;
    }

    // Try to find balloon note
    const balloonNoteResult = this.findBalloonNote(document, position, root);
    if (balloonNoteResult) {
      const workspaceEdit = new vscode.WorkspaceEdit();
      workspaceEdit.replace(document.uri, balloonNoteResult.parameterRange, newName);
      return workspaceEdit;
    }

    return undefined;
  }

  private findBalloonHeaderParameter(
    document: vscode.TextDocument,
    position: vscode.Position,
    root: RootNode
  ): { range: vscode.Range } | undefined {
    const wordRange = document.getWordRangeAtPosition(position, /[0-9]+/);
    if (!wordRange) {
      return undefined;
    }

    const balloonHeader = root.find<HeaderNode>(
      (x) =>
        x instanceof HeaderNode &&
        x.range.contains(position) &&
        (headers.items.balloon.regexp.test(x.properties.name) ||
          headers.items.balloonnor.regexp.test(x.properties.name) ||
          headers.items.balloonexp.regexp.test(x.properties.name) ||
          headers.items.balloonmas.regexp.test(x.properties.name))
    );

    if (!balloonHeader) {
      return undefined;
    }

    const parameterNode = balloonHeader.find<ParameterNode>(
      (x) => x instanceof ParameterNode && x.range.contains(position)
    );

    if (!parameterNode) {
      return undefined;
    }

    return { range: parameterNode.range };
  }

  private findBalloonNote(
    document: vscode.TextDocument,
    position: vscode.Position,
    root: RootNode
  ): { parameterRange: vscode.Range } | undefined {
    const wordRange = document.getWordRangeAtPosition(position, /([79]0*8?|0*8|0+)/);
    if (!wordRange) {
      return undefined;
    }

    const balloonNote = root.find<NoteNode>(
      (x) =>
        x instanceof NoteNode &&
        x.range.contains(position) &&
        x.properties.note.balloonId !== undefined
    );

    if (!balloonNote || balloonNote.properties.note.balloonId === undefined) {
      return undefined;
    }

    const style = balloonNote.findParent<StyleNode>((x) => x instanceof StyleNode);
    if (!style) {
      return undefined;
    }

    // Find corresponding balloon header
    const balloonHeader = style.find<HeaderNode>(
      (x) =>
        x instanceof HeaderNode &&
        ((balloonNote.properties.branchState === "None" &&
          headers.items.balloon.regexp.test(x.properties.name)) ||
          (balloonNote.properties.branchState === "Normal" &&
            headers.items.balloonnor.regexp.test(x.properties.name)) ||
          (balloonNote.properties.branchState === "Expert" &&
            headers.items.balloonexp.regexp.test(x.properties.name)) ||
          (balloonNote.properties.branchState === "Master" &&
            headers.items.balloonmas.regexp.test(x.properties.name)))
    );

    if (!balloonHeader) {
      return undefined;
    }

    const balloonParameters = balloonHeader.filter<ParameterNode>(
      (x) => x instanceof ParameterNode
    );
    if (balloonParameters.length <= balloonNote.properties.note.balloonId) {
      return undefined;
    }

    const balloonParameter = balloonParameters[balloonNote.properties.note.balloonId];
    return { parameterRange: balloonParameter.range };
  }

  async prepareRename(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Range | { range: vscode.Range; placeholder: string }> {
    const root = documents.parse(document, token);
    if (!root) {
      throw new Error("ファイルの解析に失敗しました");
    }

    // Try to find balloon header parameter first
    const balloonHeaderResult = this.findBalloonHeaderParameter(document, position, root);
    if (balloonHeaderResult) {
      const parameterNode = root.find<ParameterNode>(
        (x) => x instanceof ParameterNode && x.range.contains(position)
      );
      return {
        range: balloonHeaderResult.range,
        placeholder: parameterNode?.value || "",
      };
    }

    // Try to find balloon note
    const balloonNoteResult = this.findBalloonNote(document, position, root);
    if (balloonNoteResult) {
      const balloonNote = root.find<NoteNode>(
        (x) =>
          x instanceof NoteNode &&
          x.range.contains(position) &&
          x.properties.note.balloonId !== undefined
      );

      const style = balloonNote?.findParent<StyleNode>((x) => x instanceof StyleNode);
      if (!style || !balloonNote || balloonNote.properties.note.balloonId === undefined) {
        throw new Error("風船音符の打数パラメータではありません");
      }

      const balloonHeader = style.find<HeaderNode>(
        (x) =>
          x instanceof HeaderNode &&
          ((balloonNote.properties.branchState === "None" &&
            headers.items.balloon.regexp.test(x.properties.name)) ||
            (balloonNote.properties.branchState === "Normal" &&
              headers.items.balloonnor.regexp.test(x.properties.name)) ||
            (balloonNote.properties.branchState === "Expert" &&
              headers.items.balloonexp.regexp.test(x.properties.name)) ||
            (balloonNote.properties.branchState === "Master" &&
              headers.items.balloonmas.regexp.test(x.properties.name)))
      );

      if (!balloonHeader) {
        throw new Error("対応する風船音符ヘッダが見つかりません");
      }

      const balloonParameters = balloonHeader.filter<ParameterNode>(
        (x) => x instanceof ParameterNode
      );
      if (balloonParameters.length <= balloonNote.properties.note.balloonId) {
        throw new Error("風船音符のパラメータが見つかりません");
      }

      const balloonParameter = balloonParameters[balloonNote.properties.note.balloonId];
      return {
        range: balloonNote.range,
        placeholder: balloonParameter.value,
      };
    }

    throw new Error("風船音符の打数パラメータではありません");
  }
}
