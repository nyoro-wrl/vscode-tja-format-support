import * as vscode from "vscode";
import { Hover, MarkdownString } from "vscode";
import { commandCollection } from "./type/command";
import { headerCollection } from "./type/header";

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

    if (nextChar === ":") {
      // ヘッダ
      const key = currentWord;
      const item = headerCollection.getStatement(key);
      if (item !== undefined) {
        hover.symbol = new MarkdownString(item.syntax);
        hover.documentation = new MarkdownString(item.documentation);
      }
    } else if (currentWord[0] === "#") {
      // 命令
      const key = currentWord.slice(1);
      const item = commandCollection.getStatement(key);
      if (item !== undefined) {
        hover.symbol = new MarkdownString(item.syntax);
        hover.documentation = new MarkdownString(item.documentation);
      }
    }

    if (hover.symbol.value !== "" || hover.documentation.value !== "") {
      return new Hover([hover.symbol, hover.documentation]);
    }
  },
});

export default hover;
