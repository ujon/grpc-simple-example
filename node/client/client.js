const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
// More info about options parameter 
// https://www.npmjs.com/package/@grpc/proto-loader
const packageDefinition = protoLoader.loadSync('proto/example.proto'); 
// 'com.ujon.grpcExample' is package name from proto file
const example = grpc.loadPackageDefinition(packageDefinition).com.ujon.grpcExample;

const exampleStub = new example.Example('127.0.0.1:5001', grpc.credentials.createInsecure());
const fs = require('fs');

const CHUNK_SIZE = 1024 // 1KB
const CHUNK_SIZE_MB = 1024 * 1024 // 1MB


// String => String
function testStringToString(){
    let request = {
        str: `LA LA LA LA`
    }
    console.log('[requset] StringToString');
    console.log(request);
    // REQUEST
    exampleStub.stringToString(request, (err, response)=>{
        if(err) console.error(err);
        // RESPONSE
        console.log('[response] StringToString');
        console.log(response);
    });
}
// String[] => String[]
function testRepeatedStringToRepeatedString(){
    let request = {
        str:[
            'A','B','C','D','E','F','G','G'
        ]
    }
    console.log('[requset] RepeatedStringToRepeatedString');
    console.log(request);
    // REQUEST
    exampleStub.repeatedStringToRepeatedString(request, (err, response)=>{
        if(err) console.error(err);
        // RESPONSE
        console.log('[response] RepeatedStringToRepeatedString');
        console.log(response);
    });
}
// String => Stream File
function testStringToStreamFile(){
    const writeStream = fs.createWriteStream('./tmp/response.wav');
    let request = {
        str: 'Whatever'
    };
    console.log('[request] StringToStreamFile');
    console.log(request);
    // REQUEST
    let call = exampleStub.stringToStreamFile(request);
    // STREAM RESPONSE
    call.on('data', (response)=>{
        console.log('[response] StringToStreamFile');
        console.log(response);
        // It's going to generate 'response.wav' file inside ./tmp folder
        writeStream.write(response.bin);
    });
    call.on('error', (err)=>{
        if(err) console.error(err);
    });
    call.on('end',()=>{
        console.log('Done');
    });
}
// Stream File => String
function testStreamFileToString(){
    let call = exampleStub.streamFileToString((err,response)=>{
        if(err) console.error(err);
        // RESPONSE
        console.log('[response] StreamFileToString');
        console.log(response);
    });
    // STREAM REQUEST
    let stream = fs.createReadStream('./asset/request.wav',{highWaterMark: CHUNK_SIZE});
    stream.on('data', (data)=>{
        console.log('[request] StreamFileToString');
        console.log(data);
        call.write({bin:data});
    });
    stream.on('error', (err)=>{
        if(err) console.error(err);
    });
    stream.on('end', (err)=>{
        console.log('Done');
        call.end();
    });
} 
// Stream File => Stream File
function testStreamFileToStreamFile(){
    let call = exampleStub.streamFileToStreamFile();
    // STREAM RESPONSE
    call.on('data', (response)=>{
        console.log('[response] StreamFileToStreamFile');
        console.log(response);
    });
    call.on('end', ()=>{
        console.log('Response done');
    });

    // STREAM REQUEST
    let stream = fs.createReadStream('./asset/request.wav',{highWaterMark: CHUNK_SIZE_MB});
    stream.on('data', (data)=>{
        console.log('[request] StreamFileToStreamFile');
        console.log(data);
        call.write({bin:data});
    });
    stream.on('error', (err)=>{
        if(err) console.error(err);
    });
    stream.on('end', (err)=>{
        console.log('Request done');
        call.end();
    });
}

// @TEST
// testStringToString();
// testRepeatedStringToRepeatedString();
// testStringToStreamFile();
// testStreamFileToString();
testStreamFileToStreamFile();