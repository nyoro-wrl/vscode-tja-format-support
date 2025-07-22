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
    regexp: /^START$/,
    syntax: new MarkdownString().appendCodeblock("#START" + " [<player>]").value,
    snippet: new SnippetString().appendText("START").value,
    documentation: new MarkdownString()
      .appendMarkdown("譜面データの記述を開始します。  \n")
      .appendMarkdown("`#START`と`#END`で囲んだ範囲が譜面データとして解釈されます。  \n\n")
      .appendMarkdown(
        "`<player>`に`P1`や`P2`を指定することで、譜面をプレイヤー別に記述することができます。"
      ).value,
    separator: "None",
    section: "Start",
    category: "Base",
    order: 2,
  },
  end: {
    name: "END",
    detail: "終了",
    regexp: /^END$/,
    syntax: new MarkdownString().appendCodeblock("#END").value,
    snippet: new SnippetString().appendText("END").value,
    documentation: new MarkdownString()
      .appendMarkdown("譜面データの記述を終了します。  \n")
      .appendMarkdown("`#START`と`#END`で囲んだ範囲が譜面データとして解釈されます。").value,
    separator: "None",
    section: "End",
    category: "Base",
    order: 2,
  },
  bpmchange: {
    name: "BPMCHANGE",
    detail: "BPM変更",
    regexp: /^BPMCHANGE$/,
    syntax: new MarkdownString().appendCodeblock("#BPMCHANGE" + " <bpm>").value,
    snippet: new SnippetString().appendText("BPMCHANGE ").value,
    documentation: new MarkdownString().appendMarkdown("BPMを変更します。").value,
    separator: "None",
    section: "Inner",
    category: "Base",
    order: 0,
  },
  gogostart: {
    name: "GOGOSTART",
    detail: "ゴーゴー開始",
    regexp: /^GOGOSTART$/,
    syntax: new MarkdownString().appendCodeblock("#GOGOSTART").value,
    snippet: new SnippetString().appendText("GOGOSTART").value,
    documentation: new MarkdownString().appendMarkdown("ゴーゴータイムを開始します。").value,
    separator: "None",
    section: "Inner",
    category: "Base",
    order: 1,
  },
  gogoend: {
    name: "GOGOEND",
    detail: "ゴーゴー終了",
    regexp: /^GOGOEND$/,
    syntax: new MarkdownString().appendCodeblock("#GOGOEND").value,
    snippet: new SnippetString().appendText("GOGOEND").value,
    documentation: new MarkdownString().appendMarkdown("ゴーゴータイムを終了します。").value,
    separator: "None",
    section: "Inner",
    category: "Base",
    order: 1,
  },
  measure: {
    name: "MEASURE",
    detail: "拍子変更",
    regexp: /^MEASURE$/,
    syntax: new MarkdownString().appendCodeblock("#MEASURE" + " <numer>/<denom>").value,
    snippet: new SnippetString().appendText("MEASURE ").value,
    documentation: new MarkdownString()
      .appendMarkdown("拍子を変更します。  \n")
      .appendMarkdown("`4/4`で4分の4拍子、`6/8`で8分の6拍子になります。").value,
    separator: "None",
    section: "MeasureHead",
    category: "Base",
    order: 0,
  },
  scroll: {
    name: "SCROLL",
    detail: "スクロール速度変更",
    regexp: /^SCROLL$/,
    syntax: new MarkdownString().appendCodeblock("#SCROLL" + " <rate>").value,
    snippet: new SnippetString().appendText("SCROLL ").value,
    documentation: new MarkdownString()
      .appendMarkdown("譜面のスクロール速度を`<rate>`倍に変更します。  \n")
      .appendMarkdown("デフォルトは`1.00`です。").value,
    separator: "None",
    section: "Inner",
    category: "Base",
    order: 0,
  },
  delay: {
    name: "DELAY",
    detail: "譜面遅延（停止）",
    regexp: /^DELAY$/,
    syntax: new MarkdownString().appendCodeblock("#DELAY" + " <second>").value,
    snippet: new SnippetString().appendText("DELAY ").value,
    documentation: new MarkdownString()
      .appendMarkdown("譜面が流れてくるタイミングを`<second>`秒遅らせます。  \n")
      .appendMarkdown("`#BMSCROLL`,`#HBSCROLL`適用下では譜面停止扱いになります。").value,
    separator: "None",
    section: "Inner",
    category: "Base",
    order: 1,
  },
  section: {
    name: "SECTION",
    detail: "分岐判定リセット",
    regexp: /^SECTION$/,
    syntax: new MarkdownString().appendCodeblock("#SECTION").value,
    snippet: new SnippetString().appendText("SECTION").value,
    documentation: new MarkdownString()
      .appendMarkdown("譜面分岐の判定に使う連打数、精度をリセットします。  \n")
      .appendMarkdown("分岐したい箇所の一小節以上前に置いてください。").value,
    separator: "None",
    section: "MeasureHead",
    category: "Base",
    order: 2,
  },
  branchstart: {
    name: "BRANCHSTART",
    detail: "分岐開始",
    regexp: /^BRANCHSTART$/,
    syntax: new MarkdownString().appendCodeblock("#BRANCHSTART" + " <type>, <expart>, <master>")
      .value,
    snippet: new SnippetString().appendText("BRANCHSTART ").value,
    documentation: new MarkdownString()
      .appendMarkdown("譜面分岐を開始します。  \n\n")
      .appendMarkdown(
        "`<type>`: 分岐条件を指定します。`r`で連打数、`p`で精度(%)、`s`でスコア。  \n"
      )
      .appendMarkdown("`<expart>`: この数値以上で玄人譜面に分岐します。  \n")
      .appendMarkdown("`<master>`: この数値以上で達人譜面に分岐します。  \n\n")
      .appendMarkdown("分岐判定は一小節前に行われます。  \n")
      .appendMarkdown("一小節前から連打が始まる場合、その連打もカウントします。  \n\n")
      .appendMarkdown("分岐後は普通譜面`#N`、玄人譜面`#E`、達人譜面`#M`で記述します。").value,
    separator: "Comma",
    section: "Branch",
    category: "Base",
    order: 2,
  },
  branchend: {
    name: "BRANCHEND",
    detail: "分岐終了",
    regexp: /^BRANCHEND$/,
    syntax: new MarkdownString().appendCodeblock("#BRANCHEND").value,
    snippet: new SnippetString().appendText("BRANCHEND").value,
    documentation: new MarkdownString()
      .appendMarkdown("譜面分岐を終了します。  \n")
      .appendMarkdown("以降は全ての分岐で共通の譜面が流れます。").value,
    separator: "None",
    section: "Branch",
    category: "Base",
    order: 2,
  },
  n: {
    name: "N",
    detail: "普通譜面",
    regexp: /^N$/,
    syntax: new MarkdownString().appendCodeblock("#N").value,
    snippet: new SnippetString().appendText("N").value,
    documentation: new MarkdownString().appendMarkdown("普通譜面を記述します。").value,
    separator: "None",
    section: "Branch",
    category: "Base",
    order: 2,
  },
  e: {
    name: "E",
    detail: "玄人譜面",
    regexp: /^E$/,
    syntax: new MarkdownString().appendCodeblock("#E").value,
    snippet: new SnippetString().appendText("E").value,
    documentation: new MarkdownString().appendMarkdown("玄人譜面を記述します。").value,
    separator: "None",
    section: "Branch",
    category: "Base",
    order: 2,
  },
  m: {
    name: "M",
    detail: "達人譜面",
    regexp: /^M$/,
    syntax: new MarkdownString().appendCodeblock("#M").value,
    snippet: new SnippetString().appendText("M").value,
    documentation: new MarkdownString().appendMarkdown("達人譜面を記述します。").value,
    separator: "None",
    section: "Branch",
    category: "Base",
    order: 2,
  },
  levelhold: {
    name: "LEVELHOLD",
    detail: "分岐固定",
    regexp: /^LEVELHOLD$/,
    syntax: new MarkdownString().appendCodeblock("#LEVELHOLD").value,
    snippet: new SnippetString().appendText("LEVELHOLD").value,
    documentation: new MarkdownString()
      .appendMarkdown("現在の譜面分岐を固定します。  \n")
      .appendMarkdown("この命令がある小節に到達した場合、以後も譜面分岐が行われなくなります。")
      .value,
    separator: "None",
    section: "MeasureHead",
    category: "Base",
    order: 2,
  },
  bmscroll: {
    name: "BMSCROLL",
    detail: "スクロール方式変更",
    regexp: /^BMSCROLL$/,
    syntax: new MarkdownString().appendCodeblock("#BMSCROLL").value,
    snippet: new SnippetString().appendText("BMSCROLL").value,
    documentation: new MarkdownString()
      .appendMarkdown("譜面のスクロールがBMS形式になります。  \n")
      .appendMarkdown("`#START`より前に記述してください。").value,
    separator: "None",
    section: "Outer",
    category: "Base",
    order: 2,
  },
  hbscroll: {
    name: "HBSCROLL",
    detail: "スクロール方式変更",
    regexp: /^HBSCROLL$/,
    syntax: new MarkdownString().appendCodeblock("#HBSCROLL").value,
    snippet: new SnippetString().appendText("HBSCROLL").value,
    documentation: new MarkdownString()
      .appendMarkdown("譜面のスクロールが`#BMSCROLL`に`#SCROLL`の効果を含めた形式になります。  \n")
      .appendMarkdown("`#START`より前に記述してください。").value,
    separator: "None",
    section: "Outer",
    category: "Base",
    order: 2,
  },
  barlineoff: {
    name: "BARLINEOFF",
    detail: "小節線非表示",
    regexp: /^BARLINEOFF$/,
    syntax: new MarkdownString().appendCodeblock("#BARLINEOFF").value,
    snippet: new SnippetString().appendText("BARLINEOFF").value,
    documentation: new MarkdownString().appendMarkdown("小節線を非表示にします。").value,
    separator: "None",
    section: "MeasureHead",
    category: "Base",
    order: 1,
  },
  barlineon: {
    name: "BARLINEON",
    detail: "小節線表示",
    regexp: /^BARLINEON$/,
    syntax: new MarkdownString().appendCodeblock("#BARLINEON").value,
    snippet: new SnippetString().appendText("BARLINEON").value,
    documentation: new MarkdownString().appendMarkdown("小節線を表示します。").value,
    separator: "None",
    section: "MeasureHead",
    category: "Base",
    order: 1,
  },
  // TJAPlayer2forPC
  lyric: {
    name: "LYRIC",
    detail: "歌詞表示",
    regexp: /^LYRIC$/,
    syntax: new MarkdownString().appendCodeblock("#LYRIC" + " <string>").value,
    snippet: new SnippetString().appendText("LYRIC ").value,
    documentation: new MarkdownString().appendMarkdown("歌詞を表示します。").value,
    separator: "None",
    section: "Inner",
    category: "TJAP",
    order: 2,
  },
  sudden: {
    name: "SUDDEN",
    detail: "音符の出現",
    regexp: /^SUDDEN$/,
    syntax: new MarkdownString().appendCodeblock("#SUDDEN" + " <sudden> <move>").value,
    snippet: new SnippetString().appendText("SUDDEN ").value,
    documentation: new MarkdownString()
      .appendMarkdown("音符の出現タイミングと動作タイミングを変更します。  \n")
      .appendMarkdown("`<sudden>`秒前に出現し、`<move>`秒前に動き出します。  \n")
      .appendMarkdown(
        "`<sudden>`に`0`を指定すると通常の動作に戻ります（このとき`<move>`にも仮の値を指定する必要があります）。"
      ).value,
    separator: "Space",
    section: "Inner",
    category: "TJAP",
    order: 1,
  },
  direction: {
    name: "DIRECTION",
    detail: "スクロールの向き変更",
    regexp: /^DIRECTION$/,
    syntax: new MarkdownString().appendCodeblock("#DIRECTION" + " <direction>").value,
    snippet: new SnippetString().appendText("DIRECTION ").value,
    documentation: new MarkdownString()
      .appendMarkdown("譜面の流れる方向を指定します。  \n\n")
      .appendMarkdown("`0`: ←（通常）  \n")
      .appendMarkdown("`1`: ↓  \n")
      .appendMarkdown("`2`: ↑  \n")
      .appendMarkdown("`3`: ↙  \n")
      .appendMarkdown("`4`: ↖  \n")
      .appendMarkdown("`5`: →  \n")
      .appendMarkdown("`6`: ↘  \n")
      .appendMarkdown("`7`: ↗").value,
    separator: "None",
    section: "Inner",
    category: "TJAP",
    order: 1,
  },
  // TJAPlayer3
  jposscroll: {
    name: "JPOSSCROLL",
    detail: "判定枠移動",
    regexp: /^JPOSSCROLL$/,
    syntax: new MarkdownString().appendCodeblock("#JPOSSCROLL" + " <second> <distance> <direction>")
      .value,
    snippet: new SnippetString().appendText("JPOSSCROLL ").value,
    documentation: new MarkdownString()
      .appendMarkdown("判定枠を左右に移動します。  \n\n")
      .appendMarkdown("`<second>`: 移動にかかる秒数。  \n")
      .appendMarkdown("`<distance>`: 移動距離をpxで指定します。  \n")
      .appendMarkdown("`<direction>`: 移動方向を`0`か`1`で指定します。`0`で左、`1`で右。").value,
    separator: "Space",
    section: "Inner",
    category: "TJAP",
    order: 1,
  },
  nextsong: {
    name: "NEXTSONG",
    detail: "段位道場の課題曲",
    regexp: /^NEXTSONG$/,
    syntax: new MarkdownString().appendCodeblock(
      "#NEXTSONG" + " <title>,<subtitle>,<genre>,<wave>,[<scoreinit>,<scorediff>,<level>,<course>]"
    ).value,
    snippet: new SnippetString().appendText("NEXTSONG ").value,
    documentation: new MarkdownString()
      .appendMarkdown("課題曲を指定します。  \n\n")
      .appendMarkdown("`<title>`: タイトル  \n")
      .appendMarkdown("`<subtitle>`: サブタイトル  \n")
      .appendMarkdown("`<genre>`: ジャンル  \n")
      .appendMarkdown("`<wave>`: 音源ファイル  \n")
      .appendMarkdown("`<scoreinit>`: 初項  \n")
      .appendMarkdown("`<scorediff>`: 公差  \n")
      .appendMarkdown("`<level>`: レベル  \n")
      .appendMarkdown("`<course>`: 難易度  \n").value,
    separator: "Comma",
    section: "Song",
    category: "TJAP",
    order: 2,
  },
  senotechange: {
    name: "SENOTECHANGE",
    detail: "",
    regexp: /^SENOTECHANGE$/,
    syntax: new MarkdownString().appendCodeblock("#SENOTECHANGE" + " <type>").value,
    snippet: new SnippetString().appendText("SENOTECHANGE ").value,
    documentation: "",
    separator: "None",
    section: "Inner",
    category: "TJAP",
    order: 2,
  },
  // TaikoManyGimmicks
  judgedelay: {
    name: "JUDGEDELAY",
    detail: "判定位置の移動",
    regexp: /^JUDGEDELAY$/,
    syntax: new MarkdownString().appendCodeblock("#JUDGEDELAY" + " <type> [...]").value,
    snippet: new SnippetString().appendText("JUDGEDELAY ").value,
    documentation: new MarkdownString()
      .appendMarkdown("判定位置を判定枠からずらします。  \n")
      .appendMarkdown("譜面の流れる位置は判定位置に準拠します。  \n\n")
      .appendMarkdown(
        "`<type>`: 位置の指定方法。`0` ~ `3`で指定します。ここに指定した値によって以降のパラメーターが異なります。"
      )
      .appendCodeblock("#JUDGEDELAY 0")
      .appendMarkdown("判定位置を判定枠に戻します。")
      .appendCodeblock("#JUDGEDELAY 1 <second>")
      .appendMarkdown("判定枠から`<second>`秒前の位置にずらします。")
      .appendCodeblock("#JUDGEDELAY 2 <x> <y>")
      .appendMarkdown("判定枠から`<x>`,`<y>`軸の位置にずらします。")
      .appendCodeblock("#JUDGEDELAY 3 <second> <x> <y>")
      .appendMarkdown("判定枠から`<x>`,`<y>`軸かつ`<second>`秒前の位置にずらします。").value,
    separator: "Space",
    section: "Inner",
    category: "TMG",
    order: 1,
  },
  dummystart: {
    name: "DUMMYSTART",
    detail: "ダミー開始",
    regexp: /^DUMMYSTART$/,
    syntax: new MarkdownString().appendCodeblock("#DUMMYSTART").value,
    snippet: new SnippetString().appendText("DUMMYSTART").value,
    documentation: new MarkdownString().appendMarkdown("音符をダミーノーツにします。").value,
    separator: "None",
    section: "Inner",
    category: "TMG",
    order: 1,
  },
  dummyend: {
    name: "DUMMYEND",
    detail: "ダミー終了",
    regexp: /^DUMMYEND$/,
    syntax: new MarkdownString().appendCodeblock("#DUMMYEND").value,
    snippet: new SnippetString().appendText("DUMMYEND").value,
    documentation: new MarkdownString().appendMarkdown("音符を普通のノーツに戻します。").value,
    separator: "None",
    section: "Inner",
    category: "TMG",
    order: 1,
  },
  notespawn: {
    name: "NOTESPAWN",
    detail: "譜面の出現",
    regexp: /^NOTESPAWN$/,
    syntax: new MarkdownString().appendCodeblock("#NOTESPAWN" + " <type> [<second>]").value,
    snippet: new SnippetString().appendText("NOTESPAWN ").value,
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
    separator: "Space",
    section: "Inner",
    category: "TMG",
    order: 1,
  },
  size: {
    name: "SIZE",
    detail: "音符サイズ変更",
    regexp: /^SIZE$/,
    syntax: new MarkdownString().appendCodeblock("#SIZE" + " <rate>").value,
    snippet: new SnippetString().appendText("SIZE ").value,
    documentation: new MarkdownString().appendMarkdown("音符のサイズを`<rate>`倍にします。").value,
    separator: "None",
    section: "Inner",
    category: "TMG",
    order: 1,
  },
  color: {
    name: "COLOR",
    detail: "音符の色彩変更",
    regexp: /^COLOR$/,
    syntax: new MarkdownString().appendCodeblock("#COLOR" + " <red> <green> <blue>").value,
    snippet: new SnippetString().appendText("COLOR 255 255 255").value,
    documentation: new MarkdownString()
      .appendMarkdown("音符の色彩を変更します。  \n")
      .appendMarkdown("255を基準値とします。  \n\n")
      .appendMarkdown("`<red>`: 赤色  \n")
      .appendMarkdown("`<green>`: 緑色  \n")
      .appendMarkdown("`<blue>`: 青色  \n").value,
    separator: "Space",
    section: "Inner",
    category: "TMG",
    order: 1,
  },
  angle: {
    name: "ANGLE",
    detail: "音符の向き変更",
    regexp: /^ANGLE$/,
    syntax: new MarkdownString().appendCodeblock("#ANGLE" + " <angle>").value,
    snippet: new SnippetString().appendText("ANGLE ").value,
    documentation: new MarkdownString().appendMarkdown("音符の向きを`<angle>`度回転させます。")
      .value,
    separator: "None",
    section: "Inner",
    category: "TMG",
    order: 1,
  },
  gradation: {
    name: "GRADATION",
    detail: "命令の時間的変化",
    regexp: /^GRADATION$/,
    syntax: new MarkdownString().appendCodeblock(
      "#GRADATION" + " <type> [<second> <type1> <type2>]"
    ).value,
    snippet: new SnippetString().appendText("GRADATION ").value,
    documentation: new MarkdownString()
      .appendMarkdown("他の命令の即時的な効果を時間的に変化させます。  \n\n")
      .appendMarkdown(
        "`<type>`: `start`,`end`,`init`のいずれかを指定します。ここに指定した値によって以降のパラメーターが異なります。"
      )
      .appendCodeblock("#GRADATION start <second> <type1> <type2>")
      .appendMarkdown("GRADATIONを開始します。  \n\n")
      .appendMarkdown("`<second>`: 何秒前に変化を始めるか。  \n")
      .appendMarkdown(
        "`<type1>`: イージングの種類を`0` ~ `2`で指定します。`0`はEaseIn, `1`はEaseOut, `2`はEaseInOut。  \n"
      )
      .appendMarkdown("`<type2>`: 挙動を`0` ~ `10`で指定します。詳細は下部に記載。")
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
    separator: "Space",
    section: "Inner",
    category: "TMG",
    order: 1,
  },
  barlinesize: {
    name: "BARLINESIZE",
    detail: "小節線サイズ変更",
    regexp: /^BARLINESIZE$/,
    syntax: new MarkdownString().appendCodeblock("#BARLINESIZE" + " <width> <height>").value,
    snippet: new SnippetString().appendText("BARLINESIZE ").value,
    documentation: new MarkdownString()
      .appendMarkdown("小節線のサイズを変更します。  \n\n")
      .appendMarkdown("`<width>`: 横幅をpxで指定します。  \n")
      .appendMarkdown("`<height>`: 縦幅をpxで指定します。").value,
    separator: "Space",
    section: "Inner",
    category: "TMG",
    order: 1,
  },
  resetcommand: {
    name: "RESETCOMMAND",
    detail: "命令のリセット",
    regexp: /^RESETCOMMAND$/,
    syntax: new MarkdownString().appendCodeblock("#RESETCOMMAND").value,
    snippet: new SnippetString().appendText("RESETCOMMAND").value,
    documentation: new MarkdownString().appendMarkdown("全ての命令の効果を初期値に戻します。")
      .value,
    separator: "None",
    section: "Inner",
    category: "TMG",
    order: 1,
  },
  alpha: {
    name: "ALPHA",
    detail: "音符の透明度変更",
    regexp: /^ALPHA$/,
    syntax: new MarkdownString().appendCodeblock("#ALPHA" + " <alpha>").value,
    snippet: new SnippetString().appendText("ALPHA ").value,
    documentation: new MarkdownString()
      .appendMarkdown("音符の透明度を変更します。  \n")
      .appendMarkdown("255を基準値とします。  \n\n")
      .appendMarkdown("`<alpha>`: 透明度").value,
    separator: "Space",
    section: "Inner",
    category: "TMG",
    order: 1,
  },
  hispeed: {
    name: "HISPEED",
    detail: "",
    regexp: /^HISPEED$/,
    syntax: new MarkdownString().appendCodeblock("#HISPEED" + " <speed>").value,
    snippet: new SnippetString().appendText("HISPEED ").value,
    documentation: "",
    separator: "None",
    section: "Inner",
    category: "TMG",
    order: 2,
  },
  include: {
    name: "INCLUDE",
    detail: "",
    regexp: /^INCLUDE$/,
    syntax: new MarkdownString().appendCodeblock("#INCLUDE" + " <filepath>").value,
    snippet: new SnippetString().appendText("INCLUDE ").value,
    documentation: "",
    separator: "None",
    section: "Unknown",
    category: "TMG",
    order: 2,
  },
  // OpenTaiko
  nmscroll: {
    name: "NMSCROLL",
    detail: "スクロール方式変更",
    regexp: /^NMSCROLL$/,
    syntax: new MarkdownString().appendCodeblock("#NMSCROLL").value,
    snippet: new SnippetString().appendText("NMSCROLL").value,
    documentation: new MarkdownString().appendMarkdown("譜面のスクロールをデフォルトに戻します。")
      .value,
    separator: "None",
    section: "Unknown",
    category: "OpTk",
    order: 2,
  },
  barline: {
    name: "BARLINE",
    detail: "偽の小節線",
    regexp: /^BARLINE$/,
    syntax: new MarkdownString().appendCodeblock("#BARLINE").value,
    snippet: new SnippetString().appendText("BARLINE").value,
    documentation: new MarkdownString().appendMarkdown("偽の小節線を表示します。").value,
    separator: "None",
    section: "Inner",
    category: "OpTk",
    order: 2,
  },
  bgaon: {
    name: "BGAON",
    detail: "",
    regexp: /^BGAON$/,
    syntax: new MarkdownString().appendCodeblock("#BGAON <index> <offset>").value,
    snippet: new SnippetString().appendText("BGAON ").value,
    documentation: "",
    separator: "Space",
    section: "Inner",
    category: "OpTk",
    order: 2,
  },
  bgaoff: {
    name: "BGAOFF",
    detail: "",
    regexp: /^BGAOFF$/,
    syntax: new MarkdownString().appendCodeblock("#BGAOFF <index>").value,
    snippet: new SnippetString().appendText("BGAON ").value,
    documentation: "",
    separator: "None",
    section: "Inner",
    category: "OpTk",
    order: 2,
  },
});
