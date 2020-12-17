const fs = require('fs');
const path = require('path');
const url = require('url');
const Swarm = require('discovery-swarm');
const defaults = require('dat-swarm-defaults');
const tcpscan = require('simple-tcpscan');
//const Websocket = require('ws');
const localIp = require('ip');
const publicIp = require('public-ip');
//const MESSAGE_TYPES = require('./mtypes');

class Peer{
  constructor(config){

    this.config = config;
    this.filepath = path.join(this.config.getHomeDir(),".peers");
    this.DISCOVERY_PORT = process.env.DISCOVERY_PORT || this.config.get("DISCOVERY_PORT");
    this.NETWORK_KEY = process.env.NETWORK_KEY || this.config.get("NETWORK_KEY");
    this.P2P_PORT = process.env.P2P_PORT || this.config.get("P2P_PORT");
    this.peers = {};
    this.sockets = {};
    this.publicip = null;
    this.nodeid = null;
    /*
    this.unknown_peers = [];
    //this._load();
    var env_peers = process.env.PEERS ? process.env.PEERS.split(',') : [];
    for(var i in env_peers){
        var peer_url; 
        var peer_id;
        if(env_peers[i].indexOf("@") > -1){
          peer_url = env_peers[i].split("@")[0];
          peer_id = env_peers[i].split("@")[1];
        }else{
          peer_url = env_peer[i];
          peer_id = "";
        }
        var u = url.parse(peer_url,true);
        var p = {hostname:u.hostname, port:u.port, status:-1, id:peer_id, failed:0};
        this.unknown_peers.push(p);
    }*/
    
    //this.checkinterval = setInterval(this._checkPeers,1000*60*10);
    //this._checkPeers();
  }

  setConfig(config){
    this.config = config;
  }
/*
  _load(){
    if(fs.existsSync(this.filepath)){
      var speers = fs.readFileSync(this.filepath,'utf8');
      this.peers =  JSON.parse(speers);
    }
  }
  */
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
/*
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
*/
  listen(){
    var parent = this;
    publicIp.v4()
    .then(ip => {
      parent.publicip = ip;
      console.log('[' + (new Date()).toLocaleString()+'] public ip is ' + parent.publicip);
      var nodeidfile = path.join(parent.config.getHomeDir(),".nodeid");
      if(fs.existsSync(nodeidfile)){
        parent.nodeid = fs.readFileSync(nodeidfile,'utf8');
      }else{
        parent.nodeid = parent.publicip + ":" + parent.P2P_PORT + "@" + parent.nodeid;
        fs.writeFileSync(nodeidfile,parent.nodeid,'utf8');
      }
      parent.nodeid = parent.nodeid.trim();
      parent.discovery_config = defaults({
        id:parent.nodeid,
        maxConnections:50,
        //whitelist:this.getPeerIps(),
        keepExistingConnections: false 
      });
      parent.sw = Swarm(parent.discovery_config);
      console.log('[' + (new Date()).toLocaleString()+'] start node ' + parent.nodeid);
      parent.sw.listen(parent.DISCOVERY_PORT);
      console.log('[' + (new Date()).toLocaleString()+'] peer Listening to discovery port : ' + parent.DISCOVERY_PORT);
      parent.sw.join(parent.NETWORK_KEY);
      console.log('[' + (new Date()).toLocaleString()+'] peer Join network : ' + parent.NETWORK_KEY);
      parent.sw.on("connection",function(conn, info){
        var host = info.host;
        var id = info.id.toString();
        if(parent.nodeid == id) return;
        console.log('[' + (new Date()).toLocaleString()+ '] peer Connected peer from '+ id + '(' + host + ')');
        parent.setPeer({"id":id,"host":host,"port":info.port,"type":info.type},true);
        /*
        var port = parent.P2P_PORT;
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
        );*/
      });
      parent.sw.on('connection-closed',function(conn, info){
        if(info.initiator == false || info.channel == null || (info.channel.toString() != parent.NETWORK_KEY)) return;
        publicIp.v4()
        .then(ip => {
            //console.log('[' + (new Date()).toLocaleString()+'] peer closed ip : ' + ip);
            if(info.host.indexOf(ip) > -1 && parent.DISCOVERY_PORT == info.port) return;
            if (info.id != null && parent.peers[info.id.toString()]){
              //delete parent.peers[info.id.toString()];
              //console.log('[' + (new Date()).toLocaleString()+'] peer Closed : ' + JSON.stringify(info));
              console.log('[' + (new Date()).toLocaleString()+'] peer Closed discovery peer from ' + info.host);
            }
        });
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
  
  getUrls(){
    var urls = [];
    for(var id in this.peers){
        urls.push(this._geturl(peers[id]));
    }
    return urls;
  }

  getPeers(){
    return this.peers;
  }

  getStatus(){
    return {"connecting":this.sw.connecting,"queued":this.sw.queued,"connected":this.sw.connected,"peer_count":this.peers.length}
  }

  /*
  sockets(){
    return this.sockets;
  }*/

}

module.exports = Peer;