# TJA Format Support

太鼓の達人シミュレーターで使用される`.tja`フォーマットをサポートします。

主な機能
- 譜面の色付け
- 簡易的な入力補完
- マウスを重ねた際にヒントを表示

![sample](/images/sample.png)

## 更新履歴

### 1.1.1

- 修正
  - READMEの修正

### 1.1.0

- 追加
  - ヒントを実装（ヘッダ+命令）
  - 入力補完時にもヒントが出るようにしました
  - #を1文字打つだけで補完が出るようにしました
- 仕様変更
  - 入力補完の内部実装をTypeScriptに変更
  - ユーティリティ系の入力補完を一時的に削除
- 修正
  - ヘッダと命令が行頭以外でも入力補完が効いていたのを修正
  - ヘッダ先頭の++--色付けをSUBTITLE:のみに修正
  - 説明のスペルミス修正
  - 一部表現を修正
  - VSCodeの全角スペースハイライト設定を無効化
  - 一部サンプルコードが動いていたのを削除
- 既知の不具合
  - EXAM:ヘッダがうまく動きません

### 1.0.1

- 追加
  - ヒントを実装（命令のみ）
- 仕様変更
  - 命令の色を青→紫に変更
    - 譜面部分と被らない色という意図です
  - ヘッダと命令を大文字のみに制限
- 修正
  - 分岐関係の命令で色が変わっていなかったものを修正
  - 間違えて#EXAM命令が生まれていたので削除
  - 連打の後に#END命令が来ても連打の色が続いていたのを修正

### 1.0.0

- 初期リリース