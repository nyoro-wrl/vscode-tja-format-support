import * as vscode from 'vscode';
import { commandDocuments } from "./documents";

class SharpSnippetProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
        const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9#]+/);
        if (wordRange === undefined) {
            return;
        }

        const line = document.lineAt(position.line).text;
        const currentWord = line.slice(wordRange.start.character, wordRange.end.character);
        if (currentWord[0] !== "#") {
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
}

export default SharpSnippetProvider;