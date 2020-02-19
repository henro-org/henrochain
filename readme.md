# 遍路コインのブロックチェーン

### インストール

以下のコマンドでパッケージをダウンロード
```sh
git clone https://github.com/henro-org/henrochain.git
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
