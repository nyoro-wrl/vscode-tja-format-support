import { MarkdownString, SnippetString } from "vscode";
import { CommandCollection } from "../types/command";
import { getLocalizedCommandInfo, getLocalizedCommandParamDescription } from "../util/i18nHelper";

/**
 * 命令の仕様一覧
 */
export const commands = new CommandCollection({
  // 太鼓さん次郎
  start: {
    name: "START",
    get detail() { 
      return getLocalizedCommandInfo("start").detail; 
    },
    get documentation() { 
      return getLocalizedCommandInfo("start").documentation; 
    },
    parameter: [
      {
        name: "player",
        get description() { 
          return getLocalizedCommandParamDescription("start", "playerDescription"); 
        },
        snippet: [
          { value: "P1", detail: "1Pサイド" },
          { value: "P2", detail: "2Pサイド" },
        ],
        isOptional: true,
      },
    ],
    separator: "None",
    section: "Start",
    category: "Base",
    order: 2,
  },
  end: {
    name: "END",
    get detail() { 
      return getLocalizedCommandInfo("end").detail; 
    },
    get documentation() { 
      return getLocalizedCommandInfo("end").documentation; 
    },
    parameter: [],
    separator: "None",
    section: "End",
    category: "Base",
    order: 2,
  },
  bpmchange: {
    name: "BPMCHANGE",
    get detail() { 
      return getLocalizedCommandInfo("bpmchange").detail; 
    },
    get documentation() { 
      return getLocalizedCommandInfo("bpmchange").documentation; 
    },
    parameter: [{ 
      name: "bpm", 
      get description() { 
        return getLocalizedCommandParamDescription("bpmchange", "bpmDescription"); 
      } 
    }],
    separator: "None",
    section: "Inner",
    category: "Base",
    order: 0,
  },
  gogostart: {
    name: "GOGOSTART",
    get detail() { 
      return getLocalizedCommandInfo("gogostart").detail; 
    },
    get documentation() { 
      return getLocalizedCommandInfo("gogostart").documentation; 
    },
    parameter: [],
    separator: "None",
    section: "Inner",
    category: "Base",
    order: 1,
  },
  gogoend: {
    name: "GOGOEND",
    get detail() { 
      return getLocalizedCommandInfo("gogoend").detail; 
    },
    get documentation() { 
      return getLocalizedCommandInfo("gogoend").documentation; 
    },
    parameter: [],
    separator: "None",
    section: "Inner",
    category: "Base",
    order: 1,
  },
  measure: {
    name: "MEASURE",
    get detail() { 
      return getLocalizedCommandInfo("measure").detail; 
    },
    get documentation() { 
      return getLocalizedCommandInfo("measure").documentation; 
    },
    parameter: [
      {
        name: "measure",
        get description() { 
          return getLocalizedCommandParamDescription("measure", "measureDescription"); 
        },
      },
    ],
    separator: "None",
    section: "MeasureHead",
    category: "Base",
    order: 0,
  },
  scroll: {
    name: "SCROLL",
    get detail() { 
      return getLocalizedCommandInfo("scroll").detail; 
    },
    get documentation() { 
      return getLocalizedCommandInfo("scroll").documentation; 
    },
    parameter: [{ 
      name: "rate", 
      get description() { 
        return getLocalizedCommandParamDescription("scroll", "rateDescription"); 
      } 
    }],
    separator: "None",
    section: "Inner",
    category: "Base",
    order: 0,
  },
  delay: {
    name: "DELAY",
    get detail() { 
      return getLocalizedCommandInfo("delay").detail; 
    },
    get documentation() { 
      return getLocalizedCommandInfo("delay").documentation; 
    },
    parameter: [{ 
      name: "second", 
      get description() { 
        return getLocalizedCommandParamDescription("delay", "secondDescription"); 
      } 
    }],
    separator: "None",
    section: "Inner",
    category: "Base",
    order: 1,
  },
  section: {
    name: "SECTION",
    get detail() { 
      return getLocalizedCommandInfo("section").detail; 
    },
    get documentation() { 
      return getLocalizedCommandInfo("section").documentation; 
    },
    parameter: [],
    separator: "None",
    section: "MeasureHead",
    category: "Base",
    order: 2,
  },
  branchstart: {
    name: "BRANCHSTART",
    get detail() { 
      return getLocalizedCommandInfo("branchstart").detail; 
    },
    get documentation() { 
      return getLocalizedCommandInfo("branchstart").documentation; 
    },
    parameter: [
      {
        name: "type",
        get description() { 
          return getLocalizedCommandParamDescription("branchstart", "typeDescription"); 
        },
        snippet: [
          { value: "r", detail: "連打数" },
          { value: "p", detail: "精度(%)" },
          { value: "s", detail: "スコア" },
        ],
      },
      {
        name: "expart",
        get description() {
          return getLocalizedCommandParamDescription("branchstart", "expertDescription");
        },
      },
      {
        name: "master",
        get description() {
          return getLocalizedCommandParamDescription("branchstart", "masterDescription");
        },
      },
    ],
    separator: "Comma",
    section: "Branch",
    category: "Base",
    order: 2,
  },
  branchend: {
    name: "BRANCHEND",
    get detail() { 
      return getLocalizedCommandInfo("branchend").detail; 
    },
    get documentation() { 
      return getLocalizedCommandInfo("branchend").documentation; 
    },
    parameter: [],
    separator: "None",
    section: "Branch",
    category: "Base",
    order: 2,
  },
  n: {
    name: "N",
    get detail() { 
      return getLocalizedCommandInfo("n").detail; 
    },
    get documentation() { 
      return getLocalizedCommandInfo("n").documentation; 
    },
    parameter: [],
    separator: "None",
    section: "Branch",
    category: "Base",
    order: 2,
  },
  e: {
    name: "E",
    get detail() { 
      return getLocalizedCommandInfo("e").detail; 
    },
    get documentation() { 
      return getLocalizedCommandInfo("e").documentation; 
    },
    parameter: [],
    separator: "None",
    section: "Branch",
    category: "Base",
    order: 2,
  },
  m: {
    name: "M",
    get detail() { 
      return getLocalizedCommandInfo("m").detail; 
    },
    get documentation() { 
      return getLocalizedCommandInfo("m").documentation; 
    },
    parameter: [],
    separator: "None",
    section: "Branch",
    category: "Base",
    order: 2,
  },
  levelhold: {
    name: "LEVELHOLD",
    get detail() { 
      return getLocalizedCommandInfo("levelhold").detail; 
    },
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
    documentation: "歌詞を表示します。",
    parameter: [{ name: "string", description: "歌詞" }],
    separator: "None",
    section: "Inner",
    category: "TJAP",
    order: 2,
  },
  sudden: {
    name: "SUDDEN",
    detail: "音符の出現",
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
  },
  direction: {
    name: "DIRECTION",
    detail: "スクロール方向変更",
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
        description:
          "スクロール方向  \n" +
          "`0`: ←（通常）  \n" +
          "`1`: ↓  \n" +
          "`2`: ↑  \n" +
          "`3`: ↙  \n" +
          "`4`: ↖  \n" +
          "`5`: →  \n" +
          "`6`: ↘  \n" +
          "`7`: ↗",
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
  },
  // TJAPlayer3
  jposscroll: {
    name: "JPOSSCROLL",
    detail: "判定枠移動",
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
        description: "移動方向  \n" + "`0`: ←  \n" + "`1`: →",
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
  },
  nextsong: {
    name: "NEXTSONG",
    detail: "段位道場の課題曲",
    documentation:
      "課題曲を指定します。  \n\n" +
      "`<title>`: タイトル  \n" +
      "`<subtitle>`: サブタイトル  \n" +
      "`<genre>`: ジャンル  \n" +
      "`<wave>`: 音源ファイル  \n" +
      "`<scoreinit>`: 配点初項  \n" +
      "`<scorediff>`: 配点公差  \n" +
      "`<level>`: レベル  \n" +
      "`<course>`: 難易度  \n" +
      "`<hide>`: タイトルを隠す",
    parameter: [
      { name: "title", description: "タイトル" },
      { name: "subtitle", description: "サブタイトル" },
      { name: "genre", description: "ジャンル" },
      { name: "wave", description: "音源ファイル", snippet: "Audio" },
      { name: "scoreinit", description: "配点初項", isOptional: true },
      { name: "scorediff", description: "配点公差", isOptional: true },
      { name: "level", description: "レベル", isOptional: true },
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
        isOptional: true,
      },
      {
        name: "hide",
        description: "タイトルを隠す  \n" + "`True`でタイトルを隠します。",
        snippet: [{ value: "True", detail: "タイトルを隠す" }],
        isOptional: true,
      },
    ],
    separator: "Comma",
    section: "Song",
    category: "TJAP",
    order: 2,
  },
  senotechange: {
    name: "SENOTECHANGE",
    detail: "音符文字の変更",
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
  },
  // TaikoManyGimmicks
  judgedelay: {
    name: "JUDGEDELAY",
    detail: "判定位置の移動",
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
          { value: "1", detail: "判定枠から<x>秒前の位置にずらす" },
          { value: "2", detail: "判定枠から<x>,<y>軸の位置にずらす" },
          { value: "3", detail: "判定枠から<x>,<y>軸かつ<z>秒前の位置にずらす" },
        ],
      },
      {
        name: "x",
        description: "`type`が`1`: ずらす秒数  \n" + "`type`が`2~3`: ずらすX軸",
        isOptional: true,
      },
      {
        name: "y",
        description: "ずらすY軸",
        isOptional: true,
      },
      {
        name: "z",
        description: "ずらす秒数",
        isOptional: true,
      },
    ],
    separator: "Space",
    section: "Inner",
    category: "TMG",
    order: 1,
  },
  dummystart: {
    name: "DUMMYSTART",
    detail: "ダミー開始",
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
        description: "動作種類  \n" + "`0`: 元に戻す  \n" + "`1`: 出現  \n" + "`2`: 隠蔽",
        snippet: [
          { value: "0", detail: "元に戻す" },
          { value: "1", detail: "出現" },
          { value: "2", detail: "隠蔽" },
        ],
      },
      {
        name: "second",
        description: "かける事前秒数",
        isOptional: true,
      },
    ],
    separator: "Space",
    section: "Inner",
    category: "TMG",
    order: 1,
  },
  size: {
    name: "SIZE",
    detail: "音符サイズ変更",
    documentation: "音符のサイズを`<rate>`倍にします。",
    parameter: [{ name: "rate", description: "音符のサイズ（基準値: 1)" }],
    separator: "None",
    section: "Inner",
    category: "TMG",
    order: 1,
  },
  color: {
    name: "COLOR",
    detail: "音符の色彩変更",
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
    snippet: new SnippetString().appendText("COLOR ").appendPlaceholder("255 255 255"),
  },
  angle: {
    name: "ANGLE",
    detail: "音符の向き変更",
    documentation: "音符の向きを`<angle>`度回転させます。",
    parameter: [{ name: "angle", description: "音符の向き（基準値: 0）" }],
    separator: "None",
    section: "Inner",
    category: "TMG",
    order: 1,
  },
  gradation: {
    name: "GRADATION",
    detail: "命令の時間的変化",
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
        isOptional: true,
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
        isOptional: true,
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
        isOptional: true,
      },
    ],
    separator: "Space",
    section: "Inner",
    category: "TMG",
    order: 1,
  },
  barlinesize: {
    name: "BARLINESIZE",
    detail: "小節線サイズ変更",
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
  },
  resetcommand: {
    name: "RESETCOMMAND",
    detail: "命令のリセット",
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
    documentation:
      "音符の透明度を変更します。  \n" + "255を基準値とします。  \n\n" + "`<alpha>`: 透明度",
    parameter: [{ name: "alpha", description: "音符の透明度（基準値: 255）" }],
    separator: "Space",
    section: "Inner",
    category: "TMG",
    order: 1,
  },
  hispeed: {
    name: "HISPEED",
    detail: "疑似速度変更",
    documentation:
      "`#BMSCROLL`中にBPMを変更したときのようにスクロール速度を変更します。  \n" +
      "デフォルトは`1`です。",
    parameter: [{ name: "rate", description: "スクロール速度（基準値: 1）" }],
    separator: "None",
    section: "Inner",
    category: "TMG",
    order: 1,
  },
  include: {
    name: "INCLUDE",
    detail: "定義の読み込み",
    documentation: "ファイルからヘッダーや命令を読み込みます。",
    parameter: [{ name: "filepath", description: "定義ファイル", snippet: "File" }],
    separator: "None",
    section: "Unknown",
    category: "TMG",
    order: 2,
  },
  // OpenTaiko
  nmscroll: {
    name: "NMSCROLL",
    detail: "スクロール方式変更",
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
    documentation: "BGAを再生します。",
    parameter: [
      { name: "index", description: "" },
      { name: "offset", description: "" },
    ],
    separator: "Space",
    section: "Inner",
    category: "OpTk",
    order: 1,
  },
  bgaoff: {
    name: "BGAOFF",
    detail: "BGAの停止",
    documentation: "BGAを停止します。",
    parameter: [{ name: "index", description: "" }],
    separator: "None",
    section: "Inner",
    category: "OpTk",
    order: 1,
  },
});
