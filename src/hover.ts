import * as vscode from 'vscode';
import { Hover } from 'vscode';
import { commandDocuments } from "./documents";

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

        if (wordRange.start.character === 0 && currentWord[0] === "#") {
            // 命令
            const key = currentWord.slice(1).toLowerCase();
            const item = commandDocuments.get(key);
            if (item !== undefined) {
                hover.symbol = item.symbol;
                hover.documentation = item.documentation;
            }
        } else if (wordRange.start.character === 0) {
            // 末尾が:かどうか判定させる
            // ヘッダ
            switch (currentWord) {
                default:
                    if (currentWord.match(/^EXAM\d*$/)) {
                        // hover.symbol.appendCodeblock("EXAM<i> <type>,<red>,<gold>,<range>");
                        // hover.description.appendMarkdown("課題曲の合格条件を指定します。  \n\n");
                        // hover.description.appendMarkdown("`<i>`: 何曲目の課題曲に対して指定するかを整数で指定します。  \n");
                        // hover.description.appendMarkdown("`<type>`: 何曲目の課題曲に対して指定するかを整数で指定します。  \n");
                    }
                    break;
            }
        }

        if (hover.symbol.value !== "" || hover.documentation.value !== "") {
            return new Hover([hover.symbol, hover.documentation]);
        }
    },
});

export default hover;