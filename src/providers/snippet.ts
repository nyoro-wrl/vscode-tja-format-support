import * as vscode from "vscode";
import {
  CompletionItem,
  CompletionItemKind,
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
  BranchNode,
  BranchSectionNode,
  MeasureNode,
} from "../types/node";
import { SortTextFactory } from "../types/sortTextFactory";
import { ChartState } from "../types/state";
import { getChartState } from "../util/util";

/**
 * ヘッダの補完
 */
export class HeaderCompletionItemProvider implements vscode.CompletionItemProvider {
  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
    const snippets: vscode.CompletionItem[] = [];

    const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9]+/);
    const previewRange = new Range(new Position(position.line, 0), wordRange?.start ?? position);
    const previewText = document.getText(previewRange);
    if (/[^\s]/.test(previewText)) {
      return Promise.reject();
    }

    const root = documents.parse(document, token);
    const node = root.findDepth((x) => x.range.contains(position), true) ?? root;
    if (node.findParent((x) => x instanceof ChartNode)) {
      return Promise.reject();
    }
    const chartAfter =
      root.find((x) => x instanceof ChartNode && x.range.start.line < position.line) !== undefined;

    // 直前のヘッダを調べて関連性の高いヘッダを取得
    const recommend: string[] = [];
    const headersNode = node.findParent<HeadersNode>((x) => x instanceof HeadersNode);
    if (headersNode !== undefined) {
      const previewHeader = headersNode.findDepth<HeaderNode>(
        (x) => x instanceof HeaderNode && x.range.end.line < position.line
      );
      if (previewHeader !== undefined) {
        const previewHeaderInfo = headers.get(previewHeader.properties.name);
        if (previewHeaderInfo !== undefined) {
          recommend.push(...previewHeaderInfo.recommend);
        }
      }
    }

    let order = 0;
    for (const header of headers) {
      if (token.isCancellationRequested) {
        return snippets;
      }
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
      }
      if (
        (node instanceof RootHeadersNode &&
          (header.section === "Course" || header.section === "Style")) ||
        (node instanceof StyleHeadersNode && header.section === "Root")
      ) {
        // コンテキストと合わない場合は優先度を下げる
        sortText.order3++;
      }
      if (chartAfter && (header.section === "Course" || header.section === "Style")) {
        // 譜面後はコースヘッダの優先度を上げる
        sortText.order2--;
      }
      if (chartAfter && header === headers.items.course) {
        // 譜面後はCOURSEの優先度を上げる
        sortText.order3--;
      }
      if (recommend.includes(header.name)) {
        // 直前のヘッダと関連性が高い場合は優先度を上げる
        sortText.order1--;
      }

      const snippet = new CompletionItem(header.name + ":", CompletionItemKind.Constant);
      snippet.insertText = new SnippetString(header.snippet);
      snippet.documentation = new MarkdownString().appendMarkdown(
        header.syntax + header.documentation
      );
      snippet.detail = header.detail;
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
export class CommandCompletionItemProvider implements vscode.CompletionItemProvider {
  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
    const snippets: vscode.CompletionItem[] = [];

    const wordRange = document.getWordRangeAtPosition(position, /([a-zA-Z]+|#[a-zA-Z]*)/);
    const word = wordRange === undefined ? "" : document.getText(wordRange);
    const containSharp = /^#/.test(word);
    const previewRange = new Range(new Position(position.line, 0), wordRange?.start ?? position);
    const previewText = document.getText(previewRange);
    if (/[^\s]/.test(previewText)) {
      return Promise.reject();
    }

    const root = documents.parse(document, token);
    const node = root.findDepth((x) => x.range.contains(position), true);
    if (node === undefined) {
      return Promise.reject();
    }

    const chartNode = node.findParent<ChartNode>((x) => x instanceof ChartNode);
    const branchNode = node.findParent<BranchNode>((x) => x instanceof BranchNode);

    // 譜面状態を取得する
    const chartState = getChartState(document, position) ?? new ChartState();

    // 現在が小節頭かどうか取得
    const beforeChartTokenNode = chartNode?.findLastRange(
      (x) => x instanceof ChartTokenNode && x.range.start.line < position.line
    );
    const measureHead =
      beforeChartTokenNode === undefined || beforeChartTokenNode instanceof MeasureEndNode;

    let order = 0;
    for (const command of commands) {
      if (token.isCancellationRequested) {
        return snippets;
      }
      // 補完の非表示判定
      if ((command.section === "Outer" || command.section === "Start") && chartNode !== undefined) {
        // 譜面外でしか書けない命令のため非表示
        continue;
      } else if (
        (command.section === "Inner" ||
          command.section === "MeasureHead" ||
          command.section === "Song" ||
          command.section === "Branch" ||
          command.section === "End") &&
        chartNode === undefined
      ) {
        // 譜面内でしか書けない命令のため非表示
        continue;
      } else if (
        (command === commands.items.branchend ||
          command === commands.items.n ||
          command === commands.items.e ||
          command === commands.items.m) &&
        branchNode === undefined
      ) {
        // 譜面分岐内でしか書けない命令のため非表示
        continue;
      } else if (
        branchNode !== undefined &&
        ((command === commands.items.n && branchNode.properties.hasNormal) ||
          (command === commands.items.e && branchNode.properties.hasExpert) ||
          (command === commands.items.m && branchNode.properties.hasMaster))
      ) {
        // 既に存在する分岐のため非表示
        continue;
      } else if (
        command.section === "End" &&
        chartNode !== undefined &&
        chartNode.properties.end !== undefined
      ) {
        // 既に#ENDが記載されているため非表示
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
        command.section === "End" &&
        chartNode !== undefined &&
        chartNode.properties.end === undefined
      ) {
        // #ENDが記載されていないため優先度を上げる
        sortText.order1--;
      }
      if (
        (command === commands.items.n ||
          command === commands.items.e ||
          command === commands.items.m) &&
        branchNode !== undefined &&
        !node.findParent((x) => x instanceof BranchSectionNode)
      ) {
        sortText.order1--;
      }
      if (
        (command.section === "MeasureHead" ||
          command.section === "Song" ||
          command.section === "Branch" ||
          command.section === "End") &&
        !measureHead
      ) {
        sortText.order1++;
      }
      if (
        (command === commands.items.barlineoff && chartState.showBarline === false) ||
        (command === commands.items.barlineon && chartState.showBarline === true) ||
        (command === commands.items.gogostart && chartState.isGogotime === true) ||
        (command === commands.items.gogoend && chartState.isGogotime === false) ||
        (command === commands.items.dummystart && chartState.isDummyNote === true) ||
        (command === commands.items.dummyend && chartState.isDummyNote === false)
      ) {
        // コンテキストと合わない場合は優先度を下げる
        sortText.order1++;
      }

      const snippet = new CompletionItem("#" + command.name, CompletionItemKind.Function);
      snippet.insertText = new SnippetString((containSharp ? "" : "#") + command.snippet);
      snippet.documentation = new MarkdownString().appendMarkdown(
        command.syntax + command.documentation
      );
      snippet.detail = command.detail;
      snippet.sortText = sortText.toString();
      snippets.push(snippet);
      order++;
    }

    // 未定義の命令を補完に載せる
    const chart = node.findParent<ChartNode>((x) => x instanceof ChartNode);
    const unknownCommands =
      chart?.filter<CommandNode>(
        (x) =>
          x instanceof CommandNode &&
          commands.get(x.properties.name) === undefined &&
          x.range.contains(position) === false
      ) ?? [];
    for (const unknownCommand of unknownCommands) {
      if (token.isCancellationRequested) {
        return snippets;
      }
      // 優先度の計算
      const sortText = new SortTextFactory();
      sortText.order3++;
      if (!node.findParent((x) => x instanceof ChartNode)) {
        // ヘッダを優先したいため優先度を下げる
        sortText.order1++;
      }

      const name = unknownCommand.properties.name;
      const snippet = new CompletionItem("#" + name, CompletionItemKind.Function);
      snippet.insertText = new SnippetString((containSharp ? "" : "#") + name);
      snippet.documentation = "譜面内で定義された命令";
      snippet.sortText = sortText.toString();
      snippets.push(snippet);
    }

    return snippets;
  }
}

/**
 * 譜面の補完
 */
export class NotesCompletionItemProvider implements vscode.CompletionItemProvider {
  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
    const snippets: vscode.CompletionItem[] = [];

    const wordRange = document.getWordRangeAtPosition(position, /[0-9]+/);
    const word = wordRange === undefined ? "" : document.getText(wordRange);
    if (wordRange !== undefined && wordRange.end.isAfter(position)) {
      return Promise.reject();
    }

    const root = documents.parse(document, token);
    const chartNode = root.findDepth<ChartNode>(
      (x) => x instanceof ChartNode && x.range.contains(position)
    );
    const containsMeasureEnd =
      root.find((x) => x instanceof MeasureEndNode && x.range.start.line === position.line) !==
      undefined;
    const branchNode = root.findDepth((x) => x instanceof BranchNode && x.range.contains(position));
    const branchSectionNode = root.findDepth<BranchSectionNode>(
      (x) => x instanceof BranchSectionNode && x.range.contains(position)
    );
    if (chartNode === undefined || (branchNode !== undefined && branchSectionNode === undefined)) {
      return Promise.reject();
    }
    const measureNode = root.findDepth<MeasureNode>(
      (x) => x instanceof MeasureNode && x.range.contains(position)
    );
    // 1つ前の小節を取得する
    let previewMeasureNode: MeasureNode | undefined;
    if (measureNode !== undefined) {
      const nowMeasure = measureNode.properties.measure;
      if (nowMeasure <= 1) {
        return Promise.reject();
      }
      const previewMeasure = nowMeasure - 1;
      const previewMeasureNodes = chartNode.filter<MeasureNode>(
        (x) => x instanceof MeasureNode && x.properties.measure === previewMeasure
      );
      if (previewMeasureNodes.length === 1) {
        previewMeasureNode = previewMeasureNodes[0];
      }
    } else if (branchSectionNode !== undefined) {
      previewMeasureNode = branchSectionNode.findLastRange(
        (x) => x instanceof MeasureNode && x.range.end.line < position.line
      );
    } else {
      previewMeasureNode = chartNode.findLastRange(
        (x) => x instanceof MeasureNode && x.range.end.line < position.line
      );
    }
    if (previewMeasureNode === undefined) {
      return Promise.reject();
    }
    const snippetLength = previewMeasureNode.properties.notesLength - word.length;
    if (snippetLength < 1) {
      return Promise.reject();
    }
    const text1 = word + "0".repeat(snippetLength) + ",";
    const text2 = word + "0".repeat(snippetLength) + (containsMeasureEnd ? "" : ",");
    const snippet = new CompletionItem(text1, CompletionItemKind.Snippet);
    snippet.insertText = text2;
    snippets.push(snippet);
    return snippets;
  }
}
