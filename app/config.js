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
    MINING_REWARD: 50,
    DIFFICULTY: 4,
    MINE_RATE: 3000,
    INITIAL_BALANCE: 500
};

const user_home = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"];
//if(options.home_dir) userHome = home_dir;


class Config{
    constructor(home_dir) {
        if(home_dir == undefined || home_dir == null){
            this.home_dir = path.join(user_home,".henrochain");
            if(!fs.existsSync(this.home_dir)){
                fs.mkdirSync(this.home_dir, {recursive: true});
            }
        }else{
            this.home_dir = home_dir;
        } 
        
        this.filepath = path.join(this.home_dir,"ohenro_config.json");
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