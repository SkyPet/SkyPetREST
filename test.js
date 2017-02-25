const http=require('http');
const fs=require('fs');
const path=require('path');
const url=require('url');
let webprovider;
try{
    webprovider=JSON.parse(fs.readFileSync(path.resolve("./", "parameters.json")))
}catch(e){
    throw new Error("parameters.json should exist and be valid json!");
}
const querystring = require('querystring');
//const standardOptions={hostname:'localhost', port:webprovider.port};
const myTempKey=webprovider.testkey;
const standardUrl=`http://localhost:${webprovider.port}`;
test("test get account", (done)=>{
    http.get(url.resolve(standardUrl, 'account')+'?'+querystring.stringify({api_key:myTempKey}), (response)=>{
        let body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            const result=JSON.parse(body);

            expect(result.length).toEqual("0xbc60dd7ca6dd3d2d7f231fbd6a0a41ceefd326cd".length);//.toEqual(myTempKey.toString());
            done();
        })
    });
})
test("test get account balance", (done)=>{
    http.get(url.resolve(standardUrl, 'account/balance')+'?'+querystring.stringify({api_key:myTempKey}), (response)=>{
        let body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            const result=JSON.parse(body);
            expect(parseFloat(result)).toEqual(100);
            done();
        })
    });
})
test("test add attribute", (done)=>{
    const obj={
        hostname:'localhost',
        port:webprovider.port,
        method:'POST',
        path:'/attributes/create',
        headers:{
            'Content-Type':'application/json'
        }
    }
    let req=http.request(obj, (response)=>{
        let body='';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            console.log(body);
            //const result=JSON.parse(body);
            
            done();
        });
    });
    req.write(JSON.stringify({api_key:myTempKey, pswd:"myPassword", hashId:"hashed", message:"Hello World"}));
    req.end();
})
