import * as vscode from 'vscode';
import { Hover } from 'vscode';

const hoverProvider = vscode.languages.registerHoverProvider("tja", {
    provideHover(document, position, token) {
        const hover = {
            symbol: new vscode.MarkdownString(),
            description: new vscode.MarkdownString(),
        };
        const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9#]+/);
        if (wordRange === undefined) {
            return Promise.reject("no word here");
        }

        const line = document.lineAt(position.line).text;
        const currentWord = line.slice(wordRange.start.character, wordRange.end.character);

        if (wordRange.start.character === 0 && currentWord[0] === "#") {
            // 命令
            switch (currentWord) {
                // 命令.太鼓さん次郎
                case "#START":
                    hover.symbol.appendCodeblock(currentWord + " [<player>]");
                    hover.description.appendMarkdown("譜面データの記述を開始します。  \n");
                    hover.description.appendMarkdown("`#START`と`#END`で囲んだ範囲が譜面データとして解釈されます。  \n\n");
                    hover.description.appendMarkdown("`<player>`に`P1`や`P2`を指定することで、譜面をプレイヤー別に記述することができます。");
                    break;
                case "#END":
                    hover.symbol.appendCodeblock(currentWord);
                    hover.description.appendMarkdown("譜面データの記述を終了します。  \n");
                    hover.description.appendMarkdown("`#START`と`#END`で囲んだ範囲が譜面データとして解釈されます。");
                    break;
                case "#BPMCHANGE":
                    hover.symbol.appendCodeblock(currentWord + " <bpm>");
                    hover.description.appendMarkdown("BPMを変更します。");
                    break;
                case "#GOGOSTART":
                    hover.symbol.appendCodeblock(currentWord);
                    hover.description.appendMarkdown("ゴーゴータイムを開始します。");
                    break;
                case "#GOGOEND":
                    hover.symbol.appendCodeblock(currentWord);
                    hover.description.appendMarkdown("ゴーゴータイムを終了します。");
                    break;
                case "#MEASURE":
                    hover.symbol.appendCodeblock(currentWord + " <numer>/<denom>");
                    hover.description.appendMarkdown("拍子を変更します。  \n");
                    hover.description.appendMarkdown("`4/4`で4分の4拍子、`6/8`で8分の6拍子になります。");
                    break;
                case "#SCROLL":
                    hover.symbol.appendCodeblock(currentWord + " <rate>");
                    hover.description.appendMarkdown("譜面のスクロール速度を`<rate>`倍に変更します。  \n");
                    hover.description.appendMarkdown("デフォルトは`1.00`です。");
                    break;
                case "#DELAY":
                    hover.symbol.appendCodeblock(currentWord + " <second>");
                    hover.description.appendMarkdown("譜面が流れてくるタイミングを`<second>`秒遅らせます。  \n");
                    hover.description.appendMarkdown("`#BMSCROLL`,`#HBSCROLL`適用下では譜面停止扱いになります。");
                    break;
                case "#SECTION":
                    hover.symbol.appendCodeblock(currentWord);
                    hover.description.appendMarkdown("譜面分岐の判定に使う連打数、精度をリセットします。  \n");
                    hover.description.appendMarkdown("分岐したい箇所の一小節以上前に置いてください。");
                    break;
                case "#BRANCHSTART":
                    hover.symbol.appendCodeblock(currentWord + " <type>, <expart>, <mastar>");
                    hover.description.appendMarkdown("譜面分岐を開始します。  \n\n");
                    hover.description.appendMarkdown("`<type>`: 分岐条件を指定します。`r`で連打数、`p`で精度(%)、`s`でスコア。  \n");
                    hover.description.appendMarkdown("`<expart>`: この数値以上で玄人譜面に分岐します。  \n");
                    hover.description.appendMarkdown("`<mastar>`: この数値以上で達人譜面に分岐します。  \n\n");
                    hover.description.appendMarkdown("分岐判定は一小節前に行われます。  \n");
                    hover.description.appendMarkdown("一小節前から連打が始まる場合、その連打もカウントします。  \n\n");
                    hover.description.appendMarkdown("分岐後は普通譜面`#N`、玄人譜面`#E`、達人譜面`#M`で記述します。");
                    break;
                case "#BRANCHEND":
                    hover.symbol.appendCodeblock(currentWord);
                    hover.description.appendMarkdown("譜面分岐を終了します。  \n");
                    hover.description.appendMarkdown("以降は全ての分岐で共通の譜面が流れます。");
                    break;
                case "#N":
                    hover.symbol.appendCodeblock(currentWord);
                    hover.description.appendMarkdown("普通譜面を記述します。");
                    break;
                case "#E":
                    hover.symbol.appendCodeblock(currentWord);
                    hover.description.appendMarkdown("玄人譜面を記述します。");
                    break;
                case "#M":
                    hover.symbol.appendCodeblock(currentWord);
                    hover.description.appendMarkdown("達人譜面を記述します。");
                    break;
                case "#LEVELHOLD":
                    hover.symbol.appendCodeblock(currentWord);
                    hover.description.appendMarkdown("現在の譜面分岐を固定します。  \n");
                    hover.description.appendMarkdown("この命令がある小節に到達した場合、以後も譜面分岐が行われなくなります。");
                    break;
                case "#BMSCROLL":
                    hover.symbol.appendCodeblock(currentWord);
                    hover.description.appendMarkdown("譜面のスクロールがBMS形式になります。  \n");
                    hover.description.appendMarkdown("`#START`より前に記述してください。");
                    break;
                case "#HBSCROLL":
                    hover.symbol.appendCodeblock(currentWord);
                    hover.description.appendMarkdown("譜面のスクロールが`#BMSCROLL`に`#SCROLL`の効果を含めた形式になります。  \n");
                    hover.description.appendMarkdown("`#START`より前に記述してください。");
                    break;
                case "#BARLINEOFF":
                    hover.symbol.appendCodeblock(currentWord);
                    hover.description.appendMarkdown("小節線を非表示にします。");
                    break;
                case "#BARLINEON":
                    hover.symbol.appendCodeblock(currentWord);
                    hover.description.appendMarkdown("小節線を表示します。");
                    break;
                // 命令.TJAPlayer2forPC
                case "#LYRIC":
                    hover.symbol.appendCodeblock(currentWord + " <string>");
                    hover.description.appendMarkdown("歌詞を表示します。");
                    break;
                case "#SUDDEN":
                    hover.symbol.appendCodeblock(currentWord + " <sudden> <move>");
                    hover.description.appendMarkdown("音符の出現タイミングと動作タイミングを変更します。  \n");
                    hover.description.appendMarkdown("`<sudden>`秒前に出現し、`<move>`秒前に動き出します。  \n");
                    hover.description.appendMarkdown("`<sudden>`に`0`を指定すると通常の動作に戻ります（このとき`<move>`にも仮の値を指定する必要があります）。");
                    break;
                case "#DIRECTION":
                    hover.symbol.appendCodeblock(currentWord + " <direction>");
                    hover.description.appendMarkdown("譜面の流れる方向を指定します。  \n\n");
                    hover.description.appendMarkdown("`0`: ←（通常）  \n");
                    hover.description.appendMarkdown("`1`: ↓  \n");
                    hover.description.appendMarkdown("`2`: ↑  \n");
                    hover.description.appendMarkdown("`3`: ↙  \n");
                    hover.description.appendMarkdown("`4`: ↖  \n");
                    hover.description.appendMarkdown("`5`: →  \n");
                    hover.description.appendMarkdown("`6`: ↘  \n");
                    hover.description.appendMarkdown("`7`: ↗");
                    break;
                // 命令.TJAPlayer3
                case "#JPOSSCROLL":
                    hover.symbol.appendCodeblock(currentWord + " <second> <distance> <direction>");
                    hover.description.appendMarkdown("判定枠を左右に移動します。  \n\n");
                    hover.description.appendMarkdown("`<second>`: 移動にかかる秒数。  \n");
                    hover.description.appendMarkdown("`<distance>`: 移動距離をpxで指定します。  \n");
                    hover.description.appendMarkdown("`<direction>`: 移動方向を`0`か`1`で指定します。`0`で左、`1`で右。");
                    break;
                case "#NEXTSONG":
                    hover.symbol.appendCodeblock(currentWord + " <title>,<subtitle>,<genre>,<wave>,[<scoreinit>,<scorediff>,<level>,<course>]");
                    hover.description.appendMarkdown("課題曲を指定します。  \n\n");
                    hover.description.appendMarkdown("`<title>`: タイトル  \n");
                    hover.description.appendMarkdown("`<subtitle>`: サブタイトル  \n");
                    hover.description.appendMarkdown("`<genre>`: ジャンル  \n");
                    hover.description.appendMarkdown("`<wave>`: 音源ファイル  \n");
                    hover.description.appendMarkdown("`<scoreinit>`: 初項  \n");
                    hover.description.appendMarkdown("`<scorediff>`: 公差  \n");
                    hover.description.appendMarkdown("`<level>`: レベル  \n");
                    hover.description.appendMarkdown("`<course>`: 難易度  \n");
                    break;
                // 命令.TaikoManyGimmicks
                case "#JUDGEDELAY":
                    hover.symbol.appendCodeblock(currentWord + " <type> [...]");
                    hover.description.appendMarkdown("判定位置を判定枠からずらします。  \n");
                    hover.description.appendMarkdown("譜面の流れる位置は判定位置に準拠します。  \n\n");
                    hover.description.appendMarkdown("`<type>`: 位置の指定方法。`0`～`3`で指定します。ここに指定した値によって以降のパラメーターが異なります。");
                    hover.description.appendCodeblock("#JUDGEDELAY 0");
                    hover.description.appendMarkdown("判定位置を判定枠に戻します。");
                    hover.description.appendCodeblock("#JUDGEDELAY 1 <second>");
                    hover.description.appendMarkdown("判定枠から`<second>`秒前の位置にずらします。");
                    hover.description.appendCodeblock("#JUDGEDELAY 2 <x> <y>");
                    hover.description.appendMarkdown("判定枠から`<x>`,`<y>`軸の位置にずらします。");
                    hover.description.appendCodeblock("#JUDGEDELAY 3 <second> <x> <y>");
                    hover.description.appendMarkdown("判定枠から`<x>`,`<y>`軸かつ`<second>`秒前の位置にずらします。");
                    break;
                case "#DUMMYSTART":
                    hover.symbol.appendCodeblock(currentWord);
                    hover.description.appendMarkdown("音符をダミーノーツにします。");
                    break;
                case "#DUMMYEND":
                    hover.symbol.appendCodeblock(currentWord);
                    hover.description.appendMarkdown("音符を普通のノーツに戻します。");
                    break;
                case "#NOTESPAWN":
                    hover.symbol.appendCodeblock(currentWord + " <type> [<second>]");
                    hover.description.appendMarkdown("譜面の出現･隠蔽タイミングを指定します。  \n\n");
                    hover.description.appendMarkdown("`<type>`: 動作種類の指定。`0` ~ `2`で指定します。ここに指定した値によって以降のパラメーターが異なります。");
                    hover.description.appendCodeblock("#NOTESPAWN 0");
                    hover.description.appendMarkdown("通常の動作に戻します。");
                    hover.description.appendCodeblock("#NOTESPAWN 1 <second>");
                    hover.description.appendMarkdown("譜面を`<second>`秒前に出現させます。");
                    hover.description.appendCodeblock("#NOTESPAWN 2 <second>");
                    hover.description.appendMarkdown("譜面を`<second>`秒前に隠蔽します。");
                    break;
                case "#SIZE":
                    hover.symbol.appendCodeblock(currentWord + " <rate>");
                    hover.description.appendMarkdown("音符のサイズを`<rate>`倍にします。");
                    break;
                case "#COLOR":
                    hover.symbol.appendCodeblock(currentWord + " <red> <green> <blue> <alpha>");
                    hover.description.appendMarkdown("音符の色彩を変更します。  \n");
                    hover.description.appendMarkdown("255を基準値とします。  \n\n");
                    hover.description.appendMarkdown("`<red>`: 赤色  \n");
                    hover.description.appendMarkdown("`<green>`: 緑色  \n");
                    hover.description.appendMarkdown("`<blue>`: 青色  \n");
                    hover.description.appendMarkdown("`<alpha>`: 不透明度");
                    break;
                case "#ANGLE":
                    hover.symbol.appendCodeblock(currentWord + " <angle>");
                    hover.description.appendMarkdown("音符の向きを`<angle>`度回転させます。");
                    break;
                case "#GRADATION":
                    hover.symbol.appendCodeblock(currentWord + " <type> [<second> <type1> <type2>]");
                    hover.description.appendMarkdown("他の命令の即時的な効果を時間的に変化させます。  \n\n");
                    hover.description.appendMarkdown("`<type>`: `start`,`end`,`init`のいずれかを指定します。ここに指定した値によって以降のパラメーターが異なります。");
                    hover.description.appendCodeblock("#GRADATION start <second> <type1> <type2>");
                    hover.description.appendMarkdown("GRADATIONを開始します。  \n\n");
                    hover.description.appendMarkdown("`<second>`: 何秒前に変化を始めるか。  \n");
                    hover.description.appendMarkdown("`<type1>`: イージングの種類を`0` ~ `2`で指定します。`0`はEaseIn, `1`はEaseOut, `2`はEaseInOut。  \n");
                    hover.description.appendMarkdown("`<type2>`: 挙動を`0` ~ `10`で指定します。詳細は下部に記載。");
                    hover.description.appendCodeblock("#GRADATION end");
                    hover.description.appendMarkdown("GRADATIONを終了します。");
                    hover.description.appendCodeblock("#GRADATION init");
                    hover.description.appendMarkdown("GRADATIONを初期化します。  \n");
                    hover.description.appendMarkdown("### **挙動の種類**  \n");
                    hover.description.appendMarkdown("`0`: Linear（直線）  \n");
                    hover.description.appendMarkdown("`1`: Sine（三角関数）  \n");
                    hover.description.appendMarkdown("`2`: Quad（二次）  \n");
                    hover.description.appendMarkdown("`3`: Cubic（三次）  \n");
                    hover.description.appendMarkdown("`4`: Quart（四次）  \n");
                    hover.description.appendMarkdown("`5`: Quint（五次）  \n");
                    hover.description.appendMarkdown("`6`: Expo（指数）  \n");
                    hover.description.appendMarkdown("`7`: Circ（円形）  \n");
                    hover.description.appendMarkdown("`8`: Back（三次と二次）  \n");
                    hover.description.appendMarkdown("`9`: Elastic（弾性）  \n");
                    hover.description.appendMarkdown("`10`: Bounce（バウンド）  \n");
                    hover.description.appendMarkdown("### **GRADATIONに対応する命令一覧**");
                    hover.description.appendCodeblock("#SCROLL");
                    hover.description.appendCodeblock("#JUDGEDELAY");
                    hover.description.appendCodeblock("#SIZE");
                    hover.description.appendCodeblock("#COLOR");
                    hover.description.appendCodeblock("#ANGLE");
                    hover.description.appendMarkdown("### **基本的な書き方**  \n");
                    hover.description.appendMarkdown("`start` → 変化前の命令 → `end` → 変化後の命令  \n");
                    hover.description.appendMarkdown("と続けて書くことで動作します。");
                    hover.description.appendCodeblock("#GRADATION start 1 0 0");
                    hover.description.appendCodeblock("#SIZE 1 // 変化前の命令");
                    hover.description.appendCodeblock("#GRADATION end");
                    hover.description.appendCodeblock("#SIZE 2 // 変化後の命令");
                    hover.description.appendCodeblock("1111,");
                    break;
                case "#BARLINESIZE":
                    hover.symbol.appendCodeblock(currentWord + " <width> <height>");
                    hover.description.appendMarkdown("小節線のサイズを変更します。  \n\n");
                    hover.description.appendMarkdown("`<width>`: 横幅をpxで指定します。  \n");
                    hover.description.appendMarkdown("`<height>`: 縦幅をpxで指定します。");
                    break;
                case "#RESETCOMMAND":
                    hover.symbol.appendCodeblock(currentWord);
                    hover.description.appendMarkdown("全ての命令の効果を初期値に戻します。");
                    break;
            }
        } else if (wordRange.start.character === 0) {
            // 末尾が:かどうか判定させる
            // ヘッダ
            switch (currentWord) {
                default:
                    if (currentWord.match(/^EXAM\d*$/)) {
                        // hover.symbol.appendCodeblock("EXAM<i> <type>,<red>,<gold>,<range>");
                        // hover.description.appendMarkdown("課題曲の合格条件を指定します。  \n\n");
                        // hover.description.appendMarkdown("`<i>`: 何曲目の課題曲に対して指定するかを整数で指定します。  \n");
                        // hover.description.appendMarkdown("`<type>`: 何曲目の課題曲に対して指定するかを整数で指定します。  \n");
                    }
                    break;
            }
        }

        if (hover.symbol.value !== "" || hover.description.value !== "") {
            return new Hover([hover.symbol, hover.description]);
        }
    },
});

export default hoverProvider;