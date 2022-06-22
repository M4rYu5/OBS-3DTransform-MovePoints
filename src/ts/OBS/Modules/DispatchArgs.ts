namespace OBS.Modules{
    /** encapsulate IModule.dispatch function's arguments */
    export class DispatchArgs{
        obj: any;
        connection: ObsConnection;

        constructor();
        constructor(obj?: any, connection?: ObsConnection){
            this.obj = obj;
            this.connection = connection;
        }
    }
}