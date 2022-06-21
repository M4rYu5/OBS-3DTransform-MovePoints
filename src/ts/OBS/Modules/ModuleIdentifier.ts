namespace OBS.Modules {
    /** used to link sended and received messages*/
    export class ModuleIdentifier {
        // just in case we'll have multipe identifiers that needs to be send as a string
        private reservedCharacter = "◙";
        protected identifier: string;


        /**
         * Create a new ModuleId
         * @param identifier Specify a unique identifier
         */
        constructor(identifier: string = null) {
            this.identifier = identifier;
            if (this.identifier.indexOf(this.getReservedChar()) != -1)
                throw "ModuleIdentifier: ◙ (or Alt + 10 or the 10'th character in asci table) is reserved"
        }

        /** Get module identification. */
        public getId(this: ModuleIdentifier): string {
            return this.identifier;
        }

        /** return the reserved character that cannot be used to identify a module */
        protected getReservedChar() {
            return this.reservedCharacter;
        }
    }
}