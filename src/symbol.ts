import * as vscode from "vscode";
import { DocumentSymbol, Range, SymbolKind } from "vscode";
import { Parser } from "./type/parser";
import { ChartExpression, GlobalExpression, HeaderExpression } from "./type/expression";
import { unionRanges } from "./util/vscode";
import { unionRanges as newUnionRanges } from "./type/node";
import { Parser as NodeParser } from "./type/newNodeParser";
import { Node } from "./type/node";

export const symbol = vscode.languages.registerDocumentSymbolProvider("tja", {
  provideDocumentSymbols(document: vscode.TextDocument, token) {
    const nodeParser = new NodeParser(document);
    const node = nodeParser.parse();

    return symbolNode(node);

    const parser = new Parser(document);
    const expression = parser.parse();

    const parseSymbol = new ParseSymbol(expression);
    const symbols = parseSymbol.parse();
    return symbols;
  },
});

function symbolNode(node: Node): DocumentSymbol[] {
  const symbols: DocumentSymbol[] = [];
  const range = newUnionRanges(node.ranges);
  if (range !== undefined) {
    const symbol = new DocumentSymbol(node.kind, "", SymbolKind.Variable, range, range);
    for (const child of node.children) {
      const childSymbols = symbolNode(child);
      symbol.children.push(...childSymbols);
    }
    symbols.push(symbol);
  }
  return symbols;
}

class ParseSymbol {
  constructor(private expression: GlobalExpression) {}

  private headerSymbols(headers: HeaderExpression[]): DocumentSymbol[] {
    const symbols: DocumentSymbol[] = [];
    for (const header of headers) {
      const range = header.getRange();
      if (range === undefined) {
        continue;
      }
      const headerName = header.name.value;
      const headerValue = header.rawParameter?.value;
      const name = headerValue === undefined ? `${headerName}:` : `${headerName}: ${headerValue}`;
      const symbol = new DocumentSymbol(
        name,
        "",
        SymbolKind.Constant,
        range,
        new Range(range.end, range.end)
      );
      symbols.push(symbol);
    }
    return symbols;
  }

  private chartSymbols(charts: ChartExpression[]): DocumentSymbol[] {
    const symbols: DocumentSymbol[] = [];
    for (const chart of charts) {
      const range = chart.getRange();
      if (range === undefined) {
        continue;
      }
      const player = chart.start?.rawParameter?.value;
      const name = player === undefined ? "#START ~ #END" : `#START ${player} ~ #END`;
      const symbol = new DocumentSymbol(name, "", SymbolKind.Constructor, range, range);
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
      const range = unionRanges(...ranges);
      if (range !== undefined) {
        const titleName = headers.find((x) => x.name.value === "TITLE")?.rawParameter?.value;
        const name = titleName ?? "TITLE";
        const symbol = new DocumentSymbol(name, "", SymbolKind.Enum, range, range);
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
        const courseValue = course.headers.find((x) => x.name.value === "COURSE")?.rawParameter
          ?.value;
        const name = courseValue === undefined ? "COURSE:" : "COURSE: " + courseValue;
        const symbol = new DocumentSymbol(name, "", SymbolKind.Class, range, range);
        const courseHeaders = this.headerSymbols(course.headers);
        const charts = this.chartSymbols(course.charts);
        symbol.children.push(...courseHeaders);
        symbol.children.push(...charts);
        symbols.push(symbol);
      }
    }
    return symbols;
  }
}
