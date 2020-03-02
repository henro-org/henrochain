# お遍路コインのブロックチェーン

お遍路コインのブロックチェーンは四国遍路の問題点を解決することで四国地域経済の活性化、お遍路道の世界遺産登録を目標とした様々な活動を支援するプラットフォームです。

### インストール

以下のコマンドでパッケージをダウンロード
```sh
git clone https://github.com/henro-org/ohenrochain.git
```

ディレクトリへ移動
```sh
cd henrochain
```

インストールする
```sh
npm install
```
### テストケースを全て実行する

```sh
npm run test
```

### アプリケーションを実行する

```sh
# Starting first peer
npm run dev

# Starting second peer
HTTP_PORT=3002 P2P_PORT=5002 PEERS=ws://localhost:5001 npm run dev

# Starting third peer
HTTP_PORT=3003 P2P_PORT=5003 PEERS=ws://localhost:5001,ws://localhost:5002 npm run dev
```

### docker-composeを利用してアプリを実行する

```sh
docker-compose -f docker-compose.yml up -d
```

### p2p通信の参考

今後追加予定のp2p通信に参考できるnode.jsのライブラリ集
* [awesome-peer-to-peer](https://github.com/kgryte/awesome-peer-to-peer)

### 開発ロードマップ

＜現状＞  
最も基本的なブロックチェーンの仕組みを実装している。  
他ノードは起動時に手動で設定、チェーンの同期化、トランザクション処理、
マイニング処理、講座残額計算  
  
＜2020年＞  
1Q：P2P通信の開発、プロトコル開発  
2Q：プロトコルの開発、コンセンサスアルゴリズム開発  
3Q：コンセンサスアルゴリズム開発  
4Q：ウォレット開発、テストネット開始  
<2021年>  
1Q〜2Q：スマートコントラクト開発、メインネット開始  
3Q〜4Q：サーブチェーン開発  
<2022年>  
1Q：サーブチェーン開発  
2Q〜：サードパーティツール開発  
