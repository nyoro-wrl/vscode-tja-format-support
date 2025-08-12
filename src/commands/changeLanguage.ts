import * as vscode from "vscode";
import {
  getLanguageManager,
  SUPPORTED_LANGUAGES,
  LanguageConfig,
  SupportedLanguage,
  t,
} from "../i18n";

/**
 * 言語切換コマンド
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

  // 言語選択項目を作成
  const languageItems = Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => {
    let displayName: string = name;
    let description: string | undefined;

    // Autoの場合は元の名前をそのまま使用

    if (code === currentConfig) {
      description = t("messages.changeLanguageCurrent");
    }

    return {
      label: displayName,
      description,
      languageCode: code as LanguageConfig,
    };
  });

  // クイック選択メニューを表示
  const selected = await vscode.window.showQuickPick(languageItems, {
    placeHolder: t("messages.changeLanguagePlaceholder"),
    ignoreFocusOut: false,
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
      t("messages.changeLanguageLater")
    );

    if (choice === restartButton) {
      // VS Codeを再起動して新しい言語設定を適用
      await vscode.commands.executeCommand("workbench.action.reloadWindow");
    }
  }
}

/**
 * 再起動メッセージを取得
 */
function getRestartMessage(language: SupportedLanguage): string {
  const manager = getLanguageManager();
  return manager.getTranslation("messages.restartMessage", language);
}

/**
 * 再起動ボタンテキストを取得
 */
function getRestartButtonText(language: SupportedLanguage): string {
  const manager = getLanguageManager();
  return manager.getTranslation("messages.restartButton", language);
}
