import { SnippetString } from "vscode";
import { HeaderCollection } from "../types/header";

/**
 * ヘッダの仕様一覧
 */
export const headers = new HeaderCollection({
  // 太鼓さん次郎
  title: {
    name: "TITLE",
    detail: "タイトル",
    documentation: "曲のタイトル。",
    parameter: [{ name: "string", description: "タイトル" }],
    section: "Root",
    separator: "None",
    recommend: ["SUBTITLE"],
    order: 0,
    regexp: /^TITLE([A-Z]{2})?$/,
  },
  course: {
    name: "COURSE",
    detail: "難易度",
    documentation:
      "譜面の難易度。  \n" +
      "`<course>`: `Easy`,`Normal`,`Hard`,`Oni`,`Edit`,`Tower`,`Dan`もしくは`0` ~ `6`の値を指定します。  \n" +
      "`Tower`または`5`を入れると連打音符が常に他の音符より手前に表示されます。  \n" +
      "`Dan`または`6`を入れると段位道場譜面として認識されます。",
    parameter: [
      {
        name: "course",
        description:
          "難易度  \n" +
          "`Easy`,`Normal`,`Hard`,`Oni`,`Edit`,`Tower`,`Dan`もしくは`0` ~ `6`の値を指定します。  \n" +
          "`Tower`または`5`を入れると連打音符が常に他の音符より手前に表示されます。  \n" +
          "`Dan`または`6`を入れると段位道場譜面として認識されます。",
        snippet: [
          { value: "0", detail: "かんたん" },
          { value: "1", detail: "ふつう" },
          { value: "2", detail: "むずかしい" },
          { value: "3", detail: "おに" },
          { value: "4", detail: "エディット" },
          { value: "5", detail: "タワー" },
          { value: "6", detail: "段位" },
          { value: "Easy", detail: "かんたん" },
          { value: "Normal", detail: "ふつう" },
          { value: "Hard", detail: "むずかしい" },
          { value: "Oni", detail: "おに" },
          { value: "Edit", detail: "エディット" },
          { value: "Tower", detail: "タワー" },
          { value: "Dan", detail: "段位" },
        ],
      },
    ],
    section: "Course",
    separator: "None",
    recommend: ["LEVEL"],
    order: 0,
  },
  level: {
    name: "LEVEL",
    detail: "レベル",
    documentation: "譜面のレベル。",
    parameter: [{ name: "int", description: "レベル" }],
    section: "Course",
    separator: "None",
    recommend: [],
    order: 0,
  },
  bpm: {
    name: "BPM",
    detail: "BPM",
    documentation: "曲のBPM。",
    parameter: [{ name: "float", description: "BPM" }],
    section: "Root",
    separator: "None",
    recommend: [],
    order: 0,
  },
  wave: {
    name: "WAVE",
    detail: "音源ファイル",
    documentation:
      "音源ファイルのパス。  \n" + "殆どのプレイヤーが`.wav`,`.mp3`,`.ogg`に対応しています。",
    parameter: [{ name: "filepath", description: "音源ファイルパス", snippet: "Audio" }],
    section: "Root",
    separator: "None",
    recommend: ["OFFSET"],
    order: 0,
  },
  offset: {
    name: "OFFSET",
    detail: "音源ファイルの再生タイミング",
    documentation: "譜面の開始位置と音源ファイルの再生タイミングの差を秒数で指定します。",
    parameter: [{ name: "second", description: "音源ファイルの再生タイミング" }],
    section: "Root",
    separator: "None",
    recommend: [],
    order: 0,
    snippet: new SnippetString().appendText("OFFSET:").appendPlaceholder("0"),
  },
  balloon: {
    name: "BALLOON",
    detail: "風船打数",
    documentation: "風船音符の打数を`,`区切りで入力します。",
    parameter: [{ name: "int...", description: "風船打数" }],
    section: "Course",
    separator: "Comma",
    recommend: [],
    order: 0,
  },
  songvol: {
    name: "SONGVOL",
    detail: "音源ファイルの音量",
    documentation: "音源ファイルの音量。  \n" + "基準値は100。",
    parameter: [{ name: "percent", description: "音源ファイルの音量（基準値: 100）" }],
    section: "Root",
    separator: "None",
    recommend: ["SEVOL"],
    order: 1,
    snippet: new SnippetString().appendText("SONGVOL:").appendPlaceholder("100"),
  },
  sevol: {
    name: "SEVOL",
    detail: "効果音の音量",
    documentation: "効果音の音量。  \n" + "基準値は100。",
    parameter: [{ name: "percent", description: "効果音の音量（基準値: 100）" }],
    section: "Root",
    separator: "None",
    recommend: [],
    order: 1,
    snippet: new SnippetString().appendText("SEVOL:").appendPlaceholder("100"),
  },
  scoreinit: {
    name: "SCOREINIT",
    detail: "配点初項",
    documentation:
      "配点の初項。  \n" + "10コンボ未満の時に小音符を良判定で叩いたときの得点を指定します。",
    parameter: [{ name: "int", description: "配点初項（10コンボ未満時の小音符得点）" }],
    section: "Course",
    separator: "None",
    recommend: ["SCOREDIFF"],
    order: 1,
  },
  scorediff: {
    name: "SCOREDIFF",
    detail: "配点公差",
    documentation:
      "配点の公差。  \n" + "一定のコンボ数ごとに加算される一打あたりの点数を指定します。",
    parameter: [{ name: "int", description: "配点公差（コンボ数ごとに加算される点数）" }],
    section: "Course",
    separator: "None",
    recommend: [],
    order: 1,
  },
  style: {
    name: "STYLE",
    detail: "プレイ人数",
    documentation:
      "プレイ人数を指定します。  \n" +
      "`<style>`: `Single`,`Double`もしくは`1`,`2`の値を指定します。  \n" +
      "`Single`または`1`は一人プレイ、`Double`または`2`は二人プレイの譜面であることを示します。",
    parameter: [
      {
        name: "style",
        description: "プレイ人数  \n" + "`Single`,`Double`もしくは`1`,`2`の値を指定します。",
        snippet: [
          { value: "1", detail: "一人プレイ" },
          { value: "2", detail: "二人プレイ" },
          { value: "Single", detail: "一人プレイ" },
          { value: "Double", detail: "二人プレイ" },
        ],
      },
    ],
    section: "Style",
    separator: "None",
    recommend: [],
    order: 1,
  },
  life: {
    name: "LIFE",
    detail: "ライフ",
    documentation:
      "ライフの数を指定します。  \n" +
      "不可を出すたびにライフが減り、0になると強制的に演奏が中断されます。",
    parameter: [{ name: "int", description: "ライフの数" }],
    section: "Course",
    separator: "None",
    recommend: [],
    order: 2,
  },
  demostart: {
    name: "DEMOSTART",
    detail: "選曲画面のデモ再生位置",
    documentation: "選曲画面で流すデモの再生開始位置を秒で指定します。",
    parameter: [{ name: "second", description: "選曲画面のデモ再生位置" }],
    section: "Root",
    separator: "None",
    recommend: [],
    order: 0,
    snippet: new SnippetString().appendText("DEMOSTART:").appendPlaceholder("0"),
  },
  side: {
    name: "SIDE",
    detail: "表裏表示設定",
    documentation:
      "曲選択画面での表示設定。  \n" +
      "`<side>`: `Normal`,`Ex`,`Both`もしくは`1` ~ `3`の値を指定します。  \n" +
      "`Normal`か`1`を入力した場合、曲選択画面で表状態のときのみ曲が表示され、  \n" +
      "`Ex`か`2`を入力した場合、曲選択画面で裏状態のときのみ曲が表示されます。  \n" +
      "`Both`か`3`を入力した場合は常に表示されます（初期設定）。",
    parameter: [
      {
        name: "side",
        description:
          "表裏表示設定  \n" +
          "`Normal`,`Ex`,`Both`もしくは`1` ~ `3`の値を指定します。  \n" +
          "`Normal`か`1`を入力した場合、曲選択画面で表状態のときのみ曲が表示され、  \n" +
          "`Ex`か`2`を入力した場合、曲選択画面で裏状態のときのみ曲が表示されます。  \n" +
          "`Both`か`3`を入力した場合は常に表示されます（初期設定）。",
        snippet: [
          { value: "1", detail: "表状態のときのみ表示" },
          { value: "2", detail: "裏状態のときのみ表示" },
          { value: "3", detail: "常に表示" },
          { value: "Normal", detail: "表状態のときのみ表示" },
          { value: "Ex", detail: "裏状態のときのみ表示" },
          { value: "Both", detail: "常に表示" },
        ],
      },
    ],
    section: "Root",
    separator: "None",
    recommend: ["SIDEREV"],
    order: 2,
  },
  subtitle: {
    name: "SUBTITLE",
    detail: "サブタイトル",
    documentation:
      "曲のサブタイトル。  \n" + "最初に`--`と入れるとプレイ中に表示されなくなります。",
    parameter: [
      {
        name: "string",
        description: "サブタイトル  \n" + "最初に`--`と入れるとプレイ中に表示されません",
      },
    ],
    section: "Root",
    separator: "None",
    recommend: [],
    order: 0,
  },
  song: {
    name: "SONG",
    detail: "コースの課題曲",
    documentation:
      "コースに使用する譜面のファイルパス。  \n" +
      "`.tjc`ファイル上で有効なヘッダです。  \n" +
      "`<filepath>`: tjaファイルをルートディレクトリから指定します。",
    parameter: [{ name: "filepath", description: "コースの課題曲", snippet: "tja" }],
    section: "Root",
    separator: "None",
    recommend: ["SONG"],
    order: 2,
  },
  // 太鼓さん次郎2
  siderev: {
    name: "SIDEREV",
    detail: "表裏の対応ファイル",
    documentation: "表裏で対になる譜面ファイルを指定します。",
    parameter: [{ name: "filepath", description: "表裏の対応ファイル", snippet: "tja" }],
    section: "Root",
    separator: "None",
    recommend: [],
    order: 2,
  },
  scoremode: {
    name: "SCOREMODE",
    detail: "配点方式",
    documentation:
      "配点方式を指定します。  \n" +
      "`<mode>`: `0` ~ `3`の値を指定します。  \n" +
      "`0`でドンだフル、`1`でAC14、`2`で新筐体、`3`で真打。",
    parameter: [
      {
        name: "mode",
        description:
          "配点方式  \n" +
          "`0` ~ `3`の値を指定します。  \n" +
          "`0`でドンだフル、`1`でAC14、`2`で新筐体、`3`で真打。",
        snippet: [
          { value: "0", detail: "ドンだフル" },
          { value: "1", detail: "AC14" },
          { value: "2", detail: "新筐体" },
          { value: "3", detail: "真打" },
        ],
      },
    ],
    section: "Root",
    separator: "None",
    recommend: [],
    order: 2,
  },
  total: {
    name: "TOTAL",
    detail: "ノルマゲージの重さ",
    documentation:
      "ノルマゲージの増える量を指定します。  \n" +
      "全良でゲージが満タンになる基準値を100とします。",
    parameter: [
      { name: "percent", description: "ノルマゲージの重さ（全良で満タンの基準値: 100）" },
    ],
    section: "Course",
    separator: "None",
    recommend: [],
    order: 1,
  },
  // TJAPlayer2forPC
  balloonnor: {
    name: "BALLOONNOR",
    detail: "風船打数（普通）",
    documentation: "普通譜面での風船音符の打数を`,`区切りで入力します。",
    parameter: [{ name: "int...", description: "風船打数（普通）" }],
    section: "Course",
    separator: "Comma",
    recommend: ["BALLOONEXP", "BALLOONMAS"],
    order: 2,
  },
  balloonexp: {
    name: "BALLOONEXP",
    detail: "風船打数（玄人）",
    documentation: "玄人譜面での風船音符の打数を`,`区切りで入力します。",
    parameter: [{ name: "int...", description: "風船打数（玄人）" }],
    section: "Course",
    separator: "Comma",
    recommend: ["BALLOONMAS"],
    order: 2,
  },
  balloonmas: {
    name: "BALLOONMAS",
    detail: "風船打数（達人）",
    documentation: "達人譜面での風船音符の打数を`,`区切りで入力します。",
    parameter: [{ name: "int...", description: "風船打数（達人）" }],
    section: "Course",
    separator: "Comma",
    recommend: [],
    order: 2,
  },
  genre: {
    name: "GENRE",
    detail: "ジャンル",
    documentation: "曲のジャンル。",
    parameter: [{ name: "string", description: "ジャンル" }],
    section: "Root",
    separator: "None",
    recommend: [],
    order: 1,
  },
  bgimage: {
    name: "BGIMAGE",
    detail: "背景画像",
    documentation: "背景画像ファイルのパス。",
    parameter: [{ name: "filepath", description: "背景画像ファイルのパス", snippet: "Image" }],
    section: "Root",
    separator: "None",
    recommend: ["BGOFFSET", "BGMOVIE"],
    order: 1,
  },
  bgmovie: {
    name: "BGMOVIE",
    detail: "背景動画",
    documentation: "背景動画ファイルのパス。",
    parameter: [{ name: "filepath", description: "背景動画ファイルのパス", snippet: "Movie" }],
    section: "Root",
    separator: "None",
    recommend: ["MOVIEOFFSET"],
    order: 1,
  },
  movieoffset: {
    name: "MOVIEOFFSET",
    detail: "背景動画の再生タイミング",
    documentation:
      "音源ファイルの再生位置と背景動画ファイルの再生タイミングの差を秒数で指定します。",
    parameter: [{ name: "second", description: "背景動画の再生タイミング" }],
    section: "Root",
    separator: "None",
    recommend: ["BGOFFSET"],
    order: 1,
    snippet: new SnippetString().appendText("MOVIEOFFSET:").appendPlaceholder("0"),
  },
  hiddenbranch: {
    name: "HIDDENBRANCH",
    detail: "譜面分岐を隠す",
    documentation: "譜面分岐を分岐する瞬間まで隠します。",
    parameter: [
      {
        name: "type",
        description: "`1`で分岐を隠す",
        snippet: [{ value: "1", detail: "分岐を隠す" }],
      },
    ],
    section: "Course",
    separator: "None",
    recommend: [],
    order: 1,
  },
  headscroll: {
    name: "HEADSCROLL",
    detail: "初期スクロール速度",
    documentation: "譜面開始前のスクロール速度。  \n" + "デフォルトは`1`です。",
    parameter: [{ name: "float", description: "初期スクロール速度（基準値: 1）" }],
    section: "Course",
    separator: "None",
    recommend: [],
    order: 1,
  },
  // TJAPlayer3
  gaugeincr: {
    name: "GAUGEINCR",
    detail: "魂ゲージの端数処理",
    documentation:
      "魂ゲージの端数処理を設定します。  \n" +
      "`<type>`: `Normal`,`Floor`,`Round`,`Notfix`,`Ceiling`から指定します。",
    parameter: [
      {
        name: "type",
        description:
          "魂ゲージの端数処理  \n" + "`Normal`,`Floor`,`Round`,`Notfix`,`Ceiling`から指定します。",
        snippet: [
          { value: "Normal", detail: "通常" },
          { value: "Floor", detail: "切り捨て" },
          { value: "Round", detail: "四捨五入" },
          { value: "Notfix", detail: "端数処理なし" },
          { value: "Ceiling", detail: "切り上げ" },
        ],
      },
    ],
    section: "Course",
    separator: "None",
    recommend: [],
    order: 1,
  },
  // OpenTaiko
  exam: {
    name: "EXAM",
    detail: "課題曲の合格条件",
    documentation:
      "課題曲の合格条件を指定します。  \n" +
      "`EXAM`の直後に1以上の整数を指定します。ヘッダを呼ぶごとに数を増やします。  \n" +
      "`#NEXTSONG`の後に呼ぶと課題曲ごとの条件を指定できます。  \n\n" +
      "`<type>`: 条件の種類を指定します。詳細は下部に記載。  \n" +
      "`<red>`: 赤合格の基準値を指定します。  \n" +
      "`<gold>`: 金合格の基準値を指定します。  \n" +
      "`<range>`: `m`または`l`を指定します。`m`は基準値以上、`l`は基準値未満で合格を表します。  \n\n" +
      "### **条件の種類**  \n" +
      "`g`: 魂ゲージ(%)  \n" +
      "`jp`: 良の数  \n" +
      "`jg`: 可の数  \n" +
      "`jb`: 不可の数  \n" +
      "`s`: スコア  \n" +
      "`r`: 連打数  \n" +
      "`h`: 叩けた数  \n" +
      "`c`: 最大コンボ数  \n",
    parameter: [
      {
        name: "type",
        description:
          "条件の種類  \n\n" +
          "`g`: 魂ゲージ(%)  \n" +
          "`jp`: 良の数  \n" +
          "`jg`: 可の数  \n" +
          "`jb`: 不可の数  \n" +
          "`s`: スコア  \n" +
          "`r`: 連打数  \n" +
          "`h`: 叩けた数  \n" +
          "`c`: 最大コンボ数",
        snippet: [
          { value: "g", detail: "魂ゲージ(%)" },
          { value: "jp", detail: "良の数" },
          { value: "jg", detail: "可の数" },
          { value: "jb", detail: "不可の数" },
          { value: "s", detail: "スコア" },
          { value: "r", detail: "連打数" },
          { value: "h", detail: "叩けた数" },
          { value: "c", detail: "最大コンボ数" },
        ],
      },
      {
        name: "red",
        description:
          "赤合格の基準値  \n" +
          "### **条件の種類**  \n" +
          "`g`: 魂ゲージ(%)  \n" +
          "`jp`: 良の数  \n" +
          "`jg`: 可の数  \n" +
          "`jb`: 不可の数  \n" +
          "`s`: スコア  \n" +
          "`r`: 連打数  \n" +
          "`h`: 叩けた数  \n" +
          "`c`: 最大コンボ数",
      },
      {
        name: "gold",
        description:
          "金合格の基準値  \n" +
          "### **条件の種類**  \n" +
          "`g`: 魂ゲージ(%)  \n" +
          "`jp`: 良の数  \n" +
          "`jg`: 可の数  \n" +
          "`jb`: 不可の数  \n" +
          "`s`: スコア  \n" +
          "`r`: 連打数  \n" +
          "`h`: 叩けた数  \n" +
          "`c`: 最大コンボ数",
      },
      {
        name: "range",
        description:
          "`m`または`l`。`m`は基準値以上、`l`は基準値未満で合格を表します。  \n" +
          "### **条件の種類**  \n" +
          "`g`: 魂ゲージ(%)  \n" +
          "`jp`: 良の数  \n" +
          "`jg`: 可の数  \n" +
          "`jb`: 不可の数  \n" +
          "`s`: スコア  \n" +
          "`r`: 連打数  \n" +
          "`h`: 叩けた数  \n" +
          "`c`: 最大コンボ数",
        snippet: [
          { value: "m", detail: "基準値以上で合格" },
          { value: "l", detail: "基準値未満で合格" },
        ],
      },
    ],
    section: "Root",
    separator: "Comma",
    recommend: ["EXAM"],
    order: 2,
    regexp: /^EXAM[0-9]+$/,
    snippet: new SnippetString().appendText("EXAM").appendPlaceholder("1").appendText(":"),
  },
  preimage: {
    name: "PREIMAGE",
    detail: "選曲画面の画像",
    documentation: "選曲画面に表示する画像ファイルのパス。",
    parameter: [{ name: "filepath", description: "画像ファイルのパス", snippet: "Image" }],
    section: "Root",
    separator: "None",
    recommend: [],
    order: 1,
  },
  bgoffset: {
    name: "BGOFFSET",
    detail: "背景画像の表示タイミング",
    documentation: "譜面の再生位置と背景画像ファイルの表示タイミングの差を秒数で指定します。",
    parameter: [{ name: "second", description: "背景画像の表示タイミング" }],
    section: "Root",
    separator: "None",
    recommend: [],
    order: 1,
    snippet: new SnippetString().appendText("BGOFFSET:").appendPlaceholder("0"),
  },
  dantick: {
    name: "DANTICK",
    detail: "段位種別",
    documentation:
      "段位の種別を指定します。  \n" +
      "`<type>`: 段位の種別を`0` ~ `5`から指定します。\n\n" +
      "### **段位の種別**  \n\n" +
      "`0`: 初級以下  \n" +
      "`1`: 青段位  \n" +
      "`2`: 赤段位  \n" +
      "`3`: 人段位①（銀）  \n" +
      "`4`: 人段位②（金）  \n" +
      "`5`: 外伝",
    parameter: [
      {
        name: "type",
        description:
          "段位種別  \n`0` ~ `5`から指定します。  \n\n### **段位の種別**  \n\n`0`: 初級以下  \n`1`: 青段位  \n`2`: 赤段位  \n`3`: 人段位①（銀）  \n`4`: 人段位②（金）  \n`5`: 外伝",
        snippet: [
          { value: "0", detail: "初級以下" },
          { value: "1", detail: "青段位" },
          { value: "2", detail: "赤段位" },
          { value: "3", detail: "人段位①（銀）" },
          { value: "4", detail: "人段位②（金）" },
          { value: "5", detail: "外伝" },
        ],
      },
    ],
    section: "Root",
    separator: "None",
    recommend: ["DANTICKCOLOR"],
    order: 2,
  },
  dantickcolor: {
    name: "DANTICKCOLOR",
    detail: "段位の表示色",
    documentation: "段位の表示色をHTMLカラーコードで指定します。",
    parameter: [{ name: "color", description: "段位の表示色" }],
    section: "Root",
    separator: "None",
    recommend: [],
    order: 2,
    snippet: new SnippetString().appendText("DANTICKCOLOR:").appendPlaceholder("#FFFFFF"),
  },
  maker: {
    name: "MAKER",
    detail: "譜面制作者",
    documentation: "譜面の制作者。",
    parameter: [{ name: "string", description: "譜面制作者" }],
    section: "Root",
    separator: "None",
    recommend: [],
    order: 1,
  },
  bga: {
    name: "BGA",
    detail: "背景アニメ",
    documentation: "動画ファイルのパス。",
    parameter: [
      { name: "filepath", description: "背景アニメの動画ファイルパス", snippet: "Movie" },
    ],
    section: "Root",
    separator: "None",
    recommend: [],
    order: 1,
  },
  lyrics: {
    name: "LYRICS",
    detail: "歌詞ファイル",
    documentation: "歌詞ファイルのパス。",
    parameter: [{ name: "filepath", description: "歌詞ファイルのパス", snippet: "Lyrics" }],
    section: "Root",
    separator: "None",
    recommend: ["EXPLICIT"],
    order: 1,
  },
  explicit: {
    name: "EXPLICIT",
    detail: "歌詞の不適切表現",
    documentation: "歌詞に不適切な表現が含まれていることを示します。",
    parameter: [
      {
        name: "type",
        description: "`1`で不適切表現あり",
        snippet: [{ value: "1", detail: "不適切表現あり" }],
      },
    ],
    section: "Root",
    separator: "None",
    recommend: [],
    order: 1,
  },
});
