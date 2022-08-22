namespace OBS.Modules{
    /** adds identification logic over IModule*/
    export abstract class ModuleBase implements IModule{

        private id: ModuleIdentifier;

        abstract dispatch(arg: DispatchArgs): void;

        onConnectionSet(obs: ObsManager): void{};
        onConnectionRemoved(obs: ObsManager): void{};
        
        constructor(identifier: ModuleIdentifier){
            this.id = identifier;
        }

        /** get's the module identifier class */
        public getIdentifier(): ModuleIdentifier{
            return this.id;
        }
        
        /** set the "message-id" property to object parameter. */
        protected setIdentifierToObject(object: any){
            object["message-id"] = this.getIdentifier().getId();
        }

    }
}