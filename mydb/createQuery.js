const db = require('./mysql');

function getMultiple(queryString) {
    return new Promise(function(resolve,reject){
        db.query(queryString,function(data,response){
            console.log("first");
            if(data){
                resolve(response);
            }else{
                reject(response);
            }
        })

    });
}

module.exports = {
    getMultiple
}