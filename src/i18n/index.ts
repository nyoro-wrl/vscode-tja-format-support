import * as vscode from "vscode";
import { zh } from "./zh";
import { ja } from "./ja";
import { en } from "./en";

/**
 * 支持的语言列表
 */
export const SUPPORTED_LANGUAGES = {
  auto: "Auto",
  zh: "中文",
  ja: "日本語",
  en: "English",
} as const;

export type LanguageConfig = keyof typeof SUPPORTED_LANGUAGES;
export type SupportedLanguage = "zh" | "ja" | "en";

/**
 * 语言资源接口
 */
export interface LanguageResources {
  // 命令相关
  commands: {
    zoom: string;
    truncate: string;
    constantScroll: string;
    transitionScroll: string;
    deleteCommands: string;
    toBig: string;
    toSmall: string;
    toRest: string;
    reverse: string;
    random: string;
  };

  // 配置项描述
  config: {
    gogotimeHighlight: string;
    branchHighlight: string;
    liteMode: string;
    completion: string;
    measureCountHint: string;
    language: string;
  };

  // 视图相关
  views: {
    chartInfo: string;
  };

  // 状态栏相关
  statusBar: {
    measure: string;
    combo: string;
    liteMode: string;
    normalMode: string;
  };

  // 语义令牌类型
  semanticTokens: {
    roll: string;
    rollBig: string;
    balloon: string;
    balloonBig: string;
    fuze: string;
    gogo: string;
  };

  // TJA命令详细信息
  tjaCommands: {
    start: {
      detail: string;
      documentation: string;
      playerDescription: string;
    };
    end: {
      detail: string;
      documentation: string;
    };
    bpmchange: {
      detail: string;
      documentation: string;
      bpmDescription: string;
    };
    measure: {
      detail: string;
      documentation: string;
      measureDescription: string;
    };
    scroll: {
      detail: string;
      documentation: string;
      rateDescription: string;
    };
    delay: {
      detail: string;
      documentation: string;
      secondDescription: string;
    };
    gogostart: {
      detail: string;
      documentation: string;
    };
    gogoend: {
      detail: string;
      documentation: string;
    };
    section: {
      detail: string;
      documentation: string;
    };
    branchstart: {
      detail: string;
      documentation: string;
      typeDescription: string;
      expertDescription: string;
      masterDescription: string;
    };
    branchend: {
      detail: string;
      documentation: string;
    };
    n: {
      detail: string;
      documentation: string;
    };
    e: {
      detail: string;
      documentation: string;
    };
    m: {
      detail: string;
      documentation: string;
    };
    levelhold: {
      detail: string;
      documentation: string;
    };
  };

  // TJA头部信息
  tjaHeaders: {
    title: {
      detail: string;
      documentation: string;
      paramDescription: string;
    };
    subtitle: {
      detail: string;
      documentation: string;
      paramDescription: string;
    };
    bpm: {
      detail: string;
      documentation: string;
      paramDescription: string;
    };
    wave: {
      detail: string;
      documentation: string;
      paramDescription: string;
    };
    offset: {
      detail: string;
      documentation: string;
      paramDescription: string;
    };
    course: {
      detail: string;
      documentation: string;
      paramDescription: string;
    };
    level: {
      detail: string;
      documentation: string;
      paramDescription: string;
    };
    balloon: {
      detail: string;
      documentation: string;
      paramDescription: string;
    };
  };
}

/**
 * 当前语言资源映射
 */
const resources: Record<SupportedLanguage, LanguageResources> = {
  zh,
  ja,
  en,
};

/**
 * 语言管理器
 */
export class LanguageManager {
  private static instance: LanguageManager;
  private configuredLanguage: LanguageConfig = "auto"; // デフォルトはauto
  private currentLanguage: SupportedLanguage = "en"; // 実際に使用される言語

  private constructor() {
    this.loadLanguageFromConfig();
  }

  static getInstance(): LanguageManager {
    if (!LanguageManager.instance) {
      LanguageManager.instance = new LanguageManager();
    }
    return LanguageManager.instance;
  }

  /**
   * 設定から言語設定をロード
   */
  private loadLanguageFromConfig(): void {
    try {
      const config = vscode.workspace.getConfiguration("tjaFormatSupport");
      const configuredLanguage = config.get<LanguageConfig>("language", "auto");

      console.log(`[TJA Language] 設定された言語: ${configuredLanguage}`);
      console.log(`[TJA Language] VS Code言語: ${vscode.env.language}`);

      this.configuredLanguage = configuredLanguage;
      this.currentLanguage = this.resolveLanguage(configuredLanguage);

      console.log(`[TJA Language] 使用する言語: ${this.currentLanguage}`);
    } catch (error) {
      console.error(`[TJA Language] 言語読込エラー:`, error);
      this.configuredLanguage = "auto";
      this.currentLanguage = "en"; // エラー時は英語をデフォルトに
    }
  }

  /**
   * 設定から実際の言語を解決
   */
  private resolveLanguage(config: LanguageConfig): SupportedLanguage {
    if (config === "auto") {
      // VS Code言語設定から自動推定
      const vsCodeLanguage = vscode.env.language;
      if (vsCodeLanguage.startsWith("zh")) {
        return "zh";
      } else if (vsCodeLanguage.startsWith("ja")) {
        return "ja";
      } else {
        return "en"; // その他は英語
      }
    } else {
      // 明示的な言語設定
      return config as SupportedLanguage;
    }
  }

  /**
   * 获取当前语言
   */
  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * 言語を設定
   */
  setLanguage(language: LanguageConfig): void {
    console.log(`[TJA Language] 言語設定: ${language}`);
    this.configuredLanguage = language;
    this.currentLanguage = this.resolveLanguage(language);

    try {
      const config = vscode.workspace.getConfiguration("tjaFormatSupport");
      config.update("language", language, vscode.ConfigurationTarget.Global);
      console.log(`[TJA Language] 言語設定保存完了: ${language}`);
    } catch (error) {
      console.error(`[TJA Language] 言語設定保存失敗:`, error);
    }
  }

  /**
   * 設定された言語を取得（auto含む）
   */
  getConfiguredLanguage(): LanguageConfig {
    return this.configuredLanguage;
  }

  /**
   * 获取当前语言的资源
   */
  getResources(): LanguageResources {
    return resources[this.currentLanguage];
  }

  /**
   * 获取翻译文本
   */
  t(key: string): string {
    const keys = key.split(".");
    let value: any = this.getResources();

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        // 如果找不到翻译，返回键名作为后备
        console.warn(`[TJA Language] 翻译键未找到: ${key} (语言: ${this.currentLanguage})`);
        return key;
      }
    }

    if (typeof value === "string") {
      return value;
    } else {
      console.warn(`[TJA Language] 翻译值不是字符串: ${key} = ${value}`);
      return key;
    }
  }

  /**
   * 监听配置变化
   */
  onConfigurationChanged(): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("tjaFormatSupport.language")) {
        console.log(`[TJA Language] 言語設定変更検出`);
        const oldConfig = this.configuredLanguage;
        const oldLanguage = this.currentLanguage;
        this.loadLanguageFromConfig();
        if (oldConfig !== this.configuredLanguage || oldLanguage !== this.currentLanguage) {
          console.log(
            `[TJA Language] 言語変更: ${oldConfig}→${this.configuredLanguage} (実際: ${oldLanguage}→${this.currentLanguage})`
          );
          // 必要に応じてUI更新イベントを発火
        }
      }
    });
  }
}

/**
 * 获取语言管理器实例
 */
export const getLanguageManager = () => LanguageManager.getInstance();

/**
 * 获取翻译文本的便捷函数
 */
export const t = (key: string) => getLanguageManager().t(key);
