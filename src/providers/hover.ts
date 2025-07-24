import * as vscode from "vscode";
import { Hover, MarkdownString } from "vscode";
import { commands } from "../constants/commands";
import { headers } from "../constants/headers";
import { documents } from "../extension";
import { HeaderNode, HeadersNode, NoteNode, ParameterNode, StyleNode } from "../types/node";
import { generateSyntax } from "../util/util";
/**
 * ヘッダのマウスホバーヒント
 */
export class HeaderHoverProvider implements vscode.HoverProvider {
  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover> {
    const wordRange = document.getWordRangeAtPosition(position, /(?<=^\s*)[A-Z0-9]+:/);
    if (wordRange === undefined || position.isEqual(wordRange.end)) {
      return Promise.reject();
    }
    const currentWord = document.getText(wordRange).slice(0, -1);
    const item = headers.get(currentWord);
    if (item === undefined) {
      return Promise.reject();
    }
    const syntax = generateSyntax(item.name, item.parameter, item.separator);
    const symbol = new MarkdownString(syntax);
    const documentation = new MarkdownString(item.documentation);
    return new Hover([symbol, documentation], wordRange);
  }
}

/**
 * 命令のマウスホバーヒント
 */
export class CommandHoverProvider implements vscode.HoverProvider {
  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover> {
    const wordRange = document.getWordRangeAtPosition(position, /(?<=^\s*)#[A-Z0-9]+/);
    if (wordRange === undefined || position.isEqual(wordRange.end)) {
      return Promise.reject();
    }
    const currentWord = document.getText(wordRange).slice(1);
    const item = commands.get(currentWord);
    if (item === undefined) {
      return Promise.reject();
    }
    const symbol = new MarkdownString(item.syntax || "");
    const documentation = new MarkdownString(item.documentation);
    return new Hover([symbol, documentation], wordRange);
  }
}

/**
 * 風船打数の表示（雑実装）
 */
export class BalloonHoverProvider implements vscode.HoverProvider {
  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover> {
    const wordRange = document.getWordRangeAtPosition(position, /([79]0*8?|0*8|0+)/);
    if (wordRange === undefined || position.isEqual(wordRange.end)) {
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
      (x) => x instanceof HeadersNode,
      undefined,
      token
    );
    const balloonId = balloonNote?.properties.note.balloonId;
    const style = balloonNote?.findParent((x) => x instanceof StyleNode, undefined, token);
    if (balloonNote === undefined || balloonId === undefined || style === undefined) {
      return Promise.reject();
    }
    const balloonHeader = balloonNote
      .findParent<StyleNode>((x) => x instanceof StyleNode, undefined, token)
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
              headers.items.balloonmas.regexp.test(x.properties.name))),
        undefined,
        undefined,
        token
      );
    if (balloonHeader === undefined) {
      return Promise.reject();
    }
    // Find parameter by balloonId using the parameter's index property
    const balloonParameter = balloonHeader.find<ParameterNode>(
      (x) => x instanceof ParameterNode && x.properties.index === balloonId,
      undefined,
      undefined,
      token
    );
    if (!balloonParameter) {
      return Promise.reject();
    }

    const symbol = new MarkdownString(balloonParameter.value);
    return new Hover([symbol], wordRange);
  }
}
