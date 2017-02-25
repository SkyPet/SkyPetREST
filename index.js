const eth=require('skypetwrapper');
const restify = require('restify');
const fs=require('fs');
const path=require('path');
const MongoClient = require('mongodb').MongoClient;

// Connection URL
const url = 'mongodb://localhost:27017/myproject';


const collection='api_accounts'
//const getCost=eth.getCost;
//const getMoneyInAccount=eth.getMoneyInAccount;
let webprovider;
try{
    webprovider=JSON.parse(fs.readFileSync(path.resolve("./", "parameters.json")))
}catch(e){
    throw new Error("parameters.json should exist and be valid json!");
}

const getAccountFromMongo=(api_key, cb)=>{
    // Use connect method to connect to the server
    MongoClient.connect(url, (err, db)=>{
        if(err){
            return cb(err, null);
        }
        console.log("Connected successfully to server");
        const dbCol=db.collection(collection);
        dbCol.find({"_id":api_key}).toArray((err, result)=>{
            db.close();
            return result.length===0?cb(new Error("No accounts!", null)):cb(null, result[0].account);
        });
    });
}

const createAccount=(api_key, pswd, cb)=>{
    eth.createAccount(pswd, (err, result)=>{
        err?cb(err, result):MongoClient.connect(url, (err, db)=>{
            if(err){
                return console.log(err);
            }
            console.log("Connected successfully to server");
            const dbCol=db.collection(collection);
            dbCol.insert({"_id":api_key, "account":result}, (err)=>{
                db.close();
                cb(err, result);
            });
        });
    })
}

eth.setWeb3Provider(webprovider.providerAddress, webprovider.providerPort);
const contract=eth.getContract();


if(process.env.NODE_ENV==='development'){
    const myTempKey=webprovider.testkey;
    MongoClient.connect(url, (err, db)=>{
        if(err){
            return console.log(err);
        }
        console.log("Connected successfully to server");
        const dbCol=db.collection(collection);
        dbCol.drop();//reset to scratch
        eth.getAccounts((err, account)=>{
            dbCol.insert({"_id":myTempKey.toString(), "account":account}, (err, r)=>{
                db.close();
                if(err){
                    console.log(err);
                }
            });
        })
    });
}



let server = restify.createServer();
server.use(restify.bodyParser({ mapParams: true }));
server.use(restify.queryParser());
//curl -X POST -H "Content-Type: application/json" -d '{"api_key":123, "pswd":"wassup"}' http://localhost:8080/account/create
server.post('/account/create', (req, res, next)=>{
    createAccount(req.params.api_key, req.params.pswd, (err, success)=>{
        err?res.send("Account already exists!"):res.send(success);
    });
});
server.get('/account', (req, res, next)=>{
    getAccountFromMongo(req.query.api_key, (err, result)=>{
        err?res.send(err):res.send(result);
    })
});
//server.head('/hello/:name', respond);
server.get('/account/balance', (req, res, next)=>{
    getAccountFromMongo(req.params.api_key, (err, result)=>{
        err?res.send(err):eth.getMoneyInAccount(result, (err, balance)=>{
            return res.send(balance);
        });
    })
});
server.post('/attributes/create', (req, res, next)=>{
    console.log(req.params);
    getAccountFromMongo(req.params.api_key.toString(), (err, result)=>{
        err?res.send(err):eth.addAttribute(req.params.pswd, req.params.message, req.params.hashId, contract, (err, attributes)=>{
            return res.send(attributes);
        });
    })
})
//addAttribute=(password, message, hashId, contract, cb)
server.get('/attributes', (req, res, next)=>{
    getAccountFromMongo(req.query.api_key, (err, result)=>{
        err?res.send(err):eth.getAttributes(contract, req.query.hashId, (err, res)=>{
            return res.send(res);
        });
    })
});

server.listen(webprovider.port, function() {
  console.log('%s listening at %s', server.name, server.url);
});