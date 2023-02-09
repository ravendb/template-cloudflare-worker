"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseTimeInformation = void 0;
class ResponseTimeInformation {
    constructor() {
        this.totalServerDuration = 0;
        this.totalClientDuration = 0;
        this.durationBreakdown = [];
    }
    computeServerTotal() {
        this.totalServerDuration =
            this.durationBreakdown.reduce((result, next) => result + next.duration, 0);
    }
}
exports.ResponseTimeInformation = ResponseTimeInformation;
