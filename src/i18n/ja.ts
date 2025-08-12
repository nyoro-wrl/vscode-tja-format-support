import { LanguageResources } from "./index";

/**
 * 日本語リソース
 */
export const ja: LanguageResources = {
  commands: {
    zoom: "譜面の拡大",
    truncate: "譜面の切り詰め", 
    constantScroll: "スクロール速度の一定化",
    transitionScroll: "スクロール速度の遷移",
    deleteCommands: "命令の一括削除",
    toBig: "大音符に置換",
    toSmall: "小音符に置換",
    toRest: "休符に置換",
    reverse: "ドン/カッを反転",
    random: "ドン/カッをランダム"
  },

  messages: {
    // 共通メッセージ
    noChartInSelection: "選択範囲に譜面が見つかりませんでした",
    
    // Zoom関連
    zoomPrompt: "拡大させる倍率を入力してください",
    zoomValidationInteger: "整数を入力してください",
    zoomValidationMinTwo: "2以上の整数を入力してください",
    
    // ConstantScroll関連
    constantScrollPrompt: "スクロール速度の基準となるBPMを入力してください",
    constantScrollValidationNumber: "数値を入力してください",
    
    // TransitionScroll関連
    transitionScrollStartTitle: "スクロール速度の開始値",
    transitionScrollStartPrompt: "スクロール速度の開始値を入力してください",
    transitionScrollEndTitle: "スクロール速度の終了値",
    transitionScrollEndPrompt: "スクロール速度の終了値を入力してください",
    transitionScrollFrequencyTitle: "スクロール速度の遷移頻度",
    transitionScrollFrequencyPlaceholder: "スクロール速度を遷移させる頻度を選択してください",
    transitionScrollEasingTitle: "スクロール速度のイージング",
    transitionScrollEasingPlaceholder: "イージングを選択してください",
    frequencyMeasure: "小節",
    frequencyLine: "行",
    frequencyNote: "音符",
    frequencyAlways: "常時",
    
    // DeleteCommands関連
    deleteCommandsPlaceholder: "削除する命令を選択してください",
    deleteCommandsAll: "すべて",
    noCommandsInSelection: "選択範囲に命令が見つかりませんでした",
    
    // JumpMeasure関連
    jumpMeasurePrompt: "移動先の小節番号を入力してください",
    jumpMeasurePlaceholder: "1 ~ {0}",
    jumpMeasureValidationInteger: "整数を入力してください",
    jumpMeasureValidationNotFound: "小節が見つかりません",
    jumpMeasureBranchPlaceholder: "移動先の譜面分岐を選択してください",
    branchNormal: "普通 (Normal)",
    branchExpert: "玄人 (Expert)",
    branchMaster: "達人 (Master)",
    
    // ChangeLiteMode関連
    liteModeNormal: "通常モード",
    liteModeLite: "軽量モード",
    
    // ChangeLanguage関連
    changeLanguagePlaceholder: "表示言語を選択 / Select display language / 选择显示语言",
    changeLanguageCurrent: "$(check) 現在",
    changeLanguageLater: "後で",
    restartMessage: "言語設定が変更されました。完全に適用するにはVS Codeの再起動が必要です。",
    restartButton: "再起動"
  },

  parser: {
    // 一般的なエラー
    invalidText: "不正なテキストです。",
    extensionError: "拡張機能エラー",
    invalidHeaderPosition: "ヘッダーの位置が不正です。",
    invalidCommandPosition: "命令の位置が不正です。",
    
    // 風船音符関連
    noBalloonNotes: "風船音符がありません。",
    balloonCountNotDefined: "打数が定義されていません。",
    
    // 構造エラー
    missingStart: "#START がありません。",
    missingEnd: "#END がありません。",
    missingBranchStart: "#BRANCHSTART がありません。",
    measureNotClosed: "小節が閉じられていません。",
    duplicateBranch: "譜面分岐が重複しています。",
    noBranchSection: "譜面分岐の区分がありません。",
    
    // 譜面状態エラー
    rollNoteInterrupted: "音符が途切れています。",
    measureCountMismatch: "譜面分岐の小節数が統一されていません。",
    measurePlacedInMiddle: "小節の途中に配置されています。",
    
    // 命令関連
    redundantCommand: "不要な命令です。",
    commandPositionInvalid: "命令の位置が不正です。",
    commandBeforeBranchStart: "命令の位置が不正です。#BRANCHSTARTより前に配置してください。",
    
    // 譜面分岐状態
    barlineStateInconsistent: "譜面分岐後の小節線表示状態（#BARLINEOFF,#BARLINEON）が統一されていません。",
    gogotimeStateInconsistent: "譜面分岐後のゴーゴータイム状態（#GOGOSTART,#GOGOEND）が統一されていません。",
    dummyNoteStateInconsistent: "譜面分岐後のダミーノーツ状態（#DUMMYSTART,#DUMMYEND）が統一されていません。"
  },

  codeActions: {
    setBalloonCount: "風船音符の打数を設定",
    delete: "削除",
    createEnd: "#END の作成",
    removeRedundantCommand: "不要な命令を削除"
  },
  
  config: {
    gogotimeHighlight: "ゴーゴータイムを色付けします。",
    branchHighlight: "譜面分岐を区分ごとに色付けします。",
    liteMode: "構文解析をスキップして処理速度を向上させます。あらゆる機能が無効化されます。",
    completion: "プレイヤー固有命令の補完表示設定",
    measureCountHint: "空行後の小節に小節番号を表示します。",
    language: "表示言語を選択します。"
  },
  
  views: {
    chartInfo: "譜面情報"
  },
  
  statusBar: {
    measure: "小節",
    combo: "コンボ", 
    liteMode: "軽量モード",
    normalMode: "通常モード"
  },
  
  semanticTokens: {
    roll: "連打",
    rollBig: "連打（大）",
    balloon: "風船",
    balloonBig: "風船（大）",
    fuze: "時限爆弾",
    gogo: "ゴーゴータイム"
  },

  // 拡張機能関連
  extension: {
    updateNotificationTitle: "TJA Format Supportに新たな機能が追加されました",
    updateNotificationOk: "OK",
    updateNotificationChangelog: "変更ログの確認"
  },

  // ドキュメントリンク関連
  documentLinks: {
    openAudioFile: "音源ファイルを開く",
    openSongFile: "課題曲ファイルを開く",
    openSideRevFile: "表裏対応ファイルを開く",
    openBackgroundImage: "背景画像を開く",
    openBackgroundMovie: "背景動画を開く",
    openPreviewImage: "選曲画面画像を開く",
    openBgaFile: "BGAを開く",
    openLyricsFile: "歌詞ファイルを開く",
    openFile: "ファイルを開く"
  },

  // リネームプロバイダー関連
  renameProvider: {
    balloonCountInteger: "風船音符の打数は整数で入力してください",
    fileParseError: "ファイルの解析に失敗しました",
    notBalloonParameter: "風船音符の打数パラメータではありません",
    balloonHeaderNotFound: "対応する風船音符ヘッダーが見つかりません",
    balloonParameterNotFound: "風船音符のパラメータが見つかりません",
    notBalloonNote: "風船音符ではありません"
  },

  // シグネチャヘルプ関連
  signatureHelp: {
    examNumberDescription: "1以上の整数を指定します。ヘッダーを呼ぶごとに数を増やします。",
    numberDescription: "数字を指定します。"
  },

  // スニペット関連
  snippet: {
    definedCommandDocumentation: "譜面内で定義された命令",
    folderDetail: "フォルダ",
    zeroPaddingDetail: "直前の行と同じ長さで0埋め"
  },

  // ステータスバー関連
  statusBarTooltips: {
    switchTo: "に切り替え"
  },

  // TJA命令詳細情報
  tjaCommands: {
    start: {
      detail: "開始",
      documentation: "譜面データの記述を開始します。\n`#START`と`#END`で囲んだ範囲が譜面データとして解釈されます。\n\n`<player>`に`P1`や`P2`を指定することで、譜面をプレイヤー別に記述することができます。",
      playerDescription: "プレイヤーサイド\n`P1`または`P2`"
    },
    end: {
      detail: "終了",
      documentation: "譜面データの記述を終了します。\n`#START`と`#END`で囲んだ範囲が譜面データとして解釈されます。"
    },
    bpmchange: {
      detail: "BPM変更",
      documentation: "BPMを変更します。",
      bpmDescription: "BPM"
    },
    measure: {
      detail: "拍子変更",
      documentation: "拍子を変更します。\n`4/4`で4分の4拍子、`6/8`で8分の6拍子になります。",
      measureDescription: "拍子\n`4/4`で4分の4拍子、`6/8`で8分の6拍子になります。"
    },
    scroll: {
      detail: "スクロール速度変更",
      documentation: "譜面のスクロール速度を`<rate>`倍に変更します。\nデフォルトは`1`です。",
      rateDescription: "スクロール速度（基準値: 1）"
    },
    delay: {
      detail: "譜面遅延（停止）",
      documentation: "譜面が流れてくるタイミングを`<second>`秒遅らせます。\n`#BMSCROLL`、`#HBSCROLL`適用下では譜面停止扱いになります。",
      secondDescription: "停止秒数"
    },
    gogostart: {
      detail: "ゴーゴータイム開始", 
      documentation: "ゴーゴータイムを開始します。\nゴーゴータイム中は音符が光り、得点が1.2倍になります。"
    },
    gogoend: {
      detail: "ゴーゴータイム終了",
      documentation: "ゴーゴータイムを終了します。"
    },
    section: {
      detail: "分岐判定リセット",
      documentation: "譜面分岐の判定に使う連打数、精度をリセットします。\n分岐したい箇所の一小節以上前に置いてください。"
    },
    branchstart: {
      detail: "分岐開始",
      documentation: "譜面分岐を開始します。\n\n`<type>`: 分岐条件を指定します。`r`で連打数、`p`で精度(%)、`s`でスコア。\n`<expart>`: 玄人譜面の分岐に必要な値。\n`<master>`: 達人譜面の分岐に必要な値。\n\n分岐判定は一小節前に行われます。\n一小節前から連打が始まる場合、その連打もカウントします。\n\n分岐後は普通譜面`#N`、玄人譜面`#E`、達人譜面`#M`で記述します。",
      typeDescription: "分岐条件\n`r`で連打数、`p`で精度(%)、`s`でスコア。",
      expertDescription: "玄人譜面の分岐に必要な値\n### 分岐条件の種類\n`r`: 連打数, `p`: 精度(%), `s`: スコア",
      masterDescription: "達人譜面の分岐に必要な値\n### 分岐条件の種類\n`r`: 連打数, `p`: 精度(%), `s`: スコア"
    },
    branchend: {
      detail: "分岐終了",
      documentation: "譜面分岐を終了します。\n以降は全ての分岐で共通の譜面が流れます。"
    },
    n: {
      detail: "普通譜面",
      documentation: "普通譜面を記述します。"
    },
    e: {
      detail: "玄人譜面",
      documentation: "玄人譜面を記述します。"
    },
    m: {
      detail: "達人譜面",
      documentation: "達人譜面を記述します。"
    },
    levelhold: {
      detail: "分岐固定",
      documentation: "現在の分岐レベルを固定します。"
    }
  },

  // TJAヘッダー情報
  tjaHeaders: {
    title: {
      detail: "タイトル",
      documentation: "曲のタイトル。",
      paramDescription: "タイトル"
    },
    subtitle: {
      detail: "サブタイトル",
      documentation: "曲のサブタイトル。",
      paramDescription: "サブタイトル"
    },
    bpm: {
      detail: "BPM",
      documentation: "曲のBPM。",
      paramDescription: "BPM"
    },
    wave: {
      detail: "音源ファイル",
      documentation: "音源ファイルのパスを指定します。\nwav、oggなどの形式に対応しています。",
      paramDescription: "音源ファイルのパス"
    },
    offset: {
      detail: "オフセット",
      documentation: "音源と譜面のタイムラグ（秒）。\n負の値で譜面を早く、正の値で遅くします。",
      paramDescription: "オフセット秒数"
    },
    course: {
      detail: "難易度",
      documentation: "譜面の難易度。\n`<course>`: `Easy`、`Normal`、`Hard`、`Oni`、`Edit`、`Tower`、`Dan`もしくは`0`～`6`の値を指定します。\n`Tower`または`5`を入れると連打音符が常に他の音符より手前に表示されます。\n`Dan`または`6`を入れると段位道場譜面として認識されます。",
      paramDescription: "難易度\n`Easy`、`Normal`、`Hard`、`Oni`、`Edit`、`Tower`、`Dan`もしくは`0`～`6`の値を指定します。"
    },
    level: {
      detail: "レベル",
      documentation: "譜面の難易度レベル（星の数）。",
      paramDescription: "レベル（星の数）"
    },
    balloon: {
      detail: "風船パラメータ",
      documentation: "風船音符の打数設定。\n譜面中の風船音符の出現順に、打数をカンマ区切りで指定します。",
      paramDescription: "風船打数（カンマ区切り）"
    }
  }
};
