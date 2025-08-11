import * as vscode from "vscode";
import { getLanguageManager, SUPPORTED_LANGUAGES } from "../i18n";

/**
 * 言語設定デバッグコマンド
 */
export const debugLanguageCommand = {
  command: "tja.debugLanguage",
  title: "Debug Language Settings",
};

/**
 * 言語設定をデバッグ
 */
export async function debugLanguage(): Promise<void> {
  const languageManager = getLanguageManager();
  const currentLanguage = languageManager.getCurrentLanguage();
  
  // 設定情報を取得
  const config = vscode.workspace.getConfiguration("tjaFormatSupport");
  const configuredLanguage = config.get<string>("language");
  const vsCodeLanguage = vscode.env.language;
  
  // 翻訳機能をテスト
  const testTranslations = {
    statusBarMeasure: languageManager.t("statusBar.measure"),
    commandsZoom: languageManager.t("commands.zoom"),
    configLanguage: languageManager.t("config.language")
  };
  
  // デバッグ情報を作成
  const debugInfo = [
    "=== TJA Language Settings Debug Info ===",
    "",
    `Current Language: ${currentLanguage}`,
    `Configured Language: ${configuredLanguage || "Not Set"}`,
    `VS Code Language: ${vsCodeLanguage}`,
    "",
    "Supported Languages:",
    ...Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => `  ${code}: ${name}`),
    "",
    "Translation Test Results:",
    `  statusBar.measure: "${testTranslations.statusBarMeasure}"`,
    `  commands.zoom: "${testTranslations.commandsZoom}"`, 
    `  config.language: "${testTranslations.configLanguage}"`,
    "",
    "Configuration Path: tjaFormatSupport.language",
    "",
    "If translations are incorrect, please try:",
    "1. Restart VS Code",
    "2. Check if configuration is saved correctly",
    "3. Check developer console for log information"
  ].join("\n");
  
  // デバッグ情報を表示
  const action = await vscode.window.showInformationMessage(
    "Language debug info has been copied to clipboard",
    "View Details",
    "Change Language"
  );
  
  // クリップボードにコピー
  await vscode.env.clipboard.writeText(debugInfo);
  
  if (action === "View Details") {
    // 一時ドキュメントを作成してデバッグ情報を表示
    const doc = await vscode.workspace.openTextDocument({
      content: debugInfo,
      language: "plaintext"
    });
    await vscode.window.showTextDocument(doc);
  } else if (action === "Change Language") {
    // 言語選択を再度開く
    await vscode.commands.executeCommand("tja.changeLanguage");
  }
  
  console.log("[TJA Debug]", debugInfo);
}
