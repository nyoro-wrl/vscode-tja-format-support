import * as vscode from "vscode";
import { getLanguageManager, SUPPORTED_LANGUAGES, LanguageConfig, SupportedLanguage } from "../i18n";

/**
 * 切换语言命令
 */
export const changeLanguageCommand = {
  command: "tja.changeLanguage",
  title: "Change Language",
};

/**
 * 言語切換
 */
export async function changeLanguage(): Promise<void> {
  const languageManager = getLanguageManager();
  const currentConfig = languageManager.getConfiguredLanguage();
  const currentActualLanguage = languageManager.getCurrentLanguage();
  
  // 言語選択項目を作成
  const languageItems = Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => {
    let displayName: string = name;
    let description: string | undefined;
    
    // Autoの場合は元の名前をそのまま使用
    
    if (code === currentConfig) {
      description = "$(check) Current";
    }
    
    return {
      label: displayName,
      description,
      languageCode: code as LanguageConfig
    };
  });
  
  // 显示快速选择菜单
  const selected = await vscode.window.showQuickPick(languageItems, {
    placeHolder: "Select display language / 选择显示语言 / 表示言語を選択",
    ignoreFocusOut: false
  });
  
  if (selected && selected.languageCode !== currentConfig) {
    // 新言語を設定
    languageManager.setLanguage(selected.languageCode);
    
    // 再起動メッセージを表示
    const newActualLanguage = languageManager.getCurrentLanguage();
    const restartMessage = getRestartMessage(newActualLanguage);
    const restartButton = getRestartButtonText(newActualLanguage);
    
    const choice = await vscode.window.showInformationMessage(
      restartMessage,
      restartButton,
      "Later"
    );
    
    if (choice === restartButton) {
      // 重启VS Code以应用新语言设置
      await vscode.commands.executeCommand("workbench.action.reloadWindow");
    }
  }
}

/**
 * 再起動メッセージを取得
 */
function getRestartMessage(language: SupportedLanguage): string {
  switch (language) {
    case "zh":
      return "语言设置已更改，需要重启 VS Code 才能完全应用。";
    case "en":
      return "Language setting has been changed. Please restart VS Code to apply the changes fully.";
    case "ja":
    default:
      return "言語設定が変更されました。完全に適用するにはVS Codeの再起動が必要です。";
  }
}

/**
 * 再起動ボタンテキストを取得
 */
function getRestartButtonText(language: SupportedLanguage): string {
  switch (language) {
    case "zh":
      return "重启";
    case "en":
      return "Restart";
    case "ja":
    default:
      return "再起動";
  }
}
