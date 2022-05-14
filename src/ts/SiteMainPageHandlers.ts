
let defaultIP: string = "127.0.0.1";
let defaultPort: string = "4444";

let obsConnection: OBS.ObsConnection;

$(() => {
    // construct
    obsConnection = new OBS.ObsConnection();
    obsConnection.onConnectResultHandler = func.connected;
    obsConnection.onDisconnectHandler = func.disconneted;


    // on connect
    $("#connect").on("click", () => {
        let ip: string = $("#ipInput").val().toString();
        if (ip == "") ip = defaultIP;
        let port: string = $("#portInput").val().toString();
        if (port == "") port = defaultPort;
        let password: string = $("#passwordInput").val().toString();

        


        obsConnection.connect(ip, port, password);
    })
})

namespace func {
    export function connected(connection: OBS.ConnectionResult): void {
        console.log("FFFF: connected: " + connection)
    }

    export function disconneted(): void {
        console.log("FFFF: disconnected")
    }

}