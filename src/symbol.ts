import * as vscode from "vscode";
import { DocumentSymbol, Range, SymbolKind } from "vscode";
import {
  concatRange,
  GlobalExpression,
  HeaderExpression,
  Lexer,
  Parser,
  TextExpression,
} from "./parser";

export const symbol = vscode.languages.registerDocumentSymbolProvider("tja", {
  provideDocumentSymbols(document, token) {
    const lexer = new Lexer(document);
    const tokens = lexer.tokenized();
    const parser = new Parser(tokens);
    const expression = parser.parse();

    const parseSymbol = new ParseSymbol(expression);
    const symbols = parseSymbol.parse();
    return symbols;
  },
});

class ParseSymbol {
  constructor(private expression: GlobalExpression) {}

  private headerSymbols(headers: HeaderExpression[]): DocumentSymbol[] {
    const symbols: DocumentSymbol[] = [];
    for (const header of headers) {
      const range = header.getRange();
      if (range === undefined) {
        continue;
      }
      const symbol = new DocumentSymbol(
        header.name.value + ":",
        header.rawParameter?.value ?? "",
        SymbolKind.Constant,
        range,
        new Range(
          header.name.range.end.line,
          header.name.range.end.character,
          range.end.line,
          range.end.character
        )
      );
      symbols.push(symbol);
    }
    return symbols;
  }

  private textSymbols(expressions: TextExpression[]): DocumentSymbol[] {
    const symbols: DocumentSymbol[] = [];
    for (const expression of expressions) {
      const symbol = new DocumentSymbol(
        expression.value,
        "",
        SymbolKind.Field,
        expression.range,
        expression.range
      );
      symbols.push(symbol);
    }
    return symbols;
  }

  public parse(): DocumentSymbol[] {
    const symbols: DocumentSymbol[] = [];
    const headers = this.expression.headers;
    if (headers.length > 0) {
      const ranges: Range[] = [];
      for (const header of headers) {
        const headerRanges = header.getRange();
        if (headerRanges !== undefined) {
          ranges.push(headerRanges);
        }
      }
      const range = concatRange(...ranges);
      if (range !== undefined) {
        const titleText =
          headers.find((x) => x.name.value === "TITLE")?.rawParameter?.value ?? "Header";
        const symbol = new DocumentSymbol(titleText, "", SymbolKind.Enum, range, range);
        symbol.children = this.headerSymbols(headers);
        symbols.push(symbol);
      }
    }
    const courses = this.expression.courses;
    if (courses.length > 0) {
      for (const course of courses) {
        const range = course.getRange();
        if (range === undefined) {
          continue;
        }
        let courseText =
          course.headers.find((x) => x.name.value === "COURSE")?.rawParameter?.value ?? "";
        const symbol = new DocumentSymbol(
          "COURSE: " + courseText,
          "",
          SymbolKind.Class,
          range,
          range
        );
        symbol.children = this.headerSymbols(course.headers);
        symbols.push(symbol);
      }
    }
    return symbols;
  }
}
