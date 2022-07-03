
// default values
let defaultIP: string = "127.0.0.1";
let defaultPort: string = "4444";

// local storrage container names
let localStorageIpIdentifier: string = "localStorrageIpIdentifier";
let localStoragePortIdentifier: string = "localStorragePortIdentifier";
let localStoragePasswordIdentifier: string = "localStorragePasswordIdentifier";

// connection
let obsManager: OBS.ObsManager;

// init
$(() => {
    loadSettings();
    initConnection();
    initActions();
})






function initActions() {
    // on connect/login
    $("#connect").on("click", () => {
        tryConnect();
    });
    
    $("#passwordInput").on("keydown", (e) =>{
        if(e.key == 'Enter'){
            $("#passwordInput").trigger("blur");
            tryConnect();
        }
    });

    $("#applySceneNameBtn").on("click", () => {
        let sceneName: string = $("#sceneNameInput").val().toString();
        obsModules.backgroundUpdater.setSourceName(sceneName);
    });

    // send raw debugging to socket
    $('#try').on("click", () => {
        obsManager.sendMessage($("#rawMessageInput").val().toString());
    });

    function tryConnect() {
        let ip: string = $("#ipInput").val().toString();
        if (ip == "")
            ip = defaultIP;
        let port: string = $("#portInput").val().toString();
        if (port == "")
            port = defaultPort;
        let password: string = $("#passwordInput").val().toString();
        saveSettings(ip, port, password);

        obsManager.connect(ip, port, password);
    }
}

function initConnection() {
    obsManager = new OBS.ObsManager();
    obsManager.setConnectionResultCallback(func.connected);
    obsManager.setDisconnectedCallback(func.disconneted);

    addModules(obsManager);
    return obsManager;
}


namespace obsModules{
    export var backgroundUpdater: ObsAppModules.PreviewUpdater;
}

function addModules(obsManager: OBS.ObsManager) {
    let backgoundUpdateModuleId = new OBS.Modules.ModuleIdentifier(ObsAppModules.ModuleType[ObsAppModules.ModuleType.UpdatePreview]);
    obsModules.backgroundUpdater = new ObsAppModules.PreviewUpdater(backgoundUpdateModuleId, $("#scenePreview").get()[0] as HTMLImageElement, 100, obsManager);
    obsManager.addModule(obsModules.backgroundUpdater);
}



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


