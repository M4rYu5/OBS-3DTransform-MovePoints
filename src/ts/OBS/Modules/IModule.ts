namespace OBS.Modules{
    /** specify how a module should be structured */
    export interface IModule{
        /** Used to identify a type or specific sub-type of messages/modules (used as "requestId" param)*/
        getIdentifier(): ModuleIdentifier;

        /** Use this to handle the responise*/
        dispatch(arg: DispatchArgs): void;

        onConnectionSet(obs: ObsManager): void
        onConnectionRemoved(obs: ObsManager): void
    }
}