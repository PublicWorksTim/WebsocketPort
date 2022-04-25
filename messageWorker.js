import { parentPort, Worker } from 'worker_threads';
const dataWorker = new Worker('./dataWorker.js');

const users = [];
const clientRelay = [];
const dataRelay = [];
parentPort.onmessage = function(message) {
	let id = message.data.id;
	switch (message.data.msg) {
		case 'initArray':
			console.log('Client messages init');
			clientRelay[id] = new Uint16Array(message.data.arr);
			let dataArray = new SharedArrayBuffer(20000);
			dataRelay[id] = new Uint16Array(dataArray);
			dataRelay[id][0] = 0;
			dataWorker.postMessage(
				{
					msg: 'initArray',
					id: id,
					arr: dataArray
				}
			);
			users.push(id);
		break
		case 'user':
			dataWorker.postMessage(
				{
					msg: 'user',
					id: id,
					x: message.data.x,
					y: message.data.y
				}
			);
        break
	}
}
dataWorker.on('message', (message) => {
	switch (message.msg) {
		case 'sending':
            relayMessages();
		break
	}
  });

function relayMessages(){
    let actionDone = false;
	users.forEach(function(id) {
		if(Atomics.load(dataRelay[id], 0) == 1 && Atomics.load(clientRelay[id], 0) == 0){
			clientRelay[id].set(dataRelay[id]);
			Atomics.store(clientRelay[id], 0, 1);
            Atomics.store(dataRelay[id], 0, 0);
            actionDone = true;
		}
    });
    if(actionDone){
        parentPort.postMessage(
            {
              msg: 'sending'
            });
    }
}
