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
var obsConnection;
$(function () {
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
        obsConnection.connect(ip, port, password);
    });
});
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
var DEV2;
(function (DEV2) {
    var OBSManager = (function () {
        function OBSManager() {
            this.isConnected = false;
        }
        OBSManager.prototype.connect = function (ip, port) {
            var _this = this;
            if (ip === void 0) { ip = "127.0.0.1"; }
            if (port === void 0) { port = "4444"; }
            webSocket === null || webSocket === void 0 ? void 0 : webSocket.close();
            this.isConnected = false;
            var webSocket = new WebSocket("ws://".concat(ip, ":").concat(port));
            webSocket.onopen = function (e) {
                var _a;
                DEV.appendMessage("[open] Connection established");
                (_a = _this.onConnectHandler) === null || _a === void 0 ? void 0 : _a.call(_this, true);
            };
            webSocket.onmessage = function (event) {
            };
            webSocket.onclose = function (event) {
                var _a;
                if (event.wasClean) {
                    DEV.appendMessage("[close] Connection closed cleanly, code=".concat(event.code, " reason=").concat(event.reason));
                }
                else {
                    DEV.appendMessage('[close] Connection died');
                }
                (_a = _this.onDisconnectHandler) === null || _a === void 0 ? void 0 : _a.call(_this);
            };
            webSocket.onerror = function (error) {
                DEV.appendMessage("[error] ".concat(JSON.stringify(error)));
            };
        };
        OBSManager.prototype.disconnect = function () {
            this.webSocket.close();
            this.webSocket = null;
        };
        return OBSManager;
    }());
    DEV2.OBSManager = OBSManager;
})(DEV2 || (DEV2 = {}));
var DEV;
(function (DEV) {
    function appendMessage(message) {
        var element = $("<div>");
        element.text(message);
        element.addClass("message");
        element.addClass("col-12");
        $("#output").append(element);
    }
    DEV.appendMessage = appendMessage;
})(DEV || (DEV = {}));
//# sourceMappingURL=ts-generated.js.map