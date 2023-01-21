import * as vscode from "vscode";

// とりあえずコースごとに認識できるだけのやつを作ってみる
const regexpCourse = new RegExp(/^COURSE:.*/);
const regexpEnd = new RegExp(/^#END ?.*/);

const symbol = vscode.languages.registerDocumentSymbolProvider("tja", {
  provideDocumentSymbols(document, token) {
    const symbols: vscode.DocumentSymbol[] = [];

    let courseTextLine: vscode.TextLine | undefined;

    for (let lineCount = 0; lineCount < document.lineCount; lineCount++) {
      const line = document.lineAt(lineCount);

      if (courseTextLine === undefined && regexpCourse.test(line.text)) {
        courseTextLine = line;
      } else if (courseTextLine !== undefined && regexpEnd.test(line.text)) {
        const symbol = new vscode.DocumentSymbol(
          courseTextLine.text,
          "",
          vscode.SymbolKind.Class,
          new vscode.Range(courseTextLine.range.start, line.range.end),
          courseTextLine.range
        );
        symbols.push(symbol);
        courseTextLine = undefined;
      }
    }

    return symbols;
  },
});

export default symbol;
