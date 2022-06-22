namespace OBS.Modules{
    /** specify how a module should be structured */
    export interface IModule{
        /** Used to identify a type or specific sub-type of messages/modules (used as "message-id" param)*/
        getIdentifier(): ModuleIdentifier;

        /** Use this to handle the responise*/
        dispatch(arg: DispatchArgs): void;
    }
}