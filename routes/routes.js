var express = require('express');
var router = express.Router();
const getDataFromDb = require('../mydb/createQuery');
var multer = require("multer");
const upload = multer({ dest: 'uploads/' });
const bcrypt = require('bcrypt');
const saltRounds = 10;

var checkValidation = {
    validateName : function(str){
        let re = /[A-Za-z ]{2,}$/g
        return str.match(re);
    },
    validateAddress : function(str){
       let re = /.{8,}/g
       return str.match(re);

    },
    validateEmail : function(str){
        let re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/g
        return str.match(re)
    },
    validatePhone : function(str){
        let re = /\d{10}/g;
        return str.match(re);
    },
    validatePassword : function(str){
        let re =  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z0-9!@#\$%\^\&*\)\(+=._-]{8,15}$/g
        return str.match(re);
    }
}
// router.use('middlewareFunction(req,res,next)')

// define the home page route
router.get('/', (req, res,next) => {
    res.send('home page');
})



  // define the about route
router.post('/register',upload.single("profile"),checkBodyParams,saveInDatabase);
router.get('/getDetail/:h_id',getResult);


function getResult(req,res,next){
    if(req.params && req.params.h_id){
        let query = `select name,address,hospital_name,ps.psychiatrist_id,ps.psychiatrist_name from psychiatrists ps left join hospitals h on ps.hospital_id=h.hospital_id right join patient_register pr on pr.psychiatrist_id=ps.psychiatrist_id where h.hospital_id=${req.params.h_id};`
        getDataFromDb.getMultiple(query)
        .then(function(data){
            var ndata = fetchData(data)
            res.json(ndata)
        }).catch(function(err){
            console.log(err);
            res.send("Something went wrong")
        })
    }else{
        res.send({"message":"Something went wrong"})
    }
}

function fetchData(obj){
    if(obj && obj.length){
        let hospital_name = obj[0].hospital_name;
        let all_psychiatrists = obj.map(function(item){return ({"id":item.psychiatrist_id,"name":item.psychiatrist_name})});
        let unique_psychiatrist = [...new Set(all_psychiatrists.map(item => item.id))];
        let arrayUniqueByKey = [...new Map(all_psychiatrists.map(item =>
            [item['id'], item])).values()
        ];
          
        return ([{
            "hospital_name": hospital_name,
            "total_patients":obj.length,
            "total_psychiatrist": unique_psychiatrist.length,
            "psychiatrist_details": arrayUniqueByKey

        }])
    }else{  
        return "no data found"
    }
}

function checkBodyParams(req,res,next){
    if(Object.keys(req.body).length){
        if(!req.file){
            res.json({"message":"Please upload your profile image"});
            res.end();
            return;
        }
        let checkParams = validateParams(req.body);
        if(checkParams.failed){
            res.json({
                "message":checkParams.message
            });
            res.end();
        }else{
            bcrypt.hash(req.body.password, saltRounds, function(err, result) {
                if(!err){
                    req.body.password = result;
                    next();
                }else{
                    res.json({"message":"Something went wrong while saving password."});
                    res.end();
                }
            });

        }
    }else{
        res.json({"message":"No parameters in the body"});
        res.end();
    }
}


function saveInDatabase(req,res,next){
    var profileImage = req.file ? req.file.filename+'@'+new Date().toISOString(): null;
    getDataFromDb.getMultiple(`insert into patient_register (name,address,email,phone,password,photo_id,psychiatrist_id) values ('${req.body.name}','${req.body.address}','${req.body.email}','${req.body.phone_no}','${req.body.password}','${profileImage}','${req.body.psychiatrist_id}');`)
    .then(function(data){
        res.send("Data saved successfully.");
    }).catch(function(err){
        if(err.code=="ER_DUP_ENTRY"){
            res.json({"message":`User with this ${err.sqlMessage.split(" ")[err.sqlMessage.split(" ").length - 1]} already exists.`});
        }else if(err.code=="ER_NO_SUCH_TABLE"){
            getDataFromDb.getMultiple(`create table IF NOT EXISTS patient_register(
                patient_id int unsigned not null auto_increment,
                name varchar(255) not null,
                address varchar(500) not null,
                email varchar(255) not null,
                phone varchar(50) not null,
                password varchar(100) not null,
                photo_id varchar(200) default null,
                created_at timestamp default current_timestamp,
                psychiatrist_id int unsigned not null,
                primary key (patient_id),
                unique (email, phone),
                foreign key (psychiatrist_id) references psychiatrists (psychiatrist_id));
            `)
            .then(function(data){
                saveInDatabase(req,res,next);
            }).catch(function(err){
                console.log({"error":err});
                res.json({"message":`Something went wrong.`});
            })
        }else if(err.errno=="1049"){
            res.json({"message":`No database exists with this name provided for database connection. Please create if it not exists.`});
        }else{
            res.json({"message":`Something went wrong.`});
        }
    })
    
}

function validateParams(obj){
    let n_obj = {
        "failed":false,
        "message":[]
    }

    // send trimmed parameters
    if(!obj.name){
        n_obj.failed = true;
        n_obj.message.push("Please provide your name")
    }else if(obj.name){
        let valid = checkValidation.validateName(obj.name.trim())
        if(!valid){
            n_obj.failed = true;
            n_obj.message.push("Please provide correct name")
        }
    }

    if(!obj.psychiatrist_id){
        n_obj.failed = true;
        n_obj.message.push("Please provide psychiatrist id");
    }else if(obj.psychiatrist_id){
        let valid = isNaN(obj.psychiatrist_id.trim());
        if(valid){
            n_obj.failed = true;
            n_obj.message.push("Please provide correct psychiatrist id");
        }
    }

    if(!obj.address){
        n_obj.failed = true;
        n_obj.message.push("Please provide your address")
    }else if(obj.address){
        let valid = checkValidation.validateAddress(obj.address.trim())
        if(!valid){
            n_obj.failed = true;
            n_obj.message.push("Please provide correct address")
        }
    }

    if(!obj.email){
        n_obj.failed = true;
        n_obj.message.push("Please provide your email")
    }else if(obj.email){
        let valid = checkValidation.validateEmail(obj.email.trim())
        if(!valid){
            n_obj.failed = true;
            n_obj.message.push("Please provide correct email");
        }
    }

    if(!obj.phone_no){
        n_obj.failed = true;
        n_obj.message.push("Please provide your mobile number");
    }else if(obj.phone_no){
        let valid = checkValidation.validatePhone(obj.phone_no.trim())
        if(!valid){
            n_obj.failed = true;
            n_obj.message.push("Please provide correct mobile number");
        }
    }

    if(!obj.password){
        n_obj.failed = true;
        n_obj.message.push("Please provide your password")
    }else if(obj.password){
        let valid = checkValidation.validatePassword(obj.password.trim());
        if(!valid){
            n_obj.failed = true;
            n_obj.message.push("Please provide correct password");
        }
    }

    return n_obj;
}


module.exports = router;