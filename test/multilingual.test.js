import { getLanguageManager } from "../src/i18n";

// 测试多语言功能
async function testMultiLanguage() {
  const languageManager = getLanguageManager();
  
  // 测试默认语言（日语）
  console.log("Default language:", languageManager.getCurrentLanguage());
  console.log("Command title (ja):", languageManager.t("commands.zoom"));
  
  // 测试切换到中文
  languageManager.setLanguage("zh");
  console.log("After switching to Chinese:");
  console.log("Current language:", languageManager.getCurrentLanguage());
  console.log("Command title (zh):", languageManager.t("commands.zoom"));
  
  // 测试切换到英文
  languageManager.setLanguage("en");
  console.log("After switching to English:");
  console.log("Current language:", languageManager.getCurrentLanguage());
  console.log("Command title (en):", languageManager.t("commands.zoom"));
  
  // 测试状态栏文本
  languageManager.setLanguage("zh");
  console.log("Status bar text (zh):", languageManager.t("statusBar.measure"));
  
  languageManager.setLanguage("en");
  console.log("Status bar text (en):", languageManager.t("statusBar.measure"));
  
  languageManager.setLanguage("ja");
  console.log("Status bar text (ja):", languageManager.t("statusBar.measure"));
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
  testMultiLanguage().catch(console.error);
}
