const eth=require('skypetwrapper');
const restify = require('restify');
const fs=require('fs');
const path=require('path');
const MongoClient = require('mongodb').MongoClient;

// Connection URL
const url = 'mongodb://localhost:27017/myproject';


const addAttribute=eth.addAttribute;
const getAttributes=eth.getAttributes;
//const createAccount=eth.createAccount;
//const checkPassword=eth.checkPassword;
//const getContract=eth.getContract;
//const setWeb3Provider=eth.setWeb3Provider;

const collection='api_accounts'
const getCost=eth.getCost;
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
            return console.log(err);
        }
        console.log("Connected successfully to server");
        const dbCol=db.collection(collection);
        dbCol.find({_id:api_key}).toArray((err, result)=>{
            db.close();
            cb(err, result);
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
            console.log(result);
            dbCol.insert({_id:api_key, account:result}, (err)=>{
                db.close();
                cb(err, result);
            });
        });
    })
}

eth.setWeb3Provider(webprovider.providerAddress, webprovider.providerPort);
const contract=eth.getContract();
if(process.env.DEVELOPMENT){
    const myTempKey="10101";
    MongoClient.connect(url, (err, db)=>{
        if(err){
            return console.log(err);
        }
        console.log("Connected successfully to server");
        const dbCol=db.collection(collection);
        dbCol.drop();//restart
        //console.log(result);
        eth.getAccounts((err, account)=>{
            dbCol.insert({_id:myTempKey, account:account}, (err)=>{
                db.close();
                cb(err, result);
            });
        })
    });
}



const respond=(req, res, next)=>{
  res.send('hello ' + req.params.name);
  next();
}
let server = restify.createServer();
server.use(restify.bodyParser({ mapParams: true }));
//curl -X POST -H "Content-Type: application/json" -d '{"api_key":123, "pswd":"wassup"}' http://localhost:8080/account/create
server.post('/account/create', (req, res, next)=>{
    createAccount(req.params.api_key, req.params.pswd, (err, success)=>{
        err?res.send("Account already exists!"):res.send(success);
    });
});
server.get('/account/:api_key', (req, res, next)=>{
    getAccountFromMongo(req.params.api_key, (err, result)=>{
        if(err){
            return console.log(err);
        }
        result.length===0?res.send("No accounts!"):res.send(result[0]);
    })
});
//server.head('/hello/:name', respond);
server.get('/account/balance/:api_key', (req, res, next)=>{
    getAccountFromMongo(req.params.api_key, (err, result)=>{
        if(err){
            return console.log(err);
        }
        result.length===0?res.send("No accounts!"):eth.getMoneyInAccount(result[0], (err, res)=>{
            return res.send(res);
        });
    })
});

server.get('/attributes/:api_key', (req, res, next)=>{
    getAccountFromMongo(req.params.api_key, (err, result)=>{
        if(err){
            return console.log(err);
        }
        result.length===0?res.send("No accounts!"):eth.getAttributes(contract, req.params.hashId, (err, res)=>{
            return res.send(res);
        });
    })
});

server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});