# obsidian-cat-jump

<p align="left">
  <a href="README.ja.md"><img src="https://img.shields.io/badge/🇯🇵-Japanese-red.svg" alt="Japanese"></a>
  <a href="README.md"><img src="https://img.shields.io/badge/🇺🇸-English-blue.svg" alt="English"></a>
  <a href="https://deepwiki.com/cat2151/obsidian-cat-jump"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki"></a>
</p>

ノートの任意の場所にカーソルを素早くジャンプできるObsidianコミュニティプラグインです。

## インストール
- Obsidian に BRAT（Beta Reviewers Auto-update Tester）コミュニティプラグインをインストールします。
- コマンドパレットを開き、 brat add を入力し、URL入力ダイアログが表示されることを確認します。
- 当GitHubのURLを入力します。
- Latest Versionを選び、addボタンを押します。
- ホットキーに `Cat Jump : Jump` コマンドを登録します。
- ホットキーを押して、ラベルが表示されることを確認します。
- update時は、コマンドパレットで brat check 等が楽です。反映されない場合、Obsidianを再起動で解決することがあります。

## 使い方
- ホットキーを押すと、ラベルが表示されます。
- ラベルのキーを押すと、カーソルがラベルの場所にジャンプします。

## 特徴
- 低い学習コスト。ラベルはa-zの順番で並び色分けされており、場所を予測しやすい。
- シンプル。ラベルが表示されるのは、ノートの見えている範囲の行頭のみで、挙動を推測しやすい。
- 折りたたみを考慮。折りたたまれていない場所のみラベリングするため、直感的に操作できます。
- 長文向け。デイリーノートや長文ノート、header階層の浅い場所や深い場所、bullet listの途中などに素早くジャンプしたい用途に向きます。
- モディファイアキー不使用。頻繁にジャンプする用途向けに、SHIFTやCTRLキーを使わず、a-zキーだけに絞り、指への負担を下げています。

※英語版READMEは、GitHub ActionsでGeminiを利用して日本語から翻訳しました
