namespace CustomLogger {
    export enum LogType {
        none,
        info,
        wornign,
        error
    }

    export function Log(message: string, type: LogType = LogType.none) {
        let element = $("<div>");
        element.text(message);
        element.addClass("log");
        element.addClass("col-12");
        switch (type) {
            case LogType.info:
                element.addClass("logInfo");
                break;
            case LogType.wornign:
                element.addClass("logWorning");
                break;
            case LogType.error:
                element.addClass("logError");
                break;
            default:
                break;
        }
        element.addClass("")
        $("#output").append(element);
    }
}