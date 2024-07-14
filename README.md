# 🏭 工場安全教育アプリ

## 📋 概要

このアプリケーションは、工場での安全教育を目的としたインタラクティブな学習ツールです。クイズ機能と安全マニュアルを通じて、従業員の安全意識と知識の向上を図ります。

## ✨ 主な機能

- 🧠 インタラクティブな安全クイズ
- 📚 包括的な安全マニュアル
- 🎨 直感的なユーザーインターフェース
- 📱 モバイルフレンドリーなデザイン

## 🛠️ 技術スタック

- ⚡ Vue.js 3
- 🚀 Vite
- 🔥 Firebase (Firestore, Storage)
- 🎭 Vant UI コンポーネントライブラリ

## 🚀 セットアップ

1. リポジトリをクローンします：
git clone <https://github.com/yourusername/factory-safety-app.git>
cd factory-safety-app

2. 依存関係をインストールします：

```
npm install
```

3. `.env.example` ファイルをコピーして `.env` ファイルを作成し、必要な環境変数を設定します：

```
cp .env.example .env
```

`.env` ファイルを編集し、Firebaseの設定情報を入力してください。

4. 開発サーバーを起動します：

```
npm run dev
```

## 🏗️ ビルドと展開

プロダクション用のビルドを作成するには：
npm run build
ビルドされたファイルは `dist` ディレクトリに生成されます。

## 🧪 テスト

ユニットテストを実行するには：

```
npm run test
```
