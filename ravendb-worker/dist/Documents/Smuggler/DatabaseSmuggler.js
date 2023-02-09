"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseSmuggler = void 0;
const StringUtil_1 = require("../../Utility/StringUtil");
const DatabaseSmugglerImportOptions_1 = require("./DatabaseSmugglerImportOptions");
const Exceptions_1 = require("../../Exceptions");
const HttpUtil_1 = require("../../Utility/HttpUtil");
const fs = require("fs");
const StreamUtil = require("../../Utility/StreamUtil");
const LengthUnawareFormData_1 = require("../../Utility/LengthUnawareFormData");
const path = require("path");
const BackupUtils_1 = require("./BackupUtils");
const OperationCompletionAwaiter_1 = require("../Operations/OperationCompletionAwaiter");
const GetNextOperationIdCommand_1 = require("../Commands/GetNextOperationIdCommand");
const RavenCommand_1 = require("../../Http/RavenCommand");
class DatabaseSmuggler {
    constructor(store, databaseName) {
        this._store = store;
        this._databaseName = databaseName !== null && databaseName !== void 0 ? databaseName : store.database;
        if (this._databaseName) {
            this._requestExecutor = store.getRequestExecutor(this._databaseName);
        }
        else {
            this._requestExecutor = null;
        }
    }
    forDatabase(databaseName) {
        if (StringUtil_1.StringUtil.equalsIgnoreCase(databaseName, this._databaseName)) {
            return this;
        }
        return new DatabaseSmuggler(this._store, databaseName);
    }
    export(options, toFileOrToDatabase) {
        return __awaiter(this, void 0, void 0, function* () {
            if (toFileOrToDatabase instanceof DatabaseSmuggler) {
                const importOptions = new DatabaseSmugglerImportOptions_1.DatabaseSmugglerImportOptions(options);
                return yield this._export(options, (response) => __awaiter(this, void 0, void 0, function* () {
                    const importOperation = yield toFileOrToDatabase.import(importOptions, response);
                    yield importOperation.waitForCompletion();
                }));
            }
            else {
                const directory = path.dirname(path.resolve(toFileOrToDatabase));
                if (!fs.existsSync(directory)) {
                    fs.mkdirSync(directory, { recursive: true });
                }
                return yield this._export(options, (response) => __awaiter(this, void 0, void 0, function* () {
                    const fileStream = fs.createWriteStream(toFileOrToDatabase);
                    yield StreamUtil.pipelineAsync(response, fileStream);
                }));
            }
        });
    }
    _export(options, handleStreamResponse) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!options) {
                (0, Exceptions_1.throwError)("InvalidArgumentException", "Options cannot be null");
            }
            if (!this._requestExecutor) {
                (0, Exceptions_1.throwError)("InvalidOperationException", "Cannot use smuggler without a database defined, did you forget to call 'forDatabase'?");
            }
            const getOperationIdCommand = new GetNextOperationIdCommand_1.GetNextOperationIdCommand();
            yield this._requestExecutor.execute(getOperationIdCommand);
            const operationId = getOperationIdCommand.result;
            const command = new ExportCommand(this._requestExecutor.conventions, options, handleStreamResponse, operationId, getOperationIdCommand.nodeTag);
            yield this._requestExecutor.execute(command);
            return new OperationCompletionAwaiter_1.OperationCompletionAwaiter(this._requestExecutor, this._requestExecutor.conventions, operationId, getOperationIdCommand.nodeTag);
        });
    }
    importIncremental(options, fromDirectory) {
        return __awaiter(this, void 0, void 0, function* () {
            const files = fs.readdirSync(fromDirectory)
                .filter(x => BackupUtils_1.BackupUtils.BACKUP_FILE_SUFFIXES.includes("." + path.extname(x)))
                .sort(BackupUtils_1.BackupUtils.comparator);
            if (!files.length) {
                return;
            }
            const oldOperateOnTypes = DatabaseSmuggler.configureOptionsFromIncrementalImport(options);
            for (let i = 0; i < files.length - 1; i++) {
                const filePath = files[i];
                yield this.import(options, path.resolve(filePath));
            }
            options.operateOnTypes = oldOperateOnTypes;
            const lastFile = files.slice(-1).pop();
            yield this.import(options, path.resolve(lastFile));
        });
    }
    static configureOptionsFromIncrementalImport(options) {
        options.operateOnTypes.push("Tombstones");
        options.operateOnTypes.push("CompareExchangeTombstones");
        const oldOperateOnTypes = [...options.operateOnTypes];
        options.operateOnTypes = options.operateOnTypes.filter(x => x !== "Indexes" && x !== "Subscriptions");
        return oldOperateOnTypes;
    }
    import(options, fileOrStream) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof fileOrStream === "string") {
                let countOfFileParts = 0;
                let result;
                let fromFile = fileOrStream;
                do {
                    const fos = fs.createReadStream(fromFile);
                    result = yield this._import(options, fos);
                    countOfFileParts++;
                    fromFile = StringUtil_1.StringUtil.format("{0}.part{1}", fromFile, countOfFileParts);
                } while (fs.existsSync(fromFile));
                return result;
            }
            else {
                return yield this._import(options, fileOrStream);
            }
        });
    }
    _import(options, stream) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!options) {
                (0, Exceptions_1.throwError)("InvalidArgumentException", "Options cannot be null");
            }
            if (!stream) {
                (0, Exceptions_1.throwError)("InvalidArgumentException", "Stream cannot be null");
            }
            if (!this._requestExecutor) {
                (0, Exceptions_1.throwError)("InvalidOperationException", "Cannot use smuggler without a database defined, did you forget to call 'forDatabase'?");
            }
            const getOperationIdCommand = new GetNextOperationIdCommand_1.GetNextOperationIdCommand();
            yield this._requestExecutor.execute(getOperationIdCommand);
            const operationId = getOperationIdCommand.result;
            const command = new ImportCommand(this._requestExecutor.conventions, options, stream, operationId, getOperationIdCommand.nodeTag);
            yield this._requestExecutor.execute(command);
            return new OperationCompletionAwaiter_1.OperationCompletionAwaiter(this._requestExecutor, this._requestExecutor.conventions, operationId, getOperationIdCommand.nodeTag);
        });
    }
}
exports.DatabaseSmuggler = DatabaseSmuggler;
class ExportCommand extends RavenCommand_1.RavenCommand {
    constructor(conventions, options, handleStreamResponse, operationId, nodeTag) {
        super();
        if (!conventions) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Conventions cannot be null");
        }
        if (!options) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Options cannot be null");
        }
        if (!handleStreamResponse) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "HandleStreamResponse cannot be null");
        }
        this._handleStreamResponse = handleStreamResponse;
        const { operateOnTypes } = options, restOptions = __rest(options, ["operateOnTypes"]);
        this._options = conventions.objectMapper.toObjectLiteral(Object.assign({ operateOnTypes: operateOnTypes.join(",") }, restOptions));
        this._operationId = operationId;
        this._selectedNodeTag = nodeTag;
    }
    get isReadRequest() {
        return false;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/smuggler/export?operationId=" + this._operationId;
        const body = this._serializer.serialize(this._options);
        const headers = HttpUtil_1.HeadersBuilder.create()
            .typeAppJson().build();
        return {
            method: "POST",
            uri,
            body,
            headers
        };
    }
    processResponse(cache, response, bodyStream, url) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._handleStreamResponse(bodyStream);
            return "Automatic";
        });
    }
}
class ImportCommand extends RavenCommand_1.RavenCommand {
    constructor(conventions, options, stream, operationId, nodeTag) {
        super();
        this._responseType = "Empty";
        if (!stream) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Stream cannot be null");
        }
        if (!conventions) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Conventions cannot be null");
        }
        if (!options) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Options cannot be null");
        }
        this._stream = stream;
        const { operateOnTypes } = options, restOptions = __rest(options, ["operateOnTypes"]);
        this._options = conventions.objectMapper.toObjectLiteral(Object.assign({ operateOnTypes: operateOnTypes.join(",") }, restOptions));
        this._operationId = operationId;
        this._selectedNodeTag = nodeTag;
    }
    get isReadRequest() {
        return false;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/smuggler/import?operationId=" + this._operationId;
        const multipart = new LengthUnawareFormData_1.LengthUnawareFormData();
        multipart.append("importOptions", this._serializer.serialize(this._options));
        multipart.append("file", this._stream, { filename: "name" });
        return {
            method: "POST",
            uri,
            body: multipart,
        };
    }
}
