let identifier;

const webSocket = new WebSocket("ws://devprototypes.nl:8080");
webSocket.binaryType = 'arraybuffer';
let context = null;
let width;
let height;
let icon;

self.onmessage = function(e) {
	switch (e.data.msg) {
	  case 'init':
		  if(!context){
              context = e.data.canvas.getContext('2d');
              icon = context.createImageData(5, 5);
              let data = icon.data;
              for (let i = 0; i < data.length; i++) {
                loc = i*4;
                data[loc+3] = 255;
              }
			  width = e.data.canvas.width;
			  height = e.data.canvas.height;
		  }
		  identifier = e.data.identifier;
		  init();
        break
        case 'user':
			let msg = {
				type: "user",
				id:   identifier,
				x: e.data.x,
				y: e.data.y
				};
			webSocket.send(JSON.stringify(msg)); 
        break
	}
  }

function init(){
	webSocket.onopen = function (event) {
		let msg = {
			type: "init",
			id:   identifier
		  };
		webSocket.send(JSON.stringify(msg)); 
	};
}

function updateIdentifier(id){
	identifier = id;
	self.postMessage(
		{
		  msg: 'init',
		  identifier: id
		});
}

function createImage(data){
	let len = data.length;
	let x,y;
    context.clearRect(0, 0, width, height);
	for (let i = 0; i < len; i+=3) {
		x = data[i+1];
		y = data[i+2];
        context.putImageData(icon, x, y);
	}
}

webSocket.onmessage = function (event) {
	if(typeof(event.data) === 'string'){
		let msg = JSON.parse(event.data);
		switch(msg.type) {
			case "init":
				updateIdentifier(msg.id);
				break;
		}
	}else if(event.data instanceof ArrayBuffer){
        let data = new Uint16Array(event.data);
        createImage(data);
	}
};
