"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.__esModule = true;
exports.InterfaceTrade = exports.TradeState = void 0;
var router_sdk_1 = require("@teleswap/router-sdk");
var TradeState;
(function (TradeState) {
    TradeState[TradeState["LOADING"] = 0] = "LOADING";
    TradeState[TradeState["INVALID"] = 1] = "INVALID";
    TradeState[TradeState["NO_ROUTE_FOUND"] = 2] = "NO_ROUTE_FOUND";
    TradeState[TradeState["VALID"] = 3] = "VALID";
    TradeState[TradeState["SYNCING"] = 4] = "SYNCING";
})(TradeState = exports.TradeState || (exports.TradeState = {}));
var InterfaceTrade = /** @class */ (function (_super) {
    __extends(InterfaceTrade, _super);
    function InterfaceTrade(_a) {
        var _this = this;
        var gasUseEstimateUSD = _a.gasUseEstimateUSD, blockNumber = _a.blockNumber, routes = __rest(_a, ["gasUseEstimateUSD", "blockNumber"]);
        _this = _super.call(this, routes) || this;
        _this.blockNumber = blockNumber;
        _this.gasUseEstimateUSD = gasUseEstimateUSD;
        return _this;
    }
    return InterfaceTrade;
}(router_sdk_1.Trade));
exports.InterfaceTrade = InterfaceTrade;
