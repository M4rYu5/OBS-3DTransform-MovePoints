namespace ObsAppModules {


    type PointSet = { topLeft: Point, topRight: Point, bottomLeft: Point, bottomRight: Point, };
    type Point = { top: number, left: number };
    type Corner = { Y: number, X: number };
    enum PointLocation {
        topLeft,
        topRight,
        bottomLeft,
        bottomRight,
    }

    type PointDraggableLocation = { point: Point, jQueryPoint: JQuery<HTMLElement>, draggable: any, location: PointLocation }
    type FilterIdentifier = { sourceName: string, filterName: string }

    export class Points extends OBS.Modules.ModuleBase {

        private points: PointDraggableLocation[] = [];

        protected obsManager: OBS.ObsManager = null;
        protected filter: FilterIdentifier = null;
        protected pointHtmlDivId: string;
        protected parentJQuery: JQuery<HTMLElement>;

        protected readonly pointRadius: number = 12;

        constructor(moduleIdentifier: OBS.Modules.ModuleIdentifier, pointHtmlDivId: string) {
            super(moduleIdentifier);
            if (pointHtmlDivId == null)
                throw "ObsAppModules.Points, constructor's pointHtmlDivId parameter should be set";
            if (!pointHtmlDivId.startsWith('#'))
                throw "ObsAppModules.Points, constructor's pointHtmlDivId parameter should start with \'#\'"
            this.pointHtmlDivId = pointHtmlDivId;

            this.parentJQuery = $(pointHtmlDivId);
        }




        public set3DFilter(this: Points, source: string, filter: string) {
            this.filter = { sourceName: source, filterName: filter }

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

            let corner: Corner = this.calculateCornerPosition(pointLocation, newPosition)
            let pointId: string = this.getObsPointId(pointLocation);

            let message =  '{ "request-type": "SetSourceFilterSettings", "sourceName": "'
                                + this.filter.sourceName + '", "filterName": "' + this.filter.filterName
                                + '", "filterSettings": { "'
                                + pointId + '.X": ' + corner.X + ', "'
                                + pointId + '.Y": ' + corner.Y
                                +' }, "message-id": "ObsAppModules-Points-set-'+ pointId.replace('.', '-') + '-Point" }';

            this.obsManager.sendMessage(message);        
        }

        protected async createAllPoints(sourceName: string, filterName: string): Promise<void> {
            let filter: any = await this.getObsFilter(sourceName, filterName);
            if (filter == null)
                return;

            let obsPointSet: PointSet = this.getObsAllPoints(filter);

            this.createPoint(PointLocation.topLeft, obsPointSet.topLeft);
            this.createPoint(PointLocation.topRight, obsPointSet.topRight);
            this.createPoint(PointLocation.bottomRight, obsPointSet.bottomRight);
            this.createPoint(PointLocation.bottomLeft, obsPointSet.bottomLeft);
        }



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
                    + '", "filterSettings": { "Camera.Mode": 2 }, "message-id": "ObsAppModules-Points-set-Camera-Mode-2" }');
                await delay(20)
                return this.getObsFilter(sourceName, filterName);
            }

            return filter
        }

        protected getObsAllPoints(this: Points, filter: any): PointSet {
            let pw = this.parentJQuery.width();
            let ph = this.parentJQuery.height();
            let po = this.parentJQuery.offset();


            return {
                topLeft: this.calculatePointPosition(PointLocation.topLeft, filter, pw, ph, po.left, po.top),
                topRight: this.calculatePointPosition(PointLocation.topRight, filter, pw, ph, po.left, po.top),
                bottomRight: this.calculatePointPosition(PointLocation.bottomRight, filter, pw, ph, po.left, po.top),
                bottomLeft: this.calculatePointPosition(PointLocation.bottomLeft, filter, pw, ph, po.left, po.top)
            };
        }

        protected calculateCornerPosition(this: Points, pointLocation: PointLocation, newPosition: any): Corner {
            let obsCornerXorLeft = (newPosition.left + this.pointRadius - this.parentJQuery.offset().left) / this.parentJQuery.width() * 200 - 100;
            let obsCornerYorTop = (newPosition.top + this.pointRadius - this.parentJQuery.offset().top) / this.parentJQuery.height() * 200 - 100;
            return { X: obsCornerXorLeft, Y: obsCornerYorTop }
        }

        protected calculatePointPosition(this: Points, pointLocation: PointLocation, filter: any, parentWidth: number, parentHeight: number, parentOffsetLeft: number, parentOffsetTop: number): Point {

            let left = (filter.settings[this.getObsPointId(pointLocation) + ".X"] + 100) / 200 * parentWidth + parentOffsetLeft - this.pointRadius;
            let top = (filter.settings[this.getObsPointId(pointLocation) + ".Y"] + 100) / 200 * parentHeight + parentOffsetTop - this.pointRadius;
            return { left: left, top: top };
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