const fs = require('fs');
const path = require('path');
const url = require('url');
const Swarm = require('discovery-swarm');
const defaults = require('dat-swarm-defaults');
const tcpscan = require('simple-tcpscan');
//const Websocket = require('ws');
//const ip = require('ip');
const publicIp = require('public-ip');
//const MESSAGE_TYPES = require('./mtypes');

class Peer{
  constructor(config){

    this.config = config;
    this.filepath = path.join(this.config.getHomeDir(),".peers");
    this.DISCOVERY_PORT = process.env.DISCOVERY_PORT || this.config.get("DISCOVERY_PORT");
    this.peers = {};
    this.sockets = {};
    this.unknown_peers = [];
    this._load();
    var env_peers = process.env.PEERS ? process.env.PEERS.split(',') : [];
    for(var i in env_peers){
        var u = url.parse(env_peers[i],true);
        var p = {hostname:u.hostname, port:u.port, status:-1, id:"", failed:0};
        this.unknown_peers.push(p);
    }
    this.nodeid = fs.readFileSync(path.join(this.config.getHomeDir(),".nodeid"),'utf8');
    this.discovery_config = defaults({
        id:this.nodeid,
        maxConnections:50,
        //whitelist:this.getPeerIps(),
        keepExistingConnections: true 
    });
    this.sw = Swarm(this.discovery_config);
    this.checkinterval = setInterval(this._checkPeers,1000*60*10);
    this._checkPeers();
  }

  setConfig(config){
    this.config = config;
  }

  _load(){
    if(fs.existsSync(this.filepath)){
      var speers = fs.readFileSync(this.filepath,'utf8');
      this.peers =  JSON.parse(speers);
    }
  }
  _save(){
    fs.writeFileSync(this.filepath,JSON.stringify(this.peers,undefined,'\t'),'utf8');
  }

  _geturl(peer){
    return "ws://" + peer.hostname + ":" + peer.port;
  }

  /*
  _startPeer(peer){
    const socket = new Websocket(this._geturl(peer));
    this._messageHandler(socket);
    socket.on('open', () => {
      console.log('opened peer ' + peer.host);
    });
    socket.on('err',(err) =>{
      console.log('socket error ' + peer.host + '. ' + err);
      if(peer.id && peer.id !== ""){
        this.setFail();
      }
    });
    socket.on('close',(code, reason) => {
      console.log('closed peer ' + peer.host + '. (' + code + ' : ' + reason + ')');
      this._deleteSocket(socket);
    });
  }

  _deleteSocket(socket){
    for(var i in this.sockets){
        if(sockets[i] === socket){
            this.setStatus(this.sockets[i].id,-1,true);
            delete sockets[i];            
            return;
        }
    }
  }

  
  _messageHandler(socket) {
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

  _setStartPeer(peer,socket){
    peer.status = 0;
    peer.failed = 0;
    this.setPeer(peer,true);
    sockets[peer.id] = socket;
  }*/

  _checkPeers(){
    Object.keys(this.peers).forEach(function(key){
        var peer = this.peers[key];
        tcpscan.run({host:peer.hostname,port:peer.port}).then(
          () => {
            if(peer.status == -1){
              this.setStatus(peer.id, 0);
            }
          },
          ()=>{
            if(peer.failed >= 3) {
              delete this.peers[peer.id];
            }
            else this.setFail(peer);
          }
        );
    });
    var unknown_peers = this.unknown_peers;
    for(var i = 0; i < unknown_peers.length; i++){
        var peer = unknown_peers[i];
        tcpscan.run({host:peer.hostname,port:peer.port}).then(
          () => {
            if(peer.status == -1){
              peer.status = 0;
            }
          },
          ()=>{
            if(peer.failed >= 3) {
              unknown_peers.splice(i,1);
              i--;
            }
            else peer.failed++;
          }
        );
    }
    this._save();

  }

  listen(){
      var port = this.config.get("DISCOVERY_PORT");
      var networkkey = this.config.get("NETWORK_KEY");
      this.sw.listen(port);
      console.log('[' + (new Date()).toLocaleString()+'] peer Listening to discovery port : ' + port)
      this.sw.join(networkkey);
      console.log('[' + (new Date()).toLocaleString()+'] peer Join network : ' + networkkey);
      //var port = this.config.get("P2P_PORT");
      var parent = this;
      
      this.sw.on("connection",function(conn, info){
        var host = info.host;
        var id = info.id.toString();
        if(parent.nodeid == id) return;
        console.log('[' + (new Date()).toLocaleString()+ '] peer Connected peer from '+ id + '(' + host + ')');
        var port = parent.config.get("P2P_PORT");
        tcpscan.run({host:host,port:port}).then(
          () => {
            var p = {hostname:host, port:port, status:-1, id:id, failed:0};
            if(!parent.existPeer(p)){
              if(Object.keys(parent.peers).length < 50){
                p.status = 0;
                parent.setPeer(p, true);
                console.log('[' + (new Date()).toLocaleString()+"] peer Added peer " + id + "(" + host + ")");
              }else{
                console.log('[' + (new Date()).toLocaleString()+"] peer Peers is full. so skip this peer " + id + "(" + host + ")");
              }
            }else{
              console.log('[' + (new Date()).toLocaleString()+"] peer Aleady exist peer " + id + "(" + host +")");
            }
          },
          () => {
            console.log('[' + (new Date()).toLocaleString()+'] peer Peer ' + host + ' is no listen ' + port + ' port.');
            //parent.setPeer(p);
          }
        );
      });
      this.sw.on('connection-closed',function(conn, info){
        publicIp.v4().then(ip => {
          if(ip == info.host && ip.address() == info.host && parent.DISCOVERY_PORT == info.port) return;
          console.log('[' + (new Date()).toLocaleString()+'] peer Closed discovery peer from ' + info.host);
        });
      });
  }

  /*
  addConnection(socket){
    this._messageHandler(socket);
    socket.send(JSON.stringify({
      type: MESSAGE_TYPES.id,
      peer: {hosstname:ip.address(), port:this.config.get('P2P_PORT'), id:this.nodeid}
    }));
  }*/

  existPeer(peer){
    //var purl = "ws://" + peer.hostname + ":" + peer.port;
    if(this.peers[peer.id]) return true;
    else return false;
  }

  setPeers(peer_list, is_save=false){
    if(peer_list.length == 0) return;
    for(var i in peer_list){
        this.setPeer(peer_list[i]);
    }
    if(is_save) this._save();
  }

  setStatus(id, status, is_save=false){
    if(!this.peers[id]) return null;
    this.peers[id].status = status;
    if(is_save) this._save();
  }

  setPeer(peer, is_save = false){
    if(!peer.id || peer.id == ""){
      this.unknown_peers.push(peer);
    }
    this.peers[peer.id] = peer;
    if(is_save) this._save();
  }

  setFail(peer, is_save=false){
    this.peers[peer.id].failed++;
    this.peers[peer.id].status = -1;
    if(is_save) this._save();
  }

  getPeerInfo(id){
    return this.peers[id];
  }

  getPeerInfoByUrl(purl){
    var u = url.parse(purl,true);
    for(var id in this.peers){
        if(this.peers[id].hostname == u.hostname && this.peers[id].port == u.port){
            return this.peers[id];
        }
    }
    return null;
  }

  getPeerUrl(id){
    return this._geturl(this.peers[id]);
  }

  getPeerIps(){
    var ips = [];
    for(var id in this.peers){
    ips.push(this.peers[id].hostname);
    }
  }
  
  urls(){
    var urls = [];
    for(var id in this.peers){
        urls.push(this._geturl(peers[id]));
    }
    return urls;
  }

  peers(){
    return this.peers;
  }

  /*
  sockets(){
    return this.sockets;
  }*/

}

module.exports = Peer;