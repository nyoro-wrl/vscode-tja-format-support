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
