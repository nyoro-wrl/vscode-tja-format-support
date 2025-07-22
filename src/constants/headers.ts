"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.headers = void 0;
const vscode_1 = require("vscode");
const header_1 = require("../types/header");
/**
 * ヘッダの仕様一覧
 */
exports.headers = new header_1.HeaderCollection({
    // 太鼓さん次郎
    title: {
        name: "TITLE",
        detail: "タイトル",
        regexp: /^TITLE$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("TITLE:<string>").value,
        snippet: new vscode_1.SnippetString().appendText("TITLE:").value,
        documentation: new vscode_1.MarkdownString().appendMarkdown("曲のタイトル。").value,
        section: "Root",
        separator: "None",
        recommend: ["SUBTITLE"],
        order: 0,
    },
    course: {
        name: "COURSE",
        detail: "難易度",
        regexp: /^COURSE$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("COURSE:<course>").value,
        snippet: new vscode_1.SnippetString().appendText("COURSE:").value,
        documentation: new vscode_1.MarkdownString()
            .appendMarkdown("譜面の難易度。  \n")
            .appendMarkdown("`<course>`: `Easy`,`Normal`,`Hard`,`Oni`,`Edit`,`Tower`,`Dan`もしくは`0` ~ `6`の値を指定します。  \n")
            .appendMarkdown("`Tower`または`5`を入れると連打音符が常に他の音符より手前に表示されます。")
            .appendMarkdown("`Dan`または`6`を入れると段位道場譜面として認識されます。").value,
        section: "Course",
        separator: "None",
        recommend: ["LEVEL"],
        order: 0,
    },
    level: {
        name: "LEVEL",
        detail: "レベル",
        regexp: /^LEVEL$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("LEVEL:<int>").value,
        snippet: new vscode_1.SnippetString().appendText("LEVEL:").value,
        documentation: new vscode_1.MarkdownString()
            .appendMarkdown("譜面のレベル。  \n")
            .appendMarkdown("自然数で表記します。").value,
        section: "Course",
        separator: "None",
        recommend: [],
        order: 0,
    },
    bpm: {
        name: "BPM",
        detail: "BPM",
        regexp: /^BPM$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("BPM:<bpm>").value,
        snippet: new vscode_1.SnippetString().appendText("BPM:").value,
        documentation: new vscode_1.MarkdownString().appendMarkdown("曲のBPM。").value,
        section: "Root",
        separator: "None",
        recommend: [],
        order: 0,
    },
    wave: {
        name: "WAVE",
        detail: "音源ファイル",
        regexp: /^WAVE$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("WAVE:<filepath>").value,
        snippet: new vscode_1.SnippetString().appendText("WAVE:").value,
        documentation: new vscode_1.MarkdownString()
            .appendMarkdown("音源ファイルのパス。  \n")
            .appendMarkdown("殆どのプレイヤーが`.wav`,`.mp3`,`.ogg`に対応しています。").value,
        section: "Root",
        separator: "None",
        recommend: ["OFFSET"],
        order: 0,
    },
    offset: {
        name: "OFFSET",
        detail: "音源ファイルの再生タイミング",
        regexp: /^OFFSET$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("OFFSET:<decimal>").value,
        snippet: new vscode_1.SnippetString().appendText("OFFSET:").value,
        documentation: new vscode_1.MarkdownString().appendMarkdown("譜面の開始位置と音源ファイルの再生タイミングの差を秒数で指定します。").value,
        section: "Root",
        separator: "None",
        recommend: [],
        order: 0,
    },
    balloon: {
        name: "BALLOON",
        detail: "風船打数",
        regexp: /^BALLOON$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("BALLOON:[<int>...]").value,
        snippet: new vscode_1.SnippetString().appendText("BALLOON:").value,
        documentation: new vscode_1.MarkdownString()
            .appendMarkdown("風船音符の打数を`,`区切りで入力します。  \n")
            .appendMarkdown("省略した場合は一律5打になります。").value,
        section: "Course",
        separator: "Comma",
        recommend: ["BALLOONNOR", "BALLOONEXP", "BALLOONMAS"],
        order: 1,
    },
    songvol: {
        name: "SONGVOL",
        detail: "音源ファイルの音量",
        regexp: /^SONGVOL$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("SONGVOL:<percent>").value,
        snippet: new vscode_1.SnippetString().appendText("SONGVOL:").value,
        documentation: new vscode_1.MarkdownString()
            .appendMarkdown("音源ファイルの音量。  \n")
            .appendMarkdown("基準値は100。").value,
        section: "Root",
        separator: "None",
        recommend: ["SEVOL"],
        order: 1,
    },
    sevol: {
        name: "SEVOL",
        detail: "効果音の音量",
        regexp: /^SEVOL$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("SEVOL:<percent>").value,
        snippet: new vscode_1.SnippetString().appendText("SEVOL:").value,
        documentation: new vscode_1.MarkdownString()
            .appendMarkdown("効果音の音量。  \n")
            .appendMarkdown("基準値は100。").value,
        section: "Root",
        separator: "None",
        recommend: [],
        order: 1,
    },
    scoreinit: {
        name: "SCOREINIT",
        detail: "初項",
        regexp: /^SCOREINIT$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("SCOREINIT:<int>").value,
        snippet: new vscode_1.SnippetString().appendText("SCOREINIT:").value,
        documentation: new vscode_1.MarkdownString()
            .appendMarkdown("配点の初項。  \n")
            .appendMarkdown("10コンボ未満の時に小音符を良判定で叩いたときの得点を指定します。").value,
        section: "Course",
        separator: "None",
        recommend: ["SCOREDIFF"],
        order: 1,
    },
    scorediff: {
        name: "SCOREDIFF",
        detail: "公差",
        regexp: /^SCOREDIFF$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("SCOREDIFF:<int>").value,
        snippet: new vscode_1.SnippetString().appendText("SCOREDIFF:").value,
        documentation: new vscode_1.MarkdownString()
            .appendMarkdown("配点の公差。  \n")
            .appendMarkdown("一定のコンボ数ごとに加算される一打あたりの点数を指定します。").value,
        section: "Course",
        separator: "None",
        recommend: [],
        order: 1,
    },
    style: {
        name: "STYLE",
        detail: "プレイ人数",
        regexp: /^STYLE$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("STYLE:<style>").value,
        snippet: new vscode_1.SnippetString().appendText("STYLE:").value,
        documentation: new vscode_1.MarkdownString()
            .appendMarkdown("プレイ人数を指定します。  \n")
            .appendMarkdown("`<style>`: `Single`,`Double`もしくは`1`,`2`の値を指定します。  \n")
            .appendMarkdown("`Single`または`1`は一人プレイ、`Double`または`2`は二人プレイの譜面であることを示します。").value,
        section: "Style",
        separator: "None",
        recommend: [],
        order: 1,
    },
    life: {
        name: "LIFE",
        detail: "ライフ",
        regexp: /^LIFE$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("LIFE:<int>").value,
        snippet: new vscode_1.SnippetString().appendText("LIFE:").value,
        documentation: new vscode_1.MarkdownString()
            .appendMarkdown("ライフの数を指定します。  \n")
            .appendMarkdown("不可を出すたびにライフが減り、0になると強制的に演奏が中断されます。").value,
        section: "Course",
        separator: "None",
        recommend: [],
        order: 2,
    },
    demostart: {
        name: "DEMOSTART",
        detail: "選曲画面のデモ再生位置",
        regexp: /^DEMOSTART$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("DEMOSTART:<second>").value,
        snippet: new vscode_1.SnippetString().appendText("DEMOSTART:").value,
        documentation: new vscode_1.MarkdownString().appendMarkdown("選曲画面で流すデモの再生開始位置を秒で指定します。").value,
        section: "Root",
        separator: "None",
        recommend: [],
        order: 0,
    },
    side: {
        name: "SIDE",
        detail: "表裏表示設定",
        regexp: /^SIDE$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("SIDE:<side>").value,
        snippet: new vscode_1.SnippetString().appendText("SIDE:").value,
        documentation: new vscode_1.MarkdownString()
            .appendMarkdown("曲選択画面での表示設定。  \n")
            .appendMarkdown("`<side>`: `Normal`,`Ex`,`Both`もしくは`1` ~ `3`の値を指定します。  \n")
            .appendMarkdown("`Normal`か`1`を入力した場合、曲選択画面で表状態のときのみ曲が表示され、  \n")
            .appendMarkdown("`Ex`か`2`を入力した場合、曲選択画面で裏状態のときのみ曲が表示されます。  \n")
            .appendMarkdown("`Both`か`3`を入力した場合は常に表示されます（初期設定）。").value,
        section: "Root",
        separator: "None",
        recommend: ["SIDEREV"],
        order: 2,
    },
    subtitle: {
        name: "SUBTITLE",
        detail: "サブタイトル",
        regexp: /^SUBTITLE$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("SUBTITLE:[--]<string>").value,
        snippet: new vscode_1.SnippetString().appendText("SUBTITLE:").value,
        documentation: new vscode_1.MarkdownString()
            .appendMarkdown("曲のサブタイトル。  \n")
            .appendMarkdown("最初に`--`と入れるとプレイ中に表示されなくなります。").value,
        section: "Root",
        separator: "None",
        recommend: [],
        order: 0,
    },
    song: {
        name: "SONG",
        detail: "コースの課題曲",
        regexp: /^SONG$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("SONG:<filepath>").value,
        snippet: new vscode_1.SnippetString().appendText("SONG:").value,
        documentation: new vscode_1.MarkdownString()
            .appendMarkdown("コースに使用する譜面のファイルパス。  \n")
            .appendMarkdown("`.tjc`ファイル上で有効なヘッダです。  \n")
            .appendMarkdown("`<filepath>`: tjaファイルをルートディレクトリから指定します。").value,
        section: "Root",
        separator: "None",
        recommend: ["SONG"],
        order: 2,
    },
    // 太鼓さん次郎2
    siderev: {
        name: "SIDEREV",
        detail: "表裏の対応ファイル",
        regexp: /^SIDEREV$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("SIDEREV:<filepath>").value,
        snippet: new vscode_1.SnippetString().appendText("SIDEREV:").value,
        documentation: new vscode_1.MarkdownString().appendMarkdown("表裏で対になる譜面ファイルを指定します。")
            .value,
        section: "Root",
        separator: "None",
        recommend: [],
        order: 2,
    },
    scoremode: {
        name: "SCOREMODE",
        detail: "配点方式",
        regexp: /^SCOREMODE$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("SCOREMODE:<mode>").value,
        snippet: new vscode_1.SnippetString().appendText("SCOREMODE:").value,
        documentation: new vscode_1.MarkdownString()
            .appendMarkdown("配点方式を指定します。  \n")
            .appendMarkdown("`<mode>`: `0` ~ `2`の値を指定します。  \n")
            .appendMarkdown("`0`でドンだフル、`1`でAC14、`2`で新筐体。").value,
        section: "Root",
        separator: "None",
        recommend: [],
        order: 1,
    },
    total: {
        name: "TOTAL",
        detail: "ノルマゲージの重さ",
        regexp: /^TOTAL$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("TOTAL:<total>").value,
        snippet: new vscode_1.SnippetString().appendText("TOTAL:").value,
        documentation: new vscode_1.MarkdownString()
            .appendMarkdown("ノルマゲージの増える量を指定します。  \n")
            .appendMarkdown("全良でゲージが満タンになる基準値を100とします。  \n").value,
        section: "Course",
        separator: "None",
        recommend: [],
        order: 1,
    },
    // TJAPlayer2forPC
    balloonnor: {
        name: "BALLOONNOR",
        detail: "風船打数（普通）",
        regexp: /^BALLOONNOR$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("BALLOONNOR:[<int>...]").value,
        snippet: new vscode_1.SnippetString().appendText("BALLOONNOR:").value,
        documentation: new vscode_1.MarkdownString()
            .appendMarkdown("普通譜面での風船音符の打数を`,`区切りで入力します。  \n")
            .appendMarkdown("省略した場合は一律5打になります。").value,
        section: "Course",
        separator: "Comma",
        recommend: ["BALLOONEXP", "BALLOONMAS"],
        order: 1,
    },
    balloonexp: {
        name: "BALLOONEXP",
        detail: "風船打数（玄人）",
        regexp: /^BALLOONEXP$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("BALLOONEXP:[<int>...]").value,
        snippet: new vscode_1.SnippetString().appendText("BALLOONEXP:").value,
        documentation: new vscode_1.MarkdownString()
            .appendMarkdown("玄人譜面での風船音符の打数を`,`区切りで入力します。  \n")
            .appendMarkdown("省略した場合は一律5打になります。").value,
        section: "Course",
        separator: "Comma",
        recommend: ["BALLOONMAS"],
        order: 1,
    },
    balloonmas: {
        name: "BALLOONMAS",
        detail: "風船打数（達人）",
        regexp: /^BALLOONMAS$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("BALLOONMAS:[<int>...]").value,
        snippet: new vscode_1.SnippetString().appendText("BALLOONMAS:").value,
        documentation: new vscode_1.MarkdownString()
            .appendMarkdown("達人譜面での風船音符の打数を`,`区切りで入力します。  \n")
            .appendMarkdown("省略した場合は一律5打になります。").value,
        section: "Course",
        separator: "Comma",
        recommend: [],
        order: 1,
    },
    genre: {
        name: "GENRE",
        detail: "ジャンル",
        regexp: /^GENRE$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("GENRE:<genre>").value,
        snippet: new vscode_1.SnippetString().appendText("GENRE:").value,
        documentation: new vscode_1.MarkdownString().appendMarkdown("曲のジャンル。").value,
        section: "Root",
        separator: "None",
        recommend: [],
        order: 1,
    },
    movieoffset: {
        name: "MOVIEOFFSET",
        detail: "背景動画の再生タイミング",
        regexp: /^MOVIEOFFSET$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("MOVIEOFFSET:<second>").value,
        snippet: new vscode_1.SnippetString().appendText("MOVIEOFFSET:").value,
        documentation: new vscode_1.MarkdownString().appendMarkdown("音源ファイルの再生位置と背景動画ファイルの再生タイミングの差を秒数で指定します。").value,
        section: "Root",
        separator: "None",
        recommend: [],
        order: 1,
    },
    bgimage: {
        name: "BGIMAGE",
        detail: "背景画像",
        regexp: /^BGIMAGE$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("BGIMAGE:<filepath>").value,
        snippet: new vscode_1.SnippetString().appendText("BGIMAGE:").value,
        documentation: new vscode_1.MarkdownString().appendMarkdown("背景画像ファイルのパス。").value,
        section: "Root",
        separator: "None",
        recommend: ["BGMOVIE", "BGOFFSET"],
        order: 1,
    },
    bgmovie: {
        name: "BGMOVIE",
        detail: "背景動画",
        regexp: /^BGMOVIE$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("BGMOVIE:<filepath>").value,
        snippet: new vscode_1.SnippetString().appendText("BGMOVIE:").value,
        documentation: new vscode_1.MarkdownString().appendMarkdown("背景動画ファイルのパス。").value,
        section: "Root",
        separator: "None",
        recommend: ["MOVIEOFFSET"],
        order: 1,
    },
    hiddenbranch: {
        name: "HIDDENBRANCH",
        detail: "譜面分岐を隠す",
        regexp: /^HIDDENBRANCH$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("HIDDENBRANCH:1").value,
        snippet: new vscode_1.SnippetString().appendText("HIDDENBRANCH:").value,
        documentation: new vscode_1.MarkdownString().appendMarkdown("譜面分岐を分岐する瞬間まで隠します。")
            .value,
        section: "Course",
        separator: "None",
        recommend: [],
        order: 1,
    },
    // OpenTaiko
    exam: {
        name: "EXAM",
        detail: "課題曲の合格条件",
        regexp: /^EXAM[0-9]+$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("EXAM1:<type>,<red>,<gold>,<range>").value,
        snippet: new vscode_1.SnippetString().appendText("EXAM").appendPlaceholder("n").appendText(":").value,
        documentation: new vscode_1.MarkdownString()
            .appendMarkdown("課題曲の合格条件を指定します。  \n")
            .appendMarkdown("`EXAM`の直後に1以上の整数を指定します。ヘッダを呼ぶごとに数を増やします。  \n")
            .appendMarkdown("`#NEXTSONG`の後に呼ぶと課題曲ごとの条件を指定できます。  \n\n")
            .appendMarkdown("`<type>`: 条件の種類を指定します。詳細は下部に記載。  \n")
            .appendMarkdown("`<red>`: 赤合格の基準値を指定します。  \n")
            .appendMarkdown("`<gold>`: 金合格の基準値を指定します。  \n")
            .appendMarkdown("`<range>`: `m`または`l`を指定します。`m`は基準値以上、`l`は基準値未満で合格を表します。  \n\n")
            .appendMarkdown("### **条件の種類**  \n")
            .appendMarkdown("`g`: 魂ゲージ(%)  \n")
            .appendMarkdown("`jp`: 良の数  \n")
            .appendMarkdown("`jg`: 可の数  \n")
            .appendMarkdown("`jb`: 不可の数  \n")
            .appendMarkdown("`s`: スコア  \n")
            .appendMarkdown("`r`: 連打数  \n")
            .appendMarkdown("`h`: 叩けた数  \n")
            .appendMarkdown("`c`: 最大コンボ数").value,
        section: "Root",
        separator: "Comma",
        recommend: [],
        order: 2,
    },
    preimage: {
        name: "PREIMAGE",
        detail: "選曲画面の画像",
        regexp: /^PREIMAGE$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("PREIMAGE:<filepath>").value,
        snippet: new vscode_1.SnippetString().appendText("PREIMAGE:").value,
        documentation: new vscode_1.MarkdownString().appendMarkdown("選曲画面に表示する画像ファイルのパス。")
            .value,
        section: "Root",
        separator: "None",
        recommend: [],
        order: 1,
    },
    explicit: {
        name: "EXPLICIT",
        detail: "明示的な歌詞インジケーター",
        regexp: /^EXPLICIT$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("EXPLICIT:<type>").value,
        snippet: new vscode_1.SnippetString().appendText("EXPLICIT:").value,
        documentation: new vscode_1.MarkdownString()
            .appendMarkdown("曲に明示的な歌詞があるかどうかを示してください。 \n\n")
            .appendMarkdown("0はインジケータを隠し、1はそれを示します。 \n\n")
            .appendMarkdown("これは、それをサポートするOpenTaikoスキンにのみ適用されます。").value,
        section: "Root",
        separator: "None",
        recommend: [],
        order: 1,
    },
    bgoffset: {
        name: "BGOFFSET",
        detail: "背景画像の表示タイミング",
        regexp: /^BGOFFSET$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("BGOFFSET:<second>").value,
        snippet: new vscode_1.SnippetString().appendText("BGOFFSET:").value,
        documentation: new vscode_1.MarkdownString().appendMarkdown("譜面の再生位置と背景画像ファイルの表示タイミングの差を秒数で指定します。").value,
        section: "Root",
        separator: "None",
        recommend: [],
        order: 1,
    },
    dantick: {
        name: "DANTICK",
        detail: "段位種別",
        regexp: /^DANTICK$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("DANTICK:<type>").value,
        snippet: new vscode_1.SnippetString().appendText("DANTICK:").value,
        documentation: new vscode_1.MarkdownString()
            .appendMarkdown("段位の種別を指定します。  \n")
            .appendMarkdown("`<type>`: 段位の種別を`0` ~ `5`から指定します詳細は下部に記載。\n\n")
            .appendMarkdown("### **段位の種別**  \n\n")
            .appendMarkdown("`0`: 初級以下  \n")
            .appendMarkdown("`1`: 青段位  \n")
            .appendMarkdown("`2`: 赤段位  \n")
            .appendMarkdown("`3`: 人段位①（銀）  \n")
            .appendMarkdown("`4`: 人段位②（金）  \n")
            .appendMarkdown("`5`: 外伝").value,
        section: "Root",
        separator: "None",
        recommend: ["DANTICKCOLOR"],
        order: 2,
    },
    dantickcolor: {
        name: "DANTICKCOLOR",
        detail: "段位の表示色",
        regexp: /^DANTICKCOLOR$/,
        syntax: new vscode_1.MarkdownString().appendCodeblock("DANTICKCOLOR:#<color>").value,
        snippet: new vscode_1.SnippetString().appendText("DANTICKCOLOR:#FFFFFF").value,
        documentation: new vscode_1.MarkdownString().appendMarkdown("段位の表示色をHTMLカラーコードで指定します。").value,
        section: "Root",
        separator: "None",
        recommend: [],
        order: 2,
    },
});
//# sourceMappingURL=headers.js.map
