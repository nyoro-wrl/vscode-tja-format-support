import * as vscode from "vscode";
import { getLanguageManager, SUPPORTED_LANGUAGES, SupportedLanguage } from "../i18n";

/**
 * 切换语言命令
 */
export const changeLanguageCommand = {
  command: "tja.changeLanguage",
  title: "Change Language",
};

/**
 * 切换语言
 */
export async function changeLanguage(): Promise<void> {
  const languageManager = getLanguageManager();
  const currentLanguage = languageManager.getCurrentLanguage();
  
  // 创建语言选择项
  const languageItems = Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
    label: name,
    description: code === currentLanguage ? "$(check) Current" : undefined,
    code: code as SupportedLanguage
  }));
  
  // 显示快速选择菜单
  const selected = await vscode.window.showQuickPick(languageItems, {
    placeHolder: "Select display language / 选择显示语言 / 表示言語を選択",
    ignoreFocusOut: false
  });
  
  if (selected && selected.code !== currentLanguage) {
    // 设置新语言
    languageManager.setLanguage(selected.code);
    
    // 显示重启提示
    const restartMessage = getRestartMessage(selected.code);
    const restartButton = getRestartButtonText(selected.code);
    
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
 * 获取重启提示消息
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
 * 获取重启按钮文本
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
