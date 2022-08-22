namespace App.Connection {
    // connection
    export let obsManager: OBS.ObsManager;

    // init
    export function init(){
        initConnection();
    }

    function initConnection() {
        obsManager = new OBS.ObsManager();

        addModules(obsManager);
        return obsManager;
    }


    export namespace obsModules {
        export var previewUpdater: ObsAppModules.PreviewUpdater;
        export var cornetPoints: ObsAppModules.Points;
    }



    function addModules(obsManager: OBS.ObsManager) {
        // preview
        let previewUpdateModuleId = getModuleIdFromModuleType(ObsAppModules.ModuleType.UpdatePreview);
        obsModules.previewUpdater = new ObsAppModules.PreviewUpdater(previewUpdateModuleId, $("#scenePreview").get()[0] as HTMLImageElement, 100, obsManager);
        obsManager.addModule(obsModules.previewUpdater);

        // 3d transform corner points module
        let cornerPointsModuleId = getModuleIdFromModuleType(ObsAppModules.ModuleType.Point3DTransform);
        obsModules.cornetPoints = new ObsAppModules.Points(cornerPointsModuleId, "#points");
        obsManager.addModule(obsModules.cornetPoints);
    }

    function getModuleIdFromModuleType(moduleType: ObsAppModules.ModuleType): OBS.Modules.ModuleIdentifier
    {
        return new OBS.Modules.ModuleIdentifier(ObsAppModules.ModuleType[moduleType])
    }
}