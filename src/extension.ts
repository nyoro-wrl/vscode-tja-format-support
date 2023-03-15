import * as vscode from "vscode";
import { jumpMeasure, jumpMeasureCommand } from "./commands/jumpMeasure";
import { commands, DocumentSelector, languages, TextDocument } from "vscode";
import {
  JumpBalloonNotesDefinitionProvider,
  JumpBalloonParameterDefinitionProvider,
} from "./providers/definition";
import { BalloonHoverProvider, CommandHoverProvider, HeaderHoverProvider } from "./providers/hover";
import {
  CommandCompletionItemProvider,
  HeaderCompletionItemProvider,
} from "./providers/completionItem";
import { DefaultDocumentSymbolProvider } from "./providers/documentSymbol";
import { DefaultDocumentSemanticTokensProvider, legend } from "./providers/semanticTokens";
import { BranchStatusBarItem, MeasureStatusBarItem } from "./statusBarItem";
import { Documents } from "./documents";
import { jumpBranch, jumpBranchCommand } from "./commands/jumpBranch";

const selector: DocumentSelector = { language: "tja" };

/**
 * ドキュメント情報
 */
export let documents: Documents;

/**
 * 拡張機能が有効になったとき
 * @param context
 */
export function activate(context: vscode.ExtensionContext) {
  documents = new Documents();

  context.subscriptions.push(
    documents,
    commands.registerTextEditorCommand(jumpMeasureCommand.command, jumpMeasure),
    commands.registerTextEditorCommand(jumpBranchCommand.command, jumpBranch),
    languages.registerDocumentSemanticTokensProvider(
      selector,
      new DefaultDocumentSemanticTokensProvider(),
      legend
    ),
    languages.registerCompletionItemProvider(selector, new HeaderCompletionItemProvider()),
    languages.registerCompletionItemProvider(selector, new CommandCompletionItemProvider(), "#"),
    languages.registerDefinitionProvider(selector, new JumpBalloonNotesDefinitionProvider()),
    languages.registerDefinitionProvider(selector, new JumpBalloonParameterDefinitionProvider()),
    languages.registerHoverProvider(selector, new HeaderHoverProvider()),
    languages.registerHoverProvider(selector, new CommandHoverProvider()),
    languages.registerHoverProvider(selector, new BalloonHoverProvider()),
    languages.registerDocumentSymbolProvider(selector, new DefaultDocumentSymbolProvider()),
    new MeasureStatusBarItem(),
    new BranchStatusBarItem()
  );
}

/**
 * 拡張機能が無効になったとき
 */
export function deactivate() {}
