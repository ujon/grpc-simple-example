const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
// More info about options parameter 
// https://www.npmjs.com/package/@grpc/proto-loader
const packageDefinition = protoLoader.loadSync("proto/example.proto"); 
// 'com.ujon.grpcExample' is package name from proto file
const example = grpc.loadPackageDefinition(packageDefinition).com.ujon.grpcExample;
const fs = require('fs');
const PORT = 5001

const CHUNK_SIZE = 1024 // 1KB
const CHUNK_SIZE_MB = 1024 * 1024 // 1MB

// String => String
function stringToString(call, callback){
    // REQUEST
    let request = call.request;
    console.log('[request] StringToString');
    console.log(request);
    // RESPONSE
    let response = {
        str: `Echo from gRPC server: ${request.str}`
    }
    console.log('[response] StringToString');
    console.log(response);

    callback(null, response);
}
// String[] => String[]
function repeatedStringToRepeatedString(call, callback){
    // REQUEST
    let request = call.request;
    console.log('[request] RepeatedStringToRepeatedString');
    console.log(request);
    // RESPONSE
    let response = {
        str: request.str.reverse()
    }
    console.log('[response] RepeatedStringToRepeatedString');
    console.log(response);
    callback(null, response);
}
// String => Stream File
function stringToStreamFile(call){
    // REQUEST
    let request = call.request;
    console.log('[request] StringToStreamFile');
    console.log(request);
    // STREAM RESPONSE
    let stream = fs.createReadStream('asset/response.wav',{highWaterMark: CHUNK_SIZE});
    stream.on('data', (data)=>{
        console.log('[response] StringToStreamFile');
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
// Stream File => String
function streamFileToString(call, callback){
    const writeStream = fs.createWriteStream('./tmp/request.wav');
    // STREAM REQUEST
    call.on('data', (request)=>{
        console.log('[request] StreamFileToString');
        console.log(request);
        writeStream.write(request.bin);
    }); 
    call.on('end', ()=>{
        // RESPONSE
        let response = {
            str: 'grpc server got your data successfully'
        }
        console.log('[response] StreamFileToString');
        console.log(response)
        callback(null, response);
    });
}
// Stream File => Stream File
function streamFileToStreamFile(call){
    // STREAM REQUEST
    call.on('data', (request)=>{
        console.log('[request] StreamFileToStreamFile');
        console.log(request);
    });
    call.on('end',()=>{
        console.log('Request done');
    });
    // STREAM RESPONSE
    let stream = fs.createReadStream('asset/response.wav',{highWaterMark: CHUNK_SIZE_MB});
    stream.on('data', (data)=>{
        console.log('[response] StreamFileToStreamFile')
        console.log(data);
        call.write({bin:data});
    });
    stream.on('error', (err)=>{
        if(err) console.error(err);
    });
    stream.on('end', (err)=>{
        console.log('Response done');
        call.end();
    });
}

const server = new grpc.Server();
server.addService(example.Example.service, {
    stringToString: stringToString,
    repeatedStringToRepeatedString: repeatedStringToRepeatedString,
    stringToStreamFile: stringToStreamFile,
    streamFileToString: streamFileToString,
    streamFileToStreamFile: streamFileToStreamFile,
});

server.bind(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure());
console.log(`Server is running on ${PORT}`);
server.start();