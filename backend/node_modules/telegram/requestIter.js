"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestIter = void 0;
const Helpers_1 = require("./Helpers");
const _1 = require("./");
class RequestIter {
    constructor(client, limit, params = {}, args = {}) {
        this.client = client;
        this.reverse = params.reverse;
        this.waitTime = params.waitTime;
        this.limit = Math.max(!limit ? Number.MAX_SAFE_INTEGER : limit, 0);
        this.left = this.limit;
        this.buffer = undefined;
        this.kwargs = args;
        this.index = 0;
        this.total = undefined;
        this.lastLoad = 0;
    }
    async _init(kwargs) {
        // for overload
    }
    [Symbol.asyncIterator]() {
        this.buffer = undefined;
        this.index = 0;
        this.lastLoad = 0;
        this.left = this.limit;
        return {
            next: async () => {
                if (this.buffer == undefined) {
                    this.buffer = [];
                    if (await this._init(this.kwargs)) {
                        this.left = this.buffer.length;
                    }
                }
                if (this.left <= 0) {
                    return {
                        value: undefined,
                        done: true,
                    };
                }
                if (this.index == this.buffer.length) {
                    if (this.waitTime) {
                        await (0, Helpers_1.sleep)(this.waitTime -
                            (new Date().getTime() / 1000 - this.lastLoad));
                    }
                    this.lastLoad = new Date().getTime() / 1000;
                    this.index = 0;
                    this.buffer = [];
                    const nextChunk = await this._loadNextChunk();
                    if (nextChunk === false) {
                        // we exit;
                        return {
                            value: undefined,
                            done: true,
                        };
                    }
                    if (nextChunk) {
                        this.left = this.buffer.length;
                    }
                }
                if (!this.buffer || !this.buffer.length) {
                    return {
                        value: undefined,
                        done: true,
                    };
                }
                const result = this.buffer[this.index];
                this.left -= 1;
                this.index += 1;
                return {
                    value: result,
                    done: false,
                };
            },
        };
    }
    async collect() {
        var _a, e_1, _b, _c;
        const result = new _1.helpers.TotalList();
        try {
            for (var _d = true, _e = __asyncValues(this), _f; _f = await _e.next(), _a = _f.done, !_a; _d = true) {
                _c = _f.value;
                _d = false;
                const message = _c;
                result.push(message);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = _e.return)) await _b.call(_e);
            }
            finally { if (e_1) throw e_1.error; }
        }
        result.total = this.total;
        return result;
    }
    async _loadNextChunk() {
        throw new Error("Not Implemented");
    }
}
exports.RequestIter = RequestIter;
