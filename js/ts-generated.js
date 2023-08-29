var CustomLogger;
(function (CustomLogger) {
    let LogType;
    (function (LogType) {
        LogType[LogType["none"] = 0] = "none";
        LogType[LogType["info"] = 1] = "info";
        LogType[LogType["wornign"] = 2] = "wornign";
        LogType[LogType["error"] = 3] = "error";
    })(LogType = CustomLogger.LogType || (CustomLogger.LogType = {}));
    function Log(message, type = LogType.none) {
        let element = $("<div>");
        element.css("border-bottom", "1px solid black");
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
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
var App;
(function (App) {
    var Connection;
    (function (Connection) {
        function init() {
            initConnection();
        }
        Connection.init = init;
        function initConnection() {
            Connection.obsManager = new OBS.ObsManager();
            addModules(Connection.obsManager);
            return Connection.obsManager;
        }
        let obsModules;
        (function (obsModules) {
        })(obsModules = Connection.obsModules || (Connection.obsModules = {}));
        function addModules(obsManager) {
            let previewUpdateModuleId = getModuleIdFromModuleType(ObsAppModules.ModuleType.UpdatePreview);
            obsModules.previewUpdater = new ObsAppModules.PreviewUpdater(previewUpdateModuleId, $("#scenePreview").get()[0], 100, obsManager);
            obsManager.addModule(obsModules.previewUpdater);
            let cornerPointsModuleId = getModuleIdFromModuleType(ObsAppModules.ModuleType.Point3DTransform);
            obsModules.cornetPoints = new ObsAppModules.Points(cornerPointsModuleId, "#points");
            obsManager.addModule(obsModules.cornetPoints);
        }
        function getModuleIdFromModuleType(moduleType) {
            return new OBS.Modules.ModuleIdentifier(ObsAppModules.ModuleType[moduleType]);
        }
    })(Connection = App.Connection || (App.Connection = {}));
})(App || (App = {}));
var App;
(function (App) {
    var Defaults;
    (function (Defaults) {
        Defaults.defaultIP = "127.0.0.1";
        Defaults.defaultPort = "4444";
        Defaults.localStorageIpIdentifier = "localStorrageIpIdentifier";
        Defaults.localStoragePortIdentifier = "localStorragePortIdentifier";
        Defaults.localStoragePasswordIdentifier = "localStorragePasswordIdentifier";
        Defaults.localStorageScenePreviewNameIdentifier = "localStorageScenePreviewNameIdentifier";
        Defaults.localStorageSceneFilterNameIdentifier = "localStorageSceneFilterNameIdentifier";
        Defaults.localStorageFilterNameIdentifier = "localStorageFilterNameIdentifier";
    })(Defaults = App.Defaults || (App.Defaults = {}));
})(App || (App = {}));
var App;
(function (App) {
    var InputsFillOnLoad;
    (function (InputsFillOnLoad) {
        function init() {
            loadSettings();
        }
        InputsFillOnLoad.init = init;
        function loadSettings() {
            var ip = localStorage.getItem(App.Defaults.localStorageIpIdentifier);
            if (ip != null && ip)
                $("#ipInput").val(ip);
            var port = localStorage.getItem(App.Defaults.localStoragePortIdentifier);
            if (port != null)
                $("#portInput").val(port);
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
        function saveSettings(ip, port, password) {
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
        }
        InputsFillOnLoad.saveSettings = saveSettings;
        function saveScenePreviewInput(previewInput) {
            if (previewInput != null) {
                if (previewInput != "")
                    localStorage.setItem(App.Defaults.localStorageScenePreviewNameIdentifier, previewInput);
                else
                    localStorage.removeItem(App.Defaults.localStorageScenePreviewNameIdentifier);
            }
        }
        InputsFillOnLoad.saveScenePreviewInput = saveScenePreviewInput;
        function saveSceneAndFilterNameInput(sceneFilterInput, filterNameInput) {
            if (sceneFilterInput != null) {
                if (sceneFilterInput != "")
                    localStorage.setItem(App.Defaults.localStorageSceneFilterNameIdentifier, sceneFilterInput);
                else
                    localStorage.removeItem(App.Defaults.localStorageSceneFilterNameIdentifier);
            }
            if (filterNameInput != null) {
                if (filterNameInput != "")
                    localStorage.setItem(App.Defaults.localStorageFilterNameIdentifier, filterNameInput);
                else
                    localStorage.removeItem(App.Defaults.localStorageFilterNameIdentifier);
            }
        }
        InputsFillOnLoad.saveSceneAndFilterNameInput = saveSceneAndFilterNameInput;
    })(InputsFillOnLoad = App.InputsFillOnLoad || (App.InputsFillOnLoad = {}));
})(App || (App = {}));
$(() => {
    App.InputsFillOnLoad.init();
    App.Connection.init();
    App.MainPageActions.init();
});
var App;
(function (App) {
    var MainPageActions;
    (function (MainPageActions) {
        function init() {
            initActions();
        }
        MainPageActions.init = init;
        function initActions() {
            $("#connect").on("click", () => {
                tryConnect();
            });
            $("#passwordInput").on("keydown", (e) => {
                if (e.key == 'Enter') {
                    $("#passwordInput").trigger("blur");
                    tryConnect();
                }
            });
            $("#applySceneNameBtn").on("click", async () => {
                let sourceName = $("#sceneNameInput").val().toString();
                App.InputsFillOnLoad.saveScenePreviewInput(sourceName);
                App.Connection.obsModules.previewUpdater.setSourceName(sourceName);
                await delay(100);
                await App.Connection.obsModules.cornetPoints.setPreview(sourceName);
            });
            $('#try').on("click", () => {
                App.Connection.obsManager.sendMessage($("#rawMessageInput").val().toString());
            });
            $("#applyFilterBtn").on("click", () => {
                let scene = $("#filterSceneNameInput").val().toString();
                let filter = $("#filterNameInput").val().toString();
                let previewSourceName = $("#sceneNameInput").val().toString();
                App.InputsFillOnLoad.saveSceneAndFilterNameInput(scene, filter);
                App.Connection.obsModules.cornetPoints.set3DFilter(scene, filter, previewSourceName);
            });
            function tryConnect() {
                let ip = $("#ipInput").val().toString();
                if (ip == "")
                    ip = App.Defaults.defaultIP;
                let port = $("#portInput").val().toString();
                if (port == "")
                    port = App.Defaults.defaultPort;
                let password = $("#passwordInput").val().toString();
                App.InputsFillOnLoad.saveSettings(ip, port, password);
                App.Connection.obsManager.connect(ip, port, password);
            }
        }
    })(MainPageActions = App.MainPageActions || (App.MainPageActions = {}));
})(App || (App = {}));
var OBS;
(function (OBS) {
    let ConnectionResult;
    (function (ConnectionResult) {
        ConnectionResult[ConnectionResult["succeed"] = 0] = "succeed";
        ConnectionResult[ConnectionResult["socketAddressUnreachable"] = 1] = "socketAddressUnreachable";
        ConnectionResult[ConnectionResult["wrongAuthDetails"] = 2] = "wrongAuthDetails";
        ConnectionResult[ConnectionResult["socketConnectionError"] = 3] = "socketConnectionError";
    })(ConnectionResult = OBS.ConnectionResult || (OBS.ConnectionResult = {}));
    class ObsConnection {
        password = null;
        webSocket = null;
        connectionResultCallback = null;
        disconnectedCallback = null;
        messageReceivedCallback = null;
        setConnectionResultCallback(onConnectionResult) {
            this.connectionResultCallback = onConnectionResult;
        }
        setDisconnectedCallback(onDisconnected) {
            this.disconnectedCallback = onDisconnected;
        }
        setMessageReceivedCallback(onMessageReceived) {
            this.messageReceivedCallback = onMessageReceived;
        }
        sendMessage(jsonMessage) {
            if (!this.isConnected())
                return false;
            let message_comp = '{"op": 6, "d": ' + jsonMessage + '}';
            try {
                this.webSocket.send(message_comp);
            }
            catch {
                return false;
            }
            return true;
        }
        isConnected() {
            return this.webSocket != null;
        }
        connect(ip = "127.0.0.1", port = "4444", password = "") {
            if (this.isConnected())
                this.resetSocket();
            try {
                this.webSocket = new WebSocket(`ws://${ip}:${port}`);
                this.webSocket.onopen = this.socketOnOpen;
                this.webSocket.onmessage = this.socketOnMessage;
                this.webSocket.onclose = this.socketOnClose;
                this.webSocket.onerror = this.socketOnError;
                this.password = password;
            }
            catch {
                this.setObsConnectionResult(ConnectionResult.socketAddressUnreachable);
                this.webSocket = null;
                return;
            }
        }
        disconnect() {
            this.password = null;
            if (this.isConnected())
                this.webSocket.close();
            this.resetSocket();
        }
        resetSocket() {
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
        }
        setObsConnectionResult(connection) {
            this.onConnectResult(connection);
            CustomLogger.Log("[connectionResult]: " + ConnectionResult[connection], CustomLogger.LogType.info);
        }
        socketOnOpen = (event) => {
            CustomLogger.Log("[OPEN] Connection established");
        };
        socketOnMessage = (event) => {
            let obj = JSON.parse(event.data);
            if (this.handleAuth(obj, event.data)) {
                return;
            }
            else if (obj.op == 7) {
                this.onMessageReceived(JSON.stringify(obj.d));
            }
        };
        socketOnClose = (event) => {
            if (event.wasClean) {
                CustomLogger.Log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
            }
            else {
                CustomLogger.Log('[close] Connection died');
            }
            this.resetSocket();
            this.onDisconnected();
        };
        socketOnError = (error) => {
            CustomLogger.Log(`[error] ${JSON.stringify(error)}`);
        };
        handleAuth(obj, obj_json) {
            if (obj.op == 0) {
                if (obj.d.rpcVersion != 1) {
                    CustomLogger.Log("server responded with rpc version " + obj.d.rpcVersion + ", but the client expected version 1.", CustomLogger.LogType.info);
                }
                let authToken = obj.d.authentication == null ? null : this.compute_auth_token(obj.d.authentication.challenge, obj.d.authentication.salt);
                let response = {
                    "op": 1,
                    "d": {
                        "rpcVersion": 1,
                        "authentication": authToken,
                        "eventSubscriptions": 0
                    }
                };
                this.webSocket.send(JSON.stringify(response));
                return true;
            }
            if (obj.op == 1) {
                return true;
            }
            if (obj.op == 2) {
                if (obj.d.negotiatedRpcVersion != 1) {
                    CustomLogger.Log("client requested rpcVersion 1, but the server responded with rpcVersion " + obj.d.negotiatedRpcVersion + ".", CustomLogger.LogType.wornign);
                }
                CustomLogger.Log("[AUTH DONE]", CustomLogger.LogType.info);
                return true;
            }
            return false;
        }
        compute_auth_token(challenge, salt) {
            let password = this.password;
            this.password = null;
            let sha = sha256(password + salt);
            let shaPchallenge = hexToBase64(sha) + challenge;
            let sha2 = sha256(shaPchallenge);
            let authToken = hexToBase64(sha2);
            return authToken;
        }
        onConnectResult(connection) {
            this.connectionResultCallback?.call(this, connection);
        }
        ;
        onDisconnected() {
            this.disconnectedCallback?.call(this);
        }
        ;
        onMessageReceived(jsonMessage) {
            this.messageReceivedCallback?.call(this, jsonMessage);
        }
        ;
    }
    OBS.ObsConnection = ObsConnection;
})(OBS || (OBS = {}));
var OBS;
(function (OBS) {
    let Status;
    (function (Status) {
        Status["ok"] = "ok";
        Status["error"] = "error";
    })(Status = OBS.Status || (OBS.Status = {}));
    class ObsManager extends OBS.ObsConnection {
        MessageUnhandledCallback;
        onMessageReceived(jsonMessage) {
            super.onMessageReceived(jsonMessage);
            this.messageReceivedHandler(jsonMessage);
        }
        ;
        messageReceivedHandler(message) {
            let obj = null;
            try {
                obj = JSON.parse(message);
            }
            catch { }
            if (obj == null) {
                CustomLogger.Log("[ObsManager]: empty message received", CustomLogger.LogType.wornign);
                return;
            }
            if (!this.handleMessage(obj)) {
                CustomLogger.Log("[ObsManager]: message unhandled: " + message, CustomLogger.LogType.info);
                this.onMessageUnhandled(message);
            }
        }
        handleMessage(obj) {
            return this.handleModule(obj) || this.handleAsync(obj);
        }
        onMessageUnhandled(message) {
            this.MessageUnhandledCallback?.call(this, message);
        }
        setUnhandledMessageCallback(onUnhandledMessage) {
            this.MessageUnhandledCallback = onUnhandledMessage;
        }
        unresolvedPromises = {};
        asyncCallsId = 0;
        asyncTimeoutMillieseconds = 1000;
        asyncMessageIdPrefix = "AsyncMessage with unique id: ";
        sendMessageAsync(objToSend) {
            if (!this.isConnected())
                return Promise.reject({ status: Status.error, message: "You're not connected to OBS", responseObj: null });
            let asyncKey = this.asyncMessageIdPrefix + this.asyncCallsId;
            if (this.asyncCallsId == Number.MAX_SAFE_INTEGER)
                this.asyncCallsId = Number.MIN_SAFE_INTEGER;
            else
                this.asyncCallsId++;
            let copy = { ...objToSend };
            copy["requestId"] = asyncKey;
            let promise = new Promise((resolve, reject) => {
                this.unresolvedPromises[asyncKey] = { promise: null, resolve: resolve, reject: reject };
            });
            this.unresolvedPromises[asyncKey].promise = promise;
            setInterval(this.timeoutFunc, this.asyncTimeoutMillieseconds, asyncKey);
            this.sendMessage(JSON.stringify(copy));
            return promise;
        }
        timeoutFunc = (asyncKey) => {
            if (!(asyncKey in this.unresolvedPromises))
                return;
            let localRejectFunc = this.unresolvedPromises[asyncKey].reject;
            delete this.unresolvedPromises[asyncKey];
            localRejectFunc({ status: Status.error, message: "Timeout", responseObj: null });
        };
        handleAsync(obj) {
            var messageId = obj["requestId"];
            if (messageId == null)
                return false;
            if (!messageId.startsWith(this.asyncMessageIdPrefix))
                return false;
            if (messageId in this.unresolvedPromises) {
                let localResolveFunc = this.unresolvedPromises[messageId].resolve;
                delete this.unresolvedPromises[messageId];
                localResolveFunc({ status: Status.ok, message: "", responseObj: obj });
                return true;
            }
            return false;
        }
        modules = {};
        addModule(module) {
            if (this.hasModule(module))
                throw "Module already added";
            this.modules[module.getIdentifier().getId()] = module;
            module.onConnectionSet(this);
        }
        removeModule(module) {
            this.removeModuleById(module.getIdentifier().getId());
        }
        removeModuleById(moduleId) {
            if (!this.hasModuleId(moduleId))
                return;
            this.modules[moduleId].onConnectionRemoved(this);
            delete this.modules[moduleId];
        }
        hasModule(module) {
            return this.hasModuleId(module.getIdentifier().getId());
        }
        hasModuleId(moduleId) {
            return moduleId in this.modules;
        }
        handleModule(obj) {
            var moduleId = obj["requestId"];
            if (!this.hasModuleId(moduleId))
                return false;
            var module = this.modules[moduleId];
            var arg = new OBS.Modules.DispatchArgs();
            arg.obj = obj;
            arg.connection = this;
            module.dispatch(arg);
            return true;
        }
    }
    OBS.ObsManager = ObsManager;
})(OBS || (OBS = {}));
var OBS;
(function (OBS) {
    var Modules;
    (function (Modules) {
        class DispatchArgs {
            obj;
            connection;
            constructor(obj, connection) {
                this.obj = obj;
                this.connection = connection;
            }
        }
        Modules.DispatchArgs = DispatchArgs;
    })(Modules = OBS.Modules || (OBS.Modules = {}));
})(OBS || (OBS = {}));
var OBS;
(function (OBS) {
    var Modules;
    (function (Modules) {
        class ModuleBase {
            id;
            onConnectionSet(obs) { }
            ;
            onConnectionRemoved(obs) { }
            ;
            constructor(identifier) {
                this.id = identifier;
            }
            getIdentifier() {
                return this.id;
            }
            setIdentifierToObject(object) {
                object["requestId"] = this.getIdentifier().getId();
            }
        }
        Modules.ModuleBase = ModuleBase;
    })(Modules = OBS.Modules || (OBS.Modules = {}));
})(OBS || (OBS = {}));
var OBS;
(function (OBS) {
    var Modules;
    (function (Modules) {
        class ModuleIdentifier {
            reservedCharacter = "◙";
            identifier;
            constructor(identifier = null) {
                this.identifier = identifier;
                if (this.identifier.indexOf(this.getReservedChar()) != -1)
                    throw "ModuleIdentifier: ◙ (or Alt + 10 or the 10'th character in asci table) is reserved";
            }
            getId() {
                return this.identifier;
            }
            getReservedChar() {
                return this.reservedCharacter;
            }
        }
        Modules.ModuleIdentifier = ModuleIdentifier;
    })(Modules = OBS.Modules || (OBS.Modules = {}));
})(OBS || (OBS = {}));
var ObsAppModules;
(function (ObsAppModules) {
    let ModuleType;
    (function (ModuleType) {
        ModuleType[ModuleType["UpdatePreview"] = 0] = "UpdatePreview";
        ModuleType[ModuleType["Point3DTransform"] = 1] = "Point3DTransform";
    })(ModuleType = ObsAppModules.ModuleType || (ObsAppModules.ModuleType = {}));
})(ObsAppModules || (ObsAppModules = {}));
var ObsAppModules;
(function (ObsAppModules) {
    let PointLocation;
    (function (PointLocation) {
        PointLocation[PointLocation["topLeft"] = 0] = "topLeft";
        PointLocation[PointLocation["topRight"] = 1] = "topRight";
        PointLocation[PointLocation["bottomLeft"] = 2] = "bottomLeft";
        PointLocation[PointLocation["bottomRight"] = 3] = "bottomRight";
    })(PointLocation || (PointLocation = {}));
    class Points extends OBS.Modules.ModuleBase {
        points = [];
        obsManager = null;
        pointHtmlDivId;
        parentJQuery;
        filter = { sourceName: null, filterName: null, optionalPreviewSourceName: null };
        pointRadius = 12;
        constructor(moduleIdentifier, pointHtmlDivId) {
            super(moduleIdentifier);
            if (pointHtmlDivId == null)
                throw "ObsAppModules.Points, constructor's pointHtmlDivId parameter should be set";
            if (!pointHtmlDivId.startsWith('#'))
                throw "ObsAppModules.Points, constructor's pointHtmlDivId parameter should start with \'#\'";
            this.pointHtmlDivId = pointHtmlDivId;
            this.parentJQuery = $(pointHtmlDivId);
            $(window).on('resize', () => {
                if (this.filter != null)
                    this.set3DFilter(this.filter.sourceName, this.filter.filterName, this.filter.optionalPreviewSourceName);
            });
        }
        async set3DFilter(sourceName, filterName, previewSourceName = null) {
            this.filter.sourceName = sourceName;
            this.filter.filterName = filterName;
            this.filter.optionalPreviewSourceName = previewSourceName;
            this.removeAllPoints();
            await this.createAllPoints(sourceName, filterName);
        }
        async setPreview(previewSourceName) {
            await this.set3DFilter(this.filter.sourceName, this.filter.filterName, previewSourceName);
        }
        onConnectionSet(obs) {
            if (this.obsManager != null)
                throw "OBS_3D_Points: cannot support multiple connections";
            this.obsManager = obs;
        }
        onConnectionRemoved(obs) {
            this.obsManager = null;
        }
        dispatch(arg) {
            console.log(arg.obj);
        }
        onPointDrag(pointLocation, newPosition) {
            let newPoint = { left: newPosition.left, top: newPosition.top };
            let corner = this.htmlToObsCornerPosition(newPoint);
            let pointId = this.getObsPointId(pointLocation);
            let message = '{ "requestType": "SetSourceFilterSettings", "requestData": { "sourceName": "'
                + this.filter.sourceName + '", "filterName": "' + this.filter.filterName
                + '", "filterSettings": { "'
                + pointId + '.X": ' + corner.X + ', "'
                + pointId + '.Y": ' + corner.Y
                + ' }}, "requestId": "' + this.getIdentifier().getId() + '" }';
            this.obsManager.sendMessage(message);
        }
        async createAllPoints(sourceName, filterName) {
            let filter = await this.getObsFilter(sourceName, filterName);
            if (filter == null)
                return;
            let obsPointSet = this.getObsAllPointsPositions(filter);
            this.createPoint(PointLocation.topLeft, obsPointSet.topLeft);
            this.createPoint(PointLocation.topRight, obsPointSet.topRight);
            this.createPoint(PointLocation.bottomRight, obsPointSet.bottomRight);
            this.createPoint(PointLocation.bottomLeft, obsPointSet.bottomLeft);
        }
        removeAllPoints() {
            this.points.forEach((value, index) => {
                value.jQueryPoint.remove();
            });
            this.points.length = 0;
        }
        createPoint(pointLocation, position) {
            let point = $("<div>");
            point.addClass("dot");
            point.attr("id", this.getPointId(pointLocation));
            $(this.pointHtmlDivId).append(point);
            let draggable = createPlainDraggable(point.attr("id"));
            draggable.containment = { left: 0, top: 0, width: '100%', height: '100%' };
            draggable.left = position.left;
            draggable.top = position.top;
            draggable.onDrag = this.getCallbackOnDrag(pointLocation);
            this.points.push({ point: position, jQueryPoint: point, draggable: draggable, location: pointLocation });
        }
        async getObsFilter(sourceName, filterName) {
            if (sourceName == null || sourceName == "")
                return;
            let filter;
            let obj = await this.obsManager.sendMessageAsync({ "requestType": "GetSourceFilterList", "requestData": { "sourceName": sourceName } });
            if (obj == null || obj.responseObj.status == 'error')
                return null;
            let filters = obj.responseObj.responseData.filters;
            if (filters == null)
                return null;
            filters.forEach((value, index) => {
                if (value.filterKind == "streamfx-filter-transform" && value.filterName == filterName)
                    filter = value;
            });
            if (filter == null)
                return null;
            let test = filter.filterSettings["Camera.Mode"];
            if (test != 2) {
                this.obsManager.sendMessage('{ "requestType": "SetSourceFilterSettings", "requestData": { "sourceName": "'
                    + sourceName + '", "filterName": "' + filterName
                    + '", "filterSettings": { "Camera.Mode": 2 } }, "requestId": "ObsAppModules-Points-set-Camera-Mode-2" }');
                await delay(20);
                return this.getObsFilter(sourceName, filterName);
            }
            return filter;
        }
        getObsAllPointsPositions(filter) {
            let pw = this.parentJQuery.width();
            let ph = this.parentJQuery.height();
            let po = this.parentJQuery.offset();
            return {
                topLeft: this.calculatePointPosition(PointLocation.topLeft, filter, pw, ph, po.left, po.top),
                topRight: this.calculatePointPosition(PointLocation.topRight, filter, pw, ph, po.left, po.top),
                bottomRight: this.calculatePointPosition(PointLocation.bottomRight, filter, pw, ph, po.left, po.top),
                bottomLeft: this.calculatePointPosition(PointLocation.bottomLeft, filter, pw, ph, po.left, po.top)
            };
        }
        htmlToObsCornerPosition(position) {
            let obsCornerXorLeft = (position.left + this.pointRadius - this.parentJQuery.offset().left) / this.parentJQuery.width() * 200 - 100;
            let obsCornerYorTop = (position.top + this.pointRadius - this.parentJQuery.offset().top) / this.parentJQuery.height() * 200 - 100;
            return { X: obsCornerXorLeft, Y: obsCornerYorTop };
        }
        calculatePointPosition(pointLocation, filter, parentWidth, parentHeight, parentOffsetLeft, parentOffsetTop) {
            let left = (filter.filterSettings[this.getObsPointId(pointLocation) + ".X"] + 100) / 200 * parentWidth + parentOffsetLeft - this.pointRadius;
            let top = (filter.filterSettings[this.getObsPointId(pointLocation) + ".Y"] + 100) / 200 * parentHeight + parentOffsetTop - this.pointRadius;
            return { left: left, top: top };
        }
        getCallbackOnDrag(pointLocation) {
            switch (pointLocation) {
                case PointLocation.topLeft: return (newPosition) => this.onPointDrag(PointLocation.topLeft, newPosition);
                case PointLocation.topRight: return (newPosition) => this.onPointDrag(PointLocation.topRight, newPosition);
                case PointLocation.bottomRight: return (newPosition) => this.onPointDrag(PointLocation.bottomRight, newPosition);
                case PointLocation.bottomLeft: return (newPosition) => this.onPointDrag(PointLocation.bottomLeft, newPosition);
            }
        }
        getPointId(pointLocation) {
            switch (pointLocation) {
                case PointLocation.topLeft: return "topLeftPoint";
                case PointLocation.topRight: return "topRightPoint";
                case PointLocation.bottomRight: return "bottomRightPoint";
                case PointLocation.bottomLeft: return "bottomLeftPoint";
            }
        }
        getObsPointId(pointLocation) {
            switch (pointLocation) {
                case PointLocation.topLeft: return "Corners.TopLeft";
                case PointLocation.topRight: return "Corners.TopRight";
                case PointLocation.bottomRight: return "Corners.BottomRight";
                case PointLocation.bottomLeft: return "Corners.BottomLeft";
            }
        }
    }
    ObsAppModules.Points = Points;
})(ObsAppModules || (ObsAppModules = {}));
var ObsAppModules;
(function (ObsAppModules) {
    class PreviewUpdater extends OBS.Modules.ModuleBase {
        requestMessage = {
            "requestType": "GetSourceScreenshot",
            "requestData": {
                "imageFormat": "jpg",
                "sourceName": ""
            }
        };
        timer;
        backgroundImage;
        connection;
        updateInterval;
        constructor(identifier, backgroundImage, updateInterval, connection, sourceName, startOnCreate = true) {
            super(identifier);
            this.backgroundImage = backgroundImage;
            this.connection = connection;
            if (sourceName != null)
                this.requestMessage.requestData.sourceName = sourceName;
            this.setIdentifierToObject(this.requestMessage);
            this.updateInterval = updateInterval;
            if (startOnCreate)
                this.start();
        }
        start() {
            if (!this.isRunning())
                this.timer = setInterval(() => this.updateBackground(), this.updateInterval);
        }
        stop() {
            if (this.isRunning()) {
                clearInterval(this.timer);
                this.timer = null;
            }
        }
        isRunning() {
            return this.timer != null;
        }
        updateBackground() {
            if (this.connection.isConnected() && this.requestMessage.requestData.sourceName != "") {
                var message = JSON.stringify(this.requestMessage);
                this.connection.sendMessage(message);
            }
        }
        setSourceName(sourceName) {
            if (sourceName != null && sourceName.length != 0)
                this.requestMessage.requestData.sourceName = sourceName;
            else
                this.removeSourceName();
        }
        removeSourceName() {
            delete this.requestMessage.requestData.sourceName;
        }
        dispatch(arg) {
            this.backgroundImage.src = arg.obj.responseData.imageData;
        }
    }
    ObsAppModules.PreviewUpdater = PreviewUpdater;
})(ObsAppModules || (ObsAppModules = {}));
//# sourceMappingURL=ts-generated.js.map