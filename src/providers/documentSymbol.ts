import * as vscode from "vscode";
import { DocumentSymbol, DocumentSymbolProvider, SymbolKind } from "vscode";
import { headers } from "../constants/headers";
import { documents } from "../extension";
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
  BranchNode,
  BranchSectionNode,
} from "../types/node";

export class DefaultDocumentSymbolProvider implements DocumentSymbolProvider {
  provideDocumentSymbols(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
    const result: DocumentSymbol[] = [];
    const root = documents.parse(document);
    const symbols = toSymbols(root);
    // const symbols = toSymbolsAll(root);
    result.push(...symbols);
    return result;
  }
}

function toSymbols<T extends Node>(node: Readonly<T>): DocumentSymbol[] {
  const symbols: DocumentSymbol[] = [];
  let symbol: DocumentSymbol | undefined;
  // 親をシンボル化する場合はinstanceofで判定してsymbolを作成する
  if (node instanceof RootHeadersNode) {
    const title =
      node.properties.headers.find((x) => headers.items.title.regexp.test(x.name))?.parameter ?? "";
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
    const styleNodes = node.parent.filter((x) => x instanceof StyleNode);
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
  } else if (node instanceof CommandNode && node.parent instanceof StyleNode) {
    symbol = new DocumentSymbol(
      "#" + node.properties.name,
      node.properties.parameter,
      SymbolKind.Function,
      node.range,
      node.range
    );
  } else if (node instanceof ChartNode) {
    const player = node.properties.start?.parameter ?? "";
    symbol = new DocumentSymbol("#START", player, SymbolKind.Method, node.range, node.range);
  } else if (node instanceof BranchNode) {
    const command = node.find<CommandNode>((x) => x instanceof CommandNode);
    if (command !== undefined) {
      symbol = new DocumentSymbol(
        "#" + command.properties.name,
        command.properties.parameter,
        SymbolKind.Function,
        node.range,
        node.range
      );
    }
  } else if (node instanceof BranchSectionNode) {
    const command = node.find<CommandNode>((x) => x instanceof CommandNode);
    if (command !== undefined) {
      symbol = new DocumentSymbol(
        "#" + command.properties.name,
        command.properties.parameter,
        SymbolKind.Function,
        node.range,
        node.range
      );
    }
  }

  if (symbol !== undefined) {
    if (node instanceof ParentNode) {
      for (const child of node.children) {
        const childSymbols = toSymbols(child);
        symbol.children.push(...childSymbols);
      }
    }
    symbols.push(symbol);
  } else {
    // 親をスルーして子をシンボル化する場合はinstanceofで判定する
    if (node instanceof RootNode || node instanceof StyleHeadersNode || node instanceof StyleNode) {
      for (const child of node.children) {
        const childSymbols = toSymbols(child);
        symbols.push(...childSymbols);
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
function toSymbolsAll<T extends Node>(node: T): DocumentSymbol[] {
  const symbols: DocumentSymbol[] = [];
  const symbol = new DocumentSymbol(
    node.constructor.name,
    "",
    SymbolKind.Variable,
    node.range,
    node.range
  );
  if (node instanceof ParentNode) {
    for (const child of node.children) {
      const childSymbols = toSymbolsAll(child);
      symbol.children.push(...childSymbols);
    }
  }
  symbols.push(symbol);
  return symbols;
}
