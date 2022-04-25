import { parentPort } from 'worker_threads';
console.log('worker spawned');

const user = [];
const users = [];
const messageRelay = [];

parentPort.onmessage = function(message) {
	let id = message.data.id;
	switch (message.data.msg) {
		case 'initArray':
            users.push(id);
            user[id] = [200,200];
			messageRelay[id] = new Uint16Array(message.data.arr);
        break
        case 'user':
            user[id][0] = message.data.x;
			user[id][1] = message.data.y;
			console.log('id: ' + id + ' x: ' + user[id][0] + ' y: ' + user[id][1]);
            loop();
        break
	}
}

var loopCount = 0;
function loop(){
    users.forEach(function(id) {
        let position = 2;
		if(Atomics.load(messageRelay[id], 0) == 0){
			messageRelay[id][position] = 0;
            user.forEach(function(data) {
                messageRelay[id][position++] = id; //id of actor
                messageRelay[id][position++] = data[0]; //x
                messageRelay[id][position++] = data[1]; //y
            });
            messageRelay[id][1] = position;
            Atomics.store(messageRelay[id], 0, 1);
        }
    });
    parentPort.postMessage(
        {
            msg: 'sending'
        }
    );
    loopCount++;
}
