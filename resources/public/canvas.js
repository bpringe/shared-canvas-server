(function () {

  //// Websocket functions

  function onOpen(event) {
    console.log(`Websocket channel opened on ${event.target.url}`, event);
  }

  function onClose(event) {
    console.log('Websocket channel closed:', event);
  }

  function onMessage(event) {
    const message = JSON.parse(event.data);
    console.log('Received message:', message);
    if (message.constructor === Array) {
      message.forEach(drawEvent => {
        drawRectangle(canvasContext, drawEvent);
      });
    } else if (message.constructor === Object) {
      drawRectangle(canvasContext, message);
    }
  }

  function onError(event) {
    console.log('Error:', event);
  }

  const webSocketProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const websocket = new WebSocket(`${webSocketProtocol}//${window.location.host}/ws`);
  websocket.onopen = onOpen;
  websocket.onclose = onClose;
  websocket.onmessage = onMessage;
  websocket.onerror = onError;

  //// Get the canvas element and context

  const canvas = document.getElementById('canvas');
  const canvasContext = canvas.getContext('2d');

  //// State

  let mouseDown = false;
  let drawWidth = 10;
  let drawHeight = 10;
  let fillStyle = 'rgba(0, 0, 200, 0.5)';

  //// Initialize context

  canvasContext.fillStyle = fillStyle;

  //// Utility functions

  function getMousePosition(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function drawRectangle(ctx, drawEvent) {
    console.log('drawing rectangle');
    ctx.fillStyle = drawEvent.fillStyle;
    ctx.fillRect(drawEvent.x, drawEvent.y, drawEvent.width, drawEvent.height);
  }

  function createDrawEvent(mousePosition) {
    return {
      x: mousePosition.x - (drawWidth / 2),
      y: mousePosition.y - (drawHeight / 2),
      width: drawWidth,
      height: drawHeight,
      fillStyle
    };
  }

  //// Event listeners

  canvas.addEventListener('click', function (event) {
    const drawEvent = createDrawEvent(getMousePosition(canvas, event));
    drawRectangle(canvasContext, drawEvent);
    websocket.send(JSON.stringify(drawEvent));
  });

  canvas.addEventListener('mousedown', function (event) {
    mouseDown = true;
  });

  canvas.addEventListener('mouseup', function (event) {
    mouseDown = false;
  });

  canvas.addEventListener('mousemove', function (event) {
    if (mouseDown) {
      const drawEvent = createDrawEvent(getMousePosition(canvas, event));
      drawRectangle(canvasContext, drawEvent);
      websocket.send(JSON.stringify(drawEvent));
    }
  });
})();


