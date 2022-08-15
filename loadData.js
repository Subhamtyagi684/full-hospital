var queryFn = require('./mydb/mysql');
console.log("++++++++++++++++++++++ Initialising data insertion in DB +++++++++++++++++++++++++")
var hospital_file = require('./dumpConfig/hospital_data.json');
var psychiatrist_file = require('./dumpConfig/psychiatrist_data.json');


var queryString = {
    createHospital:`create table if not exists hospitals (
        hospital_id int unsigned not null auto_increment,
        hospital_name varchar(300) not null,
        primary key (hospital_id));
    `,
    insertHospital:`insert into hospitals (hospital_name) values ${createValuesFromJson(hospital_file,'h_name')};`,
    createPsychiatrists:`create table if not exists psychiatrists (
        psychiatrist_id int unsigned not null auto_increment,
        psychiatrist_name varchar(300) not null,
        hospital_id int unsigned not null,
        primary key (psychiatrist_id),
        foreign key (hospital_id) references hospitals (hospital_id));
    `,
    insertPsychiatrists:`insert into psychiatrists (psychiatrist_name,hospital_id) values ${createValuesFromJson(psychiatrist_file,'name','h_id')};`
}

function runQuery(query){
    return new Promise(function(resolve,reject){   
        queryFn.query(query,function(data,response){
            if(data){
                resolve(response);
            }else{
                reject(response);
            }
        })
    })
}


function createValuesFromJson(array,...args){
    if(args.length){
        let y = array.map((item1=>{
            return "("+args.map(function(item2){return ("'"+item1[item2]+"'")})+")"
        })).join();
        return y;
    }
}



runQuery(queryString.createHospital+queryString.insertHospital+queryString.createPsychiatrists+queryString.insertPsychiatrists)
.then(function(){
    console.log("Data inserted successfully, run 'npm run start' command to continue");
    process.exit();
})
.catch(function(err){
    if(err.errno == "1049"){
        console.log("Please create database with any name in your DB and add the name of the DB in the config file, then run the same command again");
    }else{
        console.log("Something went wrong");
    }   
    process.exit();
})