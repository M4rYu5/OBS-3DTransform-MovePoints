
## Connecting to OBS WebSocket
This page contains inputs and they're coresponding outputs, on each step, for OBS WebSocket Authentication, according to they're [documentation](https://github.com/obsproject/obs-websocket/blob/4.x-current/docs/generated/protocol.md#authentication).
- JavaScript

```JavaScript
// todo: change var to let when you done debuggin

var password = "test";
var salt = "snBDVm5fT+bYEqjHsFa0VTSDQbRECsgJxE7z6kK1XBM=";
var challenge = "zgdciuq9Wna8x/uSqIpkhIgE6WDzAXN6v5IlecS7P60=";


// Concatenate the user declared password with the salt sent by the server (in this order: password + server salt).
var t1 = password + salt;
console.log(t1 == "testsnBDVm5fT+bYEqjHsFa0VTSDQbRECsgJxE7z6kK1XBM=");

// Generate a binary SHA256 hash of the result and encode the resulting SHA256 binary hash to base64, known as a base64 secret.
var sha = sha256(t1);
var t2 = hexToBase64(sha);
console.log(t2 == "JIveT6LjeeAl55Dm7Mb+U0FwQGY7ippgpzRYBPJIgfY=");

// Concatenate the base64 secret with the challenge sent by the server (in this order: base64 secret + server challenge).
var t3 = t2 + challenge;
console.log(t3 == "JIveT6LjeeAl55Dm7Mb+U0FwQGY7ippgpzRYBPJIgfY=zgdciuq9Wna8x/uSqIpkhIgE6WDzAXN6v5IlecS7P60=");

// Generate a binary SHA256 hash of the result and encode it to base64.
var sha2 = sha256(t3);
var tf = hexToBase64(sha2);
console.log(tf == "AJw9XgTQPotSJLu3GEVHK9Tq2ZEbZy7rzdA5htP6kY8=");
// VoilÃ , this last base64 string is the auth response. You may now use it to authenticate to the server with the Authenticate request.

```

- C#:

```C#

var password = "test";
var salt = "snBDVm5fT+bYEqjHsFa0VTSDQbRECsgJxE7z6kK1XBM=";
var challenge = "zgdciuq9Wna8x/uSqIpkhIgE6WDzAXN6v5IlecS7P60=";
using SHA256 mySHA256 = SHA256.Create();


// Concatenate the user declared password with the salt sent by the server (in this order: password + server salt).
var t1 = password + salt;
Console.WriteLine(t1 == "testsnBDVm5fT+bYEqjHsFa0VTSDQbRECsgJxE7z6kK1XBM=");

// Generate a binary SHA256 hash of the result and encode the resulting SHA256 binary hash to base64, known as a base64 secret.
var sha = mySHA256.ComputeHash(ASCIIEncoding.UTF8.GetBytes(t1));
var t2 = System.Convert.ToBase64String(sha);
Console.WriteLine(t2 == "JIveT6LjeeAl55Dm7Mb+U0FwQGY7ippgpzRYBPJIgfY=");

// Concatenate the base64 secret with the challenge sent by the server (in this order: base64 secret + server challenge).
var t3 = t2 + challenge;
Console.WriteLine(t3 == "JIveT6LjeeAl55Dm7Mb+U0FwQGY7ippgpzRYBPJIgfY=zgdciuq9Wna8x/uSqIpkhIgE6WDzAXN6v5IlecS7P60=");

// Generate a binary SHA256 hash of the result and encode it to base64.
var sha2 = mySHA256.ComputeHash(ASCIIEncoding.UTF8.GetBytes(t3));
var tf = System.Convert.ToBase64String(sha2);
Console.WriteLine(tf == "AJw9XgTQPotSJLu3GEVHK9Tq2ZEbZy7rzdA5htP6kY8=");
// VoilÃ , this last base64 string is the auth response. You may now use it to authenticate to the server with the Authenticate request.
```
