import * as vscode from "vscode";
import { commands } from "./constants/commands";
import { headers } from "./constants/headers";
import { getRoot } from "./parser";
import {
  ChartNode,
  CourseHeadersNode,
  CourseNode,
  MeasureNode,
  RootHeadersNode,
  RootNode,
} from "./types/node";

// ヘッダ
export const headerSnippet = vscode.languages.registerCompletionItemProvider("tja", {
  provideCompletionItems(document, position, token, context) {
    const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9]+/);
    if (position.character !== 0 && wordRange?.start.character !== 0) {
      return;
    }

    const root = getRoot(document);
    const node = root.findLast((x) => x.range !== undefined && x.range.contains(position));
    if (node === undefined || node instanceof ChartNode) {
      return;
    }

    const snippets: vscode.CompletionItem[] = [];
    for (const header of headers) {
      const snippet = new vscode.CompletionItem(
        header.name + ":",
        vscode.CompletionItemKind.Snippet
      );
      snippet.insertText = new vscode.SnippetString(header.snippet);
      snippet.documentation = new vscode.MarkdownString().appendMarkdown(
        header.syntax + header.documentation
      );
      snippet.kind = vscode.CompletionItemKind.Constant;
      snippets.push(snippet);
    }
    return snippets;
  },
});

// 命令
export const commandSnippet = vscode.languages.registerCompletionItemProvider("tja", {
  provideCompletionItems(document, position, token, context) {
    const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9#]+/);
    if (wordRange === undefined || position.character === wordRange.start.character) {
      return;
    }

    const currentWord = document
      .lineAt(position.line)
      .text.slice(wordRange.start.character, wordRange.end.character);
    const snippets: vscode.CompletionItem[] = [];

    const root = getRoot(document);
    const node = root.findLast((x) => x.range !== undefined && x.range.contains(position));

    for (const command of commands) {
      if (
        (command.section === "Outer" || command.section === "Start") &&
        !(
          node instanceof RootNode ||
          node instanceof RootHeadersNode ||
          node instanceof CourseNode ||
          node instanceof CourseHeadersNode
        )
      ) {
        continue;
      } else if (
        (command.section === "Inner" || command.section === "End") &&
        !(node instanceof ChartNode || node instanceof MeasureNode)
      ) {
        continue;
      }

      const snippet = new vscode.CompletionItem(
        "#" + command.name,
        vscode.CompletionItemKind.Snippet
      );
      snippet.insertText = new vscode.SnippetString(
        (currentWord[0] === "#" ? "" : "#") + command.snippet
      );
      snippet.documentation = new vscode.MarkdownString().appendMarkdown(
        command.syntax + command.documentation
      );
      snippet.kind = vscode.CompletionItemKind.Method;
      snippets.push(snippet);
    }
    return snippets;
  },
});

// 命令（#トリガー用）
export const triggerCommandSnippet = vscode.languages.registerCompletionItemProvider(
  "tja",
  {
    provideCompletionItems(document, position, token, context) {
      if (context.triggerCharacter === undefined) {
        return;
      }
      const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9#]+/);
      if (wordRange === undefined) {
        return;
      }
      const currentWord = document
        .lineAt(position.line)
        .text.slice(wordRange.start.character, wordRange.end.character);
      if (currentWord[0] !== "#" || currentWord.length > 1) {
        return;
      }
      const snippets: vscode.CompletionItem[] = [];

      const root = getRoot(document);
      const node = root.findLast((x) => x.range !== undefined && x.range.contains(position));

      for (const command of commands) {
        if (
          (command.section === "Outer" || command.section === "Start") &&
          !(
            node instanceof RootNode ||
            node instanceof RootHeadersNode ||
            node instanceof CourseNode ||
            node instanceof CourseHeadersNode
          )
        ) {
          continue;
        } else if (
          (command.section === "Inner" || command.section === "End") &&
          !(node instanceof ChartNode || node instanceof MeasureNode)
        ) {
          continue;
        }

        const snippet = new vscode.CompletionItem(
          "#" + command.name,
          vscode.CompletionItemKind.Snippet
        );
        snippet.insertText = new vscode.SnippetString(command.snippet);
        snippet.documentation = new vscode.MarkdownString().appendMarkdown(
          command.syntax + command.documentation
        );
        snippet.kind = vscode.CompletionItemKind.Function;
        snippets.push(snippet);
      }
      return snippets;
    },
  },
  "#"
);
