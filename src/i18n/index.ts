import * as vscode from "vscode";
import { ja } from "./ja";
import { en } from "./en";
import { zh } from "./zh";

/**
 * サポート言語一覧
 */
export const SUPPORTED_LANGUAGES = {
  auto: "Auto",
  ja: "日本語",
  en: "English",
  zh: "中文",
} as const;

export type LanguageConfig = keyof typeof SUPPORTED_LANGUAGES;
export type SupportedLanguage = "ja" | "en" | "zh";

/**
 * 言語リソースインターフェース
 */
export interface LanguageResources {
  // コマンド関連
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

  // コマンドメッセージとプロンプト
  messages: {
    // 共通メッセージ
    noChartInSelection: string;
    
    // Zoom関連
    zoomPrompt: string;
    zoomValidationInteger: string;
    zoomValidationMinTwo: string;
    
    // ConstantScroll関連
    constantScrollPrompt: string;
    constantScrollValidationNumber: string;
    
    // TransitionScroll関連
    transitionScrollStartTitle: string;
    transitionScrollStartPrompt: string;
    transitionScrollEndTitle: string;
    transitionScrollEndPrompt: string;
    transitionScrollFrequencyTitle: string;
    transitionScrollFrequencyPlaceholder: string;
    transitionScrollEasingTitle: string;
    transitionScrollEasingPlaceholder: string;
    frequencyMeasure: string;
    frequencyLine: string;
    frequencyNote: string;
    frequencyAlways: string;
    
    // DeleteCommands関連
    deleteCommandsPlaceholder: string;
    deleteCommandsAll: string;
    noCommandsInSelection: string;
    
    // JumpMeasure関連
    jumpMeasurePrompt: string;
    jumpMeasurePlaceholder: string;
    jumpMeasureValidationInteger: string;
    jumpMeasureValidationNotFound: string;
    jumpMeasureBranchPlaceholder: string;
    branchNormal: string;
    branchExpert: string;
    branchMaster: string;
    
    // ChangeLiteMode関連
    liteModeNormal: string;
    liteModeLite: string;
    
    // ChangeLanguage関連
    changeLanguagePlaceholder: string;
    changeLanguageCurrent: string;
    changeLanguageLater: string;
    restartMessage: string;
    restartButton: string;
  };

  // パーサー診断メッセージ
  parser: {
    // 一般的なエラー
    invalidText: string;
    extensionError: string;
    invalidHeaderPosition: string;
    invalidCommandPosition: string;
    
    // 風船音符関連
    noBalloonNotes: string;
    balloonCountNotDefined: string;
    
    // 構造エラー
    missingStart: string;
    missingEnd: string;
    missingBranchStart: string;
    measureNotClosed: string;
    duplicateBranch: string;
    noBranchSection: string;
    
    // 譜面状態エラー
    rollNoteInterrupted: string;
    measureCountMismatch: string;
    measurePlacedInMiddle: string;
    
    // 命令関連
    redundantCommand: string;
    commandPositionInvalid: string;
    commandBeforeBranchStart: string;
    
    // 譜面分岐状態
    barlineStateInconsistent: string;
    gogotimeStateInconsistent: string;
    dummyNoteStateInconsistent: string;
  };

  // コードアクション
  codeActions: {
    setBalloonCount: string;
    delete: string;
    createEnd: string;
    removeRedundantCommand: string;
  };

  // 設定項目説明
  config: {
    gogotimeHighlight: string;
    branchHighlight: string;
    liteMode: string;
    completion: string;
    measureCountHint: string;
    language: string;
  };

  // ビュー関連
  views: {
    chartInfo: string;
  };

  // ステータスバー関連
  statusBar: {
    measure: string;
    combo: string;
    liteMode: string;
    normalMode: string;
  };

  // セマンティックトークン種別
  semanticTokens: {
    roll: string;
    rollBig: string;
    balloon: string;
    balloonBig: string;
    fuze: string;
    gogo: string;
  };

  // TJAコマンド詳細情報
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

  // TJAヘッダー情報
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
 * 現在言語リソースマッピング
 */
const resources: Record<SupportedLanguage, LanguageResources> = {
  ja,
  en,
  zh,
};

/**
 * 言語マネージャー
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
      if (vsCodeLanguage.startsWith("ja")) {
        return "ja";
      } else if (vsCodeLanguage.startsWith("en")) {
        return "en";
      } else if (vsCodeLanguage.startsWith("zh")) {
        return "zh";
      } else {
        return "en"; // その他は英語
      }
    } else {
      // 明示的な言語設定
      return config as SupportedLanguage;
    }
  }

  /**
   * 現在言語を取得
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
   * 現在言語のリソースを取得
   */
  getResources(): LanguageResources {
    return resources[this.currentLanguage];
  }

  /**
   * 翻訳テキストを取得
   */
  t(key: string): string {
    return this.getTranslation(key, this.currentLanguage);
  }

  /**
   * 指定された言語の翻訳テキストを取得
   */
  getTranslation(key: string, language: SupportedLanguage): string {
    const keys = key.split(".");
    let value: any = resources[language];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        // 翻訳が見つからない場合、キー名をフォールバックとして返す
        console.warn(`[TJA Language] 翻訳キーが見つかりません: ${key} (言語: ${language})`);
        return key;
      }
    }

    if (typeof value === "string") {
      return value;
    } else {
      console.warn(`[TJA Language] 翻訳値が文字列ではありません: ${key} = ${value}`);
      return key;
    }
  }

  /**
   * 設定変更を監視
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
 * 言語マネージャーインスタンスを取得
 */
export const getLanguageManager = () => LanguageManager.getInstance();

/**
 * 翻訳テキスト取得の便利関数
 */
export const t = (key: string) => getLanguageManager().t(key);
