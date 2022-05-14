 namespace CustomLogger {
    export enum LogType {
        none,
        info
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
            default:
                break;
        }
        element.addClass("")
        $("#output").append(element);
    }
}