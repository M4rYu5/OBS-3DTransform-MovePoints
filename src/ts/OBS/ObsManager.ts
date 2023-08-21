
namespace OBS {


    export type UnhandledMessageCallback = (obj: any) => void;
    export enum Status { ok = "ok", error = "error" }
    export type AsyncResponse = { status: Status, message: string, responseObj: any }

    type ObsAsyncFunctionStore = { promise: Promise<any>, resolve: (obj?: any) => void, reject: (obj?: any) => void };


    /**
     * Adds features over ObsConnection to communicate & control the OBS software.
     */
    export class ObsManager extends ObsConnection {

        /** notified when a message wasn't handled by this object */
        private MessageUnhandledCallback: UnhandledMessageCallback;

        /** OBS Connection => onMessageReceived Handler */
        protected override onMessageReceived(this: ObsManager, jsonMessage: string) {
            super.onMessageReceived(jsonMessage);
            this.messageReceivedHandler(jsonMessage);
        };

        /** Handle the OBS Message */
        protected messageReceivedHandler(this: ObsManager, message: string) {
            let obj = null;
            try { obj = JSON.parse(message); } catch { }
            if (obj == null) {
                CustomLogger.Log("[ObsManager]: empty message received", CustomLogger.LogType.wornign)
                return;
            }
            if (!this.handleMessage(obj)) {
                CustomLogger.Log("[ObsManager]: message unhandled: " + message, CustomLogger.LogType.info);
                this.onMessageUnhandled(message);
            }
        }

        protected handleMessage(this: ObsManager, obj: any): boolean {
            return this.handleModule(obj) || this.handleAsync(obj);
        }

        /** notified when a message wasn't handle by ObsManager 
         * so that another structure could capture it and process accordingly */
        protected onMessageUnhandled(this: ObsManager, message: string) {
            this.MessageUnhandledCallback?.call(this, message);
        }

        /** set a callback function to process unhandled messages */
        protected setUnhandledMessageCallback(this: ObsManager, onUnhandledMessage: UnhandledMessageCallback) {
            this.MessageUnhandledCallback = onUnhandledMessage;
        }





        // #region Async Call
        // ----------------------------------------------------------------------------

        private unresolvedPromises: { [key: string]: ObsAsyncFunctionStore } = {};
        private asyncCallsId: number = 0;
        private asyncTimeoutMillieseconds: number = 1000;
        private asyncMessageIdPrefix: string = "AsyncMessage with unique id: "

        /**
         * Send a message to OBS, returning the promise of a response. The response will be the first message received (related to this call).
         * @param objToSend The object that will be JSON.stringnify and sent to OBS.
         * @returns Promise<AsyncResponse>
         * @note Returns only the first message received. If a call supposed to trigger multiple responses, use a module.
         * @ref more about the object to send: https://github.com/obsproject/obs-websocket/blob/4.x-current/docs/generated/protocol.md
         */
        public sendMessageAsync(this: ObsManager, objToSend: any): Promise<AsyncResponse> {
            if (!this.isConnected())
                return Promise.reject({ status: Status.error, message: "You're not connected to OBS", responseObj: null });

            // make object unique key and iterate id
            let asyncKey: string = this.asyncMessageIdPrefix + this.asyncCallsId;
            if (this.asyncCallsId == Number.MAX_SAFE_INTEGER)
                this.asyncCallsId = Number.MIN_SAFE_INTEGER;
            else
                this.asyncCallsId++;

            // copy the object to be send to OBS and set it's id
            let copy = { ...(objToSend as any) };
            copy["requestId"] = asyncKey;

            // construct the promise to be returned
            let promise: Promise<any> = new Promise<any>((resolve, reject) => {
                this.unresolvedPromises[asyncKey] = { promise: null, resolve: resolve, reject: reject };
            });
            this.unresolvedPromises[asyncKey].promise = promise;

            // set a timeout
            // DON'T REMOVE THIS CALL before reading the timeoutFunc description
            setInterval(this.timeoutFunc, this.asyncTimeoutMillieseconds, asyncKey);

            // send the object to obs
            this.sendMessage(JSON.stringify(copy));

            return promise;
        }
        /** DON'T DELETE: This function is the only mechanism that prevent the unresolvedPromises to stack & await indefinetly. */
        private timeoutFunc = (asyncKey: string) => {
            if (!(asyncKey in this.unresolvedPromises))
                return;

            let localRejectFunc = this.unresolvedPromises[asyncKey].reject;
            delete this.unresolvedPromises[asyncKey];
            localRejectFunc({ status: Status.error, message: "Timeout", responseObj: null });
        }
        
        /**
         * handle the incoming OBS messages by dispatching them to their promise/async call
         * @returns true if the message was handled by a Promise/async call
         */
        private handleAsync(this: ObsManager, obj: any) {
            var messageId = obj["requestId"];
            if(messageId == null)
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

        // #endregion






        // #region message/modules handle code
        // ----------------------------------------------------------------------------

        protected modules: { [k: string]: Modules.IModule } = {};

        /** add a middle layer or "module" to process received messages. (unique id required) */
        public addModule(this: ObsManager, module: Modules.IModule): void {
            if (this.hasModule(module))
                throw "Module already added";

            this.modules[module.getIdentifier().getId()] = module;
            module.onConnectionSet(this);
        }

        /** remove a module, identified by module.getIdentifier().getId() */
        public removeModule(this: ObsManager, module: Modules.IModule): void {
            this.removeModuleById(module.getIdentifier().getId());
        }

        /** remove a module using it's id */
        public removeModuleById(this: ObsManager, moduleId: string): void {
            if (!this.hasModuleId(moduleId))
                return;
            this.modules[moduleId].onConnectionRemoved(this);
            delete this.modules[moduleId]
        }

        /** check if a module was already added (by comparing they're unique id) */
        public hasModule(this: ObsManager, module: Modules.IModule): boolean {
            return this.hasModuleId(module.getIdentifier().getId());
        }

        /** check if a module was already added (by comparing moduleId with existing module id's) */
        public hasModuleId(this: ObsManager, moduleId: string): boolean {
            return moduleId in this.modules;
        }

        /**
         * handle the incoming OBS messages by dispatching them to modules
         * @returns true if the message was handled by a module
         */
        protected handleModule(this: ObsManager, obj: any): boolean {
            var moduleId = obj["requestId"];
            if (!this.hasModuleId(moduleId))
                return false;

            var module = this.modules[moduleId];
            var arg = new Modules.DispatchArgs();
            arg.obj = obj;
            arg.connection = this;
            module.dispatch(arg);

            return true;
        }
        //#endregion


    }
}