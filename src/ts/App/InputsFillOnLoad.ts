namespace App.InputsFillOnLoad {

    // init
    export function init() {
        loadSettings();
    }




    function loadSettings(): void {
        var ip = localStorage.getItem(App.Defaults.localStorageIpIdentifier);
        if (ip != null && ip)
            $("#ipInput").val(ip);
        var port = localStorage.getItem(App.Defaults.localStoragePortIdentifier);
        if (port != null)
            $("#portInput").val(port);

        // todo: load the password; might be obfuscated

        // scene & filter selection inputs
        var scenePreviewName = localStorage.getItem(App.Defaults.localStorageScenePreviewNameIdentifier);
        if (scenePreviewName != null)
            $("#sceneNameInput").val(scenePreviewName);
        var sceneFilterName = localStorage.getItem(App.Defaults.localStorageSceneFilterNameIdentifier);
        if (sceneFilterName != null)
            $("#filterSceneNameInput").val(sceneFilterName);
        var filterName = localStorage.getItem(App.Defaults.localStorageFilterNameIdentifier);
        if (filterName != null)
            $("#filterNameInput").val(filterName);

    }

    export function saveSettings(ip: string, port: string, password: string): void {
        if (ip != null) {
            if (ip != App.Defaults.defaultIP)
                localStorage.setItem(App.Defaults.localStorageIpIdentifier, ip);
            else
                localStorage.removeItem(App.Defaults.localStorageIpIdentifier);
        }
        if (port != null) {
            if (port != App.Defaults.defaultPort)
                localStorage.setItem(App.Defaults.localStoragePortIdentifier, port);
            else
                localStorage.removeItem(App.Defaults.localStoragePortIdentifier);
        }

        // todo: save the passrod; it might need obfuscation
    }

    // scene & filter selection inputs
    export function saveScenePreviewInput(previewInput: string){
        if (previewInput != null) {
            if (previewInput != "")
                localStorage.setItem(App.Defaults.localStorageScenePreviewNameIdentifier, previewInput);
            else
                localStorage.removeItem(App.Defaults.localStorageScenePreviewNameIdentifier);
        }
    }
    export function saveSceneAndFilterNameInput(sceneFilterInput: string, filterNameInput: string){
        if (sceneFilterInput != null) {
            if (sceneFilterInput != "")
                localStorage.setItem(App.Defaults.localStorageSceneFilterNameIdentifier, sceneFilterInput);
            else
                localStorage.removeItem(App.Defaults.localStorageSceneFilterNameIdentifier);
        }
        if (filterNameInput != null) {
            if (filterNameInput != "")
                localStorage.setItem(App.Defaults.localStorageFilterNameIdentifier, filterin);
            else
                localStorage.removeItem(App.Defaults.localStorageFilterNameIdentifier);
        }
    }
}
