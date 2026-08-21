Uni928PublicHTMLsのファイル数が多くなったため、こちらに公開していきます。

# ファイル紹介

このリポジトリには、ブラウザだけで動作する単体HTML、AI関連の補助ツール、Android Studio用ファイル生成ツール、JavaScriptプラグイン、試作・検証用ファイルをまとめています。

GitHub Pagesで公開しているHTMLは、基本的に次の形式で開けます。

https://uni928.github.io/Uni928PublicHTMLs2/ファイル名

サブディレクトリ内のファイルは、ディレクトリ名もURLに含めます。ページによって、IndexedDBなどへの保存、外部ライブラリの読み込み、ダウンロード機能の有無が異なります。各ページの説明と注意書きを確認して利用してください。

## ルート直下のHTML・ツール

| ファイル | 紹介 |
| --- | --------- |
| [index1.html](https://uni928.github.io/Uni928PublicHTMLs2/index1.html) | APIの入力トークン数・出力トークン数・為替レート・1日あたりの実行回数などから、1リクエストあたりと30日間の料金を試算します。モデル別の料金比較と、入力値を含むURLの共有に対応しています。[旧版はこちら](https://uni928.github.io/Uni928PublicHTMLs/index14.html) |
| [index2.html](https://uni928.github.io/Uni928PublicHTMLs2/index2.html) | HTMLをドラッグ＆ドロップして圧縮します。元のコードを変更しない「安全版」、CSS・JavaScript・コメントなどを整理してから圧縮する「挑戦版」、整理だけを行う「整理のみ版」を選べます。 |
| [index3.html](https://uni928.github.io/Uni928PublicHTMLs2/index3.html) | 複数のHTML・CSS・JavaScript・画像などをAndroid WebView用プロジェクトにまとめ、Android Studioで開けるZIPを生成します。画像1枚から各解像度のアプリアイコンも作成できます。ZIP生成用ライブラリを外部から読み込むため、利用時にはインターネット接続が必要です。 |
| [index4.html](https://uni928.github.io/Uni928PublicHTMLs2/index4.html) | 検索欄とショートカットをまとめたシンプルなホーム画面です。ショートカットやフォルダの追加・編集・削除・並べ替え、フォルダ内検索、JSONやお気に入りHTMLのインポート・エクスポートに対応しています。登録内容はIndexedDBに保存します。 |
| [index5.html](https://uni928.github.io/Uni928PublicHTMLs2/index5.html) | 行数・列数、列ごとの揃え方、文章、表のデザインを順番に指定して表を作成します。再開情報を埋め込んだPNGと、表の内容を保存するMarkdownをダウンロードできます。 |
| [index6.html](https://uni928.github.io/Uni928PublicHTMLs2/index6.html) | ブラウザから保存したChatGPTの会話HTMLを読み込み、サイドバーや操作UIを除いた読みやすい会話ページへ変換します。見出し・リスト・コード・表などを整え、ChatGPTの発言を閉じた状態で出力することもできます。 |
| [index6English.html](https://uni928.github.io/Uni928PublicHTMLs2/index6English.html) | [index6.html](https://uni928.github.io/Uni928PublicHTMLs2/index6.html)の英語版です。保存した会話HTMLを読み込み、英語UIで会話アーカイブを生成します。 |
| [index7.html](https://uni928.github.io/Uni928PublicHTMLs2/index7.html) | HTML本文の意味のある空白をできるだけ保持しながら、コメント削除やCSS・JavaScriptの整理を行う整理専用ツールです。複数ファイルのドラッグ＆ドロップと、整理後の自動ダウンロードに対応しています。 |
| [index8.html](https://uni928.github.io/Uni928PublicHTMLs2/index8.html) | ファイル名に `packed` を含む自己解凍HTMLを読み込み、Base64圧縮データを通常のHTMLへ復元します。通常HTMLはそのまま読み込め、復元後または通常HTMLを人間が読みやすい形に整形することもできます。 |
| [one_night_werewolf_password_memory_fixed.html](https://uni928.github.io/Uni928PublicHTMLs2/one_night_werewolf_password_memory_fixed.html) | 端末を回して遊ぶ方式と共有URL方式に対応した、ワンナイト人狼ゲームです。プレイヤー名・戦績・端末内のパスワード記憶、役職の能力処理、議論・投票・結果表示、共有URLの発行に対応しています。 |

## JavaScriptプラグイン：RandomCircleReveal

画面全体またはスクロールで表示領域に入ったパネルを、ランダムな円形の演出で表示するJavaScriptプラグインです。

### デモ

| ファイル | 紹介 |
| --- | --- |
| [demo.html](https://uni928.github.io/Uni928PublicHTMLs2/Plugin/HtmlPanelEffect/Circle/demo.html) | `IntersectionObserver`によるスクロール連動、複数の円形演出、手動再生を確認できます。 |
| [demo2.html](https://uni928.github.io/Uni928PublicHTMLs2/Plugin/HtmlPanelEffect/Circle/demo2.html) | API料金シミュレーターに全画面版の円形演出を適用したサンプルです。 |
| [demo2B.html](https://uni928.github.io/Uni928PublicHTMLs2/Plugin/HtmlPanelEffect/Circle/demo2B.html) | 全画面版の別バリエーションを確認できます。 |
| [demo3.html](https://uni928.github.io/Uni928PublicHTMLs2/Plugin/HtmlPanelEffect/Circle/demo3.html) | 全画面版の別バリエーションを確認できます。 |
| [demo4.html](https://uni928.github.io/Uni928PublicHTMLs2/Plugin/HtmlPanelEffect/Circle/demo4.html) | 全画面表示演出のサンプルです。 |
| [demo5.html](https://uni928.github.io/Uni928PublicHTMLs2/Plugin/HtmlPanelEffect/Circle/demo5.html) | 全画面表示演出の別バリエーションです。 |
| [demo6.html](https://uni928.github.io/Uni928PublicHTMLs2/Plugin/HtmlPanelEffect/Circle/demo6.html) | 全画面表示演出の別バリエーションです。 |

### JavaScriptファイル

| ファイル | 紹介 |
| --- | --- |
| [random-circle-reveal.js](https://uni928.github.io/Uni928PublicHTMLs2/Plugin/HtmlPanelEffect/Circle/random-circle-reveal.js) | `rcr-panel`を付けたパネルを、スクロールで表示領域に入ったときに円形演出で表示します。`RandomCircleReveal.play()`による手動再生にも対応しています。 |
| [random-circle-reveal2.js](https://uni928.github.io/Uni928PublicHTMLs2/Plugin/HtmlPanelEffect/Circle/random-circle-reveal2.js) | 画面全体版のバリエーションです。 |
| [random-circle-reveal3.js](https://uni928.github.io/Uni928PublicHTMLs2/Plugin/HtmlPanelEffect/Circle/random-circle-reveal3.js) | 画面全体版のバリエーションです。 |
| [random-circle-reveal4.js](https://uni928.github.io/Uni928PublicHTMLs2/Plugin/HtmlPanelEffect/Circle/random-circle-reveal4.js) | 画面全体を早い段階で覆う処理を含むバリエーションです。 |
| [random-circle-reveal5.js](https://uni928.github.io/Uni928PublicHTMLs2/Plugin/HtmlPanelEffect/Circle/random-circle-reveal5.js) | 画面全体版のバリエーションです。 |
| [random-circle-reveal6.js](https://uni928.github.io/Uni928PublicHTMLs2/Plugin/HtmlPanelEffect/Circle/random-circle-reveal6.js) | 画面全体版のバリエーションです。 |

### 基本的な使い方

```html
<script src="https://uni928.github.io/Uni928PublicHTMLs2/Plugin/HtmlPanelEffect/Circle/random-circle-reveal.js"></script>

<section class="rcr-panel">
  パネルの内容
</section>
```

自動再生を無効にして手動再生する場合は、`data-rcr-trigger="manual"`を付けてから、次のように呼び出します。

```html
<section id="panel" class="rcr-panel" data-rcr-trigger="manual">
  パネルの内容
</section>

<script>
  RandomCircleReveal.play(document.getElementById('panel'));
</script>
```

詳しい説明は、[Plugin/HtmlPanelEffect/Circle/README](https://github.com/uni928/Uni928PublicHTMLs2/blob/main/Plugin/HtmlPanelEffect/Circle/README)を確認してください。

## 利用上の注意

- ブラウザの対応状況によって、一部の圧縮・復元・ファイル保存機能が利用できない場合があります。
- HTMLの整理・圧縮は機械的な処理です。使用後は必ず表示と動作を確認してください。
- IndexedDBに保存したデータは、ブラウザのサイトデータ削除や環境変更によって失われる場合があります。
- ワンナイト人狼の共有URLにはゲーム情報が含まれます。URLは暗号化された秘密情報ではないため、共有範囲に注意してください。

## ライセンス・生成物の扱い

- [LICENSE](https://github.com/uni928/Uni928PublicHTMLs2/blob/main/LICENSE)：MIT License
- [OUTPUT-RIGHTS.md](https://github.com/uni928/Uni928PublicHTMLs2/blob/main/OUTPUT-RIGHTS.md)：本リポジトリのツールで生成した成果物の扱いに関する補足説明
