import * as vscode from "vscode";
import { Hover } from "vscode";
import { headerDocuments, commandDocuments } from "./documents";

const hover = vscode.languages.registerHoverProvider("tja", {
  provideHover(document, position, token) {
    const hover = {
      symbol: new vscode.MarkdownString(),
      documentation: new vscode.MarkdownString(),
    };
    const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9#]+/);
    if (wordRange === undefined) {
      return Promise.reject("no word here");
    }

    const line = document.lineAt(position.line).text;
    const currentWord = line.slice(wordRange.start.character, wordRange.end.character);
    const nextChar = line.slice(wordRange.end.character, wordRange.end.character + 1);

    if (wordRange.start.character === 0) {
      if (currentWord[0] === "#") {
        // 命令
        const key = currentWord.slice(1).toLowerCase();
        const item = commandDocuments.get(key);
        if (item !== undefined) {
          hover.symbol = new vscode.MarkdownString(item.symbol);
          hover.documentation = new vscode.MarkdownString(item.documentation);
        }
      } else if (nextChar === ":") {
        // ヘッダ
        const key = currentWord.toLowerCase();
        const item = headerDocuments.get(key);
        if (item !== undefined) {
          hover.symbol = new vscode.MarkdownString(item.symbol);
          hover.documentation = new vscode.MarkdownString(item.documentation);
        }
      }
    }

    if (hover.symbol.value !== "" || hover.documentation.value !== "") {
      return new Hover([hover.symbol, hover.documentation]);
    }
  },
});

export default hover;
