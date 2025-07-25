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
import {
  CancellationToken,
  Position,
  Range,
  RenameProvider,
  TextDocument,
  WorkspaceEdit,
} from "vscode";
import { getRegExp } from "../types/statement";

type NewType = CancellationToken;

export class BalloonParameterRenameProvider implements RenameProvider {
  async provideRenameEdits(
    document: TextDocument,
    position: Position,
    newName: string,
    token: NewType
  ): Promise<WorkspaceEdit | undefined> {
    if (!/^\d+$/.test(newName)) {
      throw new Error("風船音符の打数は整数で入力してください");
    }

    const root = documents.parse(document, token);
    if (!root) {
      return undefined;
    }

    // Try to find balloon header parameter first
    const balloonHeaderResult = this.findBalloonHeaderParameter(document, position, root, token);
    if (balloonHeaderResult) {
      const workspaceEdit = new WorkspaceEdit();
      workspaceEdit.replace(document.uri, balloonHeaderResult.range, newName);
      return workspaceEdit;
    }

    // Try to find balloon note
    const balloonNoteResult = this.findBalloonNote(document, position, root, token);
    if (balloonNoteResult) {
      const workspaceEdit = new WorkspaceEdit();
      workspaceEdit.replace(document.uri, balloonNoteResult.parameterRange, newName);
      return workspaceEdit;
    }

    // Try to find balloon note without parameter (parameter needs to be added)
    const balloonNoteWithoutParam = this.findBalloonNoteWithoutParameter(
      document,
      position,
      root,
      token
    );
    if (balloonNoteWithoutParam) {
      const workspaceEdit = new WorkspaceEdit();

      // Add balloon parameter at the correct index position
      const targetIndex = balloonNoteWithoutParam.balloonNote.properties.note.balloonId;
      if (targetIndex === undefined) {
        return undefined;
      }

      // Check if there are any meaningful parameters (non-empty values)
      const meaningfulParameters = balloonNoteWithoutParam.existingParameters.filter(
        (param) => param.value.trim() !== ""
      );

      if (meaningfulParameters.length === 0) {
        // No parameters exist, add first parameter
        const headerLine = document.lineAt(
          balloonNoteWithoutParam.balloonHeader.range.start.line
        ).text;
        const headerStartChar = balloonNoteWithoutParam.balloonHeader.range.start.character;
        const headerText = headerLine.substring(headerStartChar);

        // Find colon position in the header text
        const colonIndex = headerText.indexOf(":");

        if (colonIndex !== -1) {
          // Colon exists, insert after it
          const insertPosition = new Position(
            balloonNoteWithoutParam.balloonHeader.range.start.line,
            headerStartChar + colonIndex + 1
          );

          // Add empty parameters up to the target index if needed
          const parameterValues = Array(targetIndex).fill("").concat([newName]);
          workspaceEdit.insert(document.uri, insertPosition, parameterValues.join(","));
        } else {
          // No colon exists, add colon and parameters at the end of the header
          const insertPosition = balloonNoteWithoutParam.balloonHeader.range.end;
          const parameterValues = Array(targetIndex).fill("").concat([newName]);
          workspaceEdit.insert(document.uri, insertPosition, `:${parameterValues.join(",")}`);
        }
      } else {
        // Parameters exist, need to insert at the correct position
        const maxExistingIndex = Math.max(
          ...balloonNoteWithoutParam.existingParameters.map((p) => p.properties.index)
        );

        if (targetIndex <= maxExistingIndex) {
          // Insert in the middle - need to find the right position
          const sortedParams = balloonNoteWithoutParam.existingParameters.sort(
            (a, b) => a.properties.index - b.properties.index
          );
          let insertPosition: Position;

          // Find where to insert
          const insertAfterParam = sortedParams.find(
            (p) =>
              p.properties.index < targetIndex &&
              (!sortedParams.find((next) => next.properties.index === p.properties.index + 1) ||
                sortedParams.find((next) => next.properties.index > targetIndex))
          );

          if (insertAfterParam) {
            insertPosition = insertAfterParam.range.end;
          } else {
            // Insert at the beginning
            insertPosition = sortedParams[0].range.start;
          }

          // Calculate how many commas and empty values we need
          const gapsToFill =
            targetIndex - (insertAfterParam ? insertAfterParam.properties.index + 1 : 0);
          const insertText =
            (insertAfterParam ? "," : "") +
            Array(gapsToFill).fill("").join(",") +
            (gapsToFill > 0 ? "," : "") +
            newName;
          workspaceEdit.insert(document.uri, insertPosition, insertText);
        } else {
          // Append at the end with gaps if needed
          const lastParam =
            balloonNoteWithoutParam.existingParameters[
              balloonNoteWithoutParam.existingParameters.length - 1
            ];
          const gapsToFill = targetIndex - maxExistingIndex - 1;
          const insertText =
            "," + Array(gapsToFill).fill("").join(",") + (gapsToFill > 0 ? "," : "") + newName;
          workspaceEdit.insert(document.uri, lastParam.range.end, insertText);
        }
      }

      return workspaceEdit;
    }

    // Try to find balloon note without header (header needs to be created)
    const balloonNoteWithoutHeader = this.findBalloonNoteWithoutHeader(
      document,
      position,
      root,
      token
    );
    if (balloonNoteWithoutHeader) {
      const workspaceEdit = new WorkspaceEdit();

      // Create new balloon header
      const headerName = this.getBalloonHeaderName(balloonNoteWithoutHeader.balloonNote);
      const insertPosition = balloonNoteWithoutHeader.insertPosition;
      workspaceEdit.insert(document.uri, insertPosition, `${headerName}:${newName}\n`);

      return workspaceEdit;
    }

    return undefined;
  }

  private findBalloonHeaderParameter(
    document: TextDocument,
    position: Position,
    root: RootNode,
    token: CancellationToken
  ): { range: Range } | undefined {
    const wordRange = document.getWordRangeAtPosition(position, /[0-9]+/);
    if (!wordRange) {
      return undefined;
    }

    const balloonHeader = root.find<HeaderNode>(
      (x) =>
        x instanceof HeaderNode &&
        x.range.contains(position) &&
        (getRegExp(headers.items.balloon).test(x.properties.name) ||
          getRegExp(headers.items.balloonnor).test(x.properties.name) ||
          getRegExp(headers.items.balloonexp).test(x.properties.name) ||
          getRegExp(headers.items.balloonmas).test(x.properties.name)),
      { token }
    );

    if (!balloonHeader) {
      return undefined;
    }

    const parameterNode = balloonHeader.find<ParameterNode>(
      (x) => x instanceof ParameterNode && x.range.contains(position),
      { token }
    );

    if (!parameterNode) {
      return undefined;
    }

    return { range: parameterNode.range };
  }

  private findBalloonNote(
    document: TextDocument,
    position: Position,
    root: RootNode,
    token: CancellationToken
  ): { parameterRange: Range } | undefined {
    const wordRange = document.getWordRangeAtPosition(position, /([79]0*8?|0*8|0+)/);
    if (!wordRange) {
      return undefined;
    }

    // Find all balloon notes that contain the cursor position
    const candidateNotes = root.filter<NoteNode>(
      (x) =>
        x instanceof NoteNode &&
        x.range.contains(position) &&
        x.properties.note.balloonId !== undefined,
      { token }
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

    const style = balloonNote.findParent<StyleNode>((x) => x instanceof StyleNode, { token });
    if (!style) {
      return undefined;
    }

    // Find corresponding balloon header
    const balloonHeader = style.find<HeaderNode>(
      (x) =>
        x instanceof HeaderNode &&
        ((balloonNote.properties.branchState === "None" &&
          getRegExp(headers.items.balloon).test(x.properties.name)) ||
          (balloonNote.properties.branchState === "Normal" &&
            getRegExp(headers.items.balloonnor).test(x.properties.name)) ||
          (balloonNote.properties.branchState === "Expert" &&
            getRegExp(headers.items.balloonexp).test(x.properties.name)) ||
          (balloonNote.properties.branchState === "Master" &&
            getRegExp(headers.items.balloonmas).test(x.properties.name))),
      { token }
    );

    if (!balloonHeader) {
      return undefined;
    }

    // Find parameter by balloonId using the parameter's index property
    const balloonParameter = balloonHeader.find<ParameterNode>(
      (x) =>
        x instanceof ParameterNode && x.properties.index === balloonNote.properties.note.balloonId,
      { token }
    );

    if (!balloonParameter || balloonParameter.value.trim() === "") {
      return undefined;
    }
    return { parameterRange: balloonParameter.range };
  }

  private findBalloonNoteWithoutParameter(
    document: TextDocument,
    position: Position,
    root: RootNode,
    token: CancellationToken
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
        x.properties.note.balloonId !== undefined,
      { token }
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

    const style = balloonNote.findParent<StyleNode>((x) => x instanceof StyleNode, { token });
    if (!style) {
      return undefined;
    }

    // Find corresponding balloon header
    const balloonHeader = style.find<HeaderNode>(
      (x) =>
        x instanceof HeaderNode &&
        ((balloonNote.properties.branchState === "None" &&
          getRegExp(headers.items.balloon).test(x.properties.name)) ||
          (balloonNote.properties.branchState === "Normal" &&
            getRegExp(headers.items.balloonnor).test(x.properties.name)) ||
          (balloonNote.properties.branchState === "Expert" &&
            getRegExp(headers.items.balloonexp).test(x.properties.name)) ||
          (balloonNote.properties.branchState === "Master" &&
            getRegExp(headers.items.balloonmas).test(x.properties.name))),
      { token }
    );

    if (!balloonHeader) {
      return undefined;
    }

    // Check if this balloon note's parameter already exists and has a meaningful value
    const existingParameter = balloonHeader.find<ParameterNode>(
      (x) =>
        x instanceof ParameterNode &&
        x.properties.index === balloonNote.properties.note.balloonId &&
        x.value.trim() !== "",
      { token }
    );
    if (existingParameter) {
      return undefined; // Parameter already exists with a value
    }

    const balloonParameters = balloonHeader.filter<ParameterNode>(
      (x) => x instanceof ParameterNode,
      { token }
    );

    return {
      balloonHeader: balloonHeader,
      existingParameters: balloonParameters,
      balloonNote: balloonNote,
    };
  }

  private findBalloonNoteWithoutHeader(
    document: TextDocument,
    position: Position,
    root: RootNode,
    token: CancellationToken
  ): { balloonNote: NoteNode; insertPosition: Position } | undefined {
    const wordRange = document.getWordRangeAtPosition(position, /([79]0*8?|0*8|0+)/);
    if (!wordRange) {
      return undefined;
    }

    // Find all balloon notes that contain the cursor position
    const candidateNotes = root.filter<NoteNode>(
      (x) =>
        x instanceof NoteNode &&
        x.range.contains(position) &&
        x.properties.note.balloonId !== undefined,
      { token }
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

    const style = balloonNote.findParent<StyleNode>((x) => x instanceof StyleNode, { token });
    if (!style) {
      return undefined;
    }

    // Check if corresponding balloon header exists
    const balloonHeader = style.find<HeaderNode>(
      (x) =>
        x instanceof HeaderNode &&
        ((balloonNote.properties.branchState === "None" &&
          getRegExp(headers.items.balloon).test(x.properties.name)) ||
          (balloonNote.properties.branchState === "Normal" &&
            getRegExp(headers.items.balloonnor).test(x.properties.name)) ||
          (balloonNote.properties.branchState === "Expert" &&
            getRegExp(headers.items.balloonexp).test(x.properties.name)) ||
          (balloonNote.properties.branchState === "Master" &&
            getRegExp(headers.items.balloonmas).test(x.properties.name))),
      { token }
    );

    if (balloonHeader) {
      return undefined; // Header already exists
    }

    // Find where to insert the header - after the last header in the style
    const styleHeaders = style.find<StyleHeadersNode>((x) => x instanceof StyleHeadersNode, {
      token,
    });
    let insertPosition: Position;

    if (styleHeaders && styleHeaders.children.length > 0) {
      // Insert after the last header
      const lastHeader = styleHeaders.children[styleHeaders.children.length - 1];
      insertPosition = new Position(lastHeader.range.end.line + 1, 0);
    } else {
      // Insert at the beginning of the style
      insertPosition = new Position(style.range.start.line + 1, 0);
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
    document: TextDocument,
    position: Position,
    token: CancellationToken
  ): Promise<Range | { range: Range; placeholder: string }> {
    const root = documents.parse(document, token);
    if (!root) {
      throw new Error("ファイルの解析に失敗しました");
    }

    // Try to find balloon header parameter first
    const balloonHeaderResult = this.findBalloonHeaderParameter(document, position, root, token);
    if (balloonHeaderResult) {
      const parameterNode = root.find<ParameterNode>(
        (x) => x instanceof ParameterNode && x.range.contains(position),
        { token }
      );
      return {
        range: balloonHeaderResult.range,
        placeholder: parameterNode?.value || "",
      };
    }

    // Try to find balloon note
    const balloonNoteResult = this.findBalloonNote(document, position, root, token);
    if (balloonNoteResult) {
      // Find all balloon notes that contain the cursor position
      const candidateNotes = root.filter<NoteNode>(
        (x) =>
          x instanceof NoteNode &&
          x.range.contains(position) &&
          x.properties.note.balloonId !== undefined,
        { token }
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

      const style = balloonNote?.findParent<StyleNode>((x) => x instanceof StyleNode, { token });
      if (!style || !balloonNote || balloonNote.properties.note.balloonId === undefined) {
        throw new Error("風船音符の打数パラメータではありません");
      }

      const balloonHeader = style.find<HeaderNode>(
        (x) =>
          x instanceof HeaderNode &&
          ((balloonNote.properties.branchState === "None" &&
            getRegExp(headers.items.balloon).test(x.properties.name)) ||
            (balloonNote.properties.branchState === "Normal" &&
              getRegExp(headers.items.balloonnor).test(x.properties.name)) ||
            (balloonNote.properties.branchState === "Expert" &&
              getRegExp(headers.items.balloonexp).test(x.properties.name)) ||
            (balloonNote.properties.branchState === "Master" &&
              getRegExp(headers.items.balloonmas).test(x.properties.name))),
        { token }
      );

      if (!balloonHeader) {
        throw new Error("対応する風船音符ヘッダーが見つかりません");
      }

      // Find parameter by balloonId using the parameter's index property
      const balloonParameter = balloonHeader.find<ParameterNode>(
        (x) =>
          x instanceof ParameterNode &&
          x.properties.index === balloonNote.properties.note.balloonId,
        { token }
      );
      if (!balloonParameter) {
        throw new Error("風船音符のパラメータが見つかりません");
      }
      return {
        range: balloonNote.range,
        placeholder: balloonParameter.value || " ",
      };
    }

    // Try to find balloon note without parameter (allow editing to add parameter)
    const balloonNoteWithoutParam = this.findBalloonNoteWithoutParameter(
      document,
      position,
      root,
      token
    );
    if (balloonNoteWithoutParam) {
      return {
        range: balloonNoteWithoutParam.balloonNote.range,
        placeholder: " ",
      };
    }

    // Try to find balloon note without header (allow editing to create header)
    const balloonNoteWithoutHeader = this.findBalloonNoteWithoutHeader(
      document,
      position,
      root,
      token
    );
    if (balloonNoteWithoutHeader) {
      return {
        range: balloonNoteWithoutHeader.balloonNote.range,
        placeholder: " ",
      };
    }

    throw new Error("風船音符ではありません");
  }
}
