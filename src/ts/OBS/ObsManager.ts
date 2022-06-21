namespace OBS {

    export type UnhandledMessageCallback = (obj: any) => void;
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
                this.onMessageUnhandled(message);
            }
            else {
                CustomLogger.Log("[ObsManager]: message unhandled: " + message, CustomLogger.LogType.info);
            }
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



        //#region message/modules handle code

        protected modules:  { [k: string]: Modules.IModule } = {};

        /** add a middle layer or "module" to process received messages. (unique id required) */
        public addModule(this: ObsManager, module: Modules.IModule): void {
            if(this.hasModule(module))
               throw "Module already added";
                
            this.modules[module.getIdentifier().getId()] = module;
        }
        
        /** remove a module, identified by module.getIdentifier().getId() */
        public removeModule(this:ObsManager, module: Modules.IModule): void {
            this.removeModuleById(module.getIdentifier().getId());
        }

        /** remove a module using it's id */
        public removeModuleById(this:ObsManager, moduleId: string): void{
            if(!this.hasModuleId(moduleId))
                return;
            delete this.modules[moduleId]
        }

        /** check if a module was already added (by comparing they're unique id) */
        public hasModule(this:ObsManager, module: Modules.IModule): boolean{
           return this.hasModuleId(module.getIdentifier().getId());
        }

        /** check if a module was already added (by comparing moduleId with existing module id's) */
        public hasModuleId(this:ObsManager, moduleId: string): boolean{
            return moduleId in this.modules;
        }

        /** handle the incoming OBS messages by dispatching them to modules */
        protected handleMessage(this: ObsManager, obj: any): boolean{
            var moduleId = obj["message-id"];
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