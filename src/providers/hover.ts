import * as vscode from "vscode";
import { Hover, HoverProvider, MarkdownString } from "vscode";
import { commands } from "../constants/commands";
import { headers } from "../constants/headers";
import { documents } from "../extension";
import { HeaderNode, NoteNode, ParameterNode, StyleNode } from "../types/node";

export class HeaderHoverProvider implements HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const wordRange = document.getWordRangeAtPosition(position, /(?<=^\s*)[A-Z0-9]+:/);
    if (wordRange === undefined || position.isEqual(wordRange.end)) {
      return;
    }
    const currentWord = document.getText(wordRange).slice(0, -1);
    const item = headers.get(currentWord);
    if (item !== undefined) {
      const symbol = new MarkdownString(item.syntax);
      const documentation = new MarkdownString(item.documentation);
      return new Hover([symbol, documentation], wordRange);
    }
  }
}

export class CommandHoverProvider implements HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const wordRange = document.getWordRangeAtPosition(position, /(?<=^\s*)#[A-Z0-9]+/);
    if (wordRange === undefined || position.isEqual(wordRange.end)) {
      return;
    }
    const currentWord = document.getText(wordRange).slice(1);
    const item = commands.get(currentWord);
    if (item !== undefined) {
      const symbol = new MarkdownString(item.syntax);
      const documentation = new MarkdownString(item.documentation);
      return new Hover([symbol, documentation], wordRange);
    }
  }
}

/**
 * 風船打数の表示（雑実装）
 */
export class BalloonHoverProvider implements HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const wordRange = document.getWordRangeAtPosition(position, /([79]0*8?|0*8|0+)/);
    if (wordRange === undefined || position.isEqual(wordRange.end)) {
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
    const balloonParameters = balloonHeader.filter<ParameterNode>(
      (x) => x instanceof ParameterNode
    );
    if (balloonParameters.length <= balloonInfo.id) {
      return;
    }
    const balloonParameter = balloonParameters[balloonInfo.id];

    const symbol = new MarkdownString(balloonParameter.value);
    return new Hover([symbol], wordRange);
  }
}
