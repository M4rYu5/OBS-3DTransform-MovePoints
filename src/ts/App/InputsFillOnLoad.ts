namespace App.InputsFillOnLoad {

    // init
    $(() => {
        loadSettings();
    })




    function loadSettings(): void {
        var ip = localStorage.getItem(App.Defaults.localStorageIpIdentifier);
        if (ip != null && ip)
            $("#ipInput").val(ip);
        var port = localStorage.getItem(App.Defaults.localStoragePortIdentifier);
        if (port != null)
            $("#portInput").val(port);

        // todo: load the password; might be obfuscated
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
}
