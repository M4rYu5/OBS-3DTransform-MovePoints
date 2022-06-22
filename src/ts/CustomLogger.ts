namespace CustomLogger {
    export enum LogType {
        none,
        info,
        wornign,
        error
    }

    export function Log(message: string, type: LogType = LogType.none) {
        let element = $("<div>");
        element.addClass("log");
        element.addClass("col-12");
        if (message != null) {
            element.text(message);
            switch (type) {
                case LogType.info:
                    element.addClass("logInfo");
                    break;
                case LogType.wornign:
                    element.addClass("logWarning");
                    break;
                case LogType.error:
                    element.addClass("logError");
                    break;
                default:
                    break;
            }
        }
        else {
            element.text("[LOG: RECEIVED NULL MESSAGE]");
            element.addClass("logWarning");
        }
        $("#output").append(element);
    }
}