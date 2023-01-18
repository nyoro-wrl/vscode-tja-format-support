import * as vscode from 'vscode';

type Document = {
    readonly name: string;
    readonly symbol: Readonly<vscode.MarkdownString>;
    readonly documentation: Readonly<vscode.MarkdownString>;
};

export const commandDocuments = new Map<string, Document>([
    ["start", {
        name: "START",
        symbol: new vscode.MarkdownString().appendCodeblock("#START" + " [<player>]"),
        documentation: new vscode.MarkdownString()
            .appendMarkdown("譜面データの記述を開始します。  \n")
            .appendMarkdown("`#START`と`#END`で囲んだ範囲が譜面データとして解釈されます。  \n\n")
            .appendMarkdown("`<player>`に`P1`や`P2`を指定することで、譜面をプレイヤー別に記述することができます。")
    }],
    ["end", {
        name: "END",
        symbol: new vscode.MarkdownString().appendCodeblock("#END"),
        documentation: new vscode.MarkdownString()
            .appendMarkdown("譜面データの記述を終了します。  \n")
            .appendMarkdown("`#START`と`#END`で囲んだ範囲が譜面データとして解釈されます。")
    }],
    ["bpmchange", {
        name: "BPMCHANGE",
        symbol: new vscode.MarkdownString().appendCodeblock("#BPMCHANGE" + " <bpm>"),
        documentation: new vscode.MarkdownString().appendMarkdown("BPMを変更します。")
    }],
    ["gogostart", {
        name: "GOGOSTART",
        symbol: new vscode.MarkdownString().appendCodeblock("#GOGOSTART"),
        documentation: new vscode.MarkdownString().appendMarkdown("ゴーゴータイムを開始します。")
    }],
    ["gogoend", {
        name: "GOGOEND",
        symbol: new vscode.MarkdownString().appendCodeblock("#GOGOEND"),
        documentation: new vscode.MarkdownString().appendMarkdown("ゴーゴータイムを終了します。")
    }],
    ["measure", {
        name: "MEASURE",
        symbol: new vscode.MarkdownString().appendCodeblock("#MEASURE" + " <numer>/<denom>"),
        documentation: new vscode.MarkdownString()
            .appendMarkdown("拍子を変更します。  \n")
            .appendMarkdown("`4/4`で4分の4拍子、`6/8`で8分の6拍子になります。")
    }],
    ["scroll", {
        name: "SCROLL",
        symbol: new vscode.MarkdownString().appendCodeblock("#SCROLL" + " <rate>"),
        documentation: new vscode.MarkdownString()
            .appendMarkdown("譜面のスクロール速度を`<rate>`倍に変更します。  \n")
            .appendMarkdown("デフォルトは`1.00`です。")
    }],
    ["delay", {
        name: "DELAY",
        symbol: new vscode.MarkdownString().appendCodeblock("#DELAY" + " <second>"),
        documentation: new vscode.MarkdownString()
            .appendMarkdown("譜面が流れてくるタイミングを`<second>`秒遅らせます。  \n")
            .appendMarkdown("`#BMSCROLL`,`#HBSCROLL`適用下では譜面停止扱いになります。")
    }],
    ["section", {
        name: "SECTION",
        symbol: new vscode.MarkdownString().appendCodeblock("#SECTION"),
        documentation: new vscode.MarkdownString()
            .appendMarkdown("譜面分岐の判定に使う連打数、精度をリセットします。  \n")
            .appendMarkdown("分岐したい箇所の一小節以上前に置いてください。")
    }],
    ["branchstart", {
        name: "BRANCHSTART",
        symbol: new vscode.MarkdownString().appendCodeblock("#BRANCHSTART"),
        documentation: new vscode.MarkdownString()
            .appendMarkdown("譜面分岐を開始します。  \n\n")
            .appendMarkdown("`<type>`: 分岐条件を指定します。`r`で連打数、`p`で精度(%)、`s`でスコア。  \n")
            .appendMarkdown("`<expart>`: この数値以上で玄人譜面に分岐します。  \n")
            .appendMarkdown("`<master>`: この数値以上で達人譜面に分岐します。  \n\n")
            .appendMarkdown("分岐判定は一小節前に行われます。  \n")
            .appendMarkdown("一小節前から連打が始まる場合、その連打もカウントします。  \n\n")
            .appendMarkdown("分岐後は普通譜面`#N`、玄人譜面`#E`、達人譜面`#M`で記述します。")
    }],
    ["branchend", {
        name: "BRANCHEND",
        symbol: new vscode.MarkdownString().appendCodeblock("#BRANCHEND"),
        documentation: new vscode.MarkdownString()
            .appendMarkdown("譜面分岐を終了します。  \n")
            .appendMarkdown("以降は全ての分岐で共通の譜面が流れます。")
    }],
    ["n", {
        name: "N",
        symbol: new vscode.MarkdownString().appendCodeblock("#N"),
        documentation: new vscode.MarkdownString().appendMarkdown("普通譜面を記述します。")
    }],
    ["e", {
        name: "E",
        symbol: new vscode.MarkdownString().appendCodeblock("#E"),
        documentation: new vscode.MarkdownString().appendMarkdown("玄人譜面を記述します。")
    }],
    ["m", {
        name: "M",
        symbol: new vscode.MarkdownString().appendCodeblock("#M"),
        documentation: new vscode.MarkdownString().appendMarkdown("達人譜面を記述します。")
    }],
    ["levelhold", {
        name: "LEVELHOLD",
        symbol: new vscode.MarkdownString().appendCodeblock("#LEVELHOLD"),
        documentation: new vscode.MarkdownString()
            .appendMarkdown("現在の譜面分岐を固定します。  \n")
            .appendMarkdown("この命令がある小節に到達した場合、以後も譜面分岐が行われなくなります。")
    }],
    ["bmscroll", {
        name: "BMSCROLL",
        symbol: new vscode.MarkdownString().appendCodeblock("#BMSCROLL"),
        documentation: new vscode.MarkdownString()
            .appendMarkdown("譜面のスクロールがBMS形式になります。  \n")
            .appendMarkdown("`#START`より前に記述してください。")
    }],
    ["hbscroll", {
        name: "HBSCROLL",
        symbol: new vscode.MarkdownString().appendCodeblock("#HBSCROLL"),
        documentation: new vscode.MarkdownString()
            .appendMarkdown("譜面のスクロールが`#BMSCROLL`に`#SCROLL`の効果を含めた形式になります。  \n")
            .appendMarkdown("`#START`より前に記述してください。")
    }],
    ["barlineoff", {
        name: "BARLINEOFF",
        symbol: new vscode.MarkdownString().appendCodeblock("#BARLINEOFF"),
        documentation: new vscode.MarkdownString().appendMarkdown("小節線を非表示にします。")
    }],
    ["barlineon", {
        name: "BARLINEON",
        symbol: new vscode.MarkdownString().appendCodeblock("#BARLINEON"),
        documentation: new vscode.MarkdownString().appendMarkdown("小節線を表示します。")
    }],
    ["lyric", {
        name: "LYRIC",
        symbol: new vscode.MarkdownString().appendCodeblock("#LYRIC" + " <string>"),
        documentation: new vscode.MarkdownString().appendMarkdown("歌詞を表示します。")
    }],
    ["sudden", {
        name: "SUDDEN",
        symbol: new vscode.MarkdownString().appendCodeblock("#SUDDEN" + " <sudden> <move>"),
        documentation: new vscode.MarkdownString()
            .appendMarkdown("音符の出現タイミングと動作タイミングを変更します。  \n")
            .appendMarkdown("`<sudden>`秒前に出現し、`<move>`秒前に動き出します。  \n")
            .appendMarkdown("`<sudden>`に`0`を指定すると通常の動作に戻ります（このとき`<move>`にも仮の値を指定する必要があります）。")
    }],
    ["direction", {
        name: "DIRECTION",
        symbol: new vscode.MarkdownString().appendCodeblock("#DIRECTION" + " <direction>"),
        documentation: new vscode.MarkdownString()
            .appendMarkdown("譜面の流れる方向を指定します。  \n\n")
            .appendMarkdown("`0`: ←（通常）  \n")
            .appendMarkdown("`1`: ↓  \n")
            .appendMarkdown("`2`: ↑  \n")
            .appendMarkdown("`3`: ↙  \n")
            .appendMarkdown("`4`: ↖  \n")
            .appendMarkdown("`5`: →  \n")
            .appendMarkdown("`6`: ↘  \n")
            .appendMarkdown("`7`: ↗")
    }],
    ["jposscroll", {
        name: "JPOSSCROLL",
        symbol: new vscode.MarkdownString().appendCodeblock("#JPOSSCROLL" + " <second> <distance> <direction>"),
        documentation: new vscode.MarkdownString()
            .appendMarkdown("判定枠を左右に移動します。  \n\n")
            .appendMarkdown("`<second>`: 移動にかかる秒数。  \n")
            .appendMarkdown("`<distance>`: 移動距離をpxで指定します。  \n")
            .appendMarkdown("`<direction>`: 移動方向を`0`か`1`で指定します。`0`で左、`1`で右。")
    }],
    ["nextsong", {
        name: "NEXTSONG",
        symbol: new vscode.MarkdownString().appendCodeblock("#NEXTSONG" + " <title>,<subtitle>,<genre>,<wave>,[<scoreinit>,<scorediff>,<level>,<course>]"),
        documentation: new vscode.MarkdownString()
            .appendMarkdown("課題曲を指定します。  \n\n")
            .appendMarkdown("`<title>`: タイトル  \n")
            .appendMarkdown("`<subtitle>`: サブタイトル  \n")
            .appendMarkdown("`<genre>`: ジャンル  \n")
            .appendMarkdown("`<wave>`: 音源ファイル  \n")
            .appendMarkdown("`<scoreinit>`: 初項  \n")
            .appendMarkdown("`<scorediff>`: 公差  \n")
            .appendMarkdown("`<level>`: レベル  \n")
            .appendMarkdown("`<course>`: 難易度  \n")
    }],
    ["judgedelay", {
        name: "JUDGEDELAY",
        symbol: new vscode.MarkdownString().appendCodeblock("#JUDGEDELAY" + " <type> [...]"),
        documentation: new vscode.MarkdownString()
            .appendMarkdown("判定位置を判定枠からずらします。  \n")
            .appendMarkdown("譜面の流れる位置は判定位置に準拠します。  \n\n")
            .appendMarkdown("`<type>`: 位置の指定方法。`0`～`3`で指定します。ここに指定した値によって以降のパラメーターが異なります。")
            .appendCodeblock("#JUDGEDELAY 0")
            .appendMarkdown("判定位置を判定枠に戻します。")
            .appendCodeblock("#JUDGEDELAY 1 <second>")
            .appendMarkdown("判定枠から`<second>`秒前の位置にずらします。")
            .appendCodeblock("#JUDGEDELAY 2 <x> <y>")
            .appendMarkdown("判定枠から`<x>`,`<y>`軸の位置にずらします。")
            .appendCodeblock("#JUDGEDELAY 3 <second> <x> <y>")
            .appendMarkdown("判定枠から`<x>`,`<y>`軸かつ`<second>`秒前の位置にずらします。")
    }],
    ["dummystart", {
        name: "DUMMYSTART",
        symbol: new vscode.MarkdownString().appendCodeblock("#DUMMYSTART"),
        documentation: new vscode.MarkdownString().appendMarkdown("音符をダミーノーツにします。")
    }],
    ["dummyend", {
        name: "DUMMYEND",
        symbol: new vscode.MarkdownString().appendCodeblock("#DUMMYEND"),
        documentation: new vscode.MarkdownString().appendMarkdown("音符を普通のノーツに戻します。")
    }],
    ["notespawn", {
        name: "NOTESPAWN",
        symbol: new vscode.MarkdownString().appendCodeblock("#NOTESPAWN" + " <type> [<second>]"),
        documentation: new vscode.MarkdownString()
            .appendMarkdown("譜面の出現･隠蔽タイミングを指定します。  \n\n")
            .appendMarkdown("`<type>`: 動作種類の指定。`0` ~ `2`で指定します。ここに指定した値によって以降のパラメーターが異なります。")
            .appendCodeblock("#NOTESPAWN 0")
            .appendMarkdown("通常の動作に戻します。")
            .appendCodeblock("#NOTESPAWN 1 <second>")
            .appendMarkdown("譜面を`<second>`秒前に出現させます。")
            .appendCodeblock("#NOTESPAWN 2 <second>")
            .appendMarkdown("譜面を`<second>`秒前に隠蔽します。")
    }],
    ["size", {
        name: "SIZE",
        symbol: new vscode.MarkdownString().appendCodeblock("#SIZE" + " <rate>"),
        documentation: new vscode.MarkdownString().appendMarkdown("音符のサイズを`<rate>`倍にします。")
    }],
    ["color", {
        name: "COLOR",
        symbol: new vscode.MarkdownString().appendCodeblock("#COLOR" + " <red> <green> <blue> <alpha>"),
        documentation: new vscode.MarkdownString()
            .appendMarkdown("音符の色彩を変更します。  \n")
            .appendMarkdown("255を基準値とします。  \n\n")
            .appendMarkdown("`<red>`: 赤色  \n")
            .appendMarkdown("`<green>`: 緑色  \n")
            .appendMarkdown("`<blue>`: 青色  \n")
            .appendMarkdown("`<alpha>`: 不透明度")
    }],
    ["angle", {
        name: "ANGLE",
        symbol: new vscode.MarkdownString().appendCodeblock("#ANGLE" + " <angle>"),
        documentation: new vscode.MarkdownString().appendMarkdown("音符の向きを`<angle>`度回転させます。")
    }],
    ["gradation", {
        name: "GRADATION",
        symbol: new vscode.MarkdownString().appendCodeblock("#GRADATION" + " <type> [<second> <type1> <type2>]"),
        documentation: new vscode.MarkdownString()
            .appendMarkdown("他の命令の即時的な効果を時間的に変化させます。  \n\n")
            .appendMarkdown("`<type>`: `start`,`end`,`init`のいずれかを指定します。ここに指定した値によって以降のパラメーターが異なります。")
            .appendCodeblock("#GRADATION start <second> <type1> <type2>")
            .appendMarkdown("GRADATIONを開始します。  \n\n")
            .appendMarkdown("`<second>`: 何秒前に変化を始めるか。  \n")
            .appendMarkdown("`<type1>`: イージングの種類を`0` ~ `2`で指定します。`0`はEaseIn, `1`はEaseOut, `2`はEaseInOut。  \n")
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
            .appendCodeblock("1111,")
    }],
    ["barlinesize", {
        name: "BARLINESIZE",
        symbol: new vscode.MarkdownString().appendCodeblock("#BARLINESIZE" + " <width> <height>"),
        documentation: new vscode.MarkdownString()
            .appendMarkdown("小節線のサイズを変更します。  \n\n")
            .appendMarkdown("`<width>`: 横幅をpxで指定します。  \n")
            .appendMarkdown("`<height>`: 縦幅をpxで指定します。")
    }],
    ["resetcommand", {
        name: "RESETCOMMAND",
        symbol: new vscode.MarkdownString().appendCodeblock("#RESETCOMMAND"),
        documentation: new vscode.MarkdownString().appendMarkdown("全ての命令の効果を初期値に戻します。")
    }],
]);