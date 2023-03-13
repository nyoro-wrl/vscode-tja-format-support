import * as vscode from "vscode";
import { DocumentSymbol, SymbolKind } from "vscode";
import { documents } from "./documents";
import {
  ChartNode,
  CommandNode,
  StyleHeadersNode,
  CourseNode,
  HeaderNode,
  Node,
  ParameterNode,
  ParametersNode,
  ParentNode,
  RootHeadersNode,
  RootNode,
  StyleNode,
} from "./types/node";

export const symbol = vscode.languages.registerDocumentSymbolProvider("tja", {
  provideDocumentSymbols(document: vscode.TextDocument, token) {
    const result: DocumentSymbol[] = [];
    const root = documents.get(document).getRootNode();
    const symbols = nodeToSymbols(root);
    // const symbols = allNodeToSymbols(root);
    result.push(...symbols);
    return result;
  },
});

function nodeToSymbols<T extends Node>(node: Readonly<T>): DocumentSymbol[] {
  const symbols: DocumentSymbol[] = [];
  if (node.range !== undefined) {
    let symbol: DocumentSymbol | undefined;
    // 親をシンボル化する場合はinstanceofで判定してsymbolを作成する
    if (node instanceof RootHeadersNode) {
      const title = node.properties.headers.find((x) => x.name === "TITLE")?.parameter ?? "";
      symbol = new DocumentSymbol("TITLE: " + title, "", SymbolKind.Enum, node.range, node.range);
    } else if (node instanceof CourseNode) {
      symbol = new DocumentSymbol(
        "COURSE: " + node.properties.course,
        "",
        SymbolKind.Class,
        node.range,
        node.range
      );
    } else if (node instanceof StyleNode) {
      // CourseにStyleが複数ある場合はStyleをシンボル化する
      const styleNodes = node.parent.findAll((x) => x instanceof StyleNode) as StyleNode[];
      if (styleNodes.length > 1) {
        symbol = new DocumentSymbol(
          "STYLE: " + node.properties.style,
          "",
          SymbolKind.Class,
          node.range,
          node.range
        );
      }
    } else if (node instanceof HeaderNode) {
      symbol = new DocumentSymbol(
        node.properties.name + ":",
        node.properties.parameter,
        SymbolKind.Constant,
        node.range,
        node.find((x) => x instanceof ParametersNode)?.range ??
          node.find((x) => x instanceof ParameterNode)?.range ??
          node.range
      );
    } else if (node instanceof CommandNode && node.parent instanceof CourseNode) {
      symbol = new DocumentSymbol(
        "#" + node.properties.name,
        node.properties.parameter,
        SymbolKind.Function,
        node.range,
        node.range
      );
    } else if (node instanceof ChartNode) {
      const player = node.properties.start?.parameter ?? "";
      symbol = new DocumentSymbol("#START", player, SymbolKind.Variable, node.range, node.range);
    }

    if (symbol !== undefined) {
      if (node instanceof ParentNode) {
        for (const child of node.children) {
          const childSymbols = nodeToSymbols(child);
          symbol.children.push(...childSymbols);
        }
      }
      symbols.push(symbol);
    } else {
      // 親をスルーして子をシンボル化する場合はinstanceofで判定する
      if (
        node instanceof RootNode ||
        node instanceof StyleHeadersNode ||
        node instanceof StyleNode
      ) {
        for (const child of node.children) {
          const childSymbols = nodeToSymbols(child);
          symbols.push(...childSymbols);
        }
      }
    }
  }
  return symbols;
}

/**
 * 全てのノードをシンボルに変換（検証用）
 * @param node
 * @returns
 */
function allNodeToSymbols<T extends Node>(node: T): DocumentSymbol[] {
  const symbols: DocumentSymbol[] = [];
  if (node.range !== undefined) {
    const symbol = new DocumentSymbol(
      node.constructor.name,
      "",
      SymbolKind.Variable,
      node.range,
      node.range
    );
    if (node instanceof ParentNode) {
      for (const child of node.children) {
        const childSymbols = allNodeToSymbols(child);
        symbol.children.push(...childSymbols);
      }
    }
    symbols.push(symbol);
  }
  return symbols;
}
