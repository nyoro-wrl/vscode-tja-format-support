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
        (headers.items.balloon.regexp.test(x.properties.name) ||
          headers.items.balloonnor.regexp.test(x.properties.name) ||
          headers.items.balloonexp.regexp.test(x.properties.name) ||
          headers.items.balloonmas.regexp.test(x.properties.name)),
      (x) => x instanceof ChartNode
    );
    if (balloonHeader === undefined) {
      return Promise.reject();
    }
    const parameterNode = balloonHeader.find<ParameterNode>(
      (x) => x instanceof ParameterNode && x.range.contains(position)
    );
    if (parameterNode === undefined) {
      return Promise.reject();
    }
    const balloonId = parameterNode.properties.index;
    const styleNode = balloonHeader.findParent<StyleNode>((x) => x instanceof StyleNode);
    if (styleNode === undefined) {
      return Promise.reject();
    }
    const balloonNotes = styleNode.find(
      (x) =>
        x instanceof NoteNode &&
        x.properties.note.balloonId !== undefined &&
        x.properties.note.balloonId === balloonId &&
        ((x.properties.branchState === "None" &&
          headers.items.balloon.regexp.test(balloonHeader.properties.name)) ||
          (x.properties.branchState === "Normal" &&
            headers.items.balloonnor.regexp.test(balloonHeader.properties.name)) ||
          (x.properties.branchState === "Expert" &&
            headers.items.balloonexp.regexp.test(balloonHeader.properties.name)) ||
          (x.properties.branchState === "Master" &&
            headers.items.balloonmas.regexp.test(balloonHeader.properties.name))),
      (x) => x instanceof HeadersNode || x instanceof CommandNode
    );
    if (balloonNotes === undefined) {
      return Promise.reject();
    }
    const balloonRange = document.getWordRangeAtPosition(balloonNotes.range.end, /([79]0*8?)/);
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
    const wordRange = document.getWordRangeAtPosition(position, /([79]0*8?|0*8|0+)/);
    if (wordRange === undefined) {
      return Promise.reject();
    }

    const root = documents.parse(document, token);
    if (root === undefined) {
      return Promise.reject();
    }
    const balloonNote = root.find<NoteNode>(
      (x) =>
        x instanceof NoteNode &&
        x.range.contains(position) &&
        x.properties.note.balloonId !== undefined,
      (x) => x instanceof HeadersNode
    );
    const style = balloonNote?.findParent((x) => x instanceof StyleNode);
    if (
      balloonNote === undefined ||
      balloonNote.properties.note.balloonId === undefined ||
      style === undefined
    ) {
      return Promise.reject();
    }
    const balloonHeader = balloonNote
      .findParent<StyleNode>((x) => x instanceof StyleNode)
      ?.find<HeaderNode>(
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
    if (balloonHeader === undefined) {
      return Promise.reject();
    }

    const balloonParameters = balloonHeader.filter((x) => x instanceof ParameterNode);
    if (balloonParameters.length <= balloonNote.properties.note.balloonId) {
      return Promise.reject();
    }
    const balloonParameter = balloonParameters[balloonNote.properties.note.balloonId];

    const location = new vscode.Location(document.uri, balloonParameter.range);
    return Promise.resolve(location);
  }
}
