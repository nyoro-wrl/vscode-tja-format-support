import * as vscode from 'vscode';
import { headerDocuments, commandDocuments } from "./documents";

// ヘッダー
export const headerSnippetProvider = vscode.languages.registerCompletionItemProvider("tja", {
    provideCompletionItems(document, position, token, context) {
        const snippets: vscode.CompletionItem[] = [];
        const comands = [...headerDocuments.values()];
        for (const command of comands) {
            const snippet = new vscode.CompletionItem(command.name + ":", vscode.CompletionItemKind.Snippet);
            snippet.insertText = new vscode.SnippetString(command.name + ":");
            snippet.documentation = new vscode.MarkdownString().appendMarkdown(command.symbol.value + command.documentation.value);
            snippet.kind = vscode.CompletionItemKind.Constant;
            snippets.push(snippet);
        }
        return snippets;
    }
});

// 命令
export const commandSnippetProvider = vscode.languages.registerCompletionItemProvider("tja", {
    provideCompletionItems(document, position, token, context) {
        const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9#]+/);
        if (wordRange?.start.character !== 0) {
            return;
        }
        const currentWord = document.lineAt(position.line).text.slice(wordRange.start.character, wordRange.end.character);
        if (currentWord[0] === "#") {
            return;
        }
        const snippets: vscode.CompletionItem[] = [];
        const comands = [...commandDocuments.values()];
        for (const command of comands) {
            const snippet = new vscode.CompletionItem("#" + command.name, vscode.CompletionItemKind.Snippet);
            snippet.insertText = new vscode.SnippetString("#" + command.name);
            snippet.documentation = new vscode.MarkdownString().appendMarkdown(command.symbol.value + command.documentation.value);
            snippet.kind = vscode.CompletionItemKind.Function;
            snippets.push(snippet);
        }
        return snippets;
    }
});

// 命令（#トリガー用）
export const triggerCommandSnippetProvider = vscode.languages.registerCompletionItemProvider("tja", {
    provideCompletionItems(document, position, token, context) {
        const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9#]+/);
        if (wordRange === undefined) {
            return;
        }
        const currentWord = document.lineAt(position.line).text.slice(wordRange.start.character, wordRange.end.character);
        if (wordRange.start.character !== 0 || currentWord[0] !== "#") {
            return;
        }
        const snippets: vscode.CompletionItem[] = [];
        const comands = [...commandDocuments.values()];
        for (const command of comands) {
            const snippet = new vscode.CompletionItem("#" + command.name, vscode.CompletionItemKind.Snippet);
            snippet.insertText = new vscode.SnippetString(command.name);
            snippet.documentation = new vscode.MarkdownString().appendMarkdown(command.symbol.value + command.documentation.value);
            snippet.kind = vscode.CompletionItemKind.Function;
            snippets.push(snippet);
        }
        return snippets;
    }
}, "#");