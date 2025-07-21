import * as vscode from "vscode";
import { commands, languages } from "vscode";
import { jumpMeasure, jumpMeasureCommand } from "./commands/jumpMeasure";
import {
  JumpBalloonNotesDefinitionProvider,
  JumpBalloonParameterDefinitionProvider,
} from "./providers/definition";
import { BalloonParameterRenameProvider } from "./providers/renameProvider";
import { BalloonHoverProvider, CommandHoverProvider, HeaderHoverProvider } from "./providers/hover";
import {
  CommandCompletionItemProvider,
  HeaderCompletionItemProvider,
  NotesPaddingItemProvider,
} from "./providers/snippet";
import { DocumentSymbolProvider } from "./providers/symbol";
import { DocumentSemanticTokensProvider, legend } from "./providers/semanticTokens";
import {
  ComboStatusBarItem,
  MeasureStatusBarItem,
  LiteModeStatusBarItem,
} from "./providers/statusBar";
import { FoldingRangeProvider } from "./providers/folding";
import { CommandSignatureHelpProvider } from "./providers/signatureHelp";
import { selector } from "./constants/language";
import {
  ColorCommandDocumentColorProvider,
  DantickColorDocumentColorProvider,
} from "./providers/color";
import { Documents } from "./providers/documents";
import { InfoTreeDataProvider } from "./providers/treeData";
import { BalloonParameterCodeActionProvider } from "./providers/codeAction";
import { TjaDocumentLinkProvider } from "./providers/documentLink";
import { FilePathCompletionProvider } from "./providers/filePathCompletion";
import { ActiveFileContext } from "./contexts/activeFileContext";
import { ActiveTjaFile } from "./events/activeTjaFile";
import { changeLiteMode, changeLiteModeCommand } from "./commands/changeLiteMode";
import {
  toBig,
  toSmall,
  toRest,
  reverse,
  zoom,
  truncate,
  constantScroll,
  deleteCommands,
} from "./commands/chartEdit";
import { balloonParameterQuickFix } from "./commands/balloonParameterQuickFix";
import { SemVer } from "semver";

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
  versionCheck(context);
  activeTjaFile = new ActiveTjaFile();
  documents = new Documents();

  context.subscriptions.push(
    activeTjaFile,
    new ActiveFileContext(),
    documents,
    vscode.window.createTreeView("tja.info", {
      treeDataProvider: new InfoTreeDataProvider(),
    }),
    commands.registerTextEditorCommand("tja.zoom", zoom),
    commands.registerTextEditorCommand("tja.truncate", truncate),
    commands.registerTextEditorCommand("tja.constantScroll", constantScroll),
    commands.registerTextEditorCommand("tja.deleteCommands", deleteCommands),
    commands.registerTextEditorCommand("tja.toBig", toBig),
    commands.registerTextEditorCommand("tja.toSmall", toSmall),
    commands.registerTextEditorCommand("tja.toRest", toRest),
    commands.registerTextEditorCommand("tja.reverse", reverse),
    commands.registerTextEditorCommand(jumpMeasureCommand.command, jumpMeasure),
    commands.registerCommand(changeLiteModeCommand.command, changeLiteMode),
    commands.registerCommand("tja.balloonParameterQuickFix", balloonParameterQuickFix),
    languages.registerDocumentSemanticTokensProvider(
      selector,
      new DocumentSemanticTokensProvider(),
      legend
    ),
    languages.registerCompletionItemProvider(selector, new HeaderCompletionItemProvider()),
    languages.registerCompletionItemProvider(selector, new CommandCompletionItemProvider(), "#"),
    languages.registerCompletionItemProvider(selector, new NotesPaddingItemProvider()),
    languages.registerSignatureHelpProvider(selector, new CommandSignatureHelpProvider(), " ", ","),
    languages.registerDefinitionProvider(selector, new JumpBalloonNotesDefinitionProvider()),
    languages.registerDefinitionProvider(selector, new JumpBalloonParameterDefinitionProvider()),
    languages.registerRenameProvider(selector, new BalloonParameterRenameProvider()),
    languages.registerHoverProvider(selector, new HeaderHoverProvider()),
    languages.registerHoverProvider(selector, new CommandHoverProvider()),
    languages.registerHoverProvider(selector, new BalloonHoverProvider()),
    languages.registerFoldingRangeProvider(selector, new FoldingRangeProvider()),
    languages.registerDocumentSymbolProvider(selector, new DocumentSymbolProvider()),
    languages.registerColorProvider(selector, new DantickColorDocumentColorProvider()),
    languages.registerColorProvider(selector, new ColorCommandDocumentColorProvider()),
    languages.registerCodeActionsProvider(selector, new BalloonParameterCodeActionProvider(), {
      providedCodeActionKinds: BalloonParameterCodeActionProvider.providedCodeActionKinds
    }),
    languages.registerDocumentLinkProvider(selector, new TjaDocumentLinkProvider()),
    languages.registerCompletionItemProvider(selector, new FilePathCompletionProvider(), ":"),
    new MeasureStatusBarItem(),
    new ComboStatusBarItem(),
    new LiteModeStatusBarItem()
  );
}

/**
 * 拡張機能が無効になったとき
 */
export function deactivate() {}

/**
 * バージョン確認
 * @param context
 */
function versionCheck(context: vscode.ExtensionContext) {
  const currentVersion = new SemVer(context.extension.packageJSON.version);
  const previousVersionText = context.globalState.get<string>("version");
  const previousVersion = previousVersionText ? new SemVer(previousVersionText) : undefined;

  // 通過時に更新通知を行うバージョン
  const noticeVersion = [
    new SemVer("1.4.0"),
    new SemVer("1.3.0"),
    new SemVer("1.2.0"),
    new SemVer("1.1.0"),
  ];

  if (previousVersion && noticeVersion.some((x) => x > previousVersion && x <= currentVersion)) {
    vscode.window
      .showInformationMessage(
        "TJA Format Supportに新たな機能が追加されました",
        "OK",
        "変更ログの確認"
      )
      .then((selection) => {
        if (selection === "変更ログの確認") {
          const changelogUrl = vscode.Uri.parse(
            "https://marketplace.visualstudio.com/items/nyoro.tja-format-support/changelog"
          );
          vscode.env.openExternal(changelogUrl);
          // vscode.commands.executeCommand("extension.open", context.extension.id);
        }
      });
  }

  if (!previousVersion || currentVersion > previousVersion) {
    context.globalState.update("version", currentVersion.version);
  }
}
