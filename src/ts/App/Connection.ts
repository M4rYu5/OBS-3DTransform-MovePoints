namespace App.Connection {
    // connection
    export let obsManager: OBS.ObsManager;

    // init
    $(() => {
        initConnection();
    })

    function initConnection() {
        obsManager = new OBS.ObsManager();

        addModules(obsManager);
        return obsManager;
    }


    export namespace obsModules {
        export var previewUpdater: ObsAppModules.PreviewUpdater;
    }



    function addModules(obsManager: OBS.ObsManager) {
        // p
        let previewUpdateModuleId = new OBS.Modules.ModuleIdentifier(ObsAppModules.ModuleType[ObsAppModules.ModuleType.UpdatePreview]);
        obsModules.previewUpdater = new ObsAppModules.PreviewUpdater(previewUpdateModuleId, $("#scenePreview").get()[0] as HTMLImageElement, 100, obsManager);
        obsManager.addModule(obsModules.previewUpdater);
    }
}