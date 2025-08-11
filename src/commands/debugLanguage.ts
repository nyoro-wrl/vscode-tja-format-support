import * as vscode from "vscode";
import { getLanguageManager, SUPPORTED_LANGUAGES } from "../i18n";

/**
 * 调试语言设置命令
 */
export const debugLanguageCommand = {
  command: "tja.debugLanguage",
  title: "Debug Language Settings",
};

/**
 * 调试语言设置
 */
export async function debugLanguage(): Promise<void> {
  const languageManager = getLanguageManager();
  const currentLanguage = languageManager.getCurrentLanguage();
  
  // 获取配置信息
  const config = vscode.workspace.getConfiguration("tjaFormatSupport");
  const configuredLanguage = config.get<string>("language");
  const vsCodeLanguage = vscode.env.language;
  
  // 测试翻译功能
  const testTranslations = {
    statusBarMeasure: languageManager.t("statusBar.measure"),
    commandsZoom: languageManager.t("commands.zoom"),
    configLanguage: languageManager.t("config.language")
  };
  
  // 创建调试信息
  const debugInfo = [
    "=== TJA 语言设置调试信息 ===",
    "",
    `当前使用语言: ${currentLanguage}`,
    `配置文件语言: ${configuredLanguage || "未设置"}`,
    `VS Code 语言: ${vsCodeLanguage}`,
    "",
    "支持的语言:",
    ...Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => `  ${code}: ${name}`),
    "",
    "测试翻译结果:",
    `  statusBar.measure: "${testTranslations.statusBarMeasure}"`,
    `  commands.zoom: "${testTranslations.commandsZoom}"`, 
    `  config.language: "${testTranslations.configLanguage}"`,
    "",
    "配置路径: tjaFormatSupport.language",
    "",
    "如果翻译不正确，请尝试:",
    "1. 重启 VS Code",
    "2. 检查配置是否正确保存",
    "3. 查看开发者控制台的日志信息"
  ].join("\n");
  
  // 显示调试信息
  const action = await vscode.window.showInformationMessage(
    "语言调试信息已复制到剪贴板",
    "查看详情",
    "重新设置语言"
  );
  
  // 复制到剪贴板
  await vscode.env.clipboard.writeText(debugInfo);
  
  if (action === "查看详情") {
    // 创建临时文档显示调试信息
    const doc = await vscode.workspace.openTextDocument({
      content: debugInfo,
      language: "plaintext"
    });
    await vscode.window.showTextDocument(doc);
  } else if (action === "重新设置语言") {
    // 重新打开语言选择
    await vscode.commands.executeCommand("tja.changeLanguage");
  }
  
  console.log("[TJA Debug]", debugInfo);
}
