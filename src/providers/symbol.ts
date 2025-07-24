import * as vscode from "vscode";
import { DocumentSymbol, SymbolKind } from "vscode";
import { headers } from "../constants/headers";
import { documents } from "../extension";
import {
  ChartNode,
  CommandNode,
  CourseNode,
  HeaderNode,
  Node,
  ParametersNode,
  ParentNode,
  RootHeadersNode,
  StyleNode,
  BranchNode,
  BranchSectionNode,
  SongNode,
} from "../types/node";
import { getRegExp } from "../types/statement";

/**
 * 構成要素のシンボル表示
 */
export class DocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  async provideDocumentSymbols(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.SymbolInformation[] | vscode.DocumentSymbol[]> {
    const result: DocumentSymbol[] = [];
    const root = documents.parse(document, token);
    if (root === undefined) {
      return result;
    }
    const symbols = toSymbols(root, token);
    // const symbols = toSymbolsAll(root, token);
    result.push(...symbols);
    return result;
  }
}

function toSymbols(
  node: Node,
  token: vscode.CancellationToken,
  parent?: DocumentSymbol
): DocumentSymbol[] {
  const symbols: DocumentSymbol[] = [];
  let symbol: DocumentSymbol | undefined;

  if (node instanceof RootHeadersNode) {
    const title =
      node.properties.headers.find((x) => getRegExp(headers.items.title).test(x.name))?.parameter ??
      "";
    symbol = new DocumentSymbol("TITLE: " + title, "", SymbolKind.Enum, node.range, node.range);
  } else if (node instanceof CourseNode) {
    symbol = new DocumentSymbol(
      "COURSE: " + node.properties.course,
      "",
      SymbolKind.Class,
      node.range,
      node.range
    );
  } else if (node instanceof StyleNode && node.parent.children.length > 1) {
    symbol = new DocumentSymbol(
      "STYLE: " + node.properties.style,
      "",
      SymbolKind.Class,
      node.range,
      node.range
    );
  } else if (node instanceof HeaderNode) {
    symbol = new DocumentSymbol(
      node.properties.name + ":",
      node.properties.parameter,
      SymbolKind.Constant,
      node.range,
      node.children.find((x) => x instanceof ParametersNode)?.range ?? node.range
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
    const command = <CommandNode>node.children.find((x) => x instanceof CommandNode);
    if (command !== undefined) {
      symbol = new DocumentSymbol(
        "#" + command.properties.name,
        command.properties.parameter,
        SymbolKind.Function,
        node.range,
        node.range
      );
    }
  } else if (node instanceof SongNode) {
    const songName = node.properties.nextsong?.parameters[0] ?? "";
    symbol = new DocumentSymbol(
      "#NEXTSONG " + songName,
      "",
      SymbolKind.Function,
      node.range,
      node.range
    );
  } else if (node instanceof BranchSectionNode) {
    const command = <CommandNode>node.children.find((x) => x instanceof CommandNode);
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
    symbol.children.push(...symbols);
    while (symbols.pop() !== undefined) {}
  } else if (parent !== undefined) {
    parent.children.push(...symbols);
    while (symbols.pop() !== undefined) {}
  }
  if (node instanceof ParentNode && !token.isCancellationRequested) {
    for (const child of node.children) {
      if (token.isCancellationRequested) {
        break;
      }
      const childSymbols = toSymbols(child, token, symbol);
      if (symbol !== undefined) {
        symbol.children.push(...childSymbols);
      } else if (parent !== undefined) {
        parent.children.push(...childSymbols);
      } else {
        symbols.push(...childSymbols);
      }
    }
  }
  if (symbol !== undefined) {
    if (parent === undefined) {
      symbols.push(symbol);
    } else {
      parent.children.push(symbol);
    }
  }
  return symbols;
}

/**
 * 全てのノードをシンボルに変換（検証用）
 * @param node
 * @returns
 */
function toSymbolsAll<T extends Node>(node: T, token: vscode.CancellationToken): DocumentSymbol[] {
  const symbols: DocumentSymbol[] = [];
  const symbol = new DocumentSymbol(
    node.constructor.name,
    "",
    SymbolKind.Variable,
    node.range,
    node.range
  );
  if (node instanceof ParentNode && !token.isCancellationRequested) {
    for (const child of node.children) {
      if (token.isCancellationRequested) {
        break;
      }
      const childSymbols = toSymbolsAll(child, token);
      symbol.children.push(...childSymbols);
    }
  }
  symbols.push(symbol);
  return symbols;
}
