namespace OBS {

    export type UnhandledMessageCallback = (obj: any) => void;
    export class ObsManager extends ObsConnection {


        /** notified when a message wasn't handled by this object */
        private MessageUnhandledCallback: UnhandledMessageCallback;


        protected override onMessageReceived(this: ObsManager, jsonMessage: string) {
            super.onMessageReceived(jsonMessage);
            this.messageReceivedHandler(jsonMessage);
        };


        protected messageReceivedHandler(this: ObsManager, message: string) {
            let obj = null;
            try { obj = JSON.parse(message); } catch { }
            if (obj == null) {
                CustomLogger.Log("[ObsManager]: empty message received", CustomLogger.LogType.wornign)
                return;
            }
            if (!this.handleMessage(obj)) {
                this.onMessageUnhandled(message);
            }
            else {
                CustomLogger.Log("[ObsManager]: message unhandled: " + message, CustomLogger.LogType.info);
            }
        }

        protected onMessageUnhandled(this: ObsManager, message: string) {
            this.MessageUnhandledCallback?.call(this, message);
        }


        protected setUnhandledMessageCallback(this: ObsManager, onUnhandledMessage: UnhandledMessageCallback) {
            this.MessageUnhandledCallback = onUnhandledMessage;
        }



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