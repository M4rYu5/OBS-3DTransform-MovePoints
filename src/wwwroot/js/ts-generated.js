var CustomLogger;
(function (CustomLogger) {
    var LogType;
    (function (LogType) {
        LogType[LogType["none"] = 0] = "none";
        LogType[LogType["info"] = 1] = "info";
    })(LogType = CustomLogger.LogType || (CustomLogger.LogType = {}));
    function Log(message, type) {
        if (type === void 0) { type = LogType.none; }
        var element = $("<div>");
        element.text(message);
        element.addClass("log");
        element.addClass("col-12");
        switch (type) {
            case LogType.info:
                element.addClass("logInfo");
                break;
            default:
                break;
        }
        element.addClass("");
        $("#output").append(element);
    }
    CustomLogger.Log = Log;
})(CustomLogger || (CustomLogger = {}));
var defaultIP = "127.0.0.1";
var defaultPort = "4444";
var localStorageIpIdentifier = "localStorrageIpIdentifier";
var localStoragePortIdentifier = "localStorragePortIdentifier";
var localStoragePasswordIdentifier = "localStorragePasswordIdentifier";
var obsConnection;
$(function () {
    loadSettings();
    obsConnection = new OBS.ObsConnection();
    obsConnection.onConnectResultHandler = func.connected;
    obsConnection.onDisconnectHandler = func.disconneted;
    $("#connect").on("click", function () {
        var ip = $("#ipInput").val().toString();
        if (ip == "")
            ip = defaultIP;
        var port = $("#portInput").val().toString();
        if (port == "")
            port = defaultPort;
        var password = $("#passwordInput").val().toString();
        saveSettings(ip, port, password);
        obsConnection.connect(ip, port, password);
    });
});
function loadSettings() {
    var ip = localStorage.getItem(localStorageIpIdentifier);
    if (ip != null && ip)
        $("#ipInput").val(ip);
    var port = localStorage.getItem(localStoragePortIdentifier);
    if (port != null)
        $("#portInput").val(port);
}
function saveSettings(ip, port, password) {
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
}
var func;
(function (func) {
    function connected(connection) {
        console.log("FFFF: connected: " + connection);
    }
    func.connected = connected;
    function disconneted() {
        console.log("FFFF: disconnected");
    }
    func.disconneted = disconneted;
})(func || (func = {}));
var OBS;
(function (OBS) {
    var ConnectionResult;
    (function (ConnectionResult) {
        ConnectionResult[ConnectionResult["succeed"] = 0] = "succeed";
        ConnectionResult[ConnectionResult["socketAddressUnreachable"] = 1] = "socketAddressUnreachable";
        ConnectionResult[ConnectionResult["wrongAuthDetails"] = 2] = "wrongAuthDetails";
        ConnectionResult[ConnectionResult["socketConnectionError"] = 3] = "socketConnectionError";
    })(ConnectionResult = OBS.ConnectionResult || (OBS.ConnectionResult = {}));
    var ObsConnection = (function () {
        function ObsConnection() {
            var _this = this;
            this.password = null;
            this.tryedToConnect = false;
            this.checkAuthMessageIdentifier = "MessageIdentifier-CheckAuthRequired";
            this.tryAuthMessageIdentifier = "MessageIdentifier-TryAuth";
            this.webSocket = null;
            this.socketOnOpen = function (event) {
                CustomLogger.Log("[OPEN] Connection established");
                _this.webSocket.send('{"request-type": "GetAuthRequired", "message-id": "' + _this.checkAuthMessageIdentifier + '"}');
            };
            this.socketOnMessage = function (event) {
                var _a;
                if (_this.tryedToConnect == false) {
                    CustomLogger.Log("[RECEIVED auth]: " + event.data);
                    _this.resolveAuth(event.data);
                }
                else {
                    CustomLogger.Log("[RECEIVED external]: " + event.data);
                    (_a = _this.onReceivedMessageHandler) === null || _a === void 0 ? void 0 : _a.call(_this, event.data);
                }
            };
            this.socketOnClose = function (event) {
                var _a;
                if (event.wasClean) {
                    CustomLogger.Log("[close] Connection closed cleanly, code=".concat(event.code, " reason=").concat(event.reason));
                }
                else {
                    CustomLogger.Log('[close] Connection died');
                }
                _this.resetSocket();
                (_a = _this.onDisconnectHandler) === null || _a === void 0 ? void 0 : _a.call(_this);
            };
            this.socketOnError = function (error) {
                CustomLogger.Log("[error] ".concat(JSON.stringify(error)));
            };
        }
        ObsConnection.prototype.sendMessage = function (jsonMessage) {
            if (!this.isConnected())
                return false;
            try {
                this.webSocket.send(jsonMessage);
            }
            catch (_a) {
                return false;
            }
            return true;
        };
        ObsConnection.prototype.isConnected = function () {
            return this.webSocket != null;
        };
        ObsConnection.prototype.connect = function (ip, port, password) {
            if (ip === void 0) { ip = "127.0.0.1"; }
            if (port === void 0) { port = "4444"; }
            if (password === void 0) { password = ""; }
            if (this.isConnected())
                this.resetSocket();
            try {
                this.webSocket = new WebSocket("ws://".concat(ip, ":").concat(port));
            }
            catch (_a) {
                this.setObsConnectionResult(ConnectionResult.socketAddressUnreachable);
                this.webSocket = null;
                return;
            }
            this.webSocket.onopen = this.socketOnOpen;
            this.webSocket.onmessage = this.socketOnMessage;
            this.webSocket.onclose = this.socketOnClose;
            this.webSocket.onerror = this.socketOnError;
            this.password = password;
        };
        ObsConnection.prototype.disconnect = function () {
            this.password = null;
            if (this.isConnected())
                this.webSocket.close();
            this.resetSocket();
        };
        ObsConnection.prototype.resetSocket = function () {
            CustomLogger.Log("[socket reset]", CustomLogger.LogType.info);
            this.password = null;
            if (this.webSocket == null)
                return;
            this.webSocket.onopen = null;
            this.webSocket.onmessage = null;
            this.webSocket.onclose = null;
            this.webSocket.onerror = null;
            this.webSocket.close();
            this.webSocket = null;
            this.tryedToConnect = false;
        };
        ObsConnection.prototype.setObsConnectionResult = function (connection) {
            var _a;
            this.tryedToConnect = true;
            (_a = this.onConnectResultHandler) === null || _a === void 0 ? void 0 : _a.call(this, connection);
            CustomLogger.Log("[connectionResult]: " + connection, CustomLogger.LogType.info);
        };
        ObsConnection.prototype.resolveAuth = function (obj) {
            var data = JSON.parse(obj);
            if (data["message-id"] == this.checkAuthMessageIdentifier) {
                if (data.authRequired) {
                    this.auth(data.challenge, data.salt);
                }
                else {
                    this.setObsConnectionResult(ConnectionResult.succeed);
                }
            }
            else if (data["message-id"] == this.tryAuthMessageIdentifier) {
                if (data.status == "ok") {
                    this.setObsConnectionResult(ConnectionResult.succeed);
                }
                if (data.status == "error") {
                    this.setObsConnectionResult(ConnectionResult.wrongAuthDetails);
                }
            }
        };
        ObsConnection.prototype.auth = function (challenge, salt) {
            var password = this.password;
            this.password = null;
            var sha = sha256(password + salt);
            var shaPchallenge = hexToBase64(sha) + challenge;
            var sha2 = sha256(shaPchallenge);
            var authToken = hexToBase64(sha2);
            var temp = {
                "request-type": "Authenticate",
                "auth": authToken,
                "message-id": this.tryAuthMessageIdentifier
            };
            CustomLogger.Log('[Sending Auth Token]', CustomLogger.LogType.info);
            var token = JSON.stringify(temp);
            this.webSocket.send(token);
        };
        return ObsConnection;
    }());
    OBS.ObsConnection = ObsConnection;
})(OBS || (OBS = {}));
//# sourceMappingURL=ts-generated.js.map