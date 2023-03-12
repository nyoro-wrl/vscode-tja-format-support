import * as vscode from "vscode";
import { Hover, MarkdownString } from "vscode";
import { commands } from "./constants/commands";
import { headers } from "./constants/headers";
import { documents } from "./documents";
import { HeaderNode, NoteNode, ParameterNode, StyleNode } from "./types/node";

export const headerHover = vscode.languages.registerHoverProvider("tja", {
  provideHover(document, position, token) {
    const wordRange = document.getWordRangeAtPosition(position, /(?<=^\s*)[A-Z0-9]+:/);
    if (wordRange === undefined) {
      return;
    }
    const currentWord = document.getText(wordRange).slice(0, -1);
    const item = headers.get(currentWord);
    if (item !== undefined) {
      const symbol = new MarkdownString(item.syntax);
      const documentation = new MarkdownString(item.documentation);
      return new Hover([symbol, documentation], wordRange);
    }
  },
});

export const commandHover = vscode.languages.registerHoverProvider("tja", {
  provideHover(document, position, token) {
    const wordRange = document.getWordRangeAtPosition(position, /(?<=^\s*)#[A-Z0-9]+/);
    if (wordRange === undefined) {
      return;
    }
    const currentWord = document.getText(wordRange).slice(1);
    const item = commands.get(currentWord);
    if (item !== undefined) {
      const symbol = new MarkdownString(item.syntax);
      const documentation = new MarkdownString(item.documentation);
      return new Hover([symbol, documentation], wordRange);
    }
  },
});

/**
 * 風船打数の表示（雑実装）
 */
export const balloonHover = vscode.languages.registerHoverProvider("tja", {
  provideHover(document, position, token) {
    const wordRange = document.getWordRangeAtPosition(position, /([79]0*8?|0*8|0+)/);
    if (wordRange === undefined) {
      return;
    }

    const root = documents.get(document).parse();
    const balloonNote = root.find(
      (x) =>
        x instanceof NoteNode && x.range.contains(position) && x.properties.balloonId !== undefined
    ) as NoteNode | undefined;
    const balloonId = balloonNote?.properties.balloonId;
    if (balloonNote === undefined || balloonId === undefined) {
      return;
    }
    const balloonHeader = (
      balloonNote.findParent((x) => x instanceof StyleNode) as StyleNode | undefined
    )?.find((x) => x instanceof HeaderNode && x.properties.name === "BALLOON") as
      | HeaderNode
      | undefined;
    if (balloonHeader === undefined) {
      return;
    }
    const balloonParameters = balloonHeader.findAll(
      (x) => x instanceof ParameterNode
    ) as ParameterNode[];
    if (balloonParameters.length <= balloonId) {
      return;
    }
    const balloonParameter = balloonParameters[balloonId];
    const symbol = new MarkdownString(balloonParameter.value);
    return new Hover([symbol], wordRange);
  },
});
