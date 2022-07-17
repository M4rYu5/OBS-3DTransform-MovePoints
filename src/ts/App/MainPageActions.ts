namespace App.MainPageActions {

    // init
    export function init(){
        initActions();
    }
    
    
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
            App.Connection.obsModules.previewUpdater.setSourceName(sceneName);
        });
    
        // send raw debugging to socket
        $('#try').on("click", () => {
            App.Connection.obsManager.sendMessage($("#rawMessageInput").val().toString());
        });
    
        function tryConnect() {
            let ip: string = $("#ipInput").val().toString();
            if (ip == "")
                ip = App.Defaults.defaultIP;
            let port: string = $("#portInput").val().toString();
            if (port == "")
                port = App.Defaults.defaultPort;
            let password: string = $("#passwordInput").val().toString();
            App.InputsFillOnLoad.saveSettings(ip, port, password);
    
            App.Connection.obsManager.connect(ip, port, password);
        }
    }

}    
