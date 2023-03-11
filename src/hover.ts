import * as vscode from "vscode";
import { Hover, MarkdownString } from "vscode";
import { commands } from "./constants/commands";
import { headers } from "./constants/headers";

export const headerHover = vscode.languages.registerHoverProvider("tja", {
  provideHover(document, position, token) {
    const wordRange = document.getWordRangeAtPosition(position, /(?<=^\s*)[A-Z0-9]+(?=:)/);
    if (wordRange === undefined) {
      return Promise.reject("no word here");
    }
    const currentWord = document.getText(wordRange);
    const item = headers.get(currentWord);
    if (item !== undefined) {
      const symbol = new MarkdownString(item.syntax);
      const documentation = new MarkdownString(item.documentation);
      return new Hover([symbol, documentation]);
    }
  },
});

export const commandHover = vscode.languages.registerHoverProvider("tja", {
  provideHover(document, position, token) {
    const wordRange = document.getWordRangeAtPosition(position, /(?<=^\s*#)[A-Z0-9]+/);
    if (wordRange === undefined) {
      return Promise.reject("no word here");
    }
    const currentWord = document.getText(wordRange);
    const item = commands.get(currentWord);
    if (item !== undefined) {
      const symbol = new MarkdownString(item.syntax);
      const documentation = new MarkdownString(item.documentation);
      return new Hover([symbol, documentation]);
    }
  },
});
