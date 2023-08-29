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
    type FilterIdentifier = { sourceName: string, filterName: string, optionalPreviewSourceName: string }
    type OffsetAndScale = { leftOffset: number, topOffset: number, horizontalScale: number, verticalScale: number }
    type OffsetAndSize = { leftOffset: number, topOffset: number, horizontalSize: number, verticalSize: number }

    /**
     * Generate the Draggable points that will be used to manipulate each corner of 3D Transform Filter in OBS
     */
    export class Points extends OBS.Modules.ModuleBase {

        private points: PointDraggableLocation[] = [];

        protected obsManager: OBS.ObsManager = null;
        protected pointHtmlDivId: string;
        protected parentJQuery: JQuery<HTMLElement>;
        protected obsSourceRect: OffsetAndScale;
        /** keep the offset, from top-left corner, and the scale, relative to the obs canvas size, to calculate the points */
        protected obsOffsetAndScale: OffsetAndScale = { leftOffset: 0, topOffset: 0, horizontalScale: 1, verticalScale: 1 }

        protected readonly filter: FilterIdentifier = { sourceName: null, filterName: null, optionalPreviewSourceName: null };
        protected readonly pointRadius: number = 12;

        constructor(moduleIdentifier: OBS.Modules.ModuleIdentifier, pointHtmlDivId: string) {
            super(moduleIdentifier);
            if (pointHtmlDivId == null)
                throw "ObsAppModules.Points, constructor's pointHtmlDivId parameter should be set";
            if (!pointHtmlDivId.startsWith('#'))
                throw "ObsAppModules.Points, constructor's pointHtmlDivId parameter should start with \'#\'"
            this.pointHtmlDivId = pointHtmlDivId;

            this.parentJQuery = $(pointHtmlDivId);

            // handle the windows resize
            $(window).on('resize', () => {
                if (this.filter != null)
                    this.set3DFilter(this.filter.sourceName, this.filter.filterName, this.filter.optionalPreviewSourceName);
            });
        }




        /** 
         * Set the OBS 3D Filter and adds draggable corners in html.
         * @param sourceName The 3D Transform filter's source name
         * @param filterName The source's 3D Transform filter name
         * @param previewSourceName If provided, will be used to determine the points total offest. Not needed if the 'sourceName' extends to entire 'previewSourceName' 
        */
        public async set3DFilter(this: Points, sourceName: string, filterName: string, previewSourceName: string = null) {
            this.obsOffsetAndScale = await this.getOffsetAndScale(previewSourceName, sourceName);

            this.filter.sourceName = sourceName;
            this.filter.filterName = filterName;
            if (previewSourceName != null)
                this.filter.optionalPreviewSourceName = previewSourceName;

            this.removeAllPoints();
            await this.createAllPoints(sourceName, filterName);
        }

        /** Set the preview scene. */
        public async setPreview(previewSourceName: string) {
            await this.set3DFilter(this.filter.sourceName, this.filter.filterName, previewSourceName);
        }



        /** save the conenction to make further calls */
        public override onConnectionSet(this: Points, obs: OBS.ObsManager): void {
            if (this.obsManager != null)
                throw "OBS_3D_Points: cannot support multiple connections"
            this.obsManager = obs;
        }
        /** remove the connection */
        public override onConnectionRemoved(obs: OBS.ObsManager): void {
            this.obsManager = null;
        }
        /** called when a message needs to be handled by this module. (not the case at this moment) */
        public override dispatch(this: Points, arg: OBS.Modules.DispatchArgs): void {
            console.log(arg.obj);
        }



        /** 
         * called when a HTML point is dragged by user
         * @param pointLocation one of the four corners of the filter
         * @param newPosition is a {top, left} type through which is received the new position
         */
        protected onPointDrag(this: Points, pointLocation: PointLocation, newPosition: any): void {
            
            let newPoint: Point = {left: newPosition.left, top: newPosition.top}
            let corner: Corner = this.htmlToObsCornerPosition(newPoint)
            let pointId: string = this.getObsPointId(pointLocation);

            let message = '{ "requestType": "SetSourceFilterSettings", "requestData": { "sourceName": "'
                + this.filter.sourceName + '", "filterName": "' + this.filter.filterName
                + '", "filterSettings": { "'
                + pointId + '.X": ' + corner.X + ', "'
                + pointId + '.Y": ' + corner.Y
                + ' }}, "requestId": "' + this.getIdentifier().getId() + '" }';

            this.obsManager.sendMessage(message);
        }


        /** creates all four corners of the 3D filter and adds them into DOM */
        protected async createAllPoints(sourceName: string, filterName: string): Promise<void> {
            let filter: any = await this.getObsFilter(sourceName, filterName);
            if (filter == null)
                return;

            let obsPointSet: PointSet = this.getObsAllPointsPositions(filter);

            this.createPoint(PointLocation.topLeft, obsPointSet.topLeft);
            this.createPoint(PointLocation.topRight, obsPointSet.topRight);
            this.createPoint(PointLocation.bottomRight, obsPointSet.bottomRight);
            this.createPoint(PointLocation.bottomLeft, obsPointSet.bottomLeft);
        }

        /** remove all the ponts from curent object & DOM */
        protected removeAllPoints(this: Points) {
            this.points.forEach((value, index) => {
                value.jQueryPoint.remove();
            })
            this.points.length = 0;
        }

        /** create one point & adds it in DOM */
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
            if (sourceName == null || sourceName == "")
                return;

            let filter: any;
            // find filter
            let obj = await this.obsManager.sendMessageAsync({ "requestType": "GetSourceFilterList", "requestData": { "sourceName": sourceName } });
            if (obj == null || obj.responseObj.status == 'error')
                return null;
            let filters: any[] = obj.responseObj.responseData.filters;
            if (filters == null)
                return null;
            filters.forEach((value, index) => {
                if (value.filterKind == "streamfx-filter-transform" && value.filterName == filterName)
                    filter = value;
            });

            if (filter == null)
                return null;

            // we need the Camera.Mode to be in corner pin mode or mode 2 (as number not string)
            let test = filter.filterSettings["Camera.Mode"];
            if (test != 2) {
                this.obsManager.sendMessage(
                    '{ "requestType": "SetSourceFilterSettings", "requestData": { "sourceName": "'
                    + sourceName + '", "filterName": "' + filterName
                    + '", "filterSettings": { "Camera.Mode": 2 } }, "requestId": "ObsAppModules-Points-set-Camera-Mode-2" }');
                await delay(20)
                return this.getObsFilter(sourceName, filterName);
            }

            return filter
        }


        /** transform all OBS 3D Transform corners positions to 'HTML' Points positions */
        protected getObsAllPointsPositions(this: Points, filter: any): PointSet {
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

        /** transform local Point (html) position into OBS 3D Transform filter coordonates */
        protected htmlToObsCornerPosition(this: Points, position: Point): Corner {
            let obsCornerXorLeft = (position.left + this.pointRadius - this.parentJQuery.offset().left) / this.parentJQuery.width() * 200 - 100;
            let obsCornerYorTop = (position.top + this.pointRadius - this.parentJQuery.offset().top) / this.parentJQuery.height() * 200 - 100;
            return { X: obsCornerXorLeft, Y: obsCornerYorTop }
        }

        /** transform OBS 3D Transform filter coordonates to local (html) Point position */
        protected calculatePointPosition(this: Points, pointLocation: PointLocation, filter: any, parentWidth: number, parentHeight: number, parentOffsetLeft: number, parentOffsetTop: number): Point {
            // OBS's view is from -100(%) to 100(%)
            let left = (filter.filterSettings[this.getObsPointId(pointLocation) + ".X"] + 100) / 200 * parentWidth + parentOffsetLeft - this.pointRadius;
            let top = (filter.filterSettings[this.getObsPointId(pointLocation) + ".Y"] + 100) / 200 * parentHeight + parentOffsetTop - this.pointRadius;
            return { left: left, top: top };
        }

        /** generate onDrag handlers for draggable objects, so it will contain the specific corner that triggered the event */
        private getCallbackOnDrag(pointLocation: PointLocation): (newPosition: any) => void {
            switch (pointLocation) {
                case PointLocation.topLeft: return (newPosition) => this.onPointDrag(PointLocation.topLeft, newPosition);
                case PointLocation.topRight: return (newPosition) => this.onPointDrag(PointLocation.topRight, newPosition);
                case PointLocation.bottomRight: return (newPosition) => this.onPointDrag(PointLocation.bottomRight, newPosition);
                case PointLocation.bottomLeft: return (newPosition) => this.onPointDrag(PointLocation.bottomLeft, newPosition);
            }
        }

        /** get the DOM id of each point, base on their location */
        protected getPointId(pointLocation: PointLocation): string {
            switch (pointLocation) {
                case PointLocation.topLeft: return "topLeftPoint";
                case PointLocation.topRight: return "topRightPoint";
                case PointLocation.bottomRight: return "bottomRightPoint";
                case PointLocation.bottomLeft: return "bottomLeftPoint";
            }
        }

        /** get the OBS 3D Transform property, base on the point location */
        protected getObsPointId(pointLocation: PointLocation): string {
            switch (pointLocation) {
                case PointLocation.topLeft: return "Corners.TopLeft";
                case PointLocation.topRight: return "Corners.TopRight";
                case PointLocation.bottomRight: return "Corners.BottomRight";
                case PointLocation.bottomLeft: return "Corners.BottomLeft";
            }
        }


        /** 
         * find the offset and scale of transformed source, relative to preview scene
         * 
         * ! long running task: don't use it in a loop like logic.
         * */
        private async getOffsetAndScale(previewSourceName: string, sourceName: string): Promise<OffsetAndScale> {
            let noOffset: OffsetAndScale = { leftOffset: 0, topOffset: 0, verticalScale: 1, horizontalScale: 1 }

            if (sourceName == null || sourceName.length < 1 || previewSourceName == null || previewSourceName.length < 1) {
                return noOffset;
            }

            let videoSettingsPromise = this.obsManager.sendMessageAsync({ "requestType": "GetVideoSettings" });
            let sourcePromise: any = this.obsManager.sendMessageAsync({ "requestType": "GetSceneList" });
            let source = await sourcePromise;
            if (source == null || source.responseObj == null)
                return noOffset;

            let scenes = source.responseObj;
            let offset = this.findOffsetAndScaleRecursive(scenes, previewSourceName, source, { leftOffset: 0, topOffset: 0, horizontalSize: -1, verticalSize: -1 });
            let videoSettings = await videoSettingsPromise;
            let baseWidth = videoSettings.responseObj.baseWidth;
            let baseHeight = videoSettings.responseObj.baseHeight;
            return offset[0]
                ? this.offsetAndSizeToOffsetAndScale(offset[1], baseWidth, baseHeight)
                : noOffset;
        }
        private offsetAndSizeToOffsetAndScale(offset: OffsetAndSize, baseWidth: number, baseHeight: number): OffsetAndScale {
            return {
                leftOffset: offset.leftOffset,
                topOffset: offset.topOffset,
                horizontalScale: offset.horizontalSize / baseWidth,
                verticalScale: offset.verticalSize / baseHeight
            }
        }

        private findOffsetAndScaleRecursive(source: any, previewSourceName: string, sourceName: string, offsetAtThisLevel: OffsetAndSize): [boolean, OffsetAndSize] {
            if (source != null && source.name == previewSourceName) {
                return [true, offsetAtThisLevel];
            }

            source.sources?.forEach((element: any) => {
                let offset = this.getIncrementedOffsetAndSizeFromSource(element, offsetAtThisLevel.leftOffset, offsetAtThisLevel.topOffset)
                return this.findOffsetAndScaleRecursive(source, previewSourceName, sourceName, offset);
            });
            source.groupChildren?.forEach((element: any) => {
                let offset = this.getIncrementedOffsetAndSizeFromSource(element, offsetAtThisLevel.leftOffset, offsetAtThisLevel.topOffset)
                return this.findOffsetAndScaleRecursive(source, previewSourceName, sourceName, offset);
            });

            return [false, null];
        }
        private getIncrementedOffsetAndSizeFromSource(element: any, incrementLeft: number, incrementTop: number): OffsetAndSize {
            return {
                leftOffset: element.x ?? 0 + incrementLeft,
                topOffset: element.y ?? 0 + incrementTop,
                horizontalSize: element.cx ?? -1,
                verticalSize: element.cy ?? -1,
            }
        }
    }


}