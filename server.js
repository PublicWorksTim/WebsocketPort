'use strict';

import { readFile } from 'fs';
import { createServer } from 'http';
import { parse } from 'url';
import { v1 as uuidv1 } from 'uuid';
import { WebSocketServer } from 'ws';
import { Worker } from 'worker_threads';

const wsServer = new WebSocketServer ({ port: 8080 });

const hostname = 'devprototypes.nl';
const port = 3000;

let client = null;
let clientWorker = null;

const requestListener = function (req, res) {
	let pathname = parse(req.url).pathname;
	if(pathname == "/client.js"){
		res.setHeader('Content-Type', 'application/javascript');
		res.statusCode = 200;
		res.end(client);
	}else if(pathname == "/clientWorker.js"){
		res.setHeader('Content-Type', 'application/javascript');
		res.statusCode = 200;
		res.end(clientWorker);
	}else{
		res.statusCode = 200;
		res.setHeader('Content-Type', 'text/html');
		res.end('<script type=\'text/javascript\' src=\'client.js\'></script><body></body>');
	}
};

const server = createServer(requestListener);
const messageWorker = new Worker('./messageWorker.js');

readFile('client/client.js', (err, data) => {
	if (err) console.log(err);
	client = data;
});

readFile('client/clientWorker.js', (err, data) => {
	if (err) console.log(err);
	clientWorker = data;
});

server.listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`);
});

let uuidCount = 1;
const uuids = [];
const wsCon = [];
const mainRelay = [];

wsServer.on('connection', function connection(ws, req) {
	ws.on('message', function incoming(event) {
		let msg = JSON.parse(event);
		if(msg.type == "init"){
			if(msg.id != null){
				connectClient(ws, msg.id);
			}else{
				connectClient(ws, null);
			}
		} else if(msg.type == "user"){
            messageWorker.postMessage(
                {
                    msg: 'user',
                    id: uuids[msg.id],
                    x: msg.x,
                    y: msg.y
                }
            );
        }else {
            let id = ws.id;
            if(msg.type == "temp"){

            }
        }
	});
});

function sendMessages(){
    wsCon.forEach(function(ws) {
        let id = ws.id;
        if(id != null && mainRelay[id] != null && mainRelay[id].length > 0 && Atomics.load(mainRelay[id], 0) == 1){
            ws.send(mainRelay[id].slice(2, mainRelay[id][1]));
            Atomics.store(mainRelay[id], 0, 0);
        }
    });
}

messageWorker.on('message', (message) => {
	switch (message.msg) {
		case 'sending':
            sendMessages();
		break
	}
});

function connectClient(ws, uuid){
	if(uuids[uuid] != null){
		refreshClient(ws, uuids[uuid], uuid);
		console.log('Existing client: ' + uuids[uuid] + ' ' + uuid);
	}else{
		addNewClient(ws);
	}
}

function addNewClient(ws){
    let uuid = createId();
    uuids[uuid] = uuidCount;
    let id = uuids[uuid];
    console.log('New client: ' + id + ' ' + uuid);
    uuidCount++;
    
    let mainArray = new SharedArrayBuffer(20000);
    mainRelay[id] = new Uint16Array(mainArray);
    mainRelay[id][0] = 0;
    
	messageWorker.postMessage(
		{
			msg: 'initArray',
            id: id,
            arr: mainArray
		}
    );
    
	refreshClient(ws, id, uuid);
	returnInit(ws, uuid);
}

function returnInit(ws, uuid){
	let returnMsg = {
		type: "init",
		id: uuid
	};
	ws.send(JSON.stringify(returnMsg));
}

function refreshClient(ws, id, uuid){
    ws.id = id;
    ws.uuid = uuid;
	wsCon[id] = ws;
}

function createId(){
	return uuidv1();
}

const sendLoop = setInterval(() => {
    sendMessages();
}, 100);