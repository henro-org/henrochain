var level = require("level");

var main = async() => {
    var db = level("testdb");

    var transaction = {id:"a123ewgt",input:{timestamp: Date.now(), amount:9, address:"kbcj212ieq",signature:""},output:[{amount:9,address:"kbcj212ieq"},{1,address:"12dfget"},{extra:""}]}
    
}