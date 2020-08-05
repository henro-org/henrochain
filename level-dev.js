var level = require("level");

var main = async() => {
    var db = level("testdb",{valueEncoding:"json"});

    var transaction = {id:"a123ewgt",meta:{timestamp: Date.now(),status:0,block:"",address:"kbcj212ieq",type:"",network:"",signature:""},info:{amount:9,from:"kbcj212ieq", to:"12dfget",fee:0.0001,extra:""}};

    await db.put('a123ewgt', transaction);

    var trans = await db.get('a123ewgt');
    console.log(trans.meta);
}
main();