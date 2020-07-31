'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const uniqid = require('uniqid');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const Blockchain = require('../blockchain');
const P2pServer = require('../p2p/server');
const P2pClient = require('../p2p/client');
const Peers = require('../p2p/peer');
const Wallet = require('../wallet');
const TransactionPool = require('../wallet/transaction-pool');
const Miner = require('./miner');
const Config = require('./config');

const optionDefinitions = [
  {
    name: 'verbose',
    alias: 'v',
    type: Boolean
  },
  {
    name: 'home_dir',
    alias: 'd',
    type: String,
    description: 'path of directory for config and data.'
  },
  {
    name: 'network',
    alias: 'n',
    type: Number,
    defautValue:0,
    description: '0:mainnet 1:testnet 2:sidenet'
  },
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'show help'
  }
];

const sections = [
  {
    header: 'ohenro blockchain node',
    content: 'this is node app for ohenro blockchain'
  },
  {
    header: 'Options',
    optionList: optionDefinitions
  }
];
const options = commandLineArgs(optionDefinitions);
if(options.help) {
  const usage = commandLineUsage(sections);
  console.log(usage);
  process.exit(0);
}



const app = express();
const nodeidpath = path.join(chaindir,".nodeid");
if(!fs.existsSync(nodeidpath)){
  var nodeid = uniqid();
  fs.writeFileSync(nodeidpath,nodeid,'utf8');
  console.log("this node is first executing or not exist node id. new node id is " + nodeid);
}

var config = new Config(chaindir);
const HTTP_PORT = process.env.HTTP_PORT || config.get("HTTP_PORT");
const bc = new Blockchain(config);
const wallet = new Wallet(config);
const tp = new TransactionPool(config);
var peers = new Peers(config);
const p2pServer = new P2pServer(bc, tp, peers, config);
//const p2pClient = new P2pClient(bc, tp, peers, config);
const miner = new Miner(bc, tp, wallet, p2pServer, config);

app.use(bodyParser.json());

app.get('/blocks', (req, res, next) => {
  return res.json(bc.chain);
});

app.post('/mine', (req, res) => {
  const block = bc.addBlock(req.body.data);
  console.log(`New block added: ${block.toString()}`);

  p2pServer.syncChains();
  return res.redirect('blocks');
});

app.get('/transaction', (req, res) => {
  return res.json(tp.transactions);
});

app.post('/transact', (req, res) => {
  const { recipient, amount, extra } = req.body;
  const transaction = wallet.createTransaction(recipient, amount, bc, tp, extra);
  p2pServer.broadcastTransaction(transaction);
  return res.redirect('/transaction');
});

app.get('/mine-transactions', (req, res) => {
  const block = miner.mine();
  console.log(`new Block added: ${block.toString()}`);
  res.redirect('/blocks');
});

app.get('/public-key', (req, res) => {
  return res.json({ publicKey: wallet.publicKey });
});

app.listen(HTTP_PORT, () => console.log(`Listening on port ${HTTP_PORT}`));
peers.listen();
//p2pServer.listen();
//p2pClient.listen();
