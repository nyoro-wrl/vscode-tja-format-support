import { MarkdownString, SnippetString } from "vscode";
import { HeaderCollection } from "../type/header";

export const headers = new HeaderCollection({
  // 太鼓さん次郎
  title: {
    name: "TITLE",
    regexp: /^TITLE$/,
    syntax: new MarkdownString().appendCodeblock("TITLE:<string>").value,
    snippet: new SnippetString().appendText("TITLE:").value,
    documentation: new MarkdownString().appendMarkdown("曲のタイトル。").value,
    section: "Global",
    split: "None",
  },
  level: {
    name: "LEVEL",
    regexp: /^LEVEL$/,
    syntax: new MarkdownString().appendCodeblock("LEVEL:<int>").value,
    snippet: new SnippetString().appendText("LEVEL:").value,
    documentation: new MarkdownString()
      .appendMarkdown("譜面のレベル。  \n")
      .appendMarkdown("自然数で表記します。").value,
    section: "Course",
    split: "None",
  },
  bpm: {
    name: "BPM",
    regexp: /^BPM$/,
    syntax: new MarkdownString().appendCodeblock("BPM:<bpm>").value,
    snippet: new SnippetString().appendText("BPM:").value,
    documentation: new MarkdownString().appendMarkdown("曲のBPM。").value,
    section: "Global",
    split: "None",
  },
  wave: {
    name: "WAVE",
    regexp: /^WAVE$/,
    syntax: new MarkdownString().appendCodeblock("WAVE:<filepath>").value,
    snippet: new SnippetString().appendText("WAVE:").value,
    documentation: new MarkdownString()
      .appendMarkdown("音源ファイルのパス。  \n")
      .appendMarkdown("殆どのプレイヤーが`.wav`,`.mp3`,`.ogg`に対応しています。").value,
    section: "Global",
    split: "None",
  },
  offset: {
    name: "OFFSET",
    regexp: /^OFFSET$/,
    syntax: new MarkdownString().appendCodeblock("OFFSET:<decimal>").value,
    snippet: new SnippetString().appendText("OFFSET:").value,
    documentation: new MarkdownString().appendMarkdown(
      "譜面の開始位置と音源ファイルの再生時刻の差を秒数で指定します。"
    ).value,
    section: "Global",
    split: "None",
  },
  balloon: {
    name: "BALLOON",
    regexp: /^BALLOON$/,
    syntax: new MarkdownString().appendCodeblock("BALLOON:[<int>...]").value,
    snippet: new SnippetString().appendText("BALLOON:").value,
    documentation: new MarkdownString()
      .appendMarkdown("風船連打の打数を`,`区切りで入力します。  \n")
      .appendMarkdown("省略した場合は一律5打になります。").value,
    section: "Course",
    split: "Comma",
  },
  songvol: {
    name: "SONGVOL",
    regexp: /^SONGVOL$/,
    syntax: new MarkdownString().appendCodeblock("SONGVOL:<percent>").value,
    snippet: new SnippetString().appendText("SONGVOL:").value,
    documentation: new MarkdownString()
      .appendMarkdown("音源の音量。  \n")
      .appendMarkdown("基準値は100。").value,
    section: "Global",
    split: "None",
  },
  sevol: {
    name: "SEVOL",
    regexp: /^SEVOL$/,
    syntax: new MarkdownString().appendCodeblock("SEVOL:<percent>").value,
    snippet: new SnippetString().appendText("SEVOL:").value,
    documentation: new MarkdownString()
      .appendMarkdown("太鼓音の音量。  \n")
      .appendMarkdown("基準値は100。").value,
    section: "Global",
    split: "None",
  },
  scoreinit: {
    name: "SCOREINIT",
    regexp: /^SCOREINIT$/,
    syntax: new MarkdownString().appendCodeblock("SCOREINIT:<int>").value,
    snippet: new SnippetString().appendText("SCOREINIT:").value,
    documentation: new MarkdownString()
      .appendMarkdown("配点の初項。  \n")
      .appendMarkdown("10コンボ未満の時に小音符を良判定で叩いたときの得点を指定します。").value,
    section: "Course",
    split: "None",
  },
  scorediff: {
    name: "SCOREDIFF",
    regexp: /^SCOREDIFF$/,
    syntax: new MarkdownString().appendCodeblock("SCOREDIFF:<int>").value,
    snippet: new SnippetString().appendText("SCOREDIFF:").value,
    documentation: new MarkdownString()
      .appendMarkdown("配点の公差。  \n")
      .appendMarkdown("一定のコンボ数ごとに加算される一打あたりの点数を指定します。").value,
    section: "Course",
    split: "None",
  },
  course: {
    name: "COURSE",
    regexp: /^COURSE$/,
    syntax: new MarkdownString().appendCodeblock("COURSE:<course>").value,
    snippet: new SnippetString().appendText("COURSE:").value,
    documentation: new MarkdownString()
      .appendMarkdown("譜面の難易度。  \n")
      .appendMarkdown(
        "`<course>`: `Easy`,`Normal`,`Hard`,`Oni`,`Edit`,`Tower`,`Dan`もしくは`0` ~ `6`の値を指定します。  \n"
      )
      .appendMarkdown("`Tower`または`5`を入れると連打音符が常に他の音符より手前に表示されます。")
      .appendMarkdown("`Dan`または`6`を入れると段位道場譜面として認識されます。").value,
    section: "Course",
    split: "None",
  },
  style: {
    name: "STYLE",
    regexp: /^STYLE$/,
    syntax: new MarkdownString().appendCodeblock("STYLE:<style>").value,
    snippet: new SnippetString().appendText("STYLE:").value,
    documentation: new MarkdownString()
      .appendMarkdown("プレイ人数を指定します。  \n")
      .appendMarkdown("`<style>`: `Single`,`Double`もしくは`1`,`2`の値を指定します。  \n")
      .appendMarkdown(
        "`Single`または`1`は一人プレイ、`Double`または`2`は二人プレイの譜面であることを示します。"
      ).value,
    section: "Course",
    split: "None",
  },
  life: {
    name: "LIFE",
    regexp: /^LIFE$/,
    syntax: new MarkdownString().appendCodeblock("LIFE:<int>").value,
    snippet: new SnippetString().appendText("LIFE:").value,
    documentation: new MarkdownString()
      .appendMarkdown("ライフの数を指定します。  \n")
      .appendMarkdown("不可を出すたびにライフが減り、0になると強制的に演奏が中断されます。").value,
    section: "Course",
    split: "None",
  },
  demostart: {
    name: "DEMOSTART",
    regexp: /^DEMOSTART$/,
    syntax: new MarkdownString().appendCodeblock("SUBTITLE:[--]<string>").value,
    snippet: new SnippetString().appendText("SUBTITLE:").value,
    documentation: new MarkdownString()
      .appendMarkdown("曲のサブタイトル。  \n")
      .appendMarkdown("最初に`--`と入れるとプレイ中に表示されなくなります。").value,
    section: "Global",
    split: "None",
  },
  side: {
    name: "SIDE",
    regexp: /^SIDE$/,
    syntax: new MarkdownString().appendCodeblock("SIDE:<side>").value,
    snippet: new SnippetString().appendText("SIDE:").value,
    documentation: new MarkdownString()
      .appendMarkdown("曲選択画面での表示設定。  \n")
      .appendMarkdown("`<side>`: `Normal`,`Ex`,`Both`もしくは`1` ~ `3`の値を指定します。  \n")
      .appendMarkdown("`Normal`か`1`を入力した場合、曲選択画面で表状態のときのみ曲が表示され、  \n")
      .appendMarkdown("`Ex`か`2`を入力した場合、曲選択画面で裏状態のときのみ曲が表示されます。  \n")
      .appendMarkdown("`Both`か`3`を入力した場合は常に表示されます（初期設定）。").value,
    section: "Global",
    split: "None",
  },
  subtitle: {
    name: "SUBTITLE",
    regexp: /^SUBTITLE$/,
    syntax: new MarkdownString().appendCodeblock("SUBTITLE:[--]<string>").value,
    snippet: new SnippetString().appendText("SUBTITLE:").value,
    documentation: new MarkdownString()
      .appendMarkdown("曲のサブタイトル。  \n")
      .appendMarkdown("最初に`--`と入れるとプレイ中に表示されなくなります。").value,
    section: "Global",
    split: "None",
  },
  song: {
    name: "SONG",
    regexp: /^SONG$/,
    syntax: new MarkdownString().appendCodeblock("SONG:<filepath>").value,
    snippet: new SnippetString().appendText("SONG:").value,
    documentation: new MarkdownString()
      .appendMarkdown("コースに使用する譜面。  \n")
      .appendMarkdown("`.tjc`ファイル上で有効なヘッダです。  \n")
      .appendMarkdown("`<filepath>`: tjaファイルをルートディレクトリから指定します。").value,
    section: "Global",
    split: "None",
  },
  // 太鼓さん次郎2
  siderev: {
    name: "SIDEREV",
    regexp: /^SIDEREV$/,
    syntax: new MarkdownString().appendCodeblock("SIDEREV:<filepath>").value,
    snippet: new SnippetString().appendText("SIDEREV:").value,
    documentation: new MarkdownString().appendMarkdown("表裏で対になる譜面ファイルを指定します。")
      .value,
    section: "Global",
    split: "None",
  },
  scoremode: {
    name: "SCOREMODE",
    regexp: /^SCOREMODE$/,
    syntax: new MarkdownString().appendCodeblock("SCOREMODE:<mode>").value,
    snippet: new SnippetString().appendText("SCOREMODE:").value,
    documentation: new MarkdownString()
      .appendMarkdown("配点方式を指定します。  \n")
      .appendMarkdown("`<mode>`: `0` ~ `2`の値を指定します。  \n")
      .appendMarkdown("`0`でドンだフル、`1`でAC14、`2`で新筐体。").value,
    section: "Global",
    split: "None",
  },
  total: {
    name: "TOTAL",
    regexp: /^TOTAL$/,
    syntax: new MarkdownString().appendCodeblock("TOTAL:<total>").value,
    snippet: new SnippetString().appendText("TOTAL:").value,
    documentation: new MarkdownString()
      .appendMarkdown("ノルマゲージの増える量を指定します。  \n")
      .appendMarkdown("全良でゲージが満タンになる基準値を100とします。  \n").value,
    section: "Course",
    split: "None",
  },
  // TJAPlayer2forPC
  balloonnor: {
    name: "BALLOONNOR",
    regexp: /^BALLOONNOR$/,
    syntax: new MarkdownString().appendCodeblock("BALLOONNOR:[<int>...]").value,
    snippet: new SnippetString().appendText("BALLOONNOR:").value,
    documentation: new MarkdownString()
      .appendMarkdown("普通譜面での風船連打の打数を`,`区切りで入力します。  \n")
      .appendMarkdown("省略した場合は一律5打になります。").value,
    section: "Course",
    split: "Comma",
  },
  balloonexp: {
    name: "BALLOONEXP",
    regexp: /^BALLOONEXP$/,
    syntax: new MarkdownString().appendCodeblock("BALLOONEXP:[<int>...]").value,
    snippet: new SnippetString().appendText("BALLOONEXP:").value,
    documentation: new MarkdownString()
      .appendMarkdown("玄人譜面での風船連打の打数を`,`区切りで入力します。  \n")
      .appendMarkdown("省略した場合は一律5打になります。").value,
    section: "Course",
    split: "Comma",
  },
  balloonmas: {
    name: "BALLOONMAS",
    regexp: /^BALLOONMAS$/,
    syntax: new MarkdownString().appendCodeblock("BALLOONMAS:[<int>...]").value,
    snippet: new SnippetString().appendText("BALLOONMAS:").value,
    documentation: new MarkdownString()
      .appendMarkdown("達人譜面での風船連打の打数を`,`区切りで入力します。  \n")
      .appendMarkdown("省略した場合は一律5打になります。").value,
    section: "Course",
    split: "Comma",
  },
  genre: {
    name: "GENRE",
    regexp: /^GENRE$/,
    syntax: new MarkdownString().appendCodeblock("GENRE:<genre>").value,
    snippet: new SnippetString().appendText("GENRE:").value,
    documentation: new MarkdownString().appendMarkdown("曲のジャンル。").value,
    section: "Global",
    split: "None",
  },
  movieoffset: {
    name: "MOVIEOFFSET",
    regexp: /^MOVIEOFFSET$/,
    syntax: new MarkdownString().appendCodeblock("MOVIEOFFSET:<second>").value,
    snippet: new SnippetString().appendText("MOVIEOFFSET:").value,
    documentation: new MarkdownString().appendMarkdown(
      "音源ファイルの再生位置と背景動画ファイルの再生時刻の差を秒数で指定します。"
    ).value,
    section: "Global",
    split: "None",
  },
  bgimage: {
    name: "BGIMAGE",
    regexp: /^BGIMAGE$/,
    syntax: new MarkdownString().appendCodeblock("BGIMAGE:<filepath>").value,
    snippet: new SnippetString().appendText("BGIMAGE:").value,
    documentation: new MarkdownString().appendMarkdown("背景画像ファイルのパス。").value,
    section: "Global",
    split: "None",
  },
  bgmovie: {
    name: "BGMOVIE",
    regexp: /^BGMOVIE$/,
    syntax: new MarkdownString().appendCodeblock("BGMOVIE:<filepath>").value,
    snippet: new SnippetString().appendText("BGMOVIE:").value,
    documentation: new MarkdownString().appendMarkdown("背景動画ファイルのパス。").value,
    section: "Global",
    split: "None",
  },
  hiddenbranch: {
    name: "HIDDENBRANCH",
    regexp: /^HIDDENBRANCH$/,
    syntax: new MarkdownString().appendCodeblock("HIDDENBRANCH:1").value,
    snippet: new SnippetString().appendText("HIDDENBRANCH:").value,
    documentation: new MarkdownString().appendMarkdown("譜面分岐を分岐する瞬間まで隠します。")
      .value,
    section: "Course",
    split: "None",
  },
  // OpenTaiko
  exam: {
    name: "EXAMn",
    regexp: /^EXAM[0-9]+$/,
    syntax: new MarkdownString().appendCodeblock("EXAM1:<type>,<red>,<gold>,<range>").value,
    snippet: new SnippetString().appendText("EXAM").appendPlaceholder("n").appendText(":").value,
    documentation: new MarkdownString()
      .appendMarkdown("課題曲の合格条件を指定します。  \n")
      .appendMarkdown(
        "`EXAM`の直後に1以上の整数を指定します。ヘッダを呼ぶごとに数を増やします。  \n"
      )
      .appendMarkdown("`#NEXTSONG`の後に呼ぶと課題曲ごとの条件を指定できます。  \n\n")
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
    section: "Global",
    split: "Comma",
  },
  preimage: {
    name: "PREIMAGE",
    regexp: /^PREIMAGE$/,
    syntax: new MarkdownString().appendCodeblock("PREIMAGE:<filepath>").value,
    snippet: new SnippetString().appendText("PREIMAGE:").value,
    documentation: new MarkdownString().appendMarkdown("選曲画面に表示する画像ファイルのパス。")
      .value,
    section: "Global",
    split: "None",
  },
  bgoffset: {
    name: "BGOFFSET",
    regexp: /^BGOFFSET$/,
    syntax: new MarkdownString().appendCodeblock("BGOFFSET:<second>").value,
    snippet: new SnippetString().appendText("BGOFFSET:").value,
    documentation: new MarkdownString().appendMarkdown(
      "譜面の再生位置と背景画像ファイルの再生時刻の差を秒数で指定します。"
    ).value,
    section: "Global",
    split: "None",
  },
  dantick: {
    name: "DANTICK",
    regexp: /^DANTICK$/,
    syntax: new MarkdownString().appendCodeblock("DANTICK:<type>").value,
    snippet: new SnippetString().appendText("DANTICK:").value,
    documentation: new MarkdownString()
      .appendMarkdown("段位の種別を指定します。  \n")
      .appendMarkdown("`<type>`: 段位の種別を`0` ~ `5`から指定します詳細は下部に記載。\n\n")
      .appendMarkdown("### **段位の種別**  \n\n")
      .appendMarkdown("`0`: 初級以下  \n")
      .appendMarkdown("`1`: 青段位  \n")
      .appendMarkdown("`2`: 赤段位  \n")
      .appendMarkdown("`3`: 人段位①（銀）  \n")
      .appendMarkdown("`4`: 人段位②（金）  \n")
      .appendMarkdown("`5`: 外伝").value,
    section: "Global",
    split: "None",
  },
  dantickcolor: {
    name: "DANTICKCOLOR",
    regexp: /^DANTICKCOLOR$/,
    syntax: new MarkdownString().appendCodeblock("DANTICKCOLOR:#<color>").value,
    snippet: new SnippetString().appendText("DANTICKCOLOR:").value,
    documentation: new MarkdownString().appendMarkdown("段位の色をHTMLカラーコードで指定します。")
      .value,
    section: "Global",
    split: "None",
  },
});
