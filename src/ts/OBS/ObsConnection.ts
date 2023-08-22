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


    /**
     * Creates a valid connection between client and OBS.
     */
    export class ObsConnection {


        private password: string = null;

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

            let message_comp = '{"op": 6, "d": ' + jsonMessage + '}';
            try { this.webSocket.send(message_comp);}
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

                //this.webSocket.addEventListener('open', this.socketOnOpen);

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

        /** Disconnect from web socket */
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
        }

        private setObsConnectionResult(connection: ConnectionResult) {
            this.onConnectResult(connection);
            CustomLogger.Log("[connectionResult]: " + ConnectionResult[connection], CustomLogger.LogType.info);
        }

        /** onOpen webSocket handler */
        private socketOnOpen = (event: Event) => {
            CustomLogger.Log("[OPEN] Connection established");
        }

        /** onMessage webSocket handler */
        private socketOnMessage = (event: MessageEvent) => {
            let obj = JSON.parse(event.data);

            if (this.handleAuth(obj, event.data)) {
                return;
            }
            else if (obj.op == 7) {
                this.onMessageReceived(JSON.stringify(obj.d));
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



        /**
         * Handles the client authentication
         * @param obj the received object from obs-websocket
         * @param obj_json the received json from obs-websocket
         * @returns returns true when the message is the destined to be used in auth flow.
         */
        private handleAuth(obj: any, obj_json: string): boolean {
            if (obj.op == 0) {
                if (obj.d.rpcVersion != 1) {
                    CustomLogger.Log("server responded with rpc version " + obj.d.rpcVersion + ", but the client expected version 1.", CustomLogger.LogType.info);
                }
                if (obj.d.authentication != null) {
                    let authToken = this.compute_auth_token(obj.d.authentication.challenge, obj.d.authentication.salt)
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
                else{
                    CustomLogger.Log("[AUTH DONE]", CustomLogger.LogType.info);
                }
            }
            if (obj.op == 1){
                // this is the message send from the client to the server after Hello
                return true;
            }
            if (obj.op == 2){
                if (obj.d.negotiatedRpcVersion != 1) {
                    CustomLogger.Log("client requested rpcVersion 1, but the server responded with rpcVersion " + obj.d.negotiatedRpcVersion + ".", CustomLogger.LogType.wornign);
                }
                CustomLogger.Log("[AUTH DONE]", CustomLogger.LogType.info);
                return true;
            }

            return false;
        }


        /** uses the challenge and salt received from the server and with the current password will compute the auth token */
        private compute_auth_token(challenge: string, salt: string){
            let password: string = this.password;
            this.password = null;

            // hash & stuff for Auth in obs-websocket,
            // more here: https://github.com/obsproject/obs-websocket/blob/4.x-current/docs/generated/protocol.md#authentication
            let sha = sha256(password + salt);
            let shaPchallenge = hexToBase64(sha) + challenge;
            let sha2 = sha256(shaPchallenge);
            let authToken = hexToBase64(sha2);
            return authToken;
        }


        /** notified about connect()'s result */
        protected onConnectResult(this: ObsConnection, connection: ConnectionResult) {
            this.connectionResultCallback?.call(this, connection);
        };
        /** notiried when the socket disconnected */
        protected onDisconnected(this: ObsConnection) {
            this.disconnectedCallback?.call(this);
        };
        /** json messages from OBS WebSocket */
        protected onMessageReceived(this: ObsConnection, jsonMessage: string) {
            this.messageReceivedCallback?.call(this, jsonMessage);
        };
    }

}
