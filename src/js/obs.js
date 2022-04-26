
var socket;
$(document).ready(() => 
{
	appendMessage("Connecting... ");

	socket = new WebSocket("ws://127.0.0.1:4444");

	socket.onopen = function (e) {
		appendMessage("[open] Connection established");
		appendMessage("Sending to server");
		socket.send('{"request-type": "GetAuthRequired", "message-id": "1"}');
	};

	socket.onmessage = function (event) {
		appendMessage(`[message] Data received from server: ${event.data}`);
		var data = JSON.parse(event.data);
		if (data.status == 'ok' && data.authRequired) {
			auth(data.challenge, data.salt);
		}
	};

	socket.onclose = function (event) {
		if (event.wasClean) {
			appendMessage(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
		} else {
			// e.g. server process killed or network down
			// event.code is usually 1006 in this case
			appendMessage('[close] Connection died');
		}
	};

	socket.onerror = function (error) {
		appendMessage(`[error] ${error.message}`);
	};

});




// --------------------------------------------------------
// ----------------- FUNCTIONS  ---------------------------
$(document).ready(() => 
{
	$("#try").click(function() {
		let a = $("#sha").val();
		appendMessage("Next message will be sent: " + a);
		socket.send(a);
	})
})

async function auth(challenge, salt) {
	appendMessage("_");
	appendMessage("_");
	appendMessage("_");
	appendMessage("Auth starting with challenge: " + challenge + "  , and salt: " + salt + "   ;");


	let password = localStorage.getItem("password");

	let authTokenG = "";
	{
		// hash & stuff for Auth in obs-websocket,
		// more here: https://github.com/obsproject/obs-websocket/blob/4.x-current/docs/generated/protocol.md#authentication
		let sha = sha256(password + salt);
		let shaPchallenge = hexToBase64(sha) + challenge;
		let sha2 = sha256(shaPchallenge);
		let authToken = hexToBase64(sha2);
		
		authTokenG = authToken;
	}

	let temp = {
		"request-type": "Authenticate",
		"auth": authTokenG,
		"message-id": "2"
	}
	appendMessage('_');
	appendMessage(JSON.stringify(temp));
	socket.send(JSON.stringify(temp));


	appendMessage("_");
	appendMessage("_");
	appendMessage("_");
}




/// --------------------------------------------------------
/// ----------------- DEBUGGING  ---------------------------
function appendMessage(message) {
	let element = $("<div>");
	element.text(message);
	element.addClass("message");
	element.addClass("col-12")
	$("#output").append(element);
}

/// --------------------------------------------------------