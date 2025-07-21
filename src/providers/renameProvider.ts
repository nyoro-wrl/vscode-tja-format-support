import * as vscode from "vscode";
import { headers } from "../constants/headers";
import { documents } from "../extension";
import {
  HeaderNode,
  ParameterNode,
  StyleNode,
  NoteNode,
  RootNode,
  StyleHeadersNode,
} from "../types/node";

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

    // Try to find balloon note without parameter (parameter needs to be added)
    const balloonNoteWithoutParam = this.findBalloonNoteWithoutParameter(document, position, root);
    if (balloonNoteWithoutParam) {
      const workspaceEdit = new vscode.WorkspaceEdit();

      // Add or extend balloon parameter in header
      if (balloonNoteWithoutParam.existingParameters.length === 0) {
        // No parameters exist, add first parameter
        const headerEndPosition = balloonNoteWithoutParam.balloonHeader.range.end;
        workspaceEdit.insert(document.uri, headerEndPosition, `:${newName}`);
      } else {
        // Parameters exist, extend with new parameter
        const lastParam =
          balloonNoteWithoutParam.existingParameters[
            balloonNoteWithoutParam.existingParameters.length - 1
          ];
        workspaceEdit.insert(document.uri, lastParam.range.end, `,${newName}`);
      }

      return workspaceEdit;
    }

    // Try to find balloon note without header (header needs to be created)
    const balloonNoteWithoutHeader = this.findBalloonNoteWithoutHeader(document, position, root);
    if (balloonNoteWithoutHeader) {
      const workspaceEdit = new vscode.WorkspaceEdit();

      // Create new balloon header
      const headerName = this.getBalloonHeaderName(balloonNoteWithoutHeader.balloonNote);
      const insertPosition = balloonNoteWithoutHeader.insertPosition;
      workspaceEdit.insert(document.uri, insertPosition, `${headerName}:${newName}\n`);

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

    // Find all balloon notes that contain the cursor position
    const candidateNotes = root.filter<NoteNode>(
      (x) =>
        x instanceof NoteNode &&
        x.range.contains(position) &&
        x.properties.note.balloonId !== undefined
    );

    if (candidateNotes.length === 0) {
      return undefined;
    }

    // If multiple candidates exist, choose the one closest to cursor position
    let balloonNote = candidateNotes[0];
    if (candidateNotes.length > 1) {
      // Find the note whose range is closest to the cursor position
      let minDistance = Math.abs(position.character - candidateNotes[0].range.start.character);

      for (let i = 1; i < candidateNotes.length; i++) {
        const distance = Math.abs(position.character - candidateNotes[i].range.start.character);
        if (distance < minDistance) {
          minDistance = distance;
          balloonNote = candidateNotes[i];
        }
      }
    }

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

  private findBalloonNoteWithoutParameter(
    document: vscode.TextDocument,
    position: vscode.Position,
    root: RootNode
  ):
    | { balloonHeader: HeaderNode; existingParameters: ParameterNode[]; balloonNote: NoteNode }
    | undefined {
    const wordRange = document.getWordRangeAtPosition(position, /([79]0*8?|0*8|0+)/);
    if (!wordRange) {
      return undefined;
    }

    // Find all balloon notes that contain the cursor position
    const candidateNotes = root.filter<NoteNode>(
      (x) =>
        x instanceof NoteNode &&
        x.range.contains(position) &&
        x.properties.note.balloonId !== undefined
    );

    if (candidateNotes.length === 0) {
      return undefined;
    }

    // If multiple candidates exist, choose the one closest to cursor position
    let balloonNote = candidateNotes[0];
    if (candidateNotes.length > 1) {
      // Find the note whose range is closest to the cursor position
      let minDistance = Math.abs(position.character - candidateNotes[0].range.start.character);
      for (let i = 1; i < candidateNotes.length; i++) {
        const distance = Math.abs(position.character - candidateNotes[i].range.start.character);
        if (distance < minDistance) {
          minDistance = distance;
          balloonNote = candidateNotes[i];
        }
      }
    }

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

    // Check if this balloon note's parameter doesn't exist
    if (balloonParameters.length > balloonNote.properties.note.balloonId) {
      return undefined; // Parameter already exists
    }

    return {
      balloonHeader: balloonHeader,
      existingParameters: balloonParameters,
      balloonNote: balloonNote,
    };
  }

  private findBalloonNoteWithoutHeader(
    document: vscode.TextDocument,
    position: vscode.Position,
    root: RootNode
  ): { balloonNote: NoteNode; insertPosition: vscode.Position } | undefined {
    const wordRange = document.getWordRangeAtPosition(position, /([79]0*8?|0*8|0+)/);
    if (!wordRange) {
      return undefined;
    }

    // Find all balloon notes that contain the cursor position
    const candidateNotes = root.filter<NoteNode>(
      (x) =>
        x instanceof NoteNode &&
        x.range.contains(position) &&
        x.properties.note.balloonId !== undefined
    );

    if (candidateNotes.length === 0) {
      return undefined;
    }

    // If multiple candidates exist, choose the one closest to cursor position
    let balloonNote = candidateNotes[0];
    if (candidateNotes.length > 1) {
      // Find the note whose range is closest to the cursor position
      let minDistance = Math.abs(position.character - candidateNotes[0].range.start.character);
      for (let i = 1; i < candidateNotes.length; i++) {
        const distance = Math.abs(position.character - candidateNotes[i].range.start.character);
        if (distance < minDistance) {
          minDistance = distance;
          balloonNote = candidateNotes[i];
        }
      }
    }

    if (!balloonNote || balloonNote.properties.note.balloonId === undefined) {
      return undefined;
    }

    const style = balloonNote.findParent<StyleNode>((x) => x instanceof StyleNode);
    if (!style) {
      return undefined;
    }

    // Check if corresponding balloon header exists
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

    if (balloonHeader) {
      return undefined; // Header already exists
    }

    // Find where to insert the header - after the last header in the style
    const styleHeaders = style.find<StyleHeadersNode>((x) => x instanceof StyleHeadersNode);
    let insertPosition: vscode.Position;

    if (styleHeaders && styleHeaders.children.length > 0) {
      // Insert after the last header
      const lastHeader = styleHeaders.children[styleHeaders.children.length - 1];
      insertPosition = new vscode.Position(lastHeader.range.end.line + 1, 0);
    } else {
      // Insert at the beginning of the style
      insertPosition = new vscode.Position(style.range.start.line + 1, 0);
    }

    return {
      balloonNote: balloonNote,
      insertPosition: insertPosition,
    };
  }

  private getBalloonHeaderName(balloonNote: NoteNode): string {
    switch (balloonNote.properties.branchState) {
      case "Normal":
        return "BALLOONNOR";
      case "Expert":
        return "BALLOONEXP";
      case "Master":
        return "BALLOONMAS";
      default:
        return "BALLOON";
    }
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
      // Find all balloon notes that contain the cursor position
      const candidateNotes = root.filter<NoteNode>(
        (x) =>
          x instanceof NoteNode &&
          x.range.contains(position) &&
          x.properties.note.balloonId !== undefined
      );

      if (candidateNotes.length === 0) {
        throw new Error("風船音符の打数パラメータではありません");
      }

      // If multiple candidates exist, choose the one closest to cursor position
      let balloonNote = candidateNotes[0];
      if (candidateNotes.length > 1) {
        // Find the note whose range is closest to the cursor position
        let minDistance = Math.abs(position.character - candidateNotes[0].range.start.character);
        for (let i = 1; i < candidateNotes.length; i++) {
          const distance = Math.abs(position.character - candidateNotes[i].range.start.character);
          if (distance < minDistance) {
            minDistance = distance;
            balloonNote = candidateNotes[i];
          }
        }
      }

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

    // Try to find balloon note without parameter (allow editing to add parameter)
    const balloonNoteWithoutParam = this.findBalloonNoteWithoutParameter(document, position, root);
    if (balloonNoteWithoutParam) {
      return {
        range: balloonNoteWithoutParam.balloonNote.range,
        placeholder: " ",
      };
    }

    // Try to find balloon note without header (allow editing to create header)
    const balloonNoteWithoutHeader = this.findBalloonNoteWithoutHeader(document, position, root);
    if (balloonNoteWithoutHeader) {
      return {
        range: balloonNoteWithoutHeader.balloonNote.range,
        placeholder: " ",
      };
    }

    throw new Error("風船音符ではありません");
  }
}
