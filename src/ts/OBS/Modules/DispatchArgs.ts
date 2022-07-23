namespace OBS.Modules{
    /** encapsulate IModule.dispatch function's arguments */
    export class DispatchArgs{
        /** Parsed object received from OBS WebSocket */
        obj: any;
        connection: ObsConnection;

        constructor();
        /***
         * @param obj Parsed object received from OBS WebSocket
         */
        constructor(obj?: any, connection?: ObsConnection){
            this.obj = obj;
            this.connection = connection;
        }
    }
}