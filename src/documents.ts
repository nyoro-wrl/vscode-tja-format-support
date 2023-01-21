import * as vscode from "vscode";

type Document = {
  readonly name: string;
  readonly symbol: string;
  readonly documentation: string;
};

export const headerDocuments: ReadonlyMap<string, Document> = new Map<string, Document>([
  // 太鼓さん次郎
  [
    "TITLE",
    {
      name: "TITLE",
      symbol: new vscode.MarkdownString().appendCodeblock("TITLE:<string>").value,
      documentation: new vscode.MarkdownString().appendMarkdown("曲のタイトル。").value,
    },
  ],
  [
    "LEVEL",
    {
      name: "LEVEL",
      symbol: new vscode.MarkdownString().appendCodeblock("LEVEL:<int>").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("譜面のレベル。  \n")
        .appendMarkdown("自然数で表記します。").value,
    },
  ],
  [
    "BPM",
    {
      name: "BPM",
      symbol: new vscode.MarkdownString().appendCodeblock("BPM:<bpm>").value,
      documentation: new vscode.MarkdownString().appendMarkdown("曲のBPM。").value,
    },
  ],
  [
    "WAVE",
    {
      name: "WAVE",
      symbol: new vscode.MarkdownString().appendCodeblock("WAVE:<filepath>").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("音源ファイルのパス。  \n")
        .appendMarkdown("殆どのプレイヤーが`.wav`,`.mp3`,`.ogg`に対応しています。").value,
    },
  ],
  [
    "OFFSET",
    {
      name: "OFFSET",
      symbol: new vscode.MarkdownString().appendCodeblock("OFFSET:<decimal>").value,
      documentation: new vscode.MarkdownString().appendMarkdown(
        "譜面の開始位置と音源ファイルの再生時刻の差を秒数で指定します。"
      ).value,
    },
  ],
  [
    "BALLOON",
    {
      name: "BALLOON",
      symbol: new vscode.MarkdownString().appendCodeblock("BALLOON:[<int>...]").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("風船連打の打数を`,`区切りで入力します。  \n")
        .appendMarkdown("省略した場合は一律5打になります。").value,
    },
  ],
  [
    "SONGVOL",
    {
      name: "SONGVOL",
      symbol: new vscode.MarkdownString().appendCodeblock("SONGVOL:<percent>").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("音源の音量。  \n")
        .appendMarkdown("基準値は100。").value,
    },
  ],
  [
    "SEVOL",
    {
      name: "SEVOL",
      symbol: new vscode.MarkdownString().appendCodeblock("SEVOL:<percent>").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("太鼓音の音量。  \n")
        .appendMarkdown("基準値は100。").value,
    },
  ],
  [
    "SCOREINIT",
    {
      name: "SCOREINIT",
      symbol: new vscode.MarkdownString().appendCodeblock("SCOREINIT:<int>").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("配点の初項。  \n")
        .appendMarkdown("10コンボ未満の時に小音符を良判定で叩いたときの得点を指定します。").value,
    },
  ],
  [
    "SCOREDIFF",
    {
      name: "SCOREDIFF",
      symbol: new vscode.MarkdownString().appendCodeblock("SCOREDIFF:<int>").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("配点の公差。  \n")
        .appendMarkdown("一定のコンボ数ごとに加算される一打あたりの点数を指定します。").value,
    },
  ],
  [
    "COURSE",
    {
      name: "COURSE",
      symbol: new vscode.MarkdownString().appendCodeblock("COURSE:<course>").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("譜面の難易度。  \n")
        .appendMarkdown(
          "`<course>`: `Easy`,`Normal`,`Hard`,`Oni`,`Edit`,`Tower`,`Dan`もしくは`0` ~ `6`の値を指定します。  \n"
        )
        .appendMarkdown("`Tower`または`5`を入れると連打音符が常に他の音符より手前に表示されます。")
        .appendMarkdown("`Dan`または`6`を入れると段位道場譜面として認識されます。").value,
    },
  ],
  [
    "STYLE",
    {
      name: "STYLE",
      symbol: new vscode.MarkdownString().appendCodeblock("STYLE:<style>").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("プレイ人数を指定します。  \n")
        .appendMarkdown("`<style>`: `Single`,`Double`もしくは`1`,`2`の値を指定します。  \n")
        .appendMarkdown(
          "`Single`または`1`は一人プレイ、`Double`または`2`は二人プレイの譜面であることを示します。"
        ).value,
    },
  ],
  [
    "LIFE",
    {
      name: "LIFE",
      symbol: new vscode.MarkdownString().appendCodeblock("LIFE:<int>").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("ライフの数を指定します。  \n")
        .appendMarkdown("不可を出すたびにライフが減り、0になると強制的に演奏が中断されます。")
        .value,
    },
  ],
  [
    "DEMOSTART",
    {
      name: "DEMOSTART",
      symbol: new vscode.MarkdownString().appendCodeblock("DEMOSTART:<second>").value,
      documentation: new vscode.MarkdownString().appendMarkdown(
        "選曲画面で流すデモの再生開始位置を秒で指定します。"
      ).value,
    },
  ],
  [
    "SIDE",
    {
      name: "SIDE",
      symbol: new vscode.MarkdownString().appendCodeblock("SIDE:<side>").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("曲選択画面での表示設定。  \n")
        .appendMarkdown("`<side>`: `Normal`,`Ex`,`Both`もしくは`1` ~ `3`の値を指定します。  \n")
        .appendMarkdown(
          "`Normal`か`1`を入力した場合、曲選択画面で表状態のときのみ曲が表示され、  \n"
        )
        .appendMarkdown(
          "`Ex`か`2`を入力した場合、曲選択画面で裏状態のときのみ曲が表示されます。  \n"
        )
        .appendMarkdown("`Both`か`3`を入力した場合は常に表示されます（初期設定）。").value,
    },
  ],
  [
    "SUBTITLE",
    {
      name: "SUBTITLE",
      symbol: new vscode.MarkdownString().appendCodeblock("SUBTITLE:[--]<string>").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("曲のサブタイトル。  \n")
        .appendMarkdown("最初に`--`と入れるとプレイ中に表示されなくなります。").value,
    },
  ],
  // 太鼓さん次郎2
  [
    "SIDEREV",
    {
      name: "SIDEREV",
      symbol: new vscode.MarkdownString().appendCodeblock("SIDEREV:<filepath>").value,
      documentation: new vscode.MarkdownString().appendMarkdown(
        "表裏で対になる譜面ファイルを指定します。"
      ).value,
    },
  ],
  [
    "SCOREMODE",
    {
      name: "SCOREMODE",
      symbol: new vscode.MarkdownString().appendCodeblock("SCOREMODE:<mode>").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("配点方式を指定します。  \n")
        .appendMarkdown("`<mode>`: `0` ~ `2`の値を指定します。  \n")
        .appendMarkdown("`0`でドンだフル、`1`でAC14、`2`で新筐体。").value,
    },
  ],
  [
    "TOTAL",
    {
      name: "TOTAL",
      symbol: new vscode.MarkdownString().appendCodeblock("TOTAL:<total>").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("ノルマゲージの増える量を指定します。  \n")
        .appendMarkdown("全良でゲージが満タンになる基準値を100とします。  \n").value,
    },
  ],
  // TJAPlayer2forPC
  [
    "BALLOONNOR",
    {
      name: "BALLOONNOR",
      symbol: new vscode.MarkdownString().appendCodeblock("BALLOONNOR:[<int>...]").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("普通譜面での風船連打の打数を`,`区切りで入力します。  \n")
        .appendMarkdown("省略した場合は一律5打になります。").value,
    },
  ],
  [
    "BALLOONEXP",
    {
      name: "BALLOONEXP",
      symbol: new vscode.MarkdownString().appendCodeblock("BALLOONEXP:[<int>...]").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("玄人譜面での風船連打の打数を`,`区切りで入力します。  \n")
        .appendMarkdown("省略した場合は一律5打になります。").value,
    },
  ],
  [
    "BALLOONMAS",
    {
      name: "BALLOONMAS",
      symbol: new vscode.MarkdownString().appendCodeblock("BALLOONMAS:[<int>...]").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("達人譜面での風船連打の打数を`,`区切りで入力します。  \n")
        .appendMarkdown("省略した場合は一律5打になります。").value,
    },
  ],
  [
    "GENRE",
    {
      name: "GENRE",
      symbol: new vscode.MarkdownString().appendCodeblock("GENRE:<genre>").value,
      documentation: new vscode.MarkdownString().appendMarkdown("曲のジャンル。").value,
    },
  ],
  [
    "MOVIEOFFSET",
    {
      name: "MOVIEOFFSET",
      symbol: new vscode.MarkdownString().appendCodeblock("MOVIEOFFSET:<second>").value,
      documentation: new vscode.MarkdownString().appendMarkdown(
        "音源ファイルの再生位置と背景動画ファイルの再生時刻の差を秒数で指定します。"
      ).value,
    },
  ],
  [
    "BGIMAGE",
    {
      name: "BGIMAGE",
      symbol: new vscode.MarkdownString().appendCodeblock("BGIMAGE:<filepath>").value,
      documentation: new vscode.MarkdownString().appendMarkdown("背景画像ファイルのパス。").value,
    },
  ],
  [
    "BGMOVIE",
    {
      name: "BGMOVIE",
      symbol: new vscode.MarkdownString().appendCodeblock("BGMOVIE:<filepath>").value,
      documentation: new vscode.MarkdownString().appendMarkdown("背景動画ファイルのパス。").value,
    },
  ],
  [
    "HIDDENBRANCH",
    {
      name: "HIDDENBRANCH",
      symbol: new vscode.MarkdownString().appendCodeblock("HIDDENBRANCH:1").value,
      documentation: new vscode.MarkdownString().appendMarkdown(
        "譜面分岐を分岐する瞬間まで隠します。"
      ).value,
    },
  ],
  // OpenTaiko
  [
    "EXAM",
    {
      name: "EXAM1",
      symbol: new vscode.MarkdownString().appendCodeblock("EXAM<i>:<type>,<red>,<gold>,<range>")
        .value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("課題曲の合格条件を指定します。  \n")
        .appendMarkdown("`#NEXTSONG`の後に呼ぶと課題曲ごとの条件を指定できます。  \n\n")
        .appendMarkdown("`<i>`: 最初は`1`を指定します。このヘッダを呼ぶごとに数を増やします。  \n")
        .appendMarkdown("`<type>`: 条件の種類を指定します。詳細は下部に記載。  \n")
        .appendMarkdown("`<red>`: 赤合格の基準値を指定します。  \n")
        .appendMarkdown("`<gold>`: 金合格の基準値を指定します。  \n")
        .appendMarkdown(
          "`<range>`: `m`または`l`を指定します。`m`は基準値以上、`l`は基準値未満で合格を表します。  \n\n"
        )
        .appendMarkdown("### **条件の種類**  \n")
        .appendMarkdown("`g`: 魂ゲージ(%)  \n")
        .appendMarkdown("`jp`: 良の数  \n")
        .appendMarkdown("`jg`: 可の数  \n")
        .appendMarkdown("`jb`: 不可の数  \n")
        .appendMarkdown("`s`: スコア  \n")
        .appendMarkdown("`r`: 連打数  \n")
        .appendMarkdown("`h`: 叩けた数  \n")
        .appendMarkdown("`c`: 最大コンボ数").value,
    },
  ],
  [
    "PREIMAGE",
    {
      name: "PREIMAGE",
      symbol: new vscode.MarkdownString().appendCodeblock("PREIMAGE:<filepath>").value,
      documentation: new vscode.MarkdownString().appendMarkdown(
        "選曲画面に表示する画像ファイルのパス。　"
      ).value,
    },
  ],
  [
    "BGOFFSET",
    {
      name: "BGOFFSET",
      symbol: new vscode.MarkdownString().appendCodeblock("BGOFFSET:<second>").value,
      documentation: new vscode.MarkdownString().appendMarkdown(
        "譜面の再生位置と背景画像ファイルの再生時刻の差を秒数で指定します。"
      ).value,
    },
  ],
  [
    "DANTICK",
    {
      name: "DANTICK",
      symbol: new vscode.MarkdownString().appendCodeblock("DANTICK:<type>").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("段位の種別を指定します。  \n")
        .appendMarkdown("`<type>`: 段位の種別を`0` ~ `5`から指定します詳細は下部に記載。\n\n")
        .appendMarkdown("### **段位の種別**  \n\n")
        .appendMarkdown("`0`: 初級以下  \n")
        .appendMarkdown("`1`: 青段位  \n")
        .appendMarkdown("`2`: 赤段位  \n")
        .appendMarkdown("`3`: 人段位①（銀）  \n")
        .appendMarkdown("`4`: 人段位②（金）  \n")
        .appendMarkdown("`5`: 外伝").value,
    },
  ],
  [
    "DANTICKCOLOR",
    {
      name: "DANTICKCOLOR",
      symbol: new vscode.MarkdownString().appendCodeblock("DANTICKCOLOR:#<color>").value,
      documentation: new vscode.MarkdownString().appendMarkdown(
        "段位の色をHTMLカラーコードで指定します。"
      ).value,
    },
  ],
]);

export const commandDocuments: ReadonlyMap<string, Document> = new Map<string, Document>([
  [
    "START",
    {
      name: "START",
      symbol: new vscode.MarkdownString().appendCodeblock("#START" + " [<player>]").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("譜面データの記述を開始します。  \n")
        .appendMarkdown("`#START`と`#END`で囲んだ範囲が譜面データとして解釈されます。  \n\n")
        .appendMarkdown(
          "`<player>`に`P1`や`P2`を指定することで、譜面をプレイヤー別に記述することができます。"
        ).value,
    },
  ],
  [
    "END",
    {
      name: "END",
      symbol: new vscode.MarkdownString().appendCodeblock("#END").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("譜面データの記述を終了します。  \n")
        .appendMarkdown("`#START`と`#END`で囲んだ範囲が譜面データとして解釈されます。").value,
    },
  ],
  [
    "BPMCHANGE",
    {
      name: "BPMCHANGE",
      symbol: new vscode.MarkdownString().appendCodeblock("#BPMCHANGE" + " <bpm>").value,
      documentation: new vscode.MarkdownString().appendMarkdown("BPMを変更します。").value,
    },
  ],
  [
    "GOGOSTART",
    {
      name: "GOGOSTART",
      symbol: new vscode.MarkdownString().appendCodeblock("#GOGOSTART").value,
      documentation: new vscode.MarkdownString().appendMarkdown("ゴーゴータイムを開始します。")
        .value,
    },
  ],
  [
    "GOGOEND",
    {
      name: "GOGOEND",
      symbol: new vscode.MarkdownString().appendCodeblock("#GOGOEND").value,
      documentation: new vscode.MarkdownString().appendMarkdown("ゴーゴータイムを終了します。")
        .value,
    },
  ],
  [
    "MEASURE",
    {
      name: "MEASURE",
      symbol: new vscode.MarkdownString().appendCodeblock("#MEASURE" + " <numer>/<denom>").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("拍子を変更します。  \n")
        .appendMarkdown("`4/4`で4分の4拍子、`6/8`で8分の6拍子になります。").value,
    },
  ],
  [
    "SCROLL",
    {
      name: "SCROLL",
      symbol: new vscode.MarkdownString().appendCodeblock("#SCROLL" + " <rate>").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("譜面のスクロール速度を`<rate>`倍に変更します。  \n")
        .appendMarkdown("デフォルトは`1.00`です。").value,
    },
  ],
  [
    "DELAY",
    {
      name: "DELAY",
      symbol: new vscode.MarkdownString().appendCodeblock("#DELAY" + " <second>").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("譜面が流れてくるタイミングを`<second>`秒遅らせます。  \n")
        .appendMarkdown("`#BMSCROLL`,`#HBSCROLL`適用下では譜面停止扱いになります。").value,
    },
  ],
  [
    "SECTION",
    {
      name: "SECTION",
      symbol: new vscode.MarkdownString().appendCodeblock("#SECTION").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("譜面分岐の判定に使う連打数、精度をリセットします。  \n")
        .appendMarkdown("分岐したい箇所の一小節以上前に置いてください。").value,
    },
  ],
  [
    "BRANCHSTART",
    {
      name: "BRANCHSTART",
      symbol: new vscode.MarkdownString().appendCodeblock("#BRANCHSTART").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("譜面分岐を開始します。  \n\n")
        .appendMarkdown(
          "`<type>`: 分岐条件を指定します。`r`で連打数、`p`で精度(%)、`s`でスコア。  \n"
        )
        .appendMarkdown("`<expart>`: この数値以上で玄人譜面に分岐します。  \n")
        .appendMarkdown("`<master>`: この数値以上で達人譜面に分岐します。  \n\n")
        .appendMarkdown("分岐判定は一小節前に行われます。  \n")
        .appendMarkdown("一小節前から連打が始まる場合、その連打もカウントします。  \n\n")
        .appendMarkdown("分岐後は普通譜面`#N`、玄人譜面`#E`、達人譜面`#M`で記述します。").value,
    },
  ],
  [
    "BRANCHEND",
    {
      name: "BRANCHEND",
      symbol: new vscode.MarkdownString().appendCodeblock("#BRANCHEND").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("譜面分岐を終了します。  \n")
        .appendMarkdown("以降は全ての分岐で共通の譜面が流れます。").value,
    },
  ],
  [
    "N",
    {
      name: "N",
      symbol: new vscode.MarkdownString().appendCodeblock("#N").value,
      documentation: new vscode.MarkdownString().appendMarkdown("普通譜面を記述します。").value,
    },
  ],
  [
    "E",
    {
      name: "E",
      symbol: new vscode.MarkdownString().appendCodeblock("#E").value,
      documentation: new vscode.MarkdownString().appendMarkdown("玄人譜面を記述します。").value,
    },
  ],
  [
    "M",
    {
      name: "M",
      symbol: new vscode.MarkdownString().appendCodeblock("#M").value,
      documentation: new vscode.MarkdownString().appendMarkdown("達人譜面を記述します。").value,
    },
  ],
  [
    "LEVELHOLD",
    {
      name: "LEVELHOLD",
      symbol: new vscode.MarkdownString().appendCodeblock("#LEVELHOLD").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("現在の譜面分岐を固定します。  \n")
        .appendMarkdown("この命令がある小節に到達した場合、以後も譜面分岐が行われなくなります。")
        .value,
    },
  ],
  [
    "BMSCROLL",
    {
      name: "BMSCROLL",
      symbol: new vscode.MarkdownString().appendCodeblock("#BMSCROLL").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("譜面のスクロールがBMS形式になります。  \n")
        .appendMarkdown("`#START`より前に記述してください。").value,
    },
  ],
  [
    "HBSCROLL",
    {
      name: "HBSCROLL",
      symbol: new vscode.MarkdownString().appendCodeblock("#HBSCROLL").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown(
          "譜面のスクロールが`#BMSCROLL`に`#SCROLL`の効果を含めた形式になります。  \n"
        )
        .appendMarkdown("`#START`より前に記述してください。").value,
    },
  ],
  [
    "BARLINEOFF",
    {
      name: "BARLINEOFF",
      symbol: new vscode.MarkdownString().appendCodeblock("#BARLINEOFF").value,
      documentation: new vscode.MarkdownString().appendMarkdown("小節線を非表示にします。").value,
    },
  ],
  [
    "BARLINEON",
    {
      name: "BARLINEON",
      symbol: new vscode.MarkdownString().appendCodeblock("#BARLINEON").value,
      documentation: new vscode.MarkdownString().appendMarkdown("小節線を表示します。").value,
    },
  ],
  [
    "LYRIC",
    {
      name: "LYRIC",
      symbol: new vscode.MarkdownString().appendCodeblock("#LYRIC" + " <string>").value,
      documentation: new vscode.MarkdownString().appendMarkdown("歌詞を表示します。").value,
    },
  ],
  [
    "SUDDEN",
    {
      name: "SUDDEN",
      symbol: new vscode.MarkdownString().appendCodeblock("#SUDDEN" + " <sudden> <move>").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("音符の出現タイミングと動作タイミングを変更します。  \n")
        .appendMarkdown("`<sudden>`秒前に出現し、`<move>`秒前に動き出します。  \n")
        .appendMarkdown(
          "`<sudden>`に`0`を指定すると通常の動作に戻ります（このとき`<move>`にも仮の値を指定する必要があります）。"
        ).value,
    },
  ],
  [
    "DIRECTION",
    {
      name: "DIRECTION",
      symbol: new vscode.MarkdownString().appendCodeblock("#DIRECTION" + " <direction>").value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("譜面の流れる方向を指定します。  \n\n")
        .appendMarkdown("`0`: ←（通常）  \n")
        .appendMarkdown("`1`: ↓  \n")
        .appendMarkdown("`2`: ↑  \n")
        .appendMarkdown("`3`: ↙  \n")
        .appendMarkdown("`4`: ↖  \n")
        .appendMarkdown("`5`: →  \n")
        .appendMarkdown("`6`: ↘  \n")
        .appendMarkdown("`7`: ↗").value,
    },
  ],
  [
    "JPOSSCROLL",
    {
      name: "JPOSSCROLL",
      symbol: new vscode.MarkdownString().appendCodeblock(
        "#JPOSSCROLL" + " <second> <distance> <direction>"
      ).value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("判定枠を左右に移動します。  \n\n")
        .appendMarkdown("`<second>`: 移動にかかる秒数。  \n")
        .appendMarkdown("`<distance>`: 移動距離をpxで指定します。  \n")
        .appendMarkdown("`<direction>`: 移動方向を`0`か`1`で指定します。`0`で左、`1`で右。").value,
    },
  ],
  [
    "NEXTSONG",
    {
      name: "NEXTSONG",
      symbol: new vscode.MarkdownString().appendCodeblock(
        "#NEXTSONG" +
          " <title>,<subtitle>,<genre>,<wave>,[<scoreinit>,<scorediff>,<level>,<course>]"
      ).value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("課題曲を指定します。  \n\n")
        .appendMarkdown("`<title>`: タイトル  \n")
        .appendMarkdown("`<subtitle>`: サブタイトル  \n")
        .appendMarkdown("`<genre>`: ジャンル  \n")
        .appendMarkdown("`<wave>`: 音源ファイル  \n")
        .appendMarkdown("`<scoreinit>`: 初項  \n")
        .appendMarkdown("`<scorediff>`: 公差  \n")
        .appendMarkdown("`<level>`: レベル  \n")
        .appendMarkdown("`<course>`: 難易度  \n").value,
    },
  ],
  [
    "JUDGEDELAY",
    {
      name: "JUDGEDELAY",
      symbol: new vscode.MarkdownString().appendCodeblock("#JUDGEDELAY" + " <type> [...]").value,
      documentation: new vscode.MarkdownString()
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
    },
  ],
  [
    "DUMMYSTART",
    {
      name: "DUMMYSTART",
      symbol: new vscode.MarkdownString().appendCodeblock("#DUMMYSTART").value,
      documentation: new vscode.MarkdownString().appendMarkdown("音符をダミーノーツにします。")
        .value,
    },
  ],
  [
    "DUMMYEND",
    {
      name: "DUMMYEND",
      symbol: new vscode.MarkdownString().appendCodeblock("#DUMMYEND").value,
      documentation: new vscode.MarkdownString().appendMarkdown("音符を普通のノーツに戻します。")
        .value,
    },
  ],
  [
    "NOTESPAWN",
    {
      name: "NOTESPAWN",
      symbol: new vscode.MarkdownString().appendCodeblock("#NOTESPAWN" + " <type> [<second>]")
        .value,
      documentation: new vscode.MarkdownString()
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
    },
  ],
  [
    "SIZE",
    {
      name: "SIZE",
      symbol: new vscode.MarkdownString().appendCodeblock("#SIZE" + " <rate>").value,
      documentation: new vscode.MarkdownString().appendMarkdown(
        "音符のサイズを`<rate>`倍にします。"
      ).value,
    },
  ],
  [
    "COLOR",
    {
      name: "COLOR",
      symbol: new vscode.MarkdownString().appendCodeblock(
        "#COLOR" + " <red> <green> <blue> <alpha>"
      ).value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("音符の色彩を変更します。  \n")
        .appendMarkdown("255を基準値とします。  \n\n")
        .appendMarkdown("`<red>`: 赤色  \n")
        .appendMarkdown("`<green>`: 緑色  \n")
        .appendMarkdown("`<blue>`: 青色  \n")
        .appendMarkdown("`<alpha>`: 不透明度").value,
    },
  ],
  [
    "ANGLE",
    {
      name: "ANGLE",
      symbol: new vscode.MarkdownString().appendCodeblock("#ANGLE" + " <angle>").value,
      documentation: new vscode.MarkdownString().appendMarkdown(
        "音符の向きを`<angle>`度回転させます。"
      ).value,
    },
  ],
  [
    "GRADATION",
    {
      name: "GRADATION",
      symbol: new vscode.MarkdownString().appendCodeblock(
        "#GRADATION" + " <type> [<second> <type1> <type2>]"
      ).value,
      documentation: new vscode.MarkdownString()
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
    },
  ],
  [
    "BARLINESIZE",
    {
      name: "BARLINESIZE",
      symbol: new vscode.MarkdownString().appendCodeblock("#BARLINESIZE" + " <width> <height>")
        .value,
      documentation: new vscode.MarkdownString()
        .appendMarkdown("小節線のサイズを変更します。  \n\n")
        .appendMarkdown("`<width>`: 横幅をpxで指定します。  \n")
        .appendMarkdown("`<height>`: 縦幅をpxで指定します。").value,
    },
  ],
  [
    "RESETCOMMAND",
    {
      name: "RESETCOMMAND",
      symbol: new vscode.MarkdownString().appendCodeblock("#RESETCOMMAND").value,
      documentation: new vscode.MarkdownString().appendMarkdown(
        "全ての命令の効果を初期値に戻します。"
      ).value,
    },
  ],
]);
