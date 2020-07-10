'use strict';
//const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
//const Swarm = require('discovery-swarm');
//const defaults = require('dat-swarm-defaults');
const getPort = require('get-port');
//const tcpscan = require('simple-tcpscan');
//const url = require('url');

const server = require('socket.io')();
//const Websocket = require('ws');
//const peer = require('./peer');
const MESSAGE_TYPES = require('./mtypes');

class P2pServer {
  constructor(blockchain, transactionPool, peers, config) {
    this.config = config;
    this.peers = peers;
    this.P2P_PORT = process.env.P2P_PORT || this.config.get("P2P_PORT");
    this.NETWORK_KEY = process.env.NETWORK_KEY || this.config.get("NETWORK_KEY");
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    //this.sockets = [];
    this.homedir = this.config.getHomeDir();
    this.nodeidpath = path.join(this.homedir,".nodeid");
    this.nodeid = fs.readFileSync(this.nodeidpath,'utf8');
    if(!fs.existsSync(this.nodeidpath)){
      this.nodeid = uniqid();
      fs.writeFileSync(this.nodeidpath,this.nodeid,'utf8');
      console.log("this node is first executing or not exist node id. new node id is " + this.nodeid);
    }else{
      
      console.log("starting node. id is " + this.nodeid);
    }

    //this.peers = new peer(this.config);
  }

  listen() {
    
    //const server = new Websocket.Server({ port: P2P_PORT });
    server.listen(this.P2P_PORT);

    // Listen to events, new socket connected to the P2P Server
    server.sockets.on('connection', function connections(socket) {
      this.connectSocket(socket)
      //this.peers.addConnection(soket);
    });
    this.peers.listen();
    console.log(`Listening for peer-to-peer connections on: ${P2P_PORT}`);
    //setInterval(this.connectToPeers,this.config.get("CHECK_PEERS_INTERVAL"));
  }

  messageHandler(socket) {
    //triggered by a send function
    socket.on('message', message => {
      const data = JSON.parse(message);
      switch (data.type) {
        case MESSAGE_TYPES.id:
          //this._setStartPeer(data.peer, socket);
          break;
        case MESSAGE_TYPES.chain:
          this.blockchain.replaceChain(data.chain);
          break;

        case MESSAGE_TYPES.transaction:
          this.transactionPool.updateOrAddTransaction(data.transaction);
          break;

        case MESSAGE_TYPES.clearTransactions:
          this.transactionPool.clear();
          break;
      }
    })
  }

  //Saves new peers to sockets array, for every peer
  connectSocket(socket) {
    this.sockets.push(socket);
    console.log('Socket connected')

    this.messageHandler(socket)

    //For each new connected peer, all peers send their blockchains
    this.sendChain(socket);
  }

  sendChain(socket) {
    socket.send(JSON.stringify({
      type: MESSAGE_TYPES.chain,
      chain: this.blockchain.chain
    }));
  }

  syncChains() {
    this.sockets.forEach(socket => this.sendChain(socket));
  }

  sendTransaction(socket, transaction) {
    socket.send(JSON.stringify({
      type: MESSAGE_TYPES.transaction,
      transaction
    }));
  }

  broadcastTransaction(transaction) {
    this.sockets.forEach(socket => this.sendTransaction(socket, transaction));
  }

  broadcastClearTransactions() {
    this.sockets.forEach(
      socket => socket.send(JSON.stringify({
        type: MESSAGE_TYPES.clearTransactions
      }))
    );
  }

}

module.exports = P2pServer;
