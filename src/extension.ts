import * as vscode from "vscode";
import { commands, languages } from "vscode";
import { jumpMeasure, jumpMeasureCommand } from "./commands/jumpMeasure";
import {
  JumpBalloonNotesDefinitionProvider,
  JumpBalloonParameterDefinitionProvider,
} from "./providers/definition";
import { BalloonHoverProvider, CommandHoverProvider, HeaderHoverProvider } from "./providers/hover";
import {
  CommandCompletionItemProvider,
  HeaderCompletionItemProvider,
  NotesCompletionItemProvider,
} from "./providers/snippet";
import { DocumentSymbolProvider } from "./providers/symbol";
import { DocumentSemanticTokensProvider, legend } from "./providers/semanticTokens";
import { ComboStatusBarItem, MeasureStatusBarItem } from "./providers/statusBar";
import { FoldingRangeProvider } from "./providers/folding";
import { CommandSignatureHelpProvider } from "./providers/signatureHelp";
import { selector } from "./constants/language";
import {
  ColorCommandDocumentColorProvider,
  DantickColorDocumentColorProvider,
} from "./providers/color";
import { Documents } from "./providers/documents";
import { InfoTreeDataProvider } from "./providers/treeData";
import { ActiveFileContext } from "./contexts/activeFileContext";
import { ActiveTjaFile } from "./events/activeTjaFile";

export let activeTjaFile: ActiveTjaFile;
/**
 * ドキュメント情報
 */
export let documents: Documents;

/**
 * 拡張機能が有効になったとき
 * @param context
 */
export function activate(context: vscode.ExtensionContext) {
  activeTjaFile = new ActiveTjaFile();
  documents = new Documents();

  context.subscriptions.push(
    activeTjaFile,
    new ActiveFileContext(),
    documents,
    vscode.window.createTreeView("tja.info", {
      treeDataProvider: new InfoTreeDataProvider(),
    }),
    commands.registerTextEditorCommand(jumpMeasureCommand.command, jumpMeasure),
    languages.registerDocumentSemanticTokensProvider(
      selector,
      new DocumentSemanticTokensProvider(),
      legend
    ),
    languages.registerCompletionItemProvider(selector, new HeaderCompletionItemProvider()),
    languages.registerCompletionItemProvider(selector, new CommandCompletionItemProvider(), "#"),
    languages.registerCompletionItemProvider(selector, new NotesCompletionItemProvider()),
    languages.registerSignatureHelpProvider(selector, new CommandSignatureHelpProvider(), " ", ","),
    languages.registerDefinitionProvider(selector, new JumpBalloonNotesDefinitionProvider()),
    languages.registerDefinitionProvider(selector, new JumpBalloonParameterDefinitionProvider()),
    languages.registerHoverProvider(selector, new HeaderHoverProvider()),
    languages.registerHoverProvider(selector, new CommandHoverProvider()),
    languages.registerHoverProvider(selector, new BalloonHoverProvider()),
    languages.registerFoldingRangeProvider(selector, new FoldingRangeProvider()),
    languages.registerDocumentSymbolProvider(selector, new DocumentSymbolProvider()),
    languages.registerColorProvider(selector, new DantickColorDocumentColorProvider()),
    languages.registerColorProvider(selector, new ColorCommandDocumentColorProvider()),
    new MeasureStatusBarItem(),
    new ComboStatusBarItem()
  );
}

/**
 * 拡張機能が無効になったとき
 */
export function deactivate() {}
