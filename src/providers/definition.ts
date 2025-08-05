import * as vscode from "vscode";
import { headers } from "../constants/headers";
import { documents } from "../extension";
import {
  NoteNode,
  HeaderNode,
  ParameterNode,
  StyleNode,
  HeadersNode,
  CommandNode,
  ChartNode,
} from "../types/node";
import { getRegExp } from "../types/statement";

/**
 * 風船打数から風船音符にジャンプ（雑実装）
 */
export class JumpBalloonNotesDefinitionProvider implements vscode.DefinitionProvider {
  async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Definition | vscode.LocationLink[]> {
    const wordRange = document.getWordRangeAtPosition(position, /[0-9]+/);
    if (wordRange === undefined) {
      return Promise.reject();
    }
    const root = documents.parse(document, token);
    if (root === undefined) {
      return Promise.reject();
    }
    const balloonHeader = root.find<HeaderNode>(
      (x) =>
        x instanceof HeaderNode &&
        x.range.contains(position) &&
        (getRegExp(headers.items.balloon).test(x.properties.name) ||
          getRegExp(headers.items.balloonnor).test(x.properties.name) ||
          getRegExp(headers.items.balloonexp).test(x.properties.name) ||
          getRegExp(headers.items.balloonmas).test(x.properties.name)),
      { return: (x) => x instanceof ChartNode, token }
    );
    if (balloonHeader === undefined) {
      return Promise.reject();
    }
    const parameterNode = balloonHeader.find<ParameterNode>(
      (x) => x instanceof ParameterNode && x.range.contains(position),
      { token }
    );
    if (parameterNode === undefined) {
      return Promise.reject();
    }
    const balloonId = parameterNode.properties.index;
    const styleNode = balloonHeader.findParent<StyleNode>((x) => x instanceof StyleNode, { token });
    if (styleNode === undefined) {
      return Promise.reject();
    }
    const balloonNotes = styleNode.find(
      (x) =>
        x instanceof NoteNode &&
        x.properties.note.balloonId !== undefined &&
        x.properties.note.balloonId === balloonId &&
        ((x.properties.branchState === "None" &&
          getRegExp(headers.items.balloon).test(balloonHeader.properties.name)) ||
          (x.properties.branchState === "Normal" &&
            getRegExp(headers.items.balloonnor).test(balloonHeader.properties.name)) ||
          (x.properties.branchState === "Expert" &&
            getRegExp(headers.items.balloonexp).test(balloonHeader.properties.name)) ||
          (x.properties.branchState === "Master" &&
            getRegExp(headers.items.balloonmas).test(balloonHeader.properties.name))),
      { return: (x) => x instanceof HeadersNode || x instanceof CommandNode, token }
    );
    if (balloonNotes === undefined) {
      return Promise.reject();
    }
    const balloonRange = document.getWordRangeAtPosition(balloonNotes.range.end, /([79D]0*8?)/);
    if (balloonRange === undefined) {
      return Promise.reject();
    }
    const location = new vscode.Location(document.uri, balloonRange);
    return Promise.resolve(location);
  }
}

/**
 * 風船音符から風船打数にジャンプ（雑実装）
 */
export class JumpBalloonParameterDefinitionProvider implements vscode.DefinitionProvider {
  async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Definition | vscode.LocationLink[]> {
    const wordRange = document.getWordRangeAtPosition(position, /([79D]0*8?|0*8|0+)/);
    if (wordRange === undefined) {
      return Promise.reject();
    }

    const root = documents.parse(document, token);
    if (root === undefined) {
      return Promise.reject();
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
      return Promise.reject();
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
    const style = balloonNote?.findParent((x) => x instanceof StyleNode, { token });
    if (
      balloonNote === undefined ||
      balloonNote.properties.note.balloonId === undefined ||
      style === undefined
    ) {
      return Promise.reject();
    }
    const balloonHeader = balloonNote
      .findParent<StyleNode>((x) => x instanceof StyleNode, { token })
      ?.find<HeaderNode>(
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
    if (balloonHeader === undefined) {
      return Promise.reject();
    }

    // Find parameter by balloonId using the parameter's index property
    const balloonParameter = balloonHeader.find<ParameterNode>(
      (x) =>
        x instanceof ParameterNode && x.properties.index === balloonNote.properties.note.balloonId,
      { token }
    );
    if (!balloonParameter) {
      return Promise.reject();
    }

    const location = new vscode.Location(document.uri, balloonParameter.range);
    return Promise.resolve(location);
  }
}
