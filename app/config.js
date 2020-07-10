'use strict'

const fs = require('fs');
const path = require('path');
const default_config = {
    HTTP_PORT : 3001,
    NETWORK_KEY : "ohenro-network",
    P2P_PORT : 3333,
    DISCOVERY_PORT : 3888,
    ENABLE_MINE : true,
    ENABLE_WALLET : true,
    CHECK_PEERS_INTERVAL: 60000,
    INITIAL_BALANCE: 500,
    MINIG_REWARD: 50
};

class Config{
    constructor(home_dir) {
        this.home_dir = home_dir;
        this.filepath = path.join(home_dir,"ohenro_config.json");
        if(fs.existsSync(this.filepath)){
            this.load();
        }else {
            this.config = default_config;
            this.save();
        }
    }

    getHomeDir(){
        return this.home_dir;
    }

    get(key){
      return this.config[key];  
    }

    getWithLoad(key){
        this.load();
        return this.config[key];
    }

    set(key, value){
        this.config[key] = value;
    }

    setWithSave(key, value){
        this.config[key] = value;
        this.save();
    }

    save(){
        fs.writeFileSync(this.filepath,JSON.stringify(this.config,undefined, '\t'),"utf8");
    }
    
    load(){
        var data = fs.readFileSync(this.filepath,"utf8");
        this.config = JSON.parse(data);
    }
}

module.exports = Config;