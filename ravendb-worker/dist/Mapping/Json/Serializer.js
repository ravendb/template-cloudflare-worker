"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonSerializer = void 0;
const Replacers_1 = require("./Replacers");
const Revivers_1 = require("./Revivers");
const ReplacerFactory_1 = require("./ReplacerFactory");
const ReviverFactory_1 = require("./ReviverFactory");
class JsonSerializer {
    constructor(opts) {
        opts = opts || {};
        this._reviverRules = opts.reviverRules || [];
        this._replacerRules = opts.replacerRules || [];
    }
    get reviverRules() {
        return this._reviverRules;
    }
    set reviverRules(value) {
        this._reviverRules = value;
    }
    get replacerRules() {
        return this._replacerRules;
    }
    set replacerRules(value) {
        this._replacerRules = value;
    }
    deserialize(jsonString) {
        const reviver = ReviverFactory_1.RuleBasedReviverFactory.build(this._reviverRules);
        return JSON.parse(jsonString, reviver);
    }
    serialize(obj) {
        const replacer = ReplacerFactory_1.RuleBasedReplacerFactory.build(this._replacerRules);
        return JSON.stringify(obj, replacer);
    }
    static getDefault() {
        return new JsonSerializer();
    }
    static getDefaultForCommandPayload() {
        return new JsonSerializer({
            reviverRules: [
                {
                    contextMatcher: () => true,
                    reviver: Revivers_1.camelCaseReviver
                }
            ],
            replacerRules: [
                {
                    contextMatcher: () => true,
                    replacer: Replacers_1.pascalCaseReplacer
                }
            ]
        });
    }
    static getDefaultForEntities() {
        return new JsonSerializer();
    }
}
exports.JsonSerializer = JsonSerializer;