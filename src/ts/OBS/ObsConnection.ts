namespace OBS {


    export enum ConnectionResult {
        succeed,
        socketAddressUnreachable,
        wrongAuthDetails,
        socketConnectionError
    }

    export type ConnectionResultCallback = (connection: ConnectionResult) => void;
    export type DisconnectedCallback = () => void;
    export type MessageReceivedCallback = (jsonMessage: string) => void;



    export class ObsConnection {


        private password: string = null;
        private tryedToConnect: boolean = false;

        private checkAuthMessageIdentifier: string = "MessageIdentifier-CheckAuthRequired";
        private tryAuthMessageIdentifier: string = "MessageIdentifier-TryAuth";

        protected webSocket: WebSocket = null;


        /** Set this handler to get notified about connect()'s result */
        private connectionResultCallback: ConnectionResultCallback = null;
        /** Set this handler to get notirifed when the socket disconnected */
        private disconnectedCallback: DisconnectedCallback = null;
        /** Set this handler to get json messages from OBS WebSocket */
        private messageReceivedCallback: MessageReceivedCallback = null;





        /** 
         * set the connection result handler
         * @param onConnectionResult will be callded, after a connection attempt, with connection result
         */
        public setConnectionResultCallback(onConnectionResult: ConnectionResultCallback) {
            this.connectionResultCallback = onConnectionResult;
        }

        /**
         * set the disconnected handler
         * @param onDisconnected will be called on connection disconnected
         */
        public setDisconnectedCallback(onDisconnected: DisconnectedCallback) {
            this.disconnectedCallback = onDisconnected;
        }

        /**
         * set a handler to receive raw messages from OBS WebSocket
         * @param onMessageReceived called when a new message was received from OBS (does not include messages handled by this (ObsConnection) object)
         */
        public setMessageReceivedCallback(onMessageReceived: MessageReceivedCallback) {
            this.messageReceivedCallback = onMessageReceived;
        }



        /**
         * Send json message to OBS WebSocket
         * @param jsonMessage json message; see more here: https://github.com/obsproject/obs-websocket/blob/4.x-current/docs/generated/protocol.md#getversion
         * @returns returns false when the message could not be send
         */
        public sendMessage(jsonMessage: string): boolean {
            if (!this.isConnected())
                return false;

            try { this.webSocket.send(jsonMessage); }
            catch { return false; }

            return true;
        }

        public isConnected() {
            return this.webSocket != null;
        }

        /** Connect and authenticate to OBS WebSocket */
        public connect(ip: string = "127.0.0.1", port: string = "4444", password: string = ""): void {
            if (this.isConnected())
                this.resetSocket();

            try {
                this.webSocket = new WebSocket(`ws://${ip}:${port}`);

            }
            catch {
                this.setObsConnectionResult(ConnectionResult.socketAddressUnreachable);
                this.webSocket = null;
                return;
            }

            this.webSocket.onopen = this.socketOnOpen;
            this.webSocket.onmessage = this.socketOnMessage;
            this.webSocket.onclose = this.socketOnClose;
            this.webSocket.onerror = this.socketOnError;
            this.password = password;
        }

        public disconnect() {
            this.password = null;

            if (this.isConnected())
                this.webSocket.close();
            this.resetSocket();
        }






        /** clean any link to webSocket and close it */
        private resetSocket() {
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
        }

        private setObsConnectionResult(connection: ConnectionResult) {
            this.tryedToConnect = true;
            this.onConnectResult(connection);
            CustomLogger.Log("[connectionResult]: " + connection, CustomLogger.LogType.info);
        }

        /** onOpen webSocket handler */
        private socketOnOpen = (event: Event) => {
            CustomLogger.Log("[OPEN] Connection established");
            // check if auth is required
            this.webSocket.send('{"request-type": "GetAuthRequired", "message-id": "' + this.checkAuthMessageIdentifier + '"}');
        }
        /** onMessage webSocket handler */
        private socketOnMessage = (event: MessageEvent) => {
            if (this.tryedToConnect == false) {
                CustomLogger.Log("[RECEIVED auth]: " + event.data)
                this.resolveAuth(event.data);
            }
            else {
                CustomLogger.Log("[RECEIVED external]: " + event.data)
                this.onMessageReceived(event.data);
            }
        }
        /** onClose webSocket handler */
        private socketOnClose = (event: CloseEvent) => {
            if (event.wasClean) {
                CustomLogger.Log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
            } else {
                // e.g. server process killed or network down
                // event.code is usually 1006 in this case
                CustomLogger.Log('[close] Connection died');
            }

            this.resetSocket();
            this.onDisconnected();
        }
        /** onError webSocket handler */
        private socketOnError = (error: Event) => {
            // something went wrong with the connection,
            // onclose will be called
            CustomLogger.Log(`[error] ${JSON.stringify(error)}`);
        }

        /** handle the connection and auth flow */
        private resolveAuth(obj: string): void {
            let data = JSON.parse(obj);

            // process message from GetAuthRequired
            if (data["message-id"] == this.checkAuthMessageIdentifier) {
                if (data.authRequired) {
                    // send the auth token to the server, and handle the result in another if branch
                    this.auth(data.challenge, data.salt);
                }
                else {
                    // the obs server is not password protected; all set
                    this.setObsConnectionResult(ConnectionResult.succeed)
                }
            }

            // received a response from owr authentication request
            else if (data["message-id"] == this.tryAuthMessageIdentifier) {
                if (data.status == "ok") {
                    this.setObsConnectionResult(ConnectionResult.succeed);
                }
                if (data.status == "error") {
                    this.setObsConnectionResult(ConnectionResult.wrongAuthDetails)
                }
            }
        }

        /** generate and sends the auth token */
        private auth(challenge: string, salt: string) {
            let password: string = this.password;
            this.password = null;

            // hash & stuff for Auth in obs-websocket,
            // more here: https://github.com/obsproject/obs-websocket/blob/4.x-current/docs/generated/protocol.md#authentication
            let sha = sha256(password + salt);
            let shaPchallenge = hexToBase64(sha) + challenge;
            let sha2 = sha256(shaPchallenge);
            let authToken = hexToBase64(sha2);

            let temp = {
                "request-type": "Authenticate",
                "auth": authToken,
                "message-id": this.tryAuthMessageIdentifier
            }

            CustomLogger.Log('[Sending Auth Token]', CustomLogger.LogType.info);
            let token: string = JSON.stringify(temp);
            this.webSocket.send(token);
            //CustomLogger.Log(a);

        }


        /** notified about connect()'s result */
        protected onConnectResult = (connection: ConnectionResult) => {
            this.connectionResultCallback?.call(this, connection);
        };
        /** notiried when the socket disconnected */
        protected onDisconnected = () => {
            this.disconnectedCallback?.call(this);
        };
        /** json messages from OBS WebSocket */
        protected onMessageReceived = (jsonMessage: string) => {
            this.messageReceivedCallback?.call(jsonMessage);
        };
    }

}
