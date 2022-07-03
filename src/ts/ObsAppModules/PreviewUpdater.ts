namespace ObsAppModules {
    export class PreviewUpdater extends OBS.Modules.ModuleBase {

        private requestMessage: any = {
            "request-type": "TakeSourceScreenshot",
            "embedPictureFormat": "jpg"
        }

        private timer?: number;

        protected backgroundImage: HTMLImageElement;
        protected connection: OBS.ObsConnection;
        protected updateInterval: number;

        constructor(identifier: OBS.Modules.ModuleIdentifier, backgroundImage: HTMLImageElement, updateInterval: number, connection: OBS.ObsConnection, sourceName?: string, startOnCreate: boolean = true) {
            super(identifier)

            this.backgroundImage = backgroundImage;
            this.connection = connection;
            if (sourceName != null)
                this.requestMessage["sourceName"] = sourceName;
            this.setIdentifierToObject(this.requestMessage);

            this.updateInterval = updateInterval;
            if (startOnCreate)
                this.start();
        }


        public start(this: PreviewUpdater) {
            if (!this.isRunning())
                this.timer = setInterval(() => this.updateBackground(), this.updateInterval);
        }

        public stop(this: PreviewUpdater) {
            if (this.isRunning()) {
                clearInterval(this.timer);
                this.timer = null;
            }
        }

        public isRunning(this: PreviewUpdater) {
            return this.timer != null;
        }


        // called from setInterval
        protected updateBackground() {
            if (this.connection.isConnected()) {
                var message = JSON.stringify(this.requestMessage);
                this.connection.sendMessage(message);
            }
        }

        /** set the source name of which a screenshot will be taken off (not necessarily a scene)*/
        public setSourceName(this: PreviewUpdater, sourceName?: string) {
            if (sourceName != null && sourceName.length != 0)
                this.requestMessage["sourceName"] = sourceName;
            else
                this.removeSourceName();
        }


        /** remove the source name and go back to default (default: current scene) */
        public removeSourceName(this: PreviewUpdater) {
            delete this.requestMessage["sourceName"];
        }

        /** handle the received message (the image) */
        dispatch(this: PreviewUpdater, arg: OBS.Modules.DispatchArgs): void {
            this.backgroundImage.src = arg.obj["img"];
        }

    }
}



