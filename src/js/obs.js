

$(document).ready(() =>{
    appendMessage("Connecting... ");

    let socket = new WebSocket("ws://127.0.0.1:4444");

    socket.onopen = function(e) {
      appendMessage("[open] Connection established");
      appendMessage("Sending to server");
      socket.send('{"request-type": "GetAuthRequired", "message-id": "1"}');
    };
    
    socket.onmessage = function(event) {
      appendMessage(`[message] Data received from server: ${event.data}`);
    };
    
    socket.onclose = function(event) {
      if (event.wasClean) {
        appendMessage(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
      } else {
        // e.g. server process killed or network down
        // event.code is usually 1006 in this case
        appendMessage('[close] Connection died');
      }
    };
    
    socket.onerror = function(error) {
      appendMessage(`[error] ${error.message}`);
    };
    
});





/// --------------------------------------------------------
/// ----------------- FUNCTIONS  ---------------------------




/// --------------------------------------------------------
/// ----------------- DEBUGGING  ---------------------------
function appendMessage(message){
    let element = $("<div>");
    element.text(message);
    element.addClass("message");
    $("#output").append(element);
}

/// --------------------------------------------------------