namespace OBS {

    export type UnhandledMessageCallback = (obj: any) => void;
    export class ObsManager {

        private connection;

        /** notified about connect()'s result */
        private ConnectionResultCallback: ConnectionResultCallback;
        /** notified when the socket disconnected */
        private DisconnectedCallback: DisconnectedCallback;
        /** notified when a message wasn't handled by this object */
        private MessageUnhandledCallback: UnhandledMessageCallback;


        public constructor() {
            this.connection = new ObsConnection();
            this.connection.setConnectionResultCallback(this.onConnectionResultCallback)
            this.connection.setDisconnectedCallback(this.onDisconnectedHandler);
            this.connection.setMessageReceivedCallback(this.messageReceivedHandler);
        }

        protected messageReceivedHandler = function (message: string) {
            let obj = null;
            try { obj = JSON.parse(message); } catch { }
            if(obj == null){
                CustomLogger.Log("[ObsManager]: empty message received", CustomLogger.LogType.wornign)
                return;
            }
            if (!this.handleMessage(obj)){
                this.onMessageUnhandled(this, message);
            }
            else{
                CustomLogger.Log("[ObsManager]: message unhandled: " + message, CustomLogger.LogType.info);
            }
        }

        protected onDisconnectedHandler = () => this.DisconnectedCallback?.call(this);
        protected onMessageUnhandled = (message: string) => this.MessageUnhandledCallback?.call(this, message);
        protected onConnectionResultCallback = (result: ConnectionResult) => this.ConnectionResultCallback?.call(this, result);


        public setConnectionResultCallback(onConnectionResult: ConnectionResultCallback) {
            this.ConnectionResultCallback = onConnectionResult;
        }

        public setDisconnectedCallback(onDisconnected: DisconnectedCallback) {
            this.DisconnectedCallback = onDisconnected;
        }

        public setUnhandledMessage(onUnhandledMessage: UnhandledMessageCallback) {
            this.MessageUnhandledCallback = onUnhandledMessage;
        }

        public connect = (ip: string, port: string, password: string) => this.connection.connect(ip, port, password)

        public getConnection = () => this.connection;


        // -------------------------------------------------------------------
        // from this point down the code is fort handling the message
        // and will continue grow with the app
        //    - since this code will be somewhere and it can't be reused
        //      (for me) it doesn't make sense to construct any new structures




        // you can add a new caller/handler by
        // duplicating _descriptivDemoFunctionName_ elements

        protected handleMessage = (obj: any) => {
            switch(obj["message-id"]){
                // case ObsMessagesIds._descriptivDemoFunctionName_:
                //     this._descriptivDemoFunctionName_Dispatcher(obj);
                default:
                     return false;
            }
        }

        // public _descriptivDemoFunctionName_Callback: (installed: boolean) => void;
        // public _descriptivDemoFunctionName_(){
            
        // }
        // private _descriptivDemoFunctionName_Dispatcher = (respoinse: any) => {
            
        // }



    }

    
    enum ObsMessagesIds{
        // _descriptivDemoFunctionName_ = "33402fe3d14f",
        
    }
}