import * as vscode from "vscode";
import { Hover, MarkdownString } from "vscode";
import { commands } from "./constants/commands";
import { headers } from "./constants/headers";

const hover = vscode.languages.registerHoverProvider("tja", {
  provideHover(document, position, token) {
    const hover = {
      symbol: new MarkdownString(),
      documentation: new MarkdownString(),
    };
    const wordRange = document.getWordRangeAtPosition(position, /^\s*#?[a-zA-Z0-9]+:?/);
    if (wordRange === undefined) {
      return Promise.reject("no word here");
    }

    const line = document.lineAt(position.line).text;
    const currentWord = line.slice(wordRange.start.character, wordRange.end.character);

    if (/:$/.test(currentWord)) {
      // ヘッダ
      const key = currentWord.slice(0, currentWord.length - 1);
      const item = headers.get(key);
      if (item !== undefined) {
        hover.symbol = new MarkdownString(item.syntax);
        hover.documentation = new MarkdownString(item.documentation);
      }
    } else if (/^#/.test(currentWord)) {
      // 命令
      const key = currentWord.slice(1);
      const item = commands.get(key);
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
