import * as vscode from "vscode";
import { DefinitionProvider, Location } from "vscode";
import { headers } from "../constants/headers";
import { documents } from "../extension";
import { NoteNode, HeaderNode, ParameterNode, StyleNode } from "../types/node";

/**
 * 風船打数から風船音符にジャンプ（雑実装）
 */
export class JumpBalloonNotesDefinitionProvider implements DefinitionProvider {
  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
    const wordRange = document.getWordRangeAtPosition(position, /[0-9]+/);
    if (wordRange === undefined) {
      return;
    }

    const root = documents.parse(document);
    const balloonHeader = root.find<HeaderNode>(
      (x) =>
        x instanceof HeaderNode &&
        x.range.contains(position) &&
        (headers.items.balloon.regexp.test(x.properties.name) ||
          headers.items.balloonnor.regexp.test(x.properties.name) ||
          headers.items.balloonexp.regexp.test(x.properties.name) ||
          headers.items.balloonmas.regexp.test(x.properties.name))
    );
    if (balloonHeader === undefined) {
      return;
    }
    const parameterNode = balloonHeader.find<ParameterNode>(
      (x) => x instanceof ParameterNode && x.range.contains(position)
    );
    if (parameterNode === undefined) {
      return;
    }
    const balloonId = parameterNode.properties.index;
    const styleNode = balloonHeader.findParent<StyleNode>((x) => x instanceof StyleNode);
    if (styleNode === undefined) {
      return;
    }
    const balloonNotes = styleNode.find(
      (x) =>
        x instanceof NoteNode &&
        x.properties.balloonInfo !== undefined &&
        x.properties.balloonInfo.id === balloonId &&
        x.properties.balloonInfo.headerName === balloonHeader.properties.name
    );
    if (balloonNotes === undefined) {
      return;
    }
    const balloonRange = document.getWordRangeAtPosition(balloonNotes.range.end, /([79]0*8?)/);
    if (balloonRange === undefined) {
      return;
    }

    const location = new Location(document.uri, balloonRange);
    return Promise.resolve(location);
  }
}

/**
 * 風船音符から風船打数にジャンプ（雑実装）
 */
export class JumpBalloonParameterDefinitionProvider implements DefinitionProvider {
  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
    const wordRange = document.getWordRangeAtPosition(position, /([79]0*8?|0*8|0+)/);
    if (wordRange === undefined) {
      return;
    }

    const root = documents.parse(document);
    const balloonNote = root.find<NoteNode>(
      (x) =>
        x instanceof NoteNode &&
        x.range.contains(position) &&
        x.properties.balloonInfo !== undefined
    );
    const balloonInfo = balloonNote?.properties.balloonInfo;
    const style = balloonNote?.findParent((x) => x instanceof StyleNode);
    if (balloonNote === undefined || balloonInfo === undefined || style === undefined) {
      return;
    }
    const balloonHeader = balloonNote
      .findParent<StyleNode>((x) => x instanceof StyleNode)
      ?.find<HeaderNode>(
        (x) => x instanceof HeaderNode && x.properties.name === balloonInfo.headerName
      );
    if (balloonHeader === undefined) {
      return;
    }
    const balloonParameters = balloonHeader.filter((x) => x instanceof ParameterNode);
    if (balloonParameters.length <= balloonInfo.id) {
      return;
    }
    const balloonParameter = balloonParameters[balloonInfo.id];

    const location = new Location(document.uri, balloonParameter.range);
    return Promise.resolve(location);
  }
}
