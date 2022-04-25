let identifier = window.localStorage.getItem('identifier') || null;

let canvas = document.createElement('canvas');
canvas.id = "canvas1";
canvas.width = 1200;
canvas.height = 800;
canvas.style = "position: absolute; left: 0; top: 0; z-index: 0;";

let divContainer = document.createElement('div');
divContainer.id = 'divContainer';

divContainer.appendChild(canvas);

document.addEventListener('DOMContentLoaded', function(){ 
	document.body.appendChild(divContainer);
}, false);

const webWorker = new Worker('clientWorker.js');
const workerCanvas = canvas.transferControlToOffscreen();
webWorker.onmessage = function(e){
	switch (e.data.msg) {
		case 'init':
			identifier = e.data.identifier;
			window.localStorage.setItem('identifier', identifier);
		break
	  }
};

webWorker.postMessage(
{
  msg: 'init',
  canvas: workerCanvas,
  identifier: identifier
},
[workerCanvas]
);

function getCursorPosition(canvas, event) {
    let rect = canvas.getBoundingClientRect();
    webWorker.postMessage(
        {
          msg: 'user',
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        }
        );
}

canvas.addEventListener('mousedown', function(e) {
    getCursorPosition(canvas, e)
});
