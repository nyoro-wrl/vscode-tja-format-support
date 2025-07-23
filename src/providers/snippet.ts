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
  NoteNode,
} from "../types/node";
import { SortTextFactory } from "../types/sortTextFactory";
import { ChartState } from "../types/state";
import { getChartState, isTmg } from "../util/util";

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
      return snippets;
    }

    const root = documents.parse(document, token);
    const node = root?.findDepth((x) => x.range.contains(position), true) ?? root;
    if (root !== undefined && node?.findParent((x) => x instanceof ChartNode)) {
      return snippets;
    }
    const chartAfter =
      root?.find((x) => x instanceof ChartNode && x.range.start.line < position.line) !== undefined;

    // 直前のヘッダを調べて関連性の高いヘッダを取得
    const recommend: string[] = [];
    const headersNode = node?.findParent<HeadersNode>((x) => x instanceof HeadersNode);
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
      if (root === undefined) {
        sortText.order1++;
      }
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

    const _isTmg = isTmg(document);
    const wordRange = document.getWordRangeAtPosition(position, /([a-zA-Z]+|#[a-zA-Z]*)/);
    const word = wordRange === undefined ? "" : document.getText(wordRange);
    const containSharp = /^#/.test(word);
    const previewRange = new Range(new Position(position.line, 0), wordRange?.start ?? position);
    const previewText = document.getText(previewRange);
    if (/[^\s]/.test(previewText)) {
      return snippets;
    }

    const root = documents.parse(document, token);
    const node = root?.findDepth((x) => x.range.contains(position), true);
    if (root !== undefined && node === undefined) {
      return snippets;
    }

    const chartNode = node?.findParent<ChartNode>((x) => x instanceof ChartNode);
    const branchNode = node?.findParent<BranchNode>((x) => x instanceof BranchNode);

    // 譜面状態を取得する
    const chartState = getChartState(document, position) ?? new ChartState();

    // 現在が小節頭かどうか取得
    const beforeChartTokenNode = chartNode?.findLastRange(
      (x) => x instanceof ChartTokenNode && x.range.start.line < position.line
    );
    const measureHead =
      beforeChartTokenNode === undefined || beforeChartTokenNode instanceof MeasureEndNode;

    // 設定から各カテゴリーの表示状態を取得
    const config = vscode.workspace.getConfiguration("tjaFormatSupport.completion");
    const showTJAPlayer = config.get<boolean>("tjap", true);
    const showOpenTaiko = config.get<boolean>("optk", false);
    const showTaikoManyGimmicks = config.get<boolean>("tmg", false);

    let order = 0;
    for (const command of commands) {
      if (token.isCancellationRequested) {
        return snippets;
      }

      // カテゴリーによるフィルタリング
      if (
        (command.category === "TJAP" && !showTJAPlayer) ||
        (command.category === "OpTk" && !showOpenTaiko) ||
        (!_isTmg && command.category === "TMG" && !showTaikoManyGimmicks)
      ) {
        continue;
      }
      if (root !== undefined) {
        // 補完の非表示判定
        if (
          (command.section === "Outer" || command.section === "Start") &&
          chartNode !== undefined
        ) {
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
      }

      // 優先度の計算
      const sortText = new SortTextFactory();
      sortText.order4 += command.order;
      sortText.order5 += order;
      if (root !== undefined && node !== undefined) {
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
      }

      const snippet = new CompletionItem("#" + command.name, CompletionItemKind.Function);
      snippet.insertText = new SnippetString((containSharp ? "" : "#") + command.snippet);
      if (_isTmg) {
        snippet.insertText = toTmgCommandSnippetText(snippet.insertText);
      }
      snippet.documentation = new MarkdownString().appendMarkdown(
        command.syntax + command.documentation
      );
      snippet.detail = command.detail;
      snippet.sortText = sortText.toString();
      snippets.push(snippet);
      order++;
    }

    if (node !== undefined) {
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
    }

    return snippets;
  }
}

/**
 * 譜面の0埋め
 */
export class NotesPaddingItemProvider implements vscode.CompletionItemProvider {
  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
    const snippets: vscode.CompletionItem[] = [];

    const wordRange = document.getWordRangeAtPosition(position, /[0-9A-Z]+/);
    const word = wordRange === undefined ? "" : document.getText(wordRange);
    if (wordRange !== undefined && wordRange.end.isAfter(position)) {
      return snippets;
    }
    const previewRange = new Range(new Position(position.line, 0), wordRange?.start ?? position);
    const previewText = document.getText(previewRange);
    if (/,/.test(previewText)) {
      return snippets;
    }

    const root = documents.parse(document, token);
    const chartNode = root?.findDepth<ChartNode>(
      (x) => x instanceof ChartNode && x.range.contains(position)
    );
    const branchNode = root?.findDepth(
      (x) => x instanceof BranchNode && x.range.contains(position)
    );
    const branchSectionNode = root?.findDepth<BranchSectionNode>(
      (x) => x instanceof BranchSectionNode && x.range.contains(position)
    );
    const commandNode = root?.findDepth<CommandNode>(
      (x) => x instanceof CommandNode && x.range.contains(position)
    );
    if (
      root !== undefined &&
      (chartNode === undefined ||
        (branchNode !== undefined && branchSectionNode === undefined) ||
        commandNode !== undefined)
    ) {
      return snippets;
    }
    // 直前の行を取得する
    const previewLine = chartNode?.findLastRange<NoteNode>(
      (x) => x instanceof NoteNode && x.range.start.line < position.line
    )?.range.start.line;
    const previewLineNotes = chartNode?.filter<NoteNode>(
      (x) => x instanceof NoteNode && x.range.start.line === previewLine
    );
    if (previewLineNotes === undefined) {
      return snippets;
    }
    // 現在の行を取得する
    const currentLineNotes = chartNode?.filter<NoteNode>(
      (x) => x instanceof NoteNode && x.range.start.line === position.line
    );
    if (currentLineNotes === undefined) {
      return snippets;
    }

    const previewLineLength = previewLineNotes.length - currentLineNotes.length;
    if (previewLineLength < 1) {
      return snippets;
    }
    const text = word + "0".repeat(previewLineLength);
    const snippet = new CompletionItem(text, CompletionItemKind.Snippet);
    snippet.insertText = text;
    snippet.detail = "直前の行と同じ長さで0埋め";
    snippets.push(snippet);
    return snippets;
  }
}

/**
 * 命令のスニペットをTMG形式に変換する
 * @param insertText
 * @returns
 */
function toTmgCommandSnippetText(insertText: SnippetString): SnippetString {
  const regex = /(#)?([A-Z0-9]+)(\s+)?(.+)?/;
  const match = insertText.value.match(regex);

  if (!match) {
    return insertText;
  }

  let [, sharp, name, spaces, parameter] = match;

  if (sharp === undefined) {
    sharp = "";
  }

  if (!spaces && !parameter) {
    return new SnippetString().appendText(sharp).appendText(name).appendText("()");
  }

  if (spaces && parameter) {
    return new SnippetString()
      .appendText(sharp)
      .appendText(name)
      .appendText("(")
      .appendText(parameter.replace(/\s+/g, ","))
      .appendText(")");
  }

  return new SnippetString()
    .appendText(sharp)
    .appendText(name)
    .appendText("(")
    .appendTabstop(1)
    .appendText(")")
    .appendTabstop(0);
}
