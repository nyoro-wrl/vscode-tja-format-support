import * as vscode from "vscode";
import {
  CompletionItem,
  CompletionItemKind,
  CompletionItemProvider,
  MarkdownString,
  Position,
  Range,
  SnippetString,
} from "vscode";
import { commands } from "../constants/commands";
import { headers } from "../constants/headers";
import { documents } from "../extension";
import {
  ChartNode,
  ChartTokenNode,
  CommandNode,
  StyleHeadersNode,
  HeaderNode,
  HeadersNode,
  MeasureEndNode,
  RootHeadersNode,
  RootNode,
} from "../types/node";
import { SortTextFactory } from "../types/sortTextFactory";
import { ChartState } from "../types/state";
import { getChartState } from "../util/util";

/**
 * ヘッダの補完
 */
export class HeaderCompletionItemProvider implements CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
    const snippets: CompletionItem[] = [];

    const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9]+/);
    const previewRange = new Range(new Position(position.line, 0), wordRange?.start ?? position);
    const previewText = document.getText(previewRange);
    if (/[^\s]/.test(previewText)) {
      return;
    }

    const root = documents.parse(document);
    const node = root.findLast((x) => x.range !== undefined && x.range.contains(position));
    if (node === undefined || node.findParent((x) => x instanceof ChartNode)) {
      return;
    }

    // 直前のヘッダを調べて関連性の高いヘッダを取得
    const recommend: string[] = [];
    const headersNode = node.findParent((x) => x instanceof HeadersNode) as HeadersNode | undefined;
    if (headersNode !== undefined) {
      const previewHeader = headersNode.findLast(
        (x) => x instanceof HeaderNode && x.range !== undefined && x.range.end.line < position.line
      ) as HeaderNode | undefined;
      if (previewHeader !== undefined) {
        const previewHeaderInfo = headers.get(previewHeader.properties.name);
        if (previewHeaderInfo !== undefined) {
          recommend.push(...previewHeaderInfo.recommend);
        }
      }
    }

    let order = 0;
    for (const header of headers) {
      // 優先度の計算
      const sortText = new SortTextFactory();
      sortText.order4 += header.order;
      sortText.order5 += order;
      if (node instanceof HeadersNode) {
        for (const containHeader of node.properties.headers) {
          if (header.regexp.test(containHeader.name)) {
            // 既存のヘッダの場合は優先度を下げる
            sortText.order2++;
          }
        }
        if (
          (node instanceof RootHeadersNode && header.section === "Course") ||
          (node instanceof StyleHeadersNode && header.section === "Root")
        ) {
          // コンテキストと合わない場合は優先度を下げる
          sortText.order3++;
        }
        if (recommend.includes(header.name)) {
          // 直前のヘッダと関連性が高い場合は優先度を上げる
          sortText.order1--;
        }
      }

      const snippet = new CompletionItem(header.name + ":", vscode.CompletionItemKind.Constant);
      snippet.insertText = new SnippetString(header.snippet);
      snippet.documentation = new MarkdownString().appendMarkdown(
        header.syntax + header.documentation
      );
      snippet.kind = CompletionItemKind.Constant;
      snippet.sortText = sortText.toString();
      snippets.push(snippet);
      order++;
    }
    return snippets;
  }
}

/**
 * 命令の補完
 */
export class CommandCompletionItemProvider implements CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
    const snippets: CompletionItem[] = [];

    const wordRange = document.getWordRangeAtPosition(position, /([a-zA-Z]+|#[a-zA-Z]*)/);
    const word = document.getText(wordRange);
    const containSharp = /^#/.test(word);
    const previewRange = new Range(new Position(position.line, 0), wordRange?.start ?? position);
    const previewText = document.getText(previewRange);
    if (/[^\s]/.test(previewText)) {
      return;
    }

    const root = documents.parse(document);
    const node = root.findLast((x) => x.range !== undefined && x.range.contains(position));
    if (node === undefined || node instanceof RootNode) {
      return;
    }

    // 譜面状態を取得する
    const chartState = getChartState(document, position) ?? new ChartState();

    // 現在が小節頭かどうか取得
    const chartNode = root.find(
      (x) => x instanceof ChartNode && x.range !== undefined && x.range.contains(position)
    ) as ChartNode | undefined;
    const beforeChartTokenNode = chartNode?.findLastRange(
      (x) => x instanceof ChartTokenNode && x.range.start.line < position.line
    ) as ChartTokenNode | undefined;
    const measureHead =
      beforeChartTokenNode === undefined || beforeChartTokenNode instanceof MeasureEndNode;

    let order = 0;
    for (const command of commands) {
      // 補完の非表示判定
      if (
        (command.section === "Outer" || command.section === "Start") &&
        node.findParent((x) => x instanceof ChartNode)
      ) {
        // コンテキストとの不一致
        continue;
      } else if (
        (command.section === "Inner" ||
          command.section === "MeasureHead" ||
          command.section === "Branch" ||
          command.section === "End") &&
        !node.findParent((x) => x instanceof ChartNode)
      ) {
        // コンテキストとの不一致
        continue;
      } else if (
        command.section === "End" &&
        node instanceof ChartNode &&
        node.properties.end !== undefined
      ) {
        // 既に#ENDが記載されている
        continue;
      }

      // 優先度の計算
      const sortText = new SortTextFactory();
      sortText.order4 += command.order;
      sortText.order5 += order;
      if (!node.findParent((x) => x instanceof ChartNode)) {
        // ヘッダを優先したいため優先度を下げる
        sortText.order1++;
      }
      if (
        (command.section === "MeasureHead" ||
          command.section === "Branch" ||
          command.section === "End") &&
        !measureHead
      ) {
        sortText.order1++;
      }
      if (
        (commands.items.barlineoff.regexp.test(command.name) && chartState.showBarline === false) ||
        (commands.items.barlineon.regexp.test(command.name) && chartState.showBarline === true) ||
        (commands.items.gogostart.regexp.test(command.name) && chartState.isGogotime === true) ||
        (commands.items.gogoend.regexp.test(command.name) && chartState.isGogotime === false) ||
        (commands.items.dummystart.regexp.test(command.name) && chartState.isDummyNote === true) ||
        (commands.items.dummyend.regexp.test(command.name) && chartState.isDummyNote === false)
      ) {
        // コンテキストと合わない場合は優先度を下げる
        sortText.order1++;
      }

      const snippet = new CompletionItem("#" + command.name, vscode.CompletionItemKind.Function);
      snippet.insertText = new SnippetString((containSharp ? "" : "#") + command.snippet);
      snippet.documentation = new MarkdownString().appendMarkdown(
        command.syntax + command.documentation
      );
      snippet.kind = CompletionItemKind.Function;
      snippet.sortText = sortText.toString();
      snippets.push(snippet);
      order++;
    }

    // 未定義の命令を補完に載せる
    const chart = node.findParent((x) => x instanceof ChartNode) as ChartNode | undefined;
    const unknownCommands = (chart?.filter(
      (x) =>
        x instanceof CommandNode &&
        commands.get(x.properties.name) === undefined &&
        x.range !== undefined &&
        x.range.contains(position) === false
    ) ?? []) as CommandNode[];
    for (const unknownCommand of unknownCommands) {
      // 優先度の計算
      const sortText = new SortTextFactory();
      sortText.order3++;
      if (!node.findParent((x) => x instanceof ChartNode)) {
        // ヘッダを優先したいため優先度を下げる
        sortText.order1++;
      }

      const name = unknownCommand.properties.name;
      const snippet = new CompletionItem("#" + name, vscode.CompletionItemKind.Function);
      snippet.insertText = new SnippetString((containSharp ? "" : "#") + name);
      snippet.documentation = "譜面内で定義された命令";
      snippet.kind = CompletionItemKind.Function;
      snippet.sortText = sortText.toString();
      snippets.push(snippet);
    }

    return snippets;
  }
}
