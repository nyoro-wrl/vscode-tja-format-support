import { MarkdownString, SnippetString } from "vscode";
import { CommandCollection } from "../types/command";

/**
 * 命令の仕様一覧
 */
export const commands = new CommandCollection({
  // 太鼓さん次郎
  start: {
    name: "START",
    detail: "開始",
    syntax: new MarkdownString().appendCodeblock("#START" + " [<player>]").value,
    documentation:
      "譜面データの記述を開始します。  \n" +
      "`#START`と`#END`で囲んだ範囲が譜面データとして解釈されます。  \n\n" +
      "`<player>`に`P1`や`P2`を指定することで、譜面をプレイヤー別に記述することができます。",
    parameter: [
      {
        name: "player",
        description: "プレイヤーサイド",
        snippet: [
          { value: "P1", detail: "1Pサイド" },
          { value: "P2", detail: "2Pサイド" },
        ],
      },
    ],
    separator: "None",
    section: "Start",
    category: "Base",
    order: 2,
  },
  end: {
    name: "END",
    detail: "終了",
    syntax: new MarkdownString().appendCodeblock("#END").value,
    documentation:
      "譜面データの記述を終了します。  \n" +
      "`#START`と`#END`で囲んだ範囲が譜面データとして解釈されます。",
    parameter: [],
    separator: "None",
    section: "End",
    category: "Base",
    order: 2,
  },
  bpmchange: {
    name: "BPMCHANGE",
    detail: "BPM変更",
    syntax: new MarkdownString().appendCodeblock("#BPMCHANGE" + " <bpm>").value,
    documentation: "BPMを変更します。",
    parameter: [{ name: "bpm", description: "BPM" }],
    separator: "None",
    section: "Inner",
    category: "Base",
    order: 0,
    snippet: new SnippetString().appendText("BPMCHANGE "),
  },
  gogostart: {
    name: "GOGOSTART",
    detail: "ゴーゴー開始",
    syntax: new MarkdownString().appendCodeblock("#GOGOSTART").value,
    documentation: "ゴーゴータイムを開始します。",
    parameter: [],
    separator: "None",
    section: "Inner",
    category: "Base",
    order: 1,
  },
  gogoend: {
    name: "GOGOEND",
    detail: "ゴーゴー終了",
    syntax: new MarkdownString().appendCodeblock("#GOGOEND").value,
    documentation: "ゴーゴータイムを終了します。",
    parameter: [],
    separator: "None",
    section: "Inner",
    category: "Base",
    order: 1,
  },
  measure: {
    name: "MEASURE",
    detail: "拍子変更",
    syntax: new MarkdownString().appendCodeblock("#MEASURE" + " <measure>").value,
    documentation: "拍子を変更します。  \n" + "`4/4`で4分の4拍子、`6/8`で8分の6拍子になります。",
    parameter: [
      {
        name: "measure",
        description: "表紙  \n" + "`4/4`で4分の4拍子、`6/8`で8分の6拍子になります。",
      },
    ],
    separator: "None",
    section: "MeasureHead",
    category: "Base",
    order: 0,
    snippet: new SnippetString().appendText("MEASURE "),
  },
  scroll: {
    name: "SCROLL",
    detail: "スクロール速度変更",
    syntax: new MarkdownString().appendCodeblock("#SCROLL" + " <rate>").value,
    documentation: "譜面のスクロール速度を`<rate>`倍に変更します。  \n" + "デフォルトは`1`です。",
    parameter: [{ name: "rate", description: "スクロール速度（基準値: 1）" }],
    separator: "None",
    section: "Inner",
    category: "Base",
    order: 0,
    snippet: new SnippetString().appendText("SCROLL "),
  },
  delay: {
    name: "DELAY",
    detail: "譜面遅延（停止）",
    syntax: new MarkdownString().appendCodeblock("#DELAY" + " <second>").value,
    documentation:
      "譜面が流れてくるタイミングを`<second>`秒遅らせます。  \n" +
      "`#BMSCROLL`,`#HBSCROLL`適用下では譜面停止扱いになります。",
    parameter: [{ name: "second", description: "停止秒数" }],
    separator: "None",
    section: "Inner",
    category: "Base",
    order: 1,
    snippet: new SnippetString().appendText("DELAY "),
  },
  section: {
    name: "SECTION",
    detail: "分岐判定リセット",
    syntax: new MarkdownString().appendCodeblock("#SECTION").value,
    documentation:
      "譜面分岐の判定に使う連打数、精度をリセットします。  \n" +
      "分岐したい箇所の一小節以上前に置いてください。",
    parameter: [],
    separator: "None",
    section: "MeasureHead",
    category: "Base",
    order: 2,
  },
  branchstart: {
    name: "BRANCHSTART",
    detail: "分岐開始",
    syntax: new MarkdownString().appendCodeblock("#BRANCHSTART" + " <type>, <expart>, <master>")
      .value,
    documentation:
      "譜面分岐を開始します。  \n\n" +
      "`<type>`: 分岐条件を指定します。`r`で連打数、`p`で精度(%)、`s`でスコア。  \n" +
      "`<expart>`: 玄人譜面の分岐に必要な値。  \n" +
      "`<master>`: 達人譜面の分岐に必要な値。  \n\n" +
      "分岐判定は一小節前に行われます。  \n" +
      "一小節前から連打が始まる場合、その連打もカウントします。  \n\n" +
      "分岐後は普通譜面`#N`、玄人譜面`#E`、達人譜面`#M`で記述します。",
    parameter: [
      {
        name: "type",
        description: "分岐条件  \n" + "`r`で連打数、`p`で精度(%)、`s`でスコア。",
        snippet: [
          { value: "r", detail: "連打数" },
          { value: "p", detail: "精度(%)" },
          { value: "s", detail: "スコア" },
        ],
      },
      {
        name: "expart",
        description: "玄人譜面の分岐に必要な値",
      },
      {
        name: "master",
        description: "達人譜面の分岐に必要な値",
      },
    ],
    separator: "Comma",
    section: "Branch",
    category: "Base",
    order: 2,
    snippet: new SnippetString().appendText("BRANCHSTART "),
  },
  branchend: {
    name: "BRANCHEND",
    detail: "分岐終了",
    syntax: new MarkdownString().appendCodeblock("#BRANCHEND").value,
    documentation: "譜面分岐を終了します。  \n" + "以降は全ての分岐で共通の譜面が流れます。",
    parameter: [],
    separator: "None",
    section: "Branch",
    category: "Base",
    order: 2,
  },
  n: {
    name: "N",
    detail: "普通譜面",
    syntax: new MarkdownString().appendCodeblock("#N").value,
    documentation: "普通譜面を記述します。",
    parameter: [],
    separator: "None",
    section: "Branch",
    category: "Base",
    order: 2,
  },
  e: {
    name: "E",
    detail: "玄人譜面",
    syntax: new MarkdownString().appendCodeblock("#E").value,
    documentation: "玄人譜面を記述します。",
    parameter: [],
    separator: "None",
    section: "Branch",
    category: "Base",
    order: 2,
  },
  m: {
    name: "M",
    detail: "達人譜面",
    syntax: new MarkdownString().appendCodeblock("#M").value,
    documentation: "達人譜面を記述します。",
    parameter: [],
    separator: "None",
    section: "Branch",
    category: "Base",
    order: 2,
  },
  levelhold: {
    name: "LEVELHOLD",
    detail: "分岐固定",
    syntax: new MarkdownString().appendCodeblock("#LEVELHOLD").value,
    documentation:
      "現在の譜面分岐を固定します。  \n" +
      "この命令がある小節に到達した場合、以後も譜面分岐が行われなくなります。",
    parameter: [],
    separator: "None",
    section: "MeasureHead",
    category: "Base",
    order: 2,
  },
  bmscroll: {
    name: "BMSCROLL",
    detail: "スクロール方式変更",
    syntax: new MarkdownString().appendCodeblock("#BMSCROLL").value,
    documentation:
      "譜面のスクロールがBMS形式になります。  \n" + "`#START`より前に記述してください。",
    parameter: [],
    separator: "None",
    section: "Outer",
    category: "Base",
    order: 2,
  },
  hbscroll: {
    name: "HBSCROLL",
    detail: "スクロール方式変更",
    syntax: new MarkdownString().appendCodeblock("#HBSCROLL").value,
    documentation:
      "譜面のスクロールが`#BMSCROLL`に`#SCROLL`の効果を含めた形式になります。  \n" +
      "`#START`より前に記述してください。",
    parameter: [],
    separator: "None",
    section: "Outer",
    category: "Base",
    order: 2,
  },
  barlineoff: {
    name: "BARLINEOFF",
    detail: "小節線非表示",
    syntax: new MarkdownString().appendCodeblock("#BARLINEOFF").value,
    documentation: "小節線を非表示にします。",
    parameter: [],
    separator: "None",
    section: "MeasureHead",
    category: "Base",
    order: 1,
  },
  barlineon: {
    name: "BARLINEON",
    detail: "小節線表示",
    syntax: new MarkdownString().appendCodeblock("#BARLINEON").value,
    documentation: "小節線を表示します。",
    parameter: [],
    separator: "None",
    section: "MeasureHead",
    category: "Base",
    order: 1,
  },
  // TJAPlayer2forPC
  lyric: {
    name: "LYRIC",
    detail: "歌詞表示",
    syntax: new MarkdownString().appendCodeblock("#LYRIC" + " <string>").value,
    documentation: "歌詞を表示します。",
    parameter: [{ name: "string", description: "歌詞" }],
    separator: "None",
    section: "Inner",
    category: "TJAP",
    order: 2,
    snippet: new SnippetString().appendText("LYRIC "),
  },
  sudden: {
    name: "SUDDEN",
    detail: "音符の出現",
    syntax: new MarkdownString().appendCodeblock("#SUDDEN" + " <sudden> <move>").value,
    documentation:
      "音符の出現タイミングと動作タイミングを変更します。  \n" +
      "`<sudden>`秒前に出現し、`<move>`秒前に動き出します。  \n" +
      "`<sudden>`に`0`を指定すると通常の動作に戻ります（このとき`<move>`にも仮の値を指定する必要があります）。",
    parameter: [
      { name: "sudden", description: "出現にかかる事前秒数" },
      { name: "move", description: "動き出しにかかる事前秒数" },
    ],
    separator: "Space",
    section: "Inner",
    category: "TJAP",
    order: 1,
    snippet: new SnippetString().appendText("SUDDEN "),
  },
  direction: {
    name: "DIRECTION",
    detail: "スクロール方向変更",
    syntax: new MarkdownString().appendCodeblock("#DIRECTION" + " <direction>").value,
    documentation:
      "譜面の流れる方向を指定します。  \n\n" +
      "`0`: ←（通常）  \n" +
      "`1`: ↓  \n" +
      "`2`: ↑  \n" +
      "`3`: ↙  \n" +
      "`4`: ↖  \n" +
      "`5`: →  \n" +
      "`6`: ↘  \n" +
      "`7`: ↗",
    parameter: [
      {
        name: "direction",
        description: "スクロール方向",
        snippet: [
          { value: "0", detail: "←（通常）" },
          { value: "1", detail: "↓" },
          { value: "2", detail: "↑" },
          { value: "3", detail: "↙" },
          { value: "4", detail: "↖" },
          { value: "5", detail: "→" },
          { value: "6", detail: "↘" },
          { value: "7", detail: "↗" },
        ],
      },
    ],
    separator: "None",
    section: "Inner",
    category: "TJAP",
    order: 1,
    snippet: new SnippetString().appendText("DIRECTION "),
  },
  // TJAPlayer3
  jposscroll: {
    name: "JPOSSCROLL",
    detail: "判定枠移動",
    syntax: new MarkdownString().appendCodeblock("#JPOSSCROLL" + " <second> <px> <direction>")
      .value,
    documentation:
      "判定枠を左右に移動します。  \n\n" +
      "`<second>`: 移動にかかる秒数。  \n" +
      "`<px>`: 移動距離をpxで指定します。  \n" +
      "`<direction>`: 移動方向を`0`か`1`で指定します。`0`で左、`1`で右。",
    parameter: [
      {
        name: "second",
        description: "移動にかかる秒数",
      },
      {
        name: "px",
        description: "移動距離(px)",
      },
      {
        name: "direction",
        description: "移動方向",
        snippet: [
          { value: "0", detail: "←" },
          { value: "1", detail: "→" },
        ],
      },
    ],
    separator: "Space",
    section: "Inner",
    category: "TJAP",
    order: 1,
    snippet: new SnippetString().appendText("JPOSSCROLL "),
  },
  nextsong: {
    name: "NEXTSONG",
    detail: "段位道場の課題曲",
    syntax: new MarkdownString().appendCodeblock(
      "#NEXTSONG" + " <title>,<subtitle>,<genre>,<wave>,[<scoreinit>,<scorediff>,<level>,<course>]"
    ).value,
    documentation:
      "課題曲を指定します。  \n\n" +
      "`<title>`: タイトル  \n" +
      "`<subtitle>`: サブタイトル  \n" +
      "`<genre>`: ジャンル  \n" +
      "`<wave>`: 音源ファイル  \n" +
      "`<scoreinit>`: 配点初項  \n" +
      "`<scorediff>`: 配点公差  \n" +
      "`<level>`: レベル  \n" +
      "`<course>`: 難易度",
    parameter: [
      { name: "title", description: "タイトル" },
      { name: "subtitle", description: "サブタイトル" },
      { name: "genre", description: "ジャンル" },
      { name: "wave", description: "音源ファイル", snippet: "Audio" },
      { name: "scoreinit", description: "配点初項" },
      { name: "scorediff", description: "配点公差" },
      { name: "level", description: "レベル" },
      {
        name: "course",
        description: "難易度",
        snippet: [
          { value: "0", detail: "かんたん" },
          { value: "1", detail: "ふつう" },
          { value: "2", detail: "むずかしい" },
          { value: "3", detail: "おに" },
          { value: "4", detail: "エディット" },
          { value: "Easy", detail: "かんたん" },
          { value: "Normal", detail: "ふつう" },
          { value: "Hard", detail: "むずかしい" },
          { value: "Oni", detail: "おに" },
          { value: "Edit", detail: "エディット" },
        ],
      },
    ],
    separator: "Comma",
    section: "Song",
    category: "TJAP",
    order: 2,
    snippet: new SnippetString().appendText("NEXTSONG "),
  },
  senotechange: {
    name: "SENOTECHANGE",
    detail: "音符文字の変更",
    syntax: new MarkdownString().appendCodeblock("#SENOTECHANGE" + " <type>").value,
    documentation:
      "音符文字を変更します。  \n" +
      "`<type>`: `1` ~ `12`で指定します。  \n\n" +
      "### **種類**  \n" +
      "`1`: ドン  \n" +
      "`2`: ド  \n" +
      "`3`: コ  \n" +
      "`4`: カッ  \n" +
      "`5`: カ  \n" +
      "`6`: ドン(大)  \n" +
      "`7`: カッ(大)  \n" +
      "`8`: 連打  \n" +
      "`9`: ー  \n" +
      "`10`: ーっ!!  \n" +
      "`11`: 連打(大)  \n" +
      "`12`: ふうせん",
    parameter: [
      {
        name: "type",
        description: "音符文字",
        snippet: [
          { value: "1", detail: "ドン" },
          { value: "2", detail: "ド" },
          { value: "3", detail: "コ" },
          { value: "4", detail: "カッ" },
          { value: "5", detail: "カ" },
          { value: "6", detail: "ドン(大)" },
          { value: "7", detail: "カッ(大)" },
          { value: "8", detail: "連打" },
          { value: "9", detail: "ー" },
          { value: "10", detail: "ーっ!!" },
          { value: "11", detail: "連打(大)" },
          { value: "12", detail: "ふうせん" },
        ],
      },
    ],
    separator: "None",
    section: "Inner",
    category: "TJAP",
    order: 2,
    snippet: new SnippetString().appendText("SENOTECHANGE "),
  },
  // TaikoManyGimmicks
  judgedelay: {
    name: "JUDGEDELAY",
    detail: "判定位置の移動",
    syntax: new MarkdownString().appendCodeblock("#JUDGEDELAY" + " <type> [<x> <y> <z>]").value,
    documentation: new MarkdownString()
      .appendMarkdown("判定位置を判定枠からずらします。  \n")
      .appendMarkdown("譜面の流れる位置は判定位置に準拠します。  \n\n")
      .appendMarkdown(
        "`<type>`: 位置の指定方法。`0` ~ `3`で指定します。ここに指定した値によって以降のパラメーターが異なります。"
      )
      .appendCodeblock("#JUDGEDELAY 0")
      .appendMarkdown("判定位置を判定枠に戻します。")
      .appendCodeblock("#JUDGEDELAY 1 <x>")
      .appendMarkdown("判定枠から`<x>`秒前の位置にずらします。")
      .appendCodeblock("#JUDGEDELAY 2 <x> <y>")
      .appendMarkdown("判定枠から`<x>`,`<y>`軸の位置にずらします。")
      .appendCodeblock("#JUDGEDELAY 3 <x> <y> <z>")
      .appendMarkdown("判定枠から`<x>`,`<y>`軸かつ`<z>`秒前の位置にずらします。").value,
    parameter: [
      {
        name: "type",
        description:
          "位置の指定方法  \n" +
          "`0` ~ `3`で指定します。ここに指定した値によって以降のパラメーターが異なります。",
        snippet: [
          { value: "0", detail: "判定位置を元に戻す" },
          { value: "1", detail: "判定枠から`<x>`秒前の位置にずらす" },
          { value: "2", detail: "判定枠から`<x>`,`<y>`軸の位置にずらす" },
          { value: "3", detail: "判定枠から`<x>`,`<y>`軸かつ`<z>`秒前の位置にずらす" },
        ],
      },
      { name: "x", description: "`type`が`1`: ずらす秒数  \n" + "`type`が`2~3`: ずらすX軸" },
      { name: "y", description: "ずらすY軸" },
      { name: "z", description: "ずらす秒数" },
    ],
    separator: "Space",
    section: "Inner",
    category: "TMG",
    order: 1,
    snippet: new SnippetString().appendText("JUDGEDELAY "),
  },
  dummystart: {
    name: "DUMMYSTART",
    detail: "ダミー開始",
    syntax: new MarkdownString().appendCodeblock("#DUMMYSTART").value,
    documentation: "音符をダミーノーツにします。",
    parameter: [],
    separator: "None",
    section: "Inner",
    category: "TMG",
    order: 1,
  },
  dummyend: {
    name: "DUMMYEND",
    detail: "ダミー終了",
    syntax: new MarkdownString().appendCodeblock("#DUMMYEND").value,
    documentation: "音符を普通のノーツに戻します。",
    parameter: [],
    separator: "None",
    section: "Inner",
    category: "TMG",
    order: 1,
  },
  notespawn: {
    name: "NOTESPAWN",
    detail: "譜面の出現",
    syntax: new MarkdownString().appendCodeblock("#NOTESPAWN" + " <type> [<second>]").value,
    documentation: new MarkdownString()
      .appendMarkdown("譜面の出現･隠蔽タイミングを指定します。  \n\n")
      .appendMarkdown(
        "`<type>`: 動作種類の指定。`0` ~ `2`で指定します。ここに指定した値によって以降のパラメーターが異なります。"
      )
      .appendCodeblock("#NOTESPAWN 0")
      .appendMarkdown("通常の動作に戻します。")
      .appendCodeblock("#NOTESPAWN 1 <second>")
      .appendMarkdown("譜面を`<second>`秒前に出現させます。")
      .appendCodeblock("#NOTESPAWN 2 <second>")
      .appendMarkdown("譜面を`<second>`秒前に隠蔽します。").value,
    parameter: [
      {
        name: "type",
        description: "動作種類  \n" + "`0` ~ `2`で指定します。",
        snippet: [
          { value: "0", detail: "元に戻す" },
          { value: "1", detail: "出現" },
          { value: "2", detail: "隠蔽" },
        ],
      },
      {
        name: "second",
        description: "かける事前秒数",
      },
    ],
    separator: "Space",
    section: "Inner",
    category: "TMG",
    order: 1,
    snippet: new SnippetString().appendText("NOTESPAWN "),
  },
  size: {
    name: "SIZE",
    detail: "音符サイズ変更",
    syntax: new MarkdownString().appendCodeblock("#SIZE" + " <rate>").value,
    documentation: "音符のサイズを`<rate>`倍にします。",
    parameter: [{ name: "rate", description: "音符のサイズ（基準値: 1)" }],
    separator: "None",
    section: "Inner",
    category: "TMG",
    order: 1,
    snippet: new SnippetString().appendText("SIZE "),
  },
  color: {
    name: "COLOR",
    detail: "音符の色彩変更",
    syntax: new MarkdownString().appendCodeblock("#COLOR" + " <r> <g> <b>").value,
    documentation:
      "音符の色彩を変更します。  \n" +
      "255を基準値とします。  \n\n" +
      "`<r>`: 赤色  \n" +
      "`<g>`: 緑色  \n" +
      "`<b>`: 青色  \n",
    parameter: [
      { name: "r", description: "赤（基準値: 255）" },
      { name: "g", description: "緑（基準値: 255）" },
      { name: "b", description: "青（基準値: 255）" },
    ],
    separator: "Space",
    section: "Inner",
    category: "TMG",
    order: 1,
    snippet: new SnippetString().appendText("COLOR 255 255 255"),
  },
  angle: {
    name: "ANGLE",
    detail: "音符の向き変更",
    syntax: new MarkdownString().appendCodeblock("#ANGLE" + " <angle>").value,
    documentation: "音符の向きを`<angle>`度回転させます。",
    parameter: [{ name: "angle", description: "音符の向き（基準値: 0）" }],
    separator: "None",
    section: "Inner",
    category: "TMG",
    order: 1,
    snippet: new SnippetString().appendText("ANGLE "),
  },
  gradation: {
    name: "GRADATION",
    detail: "命令の時間的変化",
    syntax: new MarkdownString().appendCodeblock(
      "#GRADATION" + " <phase> [<second> <type> <curve>]"
    ).value,
    documentation: new MarkdownString()
      .appendMarkdown("他の命令の即時的な効果を時間的に変化させます。  \n\n")
      .appendMarkdown(
        "`<phase>`: `start`,`end`,`init`のいずれかを指定します。ここに指定した値によって以降のパラメーターが異なります。"
      )
      .appendCodeblock("#GRADATION start <second> <type> <curve>")
      .appendMarkdown("GRADATIONを開始します。  \n\n")
      .appendMarkdown("`<second>`: 何秒前に変化を始めるか。  \n")
      .appendMarkdown(
        "`<type>`: イージングの種類を`0` ~ `2`で指定します。`0`はEaseIn, `1`はEaseOut, `2`はEaseInOut。  \n"
      )
      .appendMarkdown("`<curve>`: 挙動を`0` ~ `10`で指定します。詳細は下部に記載。")
      .appendCodeblock("#GRADATION end")
      .appendMarkdown("GRADATIONを終了します。")
      .appendCodeblock("#GRADATION init")
      .appendMarkdown("GRADATIONを初期化します。  \n")
      .appendMarkdown("### **挙動の種類**  \n")
      .appendMarkdown("`0`: Linear（直線）  \n")
      .appendMarkdown("`1`: Sine（三角関数）  \n")
      .appendMarkdown("`2`: Quad（二次）  \n")
      .appendMarkdown("`3`: Cubic（三次）  \n")
      .appendMarkdown("`4`: Quart（四次）  \n")
      .appendMarkdown("`5`: Quint（五次）  \n")
      .appendMarkdown("`6`: Expo（指数）  \n")
      .appendMarkdown("`7`: Circ（円形）  \n")
      .appendMarkdown("`8`: Back（三次と二次）  \n")
      .appendMarkdown("`9`: Elastic（弾性）  \n")
      .appendMarkdown("`10`: Bounce（バウンド）  \n")
      .appendMarkdown("### **GRADATIONに対応する命令一覧**")
      .appendCodeblock("#SCROLL")
      .appendCodeblock("#JUDGEDELAY")
      .appendCodeblock("#SIZE")
      .appendCodeblock("#COLOR")
      .appendCodeblock("#ANGLE")
      .appendMarkdown("### **基本的な書き方**  \n")
      .appendMarkdown("`start` → 変化前の命令 → `end` → 変化後の命令  \n")
      .appendMarkdown("と続けて書くことで動作します。")
      .appendCodeblock("#GRADATION start 1 0 0")
      .appendCodeblock("#SIZE 1 // 変化前の命令")
      .appendCodeblock("#GRADATION end")
      .appendCodeblock("#SIZE 2 // 変化後の命令")
      .appendCodeblock("1111,").value,
    parameter: [
      {
        name: "phase",
        description: "`start`,`end`,`init`のいずれかを指定",
        snippet: [
          { value: "start", detail: "開始" },
          { value: "end", detail: "終了" },
          { value: "init", detail: "初期化" },
        ],
      },
      {
        name: "second",
        description: "何秒前に変化を始めるか",
      },
      {
        name: "type",
        description:
          "イージング種類  \n" +
          "`0` ~ `2`で指定します。  \n" +
          "`0`はEaseIn, `1`はEaseOut, `2`はEaseInOut。",
        snippet: [
          { value: "0", detail: "EaseIn" },
          { value: "1", detail: "EaseOut" },
          { value: "2", detail: "EaseInOut" },
        ],
      },
      {
        name: "curve",
        description:
          "イージング挙動  \n" +
          "`0` ~ `10`で指定します。  \n" +
          "`0`: Linear（直線）  \n" +
          "`1`: Sine（三角関数）  \n" +
          "`2`: Quad（二次）  \n" +
          "`3`: Cubic（三次）  \n" +
          "`4`: Quart（四次）  \n" +
          "`5`: Quint（五次）  \n" +
          "`6`: Expo（指数）  \n" +
          "`7`: Circ（円形）  \n" +
          "`8`: Back（三次と二次）  \n" +
          "`9`: Elastic（弾性）  \n" +
          "`10`: Bounce（バウンド）",
        snippet: [
          { value: "0", detail: "Linear（直線）" },
          { value: "1", detail: "Sine（三角関数）" },
          { value: "2", detail: "Quad（二次）" },
          { value: "3", detail: "Cubic（三次）" },
          { value: "4", detail: "Quart（四次）" },
          { value: "5", detail: "Quint（五次）" },
          { value: "6", detail: "Expo（指数）" },
          { value: "7", detail: "Circ（円形）" },
          { value: "8", detail: "Back（三次と二次）" },
          { value: "9", detail: "Elastic（弾性）" },
          { value: "10", detail: "Bounce（バウンド）" },
        ],
      },
    ],
    separator: "Space",
    section: "Inner",
    category: "TMG",
    order: 1,
    snippet: new SnippetString().appendText("GRADATION "),
  },
  barlinesize: {
    name: "BARLINESIZE",
    detail: "小節線サイズ変更",
    syntax: new MarkdownString().appendCodeblock("#BARLINESIZE" + " <width> <height>").value,
    documentation:
      "小節線のサイズを変更します。  \n\n" +
      "`<width>`: 横幅をpxで指定します。  \n" +
      "`<height>`: 縦幅をpxで指定します。",
    parameter: [
      { name: "width", description: "横幅(px)" },
      { name: "height", description: "縦幅(px)" },
    ],
    separator: "Space",
    section: "Inner",
    category: "TMG",
    order: 1,
    snippet: new SnippetString().appendText("BARLINESIZE "),
  },
  resetcommand: {
    name: "RESETCOMMAND",
    detail: "命令のリセット",
    syntax: new MarkdownString().appendCodeblock("#RESETCOMMAND").value,
    documentation: "全ての命令の効果を初期値に戻します。",
    parameter: [],
    separator: "None",
    section: "Inner",
    category: "TMG",
    order: 2,
  },
  alpha: {
    name: "ALPHA",
    detail: "音符の透明度変更",
    syntax: new MarkdownString().appendCodeblock("#ALPHA" + " <alpha>").value,
    documentation:
      "音符の透明度を変更します。  \n" + "255を基準値とします。  \n\n" + "`<alpha>`: 透明度",
    parameter: [{ name: "alpha", description: "音符の透明度（基準値: 255）" }],
    separator: "Space",
    section: "Inner",
    category: "TMG",
    order: 1,
    snippet: new SnippetString().appendText("ALPHA "),
  },
  hispeed: {
    name: "HISPEED",
    detail: "疑似速度変更",
    syntax: new MarkdownString().appendCodeblock("#HISPEED" + " <rate>").value,
    documentation:
      "`#BMSCROLL`中にBPMを変更したときのようにスクロール速度を変更します。  \n" +
      "デフォルトは`1`です。",
    parameter: [{ name: "rate", description: "スクロール速度（基準値: 1）" }],
    separator: "None",
    section: "Inner",
    category: "TMG",
    order: 1,
    snippet: new SnippetString().appendText("HISPEED "),
  },
  include: {
    name: "INCLUDE",
    detail: "定義の読み込み",
    syntax: new MarkdownString().appendCodeblock("#INCLUDE" + " <filepath>").value,
    documentation: "ファイルからヘッダーや命令を読み込みます。",
    parameter: [{ name: "filepath", description: "定義ファイル", snippet: "File" }],
    separator: "None",
    section: "Unknown",
    category: "TMG",
    order: 2,
    snippet: new SnippetString().appendText("INCLUDE "),
  },
  // OpenTaiko
  nmscroll: {
    name: "NMSCROLL",
    detail: "スクロール方式変更",
    syntax: new MarkdownString().appendCodeblock("#NMSCROLL").value,
    documentation: "譜面のスクロールをデフォルトに戻します。",
    parameter: [],
    separator: "None",
    section: "Unknown",
    category: "OpTk",
    order: 2,
  },
  barline: {
    name: "BARLINE",
    detail: "偽の小節線",
    syntax: new MarkdownString().appendCodeblock("#BARLINE").value,
    documentation: "偽の小節線を表示します。",
    parameter: [],
    separator: "None",
    section: "Inner",
    category: "OpTk",
    order: 1,
  },
  bgaon: {
    name: "BGAON",
    detail: "BGAの再生",
    syntax: new MarkdownString().appendCodeblock("#BGAON <index> <offset>").value,
    documentation: "BGAを再生します。",
    parameter: [
      { name: "index", description: "" },
      { name: "offset", description: "" },
    ],
    separator: "Space",
    section: "Inner",
    category: "OpTk",
    order: 1,
    snippet: new SnippetString().appendText("BGAON "),
  },
  bgaoff: {
    name: "BGAOFF",
    detail: "BGAの停止",
    syntax: new MarkdownString().appendCodeblock("#BGAOFF <index>").value,
    documentation: "BGAを停止します。",
    parameter: [{ name: "index", description: "" }],
    separator: "None",
    section: "Inner",
    category: "OpTk",
    order: 1,
    snippet: new SnippetString().appendText("BGAOFF "),
  },
});
