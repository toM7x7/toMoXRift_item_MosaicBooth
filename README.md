# モザイクブース

XRift向けの配置型アイテムです。ワールド内に円筒状のブースを置くと、ブース越しに見えるアバターやオブジェクトがモザイク表示されます。

Marketplace表示:

- アイテム名: モザイクブース
- 説明: いつでもどこでもモザイクジェスチャークイズが出来ます！

## できること

- 配置した場所に固定される円筒型のモザイクブースを出せます。
- ブース越しに見える中の人や物が、第三者の画面でもモザイク化されます。
- アバター本体を改変せず、ブース表面の視覚効果として処理します。
- 追従、ユーザーバインド、操作UIはありません。

## 仕様メモ

このアイテムは、各クライアントのカメラ視点でシーンを一度オフスクリーンに描画し、その結果をブース表面のシェーダーでモザイク化します。

そのため「モザイク画像そのものをネットワーク同期する」仕組みではありません。見る人ごとに視点が違うため、各クライアントが自分の見え方に合わせてローカルでモザイクを計算します。結果として、第三者から見てもブース越しの対象はモザイク化されます。

XRift側でアバターや一部表現が通常のThree.jsシーンとは別レイヤーで描画される場合、その対象はFBOに入らずモザイク化されない可能性があります。

## 開発

```bash
npm install
npm run typecheck
npm run build
```

ローカルプレビュー:

```bash
npm run dev
```

プレビューではURLクエリで視点を切り替えられます。

- `?view=front`
- `?view=side`
- `?view=back`

## XRiftチェック

```bash
npx @xrift/cli@latest check item --build --json
```

アップロード:

```bash
npx @xrift/cli@latest whoami
npx @xrift/cli@latest upload item
```

## 主なファイル

- `src/Item.tsx`: アイテム本体とモザイクシェーダー
- `src/index.tsx`: XRift向けエクスポートと配置設定
- `src/dev.tsx`: ローカル確認用シーン
- `xrift.json`: XRift Marketplace向け設定
- `public/thumbnail.png`: アイテムサムネイル
- `public/item-metadata.json`: メタデータ変更時にcontent hashを更新するためのマーカー

## ライセンス

MIT License
