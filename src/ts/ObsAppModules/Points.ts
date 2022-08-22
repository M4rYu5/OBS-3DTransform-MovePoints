namespace ObsAppModules {


    export type PointSet = { topLeft: Point, topRight: Point, bottomLeft: Point, bottomRight: Point, };
    export type Point = { top: number, left: number };
    export enum PointLocation {
        topLeft,
        topRight,
        bottomLeft,
        bottomRight,
    }

    type PointDraggableLocation = { point: Point, jQueryPoint: JQuery<HTMLElement>, draggable: any, location: PointLocation }
    type FilterIdentifier = { source: string, filter: string }

    export class Points extends OBS.Modules.ModuleBase {

        private obsManager: OBS.ObsManager = null;
        private filter: FilterIdentifier = null;
        private pointHtmlDivId: string;
        private points: PointDraggableLocation[] = [];


        constructor(moduleIdentifier: OBS.Modules.ModuleIdentifier, pointHtmlDivId: string) {
            super(moduleIdentifier);
            if (pointHtmlDivId == null)
                throw "ObsAppModules.Points, constructor's pointHtmlDivId parameter should be set";
            if (!pointHtmlDivId.startsWith('#'))
                throw "ObsAppModules.Points, constructor's pointHtmlDivId parameter should start with \'#\'"
            this.pointHtmlDivId = pointHtmlDivId;

        }




        public set3DFilter(this: Points, source: string, filter: string) {
            this.filter = { source: source, filter: filter }

            this.removePoints();
            this.createAllPoints(source, filter);

        }




        public override onConnectionSet(this: Points, obs: OBS.ObsManager): void {
            if (this.obsManager != null)
                throw "OBS_3D_Points: cannot support multiple connections"
            this.obsManager = obs;
        }
        public override onConnectionRemoved(obs: OBS.ObsManager): void {
            this.obsManager = null;
        }

        public override dispatch(this: Points, arg: OBS.Modules.DispatchArgs): void {

        }



        protected onPointDrag(this: Points, pointLocation: PointLocation, newPosition: any): void {
            console.log(newPosition.left, newPosition.top);
            //throw "not set";
        }

        protected async createAllPoints(sourceName: string, filterName: string): Promise<void> {
            let filter: any = await this.getObsFilter(sourceName, filterName);
            if(filter == null)
                return;

            let obsPointSet: PointSet = this.getObsAllPoints(filter);

            this.createPoint(PointLocation.topLeft, obsPointSet.topLeft);
            this.createPoint(PointLocation.topRight, obsPointSet.topRight);
            this.createPoint(PointLocation.bottomRight, obsPointSet.bottomRight);
            this.createPoint(PointLocation.bottomLeft, obsPointSet.bottomLeft);
        }


        // {
        //     "filters": [
        //         {
        //             "enabled": true,
        //             "name": "3D Transform",
        //             "settings": {
        //                 "Camera.FieldOfView": 107.8,
        //                 "Camera.Mode": 2,
        //                 "Commit": "g81a96998",
        //                 "Corners.BottomLeft.X": -39,
        //                 "Corners.BottomLeft.Y": 50.780000000000001,
        //                 "Corners.BottomRight.X": 29.02,
        //                 "Corners.BottomRight.Y": 69.430000000000007,
        //                 "Corners.TopLeft.X": -56.990000000000002,
        //                 "Corners.TopLeft.Y": -3.1099999999999999,
        //                 "Corners.TopRight.X": 63.210000000000001,
        //                 "Corners.TopRight.Y": -12.44,
        //                 "Mipmapping": false,
        //                 "Rotation.X": 9.0999999999999996,
        //                 "Rotation.Y": 7.0800000000000001,
        //                 "Version": 47244705792,
        //                 "enabled": "true"
        //             },
        //             "type": "streamfx-filter-transform"
        //         }
        //     ],
        //     "message-id": "id",
        //     "status": "ok"
        // }





        protected removePoints(this: Points) {
            this.points.forEach((value, index) => {
                value.jQueryPoint.remove();
            })
            this.points.length = 0;
        }

        protected createPoint(pointLocation: PointLocation, position: Point) {
            let point = $("<div>");
            point.addClass("dot");
            point.attr("id", this.getPointId(pointLocation));
            $(this.pointHtmlDivId).append(point);

            // created with PlainDraggable, more info here https://anseki.github.io/plain-draggable
            let draggable = createPlainDraggable(point.attr("id"));
            draggable.containment = { left: 0, top: 0, width: '100%', height: '100%' };
            draggable.left = position.left;
            draggable.top = position.top;
            draggable.onDrag = this.getCallbackOnDrag(pointLocation)

            this.points.push({ point: position, jQueryPoint: point, draggable: draggable, location: pointLocation })
        }

        protected async getObsFilter(this: Points, sourceName: string, filterName: string): Promise<any> {
            let filter: any;

            // find filter
            let obj = await this.obsManager.sendMessageAsync({ "request-type": "GetSourceFilters", "sourceName": sourceName });
            let filters: any[] = obj.responseObj.filters;
            filters.forEach((value, index) => {
                if (value.type == "streamfx-filter-transform" && value.name == filterName)
                    filter = value;
            });

            if (filter == null)
                return null;

            // we need the Camera.Mode to be in corner pin mode or mode 2 (as number not string)
            let test = filter.settings["Camera.Mode"];
            if (test != 2) {
                this.obsManager.sendMessage(
                    '{ "request-type": "SetSourceFilterSettings", "sourceName": "'
                    + sourceName + '", "filterName": "' + filterName
                    + '", "filterSettings": { "Camera.Mode": 2 }, "message-id": "id" }');
                await delay(20)
                return this.getObsFilter(sourceName, filterName);
            }

            return filter
        }

        protected getObsAllPoints(this: Points, filter: any): PointSet {
            let pointRadius = 12;
            let parent = $(this.pointHtmlDivId);
            let pw = parent.width();
            let ph = parent.height();
            let po = parent.offset();


            return {topLeft: this.calculatePointPosition(PointLocation.topLeft, filter, pw, ph, po.left, po.top, pointRadius),
                    topRight: this.calculatePointPosition(PointLocation.topRight, filter, pw, ph, po.left, po.top, pointRadius),
                    bottomRight: this.calculatePointPosition(PointLocation.bottomRight, filter, pw, ph, po.left, po.top, pointRadius),
                    bottomLeft: this.calculatePointPosition(PointLocation.bottomLeft, filter, pw, ph, po.left, po.top, pointRadius)};
        }

        protected calculatePointPosition(this: Points, pointLocation: PointLocation, filter: any, parentWidth: number, parentHeight: number, parentOffsetLeft: number, parentOffsetTop: number, pointRadius: number): Point{

            let testLeftTopL = (filter.settings[this.getObsPointId(pointLocation) + ".X"] + 100) / 200 * parentWidth + parentOffsetLeft - pointRadius;
            let testLeftTopT = (filter.settings[this.getObsPointId(pointLocation) + ".Y"] + 100) / 200 * parentHeight + parentOffsetTop - pointRadius;
            return { left: testLeftTopL, top: testLeftTopT };
        }

        private getCallbackOnDrag(pointLocation: PointLocation): (newPosition: any) => void {
            switch (pointLocation) {
                case PointLocation.topLeft: return (newPosition) => this.onPointDrag(PointLocation.topLeft, newPosition);
                case PointLocation.topRight: return (newPosition) => this.onPointDrag(PointLocation.topRight, newPosition);
                case PointLocation.bottomRight: return (newPosition) => this.onPointDrag(PointLocation.bottomRight, newPosition);
                case PointLocation.bottomLeft: return (newPosition) => this.onPointDrag(PointLocation.bottomLeft, newPosition);
            }
        }

        protected getPointId(pointLocation: PointLocation): string {
            switch (pointLocation) {
                case PointLocation.topLeft: return "topLeftPoint";
                case PointLocation.topRight: return "topRightPoint";
                case PointLocation.bottomRight: return "bottomRightPoint";
                case PointLocation.bottomLeft: return "bottomLeftPoint";
            }
        }

        protected getObsPointId(pointLocation: PointLocation): string {
            switch (pointLocation) {
                case PointLocation.topLeft: return "Corners.TopLeft";
                case PointLocation.topRight: return "Corners.TopRight";
                case PointLocation.bottomRight: return "Corners.BottomRight";
                case PointLocation.bottomLeft: return "Corners.BottomLeft";
            }
        }

    }


}