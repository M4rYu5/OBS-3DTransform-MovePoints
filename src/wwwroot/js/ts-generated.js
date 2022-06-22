var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var CustomLogger;
(function (CustomLogger) {
    var LogType;
    (function (LogType) {
        LogType[LogType["none"] = 0] = "none";
        LogType[LogType["info"] = 1] = "info";
        LogType[LogType["wornign"] = 2] = "wornign";
        LogType[LogType["error"] = 3] = "error";
    })(LogType = CustomLogger.LogType || (CustomLogger.LogType = {}));
    function Log(message, type) {
        if (type === void 0) { type = LogType.none; }
        var element = $("<div>");
        element.addClass("log");
        element.addClass("col-12");
        if (message != null) {
            element.text(message);
            switch (type) {
                case LogType.info:
                    element.addClass("logInfo");
                    break;
                case LogType.wornign:
                    element.addClass("logWarning");
                    break;
                case LogType.error:
                    element.addClass("logError");
                    break;
                default:
                    break;
            }
        }
        else {
            element.text("[LOG: RECEIVED NULL MESSAGE]");
            element.addClass("logWarning");
        }
        $("#output").append(element);
    }
    CustomLogger.Log = Log;
})(CustomLogger || (CustomLogger = {}));
var defaultIP = "127.0.0.1";
var defaultPort = "4444";
var localStorageIpIdentifier = "localStorrageIpIdentifier";
var localStoragePortIdentifier = "localStorragePortIdentifier";
var localStoragePasswordIdentifier = "localStorragePasswordIdentifier";
var obsManager;
$(function () {
    loadSettings();
    initConnection();
    initActions();
});
function initActions() {
    $("#connect").on("click", function () {
        var ip = $("#ipInput").val().toString();
        if (ip == "")
            ip = defaultIP;
        var port = $("#portInput").val().toString();
        if (port == "")
            port = defaultPort;
        var password = $("#passwordInput").val().toString();
        saveSettings(ip, port, password);
        obsManager.connect(ip, port, password);
    });
    $("#applySceneNameBtn").on("click", function () {
        var sceneName = $("#sceneNameInput").val().toString();
        obsModules.backgroundUpdater.setSourceName(sceneName);
    });
    $('#try').on("click", function () {
        obsManager.sendMessage($("#rawMessageInput").val().toString());
    });
}
function initConnection() {
    obsManager = new OBS.ObsManager();
    obsManager.setConnectionResultCallback(func.connected);
    obsManager.setDisconnectedCallback(func.disconneted);
    addModules(obsManager);
    return obsManager;
}
var obsModules;
(function (obsModules) {
})(obsModules || (obsModules = {}));
function addModules(obsManager) {
    obsModules.backgroundUpdater = new ObsAppModules.UpdatePreview($("#scenePreview").get()[0], 100, obsManager);
    obsManager.addModule(obsModules.backgroundUpdater);
}
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
            this.connectionResultCallback = null;
            this.disconnectedCallback = null;
            this.messageReceivedCallback = null;
            this.socketOnOpen = function (event) {
                CustomLogger.Log("[OPEN] Connection established");
                _this.webSocket.send('{"request-type": "GetAuthRequired", "message-id": "' + _this.checkAuthMessageIdentifier + '"}');
            };
            this.socketOnMessage = function (event) {
                if (_this.tryedToConnect == false) {
                    CustomLogger.Log("[RECEIVED auth]: " + event.data);
                    _this.resolveAuth(event.data);
                }
                else {
                    CustomLogger.Log("[RECEIVED external]: " + event.data);
                    _this.onMessageReceived(event.data);
                }
            };
            this.socketOnClose = function (event) {
                if (event.wasClean) {
                    CustomLogger.Log("[close] Connection closed cleanly, code=".concat(event.code, " reason=").concat(event.reason));
                }
                else {
                    CustomLogger.Log('[close] Connection died');
                }
                _this.resetSocket();
                _this.onDisconnected();
            };
            this.socketOnError = function (error) {
                CustomLogger.Log("[error] ".concat(JSON.stringify(error)));
            };
        }
        ObsConnection.prototype.setConnectionResultCallback = function (onConnectionResult) {
            this.connectionResultCallback = onConnectionResult;
        };
        ObsConnection.prototype.setDisconnectedCallback = function (onDisconnected) {
            this.disconnectedCallback = onDisconnected;
        };
        ObsConnection.prototype.setMessageReceivedCallback = function (onMessageReceived) {
            this.messageReceivedCallback = onMessageReceived;
        };
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
            this.tryedToConnect = true;
            this.onConnectResult(connection);
            CustomLogger.Log("[connectionResult]: " + ConnectionResult[connection], CustomLogger.LogType.info);
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
                    {
                        this.setObsConnectionResult(ConnectionResult.wrongAuthDetails);
                        this.disconnect();
                    }
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
        ObsConnection.prototype.onConnectResult = function (connection) {
            var _a;
            (_a = this.connectionResultCallback) === null || _a === void 0 ? void 0 : _a.call(this, connection);
        };
        ;
        ObsConnection.prototype.onDisconnected = function () {
            var _a;
            (_a = this.disconnectedCallback) === null || _a === void 0 ? void 0 : _a.call(this);
        };
        ;
        ObsConnection.prototype.onMessageReceived = function (jsonMessage) {
            var _a;
            (_a = this.messageReceivedCallback) === null || _a === void 0 ? void 0 : _a.call(this, jsonMessage);
        };
        ;
        return ObsConnection;
    }());
    OBS.ObsConnection = ObsConnection;
})(OBS || (OBS = {}));
var OBS;
(function (OBS) {
    var ObsManager = (function (_super) {
        __extends(ObsManager, _super);
        function ObsManager() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.modules = {};
            return _this;
        }
        ObsManager.prototype.onMessageReceived = function (jsonMessage) {
            _super.prototype.onMessageReceived.call(this, jsonMessage);
            this.messageReceivedHandler(jsonMessage);
        };
        ;
        ObsManager.prototype.messageReceivedHandler = function (message) {
            var obj = null;
            try {
                obj = JSON.parse(message);
            }
            catch (_a) { }
            if (obj == null) {
                CustomLogger.Log("[ObsManager]: empty message received", CustomLogger.LogType.wornign);
                return;
            }
            if (!this.handleMessage(obj)) {
                this.onMessageUnhandled(message);
            }
            else {
                CustomLogger.Log("[ObsManager]: message unhandled: " + message, CustomLogger.LogType.info);
            }
        };
        ObsManager.prototype.onMessageUnhandled = function (message) {
            var _a;
            (_a = this.MessageUnhandledCallback) === null || _a === void 0 ? void 0 : _a.call(this, message);
        };
        ObsManager.prototype.setUnhandledMessageCallback = function (onUnhandledMessage) {
            this.MessageUnhandledCallback = onUnhandledMessage;
        };
        ObsManager.prototype.addModule = function (module) {
            if (this.hasModule(module))
                throw "Module already added";
            this.modules[module.getIdentifier().getId()] = module;
        };
        ObsManager.prototype.removeModule = function (module) {
            this.removeModuleById(module.getIdentifier().getId());
        };
        ObsManager.prototype.removeModuleById = function (moduleId) {
            if (!this.hasModuleId(moduleId))
                return;
            delete this.modules[moduleId];
        };
        ObsManager.prototype.hasModule = function (module) {
            return this.hasModuleId(module.getIdentifier().getId());
        };
        ObsManager.prototype.hasModuleId = function (moduleId) {
            return moduleId in this.modules;
        };
        ObsManager.prototype.handleMessage = function (obj) {
            var moduleId = obj["message-id"];
            if (!this.hasModuleId(moduleId))
                return false;
            var module = this.modules[moduleId];
            var arg = new OBS.Modules.DispatchArgs();
            arg.obj = obj;
            arg.connection = this;
            module.dispatch(arg);
            return true;
        };
        return ObsManager;
    }(OBS.ObsConnection));
    OBS.ObsManager = ObsManager;
})(OBS || (OBS = {}));
var OBS;
(function (OBS) {
    var Modules;
    (function (Modules) {
        var DispatchArgs = (function () {
            function DispatchArgs(obj, connection) {
                this.obj = obj;
                this.connection = connection;
            }
            return DispatchArgs;
        }());
        Modules.DispatchArgs = DispatchArgs;
    })(Modules = OBS.Modules || (OBS.Modules = {}));
})(OBS || (OBS = {}));
var OBS;
(function (OBS) {
    var Modules;
    (function (Modules) {
        var ModuleBase = (function () {
            function ModuleBase(identifier) {
                this.id = identifier;
            }
            ModuleBase.prototype.getIdentifier = function () {
                return this.id;
            };
            ModuleBase.prototype.setIdentifierToObject = function (object) {
                object["message-id"] = this.getIdentifier().getId();
            };
            return ModuleBase;
        }());
        Modules.ModuleBase = ModuleBase;
    })(Modules = OBS.Modules || (OBS.Modules = {}));
})(OBS || (OBS = {}));
var OBS;
(function (OBS) {
    var Modules;
    (function (Modules) {
        var ModuleIdentifier = (function () {
            function ModuleIdentifier(identifier) {
                if (identifier === void 0) { identifier = null; }
                this.reservedCharacter = "◙";
                this.identifier = identifier;
                if (this.identifier.indexOf(this.getReservedChar()) != -1)
                    throw "ModuleIdentifier: ◙ (or Alt + 10 or the 10'th character in asci table) is reserved";
            }
            ModuleIdentifier.prototype.getId = function () {
                return this.identifier;
            };
            ModuleIdentifier.prototype.getReservedChar = function () {
                return this.reservedCharacter;
            };
            return ModuleIdentifier;
        }());
        Modules.ModuleIdentifier = ModuleIdentifier;
    })(Modules = OBS.Modules || (OBS.Modules = {}));
})(OBS || (OBS = {}));
var ObsAppModules;
(function (ObsAppModules) {
    var ModuleType;
    (function (ModuleType) {
        ModuleType[ModuleType["UpdatePreview"] = 0] = "UpdatePreview";
    })(ModuleType = ObsAppModules.ModuleType || (ObsAppModules.ModuleType = {}));
})(ObsAppModules || (ObsAppModules = {}));
var ObsAppModules;
(function (ObsAppModules) {
    var UpdatePreview = (function (_super) {
        __extends(UpdatePreview, _super);
        function UpdatePreview(backgroundImage, updateInterval, connection, sourceName) {
            var _this = _super.call(this, new OBS.Modules.ModuleIdentifier(ObsAppModules.ModuleType[ObsAppModules.ModuleType.UpdatePreview])) || this;
            _this.requestMessage = {
                "request-type": "TakeSourceScreenshot",
                "embedPictureFormat": "jpg"
            };
            _this.backgroundImage = backgroundImage;
            _this.connection = connection;
            if (sourceName != null)
                _this.requestMessage["sourceName"] = sourceName;
            _this.setIdentifierToObject(_this.requestMessage);
            setInterval(function () { return _this.updateBackground(); }, updateInterval);
            return _this;
        }
        UpdatePreview.prototype.updateBackground = function () {
            if (this.connection.isConnected()) {
                var message = JSON.stringify(this.requestMessage);
                this.connection.sendMessage(message);
            }
        };
        UpdatePreview.prototype.setSourceName = function (sourceName) {
            if (sourceName != null && sourceName.length != 0)
                this.requestMessage["sourceName"] = sourceName;
            else
                this.removeSourceName();
        };
        UpdatePreview.prototype.removeSourceName = function () {
            delete this.requestMessage["sourceName"];
        };
        UpdatePreview.prototype.dispatch = function (arg) {
            this.backgroundImage.src = arg.obj["img"];
        };
        return UpdatePreview;
    }(OBS.Modules.ModuleBase));
    ObsAppModules.UpdatePreview = UpdatePreview;
})(ObsAppModules || (ObsAppModules = {}));
//# sourceMappingURL=ts-generated.js.map