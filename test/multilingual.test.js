import { getLanguageManager } from "../src/i18n";

// 多言語機能をテスト
async function testMultiLanguage() {
  const languageManager = getLanguageManager();
  
  // デフォルト言語（日本語）をテスト
  console.log("Default language:", languageManager.getCurrentLanguage());
  console.log("Command title (ja):", languageManager.t("commands.zoom"));
  
  // 日本語に切り替えてテスト
  languageManager.setLanguage("ja");
  console.log("After switching to Japanese:");
  console.log("Current language:", languageManager.getCurrentLanguage());
  console.log("Command title (ja):", languageManager.t("commands.zoom"));
  
  // 英語に切り替えてテスト
  languageManager.setLanguage("en");
  console.log("After switching to English:");
  console.log("Current language:", languageManager.getCurrentLanguage());
  console.log("Command title (en):", languageManager.t("commands.zoom"));
  
  // 中国語に切り替えてテスト
  languageManager.setLanguage("zh");
  console.log("After switching to Chinese:");
  console.log("Current language:", languageManager.getCurrentLanguage());
  console.log("Command title (zh):", languageManager.t("commands.zoom"));
  
  // ステータスバーテキストをテスト
  languageManager.setLanguage("ja");
  console.log("Status bar text (ja):", languageManager.t("statusBar.measure"));
  
  languageManager.setLanguage("en");
  console.log("Status bar text (en):", languageManager.t("statusBar.measure"));
  
  languageManager.setLanguage("zh");
  console.log("Status bar text (zh):", languageManager.t("statusBar.measure"));
}

// ファイルを直接実行する場合はテストを実行
if (require.main === module) {
  testMultiLanguage().catch(console.error);
}
