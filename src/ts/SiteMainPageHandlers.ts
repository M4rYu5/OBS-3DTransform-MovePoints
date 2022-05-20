
let defaultIP: string = "127.0.0.1";
let defaultPort: string = "4444";

let localStorageIpIdentifier: string = "localStorrageIpIdentifier";
let localStoragePortIdentifier: string = "localStorragePortIdentifier";
let localStoragePasswordIdentifier: string = "localStorragePasswordIdentifier";

let obsManager: OBS.ObsManager;

$(() => {
    loadSettings();


    // construct
    obsManager = new OBS.ObsManager();
    obsManager.setConnectionResultCallback(func.connected);
    obsManager.setDisconnectedCallback(func.disconneted);


    // on connect
    $("#connect").on("click", () => {
        let ip: string = $("#ipInput").val().toString();
        if (ip == "") ip = defaultIP;
        let port: string = $("#portInput").val().toString();
        if (port == "") port = defaultPort;
        let password: string = $("#passwordInput").val().toString();
        saveSettings(ip, port, password);



        obsManager.connect(ip, port, password);
    });

})






function loadSettings(): void {
    var ip = localStorage.getItem(localStorageIpIdentifier);
    if (ip != null && ip)
        $("#ipInput").val(ip);
    var port = localStorage.getItem(localStoragePortIdentifier);
    if (port != null)
        $("#portInput").val(port);

    // todo: load the password; might be obfuscated
}
function saveSettings(ip: string, port: string, password: string): void {
    if (ip != null) {
        if (ip != defaultIP)
            localStorage.setItem(localStorageIpIdentifier, ip);
        else
            localStorage.removeItem(localStorageIpIdentifier);
    }
    if (port != null) {
        if (port != defaultPort)
            localStorage.setItem(localStoragePortIdentifier, port);
        else
            localStorage.removeItem(localStoragePortIdentifier);
    }

    // todo: save the passrod; it might need obfuscation
}









namespace func {
    export function connected(connection: OBS.ConnectionResult): void {
        console.log("FFFF: connected: " + connection)
    }

    export function disconneted(): void {
        console.log("FFFF: disconnected")
    }

}