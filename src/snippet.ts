import * as vscode from "vscode";
import { headerDocuments, commandDocuments } from "./documents";

// ヘッダ
export const headerSnippet = vscode.languages.registerCompletionItemProvider("tja", {
  provideCompletionItems(document, position, token, context) {
    const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9]+/);
    if (position.character !== 0 && wordRange?.start.character !== 0) {
      return;
    }
    const snippets: vscode.CompletionItem[] = [];
    const comands = [...headerDocuments.values()];
    for (const command of comands) {
      const snippet = new vscode.CompletionItem(
        command.name + ":",
        vscode.CompletionItemKind.Snippet
      );
      snippet.insertText = new vscode.SnippetString(command.snippetString);
      snippet.documentation = new vscode.MarkdownString().appendMarkdown(
        command.definition + command.documentation
      );
      snippet.kind = vscode.CompletionItemKind.Property;
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
    const comands = [...commandDocuments.values()];
    for (const command of comands) {
      const snippet = new vscode.CompletionItem(
        "#" + command.name,
        vscode.CompletionItemKind.Snippet
      );
      snippet.insertText = new vscode.SnippetString(
        (currentWord[0] === "#" ? "" : "#") + command.snippetString
      );
      snippet.documentation = new vscode.MarkdownString().appendMarkdown(
        command.definition + command.documentation
      );
      snippet.kind = vscode.CompletionItemKind.Function;
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
      const comands = [...commandDocuments.values()];
      for (const command of comands) {
        const snippet = new vscode.CompletionItem(
          "#" + command.name,
          vscode.CompletionItemKind.Snippet
        );
        snippet.insertText = new vscode.SnippetString(command.snippetString);
        snippet.documentation = new vscode.MarkdownString().appendMarkdown(
          command.definition + command.documentation
        );
        snippet.kind = vscode.CompletionItemKind.Function;
        snippets.push(snippet);
      }
      return snippets;
    },
  },
  "#"
);

export const commandParameterSnippet = vscode.languages.registerCompletionItemProvider("tja", {
  provideCompletionItems(document, position, token, context) {
    const snippets: vscode.CompletionItem[] = [];
    return snippets;
  },
});
