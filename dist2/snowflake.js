'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var jsxRuntime = require('react/jsx-runtime');
var macro = require('@lingui/macro');
var v2Sdk = require('@uniswap/v2-sdk');
var v3Sdk = require('@uniswap/v3-sdk');
var core$1 = require('@web3-react/core');
var utils = require('jotai/utils');
var core = require('widgets-web3-react/core');
var empty = require('widgets-web3-react/empty');
var sdkCore = require('@uniswap/sdk-core');
var JSBI = require('jsbi');
var reactFeather = require('react-feather');
var React = require('react');
var reactRedux = require('react-redux');
var bytes = require('@ethersproject/bytes');
var strings = require('@ethersproject/strings');
var address = require('@ethersproject/address');
var constants = require('@ethersproject/constants');
var contracts = require('@ethersproject/contracts');
var jotai = require('jotai');
var reduxMulticall = require('@uniswap/redux-multicall');
var redux = require('redux');
var hash = require('@ethersproject/hash');
var CID = require('cids');
var multicodec = require('multicodec');
var multihashes = require('multihashes');
var abi$6 = require('@ethersproject/abi');
var toolkit = require('@reduxjs/toolkit');
var styled = require('styled-components/macro');
var rebass = require('rebass');
var ReactGA = require('react-ga');
var reactRouterDom = require('react-router-dom');
var styledComponents = require('rebass/styled-components');
var reactSpring = require('react-spring');
var useResizeObserver = require('use-resize-observer');
var polished = require('polished');
var Portal = require('@reach/portal');
var reactPopper = require('react-popper');
var units = require('@ethersproject/units');
var routerSdk = require('@uniswap/router-sdk');
var dialog = require('@reach/dialog');
var reactUseGesture = require('react-use-gesture');
var uaParserJs = require('ua-parser-js');
var app = require('firebase/app');
var database = require('firebase/database');
var AutoSizer = require('react-virtualized-auto-sizer');
var reactWindow = require('react-window');
var safeAppsWeb3React = require('@gnosis.pm/safe-apps-web3-react');
var injectedConnector = require('@web3-react/injected-connector');
var portisConnector = require('@web3-react/portis-connector');
var walletconnectConnector = require('@web3-react/walletconnect-connector');
var walletlinkConnector = require('@web3-react/walletlink-connector');
var providers = require('@ethersproject/providers');
var ms = require('ms.macro');
var fortmaticConnector = require('@web3-react/fortmatic-connector');
var abstractConnector = require('@web3-react/abstract-connector');
var invariant = require('tiny-invariant');
var Vibrant = require('node-vibrant/lib/bundle');
var wcagContrast = require('wcag-contrast');
var qs = require('qs');
var react = require('@reduxjs/toolkit/query/react');
var reduxLocalstorageSimple = require('redux-localstorage-simple');
var graphqlRequest = require('graphql-request');
var tokenLists = require('@uniswap/token-lists');
var smartOrderRouter = require('@uniswap/smart-order-router');
var ethers = require('ethers/lib/ethers');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n["default"] = e;
    return Object.freeze(n);
}

function _mergeNamespaces(n, m) {
    m.forEach(function (e) {
        e && typeof e !== 'string' && !Array.isArray(e) && Object.keys(e).forEach(function (k) {
            if (k !== 'default' && !(k in n)) {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    });
    return Object.freeze(n);
}

var JSBI__default = /*#__PURE__*/_interopDefaultLegacy(JSBI);
var React__namespace = /*#__PURE__*/_interopNamespace(React);
var React__default = /*#__PURE__*/_interopDefaultLegacy(React);
var CID__default = /*#__PURE__*/_interopDefaultLegacy(CID);
var styled__default = /*#__PURE__*/_interopDefaultLegacy(styled);
var ReactGA__default = /*#__PURE__*/_interopDefaultLegacy(ReactGA);
var useResizeObserver__default = /*#__PURE__*/_interopDefaultLegacy(useResizeObserver);
var Portal__default = /*#__PURE__*/_interopDefaultLegacy(Portal);
var AutoSizer__default = /*#__PURE__*/_interopDefaultLegacy(AutoSizer);
var ms__default = /*#__PURE__*/_interopDefaultLegacy(ms);
var invariant__default = /*#__PURE__*/_interopDefaultLegacy(invariant);
var Vibrant__default = /*#__PURE__*/_interopDefaultLegacy(Vibrant);
var qs__default = /*#__PURE__*/_interopDefaultLegacy(qs);

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
}

function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
}

var EthereumLogo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAADxdJREFUeJztXVtzFMcVplwuP8VVeYmf7HJ+RKqSl/AQP6X8H+yqXUEIjhMnQY5jO9oVCIzA5mowdzAYG4xAGAyWLC5G3IyDL8gOASUYKrarYGZWC7qi23b6692VV6uZ7e6ZnT3di07VV6JUaLfnnG+6z+lz+vScOXUoL6SzP52/2PtlQ9p7piHlLU2k3P2JJqcjkXLO8589/OdN/tPjvx8VEP8Wv+sp/J8O/A3+Fp+Bz8JnUj/XrPjIwjT7ybxm57fJlLsy2eR2cwPe4QZksYB/Nr4D34XvxHdTP/8DJ+k0e4S/lb9Jpr2WZJNzgRtjPDaDS4DvFmPgY8GYMDZq/dStNKQzv0qmnA1c6RkqgysQIoMxYqzU+qoLWZDO/jyZdl7lir1ObdwQZLiOseMZqPVonSTS7i+4AtsTTW6O2pDR4ebEs/Bnotar8dKw2Pk1n0I76Y0W16zgdOIZqfVsnCSbvaeEB2+AkWpCBEQS/Jmp9U4u3Fl6nIdWB6gNQgb+7NABtR1qLjxcejiZdhfxKXGA3AjUswHXAXQBnVDbpSbCPeO5fAr8hlrxpgE6gW6o7ROb5N96Z3l9ePZxgUcMXEd1NxssbMk8kWxyztEr2A5AV3XjGySb3acTSLYYoFjL4EF31PYLLXwaeyiZcltnp/woEJtIrdAltT21BEkR7tnuo1dgfQC6tCbRlGh1H02k3C5qpalg/bt3WdOGDPk4lACdct1S27eiLEgPPMbDmcvkylLAgiUOc/sm2LHuITavmX48KoBun1828DNqO/tKsiX7JF+zeqmVpIqPzg2xyckc++Sfw2ImoB6POtxe6Jra3tMEb75Nxv/Hmxk2MZGbIsCpz4bZn1d45OPSIQF0Tm13IViXbJn2i+i9NcYgRQIA+zsGyMelA6Fzap8AnqktDl8RO9r7WVFKCQAs3dJHPj4tcN2TRQcizrcs1Hv+NZf1D04GEqDj/JBwDqnHqYNCiFj7fYL8Jg+9AnTQfXmYlUo5AYAtbffIx6lNAm6L2hpfbO/atcO3dGsfy+VyUgIAL66yySEE3FzNto2R2ElYtrffkHbYd7fHWbkEEeDQyUHk6cnHrQkPtonV+CKla2FWDx6+nwQRAFi5K0s+bl3ANrGmkvP5fPoH1cFfX/fYyP2cNgG6Lg6z55a55OPXJgG3UVzGn2vbug98fvW+r/FlBADePtJPPn59iKKS6lYW5ad++8q4Vu+5G2h8FQIAr663JFlUAtiqqksBZ1Uj9UPp4neLHeb0TUQmwNEzg2xemv559OE2VsX4KE2ysXoXhpOJCgGAdXttShblAZtVpayMe5Zt1A+ji5fXZdj4uL/jF4YApy4NsxdaLXQIue2iGb/Ze4r6IcLg6rejUuPrEAB47yO7kkVTJIhyAsnG41rYylUVHQIAizdZlixqyh9DC2V8HGKkHrwuELffHZiUWz4kAVBEAueS+jl1EepAqo2ndLFW64guAYBNB2xMFjmdWsbHWXbqQesC0zMMGjcBgEVv2JYs4tDpT5BvzmDAoBWBxM2tH8a0jB+FAAe77EsWwaZKxkdLE9u2fPce65dbu4oEAFp32JYscnNK7WrQ14Z+sOpAMefwiLrjVy0CdF0cYguX2rU3ANtKCWBTdS9wqWcklPGjEgDYcdiuZBEaV1U0PtqbUQ9SB6/vyoY2fjUIALy81q5kUcUWduhxRz1AVcxvdthtb2aVT60JcOT0oKg4otaHKmBjX+OLA50GN2Esx+FT8mRPLQgAIO1MrQ91ArgZ31JytDqlHpwqXlrjsbExvZg/TgKcvDTM/rjcHocQtp45/ae9FuqBqeLr/6gle2pFAAChKLVeVAFbzyRAk3OBemAq2LhfPdlTSwIA6Y12JItg62nGR9tzyq7bqljY4rK+e5WrfCgJcPzskHBOqfUkJQC39bRW9+h9Tz0oFXx8Yahqxo+DAMCGfXY4hLB5SfjnrqQekAypjRntZA8FAU5/NixK0an1JQNsXrL+m1/4ceM7/WRPJcExsas3Rtn7nQNVJ8GBj82vHppWKBLrNStVAOrzqyWjPHzEWQGEbjBW81t9bPn2LNt9tF/UE1SLBMu2Ge4QcpsL4+MyJPLBVADi68HhcMmeUrnbP8kufDUyw8ggQBHoD7Dt4D3WyX2NqASAv/L7Fnr9VYK4CAs3YlEPpBLOfxk+2QP5wRlnZy7ztTnAUKUEKGLJpj72JnfmUFoehQTbDpldPQTb8/Xfe5Z6IEHA1BxWem+N8rdd/ib7EaAUq/dkxZoelgTYtaTWYxBwJR7y/8uoB+IHnMbB26sjY+M59uU1vr5/qj6FywhQxIodWfbOh/2ioZQOAZCzMLV6CLafU7hUkXww5Wjr8j/S7Sdo+3LxyojSGx+WAFN+wtY+tp1P7V0afsIbbxtaPcRtb2T1b+Mqj90flcf8t91x1v158PoeBwGKWLy5j23kfsIxBT/h5KfDoj8RtV7LIaqFTcwBfHUt+Eg35L//G2WnqxSyhSVAKdZwP+FgV2U/Yc9R85JFIieQwH25BgymCHTt9JPxiRy7ch3xe/QQrdoEKGLlzqzICgb5CQb2Je6ZU7g0mXogAmjR5mWnJ3uwB3Dp65nxu4kEKGIZ9xN2tN9jJy5OJ6txfYm57TEDGNPwCdm0otzJTLCzX+T31uMwfJwEmNpP2NLHNu2/y453/0gEw/oSe3MK16dTD2Sqf+/N78diN3qtCDDlMG7qY2v33mWHTg6Y1ZeY294YAhw7Ozi1P19L1IIA0/yEXdxpfMeQWUAQwJAlAClUtHOrdwL8fW3GpBPGnlFOIIDp8lh3dT19EwiAJe4PprWdKziBRoWBALaB1/JpEhsothMAdYJY8w3dDhZh4HkDBuIL7J7t+qDfWgKg57BRYV85uO0xA3SQD0SCl9ZkRP9eWwjwyrqM8bUABXQYkwySpU0xhb62Lcs6z5u7E4idPpUDIn8ypeOYSAYZkg5esTPLPr0yIu2+gd1CnA3QTcvGSYA0B6IY2TpfXNLQxo5a30BDyluKI2HPUA+kCHj/qNlDDl0WKsGxevd49LAxqvGxPM2XjBV+AJpNYp/DpJ1AURBiUkkYvP9i9S9yAnjTZX+DaffoJ+H9g7CGR1j3nEKDCIS12OLGd6HGwaRoQJSEmVYU+rfVHhu+/2MR6LWbo+JMQGUmO6Lo4kSIsDFMWKfSNRRLWWnJOdrPm3aAVBSFmlgWXt7sEQc4kB+QKRBv5Pb2e7ERAIUqssbROL629eDMMSzZbFiZeLEs3NSDISjhLpeh4Umx7ssaMiD+bpMUaOgQAE6b7DYxjAkdS7ouzoxScFUdtT7LMe1giIlHw/AmORn/g6AoFlWps0OdP7p7hiUA/AuVUi74A+gU4vf5KC2XOYkkBCg9Gmbq4VBMm0gRBwkqgGX7B1A+PO+ggpKgsO4vK+VhHXwBVAAFkQuhqqk3kE07HGry8XDU5FcStIWHl40Zo9LnwH9AXZ6MAHBCZUe8EaLiFLBsL2LVbjOrgWccDze5QQTeQpX27zj6tV3hJM4r6zPsg5Lpemr7lv9eRiIA5V4dCruR+wxuLz+jQYTpLWIwHQ8MqZ0P/Pb7MdYiuQMYpMLOI87vIcRU2ZrFUnPwhNp+A7arTb5xzLdFjOlNorCTpio4+o0zhSBOpc+EZy+LKJDD33lYLyNpYPXvNPg2ibKhTRzqA3QE9wUiHAzTtgXx/po9+jUJpreTD2wTlw8HzW4UCY/e7wpYmSCc1NmDRxQQpioJOQzTbxgLbBSZXwbMbxWLmDtsj8B/3RiteA8gMnr7QtYlItEjW3JMQMVWsflZwL1OPUgZEM6FFWwrI2dQWp+H4o3NB/S2kMuBo+zUepFB2ixaEMCSdvFf/Lvy+UGZIKpAW5hiNBDF+Cae+/MlgEq7eFsujMAWbdSegdXoEoZNKFmewAwoXhhRWAasuDIGTRuitI57kNrFK18ZA7Hp0qgPz4RvHhmVACZV90ihc2lUfhYwr3GEHxrS4XsIRiEAchQmVfdUgva1cRCbLo58sayKKG4CIOdvWnVPxZckzMWRYhYwsFAkCDpXxkYlgHHVPRUQ+upYQQDLLo/W7SkYhgAoOaN+Ti0CRLk8GpJIOQeoH0IVSOfeCagiqgYBUH1sYnVPILjtIhkf0pDOPM6diAHyh1EEpufxClVEYQmA4o9Gi66Mhc1gu8gEgCTT7iLqB9KBrIooDAGM7fUXRABus6oYH5JOs4e5M/EN9UNpsF+0gq8WAd4zuLrH9/m5rWCzqhEAkkw7c23YIi4CmTl0EI1KAFHdY9UVsW4Otqqq8UtIsJz+AdWBJhNRCYD0M/Vz6AA2isX4kPxS4JyjfkgdVKoikhHgrfctC/m4bao+9ZfLwpbMEwlDGkupoFIVUSUCtJ80v7qnDB5sE6vxi5Jsdp+2yR9AFdCoTxVREAEwaxjTy08JfN3nNqmJ8adIkHJb6R9cHbt9qoiCCIBOJNTj1QFsUVPjQ/ha8xCPNfdRP7wOcFmUjAC7j9hR3TNlfG4D2KLmBCiQ4JFEyu2iVoIqyquIyglgT3VPAVz3gSXetZJEq/tossm9TK4MRbSWVBGVEwDtXqjHpwqhc657UuMXZUF64DHuiPRSK0UVOLJdTgCcPKIelzrcXuic2u7TJNmSfdIWEhSriIoEsKm6BzqGrqnt7StgpS3LAc7to+MIqntMvM/HD9CtcW9+uWBdssUxxDk+dPGiHocSoFNT1nyZiIOmloWIJqMQ6tF6+7oi9gnEZpE9O4bmwc1Bh2RxfjUkv21sT+7AIHg1396NS5CksC2LSAnoqmaJnVqJSCWLeoLZJSEYophjeewpXUpBtYpN5WW1AnQSWyWPaQKGc7Y32lRtHJvhhQ7cxrp+64NElJw3OW3URqB76522qpVu2yw4vWLTMbTohne7I5/YqUfBIUZbTiWHMjx/ttAHNR8kwVn2fJOKeogYxGZOu/b5/FnJt6vJ9yyyI8tYZvhejF25LcusVBa0N0OPO5ObWWJsGKO0FdushBckRdDqFP1u0fSYsss5vluMgY8FY7IuYVMPgrbn6H2PCxBEJBHn9Tf8s4UHz78L3zmj5fqsmCG4DAk3YiWbvGfFvYgpdz888EJL/J7Chdkerk8XEP8Wv+vJzyo8EsHf8L/FZ+Czpi5YqjP5P2ey0rAsl+yGAAAAAElFTkSuQmCC";

var arbitrumLogoUrl = "data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22utf-8%22%3F%3E%3C!DOCTYPE%20svg%20PUBLIC%20%22-%2F%2FW3C%2F%2FDTD%20SVG%201.1%2F%2FEN%22%20%22http%3A%2F%2Fwww.w3.org%2FGraphics%2FSVG%2F1.1%2FDTD%2Fsvg11.dtd%22%3E%3Csvg%20version%3D%221.1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20viewBox%3D%220%200%20470.287%20514.251%22%20enable-background%3D%22new%200%200%20470.287%20514.251%22%20xml%3Aspace%3D%22preserve%22%3E%3Cg%20id%3D%22Background%22%3E%3C%2Fg%3E%3Cg%20id%3D%22Logos_and_symbols%22%3E%20%3Cg%20id%3D%22SYMBOL_VER_3%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_3_3_%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_4%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_4_1_%22%3E%20%20%3Cg%20id%3D%22SYMBOL_VER_4_3_%22%3E%20%20%3C%2Fg%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_5_1_%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22off_2_1_%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22VER_3_1_%22%3E%20%20%3Cg%20id%3D%22SYMBOL_VER_2_1_%22%3E%20%20%3C%2Fg%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22VER_3%22%3E%20%20%3Cg%20id%3D%22SYMBOL_VER_2%22%3E%20%20%3C%2Fg%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22off_2%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_5%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_1%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_1_1_%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_1-1_3_%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_1-1_2_%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_1-1%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_1-1_1_%22%3E%20%20%3Cg%20id%3D%22_x31_-3%22%3E%20%20%3C%2Fg%3E%20%20%3Cg%20id%3D%22Symbol_-_Original_14_%22%3E%20%20%20%3Cpath%20fill%3D%22%232D374B%22%20d%3D%22M291.134%2C237.469l35.654-60.5l96.103%2C149.684l0.046%2C28.727l-0.313-197.672%20%20%20%20c-0.228-4.832-2.794-9.252-6.887-11.859L242.715%2C46.324c-4.045-1.99-9.18-1.967-13.22%2C0.063c-0.546%2C0.272-1.06%2C0.57-1.548%2C0.895%20%20%20%20l-0.604%2C0.379L59.399%2C144.983l-0.651%2C0.296c-0.838%2C0.385-1.686%2C0.875-2.48%2C1.444c-3.185%2C2.283-5.299%2C5.66-5.983%2C9.448%20%20%20%20c-0.103%2C0.574-0.179%2C1.158-0.214%2C1.749l0.264%2C161.083l89.515-138.745c11.271-18.397%2C35.825-24.323%2C58.62-24.001l26.753%2C0.706%20%20%20%20L67.588%2C409.765l18.582%2C10.697L245.692%2C157.22l70.51-0.256L157.091%2C426.849l66.306%2C38.138l7.922%2C4.556%20%20%20%20c3.351%2C1.362%2C7.302%2C1.431%2C10.681%2C0.21l175.453-101.678l-33.544%2C19.438L291.134%2C237.469z%20M304.736%2C433.395l-66.969-105.108%20%20%20%20l40.881-69.371l87.952%2C138.628L304.736%2C433.395z%22%2F%3E%20%20%20%3Cpolygon%20fill%3D%22%2328A0F0%22%20points%3D%22237.768%2C328.286%20304.736%2C433.395%20366.601%2C397.543%20278.648%2C258.915%20%20%20%20%22%2F%3E%20%20%20%3Cpath%20fill%3D%22%2328A0F0%22%20d%3D%22M422.937%2C355.379l-0.046-28.727l-96.103-149.684l-35.654%2C60.5l92.774%2C150.043l33.544-19.438%20%20%20%20c3.29-2.673%2C5.281-6.594%2C5.49-10.825L422.937%2C355.379z%22%2F%3E%20%20%20%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M20.219%2C382.469l47.369%2C27.296l157.634-252.801l-26.753-0.706c-22.795-0.322-47.35%2C5.604-58.62%2C24.001%20%20%20%20L50.334%2C319.004l-30.115%2C46.271V382.469z%22%2F%3E%20%20%20%3Cpolygon%20fill%3D%22%23FFFFFF%22%20points%3D%22316.202%2C156.964%20245.692%2C157.22%2086.17%2C420.462%20141.928%2C452.565%20157.091%2C426.849%20%20%20%20%22%2F%3E%20%20%20%3Cpath%20fill%3D%22%2396BEDC%22%20d%3D%22M452.65%2C156.601c-0.59-14.746-8.574-28.245-21.08-36.104L256.28%2C19.692%20%20%20%20c-12.371-6.229-27.825-6.237-40.218-0.004c-1.465%2C0.739-170.465%2C98.752-170.465%2C98.752c-2.339%2C1.122-4.592%2C2.458-6.711%2C3.975%20%20%20%20c-11.164%2C8.001-17.969%2C20.435-18.668%2C34.095v208.765l30.115-46.271L50.07%2C157.921c0.035-0.589%2C0.109-1.169%2C0.214-1.741%20%20%20%20c0.681-3.79%2C2.797-7.171%2C5.983-9.456c0.795-0.569%2C172.682-100.064%2C173.228-100.337c4.04-2.029%2C9.175-2.053%2C13.22-0.063%20%20%20%20l173.022%2C99.523c4.093%2C2.607%2C6.659%2C7.027%2C6.887%2C11.859v199.542c-0.209%2C4.231-1.882%2C8.152-5.172%2C10.825l-33.544%2C19.438%20%20%20%20l-17.308%2C10.031l-61.864%2C35.852l-62.737%2C36.357c-3.379%2C1.221-7.33%2C1.152-10.681-0.21l-74.228-42.693l-15.163%2C25.717%20%20%20%20l66.706%2C38.406c2.206%2C1.255%2C4.171%2C2.367%2C5.784%2C3.272c2.497%2C1.4%2C4.199%2C2.337%2C4.8%2C2.629c4.741%2C2.303%2C11.563%2C3.643%2C17.71%2C3.643%20%20%20%20c5.636%2C0%2C11.132-1.035%2C16.332-3.072l182.225-105.531c10.459-8.104%2C16.612-20.325%2C17.166-33.564V156.601z%22%2F%3E%20%20%3C%2Fg%3E%20%20%3Cg%20id%3D%22Symbol_-_Original_13_%22%3E%20%20%3C%2Fg%3E%20%20%3Cg%20id%3D%22Symbol_-_Original_6_%22%3E%20%20%3C%2Fg%3E%20%20%3Cg%20id%3D%22Symbol_-_Original_4_%22%3E%20%20%3C%2Fg%3E%20%20%3Cg%20id%3D%22One_color_version_-_White_3_%22%3E%20%20%20%3Cg%20id%3D%22Symbol_-_Original_15_%22%3E%20%20%20%3C%2Fg%3E%20%20%3C%2Fg%3E%20%20%3Cg%20id%3D%22One_color_version_-_White%22%3E%20%20%20%3Cg%20id%3D%22Symbol_-_Original%22%3E%20%20%20%3C%2Fg%3E%20%20%3C%2Fg%3E%20%20%3Cg%20id%3D%22Symbol_-_Monochromatic_3_%22%3E%20%20%20%3Cg%20id%3D%22_x33__7_%22%3E%20%20%20%3C%2Fg%3E%20%20%3C%2Fg%3E%20%20%3Cg%20id%3D%22Symbol_-_Monochromatic%22%3E%20%20%20%3Cg%20id%3D%22_x33__3_%22%3E%20%20%20%3C%2Fg%3E%20%20%3C%2Fg%3E%20%20%3Cg%20id%3D%22_x33__2_%22%3E%20%20%3C%2Fg%3E%20%20%3Cg%20id%3D%22_x33__1_%22%3E%20%20%3C%2Fg%3E%20%20%3Cg%20id%3D%22_x33_%22%3E%20%20%3C%2Fg%3E%20%20%3Cg%20id%3D%22Symbol_-_Original_10_%22%3E%20%20%3C%2Fg%3E%20%20%3Cg%20id%3D%22Symbol_-_Original_1_%22%3E%20%20%3C%2Fg%3E%20%20%3Cg%20id%3D%22Symbol_-_Original_2_%22%3E%20%20%3C%2Fg%3E%20%20%3Cg%20id%3D%22_x34__1_%22%3E%20%20%3C%2Fg%3E%20%20%3Cg%20id%3D%22Symbol_-_Monochromatic_2_%22%3E%20%20%20%3Cg%20id%3D%22_x33__6_%22%3E%20%20%20%3C%2Fg%3E%20%20%3C%2Fg%3E%20%20%3Cg%20id%3D%22One_color_version_-_White_2_%22%3E%20%20%20%3Cg%20id%3D%22Symbol_-_Original_11_%22%3E%20%20%20%3C%2Fg%3E%20%20%3C%2Fg%3E%20%20%3Cg%20id%3D%22Symbol_-_Original_5_%22%3E%20%20%20%3Cg%20id%3D%22Symbol_-_Original_12_%22%3E%20%20%20%3C%2Fg%3E%20%20%3C%2Fg%3E%20%20%3Cg%20id%3D%22One_color_version_-_White_1_%22%3E%20%20%20%3Cg%20id%3D%22Symbol_-_Original_9_%22%3E%20%20%20%3C%2Fg%3E%20%20%3C%2Fg%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_1_2_%22%3E%20%20%3Cg%20id%3D%22SYMBOL_VER_2_4_%22%3E%20%20%3C%2Fg%3E%20%20%3Cg%20id%3D%22SYMBOL_VER_2-1-1_1_%22%3E%20%20%3C%2Fg%3E%20%20%3Cg%20id%3D%22SYMBOL_VER_2-2-1_1_%22%3E%20%20%3C%2Fg%3E%20%20%3Cg%20id%3D%22SYMBOL_VER_2-3-1_4_%22%3E%20%20%3C%2Fg%3E%20%20%3Cg%20id%3D%22New_Symbol_1_%22%3E%20%20%20%3Cg%20id%3D%22SYMBOL_VER_2-3-1_3_%22%3E%20%20%20%3C%2Fg%3E%20%20%3C%2Fg%3E%20%20%3Cg%20id%3D%22New_Symbol%22%3E%20%20%20%3Cg%20id%3D%22SYMBOL_VER_2-3-1_1_%22%3E%20%20%20%3C%2Fg%3E%20%20%3C%2Fg%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_2_2_%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_4_2_%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_3_2_%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_3_1_%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_1-1-1_1_%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_1-1-1%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_1-1-1_2_2_%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_1-1-1_2%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_1-1-1_2_1_%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22Symbol_-_Original_7_%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22Symbol_-_Original_8_%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_2-1-1%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_2-2-1%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_2-3-1%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_5-1_1_%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_5-1%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_5-2_1_%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22SYMBOL_VER_5-2%22%3E%20%3C%2Fg%3E%20%3Cg%20id%3D%22Symbol_-_Monochromatic_1_%22%3E%20%20%3Cg%20id%3D%22_x33__4_%22%3E%20%20%3C%2Fg%3E%20%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E";

var optimismLogoUrl = "data:image/svg+xml,%3Csvg%20width%3D%22170%22%20height%3D%22168%22%20viewBox%3D%220%200%20170%20168%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20clip-path%3D%22url%28%23clip0%29%22%3E%3Cpath%20opacity%3D%220.6%22%20d%3D%22M85.05%20168C132.022%20168%20170.1%20130.105%20170.1%2083.3593C170.1%2036.6135%200%2036.6135%200%2083.3593C0%20130.105%2038.0782%20168%2085.05%20168Z%22%20fill%3D%22%23FF505F%22%2F%3E%3Cpath%20opacity%3D%220.6%22%20d%3D%22M85.05%20168C132.022%20168%20170.1%20130.105%20170.1%2083.3593C170.1%2036.6135%200%2036.6135%200%2083.3593C0%20130.105%2038.0782%20168%2085.05%20168Z%22%20fill%3D%22%23FF0320%22%2F%3E%3Cpath%20d%3D%22M85.05%200C132.022%200%20170.1%2037.8949%20170.1%2084.6407C170.1%20131.386%200%20131.386%200%2084.6407C0%2037.8949%2038.0782%200%2085.05%200Z%22%20fill%3D%22white%22%2F%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M144.665%2064.0394L112.444%2012.3742L89.0263%2078.9477L144.665%2064.0394Z%22%20fill%3D%22%23FF4E65%22%2F%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M143.777%2064.215L112.444%2012.3742L165.349%2058.4347L143.777%2064.215Z%22%20fill%3D%22white%22%2F%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M144.551%2063.613L142.479%20124.467L88.912%2078.5213L144.551%2063.613Z%22%20fill%3D%22%23D0001A%22%2F%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M143.663%2063.7886L142.479%20124.467L165.235%2058.0083L143.663%2063.7886Z%22%20fill%3D%22%23FF697B%22%2F%3E%3C%2Fg%3E%3Cdefs%3E%3CclipPath%20id%3D%22clip0%22%3E%3Crect%20width%3D%22170%22%20height%3D%22168%22%20fill%3D%22white%22%2F%3E%3C%2FclipPath%3E%3C%2Fdefs%3E%3C%2Fsvg%3E";

var polygonMaticLogo = "data:image/svg+xml,%3C%3Fxml%20version%3D%221.0%22%20encoding%3D%22utf-8%22%3F%3E%3Csvg%20version%3D%221.1%22%20id%3D%22Layer_1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20x%3D%220px%22%20y%3D%220px%22%20%20viewBox%3D%220%200%2038.4%2033.5%22%20style%3D%22enable-background%3Anew%200%200%2038.4%2033.5%3B%22%20xml%3Aspace%3D%22preserve%22%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%20.st0%7Bfill%3A%238247E5%3B%7D%3C%2Fstyle%3E%3Cg%3E%20%3Cpath%20class%3D%22st0%22%20d%3D%22M29%2C10.2c-0.7-0.4-1.6-0.4-2.4%2C0L21%2C13.5l-3.8%2C2.1l-5.5%2C3.3c-0.7%2C0.4-1.6%2C0.4-2.4%2C0L5%2C16.3%20%20c-0.7-0.4-1.2-1.2-1.2-2.1v-5c0-0.8%2C0.4-1.6%2C1.2-2.1l4.3-2.5c0.7-0.4%2C1.6-0.4%2C2.4%2C0L16%2C7.2c0.7%2C0.4%2C1.2%2C1.2%2C1.2%2C2.1v3.3l3.8-2.2V7%20%20c0-0.8-0.4-1.6-1.2-2.1l-8-4.7c-0.7-0.4-1.6-0.4-2.4%2C0L1.2%2C5C0.4%2C5.4%2C0%2C6.2%2C0%2C7v9.4c0%2C0.8%2C0.4%2C1.6%2C1.2%2C2.1l8.1%2C4.7%20%20c0.7%2C0.4%2C1.6%2C0.4%2C2.4%2C0l5.5-3.2l3.8-2.2l5.5-3.2c0.7-0.4%2C1.6-0.4%2C2.4%2C0l4.3%2C2.5c0.7%2C0.4%2C1.2%2C1.2%2C1.2%2C2.1v5c0%2C0.8-0.4%2C1.6-1.2%2C2.1%20%20L29%2C28.8c-0.7%2C0.4-1.6%2C0.4-2.4%2C0l-4.3-2.5c-0.7-0.4-1.2-1.2-1.2-2.1V21l-3.8%2C2.2v3.3c0%2C0.8%2C0.4%2C1.6%2C1.2%2C2.1l8.1%2C4.7%20%20c0.7%2C0.4%2C1.6%2C0.4%2C2.4%2C0l8.1-4.7c0.7-0.4%2C1.2-1.2%2C1.2-2.1V17c0-0.8-0.4-1.6-1.2-2.1L29%2C10.2z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E";

var _a$g;
/**
 * List of all the networks supported by the Uniswap Interface
 */
var SupportedChainId;
(function (SupportedChainId) {
    SupportedChainId[SupportedChainId["MAINNET"] = 1] = "MAINNET";
    SupportedChainId[SupportedChainId["ROPSTEN"] = 3] = "ROPSTEN";
    SupportedChainId[SupportedChainId["RINKEBY"] = 4] = "RINKEBY";
    SupportedChainId[SupportedChainId["GOERLI"] = 5] = "GOERLI";
    SupportedChainId[SupportedChainId["KOVAN"] = 42] = "KOVAN";
    SupportedChainId[SupportedChainId["ARBITRUM_ONE"] = 42161] = "ARBITRUM_ONE";
    SupportedChainId[SupportedChainId["ARBITRUM_RINKEBY"] = 421611] = "ARBITRUM_RINKEBY";
    SupportedChainId[SupportedChainId["OPTIMISM"] = 10] = "OPTIMISM";
    SupportedChainId[SupportedChainId["OPTIMISTIC_KOVAN"] = 69] = "OPTIMISTIC_KOVAN";
    SupportedChainId[SupportedChainId["POLYGON"] = 137] = "POLYGON";
    SupportedChainId[SupportedChainId["POLYGON_MUMBAI"] = 80001] = "POLYGON_MUMBAI";
})(SupportedChainId || (SupportedChainId = {}));
(_a$g = {},
    _a$g[SupportedChainId.MAINNET] = 'mainnet',
    _a$g[SupportedChainId.ROPSTEN] = 'ropsten',
    _a$g[SupportedChainId.RINKEBY] = 'rinkeby',
    _a$g[SupportedChainId.GOERLI] = 'goerli',
    _a$g[SupportedChainId.KOVAN] = 'kovan',
    _a$g[SupportedChainId.POLYGON] = 'polygon',
    _a$g[SupportedChainId.POLYGON_MUMBAI] = 'polygon_mumbai',
    _a$g[SupportedChainId.ARBITRUM_ONE] = 'arbitrum',
    _a$g[SupportedChainId.ARBITRUM_RINKEBY] = 'arbitrum_rinkeby',
    _a$g[SupportedChainId.OPTIMISM] = 'optimism',
    _a$g[SupportedChainId.OPTIMISTIC_KOVAN] = 'optimistic_kovan',
    _a$g);
/**
 * Array of all the supported chain IDs
 */
var ALL_SUPPORTED_CHAIN_IDS = Object.values(SupportedChainId).filter(function (id) { return typeof id === 'number'; });
var SUPPORTED_GAS_ESTIMATE_CHAIN_IDS = [SupportedChainId.MAINNET, SupportedChainId.POLYGON];
/**
 * All the chain IDs that are running the Ethereum protocol.
 */
[
    SupportedChainId.MAINNET,
    SupportedChainId.ROPSTEN,
    SupportedChainId.RINKEBY,
    SupportedChainId.GOERLI,
    SupportedChainId.KOVAN,
    SupportedChainId.POLYGON,
    SupportedChainId.POLYGON_MUMBAI,
];
/**
 * Controls some L2 specific behavior, e.g. slippage tolerance, special UI behavior.
 * The expectation is that all of these networks have immediate transaction confirmation.
 */
var L2_CHAIN_IDS = [
    SupportedChainId.ARBITRUM_ONE,
    SupportedChainId.ARBITRUM_RINKEBY,
    SupportedChainId.OPTIMISM,
    SupportedChainId.OPTIMISTIC_KOVAN,
];

var UNI_LIST = 'https://tokens.uniswap.org';
var AAVE_LIST = 'tokenlist.aave.eth';
var BA_LIST = 'https://raw.githubusercontent.com/The-Blockchain-Association/sec-notice-list/master/ba-sec-list.json';
var CMC_ALL_LIST = 'https://api.coinmarketcap.com/data-api/v3/uniswap/all.json';
var COINGECKO_LIST = 'https://tokens.coingecko.com/uniswap/all.json';
var COMPOUND_LIST = 'https://raw.githubusercontent.com/compound-finance/token-list/master/compound.tokenlist.json';
var GEMINI_LIST = 'https://www.gemini.com/uniswap/manifest.json';
var ARBITRUM_LIST = 'https://bridge.arbitrum.io/token-list-42161.json';
var KLEROS_LIST = 't2crtokens.eth';
var OPTIMISM_LIST = 'https://static.optimism.io/optimism.tokenlist.json';
var ROLL_LIST = 'https://app.tryroll.com/tokens.json';
var SET_LIST = 'https://raw.githubusercontent.com/SetProtocol/uniswap-tokenlist/main/set.tokenlist.json';
var WRAPPED_LIST = 'wrapped.tokensoft.eth';
var UNSUPPORTED_LIST_URLS = [BA_LIST];
// this is the default list of lists that are exposed to users
// lower index == higher priority for token import
var DEFAULT_LIST_OF_LISTS_TO_DISPLAY = [
    UNI_LIST,
    COMPOUND_LIST,
    AAVE_LIST,
    CMC_ALL_LIST,
    COINGECKO_LIST,
    KLEROS_LIST,
    GEMINI_LIST,
    WRAPPED_LIST,
    SET_LIST,
    ROLL_LIST,
    ARBITRUM_LIST,
    OPTIMISM_LIST,
];
var DEFAULT_LIST_OF_LISTS = __spreadArray(__spreadArray([], __read(DEFAULT_LIST_OF_LISTS_TO_DISPLAY), false), __read(UNSUPPORTED_LIST_URLS), false);
// default lists to be 'active' aka searched across
var DEFAULT_ACTIVE_LIST_URLS = [UNI_LIST, GEMINI_LIST];

var _a$f, _b$6;
var INFURA_KEY = process.env.REACT_APP_INFURA_KEY;
if (typeof INFURA_KEY === 'undefined') {
    throw new Error("REACT_APP_INFURA_KEY must be a defined environment variable");
}
/**
 * These are the network URLs used by the interface when there is not another available source of chain data
 */
var INFURA_NETWORK_URLS = (_a$f = {},
    _a$f[SupportedChainId.MAINNET] = "https://mainnet.infura.io/v3/" + INFURA_KEY,
    _a$f[SupportedChainId.RINKEBY] = "https://rinkeby.infura.io/v3/" + INFURA_KEY,
    _a$f[SupportedChainId.ROPSTEN] = "https://ropsten.infura.io/v3/" + INFURA_KEY,
    _a$f[SupportedChainId.GOERLI] = "https://goerli.infura.io/v3/" + INFURA_KEY,
    _a$f[SupportedChainId.KOVAN] = "https://kovan.infura.io/v3/" + INFURA_KEY,
    _a$f[SupportedChainId.OPTIMISM] = "https://optimism-mainnet.infura.io/v3/" + INFURA_KEY,
    _a$f[SupportedChainId.OPTIMISTIC_KOVAN] = "https://optimism-kovan.infura.io/v3/" + INFURA_KEY,
    _a$f[SupportedChainId.ARBITRUM_ONE] = "https://arbitrum-mainnet.infura.io/v3/" + INFURA_KEY,
    _a$f[SupportedChainId.ARBITRUM_RINKEBY] = "https://arbitrum-rinkeby.infura.io/v3/" + INFURA_KEY,
    _a$f[SupportedChainId.POLYGON] = "https://polygon-mainnet.infura.io/v3/" + INFURA_KEY,
    _a$f[SupportedChainId.POLYGON_MUMBAI] = "https://polygon-mumbai.infura.io/v3/" + INFURA_KEY,
    _a$f);
var NetworkType;
(function (NetworkType) {
    NetworkType[NetworkType["L1"] = 0] = "L1";
    NetworkType[NetworkType["L2"] = 1] = "L2";
})(NetworkType || (NetworkType = {}));
var CHAIN_INFO = (_b$6 = {},
    _b$6[SupportedChainId.MAINNET] = {
        networkType: NetworkType.L1,
        docs: 'https://docs.uniswap.org/',
        explorer: 'https://etherscan.io/',
        infoLink: 'https://info.uniswap.org/#/',
        label: 'Ethereum',
        logoUrl: EthereumLogo,
        addNetworkInfo: {
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrl: INFURA_NETWORK_URLS[SupportedChainId.MAINNET],
        },
    },
    _b$6[SupportedChainId.RINKEBY] = {
        networkType: NetworkType.L1,
        docs: 'https://docs.uniswap.org/',
        explorer: 'https://rinkeby.etherscan.io/',
        infoLink: 'https://info.uniswap.org/#/',
        label: 'Rinkeby',
        logoUrl: EthereumLogo,
        addNetworkInfo: {
            nativeCurrency: { name: 'Rinkeby Ether', symbol: 'rETH', decimals: 18 },
            rpcUrl: INFURA_NETWORK_URLS[SupportedChainId.RINKEBY],
        },
    },
    _b$6[SupportedChainId.ROPSTEN] = {
        networkType: NetworkType.L1,
        docs: 'https://docs.uniswap.org/',
        explorer: 'https://ropsten.etherscan.io/',
        infoLink: 'https://info.uniswap.org/#/',
        label: 'Ropsten',
        logoUrl: EthereumLogo,
        addNetworkInfo: {
            nativeCurrency: { name: 'Ropsten Ether', symbol: 'ropETH', decimals: 18 },
            rpcUrl: INFURA_NETWORK_URLS[SupportedChainId.ROPSTEN],
        },
    },
    _b$6[SupportedChainId.KOVAN] = {
        networkType: NetworkType.L1,
        docs: 'https://docs.uniswap.org/',
        explorer: 'https://kovan.etherscan.io/',
        infoLink: 'https://info.uniswap.org/#/',
        label: 'Kovan',
        logoUrl: EthereumLogo,
        addNetworkInfo: {
            nativeCurrency: { name: 'Kovan Ether', symbol: 'kovETH', decimals: 18 },
            rpcUrl: INFURA_NETWORK_URLS[SupportedChainId.KOVAN],
        },
    },
    _b$6[SupportedChainId.GOERLI] = {
        networkType: NetworkType.L1,
        docs: 'https://docs.uniswap.org/',
        explorer: 'https://goerli.etherscan.io/',
        infoLink: 'https://info.uniswap.org/#/',
        label: 'Görli',
        logoUrl: EthereumLogo,
        addNetworkInfo: {
            nativeCurrency: { name: 'Görli Ether', symbol: 'görETH', decimals: 18 },
            rpcUrl: INFURA_NETWORK_URLS[SupportedChainId.GOERLI],
        },
    },
    _b$6[SupportedChainId.OPTIMISM] = {
        networkType: NetworkType.L2,
        blockWaitMsBeforeWarning: ms__default["default"](templateObject_1$X || (templateObject_1$X = __makeTemplateObject(["25m"], ["25m"]))),
        bridge: 'https://gateway.optimism.io/?chainId=1',
        defaultListUrl: OPTIMISM_LIST,
        docs: 'https://optimism.io/',
        explorer: 'https://optimistic.etherscan.io/',
        infoLink: 'https://info.uniswap.org/#/optimism/',
        label: 'Optimism',
        logoUrl: optimismLogoUrl,
        statusPage: 'https://optimism.io/status',
        helpCenterUrl: 'https://help.uniswap.org/en/collections/3137778-uniswap-on-optimistic-ethereum-oξ',
        addNetworkInfo: {
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrl: 'https://mainnet.optimism.io',
        },
    },
    _b$6[SupportedChainId.OPTIMISTIC_KOVAN] = {
        networkType: NetworkType.L2,
        blockWaitMsBeforeWarning: ms__default["default"](templateObject_2$E || (templateObject_2$E = __makeTemplateObject(["25m"], ["25m"]))),
        bridge: 'https://gateway.optimism.io/',
        defaultListUrl: OPTIMISM_LIST,
        docs: 'https://optimism.io/',
        explorer: 'https://optimistic.etherscan.io/',
        infoLink: 'https://info.uniswap.org/#/optimism/',
        label: 'Optimistic Kovan',
        logoUrl: optimismLogoUrl,
        statusPage: 'https://optimism.io/status',
        helpCenterUrl: 'https://help.uniswap.org/en/collections/3137778-uniswap-on-optimistic-ethereum-oξ',
        addNetworkInfo: {
            nativeCurrency: { name: 'Optimistic Kovan Ether', symbol: 'kovOpETH', decimals: 18 },
            rpcUrl: 'https://kovan.optimism.io',
        },
    },
    _b$6[SupportedChainId.ARBITRUM_ONE] = {
        networkType: NetworkType.L2,
        blockWaitMsBeforeWarning: ms__default["default"](templateObject_3$x || (templateObject_3$x = __makeTemplateObject(["10m"], ["10m"]))),
        bridge: 'https://bridge.arbitrum.io/',
        docs: 'https://offchainlabs.com/',
        explorer: 'https://arbiscan.io/',
        infoLink: 'https://info.uniswap.org/#/arbitrum',
        label: 'Arbitrum',
        logoUrl: arbitrumLogoUrl,
        defaultListUrl: ARBITRUM_LIST,
        helpCenterUrl: 'https://help.uniswap.org/en/collections/3137787-uniswap-on-arbitrum',
        addNetworkInfo: {
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrl: 'https://arb1.arbitrum.io/rpc',
        },
    },
    _b$6[SupportedChainId.ARBITRUM_RINKEBY] = {
        networkType: NetworkType.L2,
        blockWaitMsBeforeWarning: ms__default["default"](templateObject_4$n || (templateObject_4$n = __makeTemplateObject(["10m"], ["10m"]))),
        bridge: 'https://bridge.arbitrum.io/',
        docs: 'https://offchainlabs.com/',
        explorer: 'https://rinkeby-explorer.arbitrum.io/',
        infoLink: 'https://info.uniswap.org/#/arbitrum/',
        label: 'Arbitrum Rinkeby',
        logoUrl: arbitrumLogoUrl,
        defaultListUrl: ARBITRUM_LIST,
        helpCenterUrl: 'https://help.uniswap.org/en/collections/3137787-uniswap-on-arbitrum',
        addNetworkInfo: {
            nativeCurrency: { name: 'Rinkeby Arbitrum Ether', symbol: 'rinkArbETH', decimals: 18 },
            rpcUrl: 'https://rinkeby.arbitrum.io/rpc',
        },
    },
    _b$6[SupportedChainId.POLYGON] = {
        networkType: NetworkType.L1,
        blockWaitMsBeforeWarning: ms__default["default"](templateObject_5$k || (templateObject_5$k = __makeTemplateObject(["10m"], ["10m"]))),
        bridge: 'https://wallet.polygon.technology/bridge',
        docs: 'https://polygon.io/',
        explorer: 'https://polygonscan.com/',
        infoLink: 'https://info.uniswap.org/#/polygon/',
        label: 'Polygon',
        logoUrl: polygonMaticLogo,
        addNetworkInfo: {
            rpcUrl: 'https://polygon-rpc.com/',
            nativeCurrency: { name: 'Polygon Matic', symbol: 'MATIC', decimals: 18 },
        },
    },
    _b$6[SupportedChainId.POLYGON_MUMBAI] = {
        networkType: NetworkType.L1,
        blockWaitMsBeforeWarning: ms__default["default"](templateObject_6$e || (templateObject_6$e = __makeTemplateObject(["10m"], ["10m"]))),
        bridge: 'https://wallet.polygon.technology/bridge',
        docs: 'https://polygon.io/',
        explorer: 'https://mumbai.polygonscan.com/',
        infoLink: 'https://info.uniswap.org/#/polygon/',
        label: 'Polygon Mumbai',
        logoUrl: polygonMaticLogo,
        addNetworkInfo: {
            nativeCurrency: { name: 'Polygon Mumbai Matic', symbol: 'mMATIC', decimals: 18 },
            rpcUrl: 'https://rpc-endpoints.superfluid.dev/mumbai',
        },
    },
    _b$6);
var templateObject_1$X, templateObject_2$E, templateObject_3$x, templateObject_4$n, templateObject_5$k, templateObject_6$e;

var EMPTY_CONNECTOR = core.initializeConnector(function () { return empty.EMPTY; });
var urlAtom = utils.atomWithDefault(function () { return EMPTY_CONNECTOR; });
var injectedAtom = utils.atomWithDefault(function () { return EMPTY_CONNECTOR; });

function useActiveWeb3ReactState() {
    var injected = utils.useAtomValue(injectedAtom);
    var url = utils.useAtomValue(urlAtom);
    return injected[1].useIsActive() ? injected : url;
}
function useActiveWeb3ReactHooks() {
    var _a = __read(useActiveWeb3ReactState(), 2), hooks = _a[1];
    return hooks;
}
function useActiveWeb3React$1() {
    var _a = useActiveWeb3ReactHooks(), useProvider = _a.useProvider, useWeb3React = _a.useWeb3React;
    return useWeb3React(useProvider());
}

var NetworkContextName = 'NETWORK';
// 30 minutes, denominated in seconds
var DEFAULT_DEADLINE_FROM_NOW = 60 * 30;
var L2_DEADLINE_FROM_NOW = 60 * 5;
// transaction popup dismisal amounts
var DEFAULT_TXN_DISMISS_MS = 25000;
// used for rewards deadlines
JSBI__default["default"].BigInt(60 * 60 * 24 * 7);
JSBI__default["default"].BigInt(0);
// one basis JSBI.BigInt
var BIPS_BASE = JSBI__default["default"].BigInt(10000);
new sdkCore.Percent(JSBI__default["default"].BigInt(1), BIPS_BASE);
// used for warning states
var ALLOWED_PRICE_IMPACT_LOW = new sdkCore.Percent(JSBI__default["default"].BigInt(100), BIPS_BASE); // 1%
var ALLOWED_PRICE_IMPACT_MEDIUM = new sdkCore.Percent(JSBI__default["default"].BigInt(300), BIPS_BASE); // 3%
var ALLOWED_PRICE_IMPACT_HIGH = new sdkCore.Percent(JSBI__default["default"].BigInt(500), BIPS_BASE); // 5%
// if the price slippage exceeds this number, force the user to type 'confirm' to execute
var PRICE_IMPACT_WITHOUT_FEE_CONFIRM_MIN = new sdkCore.Percent(JSBI__default["default"].BigInt(1000), BIPS_BASE); // 10%
// for non expert mode disable swaps above this
var BLOCKED_PRICE_IMPACT_NON_EXPERT = new sdkCore.Percent(JSBI__default["default"].BigInt(1500), BIPS_BASE); // 15%
var BETTER_TRADE_LESS_HOPS_THRESHOLD = new sdkCore.Percent(JSBI__default["default"].BigInt(50), BIPS_BASE);
var ZERO_PERCENT = new sdkCore.Percent('0');
new sdkCore.Percent(JSBI__default["default"].BigInt(200), BIPS_BASE);
var ONE_HUNDRED_PERCENT = new sdkCore.Percent('1');

function useActiveWeb3React() {
    if (process.env.REACT_APP_IS_WIDGET) {
        return useActiveWeb3React$1();
    }
    var interfaceContext = core$1.useWeb3React();
    var interfaceNetworkContext = core$1.useWeb3React(process.env.REACT_APP_IS_WIDGET ? undefined : NetworkContextName);
    if (interfaceContext.active) {
        return interfaceContext;
    }
    return interfaceNetworkContext;
}

var useAppDispatch = function () { return reactRedux.useDispatch(); };
var useAppSelector = reactRedux.useSelector;

var DEFAULT_NETWORKS = [
    SupportedChainId.MAINNET,
    SupportedChainId.ROPSTEN,
    SupportedChainId.RINKEBY,
    SupportedChainId.GOERLI,
    SupportedChainId.KOVAN,
];
function constructSameAddressMap(address, additionalNetworks) {
    if (additionalNetworks === void 0) { additionalNetworks = []; }
    return DEFAULT_NETWORKS.concat(additionalNetworks).reduce(function (memo, chainId) {
        memo[chainId] = address;
        return memo;
    }, {});
}

var _a$e, _b$5, _c$4, _d$3, _e$2, _f$1, _g$1, _h$1;
var UNI_ADDRESS = constructSameAddressMap('0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984');
var MULTICALL_ADDRESS = __assign(__assign({}, constructSameAddressMap('0x1F98415757620B543A52E61c46B32eB19261F984', [
    SupportedChainId.OPTIMISTIC_KOVAN,
    SupportedChainId.OPTIMISM,
    SupportedChainId.POLYGON_MUMBAI,
    SupportedChainId.POLYGON,
])), (_a$e = {}, _a$e[SupportedChainId.ARBITRUM_ONE] = '0xadF885960B47eA2CD9B55E6DAc6B42b7Cb2806dB', _a$e[SupportedChainId.ARBITRUM_RINKEBY] = '0xa501c031958F579dB7676fF1CE78AD305794d579', _a$e));
var V2_FACTORY_ADDRESSES = constructSameAddressMap(v2Sdk.FACTORY_ADDRESS);
var V2_ROUTER_ADDRESS = constructSameAddressMap('0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D');
var V3_ROUTER_ADDRESS = constructSameAddressMap('0xE592427A0AEce92De3Edee1F18E0157C05861564', [
    SupportedChainId.OPTIMISM,
    SupportedChainId.OPTIMISTIC_KOVAN,
    SupportedChainId.ARBITRUM_ONE,
    SupportedChainId.ARBITRUM_RINKEBY,
    SupportedChainId.POLYGON,
    SupportedChainId.POLYGON_MUMBAI,
]);
var SWAP_ROUTER_ADDRESSES = constructSameAddressMap('0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', [
    SupportedChainId.OPTIMISM,
    SupportedChainId.OPTIMISTIC_KOVAN,
    SupportedChainId.ARBITRUM_ONE,
    SupportedChainId.ARBITRUM_RINKEBY,
    SupportedChainId.POLYGON,
    SupportedChainId.POLYGON_MUMBAI,
]);
/**
 * The oldest V0 governance address
 */
constructSameAddressMap('0x5e4be8Bc9637f0EAA1A755019e06A68ce081D58F');
/**
 * The older V1 governance address
 */
(_b$5 = {},
    _b$5[SupportedChainId.MAINNET] = '0xC4e172459f1E7939D522503B81AFAaC1014CE6F6',
    _b$5);
/**
 * The latest governor bravo that is currently admin of timelock
 */
(_c$4 = {},
    _c$4[SupportedChainId.MAINNET] = '0x408ED6354d4973f66138C91495F2f2FCbd8724C3',
    _c$4);
constructSameAddressMap('0x1a9C8182C09F50C8318d769245beA52c32BE35BC');
(_d$3 = {},
    _d$3[SupportedChainId.MAINNET] = '0x090D4613473dEE047c3f2706764f49E0821D256e',
    _d$3);
var ARGENT_WALLET_DETECTOR_ADDRESS = (_e$2 = {},
    _e$2[SupportedChainId.MAINNET] = '0xeca4B0bDBf7c55E9b7925919d03CbF8Dc82537E8',
    _e$2);
var V3_CORE_FACTORY_ADDRESSES = constructSameAddressMap(v3Sdk.FACTORY_ADDRESS, [
    SupportedChainId.OPTIMISM,
    SupportedChainId.OPTIMISTIC_KOVAN,
    SupportedChainId.ARBITRUM_ONE,
    SupportedChainId.ARBITRUM_RINKEBY,
    SupportedChainId.POLYGON_MUMBAI,
    SupportedChainId.POLYGON,
]);
var QUOTER_ADDRESSES = constructSameAddressMap('0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6', [
    SupportedChainId.OPTIMISM,
    SupportedChainId.OPTIMISTIC_KOVAN,
    SupportedChainId.ARBITRUM_ONE,
    SupportedChainId.ARBITRUM_RINKEBY,
    SupportedChainId.POLYGON_MUMBAI,
    SupportedChainId.POLYGON,
]);
constructSameAddressMap('0xC36442b4a4522E871399CD717aBDD847Ab11FE88', [
    SupportedChainId.OPTIMISM,
    SupportedChainId.OPTIMISTIC_KOVAN,
    SupportedChainId.ARBITRUM_ONE,
    SupportedChainId.ARBITRUM_RINKEBY,
    SupportedChainId.POLYGON_MUMBAI,
    SupportedChainId.POLYGON,
]);
var ENS_REGISTRAR_ADDRESSES = (_f$1 = {},
    _f$1[SupportedChainId.MAINNET] = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    _f$1[SupportedChainId.ROPSTEN] = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    _f$1[SupportedChainId.GOERLI] = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    _f$1[SupportedChainId.RINKEBY] = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    _f$1);
(_g$1 = {},
    _g$1[SupportedChainId.MAINNET] = '0x65770b5283117639760beA3F867b69b3697a91dd',
    _g$1);
constructSameAddressMap('0xA5644E29708357803b5A882D272c41cC0dF92B34', [
    SupportedChainId.ARBITRUM_ONE,
    SupportedChainId.ARBITRUM_RINKEBY,
    SupportedChainId.POLYGON_MUMBAI,
    SupportedChainId.POLYGON,
]);
(_h$1 = {},
    _h$1[SupportedChainId.ARBITRUM_ONE] = '0xbfd8137f7d1516D3ea5cA83523914859ec47F573',
    _h$1[SupportedChainId.ARBITRUM_RINKEBY] = '0xbfd8137f7d1516D3ea5cA83523914859ec47F573',
    _h$1);

var _a$d, _b$4;
var AMPL = new sdkCore.Token(SupportedChainId.MAINNET, '0xD46bA6D942050d489DBd938a2C909A5d5039A161', 9, 'AMPL', 'Ampleforth');
var DAI = new sdkCore.Token(SupportedChainId.MAINNET, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI', 'Dai Stablecoin');
var DAI_ARBITRUM_ONE = new sdkCore.Token(SupportedChainId.ARBITRUM_ONE, '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', 18, 'DAI', 'Dai stable coin');
var DAI_OPTIMISM = new sdkCore.Token(SupportedChainId.OPTIMISM, '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', 18, 'DAI', 'Dai stable coin');
var USDC = new sdkCore.Token(SupportedChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC', 'USD//C');
var USDC_ARBITRUM = new sdkCore.Token(SupportedChainId.ARBITRUM_ONE, '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', 6, 'USDC', 'USD//C');
var USDC_POLYGON = new sdkCore.Token(SupportedChainId.POLYGON, '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', 6, 'USDC', 'USD//C');
var DAI_POLYGON = new sdkCore.Token(SupportedChainId.POLYGON, '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', 18, 'DAI', 'Dai Stablecoin');
var USDT_POLYGON = new sdkCore.Token(SupportedChainId.POLYGON, '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', 6, 'USDT', 'Tether USD');
var WBTC_POLYGON = new sdkCore.Token(SupportedChainId.POLYGON, '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6', 8, 'WBTC', 'Wrapped BTC');
var USDC_OPTIMISM = new sdkCore.Token(SupportedChainId.OPTIMISM, '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', 6, 'USDC', 'USD//C');
var USDT = new sdkCore.Token(SupportedChainId.MAINNET, '0xdAC17F958D2ee523a2206206994597C13D831ec7', 6, 'USDT', 'Tether USD');
var USDT_ARBITRUM_ONE = new sdkCore.Token(SupportedChainId.ARBITRUM_ONE, '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', 6, 'USDT', 'Tether USD');
var USDT_OPTIMISM = new sdkCore.Token(SupportedChainId.OPTIMISM, '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', 6, 'USDT', 'Tether USD');
var WBTC = new sdkCore.Token(SupportedChainId.MAINNET, '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', 8, 'WBTC', 'Wrapped BTC');
var WBTC_ARBITRUM_ONE = new sdkCore.Token(SupportedChainId.ARBITRUM_ONE, '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', 8, 'WBTC', 'Wrapped BTC');
var WBTC_OPTIMISM = new sdkCore.Token(SupportedChainId.OPTIMISM, '0x68f180fcCe6836688e9084f035309E29Bf0A2095', 8, 'WBTC', 'Wrapped BTC');
var FEI = new sdkCore.Token(SupportedChainId.MAINNET, '0x956F47F50A910163D8BF957Cf5846D573E7f87CA', 18, 'FEI', 'Fei USD');
var TRIBE = new sdkCore.Token(SupportedChainId.MAINNET, '0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B', 18, 'TRIBE', 'Tribe');
var FRAX = new sdkCore.Token(SupportedChainId.MAINNET, '0x853d955aCEf822Db058eb8505911ED77F175b99e', 18, 'FRAX', 'Frax');
var FXS = new sdkCore.Token(SupportedChainId.MAINNET, '0x3432B6A60D23Ca0dFCa7761B7ab56459D9C964D0', 18, 'FXS', 'Frax Share');
var renBTC = new sdkCore.Token(SupportedChainId.MAINNET, '0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D', 8, 'renBTC', 'renBTC');
var ETH2X_FLI = new sdkCore.Token(SupportedChainId.MAINNET, '0xAa6E8127831c9DE45ae56bB1b0d4D4Da6e5665BD', 18, 'ETH2x-FLI', 'ETH 2x Flexible Leverage Index');
var sETH2 = new sdkCore.Token(SupportedChainId.MAINNET, '0xFe2e637202056d30016725477c5da089Ab0A043A', 18, 'sETH2', 'StakeWise Staked ETH2');
var rETH2 = new sdkCore.Token(SupportedChainId.MAINNET, '0x20BC832ca081b91433ff6c17f85701B6e92486c5', 18, 'rETH2', 'StakeWise Reward ETH2');
var SWISE = new sdkCore.Token(SupportedChainId.MAINNET, '0x48C3399719B582dD63eB5AADf12A40B4C3f52FA2', 18, 'SWISE', 'StakeWise');
var WETH_POLYGON_MUMBAI = new sdkCore.Token(SupportedChainId.POLYGON_MUMBAI, '0xa6fa4fb5f76172d178d61b04b0ecd319c5d1c0aa', 18, 'WETH', 'Wrapped Ether');
var WETH_POLYGON = new sdkCore.Token(SupportedChainId.POLYGON, '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619', 18, 'WETH', 'Wrapped Ether');
var UNI = (_a$d = {},
    _a$d[SupportedChainId.MAINNET] = new sdkCore.Token(SupportedChainId.MAINNET, UNI_ADDRESS[1], 18, 'UNI', 'Uniswap'),
    _a$d[SupportedChainId.RINKEBY] = new sdkCore.Token(SupportedChainId.RINKEBY, UNI_ADDRESS[4], 18, 'UNI', 'Uniswap'),
    _a$d[SupportedChainId.ROPSTEN] = new sdkCore.Token(SupportedChainId.ROPSTEN, UNI_ADDRESS[3], 18, 'UNI', 'Uniswap'),
    _a$d[SupportedChainId.GOERLI] = new sdkCore.Token(SupportedChainId.GOERLI, UNI_ADDRESS[5], 18, 'UNI', 'Uniswap'),
    _a$d[SupportedChainId.KOVAN] = new sdkCore.Token(SupportedChainId.KOVAN, UNI_ADDRESS[42], 18, 'UNI', 'Uniswap'),
    _a$d);
var WRAPPED_NATIVE_CURRENCY = __assign(__assign({}, sdkCore.WETH9), (_b$4 = {}, _b$4[SupportedChainId.OPTIMISM] = new sdkCore.Token(SupportedChainId.OPTIMISM, '0x4200000000000000000000000000000000000006', 18, 'WETH', 'Wrapped Ether'), _b$4[SupportedChainId.OPTIMISTIC_KOVAN] = new sdkCore.Token(SupportedChainId.OPTIMISTIC_KOVAN, '0x4200000000000000000000000000000000000006', 18, 'WETH', 'Wrapped Ether'), _b$4[SupportedChainId.ARBITRUM_ONE] = new sdkCore.Token(SupportedChainId.ARBITRUM_ONE, '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', 18, 'WETH', 'Wrapped Ether'), _b$4[SupportedChainId.ARBITRUM_RINKEBY] = new sdkCore.Token(SupportedChainId.ARBITRUM_RINKEBY, '0xB47e6A5f8b33b3F17603C83a0535A9dcD7E32681', 18, 'WETH', 'Wrapped Ether'), _b$4[SupportedChainId.POLYGON] = new sdkCore.Token(SupportedChainId.POLYGON, '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', 18, 'WMATIC', 'Wrapped MATIC'), _b$4[SupportedChainId.POLYGON_MUMBAI] = new sdkCore.Token(SupportedChainId.POLYGON_MUMBAI, '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889', 18, 'WMATIC', 'Wrapped MATIC'), _b$4));
function isMatic(chainId) {
    return chainId === SupportedChainId.POLYGON_MUMBAI || chainId === SupportedChainId.POLYGON;
}
var MaticNativeCurrency = /** @class */ (function (_super) {
    __extends(MaticNativeCurrency, _super);
    function MaticNativeCurrency(chainId) {
        var _this = this;
        if (!isMatic(chainId))
            throw new Error('Not matic');
        _this = _super.call(this, chainId, 18, 'MATIC', 'Polygon Matic') || this;
        return _this;
    }
    MaticNativeCurrency.prototype.equals = function (other) {
        return other.isNative && other.chainId === this.chainId;
    };
    Object.defineProperty(MaticNativeCurrency.prototype, "wrapped", {
        get: function () {
            if (!isMatic(this.chainId))
                throw new Error('Not matic');
            return WRAPPED_NATIVE_CURRENCY[this.chainId];
        },
        enumerable: false,
        configurable: true
    });
    return MaticNativeCurrency;
}(sdkCore.NativeCurrency));
var ExtendedEther = /** @class */ (function (_super) {
    __extends(ExtendedEther, _super);
    function ExtendedEther() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Object.defineProperty(ExtendedEther.prototype, "wrapped", {
        get: function () {
            if (this.chainId in WRAPPED_NATIVE_CURRENCY)
                return WRAPPED_NATIVE_CURRENCY[this.chainId];
            throw new Error('Unsupported chain ID');
        },
        enumerable: false,
        configurable: true
    });
    ExtendedEther.onChain = function (chainId) {
        var _a;
        return (_a = this._cachedExtendedEther[chainId]) !== null && _a !== void 0 ? _a : (this._cachedExtendedEther[chainId] = new ExtendedEther(chainId));
    };
    ExtendedEther._cachedExtendedEther = {};
    return ExtendedEther;
}(sdkCore.Ether));
var cachedNativeCurrency = {};
function nativeOnChain(chainId) {
    var _a;
    return ((_a = cachedNativeCurrency[chainId]) !== null && _a !== void 0 ? _a : (cachedNativeCurrency[chainId] = isMatic(chainId)
        ? new MaticNativeCurrency(chainId)
        : ExtendedEther.onChain(chainId)));
}

var _a$c, _b$3, _c$3, _d$2, _e$1, _f, _g, _h;
var WRAPPED_NATIVE_CURRENCIES_ONLY = Object.fromEntries(Object.entries(WRAPPED_NATIVE_CURRENCY).map(function (_a) {
    var _b = __read(_a, 2), key = _b[0], value = _b[1];
    return [key, [value]];
}));
// used to construct intermediary pairs for trading
var BASES_TO_CHECK_TRADES_AGAINST = __assign(__assign({}, WRAPPED_NATIVE_CURRENCIES_ONLY), (_a$c = {}, _a$c[SupportedChainId.MAINNET] = __spreadArray(__spreadArray([], __read(WRAPPED_NATIVE_CURRENCIES_ONLY[SupportedChainId.MAINNET]), false), [DAI, USDC, USDT, WBTC], false), _a$c[SupportedChainId.OPTIMISM] = __spreadArray(__spreadArray([], __read(WRAPPED_NATIVE_CURRENCIES_ONLY[SupportedChainId.OPTIMISM]), false), [
    DAI_OPTIMISM,
    USDT_OPTIMISM,
    WBTC_OPTIMISM,
], false), _a$c[SupportedChainId.ARBITRUM_ONE] = __spreadArray(__spreadArray([], __read(WRAPPED_NATIVE_CURRENCIES_ONLY[SupportedChainId.ARBITRUM_ONE]), false), [
    DAI_ARBITRUM_ONE,
    USDT_ARBITRUM_ONE,
    WBTC_ARBITRUM_ONE,
], false), _a$c[SupportedChainId.POLYGON] = __spreadArray(__spreadArray([], __read(WRAPPED_NATIVE_CURRENCIES_ONLY[SupportedChainId.POLYGON]), false), [
    DAI_POLYGON,
    USDC_POLYGON,
    USDT_POLYGON,
    WETH_POLYGON,
], false), _a$c));
var ADDITIONAL_BASES = (_b$3 = {},
    _b$3[SupportedChainId.MAINNET] = (_c$3 = {
            '0xF16E4d813f4DcfDe4c5b44f305c908742De84eF0': [ETH2X_FLI]
        },
        _c$3[rETH2.address] = [sETH2],
        _c$3[SWISE.address] = [sETH2],
        _c$3[FEI.address] = [TRIBE],
        _c$3[TRIBE.address] = [FEI],
        _c$3[FRAX.address] = [FXS],
        _c$3[FXS.address] = [FRAX],
        _c$3[WBTC.address] = [renBTC],
        _c$3[renBTC.address] = [WBTC],
        _c$3),
    _b$3);
/**
 * Some tokens can only be swapped via certain pairs, so we override the list of bases that are considered for these
 * tokens.
 */
var CUSTOM_BASES = (_d$2 = {},
    _d$2[SupportedChainId.MAINNET] = (_e$1 = {},
        _e$1[AMPL.address] = [DAI, WRAPPED_NATIVE_CURRENCY[SupportedChainId.MAINNET]],
        _e$1),
    _d$2);
/**
 * Shows up in the currency select for swap and add liquidity
 */
var COMMON_BASES = (_f = {},
    _f[SupportedChainId.MAINNET] = [
        nativeOnChain(SupportedChainId.MAINNET),
        DAI,
        USDC,
        USDT,
        WBTC,
        WRAPPED_NATIVE_CURRENCY[SupportedChainId.MAINNET],
    ],
    _f[SupportedChainId.ROPSTEN] = [
        nativeOnChain(SupportedChainId.ROPSTEN),
        WRAPPED_NATIVE_CURRENCY[SupportedChainId.ROPSTEN],
    ],
    _f[SupportedChainId.RINKEBY] = [
        nativeOnChain(SupportedChainId.RINKEBY),
        WRAPPED_NATIVE_CURRENCY[SupportedChainId.RINKEBY],
    ],
    _f[SupportedChainId.GOERLI] = [nativeOnChain(SupportedChainId.GOERLI), WRAPPED_NATIVE_CURRENCY[SupportedChainId.GOERLI]],
    _f[SupportedChainId.KOVAN] = [nativeOnChain(SupportedChainId.KOVAN), WRAPPED_NATIVE_CURRENCY[SupportedChainId.KOVAN]],
    _f[SupportedChainId.ARBITRUM_ONE] = [
        nativeOnChain(SupportedChainId.ARBITRUM_ONE),
        DAI_ARBITRUM_ONE,
        USDC_ARBITRUM,
        USDT_ARBITRUM_ONE,
        WBTC_ARBITRUM_ONE,
        WRAPPED_NATIVE_CURRENCY[SupportedChainId.ARBITRUM_ONE],
    ],
    _f[SupportedChainId.ARBITRUM_RINKEBY] = [
        nativeOnChain(SupportedChainId.ARBITRUM_RINKEBY),
        WRAPPED_NATIVE_CURRENCY[SupportedChainId.ARBITRUM_RINKEBY],
    ],
    _f[SupportedChainId.OPTIMISM] = [
        nativeOnChain(SupportedChainId.OPTIMISM),
        DAI_OPTIMISM,
        USDC_OPTIMISM,
        USDT_OPTIMISM,
        WBTC_OPTIMISM,
    ],
    _f[SupportedChainId.OPTIMISTIC_KOVAN] = [nativeOnChain(SupportedChainId.OPTIMISTIC_KOVAN)],
    _f[SupportedChainId.POLYGON] = [
        nativeOnChain(SupportedChainId.POLYGON),
        WETH_POLYGON,
        USDC_POLYGON,
        DAI_POLYGON,
        USDT_POLYGON,
        WBTC_POLYGON,
    ],
    _f[SupportedChainId.POLYGON_MUMBAI] = [
        nativeOnChain(SupportedChainId.POLYGON_MUMBAI),
        WRAPPED_NATIVE_CURRENCY[SupportedChainId.POLYGON_MUMBAI],
        WETH_POLYGON_MUMBAI,
    ],
    _f);
// used to construct the list of all pairs we consider by default in the frontend
__assign(__assign({}, WRAPPED_NATIVE_CURRENCIES_ONLY), (_g = {}, _g[SupportedChainId.MAINNET] = __spreadArray(__spreadArray([], __read(WRAPPED_NATIVE_CURRENCIES_ONLY[SupportedChainId.MAINNET]), false), [DAI, USDC, USDT, WBTC], false), _g));
(_h = {},
    _h[SupportedChainId.MAINNET] = [
        [
            new sdkCore.Token(SupportedChainId.MAINNET, '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643', 8, 'cDAI', 'Compound Dai'),
            new sdkCore.Token(SupportedChainId.MAINNET, '0x39AA39c021dfbaE8faC545936693aC917d5E7563', 8, 'cUSDC', 'Compound USD Coin'),
        ],
        [USDC, USDT],
        [DAI, USDT],
    ],
    _h);

var abi$5 = [
	{
		inputs: [
			{
				internalType: "address",
				name: "_rewardsDistribution",
				type: "address"
			},
			{
				internalType: "address",
				name: "_rewardsToken",
				type: "address"
			},
			{
				internalType: "address",
				name: "_stakingToken",
				type: "address"
			}
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "constructor"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "uint256",
				name: "reward",
				type: "uint256"
			}
		],
		name: "RewardAdded",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "user",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "reward",
				type: "uint256"
			}
		],
		name: "RewardPaid",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "user",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "amount",
				type: "uint256"
			}
		],
		name: "Staked",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "user",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "amount",
				type: "uint256"
			}
		],
		name: "Withdrawn",
		type: "event"
	},
	{
		constant: true,
		inputs: [
			{
				internalType: "address",
				name: "account",
				type: "address"
			}
		],
		name: "balanceOf",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
			{
				internalType: "address",
				name: "account",
				type: "address"
			}
		],
		name: "earned",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: false,
		inputs: [
		],
		name: "exit",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: false,
		inputs: [
		],
		name: "getReward",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "getRewardForDuration",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "lastTimeRewardApplicable",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "lastUpdateTime",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "uint256",
				name: "reward",
				type: "uint256"
			}
		],
		name: "notifyRewardAmount",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "periodFinish",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "rewardPerToken",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "rewardPerTokenStored",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "rewardRate",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		name: "rewards",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "rewardsDistribution",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "rewardsDuration",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "rewardsToken",
		outputs: [
			{
				internalType: "contract IERC20",
				name: "",
				type: "address"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "uint256",
				name: "amount",
				type: "uint256"
			}
		],
		name: "stake",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "uint256",
				name: "amount",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			},
			{
				internalType: "uint8",
				name: "v",
				type: "uint8"
			},
			{
				internalType: "bytes32",
				name: "r",
				type: "bytes32"
			},
			{
				internalType: "bytes32",
				name: "s",
				type: "bytes32"
			}
		],
		name: "stakeWithPermit",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "stakingToken",
		outputs: [
			{
				internalType: "contract IERC20",
				name: "",
				type: "address"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "totalSupply",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		name: "userRewardPerTokenPaid",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "uint256",
				name: "amount",
				type: "uint256"
			}
		],
		name: "withdraw",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	}
];

var abi$4 = [
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "owner",
				type: "address"
			},
			{
				indexed: true,
				internalType: "address",
				name: "spender",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "value",
				type: "uint256"
			}
		],
		name: "Approval",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "sender",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "amount0",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "amount1",
				type: "uint256"
			},
			{
				indexed: true,
				internalType: "address",
				name: "to",
				type: "address"
			}
		],
		name: "Burn",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "sender",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "amount0",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "amount1",
				type: "uint256"
			}
		],
		name: "Mint",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "sender",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "amount0In",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "amount1In",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "amount0Out",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "amount1Out",
				type: "uint256"
			},
			{
				indexed: true,
				internalType: "address",
				name: "to",
				type: "address"
			}
		],
		name: "Swap",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "uint112",
				name: "reserve0",
				type: "uint112"
			},
			{
				indexed: false,
				internalType: "uint112",
				name: "reserve1",
				type: "uint112"
			}
		],
		name: "Sync",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "from",
				type: "address"
			},
			{
				indexed: true,
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "value",
				type: "uint256"
			}
		],
		name: "Transfer",
		type: "event"
	},
	{
		constant: true,
		inputs: [
		],
		name: "DOMAIN_SEPARATOR",
		outputs: [
			{
				internalType: "bytes32",
				name: "",
				type: "bytes32"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "MINIMUM_LIQUIDITY",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "pure",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "PERMIT_TYPEHASH",
		outputs: [
			{
				internalType: "bytes32",
				name: "",
				type: "bytes32"
			}
		],
		payable: false,
		stateMutability: "pure",
		type: "function"
	},
	{
		constant: true,
		inputs: [
			{
				internalType: "address",
				name: "owner",
				type: "address"
			},
			{
				internalType: "address",
				name: "spender",
				type: "address"
			}
		],
		name: "allowance",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "address",
				name: "spender",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "value",
				type: "uint256"
			}
		],
		name: "approve",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool"
			}
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: true,
		inputs: [
			{
				internalType: "address",
				name: "owner",
				type: "address"
			}
		],
		name: "balanceOf",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "address",
				name: "to",
				type: "address"
			}
		],
		name: "burn",
		outputs: [
			{
				internalType: "uint256",
				name: "amount0",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amount1",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "decimals",
		outputs: [
			{
				internalType: "uint8",
				name: "",
				type: "uint8"
			}
		],
		payable: false,
		stateMutability: "pure",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "factory",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "getReserves",
		outputs: [
			{
				internalType: "uint112",
				name: "reserve0",
				type: "uint112"
			},
			{
				internalType: "uint112",
				name: "reserve1",
				type: "uint112"
			},
			{
				internalType: "uint32",
				name: "blockTimestampLast",
				type: "uint32"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			},
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		name: "initialize",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "kLast",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "address",
				name: "to",
				type: "address"
			}
		],
		name: "mint",
		outputs: [
			{
				internalType: "uint256",
				name: "liquidity",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "name",
		outputs: [
			{
				internalType: "string",
				name: "",
				type: "string"
			}
		],
		payable: false,
		stateMutability: "pure",
		type: "function"
	},
	{
		constant: true,
		inputs: [
			{
				internalType: "address",
				name: "owner",
				type: "address"
			}
		],
		name: "nonces",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "address",
				name: "owner",
				type: "address"
			},
			{
				internalType: "address",
				name: "spender",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "value",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			},
			{
				internalType: "uint8",
				name: "v",
				type: "uint8"
			},
			{
				internalType: "bytes32",
				name: "r",
				type: "bytes32"
			},
			{
				internalType: "bytes32",
				name: "s",
				type: "bytes32"
			}
		],
		name: "permit",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "price0CumulativeLast",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "price1CumulativeLast",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "address",
				name: "to",
				type: "address"
			}
		],
		name: "skim",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "uint256",
				name: "amount0Out",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amount1Out",
				type: "uint256"
			},
			{
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				internalType: "bytes",
				name: "data",
				type: "bytes"
			}
		],
		name: "swap",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "symbol",
		outputs: [
			{
				internalType: "string",
				name: "",
				type: "string"
			}
		],
		payable: false,
		stateMutability: "pure",
		type: "function"
	},
	{
		constant: false,
		inputs: [
		],
		name: "sync",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "token0",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "token1",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "totalSupply",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "value",
				type: "uint256"
			}
		],
		name: "transfer",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool"
			}
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "address",
				name: "from",
				type: "address"
			},
			{
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "value",
				type: "uint256"
			}
		],
		name: "transferFrom",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool"
			}
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	}
];

var abi$3 = [
	{
		inputs: [
		],
		name: "WETH",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		stateMutability: "pure",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "tokenA",
				type: "address"
			},
			{
				internalType: "address",
				name: "tokenB",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "amountADesired",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountBDesired",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountAMin",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountBMin",
				type: "uint256"
			},
			{
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "addLiquidity",
		outputs: [
			{
				internalType: "uint256",
				name: "amountA",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountB",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "liquidity",
				type: "uint256"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "token",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "amountTokenDesired",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountTokenMin",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountETHMin",
				type: "uint256"
			},
			{
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "addLiquidityETH",
		outputs: [
			{
				internalType: "uint256",
				name: "amountToken",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountETH",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "liquidity",
				type: "uint256"
			}
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
		],
		name: "factory",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		stateMutability: "pure",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "amountOut",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "reserveIn",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "reserveOut",
				type: "uint256"
			}
		],
		name: "getAmountIn",
		outputs: [
			{
				internalType: "uint256",
				name: "amountIn",
				type: "uint256"
			}
		],
		stateMutability: "pure",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "amountIn",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "reserveIn",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "reserveOut",
				type: "uint256"
			}
		],
		name: "getAmountOut",
		outputs: [
			{
				internalType: "uint256",
				name: "amountOut",
				type: "uint256"
			}
		],
		stateMutability: "pure",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "amountOut",
				type: "uint256"
			},
			{
				internalType: "address[]",
				name: "path",
				type: "address[]"
			}
		],
		name: "getAmountsIn",
		outputs: [
			{
				internalType: "uint256[]",
				name: "amounts",
				type: "uint256[]"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "amountIn",
				type: "uint256"
			},
			{
				internalType: "address[]",
				name: "path",
				type: "address[]"
			}
		],
		name: "getAmountsOut",
		outputs: [
			{
				internalType: "uint256[]",
				name: "amounts",
				type: "uint256[]"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "amountA",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "reserveA",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "reserveB",
				type: "uint256"
			}
		],
		name: "quote",
		outputs: [
			{
				internalType: "uint256",
				name: "amountB",
				type: "uint256"
			}
		],
		stateMutability: "pure",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "tokenA",
				type: "address"
			},
			{
				internalType: "address",
				name: "tokenB",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "liquidity",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountAMin",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountBMin",
				type: "uint256"
			},
			{
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "removeLiquidity",
		outputs: [
			{
				internalType: "uint256",
				name: "amountA",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountB",
				type: "uint256"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "token",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "liquidity",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountTokenMin",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountETHMin",
				type: "uint256"
			},
			{
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "removeLiquidityETH",
		outputs: [
			{
				internalType: "uint256",
				name: "amountToken",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountETH",
				type: "uint256"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "token",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "liquidity",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountTokenMin",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountETHMin",
				type: "uint256"
			},
			{
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "removeLiquidityETHSupportingFeeOnTransferTokens",
		outputs: [
			{
				internalType: "uint256",
				name: "amountETH",
				type: "uint256"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "token",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "liquidity",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountTokenMin",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountETHMin",
				type: "uint256"
			},
			{
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			},
			{
				internalType: "bool",
				name: "approveMax",
				type: "bool"
			},
			{
				internalType: "uint8",
				name: "v",
				type: "uint8"
			},
			{
				internalType: "bytes32",
				name: "r",
				type: "bytes32"
			},
			{
				internalType: "bytes32",
				name: "s",
				type: "bytes32"
			}
		],
		name: "removeLiquidityETHWithPermit",
		outputs: [
			{
				internalType: "uint256",
				name: "amountToken",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountETH",
				type: "uint256"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "token",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "liquidity",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountTokenMin",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountETHMin",
				type: "uint256"
			},
			{
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			},
			{
				internalType: "bool",
				name: "approveMax",
				type: "bool"
			},
			{
				internalType: "uint8",
				name: "v",
				type: "uint8"
			},
			{
				internalType: "bytes32",
				name: "r",
				type: "bytes32"
			},
			{
				internalType: "bytes32",
				name: "s",
				type: "bytes32"
			}
		],
		name: "removeLiquidityETHWithPermitSupportingFeeOnTransferTokens",
		outputs: [
			{
				internalType: "uint256",
				name: "amountETH",
				type: "uint256"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "tokenA",
				type: "address"
			},
			{
				internalType: "address",
				name: "tokenB",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "liquidity",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountAMin",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountBMin",
				type: "uint256"
			},
			{
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			},
			{
				internalType: "bool",
				name: "approveMax",
				type: "bool"
			},
			{
				internalType: "uint8",
				name: "v",
				type: "uint8"
			},
			{
				internalType: "bytes32",
				name: "r",
				type: "bytes32"
			},
			{
				internalType: "bytes32",
				name: "s",
				type: "bytes32"
			}
		],
		name: "removeLiquidityWithPermit",
		outputs: [
			{
				internalType: "uint256",
				name: "amountA",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountB",
				type: "uint256"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "amountOut",
				type: "uint256"
			},
			{
				internalType: "address[]",
				name: "path",
				type: "address[]"
			},
			{
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "swapETHForExactTokens",
		outputs: [
			{
				internalType: "uint256[]",
				name: "amounts",
				type: "uint256[]"
			}
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "amountOutMin",
				type: "uint256"
			},
			{
				internalType: "address[]",
				name: "path",
				type: "address[]"
			},
			{
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "swapExactETHForTokens",
		outputs: [
			{
				internalType: "uint256[]",
				name: "amounts",
				type: "uint256[]"
			}
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "amountOutMin",
				type: "uint256"
			},
			{
				internalType: "address[]",
				name: "path",
				type: "address[]"
			},
			{
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "swapExactETHForTokensSupportingFeeOnTransferTokens",
		outputs: [
		],
		stateMutability: "payable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "amountIn",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountOutMin",
				type: "uint256"
			},
			{
				internalType: "address[]",
				name: "path",
				type: "address[]"
			},
			{
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "swapExactTokensForETH",
		outputs: [
			{
				internalType: "uint256[]",
				name: "amounts",
				type: "uint256[]"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "amountIn",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountOutMin",
				type: "uint256"
			},
			{
				internalType: "address[]",
				name: "path",
				type: "address[]"
			},
			{
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "swapExactTokensForETHSupportingFeeOnTransferTokens",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "amountIn",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountOutMin",
				type: "uint256"
			},
			{
				internalType: "address[]",
				name: "path",
				type: "address[]"
			},
			{
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "swapExactTokensForTokens",
		outputs: [
			{
				internalType: "uint256[]",
				name: "amounts",
				type: "uint256[]"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "amountIn",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountOutMin",
				type: "uint256"
			},
			{
				internalType: "address[]",
				name: "path",
				type: "address[]"
			},
			{
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "swapExactTokensForTokensSupportingFeeOnTransferTokens",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "amountOut",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountInMax",
				type: "uint256"
			},
			{
				internalType: "address[]",
				name: "path",
				type: "address[]"
			},
			{
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "swapTokensForExactETH",
		outputs: [
			{
				internalType: "uint256[]",
				name: "amounts",
				type: "uint256[]"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "amountOut",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "amountInMax",
				type: "uint256"
			},
			{
				internalType: "address[]",
				name: "path",
				type: "address[]"
			},
			{
				internalType: "address",
				name: "to",
				type: "address"
			},
			{
				internalType: "uint256",
				name: "deadline",
				type: "uint256"
			}
		],
		name: "swapTokensForExactTokens",
		outputs: [
			{
				internalType: "uint256[]",
				name: "amounts",
				type: "uint256[]"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	}
];

var abi$2 = [
	{
		inputs: [
			{
				internalType: "address",
				name: "_factory",
				type: "address"
			},
			{
				internalType: "address",
				name: "_WETH9",
				type: "address"
			}
		],
		stateMutability: "nonpayable",
		type: "constructor"
	},
	{
		inputs: [
		],
		name: "WETH9",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "factory",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "bytes",
				name: "path",
				type: "bytes"
			},
			{
				internalType: "uint256",
				name: "amountIn",
				type: "uint256"
			}
		],
		name: "quoteExactInput",
		outputs: [
			{
				internalType: "uint256",
				name: "amountOut",
				type: "uint256"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "tokenIn",
				type: "address"
			},
			{
				internalType: "address",
				name: "tokenOut",
				type: "address"
			},
			{
				internalType: "uint24",
				name: "fee",
				type: "uint24"
			},
			{
				internalType: "uint256",
				name: "amountIn",
				type: "uint256"
			},
			{
				internalType: "uint160",
				name: "sqrtPriceLimitX96",
				type: "uint160"
			}
		],
		name: "quoteExactInputSingle",
		outputs: [
			{
				internalType: "uint256",
				name: "amountOut",
				type: "uint256"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "bytes",
				name: "path",
				type: "bytes"
			},
			{
				internalType: "uint256",
				name: "amountOut",
				type: "uint256"
			}
		],
		name: "quoteExactOutput",
		outputs: [
			{
				internalType: "uint256",
				name: "amountIn",
				type: "uint256"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "tokenIn",
				type: "address"
			},
			{
				internalType: "address",
				name: "tokenOut",
				type: "address"
			},
			{
				internalType: "uint24",
				name: "fee",
				type: "uint24"
			},
			{
				internalType: "uint256",
				name: "amountOut",
				type: "uint256"
			},
			{
				internalType: "uint160",
				name: "sqrtPriceLimitX96",
				type: "uint160"
			}
		],
		name: "quoteExactOutputSingle",
		outputs: [
			{
				internalType: "uint256",
				name: "amountIn",
				type: "uint256"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "int256",
				name: "amount0Delta",
				type: "int256"
			},
			{
				internalType: "int256",
				name: "amount1Delta",
				type: "int256"
			},
			{
				internalType: "bytes",
				name: "path",
				type: "bytes"
			}
		],
		name: "uniswapV3SwapCallback",
		outputs: [
		],
		stateMutability: "view",
		type: "function"
	}
];

var abi$1 = [
	{
		inputs: [
		],
		name: "getCurrentBlockTimestamp",
		outputs: [
			{
				internalType: "uint256",
				name: "timestamp",
				type: "uint256"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "addr",
				type: "address"
			}
		],
		name: "getEthBalance",
		outputs: [
			{
				internalType: "uint256",
				name: "balance",
				type: "uint256"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				components: [
					{
						internalType: "address",
						name: "target",
						type: "address"
					},
					{
						internalType: "uint256",
						name: "gasLimit",
						type: "uint256"
					},
					{
						internalType: "bytes",
						name: "callData",
						type: "bytes"
					}
				],
				internalType: "struct UniswapInterfaceMulticall.Call[]",
				name: "calls",
				type: "tuple[]"
			}
		],
		name: "multicall",
		outputs: [
			{
				internalType: "uint256",
				name: "blockNumber",
				type: "uint256"
			},
			{
				components: [
					{
						internalType: "bool",
						name: "success",
						type: "bool"
					},
					{
						internalType: "uint256",
						name: "gasUsed",
						type: "uint256"
					},
					{
						internalType: "bytes",
						name: "returnData",
						type: "bytes"
					}
				],
				internalType: "struct UniswapInterfaceMulticall.Result[]",
				name: "returnData",
				type: "tuple[]"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	}
];

var ARGENT_WALLET_DETECTOR_ABI = [
	{
		inputs: [
			{
				internalType: "bytes32[]",
				name: "_codes",
				type: "bytes32[]"
			},
			{
				internalType: "address[]",
				name: "_implementations",
				type: "address[]"
			}
		],
		stateMutability: "nonpayable",
		type: "constructor"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "bytes32",
				name: "code",
				type: "bytes32"
			}
		],
		name: "CodeAdded",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "implementation",
				type: "address"
			}
		],
		name: "ImplementationAdded",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "_newOwner",
				type: "address"
			}
		],
		name: "OwnerChanged",
		type: "event"
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "",
				type: "bytes32"
			}
		],
		name: "acceptedCodes",
		outputs: [
			{
				internalType: "bool",
				name: "exists",
				type: "bool"
			},
			{
				internalType: "uint128",
				name: "index",
				type: "uint128"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		name: "acceptedImplementations",
		outputs: [
			{
				internalType: "bool",
				name: "exists",
				type: "bool"
			},
			{
				internalType: "uint128",
				name: "index",
				type: "uint128"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "_code",
				type: "bytes32"
			}
		],
		name: "addCode",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "_argentWallet",
				type: "address"
			}
		],
		name: "addCodeAndImplementationFromWallet",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "_impl",
				type: "address"
			}
		],
		name: "addImplementation",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "_newOwner",
				type: "address"
			}
		],
		name: "changeOwner",
		outputs: [
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
		],
		name: "getCodes",
		outputs: [
			{
				internalType: "bytes32[]",
				name: "",
				type: "bytes32[]"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "getImplementations",
		outputs: [
			{
				internalType: "address[]",
				name: "",
				type: "address[]"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "address",
				name: "_wallet",
				type: "address"
			}
		],
		name: "isArgentWallet",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "owner",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		stateMutability: "view",
		type: "function"
	}
];

var EIP_2612 = [
	{
		constant: true,
		inputs: [
			{
				name: "owner",
				type: "address"
			}
		],
		name: "nonces",
		outputs: [
			{
				name: "",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "DOMAIN_SEPARATOR",
		outputs: [
			{
				name: "",
				type: "bytes32"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	}
];

var ENS_PUBLIC_RESOLVER_ABI = [
	{
		inputs: [
			{
				internalType: "contract ENS",
				name: "_ens",
				type: "address"
			}
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "constructor"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				indexed: true,
				internalType: "uint256",
				name: "contentType",
				type: "uint256"
			}
		],
		name: "ABIChanged",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				indexed: false,
				internalType: "address",
				name: "a",
				type: "address"
			}
		],
		name: "AddrChanged",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "coinType",
				type: "uint256"
			},
			{
				indexed: false,
				internalType: "bytes",
				name: "newAddress",
				type: "bytes"
			}
		],
		name: "AddressChanged",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				indexed: true,
				internalType: "address",
				name: "owner",
				type: "address"
			},
			{
				indexed: true,
				internalType: "address",
				name: "target",
				type: "address"
			},
			{
				indexed: false,
				internalType: "bool",
				name: "isAuthorised",
				type: "bool"
			}
		],
		name: "AuthorisationChanged",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				indexed: false,
				internalType: "bytes",
				name: "hash",
				type: "bytes"
			}
		],
		name: "ContenthashChanged",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				indexed: false,
				internalType: "bytes",
				name: "name",
				type: "bytes"
			},
			{
				indexed: false,
				internalType: "uint16",
				name: "resource",
				type: "uint16"
			},
			{
				indexed: false,
				internalType: "bytes",
				name: "record",
				type: "bytes"
			}
		],
		name: "DNSRecordChanged",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				indexed: false,
				internalType: "bytes",
				name: "name",
				type: "bytes"
			},
			{
				indexed: false,
				internalType: "uint16",
				name: "resource",
				type: "uint16"
			}
		],
		name: "DNSRecordDeleted",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			}
		],
		name: "DNSZoneCleared",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				indexed: true,
				internalType: "bytes4",
				name: "interfaceID",
				type: "bytes4"
			},
			{
				indexed: false,
				internalType: "address",
				name: "implementer",
				type: "address"
			}
		],
		name: "InterfaceChanged",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				indexed: false,
				internalType: "string",
				name: "name",
				type: "string"
			}
		],
		name: "NameChanged",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				indexed: false,
				internalType: "bytes32",
				name: "x",
				type: "bytes32"
			},
			{
				indexed: false,
				internalType: "bytes32",
				name: "y",
				type: "bytes32"
			}
		],
		name: "PubkeyChanged",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				indexed: true,
				internalType: "string",
				name: "indexedKey",
				type: "string"
			},
			{
				indexed: false,
				internalType: "string",
				name: "key",
				type: "string"
			}
		],
		name: "TextChanged",
		type: "event"
	},
	{
		constant: true,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				internalType: "uint256",
				name: "contentTypes",
				type: "uint256"
			}
		],
		name: "ABI",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			},
			{
				internalType: "bytes",
				name: "",
				type: "bytes"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			}
		],
		name: "addr",
		outputs: [
			{
				internalType: "address payable",
				name: "",
				type: "address"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
			{
				internalType: "bytes32",
				name: "",
				type: "bytes32"
			},
			{
				internalType: "address",
				name: "",
				type: "address"
			},
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		name: "authorisations",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			}
		],
		name: "clearDNSZone",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: true,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			}
		],
		name: "contenthash",
		outputs: [
			{
				internalType: "bytes",
				name: "",
				type: "bytes"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				internalType: "bytes32",
				name: "name",
				type: "bytes32"
			},
			{
				internalType: "uint16",
				name: "resource",
				type: "uint16"
			}
		],
		name: "dnsRecord",
		outputs: [
			{
				internalType: "bytes",
				name: "",
				type: "bytes"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				internalType: "bytes32",
				name: "name",
				type: "bytes32"
			}
		],
		name: "hasDNSRecords",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				internalType: "bytes4",
				name: "interfaceID",
				type: "bytes4"
			}
		],
		name: "interfaceImplementer",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			}
		],
		name: "name",
		outputs: [
			{
				internalType: "string",
				name: "",
				type: "string"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			}
		],
		name: "pubkey",
		outputs: [
			{
				internalType: "bytes32",
				name: "x",
				type: "bytes32"
			},
			{
				internalType: "bytes32",
				name: "y",
				type: "bytes32"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				internalType: "uint256",
				name: "contentType",
				type: "uint256"
			},
			{
				internalType: "bytes",
				name: "data",
				type: "bytes"
			}
		],
		name: "setABI",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				internalType: "uint256",
				name: "coinType",
				type: "uint256"
			},
			{
				internalType: "bytes",
				name: "a",
				type: "bytes"
			}
		],
		name: "setAddr",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				internalType: "address",
				name: "a",
				type: "address"
			}
		],
		name: "setAddr",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				internalType: "address",
				name: "target",
				type: "address"
			},
			{
				internalType: "bool",
				name: "isAuthorised",
				type: "bool"
			}
		],
		name: "setAuthorisation",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				internalType: "bytes",
				name: "hash",
				type: "bytes"
			}
		],
		name: "setContenthash",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				internalType: "bytes",
				name: "data",
				type: "bytes"
			}
		],
		name: "setDNSRecords",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				internalType: "bytes4",
				name: "interfaceID",
				type: "bytes4"
			},
			{
				internalType: "address",
				name: "implementer",
				type: "address"
			}
		],
		name: "setInterface",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				internalType: "string",
				name: "name",
				type: "string"
			}
		],
		name: "setName",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				internalType: "bytes32",
				name: "x",
				type: "bytes32"
			},
			{
				internalType: "bytes32",
				name: "y",
				type: "bytes32"
			}
		],
		name: "setPubkey",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				internalType: "string",
				name: "key",
				type: "string"
			},
			{
				internalType: "string",
				name: "value",
				type: "string"
			}
		],
		name: "setText",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: true,
		inputs: [
			{
				internalType: "bytes4",
				name: "interfaceID",
				type: "bytes4"
			}
		],
		name: "supportsInterface",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool"
			}
		],
		payable: false,
		stateMutability: "pure",
		type: "function"
	},
	{
		constant: true,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				internalType: "string",
				name: "key",
				type: "string"
			}
		],
		name: "text",
		outputs: [
			{
				internalType: "string",
				name: "",
				type: "string"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	}
];

var ENS_ABI = [
	{
		inputs: [
			{
				internalType: "contract ENS",
				name: "_old",
				type: "address"
			}
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "constructor"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "address",
				name: "owner",
				type: "address"
			},
			{
				indexed: true,
				internalType: "address",
				name: "operator",
				type: "address"
			},
			{
				indexed: false,
				internalType: "bool",
				name: "approved",
				type: "bool"
			}
		],
		name: "ApprovalForAll",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				indexed: true,
				internalType: "bytes32",
				name: "label",
				type: "bytes32"
			},
			{
				indexed: false,
				internalType: "address",
				name: "owner",
				type: "address"
			}
		],
		name: "NewOwner",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				indexed: false,
				internalType: "address",
				name: "resolver",
				type: "address"
			}
		],
		name: "NewResolver",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				indexed: false,
				internalType: "uint64",
				name: "ttl",
				type: "uint64"
			}
		],
		name: "NewTTL",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				indexed: false,
				internalType: "address",
				name: "owner",
				type: "address"
			}
		],
		name: "Transfer",
		type: "event"
	},
	{
		constant: true,
		inputs: [
			{
				internalType: "address",
				name: "owner",
				type: "address"
			},
			{
				internalType: "address",
				name: "operator",
				type: "address"
			}
		],
		name: "isApprovedForAll",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "old",
		outputs: [
			{
				internalType: "contract ENS",
				name: "",
				type: "address"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			}
		],
		name: "owner",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			}
		],
		name: "recordExists",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			}
		],
		name: "resolver",
		outputs: [
			{
				internalType: "address",
				name: "",
				type: "address"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "address",
				name: "operator",
				type: "address"
			},
			{
				internalType: "bool",
				name: "approved",
				type: "bool"
			}
		],
		name: "setApprovalForAll",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				internalType: "address",
				name: "owner",
				type: "address"
			}
		],
		name: "setOwner",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				internalType: "address",
				name: "owner",
				type: "address"
			},
			{
				internalType: "address",
				name: "resolver",
				type: "address"
			},
			{
				internalType: "uint64",
				name: "ttl",
				type: "uint64"
			}
		],
		name: "setRecord",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				internalType: "address",
				name: "resolver",
				type: "address"
			}
		],
		name: "setResolver",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				internalType: "bytes32",
				name: "label",
				type: "bytes32"
			},
			{
				internalType: "address",
				name: "owner",
				type: "address"
			}
		],
		name: "setSubnodeOwner",
		outputs: [
			{
				internalType: "bytes32",
				name: "",
				type: "bytes32"
			}
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				internalType: "bytes32",
				name: "label",
				type: "bytes32"
			},
			{
				internalType: "address",
				name: "owner",
				type: "address"
			},
			{
				internalType: "address",
				name: "resolver",
				type: "address"
			},
			{
				internalType: "uint64",
				name: "ttl",
				type: "uint64"
			}
		],
		name: "setSubnodeRecord",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			},
			{
				internalType: "uint64",
				name: "ttl",
				type: "uint64"
			}
		],
		name: "setTTL",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: true,
		inputs: [
			{
				internalType: "bytes32",
				name: "node",
				type: "bytes32"
			}
		],
		name: "ttl",
		outputs: [
			{
				internalType: "uint64",
				name: "",
				type: "uint64"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	}
];

var ERC20ABI = [
	{
		constant: true,
		inputs: [
		],
		name: "name",
		outputs: [
			{
				name: "",
				type: "string"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				name: "_spender",
				type: "address"
			},
			{
				name: "_value",
				type: "uint256"
			}
		],
		name: "approve",
		outputs: [
			{
				name: "",
				type: "bool"
			}
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "totalSupply",
		outputs: [
			{
				name: "",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				name: "_from",
				type: "address"
			},
			{
				name: "_to",
				type: "address"
			},
			{
				name: "_value",
				type: "uint256"
			}
		],
		name: "transferFrom",
		outputs: [
			{
				name: "",
				type: "bool"
			}
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "decimals",
		outputs: [
			{
				name: "",
				type: "uint8"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
			{
				name: "_owner",
				type: "address"
			}
		],
		name: "balanceOf",
		outputs: [
			{
				name: "balance",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "symbol",
		outputs: [
			{
				name: "",
				type: "string"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				name: "_to",
				type: "address"
			},
			{
				name: "_value",
				type: "uint256"
			}
		],
		name: "transfer",
		outputs: [
			{
				name: "",
				type: "bool"
			}
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: true,
		inputs: [
			{
				name: "_owner",
				type: "address"
			},
			{
				name: "_spender",
				type: "address"
			}
		],
		name: "allowance",
		outputs: [
			{
				name: "",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		payable: true,
		stateMutability: "payable",
		type: "fallback"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				name: "owner",
				type: "address"
			},
			{
				indexed: true,
				name: "spender",
				type: "address"
			},
			{
				indexed: false,
				name: "value",
				type: "uint256"
			}
		],
		name: "Approval",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				name: "from",
				type: "address"
			},
			{
				indexed: true,
				name: "to",
				type: "address"
			},
			{
				indexed: false,
				name: "value",
				type: "uint256"
			}
		],
		name: "Transfer",
		type: "event"
	}
];

var ERC20_BYTES32_ABI = [
	{
		constant: true,
		inputs: [
		],
		name: "name",
		outputs: [
			{
				name: "",
				type: "bytes32"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "symbol",
		outputs: [
			{
				name: "",
				type: "bytes32"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	}
];

var WETH_ABI = [
	{
		constant: true,
		inputs: [
		],
		name: "name",
		outputs: [
			{
				name: "",
				type: "string"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				name: "guy",
				type: "address"
			},
			{
				name: "wad",
				type: "uint256"
			}
		],
		name: "approve",
		outputs: [
			{
				name: "",
				type: "bool"
			}
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "totalSupply",
		outputs: [
			{
				name: "",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				name: "src",
				type: "address"
			},
			{
				name: "dst",
				type: "address"
			},
			{
				name: "wad",
				type: "uint256"
			}
		],
		name: "transferFrom",
		outputs: [
			{
				name: "",
				type: "bool"
			}
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				name: "wad",
				type: "uint256"
			}
		],
		name: "withdraw",
		outputs: [
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "decimals",
		outputs: [
			{
				name: "",
				type: "uint8"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
			{
				name: "",
				type: "address"
			}
		],
		name: "balanceOf",
		outputs: [
			{
				name: "",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: true,
		inputs: [
		],
		name: "symbol",
		outputs: [
			{
				name: "",
				type: "string"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		constant: false,
		inputs: [
			{
				name: "dst",
				type: "address"
			},
			{
				name: "wad",
				type: "uint256"
			}
		],
		name: "transfer",
		outputs: [
			{
				name: "",
				type: "bool"
			}
		],
		payable: false,
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		constant: false,
		inputs: [
		],
		name: "deposit",
		outputs: [
		],
		payable: true,
		stateMutability: "payable",
		type: "function"
	},
	{
		constant: true,
		inputs: [
			{
				name: "",
				type: "address"
			},
			{
				name: "",
				type: "address"
			}
		],
		name: "allowance",
		outputs: [
			{
				name: "",
				type: "uint256"
			}
		],
		payable: false,
		stateMutability: "view",
		type: "function"
	},
	{
		payable: true,
		stateMutability: "payable",
		type: "fallback"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				name: "src",
				type: "address"
			},
			{
				indexed: true,
				name: "guy",
				type: "address"
			},
			{
				indexed: false,
				name: "wad",
				type: "uint256"
			}
		],
		name: "Approval",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				name: "src",
				type: "address"
			},
			{
				indexed: true,
				name: "dst",
				type: "address"
			},
			{
				indexed: false,
				name: "wad",
				type: "uint256"
			}
		],
		name: "Transfer",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				name: "dst",
				type: "address"
			},
			{
				indexed: false,
				name: "wad",
				type: "uint256"
			}
		],
		name: "Deposit",
		type: "event"
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				name: "src",
				type: "address"
			},
			{
				indexed: false,
				name: "wad",
				type: "uint256"
			}
		],
		name: "Withdrawal",
		type: "event"
	}
];

// returns the checksummed address if the address is valid, otherwise returns false
function isAddress(value) {
    try {
        return address.getAddress(value);
    }
    catch (_a) {
        return false;
    }
}
// shorten the checksummed version of the input address to have 0x + 4 characters at start and end
function shortenAddress(address, chars) {
    if (chars === void 0) { chars = 4; }
    var parsed = isAddress(address);
    if (!parsed) {
        throw Error("Invalid 'address' parameter '" + address + "'.");
    }
    return parsed.substring(0, chars + 2) + "..." + parsed.substring(42 - chars);
}
// account is not optional
function getSigner(library, account) {
    return library.getSigner(account).connectUnchecked();
}
// account is optional
function getProviderOrSigner(library, account) {
    return account ? getSigner(library, account) : library;
}
// account is optional
function getContract(address, ABI, library, account) {
    if (!isAddress(address) || address === constants.AddressZero) {
        throw Error("Invalid 'address' parameter '" + address + "'.");
    }
    return new contracts.Contract(address, ABI, getProviderOrSigner(library, account));
}
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
function isTokenOnList(chainTokenMap, token) {
    var _a;
    return Boolean((token === null || token === void 0 ? void 0 : token.isToken) && ((_a = chainTokenMap[token.chainId]) === null || _a === void 0 ? void 0 : _a[token.address]));
}

// returns null on errors
function useContract(addressOrAddressMap, ABI, withSignerIfPossible) {
    if (withSignerIfPossible === void 0) { withSignerIfPossible = true; }
    var _a = useActiveWeb3React(), library = _a.library, account = _a.account, chainId = _a.chainId;
    return React.useMemo(function () {
        if (!addressOrAddressMap || !ABI || !library || !chainId)
            return null;
        var address;
        if (typeof addressOrAddressMap === 'string')
            address = addressOrAddressMap;
        else
            address = addressOrAddressMap[chainId];
        if (!address)
            return null;
        try {
            return getContract(address, ABI, library, withSignerIfPossible && account ? account : undefined);
        }
        catch (error) {
            console.error('Failed to get contract', error);
            return null;
        }
    }, [addressOrAddressMap, ABI, library, chainId, withSignerIfPossible, account]);
}
function useTokenContract(tokenAddress, withSignerIfPossible) {
    return useContract(tokenAddress, ERC20ABI, withSignerIfPossible);
}
function useWETHContract(withSignerIfPossible) {
    var _a;
    var chainId = useActiveWeb3React().chainId;
    return useContract(chainId ? (_a = WRAPPED_NATIVE_CURRENCY[chainId]) === null || _a === void 0 ? void 0 : _a.address : undefined, WETH_ABI, withSignerIfPossible);
}
function useArgentWalletDetectorContract() {
    return useContract(ARGENT_WALLET_DETECTOR_ADDRESS, ARGENT_WALLET_DETECTOR_ABI, false);
}
function useENSRegistrarContract(withSignerIfPossible) {
    return useContract(ENS_REGISTRAR_ADDRESSES, ENS_ABI, withSignerIfPossible);
}
function useENSResolverContract(address, withSignerIfPossible) {
    return useContract(address, ENS_PUBLIC_RESOLVER_ABI, withSignerIfPossible);
}
function useBytes32TokenContract(tokenAddress, withSignerIfPossible) {
    return useContract(tokenAddress, ERC20_BYTES32_ABI, withSignerIfPossible);
}
function useEIP2612Contract(tokenAddress) {
    return useContract(tokenAddress, EIP_2612, false);
}
function useV2RouterContract() {
    return useContract(V2_ROUTER_ADDRESS, abi$3, true);
}
function useInterfaceMulticall() {
    return useContract(MULTICALL_ADDRESS, abi$1, false);
}
function useV3Quoter() {
    return useContract(QUOTER_ADDRESSES, abi$2);
}

/**
 * Debounces updates to a value.
 * Non-primitives *must* wrap the value in useMemo, or the value will be updated due to referential inequality.
 */
// modified from https://usehooks.com/useDebounce/
function useDebounce(value, delay) {
    var _a = __read(React.useState(value), 2), debouncedValue = _a[0], setDebouncedValue = _a[1];
    React.useEffect(function () {
        // Update debounced value after delay
        var handler = setTimeout(function () {
            setDebouncedValue(value);
        }, delay);
        // Cancel the timeout if value changes (also on delay change or unmount)
        // This is how we prevent debounced value from updating if value is changed ...
        // .. within the delay period. Timeout gets cleared and restarted.
        return function () {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

var VISIBILITY_STATE_SUPPORTED = 'visibilityState' in document;
function isWindowVisible() {
    return !VISIBILITY_STATE_SUPPORTED || document.visibilityState !== 'hidden';
}
/**
 * Returns whether the window is currently visible to the user.
 */
function useIsWindowVisible() {
    var _a = __read(React.useState(isWindowVisible()), 2), focused = _a[0], setFocused = _a[1];
    var listener = React.useCallback(function () {
        setFocused(isWindowVisible());
    }, [setFocused]);
    React.useEffect(function () {
        if (!VISIBILITY_STATE_SUPPORTED)
            return undefined;
        document.addEventListener('visibilitychange', listener);
        return function () {
            document.removeEventListener('visibilitychange', listener);
        };
    }, [listener]);
    return focused;
}

var blockAtom = jotai.atom(undefined);
/** Requires that BlockUpdater be installed in the DOM tree. */
function useBlockNumber() {
    var chainId = useActiveWeb3React().chainId;
    var block = utils.useAtomValue(blockAtom);
    return chainId ? block : undefined;
}

var _a$b;
var multicall = reduxMulticall.createMulticall();
var reducer = redux.combineReducers((_a$b = {}, _a$b[multicall.reducerPath] = multicall.reducer, _a$b));
redux.createStore(reducer);

function useMultipleContractSingleData() {
    var _a;
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var _b = useCallContext(), chainId = _b.chainId, latestBlock = _b.latestBlock;
    return (_a = multicall.hooks).useMultipleContractSingleData.apply(_a, __spreadArray([chainId, latestBlock], __read(args), false));
}
function useSingleCallResult() {
    var _a;
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var _b = useCallContext(), chainId = _b.chainId, latestBlock = _b.latestBlock;
    return (_a = multicall.hooks).useSingleCallResult.apply(_a, __spreadArray([chainId, latestBlock], __read(args), false));
}
function useSingleContractMultipleData() {
    var _a;
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var _b = useCallContext(), chainId = _b.chainId, latestBlock = _b.latestBlock;
    return (_a = multicall.hooks).useSingleContractMultipleData.apply(_a, __spreadArray([chainId, latestBlock], __read(args), false));
}
function useSingleContractWithCallData() {
    var _a;
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var _b = useCallContext(), chainId = _b.chainId, latestBlock = _b.latestBlock;
    return (_a = multicall.hooks).useSingleContractWithCallData.apply(_a, __spreadArray([chainId, latestBlock], __read(args), false));
}
function useCallContext() {
    var chainId = useActiveWeb3React().chainId;
    var latestBlock = useBlockNumber();
    return { chainId: chainId, latestBlock: latestBlock };
}

function useNativeCurrency() {
    var chainId = useActiveWeb3React().chainId;
    return React.useMemo(function () {
        return chainId
            ? nativeOnChain(chainId)
            : // display mainnet when not connected
                nativeOnChain(SupportedChainId.MAINNET);
    }, [chainId]);
}

var REGISTRAR_ABI = [
    {
        constant: true,
        inputs: [
            {
                name: 'node',
                type: 'bytes32',
            },
        ],
        name: 'resolver',
        outputs: [
            {
                name: 'resolverAddress',
                type: 'address',
            },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
];
var REGISTRAR_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
var RESOLVER_ABI = [
    {
        constant: true,
        inputs: [
            {
                internalType: 'bytes32',
                name: 'node',
                type: 'bytes32',
            },
        ],
        name: 'contenthash',
        outputs: [
            {
                internalType: 'bytes',
                name: '',
                type: 'bytes',
            },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
];
// cache the resolver contracts since most of them are the public resolver
function resolverContract(resolverAddress, provider) {
    return new contracts.Contract(resolverAddress, RESOLVER_ABI, provider);
}
/**
 * Fetches and decodes the result of an ENS contenthash lookup on mainnet to a URI
 * @param ensName to resolve
 * @param provider provider to use to fetch the data
 */
function resolveENSContentHash(ensName, provider) {
    return __awaiter(this, void 0, void 0, function () {
        var ensRegistrarContract, hash$1, resolverAddress;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ensRegistrarContract = new contracts.Contract(REGISTRAR_ADDRESS, REGISTRAR_ABI, provider);
                    hash$1 = hash.namehash(ensName);
                    return [4 /*yield*/, ensRegistrarContract.resolver(hash$1)];
                case 1:
                    resolverAddress = _a.sent();
                    return [2 /*return*/, resolverContract(resolverAddress, provider).contenthash(hash$1)];
            }
        });
    });
}

function hexToUint8Array(hex) {
    hex = hex.startsWith('0x') ? hex.substr(2) : hex;
    if (hex.length % 2 !== 0)
        throw new Error('hex must have length that is multiple of 2');
    var arr = new Uint8Array(hex.length / 2);
    for (var i = 0; i < arr.length; i++) {
        arr[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return arr;
}
var UTF_8_DECODER = new TextDecoder('utf-8');
/**
 * Returns the URI representation of the content hash for supported codecs
 * @param contenthash to decode
 */
function contenthashToUri(contenthash) {
    var data = hexToUint8Array(contenthash);
    var codec = multicodec.getNameFromData(data);
    switch (codec) {
        case 'ipfs-ns': {
            var unprefixedData = multicodec.rmPrefix(data);
            var cid = new CID__default["default"](unprefixedData);
            return "ipfs://" + multihashes.toB58String(cid.multihash);
        }
        case 'ipns-ns': {
            var unprefixedData = multicodec.rmPrefix(data);
            var cid = new CID__default["default"](unprefixedData);
            var multihash = multihashes.decode(cid.multihash);
            if (multihash.name === 'identity') {
                return "ipns://" + UTF_8_DECODER.decode(multihash.digest).trim();
            }
            else {
                return "ipns://" + multihashes.toB58String(cid.multihash);
            }
        }
        default:
            throw new Error("Unrecognized codec: " + codec);
    }
}

var ENS_NAME_REGEX$1 = /^(([a-zA-Z0-9]+(-[a-zA-Z0-9]+)*\.)+)eth(\/.*)?$/;
function parseENSAddress(ensAddress) {
    var match = ensAddress.match(ENS_NAME_REGEX$1);
    if (!match)
        return undefined;
    return { ensName: match[1].toLowerCase() + "eth", ensPath: match[4] };
}

/**
 * Given a URI that may be ipfs, ipns, http, https, ar, or data protocol, return the fetch-able http(s) URLs for the same content
 * @param uri to convert to fetch-able http url
 */
function uriToHttp(uri) {
    var _a, _b, _c;
    var protocol = uri.split(':')[0].toLowerCase();
    switch (protocol) {
        case 'data':
            return [uri];
        case 'https':
            return [uri];
        case 'http':
            return ['https' + uri.substr(4), uri];
        case 'ipfs':
            var hash = (_a = uri.match(/^ipfs:(\/\/)?(.*)$/i)) === null || _a === void 0 ? void 0 : _a[2];
            return ["https://cloudflare-ipfs.com/ipfs/" + hash + "/", "https://ipfs.io/ipfs/" + hash + "/"];
        case 'ipns':
            var name_1 = (_b = uri.match(/^ipns:(\/\/)?(.*)$/i)) === null || _b === void 0 ? void 0 : _b[2];
            return ["https://cloudflare-ipfs.com/ipns/" + name_1 + "/", "https://ipfs.io/ipns/" + name_1 + "/"];
        case 'ar':
            var tx = (_c = uri.match(/^ar:(\/\/)?(.*)$/i)) === null || _c === void 0 ? void 0 : _c[2];
            return ["https://arweave.net/" + tx];
        default:
            return [];
    }
}

var ValidationSchema;
(function (ValidationSchema) {
    ValidationSchema["LIST"] = "list";
    ValidationSchema["TOKENS"] = "tokens";
})(ValidationSchema || (ValidationSchema = {}));
var validator = new Promise(function (resolve) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, ajv, schema, validator;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, Promise.all([Promise.resolve().then(function () { return /*#__PURE__*/_interopNamespace(require('ajv')); }), Promise.resolve().then(function () { return tokenlist_schema$1; })])];
            case 1:
                _a = __read.apply(void 0, [_b.sent(), 2]), ajv = _a[0], schema = _a[1];
                validator = new ajv.default({ allErrors: true })
                    .addSchema(schema, ValidationSchema.LIST)
                    // Adds a meta scheme of Pick<TokenList, 'tokens'>
                    .addSchema(__assign(__assign({}, schema), { $id: schema.$id + '#tokens', required: ['tokens'] }), ValidationSchema.TOKENS);
                resolve(validator);
                return [2 /*return*/];
        }
    });
}); });
function getValidationErrors(validate) {
    var _a, _b;
    return ((_b = (_a = validate === null || validate === void 0 ? void 0 : validate.errors) === null || _a === void 0 ? void 0 : _a.map(function (error) { return [error.dataPath, error.message].filter(Boolean).join(' '); }).join('; ')) !== null && _b !== void 0 ? _b : 'unknown error');
}
/**
 * Validates a token list.
 * @param json the TokenList to validate
 */
function validateTokenList(json) {
    return __awaiter(this, void 0, void 0, function () {
        var validate;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, validator];
                case 1:
                    validate = (_a.sent()).getSchema(ValidationSchema.LIST);
                    if (validate === null || validate === void 0 ? void 0 : validate(json)) {
                        return [2 /*return*/, json];
                    }
                    throw new Error("Token list failed validation: " + getValidationErrors(validate));
            }
        });
    });
}

var listCache = new Map();
/** Fetches and validates a token list. */
function fetchTokenList$1(listUrl, resolveENSContentHash) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var cached, urls, parsedENS, contentHashUri, error_1, message, translatedUri, message, i, url, isLast, response, error_2, message, message, json, list;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    cached = listCache === null || listCache === void 0 ? void 0 : listCache.get(listUrl) // avoid spurious re-fetches
                    ;
                    if (cached) {
                        return [2 /*return*/, cached];
                    }
                    parsedENS = parseENSAddress(listUrl);
                    if (!parsedENS) return [3 /*break*/, 5];
                    contentHashUri = void 0;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, resolveENSContentHash(parsedENS.ensName)];
                case 2:
                    contentHashUri = _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _b.sent();
                    message = "failed to resolve ENS name: " + parsedENS.ensName;
                    console.debug(message, error_1);
                    throw new Error(message);
                case 4:
                    translatedUri = void 0;
                    try {
                        translatedUri = contenthashToUri(contentHashUri);
                    }
                    catch (error) {
                        message = "failed to translate contenthash to URI: " + contentHashUri;
                        console.debug(message, error);
                        throw new Error(message);
                    }
                    urls = uriToHttp("" + translatedUri + ((_a = parsedENS.ensPath) !== null && _a !== void 0 ? _a : ''));
                    return [3 /*break*/, 6];
                case 5:
                    urls = uriToHttp(listUrl);
                    _b.label = 6;
                case 6:
                    i = 0;
                    _b.label = 7;
                case 7:
                    if (!(i < urls.length)) return [3 /*break*/, 15];
                    url = urls[i];
                    isLast = i === urls.length - 1;
                    response = void 0;
                    _b.label = 8;
                case 8:
                    _b.trys.push([8, 10, , 11]);
                    return [4 /*yield*/, fetch(url, { credentials: 'omit' })];
                case 9:
                    response = _b.sent();
                    return [3 /*break*/, 11];
                case 10:
                    error_2 = _b.sent();
                    message = "failed to fetch list: " + listUrl;
                    console.debug(message, error_2);
                    if (isLast)
                        throw new Error(message);
                    return [3 /*break*/, 14];
                case 11:
                    if (!response.ok) {
                        message = "failed to fetch list: " + listUrl;
                        console.debug(message, response.statusText);
                        if (isLast)
                            throw new Error(message);
                        return [3 /*break*/, 14];
                    }
                    return [4 /*yield*/, response.json()];
                case 12:
                    json = _b.sent();
                    return [4 /*yield*/, validateTokenList(json)];
                case 13:
                    list = _b.sent();
                    listCache === null || listCache === void 0 ? void 0 : listCache.set(listUrl, list);
                    return [2 /*return*/, list];
                case 14:
                    i++;
                    return [3 /*break*/, 7];
                case 15: throw new Error('Unrecognized list URL protocol.');
            }
        });
    });
}

/**
 * Returns a map of the given addresses to their eventually consistent ETH balances.
 */
function useNativeCurrencyBalances(uncheckedAddresses) {
    var chainId = useActiveWeb3React().chainId;
    var multicallContract = useInterfaceMulticall();
    var validAddressInputs = React.useMemo(function () {
        return uncheckedAddresses
            ? uncheckedAddresses
                .map(isAddress)
                .filter(function (a) { return a !== false; })
                .sort()
                .map(function (addr) { return [addr]; })
            : [];
    }, [uncheckedAddresses]);
    var results = useSingleContractMultipleData(multicallContract, 'getEthBalance', validAddressInputs);
    return React.useMemo(function () {
        return validAddressInputs.reduce(function (memo, _a, i) {
            var _b, _c;
            var _d = __read(_a, 1), address = _d[0];
            var value = (_c = (_b = results === null || results === void 0 ? void 0 : results[i]) === null || _b === void 0 ? void 0 : _b.result) === null || _c === void 0 ? void 0 : _c[0];
            if (value && chainId)
                memo[address] = sdkCore.CurrencyAmount.fromRawAmount(nativeOnChain(chainId), JSBI__default["default"].BigInt(value.toString()));
            return memo;
        }, {});
    }, [validAddressInputs, chainId, results]);
}
var ERC20Interface = new abi$6.Interface(ERC20ABI);
var tokenBalancesGasRequirement = { gasRequired: 125000 };
/**
 * Returns a map of token addresses to their eventually consistent token balances for a single account.
 */
function useTokenBalancesWithLoadingIndicator(address, tokens) {
    var validatedTokens = React.useMemo(function () { var _a; return (_a = tokens === null || tokens === void 0 ? void 0 : tokens.filter(function (t) { return isAddress(t === null || t === void 0 ? void 0 : t.address) !== false; })) !== null && _a !== void 0 ? _a : []; }, [tokens]);
    var validatedTokenAddresses = React.useMemo(function () { return validatedTokens.map(function (vt) { return vt.address; }); }, [validatedTokens]);
    var balances = useMultipleContractSingleData(validatedTokenAddresses, ERC20Interface, 'balanceOf', React.useMemo(function () { return [address]; }, [address]), tokenBalancesGasRequirement);
    var anyLoading = React.useMemo(function () { return balances.some(function (callState) { return callState.loading; }); }, [balances]);
    return React.useMemo(function () { return [
        address && validatedTokens.length > 0
            ? validatedTokens.reduce(function (memo, token, i) {
                var _a, _b;
                var value = (_b = (_a = balances === null || balances === void 0 ? void 0 : balances[i]) === null || _a === void 0 ? void 0 : _a.result) === null || _b === void 0 ? void 0 : _b[0];
                var amount = value ? JSBI__default["default"].BigInt(value.toString()) : undefined;
                if (amount) {
                    memo[token.address] = sdkCore.CurrencyAmount.fromRawAmount(token, amount);
                }
                return memo;
            }, {})
            : {},
        anyLoading,
    ]; }, [address, validatedTokens, anyLoading, balances]);
}
function useTokenBalances(address, tokens) {
    return useTokenBalancesWithLoadingIndicator(address, tokens)[0];
}
function useCurrencyBalances(account, currencies) {
    var tokens = React.useMemo(function () { var _a; return (_a = currencies === null || currencies === void 0 ? void 0 : currencies.filter(function (currency) { var _a; return (_a = currency === null || currency === void 0 ? void 0 : currency.isToken) !== null && _a !== void 0 ? _a : false; })) !== null && _a !== void 0 ? _a : []; }, [currencies]);
    var tokenBalances = useTokenBalances(account, tokens);
    var containsETH = React.useMemo(function () { var _a; return (_a = currencies === null || currencies === void 0 ? void 0 : currencies.some(function (currency) { return currency === null || currency === void 0 ? void 0 : currency.isNative; })) !== null && _a !== void 0 ? _a : false; }, [currencies]);
    var ethBalance = useNativeCurrencyBalances(React.useMemo(function () { return (containsETH ? [account] : []); }, [containsETH, account]));
    return React.useMemo(function () {
        var _a;
        return (_a = currencies === null || currencies === void 0 ? void 0 : currencies.map(function (currency) {
            if (!account || !currency)
                return undefined;
            if (currency.isToken)
                return tokenBalances[currency.address];
            if (currency.isNative)
                return ethBalance[account];
            return undefined;
        })) !== null && _a !== void 0 ? _a : [];
    }, [account, currencies, ethBalance, tokenBalances]);
}
function useCurrencyBalance(account, currency) {
    return useCurrencyBalances(account, React.useMemo(function () { return [currency]; }, [currency]))[0];
}

var alwaysTrue = function () { return true; };
/** Creates a filter function that filters tokens that do not match the query. */
function getTokenFilter(query) {
    var searchingAddress = isAddress(query);
    if (searchingAddress) {
        var address_1 = searchingAddress.toLowerCase();
        return function (t) { return 'address' in t && address_1 === t.address.toLowerCase(); };
    }
    var queryParts = query
        .toLowerCase()
        .split(/\s+/)
        .filter(function (s) { return s.length > 0; });
    if (queryParts.length === 0)
        return alwaysTrue;
    var match = function (s) {
        var parts = s
            .toLowerCase()
            .split(/\s+/)
            .filter(function (s) { return s.length > 0; });
        return queryParts.every(function (p) { return p.length === 0 || parts.some(function (sp) { return sp.startsWith(p) || sp.endsWith(p); }); });
    };
    return function (_a) {
        var name = _a.name, symbol = _a.symbol;
        return Boolean((symbol && match(symbol)) || (name && match(name)));
    };
}

/** Sorts currency amounts (descending). */
function balanceComparator(a, b) {
    if (a && b) {
        return a.greaterThan(b) ? -1 : a.equalTo(b) ? 0 : 1;
    }
    else if (a === null || a === void 0 ? void 0 : a.greaterThan('0')) {
        return -1;
    }
    else if (b === null || b === void 0 ? void 0 : b.greaterThan('0')) {
        return 1;
    }
    return 0;
}
/** Sorts tokens by currency amount (descending), then symbol (ascending). */
function tokenComparator(balances, a, b) {
    // Sorts by balances
    var balanceComparison = balanceComparator(balances[a.address], balances[b.address]);
    if (balanceComparison !== 0)
        return balanceComparison;
    // Sorts by symbol
    if (a.symbol && b.symbol) {
        return a.symbol.toLowerCase() < b.symbol.toLowerCase() ? -1 : 1;
    }
    return -1;
}
/** Sorts tokens by query, giving precedence to exact matches and partial matches. */
function useSortTokensByQuery(query, tokens) {
    return React.useMemo(function () {
        if (!tokens) {
            return [];
        }
        var matches = query
            .toLowerCase()
            .split(/\s+/)
            .filter(function (s) { return s.length > 0; });
        if (matches.length > 1) {
            return tokens;
        }
        var exactMatches = [];
        var symbolSubtrings = [];
        var rest = [];
        // sort tokens by exact match -> subtring on symbol match -> rest
        tokens.map(function (token) {
            var _a, _b;
            if (((_a = token.symbol) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === matches[0]) {
                return exactMatches.push(token);
            }
            else if ((_b = token.symbol) === null || _b === void 0 ? void 0 : _b.toLowerCase().startsWith(query.toLowerCase().trim())) {
                return symbolSubtrings.push(token);
            }
            else {
                return rest.push(token);
            }
        });
        return __spreadArray(__spreadArray(__spreadArray([], __read(exactMatches), false), __read(symbolSubtrings), false), __read(rest), false);
    }, [tokens, query]);
}

/**
 * Token instances created from token info on a token list.
 */
var WrappedTokenInfo = /** @class */ (function () {
    function WrappedTokenInfo(tokenInfo, list) {
        this.isNative = false;
        this.isToken = true;
        this._checksummedAddress = null;
        this._tags = null;
        this.tokenInfo = tokenInfo;
        this.list = list;
    }
    Object.defineProperty(WrappedTokenInfo.prototype, "address", {
        get: function () {
            if (this._checksummedAddress)
                return this._checksummedAddress;
            var checksummedAddress = isAddress(this.tokenInfo.address);
            if (!checksummedAddress)
                throw new Error("Invalid token address: " + this.tokenInfo.address);
            return (this._checksummedAddress = checksummedAddress);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WrappedTokenInfo.prototype, "chainId", {
        get: function () {
            return this.tokenInfo.chainId;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WrappedTokenInfo.prototype, "decimals", {
        get: function () {
            return this.tokenInfo.decimals;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WrappedTokenInfo.prototype, "name", {
        get: function () {
            return this.tokenInfo.name;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WrappedTokenInfo.prototype, "symbol", {
        get: function () {
            return this.tokenInfo.symbol;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WrappedTokenInfo.prototype, "logoURI", {
        get: function () {
            return this.tokenInfo.logoURI;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WrappedTokenInfo.prototype, "tags", {
        get: function () {
            var _a;
            if (this._tags !== null)
                return this._tags;
            if (!this.tokenInfo.tags)
                return (this._tags = []);
            var listTags = (_a = this.list) === null || _a === void 0 ? void 0 : _a.tags;
            if (!listTags)
                return (this._tags = []);
            return (this._tags = this.tokenInfo.tags.map(function (tagId) {
                return __assign(__assign({}, listTags[tagId]), { id: tagId });
            }));
        },
        enumerable: false,
        configurable: true
    });
    WrappedTokenInfo.prototype.equals = function (other) {
        return other.chainId === this.chainId && other.isToken && other.address.toLowerCase() === this.address.toLowerCase();
    };
    WrappedTokenInfo.prototype.sortsBefore = function (other) {
        if (this.equals(other))
            throw new Error('Addresses should not be equal');
        return this.address.toLowerCase() < other.address.toLowerCase();
    };
    Object.defineProperty(WrappedTokenInfo.prototype, "wrapped", {
        get: function () {
            return this;
        },
        enumerable: false,
        configurable: true
    });
    return WrappedTokenInfo;
}());

var mapCache = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
function tokensToChainTokenMap(tokens) {
    var cached = mapCache === null || mapCache === void 0 ? void 0 : mapCache.get(tokens);
    if (cached)
        return cached;
    var _a = __read(Array.isArray(tokens) ? [undefined, tokens] : [tokens, tokens.tokens], 2), list = _a[0], infos = _a[1];
    var map = infos.reduce(function (map, info) {
        var _a;
        var token = new WrappedTokenInfo(info, list);
        if (((_a = map[token.chainId]) === null || _a === void 0 ? void 0 : _a[token.address]) !== undefined) {
            console.warn("Duplicate token skipped: " + token.address);
            return map;
        }
        if (!map[token.chainId]) {
            map[token.chainId] = {};
        }
        map[token.chainId][token.address] = { token: token, list: list };
        return map;
    }, {});
    mapCache === null || mapCache === void 0 ? void 0 : mapCache.set(tokens, map);
    return map;
}

jotai.atom({});

// parse a name or symbol from a token response
var BYTES32_REGEX = /^0x[a-fA-F0-9]{64}$/;
function parseStringOrBytes32(str, bytes32, defaultValue) {
    return str && str.length > 0
        ? str
        : // need to check for proper bytes string and valid terminator
            bytes32 && BYTES32_REGEX.test(bytes32) && bytes.arrayify(bytes32)[31] === 0
                ? strings.parseBytes32String(bytes32)
                : defaultValue;
}
/**
 * Returns a Token from the tokenAddress.
 * Returns null if token is loading or null was passed.
 * Returns undefined if tokenAddress is invalid or token does not exist.
 */
function useTokenFromMap(tokens, tokenAddress) {
    var chainId = useActiveWeb3React().chainId;
    var address = isAddress(tokenAddress);
    var tokenContract = useTokenContract(address ? address : undefined, false);
    var tokenContractBytes32 = useBytes32TokenContract(address ? address : undefined, false);
    var token = address ? tokens[address] : undefined;
    var tokenName = useSingleCallResult(token ? undefined : tokenContract, 'name', undefined, reduxMulticall.NEVER_RELOAD);
    var tokenNameBytes32 = useSingleCallResult(token ? undefined : tokenContractBytes32, 'name', undefined, reduxMulticall.NEVER_RELOAD);
    var symbol = useSingleCallResult(token ? undefined : tokenContract, 'symbol', undefined, reduxMulticall.NEVER_RELOAD);
    var symbolBytes32 = useSingleCallResult(token ? undefined : tokenContractBytes32, 'symbol', undefined, reduxMulticall.NEVER_RELOAD);
    var decimals = useSingleCallResult(token ? undefined : tokenContract, 'decimals', undefined, reduxMulticall.NEVER_RELOAD);
    return React.useMemo(function () {
        var _a, _b, _c, _d;
        if (token)
            return token;
        if (tokenAddress === null)
            return null;
        if (!chainId || !address)
            return undefined;
        if (decimals.loading || symbol.loading || tokenName.loading)
            return null;
        if (decimals.result) {
            return new sdkCore.Token(chainId, address, decimals.result[0], parseStringOrBytes32((_a = symbol.result) === null || _a === void 0 ? void 0 : _a[0], (_b = symbolBytes32.result) === null || _b === void 0 ? void 0 : _b[0], 'UNKNOWN'), parseStringOrBytes32((_c = tokenName.result) === null || _c === void 0 ? void 0 : _c[0], (_d = tokenNameBytes32.result) === null || _d === void 0 ? void 0 : _d[0], 'Unknown Token'));
        }
        return undefined;
    }, [
        address,
        chainId,
        decimals.loading,
        decimals.result,
        symbol.loading,
        symbol.result,
        symbolBytes32.result,
        token,
        tokenAddress,
        tokenName.loading,
        tokenName.result,
        tokenNameBytes32.result,
    ]);
}
/**
 * Returns a Currency from the currencyId.
 * Returns null if currency is loading or null was passed.
 * Returns undefined if currencyId is invalid or token does not exist.
 */
function useCurrencyFromMap(tokens, currencyId) {
    var _a;
    var nativeCurrency = useNativeCurrency();
    var isNative = Boolean(nativeCurrency && (currencyId === null || currencyId === void 0 ? void 0 : currencyId.toUpperCase()) === 'ETH');
    var token = useTokenFromMap(tokens, isNative ? undefined : currencyId);
    if (currencyId === null || currencyId === undefined)
        return currencyId;
    // this case so we use our builtin wrapped token instead of wrapped tokens on token lists
    var wrappedNative = nativeCurrency === null || nativeCurrency === void 0 ? void 0 : nativeCurrency.wrapped;
    if (((_a = wrappedNative === null || wrappedNative === void 0 ? void 0 : wrappedNative.address) === null || _a === void 0 ? void 0 : _a.toUpperCase()) === (currencyId === null || currencyId === void 0 ? void 0 : currencyId.toUpperCase()))
        return wrappedNative;
    return isNative ? nativeCurrency : token;
}

var DEFAULT_LIST_PRIORITIES = DEFAULT_LIST_OF_LISTS.reduce(function (memo, listUrl, index) {
    memo[listUrl] = index + 1;
    return memo;
}, {});
// use ordering of default list of lists to assign priority
function sortByListPriority(urlA, urlB) {
    if (DEFAULT_LIST_PRIORITIES[urlA] && DEFAULT_LIST_PRIORITIES[urlB]) {
        return DEFAULT_LIST_PRIORITIES[urlA] - DEFAULT_LIST_PRIORITIES[urlB];
    }
    return 0;
}

var name$1 = "Broken Token List";
var timestamp$1 = "2021-01-05T20:47:02.923Z";
var version$1 = {
	major: 1,
	minor: 0,
	patch: 0
};
var tags$1 = {
};
var logoURI$1 = "ipfs://QmNa8mQkrNKp1WEEeGjFezDmDeodkWRevGFN8JCV7b4Xir";
var keywords$1 = [
	"uniswap",
	"broken"
];
var tokens$1 = [
	{
		name: "UNI HODL",
		address: "0x4bf5dc91E2555449293D7824028Eb8Fe5879B689",
		symbol: "UniH",
		decimals: 18,
		chainId: 1,
		logoURI: ""
	}
];
var BROKEN_LIST = {
	name: name$1,
	timestamp: timestamp$1,
	version: version$1,
	tags: tags$1,
	logoURI: logoURI$1,
	keywords: keywords$1,
	tokens: tokens$1
};

var name = "Unsupported Tokens";
var timestamp = "2021-01-05T20:47:02.923Z";
var version = {
	major: 1,
	minor: 0,
	patch: 0
};
var tags = {
};
var logoURI = "ipfs://QmNa8mQkrNKp1WEEeGjFezDmDeodkWRevGFN8JCV7b4Xir";
var keywords = [
	"uniswap",
	"unsupported"
];
var tokens = [
	{
		name: "Gold Tether",
		address: "0x4922a015c4407F87432B179bb209e125432E4a2A",
		symbol: "XAUt",
		decimals: 6,
		chainId: 1,
		logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x4922a015c4407F87432B179bb209e125432E4a2A/logo.png"
	},
	{
		name: "Grump Cat",
		address: "0x93B2FfF814FCaEFFB01406e80B4Ecd89Ca6A021b",
		symbol: "GRUMPY",
		decimals: 9,
		chainId: 1,
		logoURI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x4922a015c4407F87432B179bb209e125432E4a2A/logo.png"
	},
	{
		name: "apeUSD-UMA Synthetic USD (Dec 2021)",
		address: "0xfA5e27893aee4805283D86e4283Da64F8c72dd56",
		symbol: "apeUSD-UMA-DEC21",
		decimals: 18,
		chainId: 1,
		logoURI: ""
	},
	{
		chainId: 1,
		address: "0xc6b11850241c5127eab73af4b6c68bc267cbbff4",
		name: "oWETHp Put 360 DEC2520",
		symbol: "oWETH-360P-12/25/20",
		decimals: 7
	},
	{
		chainId: 1,
		name: "oYFIp Put 25000 OCT0220",
		address: "0x452b421be5b30f0c6ad8c3f03c06bdaab4f5c56c",
		symbol: "oYFI-25000P-10/02/20",
		decimals: 7
	},
	{
		chainId: 1,
		name: "oWETHp Put 360 OCT3020",
		address: "0x0578779e746d7186253a36cf651ea786acfcf087",
		symbol: "oWETH-360P-10/30/20",
		decimals: 7
	},
	{
		chainId: 1,
		name: "ETHc Call 500 OCT3020",
		address: "0xf9aba2e43fb19184408ea3b572a0fd672946f87b",
		symbol: "oETH-500C-10/30/20",
		decimals: 6
	},
	{
		chainId: 1,
		name: "oBALp Put 22 OCT0220",
		address: "0xdb0991dfc7e828b5a2837dc82d68e16490562c8d",
		symbol: "oBAL-22P-10/02/20",
		decimals: 7
	},
	{
		chainId: 1,
		name: "oCOMPp Put 150 SEP2520",
		address: "0xe951ebe6b4420ab3f4844cf36dedd263d095b416",
		symbol: "oCOMP-150P-09/25/20",
		decimals: 7
	},
	{
		chainId: 1,
		name: "oCRVp Put 3 SEP252020",
		address: "0x9215bd49b59748419eac6bad9dbe247df06ebdb9",
		symbol: "oCRV-3P-09/25/20",
		decimals: 7
	},
	{
		chainId: 1,
		name: "oETHp Put 180 SEP2520",
		address: "0xE3A2c34Fa2F59ffa95C4ACd1E5663633d45Bc3AD",
		symbol: "oETH-180P-09/25/20",
		decimals: 7
	},
	{
		chainId: 1,
		name: "oETHc Call 400 SEP2520",
		address: "0x05977EBC26825C0CD6097E0Ad7204721516711Eb",
		symbol: "oETH-400C-09/25/20",
		decimals: 7
	},
	{
		chainId: 1,
		name: "oWETHp Put 380 SEP1820",
		address: "0x31f88266301b08631f9f0e33fd5c43c2a5d1e5b2",
		symbol: "oWETH-380P-09/18/20",
		decimals: 7
	},
	{
		chainId: 1,
		name: "oYFIp Put 8500 SEP1820",
		address: "0xd1cec2f67fdc4c60e0963515dfc3343f31e32e47",
		symbol: "oYFI-8500P-09/18/20",
		decimals: 7
	},
	{
		chainId: 1,
		name: "oWETHp Put 370 SEP1120",
		address: "0x15844029b2c2bf24506e9937739a9a912f1e4354",
		symbol: "oWETH-370P-09/11/20",
		decimals: 7
	},
	{
		chainId: 1,
		name: "oWETHp Put 400 SEP0420",
		address: "0x5562c33c383f6386be4f6dcdbd35a3a99bbcfde6",
		symbol: "oWETH-400P-09/04/20",
		decimals: 7
	},
	{
		chainId: 1,
		name: "oETHp Put 200 AUG2820",
		address: "0x3CBFC1397deF0602c2d211c70A1c0c38CEDB5448",
		symbol: "oWETH-400P-09/04/20",
		decimals: 7
	},
	{
		chainId: 1,
		name: "Opyn cDai Insurance",
		symbol: "ocDai",
		address: "0x98cc3bd6af1880fcfda17ac477b2f612980e5e33",
		decimals: 8
	},
	{
		chainId: 1,
		name: "Opyn cUSDC Insurance",
		symbol: "ocUSDC",
		address: "0x8ED9f862363fFdFD3a07546e618214b6D59F03d4",
		decimals: 8
	},
	{
		chainId: 1,
		address: "0x176C674Ee533C6139B0dc8b458D72A93dCB3e705",
		symbol: "iAAVE",
		name: "Synth Inverse Aave",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/iAAVE.svg",
		tags: [
			"inverse",
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x8A8079c7149B8A1611e5C5d978DCA3bE16545F83",
		symbol: "iADA",
		name: "Synth Inverse Cardano",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/iADA.svg",
		tags: [
			"inverse",
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0xAFD870F32CE54EfdBF677466B612bf8ad164454B",
		symbol: "iBNB",
		name: "Synth Inverse Binance Coin",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/iBNB.svg",
		tags: [
			"inverse",
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0xD6014EA05BDe904448B743833dDF07c3C7837481",
		symbol: "iBTC",
		name: "Synth Inverse Bitcoin",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/iBTC.svg",
		tags: [
			"inverse",
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x336213e1DDFC69f4701Fc3F86F4ef4A160c1159d",
		symbol: "iCEX",
		name: "Synth Inverse Centralised Exchange Index",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/iCEX.svg",
		tags: [
			"index",
			"inverse",
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x6345728B1ccE16E6f8C509950b5c84FFF88530d9",
		symbol: "iCOMP",
		name: "Synth Inverse Compound",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/iCOMP.svg",
		tags: [
			"inverse",
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0xCB98f42221b2C251A4E74A1609722eE09f0cc08E",
		symbol: "iDASH",
		name: "Synth Inverse Dash",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/iDASH.svg",
		tags: [
			"inverse",
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x14d10003807AC60d07BB0ba82cAeaC8d2087c157",
		symbol: "iDEFI",
		name: "Synth Inverse DeFi Index",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/iDEFI.svg",
		tags: [
			"index",
			"inverse",
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x46a97629C9C1F58De6EC18C7F536e7E6d6A6ecDe",
		symbol: "iDOT",
		name: "Synth Inverse Polkadot",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/iDOT.svg",
		tags: [
			"inverse",
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0xF4EebDD0704021eF2a6Bbe993fdf93030Cd784b4",
		symbol: "iEOS",
		name: "Synth Inverse EOS",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/iEOS.svg",
		tags: [
			"inverse",
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0xd50c1746D835d2770dDA3703B69187bFfeB14126",
		symbol: "iETC",
		name: "Synth Inverse Ethereum Classic",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/iETC.svg",
		tags: [
			"inverse",
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0xA9859874e1743A32409f75bB11549892138BBA1E",
		symbol: "iETH",
		name: "Synth Inverse Ether",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/iETH.svg",
		tags: [
			"inverse",
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x2d7aC061fc3db53c39fe1607fB8cec1B2C162B01",
		symbol: "iLINK",
		name: "Synth Inverse Chainlink",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/iLINK.svg",
		tags: [
			"inverse",
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x79da1431150C9b82D2E5dfc1C68B33216846851e",
		symbol: "iLTC",
		name: "Synth Inverse Litecoin",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/iLTC.svg",
		tags: [
			"inverse",
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0xA5a5DF41883Cdc00c4cCC6E8097130535399d9a3",
		symbol: "iOIL",
		name: "Synth Inverse Perpetual Oil Futures",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/iOIL.svg",
		tags: [
			"inverse",
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x0fEd38108bdb8e62ef7b5680E8E0726E2F29e0De",
		symbol: "iREN",
		name: "Synth Inverse Ren",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/iREN.svg",
		tags: [
			"inverse",
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0xC5807183a9661A533CB08CbC297594a0B864dc12",
		symbol: "iTRX",
		name: "Synth Inverse TRON",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/iTRX.svg",
		tags: [
			"inverse",
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x36A00FF9072570eF4B9292117850B8FE08d96cce",
		symbol: "iUNI",
		name: "Synth Inverse Uniswap",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/iUNI.svg",
		tags: [
			"inverse",
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x4AdF728E2Df4945082cDD6053869f51278fae196",
		symbol: "iXMR",
		name: "Synth Inverse Monero",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/iXMR.svg",
		tags: [
			"inverse",
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x27269b3e45A4D3E79A3D6BFeE0C8fB13d0D711A6",
		symbol: "iXRP",
		name: "Synth Inverse Ripple",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/iXRP.svg",
		tags: [
			"inverse",
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x8deef89058090ac5655A99EEB451a4f9183D1678",
		symbol: "iXTZ",
		name: "Synth Inverse Tezos",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/iXTZ.svg",
		tags: [
			"inverse",
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x592244301CeA952d6daB2fdC1fE6bd9E53917306",
		symbol: "iYFI",
		name: "Synth Inverse yearn.finance",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/iYFI.svg",
		tags: [
			"inverse",
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0xcD39b5434a0A92cf47D1F567a7dF84bE356814F0",
		symbol: "s1INCH",
		name: "Synth 1inch",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/s1INCH.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x7537AAe01f3B218DAE75e10d952473823F961B87",
		symbol: "sAAPL",
		name: "Synth Apple",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sAAPL.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0xd2dF355C19471c8bd7D8A3aa27Ff4e26A21b4076",
		symbol: "sAAVE",
		name: "Synth Aave",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sAAVE.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0xe36E2D3c7c34281FA3bC737950a68571736880A1",
		symbol: "sADA",
		name: "Synth Cardano",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sADA.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x9CF7E61853ea30A41b02169391b393B901eac457",
		symbol: "sAMZN",
		name: "Synth Amazon",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sAMZN.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0xF48e200EAF9906362BB1442fca31e0835773b8B4",
		symbol: "sAUD",
		name: "Synth Australian Dollars",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sAUD.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x617aeCB6137B5108D1E7D4918e3725C8cEbdB848",
		symbol: "sBNB",
		name: "Synth Binance Coin",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sBNB.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0xfE18be6b3Bd88A2D2A7f928d00292E7a9963CfC6",
		symbol: "sBTC",
		name: "Synth Bitcoin",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sBTC.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0xeABACD844A196D7Faf3CE596edeBF9900341B420",
		symbol: "sCEX",
		name: "Synth Centralised Exchange Index",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sCEX.svg",
		tags: [
			"index",
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x0F83287FF768D1c1e17a42F44d644D7F22e8ee1d",
		symbol: "sCHF",
		name: "Synth Swiss Franc",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sCHF.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x9EeF4CA7aB9fa8bc0650127341C2d3F707a40f8A",
		symbol: "sCOIN",
		name: "Synth Coinbase",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sCOIN.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0xEb029507d3e043DD6C87F2917C4E82B902c35618",
		symbol: "sCOMP",
		name: "Synth Compound",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sCOMP.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0xD38aEb759891882e78E957c80656572503D8c1B1",
		symbol: "sCRV",
		name: "Synth Curve DAO Token",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sCRV.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0xfE33ae95A9f0DA8A845aF33516EDc240DCD711d6",
		symbol: "sDASH",
		name: "Synth Dash",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sDASH.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0xe1aFe1Fd76Fd88f78cBf599ea1846231B8bA3B6B",
		symbol: "sDEFI",
		name: "Synth DeFi Index",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sDEFI.svg",
		tags: [
			"index",
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x1715AC0743102BF5Cd58EfBB6Cf2dC2685d967b6",
		symbol: "sDOT",
		name: "Synth Polkadot",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sDOT.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x88C8Cf3A212c0369698D13FE98Fcb76620389841",
		symbol: "sEOS",
		name: "Synth EOS",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sEOS.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x22602469d704BfFb0936c7A7cfcD18f7aA269375",
		symbol: "sETC",
		name: "Synth Ethereum Classic",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sETC.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x5e74C9036fb86BD7eCdcb084a0673EFc32eA31cb",
		symbol: "sETH",
		name: "Synth Ether",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sETH.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0xD71eCFF9342A5Ced620049e616c5035F1dB98620",
		symbol: "sEUR",
		name: "Synth Euros",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sEUR.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0xf50B5e535F62a56A9BD2d8e2434204E726c027Fa",
		symbol: "sFB",
		name: "Synth Facebook",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sFB.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x23348160D7f5aca21195dF2b70f28Fce2B0be9fC",
		symbol: "sFTSE",
		name: "Synth FTSE 100 Index",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sFTSE.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x97fe22E7341a0Cd8Db6F6C021A24Dc8f4DAD855F",
		symbol: "sGBP",
		name: "Synth Pound Sterling",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sGBP.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0xC63B8ECCE56aB9C46184eC6aB85e4771fEa4c8AD",
		symbol: "sGOOG",
		name: "Synth Alphabet",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sGOOG.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0xF6b1C627e95BFc3c1b4c9B825a032Ff0fBf3e07d",
		symbol: "sJPY",
		name: "Synth Japanese Yen",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sJPY.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x269895a3dF4D73b077Fc823dD6dA1B95f72Aaf9B",
		symbol: "sKRW",
		name: "Synth South Korean Won",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sKRW.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0xbBC455cb4F1B9e4bFC4B73970d360c8f032EfEE6",
		symbol: "sLINK",
		name: "Synth Chainlink",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sLINK.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0xC14103C2141E842e228FBaC594579e798616ce7A",
		symbol: "sLTC",
		name: "Synth Litecoin",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sLTC.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x745a824D6aBBD236AA794b5530062778A6Ad7523",
		symbol: "sMSFT",
		name: "Synth Microsoft",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sMSFT.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x5A7E3c07604EB515C16b36cd51906a65f021F609",
		symbol: "sNFLX",
		name: "Synth Netflix",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sNFLX.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x757de3ac6B830a931eF178C6634c5C551773155c",
		symbol: "sNIKKEI",
		name: "Synth Nikkei 225 Index",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sNIKKEI.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x6d16cF3EC5F763d4d99cB0B0b110eefD93B11B56",
		symbol: "sOIL",
		name: "Synth Perpetual Oil Futures",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sOIL.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0xD31533E8d0f3DF62060e94B3F1318137bB6E3525",
		symbol: "sREN",
		name: "Synth Ren",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sREN.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x0352557B007A4Aae1511C114409b932F06F9E2f4",
		symbol: "sRUNE",
		name: "Synth THORChain",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sRUNE.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0xf2E08356588EC5cd9E437552Da87C0076b4970B0",
		symbol: "sTRX",
		name: "Synth TRON",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sTRX.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x918dA91Ccbc32B7a6A0cc4eCd5987bbab6E31e6D",
		symbol: "sTSLA",
		name: "Synth Tesla",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sTSLA.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x30635297E450b930f8693297eBa160D9e6c8eBcf",
		symbol: "sUNI",
		name: "Synth Uniswap",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sUNI.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x6A22e5e94388464181578Aa7A6B869e00fE27846",
		symbol: "sXAG",
		name: "Synth Silver Ounce",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sXAG.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x261EfCdD24CeA98652B9700800a13DfBca4103fF",
		symbol: "sXAU",
		name: "Synth Gold Ounce",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sXAU.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x5299d6F7472DCc137D7f3C4BcfBBB514BaBF341A",
		symbol: "sXMR",
		name: "Synth Monero",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sXMR.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0xa2B0fDe6D710e201d0d608e924A484d1A5fEd57c",
		symbol: "sXRP",
		name: "Synth Ripple",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sXRP.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x2e59005c5c0f0a4D77CcA82653d48b46322EE5Cd",
		symbol: "sXTZ",
		name: "Synth Tezos",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sXTZ.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x992058B7DB08F9734d84485bfbC243C4ee6954A7",
		symbol: "sYFI",
		name: "Synth yearn.finance",
		decimals: 18,
		logoURI: "https://raw.githubusercontent.com/Synthetixio/synthetix-assets/v2.0.10/synths/sYFI.svg",
		tags: [
			"synth"
		]
	},
	{
		chainId: 1,
		address: "0x81ab848898b5ffD3354dbbEfb333D5D183eEDcB5",
		name: "yUSD Synthetic Expiring 1 September 2020",
		symbol: "yUSDSEP20",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0xB2FdD60AD80ca7bA89B9BAb3b5336c2601C020b4",
		name: "yUSD Synthetic Expiring 1 October 2020",
		symbol: "yUSDOCT20",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x208d174775dc39fe18b1b374972f77ddec6c0f73",
		name: "uUSDrBTC Synthetic Expiring 1 Oct 2020",
		symbol: "uUSDrBTC-OCT",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0xf06ddacf71e2992e2122a1a0168c6967afdf63ce",
		name: "uUSDrBTC Synthetic Expiring 31 Dec 2020",
		symbol: "uUSDrBTC-DEC",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0xd16c79c8a39d44b2f3eb45d2019cd6a42b03e2a9",
		name: "uUSDwETH Synthetic Expiring 31 Dec 2020",
		symbol: "uUSDwETH-DEC",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x3d995510f8d82c2ea341845932b5ddde0bead9a3",
		name: "uGAS-JAN21 Token Expiring 31 Jan 2021",
		symbol: "uGAS-JAN21",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x90f802c7e8fb5d40b0de583e34c065a3bd2020d8",
		name: "YD-ETH-MAR21 Token Expiring 31 Mar 2021",
		symbol: "YD-ETH-MAR21",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x002f0b1a71c5730cf2f4da1970a889207bdb6d0d",
		name: "YD-BTC-MAR21 Token Expiring 31 Mar 2021",
		symbol: "YD-BTC-MAR21",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x1062ad0e59fa67fa0b27369113098cc941dd0d5f",
		name: "UMA 35 Call Expirying 30 Apr 2021",
		symbol: "UMAc35-0421",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0xf93340b1a3adf7eedcaec25fae8171d4b736e89f",
		name: "pxUSD Synthetic USD Expiring 1 April 2021",
		symbol: "pxUSD_MAR2021",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x84bd083b1c8bf929f39c98bc17cf518f40154f58",
		name: "Mario Cash Synthetic Token Expiring 15 January 2021",
		symbol: "Mario Cash-JAN-2021",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x81fab276aec924fbde190cf379783526d413cf70",
		name: "uGAS-FEB21 Token Expiring 28 Feb 2021",
		symbol: "uGAS-FEB21",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x4e110603e70b0b5f1c403ee543b37e1f1244cf28",
		name: "uGAS-MAR21 Token Expiring 31 Mar 2021",
		symbol: "uGAS-MAR21",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0xcf55a7f92d5e0c6683debbc1fc20c0a6e056df13",
		name: "Zelda Elastic Cash",
		symbol: "Zelda Elastic Cash",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x654eebac62240e6c56bab5f6adf7cfa74a894510",
		name: "Zelda Spring Nuts Cash",
		symbol: "Zelda Spring Nuts Cash",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0xa48920cc1ad85d8ea13af5d7be180c0338c306dd",
		name: "Zelda Summer Nuts Cash",
		symbol: "Zelda Summer Nuts Cash",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x249a198d59b57fda5dda90630febc86fd8c7594c",
		name: "Zelda Whirlwind Cash",
		symbol: "Zelda Whirlwind Cash",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x5ed1406873c9eb91f6f9a67ac4e152387c1132e7",
		name: "Zelda Reinforced Cash",
		symbol: "Zelda Reinforced Cash",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x8104c9f13118320eefe5fbea8a44d600b85981ef",
		name: "Mini Mario Summer Cash",
		symbol: "Mini Mario Summer Cash",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x69746c719e59674b147df25f50e7cfa0673cb625",
		name: "Mini Mario Spring Cash",
		symbol: "Mini Mario Spring Cash",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x6b1257641d18791141f025eab36fb567c4b564ff",
		name: "Bitcoin Dominance Token 31 March 2021",
		symbol: "BTCDOM-MAR2021",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x4e83b6287588a96321b2661c5e041845ff7814af",
		name: "Altcoin Dominance Token 31 March 2021",
		symbol: "ALTDOM-MAR2021",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x59fec83ec709c893aedd1a144cf1828eb04127cd",
		name: "pxGOLD Synthetic GOLD Expiring 31 May 2021",
		symbol: "pxGOLD_MAY2021",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x89337BFb7938804c3776C9FB921EccAf5ab76758",
		name: "Compound Annualized Rate Future Expiring 28 March 2021",
		symbol: "CAR-USDC-MAR21",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0xec58d3aefc9aaa2e0036fa65f70d569f49d9d1ed",
		name: "uSTONKS Index Token April 2021",
		symbol: "uSTONKS_APR21",
		decimals: 6
	},
	{
		chainId: 1,
		address: "0xa6B9d7E3d76cF23549293Fb22c488E0Ea591A44e",
		name: "uGAS-JUN21 Token Expiring 30 Jun 2021",
		symbol: "uGAS-JUN21",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0xe813b65da6c38a04591aed3f082d32db7d53c382",
		name: "Yield Dollar [WETH Dec 2021]",
		symbol: "YD-ETH-DEC21",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x4b606e9eb2228c70f44453afe5a73e1fea258ce1",
		name: "pxUSD Synthetic USD Expiring 31 Mar 2022",
		symbol: "pxUSD_MAR2022",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x5247c0db4044fb6f97f32c7e1b48758019a5a912",
		name: "pxGOLD Synthetic Gold Expiring 31 Mar 2022",
		symbol: "pxGOLD_MAR2022",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x56fb1acaff95c0b6ebcd17c8361a63d98b1a5a11",
		name: "uForex CNYUSD Synthetic Token April 2021",
		symbol: "uCNYUSD-APR",
		decimals: 6
	},
	{
		chainId: 1,
		address: "0xd49fa405dce086c65d66ca1ca41f8e98583812b4",
		name: "uForex EURUSD Synthetic Token April 2021",
		symbol: "uEURUSD-APR",
		decimals: 6
	},
	{
		chainId: 1,
		address: "0x29dddacba3b231ee8d673dd0f0fa759ea145561b",
		name: "DEFI_PULSE_TOTAL_TVL Synthetic Token Expiring 15 April 2021",
		symbol: "TVL_ALL_APRIL15",
		decimals: 6
	},
	{
		chainId: 1,
		address: "0xcbe430927370e95b4b10cfc702c6017ec7abefc3",
		name: "Yield Dollar [WETH Jun 2021]",
		symbol: "YD-ETH-JUN21",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x4b7fb448df91c8ed973494f8c8c4f12daf3a8521",
		name: "Yield Dollar [renBTC Jun 2021]",
		symbol: "YD-BTC-JUN21",
		decimals: 8
	},
	{
		chainId: 1,
		address: "0x3108c33b6fb38efedaefd8b5f7ca01d5f5c7372d",
		name: "Yield Dollar UMA 21",
		symbol: "yUMA21",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x0cae9e4d663793c2a2A0b211c1Cf4bBca2B9cAa7",
		name: "Mirrored Amazon",
		symbol: "MAMZN",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x31c63146a635EB7465e5853020b39713AC356991",
		name: "M US Oil",
		symbol: "MUSO",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x59A921Db27Dd6d4d974745B7FfC5c33932653442",
		name: "M Google",
		symbol: "MGOOGL",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0xf72FCd9DCF0190923Fadd44811E240Ef4533fc86",
		name: "Mirrored ProShares",
		symbol: "MVIXY",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x56aA298a19C93c6801FDde870fA63EF75Cc0aF72",
		name: "Mirrored Alibaba",
		symbol: "MBABA",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x0e99cC0535BB6251F6679Fa6E65d6d3b430e840B",
		name: "Mirrored Facebook",
		symbol: "MFB",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x13B02c8dE71680e71F0820c996E4bE43c2F57d15",
		name: "Mirrored Invesco QQ",
		symbol: "MQQQ",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x41BbEDd7286dAab5910a1f15d12CBda839852BD7",
		name: "Mirrored Microsoft",
		symbol: "MMSFT",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x9d1555d8cB3C846Bb4f7D5B1B1080872c3166676",
		name: "Mirrored iShares Si",
		symbol: "MSLV",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x21cA39943E91d704678F5D00b6616650F066fD63",
		name: "Mirrored Tesla",
		symbol: "MTSLA",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0xe82bbB62fA81d0701643d1675FB50ec52fD3Df92",
		name: "DYDX Token",
		symbol: "DYDX",
		decimals: 18
	},
	{
		chainId: 10,
		address: "0xE405de8F52ba7559f9df3C368500B6E6ae6Cee49",
		name: "sETH",
		symbol: "Synth Ether",
		decimals: 18
	},
	{
		chainId: 10,
		address: "0x298B9B95708152ff6968aafd889c6586e9169f1D",
		name: "sBTC",
		symbol: "Synth Bitcoin",
		decimals: 18
	},
	{
		chainId: 10,
		address: "0xc5Db22719A06418028A40A9B5E9A7c02959D0d08",
		name: "sLINK",
		symbol: "Synth Link",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x6B60eE11b73230045cF9095E6e43AE9Ea638e172",
		name: "Shatner",
		symbol: "SHAT",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x7277a44D1325D81Ac58893002a1B40a41bea43fe",
		name: "FAANG Index",
		symbol: "FAANG",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0x76175599887730786bdA1545D0D7AcE8737fEBB1",
		name: "ENS DAO",
		symbol: "ENS",
		decimals: 18
	},
	{
		chainId: 1,
		address: "0xa82AA729AE2F0d78e961D66db53949e27a9E866d",
		name: "BMEX",
		symbol: "BMEX",
		decimals: 18
	}
];
var UNSUPPORTED_TOKEN_LIST = {
	name: name,
	timestamp: timestamp,
	version: version,
	tags: tags,
	logoURI: logoURI,
	keywords: keywords,
	tokens: tokens
};

function useAllLists() {
    return useAppSelector(function (state) { return state.lists.byUrl; });
}
/**
 * Combine the tokens in map2 with the tokens on map1, where tokens on map1 take precedence
 * @param map1 the base token map
 * @param map2 the map of additioanl tokens to add to the base map
 */
function combineMaps(map1, map2) {
    var chainIds = Object.keys(Object.keys(map1)
        .concat(Object.keys(map2))
        .reduce(function (memo, value) {
        memo[value] = true;
        return memo;
    }, {})).map(function (id) { return parseInt(id); });
    return chainIds.reduce(function (memo, chainId) {
        memo[chainId] = __assign(__assign({}, map2[chainId]), map1[chainId]);
        return memo;
    }, {});
}
// merge tokens contained within lists from urls
function useCombinedTokenMapFromUrls(urls) {
    var lists = useAllLists();
    return React.useMemo(function () {
        if (!urls)
            return {};
        return (urls
            .slice()
            // sort by priority so top priority goes last
            .sort(sortByListPriority)
            .reduce(function (allTokens, currentUrl) {
            var _a;
            var current = (_a = lists[currentUrl]) === null || _a === void 0 ? void 0 : _a.current;
            if (!current)
                return allTokens;
            try {
                return combineMaps(allTokens, tokensToChainTokenMap(current));
            }
            catch (error) {
                console.error('Could not show token list due to error', error);
                return allTokens;
            }
        }, {}));
    }, [lists, urls]);
}
// filter out unsupported lists
function useActiveListUrls() {
    var activeListUrls = useAppSelector(function (state) { return state.lists.activeListUrls; });
    return React.useMemo(function () { return activeListUrls === null || activeListUrls === void 0 ? void 0 : activeListUrls.filter(function (url) { return !UNSUPPORTED_LIST_URLS.includes(url); }); }, [activeListUrls]);
}
function useInactiveListUrls() {
    var lists = useAllLists();
    var allActiveListUrls = useActiveListUrls();
    return React.useMemo(function () { return Object.keys(lists).filter(function (url) { return !(allActiveListUrls === null || allActiveListUrls === void 0 ? void 0 : allActiveListUrls.includes(url)) && !UNSUPPORTED_LIST_URLS.includes(url); }); }, [lists, allActiveListUrls]);
}
// get all the tokens from active lists, combine with local default tokens
function useCombinedActiveList() {
    var activeListUrls = useActiveListUrls();
    var activeTokens = useCombinedTokenMapFromUrls(activeListUrls);
    return activeTokens;
}
// list of tokens not supported on interface for various reasons, used to show warnings and prevent swaps and adds
function useUnsupportedTokenList() {
    // get hard-coded broken tokens
    var brokenListMap = React.useMemo(function () { return tokensToChainTokenMap(BROKEN_LIST); }, []);
    // get hard-coded list of unsupported tokens
    var localUnsupportedListMap = React.useMemo(function () { return tokensToChainTokenMap(UNSUPPORTED_TOKEN_LIST); }, []);
    // get dynamic list of unsupported tokens
    var loadedUnsupportedListMap = useCombinedTokenMapFromUrls(UNSUPPORTED_LIST_URLS);
    // format into one token address map
    return React.useMemo(function () { return combineMaps(brokenListMap, combineMaps(localUnsupportedListMap, loadedUnsupportedListMap)); }, [brokenListMap, localUnsupportedListMap, loadedUnsupportedListMap]);
}
function useIsListActive(url) {
    var activeListUrls = useActiveListUrls();
    return Boolean(activeListUrls === null || activeListUrls === void 0 ? void 0 : activeListUrls.includes(url));
}

// reduce token map into standard address <-> Token mapping, optionally include user added tokens
function useTokensFromMap(tokenMap, includeUserAdded) {
    var chainId = useActiveWeb3React().chainId;
    var userAddedTokens = useUserAddedTokens();
    return React.useMemo(function () {
        var _a;
        if (!chainId)
            return {};
        // reduce to just tokens
        var mapWithoutUrls = Object.keys((_a = tokenMap[chainId]) !== null && _a !== void 0 ? _a : {}).reduce(function (newMap, address) {
            newMap[address] = tokenMap[chainId][address].token;
            return newMap;
        }, {});
        if (includeUserAdded) {
            return (userAddedTokens
                // reduce into all ALL_TOKENS filtered by the current chain
                .reduce(function (tokenMap, token) {
                tokenMap[token.address] = token;
                return tokenMap;
            }, __assign({}, mapWithoutUrls)));
        }
        return mapWithoutUrls;
    }, [chainId, userAddedTokens, tokenMap, includeUserAdded]);
}
function useAllTokens() {
    var allTokens = useCombinedActiveList();
    return useTokensFromMap(allTokens, true);
}
function useUnsupportedTokens() {
    var chainId = useActiveWeb3React().chainId;
    var listsByUrl = useAllLists();
    var unsupportedTokensMap = useUnsupportedTokenList();
    var unsupportedTokens = useTokensFromMap(unsupportedTokensMap, false);
    // checks the default L2 lists to see if `bridgeInfo` has an L1 address value that is unsupported
    var l2InferredBlockedTokens = React.useMemo(function () {
        if (!chainId || !L2_CHAIN_IDS.includes(chainId)) {
            return {};
        }
        if (!listsByUrl) {
            return {};
        }
        var listUrl = CHAIN_INFO[chainId].defaultListUrl;
        var list = listsByUrl[listUrl].current;
        if (!list) {
            return {};
        }
        var unsupportedSet = new Set(Object.keys(unsupportedTokens));
        return list.tokens.reduce(function (acc, tokenInfo) {
            var _a;
            var _b;
            var bridgeInfo = (_b = tokenInfo.extensions) === null || _b === void 0 ? void 0 : _b.bridgeInfo;
            if (bridgeInfo &&
                bridgeInfo[SupportedChainId.MAINNET] &&
                bridgeInfo[SupportedChainId.MAINNET].tokenAddress &&
                unsupportedSet.has(bridgeInfo[SupportedChainId.MAINNET].tokenAddress)) {
                var address = bridgeInfo[SupportedChainId.MAINNET].tokenAddress;
                // don't rely on decimals--it's possible that a token could be bridged w/ different decimals on the L2
                return __assign(__assign({}, acc), (_a = {}, _a[address] = new sdkCore.Token(SupportedChainId.MAINNET, address, tokenInfo.decimals), _a));
            }
            return acc;
        }, {});
    }, [chainId, listsByUrl, unsupportedTokens]);
    return __assign(__assign({}, unsupportedTokens), l2InferredBlockedTokens);
}
function useSearchInactiveTokenLists(search, minResults) {
    if (minResults === void 0) { minResults = 10; }
    var lists = useAllLists();
    var inactiveUrls = useInactiveListUrls();
    var chainId = useActiveWeb3React().chainId;
    var activeTokens = useAllTokens();
    return React.useMemo(function () {
        var e_1, _a, e_2, _b;
        if (!search || search.trim().length === 0)
            return [];
        var tokenFilter = getTokenFilter(search);
        var result = [];
        var addressSet = {};
        try {
            for (var inactiveUrls_1 = __values(inactiveUrls), inactiveUrls_1_1 = inactiveUrls_1.next(); !inactiveUrls_1_1.done; inactiveUrls_1_1 = inactiveUrls_1.next()) {
                var url = inactiveUrls_1_1.value;
                var list = lists[url].current;
                if (!list)
                    continue;
                try {
                    for (var _c = (e_2 = void 0, __values(list.tokens)), _d = _c.next(); !_d.done; _d = _c.next()) {
                        var tokenInfo = _d.value;
                        if (tokenInfo.chainId === chainId && tokenFilter(tokenInfo)) {
                            var wrapped = new WrappedTokenInfo(tokenInfo, list);
                            if (!(wrapped.address in activeTokens) && !addressSet[wrapped.address]) {
                                addressSet[wrapped.address] = true;
                                result.push(wrapped);
                                if (result.length >= minResults)
                                    return result;
                            }
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (inactiveUrls_1_1 && !inactiveUrls_1_1.done && (_a = inactiveUrls_1.return)) _a.call(inactiveUrls_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return result;
    }, [activeTokens, chainId, inactiveUrls, lists, minResults, search]);
}
function useIsTokenActive(token) {
    var activeTokens = useAllTokens();
    if (!activeTokens || !token) {
        return false;
    }
    return !!activeTokens[token.address];
}
// Check if currency is included in custom list from user storage
function useIsUserAddedToken(currency) {
    var userAddedTokens = useUserAddedTokens();
    if (!currency) {
        return false;
    }
    return !!userAddedTokens.find(function (token) { return currency.equals(token); });
}
// undefined if invalid or does not exist
// null if loading or null was passed
// otherwise returns the token
function useToken(tokenAddress) {
    var tokens = useAllTokens();
    return useTokenFromMap(tokens, tokenAddress);
}
function useCurrency(currencyId) {
    var tokens = useAllTokens();
    return useCurrencyFromMap(tokens, currencyId);
}

var updateMatchesDarkMode = toolkit.createAction('user/updateMatchesDarkMode');
var updateUserDarkMode = toolkit.createAction('user/updateUserDarkMode');
var updateUserExpertMode = toolkit.createAction('user/updateUserExpertMode');
var updateUserLocale = toolkit.createAction('user/updateUserLocale');
var updateShowSurveyPopup = toolkit.createAction('user/updateShowSurveyPopup');
var updateUserClientSideRouter = toolkit.createAction('user/updateUserClientSideRouter');
var updateHideClosedPositions = toolkit.createAction('user/hideClosedPositions');
var updateUserSlippageTolerance = toolkit.createAction('user/updateUserSlippageTolerance');
var updateUserDeadline = toolkit.createAction('user/updateUserDeadline');
var addSerializedToken = toolkit.createAction('user/addSerializedToken');
var removeSerializedToken = toolkit.createAction('user/removeSerializedToken');
var addSerializedPair = toolkit.createAction('user/addSerializedPair');
var removeSerializedPair = toolkit.createAction('user/removeSerializedPair');

function serializeToken(token) {
    return {
        chainId: token.chainId,
        address: token.address,
        decimals: token.decimals,
        symbol: token.symbol,
        name: token.name,
    };
}
function deserializeToken(serializedToken) {
    return new sdkCore.Token(serializedToken.chainId, serializedToken.address, serializedToken.decimals, serializedToken.symbol, serializedToken.name);
}
function useIsDarkMode() {
    var _a = useAppSelector(function (_a) {
        var _b = _a.user, matchesDarkMode = _b.matchesDarkMode, userDarkMode = _b.userDarkMode;
        return ({
            userDarkMode: userDarkMode,
            matchesDarkMode: matchesDarkMode,
        });
    }, reactRedux.shallowEqual), userDarkMode = _a.userDarkMode, matchesDarkMode = _a.matchesDarkMode;
    return userDarkMode === null ? matchesDarkMode : userDarkMode;
}
function useDarkModeManager() {
    var dispatch = useAppDispatch();
    var darkMode = useIsDarkMode();
    var toggleSetDarkMode = React.useCallback(function () {
        dispatch(updateUserDarkMode({ userDarkMode: !darkMode }));
    }, [darkMode, dispatch]);
    return [darkMode, toggleSetDarkMode];
}
function useUserLocale() {
    return useAppSelector(function (state) { return state.user.userLocale; });
}
function useIsExpertMode() {
    return useAppSelector(function (state) { return state.user.userExpertMode; });
}
function useExpertModeManager() {
    var dispatch = useAppDispatch();
    var expertMode = useIsExpertMode();
    var toggleSetExpertMode = React.useCallback(function () {
        dispatch(updateUserExpertMode({ userExpertMode: !expertMode }));
    }, [expertMode, dispatch]);
    return [expertMode, toggleSetExpertMode];
}
function useClientSideRouter() {
    var dispatch = useAppDispatch();
    var clientSideRouter = useAppSelector(function (state) { return Boolean(state.user.userClientSideRouter); });
    var setClientSideRouter = React.useCallback(function (newClientSideRouter) {
        dispatch(updateUserClientSideRouter({ userClientSideRouter: newClientSideRouter }));
    }, [dispatch]);
    return [clientSideRouter, setClientSideRouter];
}
function useSetUserSlippageTolerance() {
    var dispatch = useAppDispatch();
    return React.useCallback(function (userSlippageTolerance) {
        var value;
        try {
            value =
                userSlippageTolerance === 'auto' ? 'auto' : JSBI__default["default"].toNumber(userSlippageTolerance.multiply(10000).quotient);
        }
        catch (error) {
            value = 'auto';
        }
        dispatch(updateUserSlippageTolerance({
            userSlippageTolerance: value,
        }));
    }, [dispatch]);
}
/**
 * Return the user's slippage tolerance, from the redux store, and a function to update the slippage tolerance
 */
function useUserSlippageTolerance() {
    var userSlippageTolerance = useAppSelector(function (state) {
        return state.user.userSlippageTolerance;
    });
    return React.useMemo(function () { return (userSlippageTolerance === 'auto' ? 'auto' : new sdkCore.Percent(userSlippageTolerance, 10000)); }, [userSlippageTolerance]);
}
/**
 * Same as above but replaces the auto with a default value
 * @param defaultSlippageTolerance the default value to replace auto with
 */
function useUserSlippageToleranceWithDefault(defaultSlippageTolerance) {
    var allowedSlippage = useUserSlippageTolerance();
    return React.useMemo(function () { return (allowedSlippage === 'auto' ? defaultSlippageTolerance : allowedSlippage); }, [allowedSlippage, defaultSlippageTolerance]);
}
function useUserTransactionTTL() {
    var chainId = useActiveWeb3React().chainId;
    var dispatch = useAppDispatch();
    var userDeadline = useAppSelector(function (state) { return state.user.userDeadline; });
    var onL2 = Boolean(chainId && L2_CHAIN_IDS.includes(chainId));
    var deadline = onL2 ? L2_DEADLINE_FROM_NOW : userDeadline;
    var setUserDeadline = React.useCallback(function (userDeadline) {
        dispatch(updateUserDeadline({ userDeadline: userDeadline }));
    }, [dispatch]);
    return [deadline, setUserDeadline];
}
function useAddUserToken() {
    var dispatch = useAppDispatch();
    return React.useCallback(function (token) {
        dispatch(addSerializedToken({ serializedToken: serializeToken(token) }));
    }, [dispatch]);
}
function useRemoveUserAddedToken() {
    var dispatch = useAppDispatch();
    return React.useCallback(function (chainId, address) {
        dispatch(removeSerializedToken({ chainId: chainId, address: address }));
    }, [dispatch]);
}
function useUserAddedTokens() {
    var chainId = useActiveWeb3React().chainId;
    var serializedTokensMap = useAppSelector(function (_a) {
        var tokens = _a.user.tokens;
        return tokens;
    });
    return React.useMemo(function () {
        if (!chainId)
            return [];
        var tokenMap = (serializedTokensMap === null || serializedTokensMap === void 0 ? void 0 : serializedTokensMap[chainId])
            ? Object.values(serializedTokensMap[chainId]).map(deserializeToken)
            : [];
        return tokenMap;
    }, [serializedTokensMap, chainId]);
}

var EXPLORER_HOSTNAMES = {
    'etherscan.io': true,
    'ropsten.etherscan.io': true,
    'rinkeby.etherscan.io': true,
    'kovan.etherscan.io': true,
    'goerli.etherscan.io': true,
    'optimistic.etherscan.io': true,
    'kovan-optimistic.etherscan.io': true,
    'rinkeby-explorer.arbitrum.io': true,
    'arbiscan.io': true,
};
/**
 * Returns the anonymized version of the given href, i.e. one that does not leak user information
 * @param href the link to anonymize, i.e. remove any personal data from
 * @return string anonymized version of the given href
 */
function anonymizeLink(href) {
    try {
        var url = new URL(href);
        if (EXPLORER_HOSTNAMES[url.hostname]) {
            var pathPieces = url.pathname.split('/');
            var anonymizedPath = pathPieces.map(function (pc) { return (/0x[a-fA-F0-9]+/.test(pc) ? '***' : pc); }).join('/');
            return url.protocol + "//" + url.hostname + anonymizedPath;
        }
        return href;
    }
    catch (error) {
        return href;
    }
}

var ButtonText = styled__default["default"].button(templateObject_1$W || (templateObject_1$W = __makeTemplateObject(["\n  outline: none;\n  border: none;\n  font-size: inherit;\n  padding: 0;\n  margin: 0;\n  background: none;\n  cursor: pointer;\n\n  :hover {\n    opacity: 0.7;\n  }\n\n  :focus {\n    text-decoration: underline;\n  }\n"], ["\n  outline: none;\n  border: none;\n  font-size: inherit;\n  padding: 0;\n  margin: 0;\n  background: none;\n  cursor: pointer;\n\n  :hover {\n    opacity: 0.7;\n  }\n\n  :focus {\n    text-decoration: underline;\n  }\n"])));
var CloseIcon = styled__default["default"](reactFeather.X)(templateObject_2$D || (templateObject_2$D = __makeTemplateObject(["\n  cursor: pointer;\n"], ["\n  cursor: pointer;\n"
    // for wrapper react feather icons
])));
// for wrapper react feather icons
var IconWrapper = styled__default["default"].div(templateObject_3$w || (templateObject_3$w = __makeTemplateObject(["\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: ", ";\n  height: ", ";\n  margin-right: ", ";\n  margin-left: ", ";\n  & > * {\n    stroke: ", ";\n  }\n"], ["\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: ", ";\n  height: ", ";\n  margin-right: ", ";\n  margin-left: ", ";\n  & > * {\n    stroke: ", ";\n  }\n"
    // A button that triggers some onClick result, but looks like a link.
])), function (_a) {
    var size = _a.size;
    return size !== null && size !== void 0 ? size : '20px';
}, function (_a) {
    var size = _a.size;
    return size !== null && size !== void 0 ? size : '20px';
}, function (_a) {
    var marginRight = _a.marginRight;
    return marginRight !== null && marginRight !== void 0 ? marginRight : 0;
}, function (_a) {
    var marginLeft = _a.marginLeft;
    return marginLeft !== null && marginLeft !== void 0 ? marginLeft : 0;
}, function (_a) {
    var theme = _a.theme, stroke = _a.stroke;
    return stroke !== null && stroke !== void 0 ? stroke : theme.blue1;
});
// A button that triggers some onClick result, but looks like a link.
var LinkStyledButton = styled__default["default"].button(templateObject_4$m || (templateObject_4$m = __makeTemplateObject(["\n  border: none;\n  text-decoration: none;\n  background: none;\n\n  cursor: ", ";\n  color: ", ";\n  font-weight: 500;\n\n  :hover {\n    text-decoration: ", ";\n  }\n\n  :focus {\n    outline: none;\n    text-decoration: ", ";\n  }\n\n  :active {\n    text-decoration: none;\n  }\n"], ["\n  border: none;\n  text-decoration: none;\n  background: none;\n\n  cursor: ", ";\n  color: ", ";\n  font-weight: 500;\n\n  :hover {\n    text-decoration: ", ";\n  }\n\n  :focus {\n    outline: none;\n    text-decoration: ", ";\n  }\n\n  :active {\n    text-decoration: none;\n  }\n"
    // An internal link from the react-router-dom library that is correctly styled
])), function (_a) {
    var disabled = _a.disabled;
    return (disabled ? 'default' : 'pointer');
}, function (_a) {
    var theme = _a.theme, disabled = _a.disabled;
    return (disabled ? theme.text2 : theme.primary1);
}, function (_a) {
    var disabled = _a.disabled;
    return (disabled ? null : 'underline');
}, function (_a) {
    var disabled = _a.disabled;
    return (disabled ? null : 'underline');
});
// An internal link from the react-router-dom library that is correctly styled
var StyledInternalLink = styled__default["default"](reactRouterDom.Link)(templateObject_5$j || (templateObject_5$j = __makeTemplateObject(["\n  text-decoration: none;\n  cursor: pointer;\n  color: ", ";\n  font-weight: 500;\n\n  :hover {\n    text-decoration: underline;\n  }\n\n  :focus {\n    outline: none;\n    text-decoration: underline;\n  }\n\n  :active {\n    text-decoration: none;\n  }\n"], ["\n  text-decoration: none;\n  cursor: pointer;\n  color: ", ";\n  font-weight: 500;\n\n  :hover {\n    text-decoration: underline;\n  }\n\n  :focus {\n    outline: none;\n    text-decoration: underline;\n  }\n\n  :active {\n    text-decoration: none;\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.primary1;
});
var StyledLink = styled__default["default"].a(templateObject_6$d || (templateObject_6$d = __makeTemplateObject(["\n  text-decoration: none;\n  cursor: pointer;\n  color: ", ";\n  font-weight: 500;\n\n  :hover {\n    text-decoration: underline;\n  }\n\n  :focus {\n    outline: none;\n    text-decoration: underline;\n  }\n\n  :active {\n    text-decoration: none;\n  }\n"], ["\n  text-decoration: none;\n  cursor: pointer;\n  color: ", ";\n  font-weight: 500;\n\n  :hover {\n    text-decoration: underline;\n  }\n\n  :focus {\n    outline: none;\n    text-decoration: underline;\n  }\n\n  :active {\n    text-decoration: none;\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.primary1;
});
var LinkIconWrapper = styled__default["default"].a(templateObject_7$c || (templateObject_7$c = __makeTemplateObject(["\n  text-decoration: none;\n  cursor: pointer;\n  align-items: center;\n  justify-content: center;\n  display: flex;\n\n  :hover {\n    text-decoration: none;\n    opacity: 0.7;\n  }\n\n  :focus {\n    outline: none;\n    text-decoration: none;\n  }\n\n  :active {\n    text-decoration: none;\n  }\n"], ["\n  text-decoration: none;\n  cursor: pointer;\n  align-items: center;\n  justify-content: center;\n  display: flex;\n\n  :hover {\n    text-decoration: none;\n    opacity: 0.7;\n  }\n\n  :focus {\n    outline: none;\n    text-decoration: none;\n  }\n\n  :active {\n    text-decoration: none;\n  }\n"])));
var LinkIcon = styled__default["default"](reactFeather.ExternalLink)(templateObject_8$9 || (templateObject_8$9 = __makeTemplateObject(["\n  height: 16px;\n  width: 18px;\n  margin-left: 10px;\n  stroke: ", ";\n"], ["\n  height: 16px;\n  width: 18px;\n  margin-left: 10px;\n  stroke: ", ";\n"])), function (_a) {
    var theme = _a.theme;
    return theme.blue1;
});
var TrashIcon = styled__default["default"](reactFeather.Trash)(templateObject_9$8 || (templateObject_9$8 = __makeTemplateObject(["\n  height: 16px;\n  width: 18px;\n  margin-left: 10px;\n  stroke: ", ";\n\n  cursor: pointer;\n  align-items: center;\n  justify-content: center;\n  display: flex;\n\n  :hover {\n    opacity: 0.7;\n  }\n"], ["\n  height: 16px;\n  width: 18px;\n  margin-left: 10px;\n  stroke: ", ";\n\n  cursor: pointer;\n  align-items: center;\n  justify-content: center;\n  display: flex;\n\n  :hover {\n    opacity: 0.7;\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.text3;
});
var rotateImg = styled.keyframes(templateObject_10$6 || (templateObject_10$6 = __makeTemplateObject(["\n  0% {\n    transform: perspective(1000px) rotateY(0deg);\n  }\n\n  100% {\n    transform: perspective(1000px) rotateY(360deg);\n  }\n"], ["\n  0% {\n    transform: perspective(1000px) rotateY(0deg);\n  }\n\n  100% {\n    transform: perspective(1000px) rotateY(360deg);\n  }\n"])));
styled__default["default"].img(templateObject_11$5 || (templateObject_11$5 = __makeTemplateObject(["\n  animation: ", " 5s cubic-bezier(0.83, 0, 0.17, 1) infinite;\n  padding: 2rem 0 0 0;\n  filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.15));\n"], ["\n  animation: ", " 5s cubic-bezier(0.83, 0, 0.17, 1) infinite;\n  padding: 2rem 0 0 0;\n  filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.15));\n"])), rotateImg);
function handleClickExternalLink(event) {
    var _a = event.currentTarget, target = _a.target, href = _a.href;
    var anonymizedHref = anonymizeLink(href);
    // don't prevent default, don't redirect if it's a new tab
    if (target === '_blank' || event.ctrlKey || event.metaKey) {
        ReactGA__default["default"].outboundLink({ label: anonymizedHref }, function () {
            console.debug('Fired outbound link event', anonymizedHref);
        });
    }
    else {
        event.preventDefault();
        // send a ReactGA event and then trigger a location change
        ReactGA__default["default"].outboundLink({ label: anonymizedHref }, function () {
            window.location.href = anonymizedHref;
        });
    }
}
/**
 * Outbound link that handles firing google analytics events
 */
function ExternalLink(_a) {
    var _b = _a.target, target = _b === void 0 ? '_blank' : _b, href = _a.href, _c = _a.rel, rel = _c === void 0 ? 'noopener noreferrer' : _c, rest = __rest(_a, ["target", "href", "rel"]);
    return jsxRuntime.jsx(StyledLink, __assign({ target: target, rel: rel, href: href, onClick: handleClickExternalLink }, rest), void 0);
}
function ExternalLinkIcon(_a) {
    var _b = _a.target, target = _b === void 0 ? '_blank' : _b, href = _a.href, _c = _a.rel, rel = _c === void 0 ? 'noopener noreferrer' : _c, rest = __rest(_a, ["target", "href", "rel"]);
    return (jsxRuntime.jsx(LinkIconWrapper, __assign({ target: target, rel: rel, href: href, onClick: handleClickExternalLink }, rest, { children: jsxRuntime.jsx(LinkIcon, {}, void 0) }), void 0));
}
var rotate$1 = styled.keyframes(templateObject_12$5 || (templateObject_12$5 = __makeTemplateObject(["\n  from {\n    transform: rotate(0deg);\n  }\n  to {\n    transform: rotate(360deg);\n  }\n"], ["\n  from {\n    transform: rotate(0deg);\n  }\n  to {\n    transform: rotate(360deg);\n  }\n"])));
var Spinner$1 = styled__default["default"].img(templateObject_13$2 || (templateObject_13$2 = __makeTemplateObject(["\n  animation: 2s ", " linear infinite;\n  width: 16px;\n  height: 16px;\n"], ["\n  animation: 2s ", " linear infinite;\n  width: 16px;\n  height: 16px;\n"])), rotate$1);
styled__default["default"](StyledInternalLink)(templateObject_14$2 || (templateObject_14$2 = __makeTemplateObject(["\n  color: ", ";\n"], ["\n  color: ", ";\n"])), function (_a) {
    var theme = _a.theme;
    return theme.text1;
});
var CustomLightSpinner = styled__default["default"](Spinner$1)(templateObject_15$1 || (templateObject_15$1 = __makeTemplateObject(["\n  height: ", ";\n  width: ", ";\n"], ["\n  height: ", ";\n  width: ", ";\n"])), function (_a) {
    var size = _a.size;
    return size;
}, function (_a) {
    var size = _a.size;
    return size;
});
var HideSmall = styled__default["default"].span(templateObject_17 || (templateObject_17 = __makeTemplateObject(["\n  ", ";\n"], ["\n  ", ";\n"])), function (_a) {
    var theme = _a.theme;
    return theme.mediaWidth.upToSmall(templateObject_16 || (templateObject_16 = __makeTemplateObject(["\n    display: none;\n  "], ["\n    display: none;\n  "])));
});
styled__default["default"].span(templateObject_19 || (templateObject_19 = __makeTemplateObject(["\n  ", ";\n"], ["\n  ", ";\n"])), function (_a) {
    var theme = _a.theme;
    return theme.mediaWidth.upToExtraSmall(templateObject_18 || (templateObject_18 = __makeTemplateObject(["\n    display: none;\n  "], ["\n    display: none;\n  "])));
});
styled__default["default"].span(templateObject_21 || (templateObject_21 = __makeTemplateObject(["\n  display: none;\n  ", ";\n"], ["\n  display: none;\n  ", ";\n"])), function (_a) {
    var theme = _a.theme;
    return theme.mediaWidth.upToSmall(templateObject_20 || (templateObject_20 = __makeTemplateObject(["\n    display: block;\n  "], ["\n    display: block;\n  "])));
});
var Separator$1 = styled__default["default"].div(templateObject_22 || (templateObject_22 = __makeTemplateObject(["\n  width: 100%;\n  height: 1px;\n  background-color: ", ";\n"], ["\n  width: 100%;\n  height: 1px;\n  background-color: ", ";\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg2;
});
var templateObject_1$W, templateObject_2$D, templateObject_3$w, templateObject_4$m, templateObject_5$j, templateObject_6$d, templateObject_7$c, templateObject_8$9, templateObject_9$8, templateObject_10$6, templateObject_11$5, templateObject_12$5, templateObject_13$2, templateObject_14$2, templateObject_15$1, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22;

var MEDIA_WIDTHS = {
    upToExtraSmall: 500,
    upToSmall: 720,
    upToMedium: 960,
    upToLarge: 1280,
};
// Migrating to a standard z-index system https://getbootstrap.com/docs/5.0/layout/z-index/
// Please avoid using deprecated numbers
var Z_INDEX;
(function (Z_INDEX) {
    Z_INDEX[Z_INDEX["deprecated_zero"] = 0] = "deprecated_zero";
    Z_INDEX[Z_INDEX["deprecated_content"] = 1] = "deprecated_content";
    Z_INDEX[Z_INDEX["dropdown"] = 1000] = "dropdown";
    Z_INDEX[Z_INDEX["sticky"] = 1020] = "sticky";
    Z_INDEX[Z_INDEX["fixed"] = 1030] = "fixed";
    Z_INDEX[Z_INDEX["modalBackdrop"] = 1040] = "modalBackdrop";
    Z_INDEX[Z_INDEX["offcanvas"] = 1050] = "offcanvas";
    Z_INDEX[Z_INDEX["modal"] = 1060] = "modal";
    Z_INDEX[Z_INDEX["popover"] = 1070] = "popover";
    Z_INDEX[Z_INDEX["tooltip"] = 1080] = "tooltip";
})(Z_INDEX || (Z_INDEX = {}));
Object.keys(MEDIA_WIDTHS).reduce(function (accumulator, size) {
    accumulator[size] = function (a, b, c) { return styled.css(templateObject_1$V || (templateObject_1$V = __makeTemplateObject(["\n      @media (max-width: ", "px) {\n        ", "\n      }\n    "], ["\n      @media (max-width: ", "px) {\n        ", "\n      }\n    "])), MEDIA_WIDTHS[size], styled.css(a, b, c)); };
    return accumulator;
}, {});
var TextWrapper$1 = styled__default["default"](rebass.Text)(templateObject_4$l || (templateObject_4$l = __makeTemplateObject(["\n  color: ", ";\n"], ["\n  color: ", ";\n"
    /**
     * Preset styles of the Rebass Text component
     */
])), function (_a) {
    var color = _a.color, theme = _a.theme;
    return theme[color];
});
/**
 * Preset styles of the Rebass Text component
 */
var ThemedText = {
    Main: function (props) {
        return jsxRuntime.jsx(TextWrapper$1, __assign({ fontWeight: 500, color: 'text2' }, props), void 0);
    },
    Link: function (props) {
        return jsxRuntime.jsx(TextWrapper$1, __assign({ fontWeight: 500, color: 'primary1' }, props), void 0);
    },
    Label: function (props) {
        return jsxRuntime.jsx(TextWrapper$1, __assign({ fontWeight: 600, color: 'text1' }, props), void 0);
    },
    Black: function (props) {
        return jsxRuntime.jsx(TextWrapper$1, __assign({ fontWeight: 500, color: 'text1' }, props), void 0);
    },
    White: function (props) {
        return jsxRuntime.jsx(TextWrapper$1, __assign({ fontWeight: 500, color: 'white' }, props), void 0);
    },
    Body: function (props) {
        return jsxRuntime.jsx(TextWrapper$1, __assign({ fontWeight: 400, fontSize: 16, color: 'text1' }, props), void 0);
    },
    LargeHeader: function (props) {
        return jsxRuntime.jsx(TextWrapper$1, __assign({ fontWeight: 600, fontSize: 24 }, props), void 0);
    },
    MediumHeader: function (props) {
        return jsxRuntime.jsx(TextWrapper$1, __assign({ fontWeight: 500, fontSize: 20 }, props), void 0);
    },
    SubHeader: function (props) {
        return jsxRuntime.jsx(TextWrapper$1, __assign({ fontWeight: 400, fontSize: 14 }, props), void 0);
    },
    Small: function (props) {
        return jsxRuntime.jsx(TextWrapper$1, __assign({ fontWeight: 500, fontSize: 11 }, props), void 0);
    },
    Blue: function (props) {
        return jsxRuntime.jsx(TextWrapper$1, __assign({ fontWeight: 500, color: 'blue1' }, props), void 0);
    },
    Yellow: function (props) {
        return jsxRuntime.jsx(TextWrapper$1, __assign({ fontWeight: 500, color: 'yellow3' }, props), void 0);
    },
    DarkGray: function (props) {
        return jsxRuntime.jsx(TextWrapper$1, __assign({ fontWeight: 500, color: 'text3' }, props), void 0);
    },
    Gray: function (props) {
        return jsxRuntime.jsx(TextWrapper$1, __assign({ fontWeight: 500, color: 'bg3' }, props), void 0);
    },
    Italic: function (props) {
        return jsxRuntime.jsx(TextWrapper$1, __assign({ fontWeight: 500, fontSize: 12, fontStyle: 'italic', color: 'text2' }, props), void 0);
    },
    Error: function (_a) {
        var error = _a.error, props = __rest(_a, ["error"]);
        return jsxRuntime.jsx(TextWrapper$1, __assign({ fontWeight: 500, color: error ? 'red1' : 'text2' }, props), void 0);
    },
};
styled.createGlobalStyle(templateObject_5$i || (templateObject_5$i = __makeTemplateObject(["\nhtml {\n  color: ", ";\n  background-color: ", " !important;\n}\n\na {\n color: ", "; \n}\n"], ["\nhtml {\n  color: ", ";\n  background-color: ", " !important;\n}\n\na {\n color: ", "; \n}\n"])), function (_a) {
    var theme = _a.theme;
    return theme.text1;
}, function (_a) {
    var theme = _a.theme;
    return theme.bg1;
}, function (_a) {
    var theme = _a.theme;
    return theme.blue1;
});
var templateObject_1$V, templateObject_4$l, templateObject_5$i;

var Row = styled__default["default"](styledComponents.Box)(templateObject_1$U || (templateObject_1$U = __makeTemplateObject(["\n  width: ", ";\n  display: flex;\n  padding: 0;\n  align-items: ", ";\n  justify-content: ", ";\n  padding: ", ";\n  border: ", ";\n  border-radius: ", ";\n"], ["\n  width: ", ";\n  display: flex;\n  padding: 0;\n  align-items: ", ";\n  justify-content: ", ";\n  padding: ", ";\n  border: ", ";\n  border-radius: ", ";\n"])), function (_a) {
    var width = _a.width;
    return width !== null && width !== void 0 ? width : '100%';
}, function (_a) {
    var align = _a.align;
    return align !== null && align !== void 0 ? align : 'center';
}, function (_a) {
    var justify = _a.justify;
    return justify !== null && justify !== void 0 ? justify : 'flex-start';
}, function (_a) {
    var padding = _a.padding;
    return padding;
}, function (_a) {
    var border = _a.border;
    return border;
}, function (_a) {
    var borderRadius = _a.borderRadius;
    return borderRadius;
});
var RowBetween = styled__default["default"](Row)(templateObject_2$C || (templateObject_2$C = __makeTemplateObject(["\n  justify-content: space-between;\n"], ["\n  justify-content: space-between;\n"])));
styled__default["default"].div(templateObject_3$v || (templateObject_3$v = __makeTemplateObject(["\n  display: flex;\n  align-items: flex-end;\n"], ["\n  display: flex;\n  align-items: flex-end;\n"])));
var AutoRow = styled__default["default"](Row)(templateObject_4$k || (templateObject_4$k = __makeTemplateObject(["\n  flex-wrap: wrap;\n  margin: ", ";\n  justify-content: ", ";\n\n  & > * {\n    margin: ", " !important;\n  }\n"], ["\n  flex-wrap: wrap;\n  margin: ", ";\n  justify-content: ", ";\n\n  & > * {\n    margin: ", " !important;\n  }\n"])), function (_a) {
    var gap = _a.gap;
    return gap && "-" + gap;
}, function (_a) {
    var justify = _a.justify;
    return justify && justify;
}, function (_a) {
    var gap = _a.gap;
    return gap;
});
var RowFixed = styled__default["default"](Row)(templateObject_5$h || (templateObject_5$h = __makeTemplateObject(["\n  width: fit-content;\n  margin: ", ";\n"], ["\n  width: fit-content;\n  margin: ", ";\n"])), function (_a) {
    var gap = _a.gap;
    return gap && "-" + gap;
});
var templateObject_1$U, templateObject_2$C, templateObject_3$v, templateObject_4$k, templateObject_5$h;

var _a$a, _b$2, _c$2, _d$1;
var L2Icon = styled__default["default"].img(templateObject_1$T || (templateObject_1$T = __makeTemplateObject(["\n  width: 24px;\n  height: 24px;\n  margin-right: 16px;\n"], ["\n  width: 24px;\n  height: 24px;\n  margin-right: 16px;\n"])));
styled__default["default"].div(templateObject_2$B || (templateObject_2$B = __makeTemplateObject(["\n  align-items: center;\n  display: flex;\n  justify-content: flex-start;\n  padding: 0 20px 20px 20px;\n"], ["\n  align-items: center;\n  display: flex;\n  justify-content: flex-start;\n  padding: 0 20px 20px 20px;\n"])));
var BodyText = styled__default["default"].div(templateObject_3$u || (templateObject_3$u = __makeTemplateObject(["\n  color: ", ";\n  display: flex;\n  align-items: center;\n  justify-content: flex-start;\n  margin: 8px;\n  font-size: 14px;\n"], ["\n  color: ", ";\n  display: flex;\n  align-items: center;\n  justify-content: flex-start;\n  margin: 8px;\n  font-size: 14px;\n"])), function (_a) {
    var color = _a.color;
    return color;
});
var RootWrapper = styled__default["default"].div(templateObject_4$j || (templateObject_4$j = __makeTemplateObject(["\n  position: relative;\n  margin-top: 16px;\n"], ["\n  position: relative;\n  margin-top: 16px;\n"])));
var SHOULD_SHOW_ALERT = (_a$a = {},
    _a$a[SupportedChainId.OPTIMISM] = true,
    _a$a[SupportedChainId.OPTIMISTIC_KOVAN] = true,
    _a$a[SupportedChainId.ARBITRUM_ONE] = true,
    _a$a[SupportedChainId.ARBITRUM_RINKEBY] = true,
    _a$a[SupportedChainId.POLYGON] = true,
    _a$a[SupportedChainId.POLYGON_MUMBAI] = true,
    _a$a);
var BG_COLORS_BY_DARK_MODE_AND_CHAIN_ID = {
    dark: (_b$2 = {},
        _b$2[SupportedChainId.POLYGON] = 'radial-gradient(100% 93.36% at 0% 6.64%, rgba(160, 108, 247, 0.1) 0%, rgba(82, 32, 166, 0.1) 100%)',
        _b$2[SupportedChainId.POLYGON_MUMBAI] = 'radial-gradient(100% 93.36% at 0% 6.64%, rgba(160, 108, 247, 0.1) 0%, rgba(82, 32, 166, 0.1) 100%)',
        _b$2[SupportedChainId.OPTIMISM] = 'radial-gradient(948% 292% at 42% 0%, rgba(255, 58, 212, 0.01) 0%, rgba(255, 255, 255, 0.04) 100%),radial-gradient(98% 96% at 2% 0%, rgba(255, 39, 39, 0.01) 0%, rgba(235, 0, 255, 0.01) 96%)',
        _b$2[SupportedChainId.OPTIMISTIC_KOVAN] = 'radial-gradient(948% 292% at 42% 0%, rgba(255, 58, 212, 0.04) 0%, rgba(255, 255, 255, 0.04) 100%),radial-gradient(98% 96% at 2% 0%, rgba(255, 39, 39, 0.04) 0%, rgba(235, 0, 255, 0.01 96%)',
        _b$2[SupportedChainId.ARBITRUM_ONE] = 'radial-gradient(285% 8200% at 30% 50%, rgba(40, 160, 240, 0.01) 0%, rgba(219, 255, 0, 0) 100%),radial-gradient(75% 75% at 0% 0%, rgba(150, 190, 220, 0.05) 0%, rgba(33, 114, 229, 0.05) 100%), hsla(0, 0%, 100%, 0.05)',
        _b$2[SupportedChainId.ARBITRUM_RINKEBY] = 'radial-gradient(285% 8200% at 30% 50%, rgba(40, 160, 240, 0.05) 0%, rgba(219, 255, 0, 0) 100%),radial-gradient(75% 75% at 0% 0%, rgba(150, 190, 220, 0.05) 0%, rgba(33, 114, 229, 0.1) 100%), hsla(0, 0%, 100%, 0.05)',
        _b$2),
    light: (_c$2 = {},
        _c$2[SupportedChainId.POLYGON] = 'radial-gradient(182.71% 205.59% at 2.81% 7.69%, rgba(130, 71, 229, 0.2) 0%, rgba(167, 202, 255, 0.2) 100%)',
        _c$2[SupportedChainId.POLYGON_MUMBAI] = 'radial-gradient(182.71% 205.59% at 2.81% 7.69%, rgba(130, 71, 229, 0.2) 0%, rgba(167, 202, 255, 0.2) 100%)',
        _c$2[SupportedChainId.OPTIMISM] = 'radial-gradient(92% 105% at 50% 7%, rgba(255, 58, 212, 0.04) 0%, rgba(255, 255, 255, 0.03) 100%),radial-gradient(100% 97% at 0% 12%, rgba(235, 0, 255, 0.1) 0%, rgba(243, 19, 19, 0.1) 100%), hsla(0, 0%, 100%, 0.1)',
        _c$2[SupportedChainId.OPTIMISTIC_KOVAN] = 'radial-gradient(92% 105% at 50% 7%, rgba(255, 58, 212, 0.04) 0%, rgba(255, 255, 255, 0.03) 100%),radial-gradient(100% 97% at 0% 12%, rgba(235, 0, 255, 0.1) 0%, rgba(243, 19, 19, 0.1) 100%), hsla(0, 0%, 100%, 0.1)',
        _c$2[SupportedChainId.ARBITRUM_ONE] = 'radial-gradient(285% 8200% at 30% 50%, rgba(40, 160, 240, 0.1) 0%, rgba(219, 255, 0, 0) 100%),radial-gradient(circle at top left, hsla(206, 50%, 75%, 0.01), hsla(215, 79%, 51%, 0.12)), hsla(0, 0%, 100%, 0.1)',
        _c$2[SupportedChainId.ARBITRUM_RINKEBY] = 'radial-gradient(285% 8200% at 30% 50%, rgba(40, 160, 240, 0.1) 0%, rgba(219, 255, 0, 0) 100%),radial-gradient(circle at top left, hsla(206, 50%, 75%, 0.01), hsla(215, 79%, 51%, 0.12)), hsla(0, 0%, 100%, 0.1)',
        _c$2),
};
var ContentWrapper$1 = styled__default["default"].div(templateObject_5$g || (templateObject_5$g = __makeTemplateObject(["\n  background: ", ";\n  border-radius: 20px;\n  display: flex;\n  flex-direction: row;\n  overflow: hidden;\n  position: relative;\n  width: 100%;\n\n  :before {\n    background-image: url(", ");\n    background-repeat: no-repeat;\n    background-size: 300px;\n    content: '';\n    height: 300px;\n    opacity: 0.1;\n    position: absolute;\n    transform: rotate(25deg) translate(-90px, -40px);\n    width: 300px;\n    z-index: -1;\n  }\n"], ["\n  background: ", ";\n  border-radius: 20px;\n  display: flex;\n  flex-direction: row;\n  overflow: hidden;\n  position: relative;\n  width: 100%;\n\n  :before {\n    background-image: url(", ");\n    background-repeat: no-repeat;\n    background-size: 300px;\n    content: '';\n    height: 300px;\n    opacity: 0.1;\n    position: absolute;\n    transform: rotate(25deg) translate(-90px, -40px);\n    width: 300px;\n    z-index: -1;\n  }\n"])), function (_a) {
    var chainId = _a.chainId, darkMode = _a.darkMode;
    return BG_COLORS_BY_DARK_MODE_AND_CHAIN_ID[darkMode ? 'dark' : 'light'][chainId];
}, function (_a) {
    var logoUrl = _a.logoUrl;
    return logoUrl;
});
var Header$1 = styled__default["default"].h2(templateObject_6$c || (templateObject_6$c = __makeTemplateObject(["\n  font-weight: 600;\n  font-size: 16px;\n  margin: 0;\n"], ["\n  font-weight: 600;\n  font-size: 16px;\n  margin: 0;\n"])));
var LinkOutToBridge = styled__default["default"](ExternalLink)(templateObject_7$b || (templateObject_7$b = __makeTemplateObject(["\n  align-items: center;\n  border-radius: 8px;\n  color: white;\n  display: flex;\n  font-size: 16px;\n  justify-content: space-between;\n  padding: 6px 8px;\n  margin-right: 12px;\n  text-decoration: none !important;\n  width: 100%;\n"], ["\n  align-items: center;\n  border-radius: 8px;\n  color: white;\n  display: flex;\n  font-size: 16px;\n  justify-content: space-between;\n  padding: 6px 8px;\n  margin-right: 12px;\n  text-decoration: none !important;\n  width: 100%;\n"])));
var StyledArrowUpRight = styled__default["default"](reactFeather.ArrowUpRight)(templateObject_8$8 || (templateObject_8$8 = __makeTemplateObject(["\n  margin-left: 12px;\n  width: 24px;\n  height: 24px;\n"], ["\n  margin-left: 12px;\n  width: 24px;\n  height: 24px;\n"])));
var TEXT_COLORS = (_d$1 = {},
    _d$1[SupportedChainId.POLYGON] = 'rgba(130, 71, 229)',
    _d$1[SupportedChainId.POLYGON_MUMBAI] = 'rgba(130, 71, 229)',
    _d$1[SupportedChainId.OPTIMISM] = '#ff3856',
    _d$1[SupportedChainId.OPTIMISTIC_KOVAN] = '#ff3856',
    _d$1[SupportedChainId.ARBITRUM_ONE] = '#0490ed',
    _d$1[SupportedChainId.ARBITRUM_RINKEBY] = '#0490ed',
    _d$1);
function shouldShowAlert(chainId) {
    return Boolean(chainId && SHOULD_SHOW_ALERT[chainId]);
}
function NetworkAlert() {
    var chainId = useActiveWeb3React().chainId;
    var _a = __read(useDarkModeManager(), 1), darkMode = _a[0];
    if (!shouldShowAlert(chainId)) {
        return null;
    }
    var _b = CHAIN_INFO[chainId], label = _b.label, logoUrl = _b.logoUrl, bridge = _b.bridge;
    var textColor = TEXT_COLORS[chainId];
    return bridge ? (jsxRuntime.jsx(RootWrapper, { children: jsxRuntime.jsx(ContentWrapper$1, __assign({ chainId: chainId, darkMode: darkMode, logoUrl: logoUrl }, { children: jsxRuntime.jsxs(LinkOutToBridge, __assign({ href: bridge }, { children: [jsxRuntime.jsxs(BodyText, __assign({ color: textColor }, { children: [jsxRuntime.jsx(L2Icon, { src: logoUrl }, void 0), jsxRuntime.jsxs(AutoRow, { children: [jsxRuntime.jsx(Header$1, { children: jsxRuntime.jsxs(macro.Trans, { children: [label, " token bridge"] }, void 0) }, void 0), jsxRuntime.jsx(HideSmall, { children: jsxRuntime.jsxs(macro.Trans, { children: ["Deposit tokens to the ", label, " network."] }, void 0) }, void 0)] }, void 0)] }), void 0), jsxRuntime.jsx(StyledArrowUpRight, { color: textColor }, void 0)] }), void 0) }), void 0) }, void 0)) : null;
}
var templateObject_1$T, templateObject_2$B, templateObject_3$u, templateObject_4$j, templateObject_5$g, templateObject_6$c, templateObject_7$b, templateObject_8$8;

/**
 * @param open conditional to show content or hide
 * @returns Wrapper to smoothly hide and expand content
 */
function AnimatedDropdown(_a) {
    var open = _a.open, children = _a.children;
    var _b = useResizeObserver__default["default"](), ref = _b.ref, height = _b.height;
    var props = reactSpring.useSpring({
        height: open ? height !== null && height !== void 0 ? height : 0 : 0,
        config: {
            mass: 1.2,
            tension: 300,
            friction: 20,
            clamp: true,
            velocity: 0.01,
        },
    });
    return (jsxRuntime.jsx(reactSpring.animated.div, __assign({ style: __assign(__assign({}, props), { overflow: 'hidden', width: '100%', willChange: 'height' }) }, { children: jsxRuntime.jsx("div", __assign({ ref: ref }, { children: children }), void 0) }), void 0));
}

var Card = styled__default["default"](styledComponents.Box)(templateObject_1$S || (templateObject_1$S = __makeTemplateObject(["\n  width: ", ";\n  padding: ", ";\n  border-radius: ", ";\n  border: ", ";\n"], ["\n  width: ", ";\n  padding: ", ";\n  border-radius: ", ";\n  border: ", ";\n"])), function (_a) {
    var width = _a.width;
    return width !== null && width !== void 0 ? width : '100%';
}, function (_a) {
    var padding = _a.padding;
    return padding !== null && padding !== void 0 ? padding : '1rem';
}, function (_a) {
    var $borderRadius = _a.$borderRadius;
    return $borderRadius !== null && $borderRadius !== void 0 ? $borderRadius : '16px';
}, function (_a) {
    var border = _a.border;
    return border;
});
var LightCard = styled__default["default"](Card)(templateObject_2$A || (templateObject_2$A = __makeTemplateObject(["\n  border: 1px solid ", ";\n  background-color: ", ";\n"], ["\n  border: 1px solid ", ";\n  background-color: ", ";\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg2;
}, function (_a) {
    var theme = _a.theme;
    return theme.bg1;
});
var LightGreyCard = styled__default["default"](Card)(templateObject_3$t || (templateObject_3$t = __makeTemplateObject(["\n  background-color: ", ";\n"], ["\n  background-color: ", ";\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg2;
});
var GreyCard = styled__default["default"](Card)(templateObject_4$i || (templateObject_4$i = __makeTemplateObject(["\n  background-color: ", ";\n"], ["\n  background-color: ", ";\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg3;
});
styled__default["default"](Card)(templateObject_5$f || (templateObject_5$f = __makeTemplateObject(["\n  background-color: ", ";\n"], ["\n  background-color: ", ";\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg2;
});
styled__default["default"](Card)(templateObject_6$b || (templateObject_6$b = __makeTemplateObject(["\n  background-color: ", ";\n"], ["\n  background-color: ", ";\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg0;
});
var OutlineCard = styled__default["default"](Card)(templateObject_7$a || (templateObject_7$a = __makeTemplateObject(["\n  border: 1px solid ", ";\n"], ["\n  border: 1px solid ", ";\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg3;
});
styled__default["default"](Card)(templateObject_8$7 || (templateObject_8$7 = __makeTemplateObject(["\n  background-color: rgba(243, 132, 30, 0.05);\n  color: ", ";\n  font-weight: 500;\n"], ["\n  background-color: rgba(243, 132, 30, 0.05);\n  color: ", ";\n  font-weight: 500;\n"])), function (_a) {
    var theme = _a.theme;
    return theme.yellow3;
});
styled__default["default"](Card)(templateObject_9$7 || (templateObject_9$7 = __makeTemplateObject(["\n  background-color: ", ";\n  color: ", ";\n  border-radius: 12px;\n"], ["\n  background-color: ", ";\n  color: ", ";\n  border-radius: 12px;\n"])), function (_a) {
    var theme = _a.theme;
    return theme.primary5;
}, function (_a) {
    var theme = _a.theme;
    return theme.blue2;
});
var templateObject_1$S, templateObject_2$A, templateObject_3$t, templateObject_4$i, templateObject_5$f, templateObject_6$b, templateObject_7$a, templateObject_8$7, templateObject_9$7;

var Column = styled__default["default"].div(templateObject_1$R || (templateObject_1$R = __makeTemplateObject(["\n  display: flex;\n  flex-direction: column;\n  justify-content: flex-start;\n"], ["\n  display: flex;\n  flex-direction: column;\n  justify-content: flex-start;\n"])));
var ColumnCenter = styled__default["default"](Column)(templateObject_2$z || (templateObject_2$z = __makeTemplateObject(["\n  width: 100%;\n  align-items: center;\n"], ["\n  width: 100%;\n  align-items: center;\n"])));
var AutoColumn = styled__default["default"].div(templateObject_3$s || (templateObject_3$s = __makeTemplateObject(["\n  display: grid;\n  grid-auto-rows: auto;\n  grid-row-gap: ", ";\n  justify-items: ", ";\n"], ["\n  display: grid;\n  grid-auto-rows: auto;\n  grid-row-gap: ", ";\n  justify-items: ", ";\n"])), function (_a) {
    var gap = _a.gap;
    return (gap === 'sm' && '8px') || (gap === 'md' && '12px') || (gap === 'lg' && '24px') || gap;
}, function (_a) {
    var justify = _a.justify;
    return justify && justify;
});
var templateObject_1$R, templateObject_2$z, templateObject_3$s;

var loadingAnimation = styled.keyframes(templateObject_1$Q || (templateObject_1$Q = __makeTemplateObject(["\n  0% {\n    background-position: 100% 50%;\n  }\n  100% {\n    background-position: 0% 50%;\n  }\n"], ["\n  0% {\n    background-position: 100% 50%;\n  }\n  100% {\n    background-position: 0% 50%;\n  }\n"])));
var LoadingRows = styled__default["default"].div(templateObject_2$y || (templateObject_2$y = __makeTemplateObject(["\n  display: grid;\n\n  & > div {\n    animation: ", " 1.5s infinite;\n    animation-fill-mode: both;\n    background: linear-gradient(\n      to left,\n      ", " 25%,\n      ", " 50%,\n      ", " 75%\n    );\n    background-size: 400%;\n    border-radius: 12px;\n    height: 2.4em;\n    will-change: background-position;\n  }\n"], ["\n  display: grid;\n\n  & > div {\n    animation: ", " 1.5s infinite;\n    animation-fill-mode: both;\n    background: linear-gradient(\n      to left,\n      ", " 25%,\n      ", " 50%,\n      ", " 75%\n    );\n    background-size: 400%;\n    border-radius: 12px;\n    height: 2.4em;\n    will-change: background-position;\n  }\n"])), loadingAnimation, function (_a) {
    var theme = _a.theme;
    return theme.bg1;
}, function (_a) {
    var theme = _a.theme;
    return theme.bg2;
}, function (_a) {
    var theme = _a.theme;
    return theme.bg1;
});
var loadingOpacityMixin = styled.css(templateObject_3$r || (templateObject_3$r = __makeTemplateObject(["\n  filter: ", ";\n  opacity: ", ";\n  transition: opacity 0.2s ease-in-out;\n"], ["\n  filter: ", ";\n  opacity: ", ";\n  transition: opacity 0.2s ease-in-out;\n"])), function (_a) {
    var $loading = _a.$loading;
    return ($loading ? 'grayscale(1)' : 'none');
}, function (_a) {
    var $loading = _a.$loading;
    return ($loading ? '0.4' : '1');
});
var LoadingOpacityContainer = styled__default["default"].div(templateObject_4$h || (templateObject_4$h = __makeTemplateObject(["\n  ", "\n"], ["\n  ", "\n"])), loadingOpacityMixin);
var templateObject_1$Q, templateObject_2$y, templateObject_3$r, templateObject_4$h;

/**
 * Invokes callback repeatedly over an interval defined by the delay
 * @param callback
 * @param delay if null, the callback will not be invoked
 * @param leading if true, the callback will be invoked immediately (on the leading edge); otherwise, it will be invoked after delay
 */
function useInterval(callback, delay, leading) {
    if (leading === void 0) { leading = true; }
    var savedCallback = React.useRef();
    // Remember the latest callback.
    React.useEffect(function () {
        savedCallback.current = callback;
    }, [callback]);
    // Set up the interval.
    React.useEffect(function () {
        function tick() {
            var current = savedCallback.current;
            current && current();
        }
        if (delay !== null) {
            if (leading)
                tick();
            var id_1 = setInterval(tick, delay);
            return function () { return clearInterval(id_1); };
        }
        return;
    }, [delay, leading]);
}

var PopoverContainer$1 = styled__default["default"].div(templateObject_1$P || (templateObject_1$P = __makeTemplateObject(["\n  z-index: 9999;\n  visibility: ", ";\n  opacity: ", ";\n  transition: visibility 150ms linear, opacity 150ms linear;\n  color: ", ";\n"], ["\n  z-index: 9999;\n  visibility: ", ";\n  opacity: ", ";\n  transition: visibility 150ms linear, opacity 150ms linear;\n  color: ", ";\n"])), function (props) { return (props.show ? 'visible' : 'hidden'); }, function (props) { return (props.show ? 1 : 0); }, function (_a) {
    var theme = _a.theme;
    return theme.text2;
});
var ReferenceElement = styled__default["default"].div(templateObject_2$x || (templateObject_2$x = __makeTemplateObject(["\n  display: inline-block;\n"], ["\n  display: inline-block;\n"])));
var Arrow = styled__default["default"].div(templateObject_3$q || (templateObject_3$q = __makeTemplateObject(["\n  width: 8px;\n  height: 8px;\n  z-index: 9998;\n\n  ::before {\n    position: absolute;\n    width: 8px;\n    height: 8px;\n    z-index: 9998;\n\n    content: '';\n    border: 1px solid ", ";\n    transform: rotate(45deg);\n    background: ", ";\n  }\n\n  &.arrow-top {\n    bottom: -5px;\n    ::before {\n      border-top: none;\n      border-left: none;\n    }\n  }\n\n  &.arrow-bottom {\n    top: -5px;\n    ::before {\n      border-bottom: none;\n      border-right: none;\n    }\n  }\n\n  &.arrow-left {\n    right: -5px;\n\n    ::before {\n      border-bottom: none;\n      border-left: none;\n    }\n  }\n\n  &.arrow-right {\n    left: -5px;\n    ::before {\n      border-right: none;\n      border-top: none;\n    }\n  }\n"], ["\n  width: 8px;\n  height: 8px;\n  z-index: 9998;\n\n  ::before {\n    position: absolute;\n    width: 8px;\n    height: 8px;\n    z-index: 9998;\n\n    content: '';\n    border: 1px solid ", ";\n    transform: rotate(45deg);\n    background: ", ";\n  }\n\n  &.arrow-top {\n    bottom: -5px;\n    ::before {\n      border-top: none;\n      border-left: none;\n    }\n  }\n\n  &.arrow-bottom {\n    top: -5px;\n    ::before {\n      border-bottom: none;\n      border-right: none;\n    }\n  }\n\n  &.arrow-left {\n    right: -5px;\n\n    ::before {\n      border-bottom: none;\n      border-left: none;\n    }\n  }\n\n  &.arrow-right {\n    left: -5px;\n    ::before {\n      border-right: none;\n      border-top: none;\n    }\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg2;
}, function (_a) {
    var theme = _a.theme;
    return theme.bg0;
});
function Popover(_a) {
    var _b, _c;
    var content = _a.content, show = _a.show, children = _a.children, _d = _a.placement, placement = _d === void 0 ? 'auto' : _d;
    var _e = __read(React.useState(null), 2), referenceElement = _e[0], setReferenceElement = _e[1];
    var _f = __read(React.useState(null), 2), popperElement = _f[0], setPopperElement = _f[1];
    var _g = __read(React.useState(null), 2), arrowElement = _g[0], setArrowElement = _g[1];
    var options = React.useMemo(function () { return ({
        placement: placement,
        strategy: 'fixed',
        modifiers: [
            { name: 'offset', options: { offset: [8, 8] } },
            { name: 'arrow', options: { element: arrowElement } },
            { name: 'preventOverflow', options: { padding: 8 } },
        ],
    }); }, [arrowElement, placement]);
    var _h = reactPopper.usePopper(referenceElement, popperElement, options), styles = _h.styles, update = _h.update, attributes = _h.attributes;
    var updateCallback = React.useCallback(function () {
        update && update();
    }, [update]);
    useInterval(updateCallback, show ? 100 : null);
    return (jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [jsxRuntime.jsx(ReferenceElement, __assign({ ref: setReferenceElement }, { children: children }), void 0), jsxRuntime.jsx(Portal__default["default"], { children: jsxRuntime.jsxs(PopoverContainer$1, __assign({ show: show, ref: setPopperElement, style: styles.popper }, attributes.popper, { children: [content, jsxRuntime.jsx(Arrow, __assign({ className: "arrow-" + ((_c = (_b = attributes.popper) === null || _b === void 0 ? void 0 : _b['data-popper-placement']) !== null && _c !== void 0 ? _c : ''), ref: setArrowElement, style: styles.arrow }, attributes.arrow), void 0)] }), void 0) }, void 0)] }, void 0));
}
var templateObject_1$P, templateObject_2$x, templateObject_3$q;

var TooltipContainer = styled__default["default"].div(templateObject_1$O || (templateObject_1$O = __makeTemplateObject(["\n  max-width: 256px;\n  padding: 0.6rem 1rem;\n  font-weight: 400;\n  word-break: break-word;\n\n  background: ", ";\n  border-radius: 12px;\n  border: 1px solid ", ";\n  box-shadow: 0 4px 8px 0 ", ";\n"], ["\n  max-width: 256px;\n  padding: 0.6rem 1rem;\n  font-weight: 400;\n  word-break: break-word;\n\n  background: ", ";\n  border-radius: 12px;\n  border: 1px solid ", ";\n  box-shadow: 0 4px 8px 0 ", ";\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg0;
}, function (_a) {
    var theme = _a.theme;
    return theme.bg2;
}, function (_a) {
    var theme = _a.theme;
    return polished.transparentize(0.9, theme.shadow1);
});
function Tooltip(_a) {
    var text = _a.text, rest = __rest(_a, ["text"]);
    return jsxRuntime.jsx(Popover, __assign({ content: jsxRuntime.jsx(TooltipContainer, { children: text }, void 0) }, rest), void 0);
}
function TooltipContent(_a) {
    var content = _a.content, _b = _a.wrap, wrap = _b === void 0 ? false : _b, rest = __rest(_a, ["content", "wrap"]);
    return jsxRuntime.jsx(Popover, __assign({ content: wrap ? jsxRuntime.jsx(TooltipContainer, { children: content }, void 0) : content }, rest), void 0);
}
function MouseoverTooltip(_a) {
    var children = _a.children, rest = __rest(_a, ["children"]);
    var _b = __read(React.useState(false), 2), show = _b[0], setShow = _b[1];
    var open = React.useCallback(function () { return setShow(true); }, [setShow]);
    var close = React.useCallback(function () { return setShow(false); }, [setShow]);
    return (jsxRuntime.jsx(Tooltip, __assign({}, rest, { show: show }, { children: jsxRuntime.jsx("div", __assign({ onMouseEnter: open, onMouseLeave: close }, { children: children }), void 0) }), void 0));
}
function MouseoverTooltipContent(_a) {
    var content = _a.content, children = _a.children, _b = _a.onOpen, openCallback = _b === void 0 ? undefined : _b, disableHover = _a.disableHover, rest = __rest(_a, ["content", "children", "onOpen", "disableHover"]);
    var _c = __read(React.useState(false), 2), show = _c[0], setShow = _c[1];
    var open = React.useCallback(function () {
        setShow(true);
        openCallback === null || openCallback === void 0 ? void 0 : openCallback();
    }, [openCallback]);
    var close = React.useCallback(function () { return setShow(false); }, [setShow]);
    return (jsxRuntime.jsx(TooltipContent, __assign({}, rest, { show: show, content: disableHover ? null : content }, { children: jsxRuntime.jsx("div", __assign({ style: { display: 'inline-block', lineHeight: 0, padding: '0.25rem' }, onMouseEnter: open, onMouseLeave: close }, { children: children }), void 0) }), void 0));
}
var templateObject_1$O;

var THIRTY_BIPS_FEE = new sdkCore.Percent(JSBI__default["default"].BigInt(30), JSBI__default["default"].BigInt(10000));
var INPUT_FRACTION_AFTER_FEE = ONE_HUNDRED_PERCENT.subtract(THIRTY_BIPS_FEE);
// computes realized lp fee as a percent
function computeRealizedLPFeePercent(trade) {
    var e_1, _a;
    var percent;
    // Since routes are either all v2 or all v3 right now, calculate separately
    if (trade.swaps[0].route.pools instanceof v2Sdk.Pair) {
        // for each hop in our trade, take away the x*y=k price impact from 0.3% fees
        // e.g. for 3 tokens/2 hops: 1 - ((1 - .03) * (1-.03))
        percent = ONE_HUNDRED_PERCENT.subtract(trade.swaps.reduce(function (currentFee) { return currentFee.multiply(INPUT_FRACTION_AFTER_FEE); }, ONE_HUNDRED_PERCENT));
    }
    else {
        percent = ZERO_PERCENT;
        try {
            for (var _b = __values(trade.swaps), _c = _b.next(); !_c.done; _c = _b.next()) {
                var swap = _c.value;
                var _d = swap.inputAmount.divide(trade.inputAmount), numerator = _d.numerator, denominator = _d.denominator;
                var overallPercent = new sdkCore.Percent(numerator, denominator);
                var routeRealizedLPFeePercent = overallPercent.multiply(ONE_HUNDRED_PERCENT.subtract(swap.route.pools.reduce(function (currentFee, pool) {
                    var fee = pool instanceof v2Sdk.Pair
                        ? // not currently possible given protocol check above, but not fatal
                            v3Sdk.FeeAmount.MEDIUM
                        : pool.fee;
                    return currentFee.multiply(ONE_HUNDRED_PERCENT.subtract(new sdkCore.Fraction(fee, 1000000)));
                }, ONE_HUNDRED_PERCENT)));
                percent = percent.add(routeRealizedLPFeePercent);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    return new sdkCore.Percent(percent.numerator, percent.denominator);
}
var IMPACT_TIERS = [
    BLOCKED_PRICE_IMPACT_NON_EXPERT,
    ALLOWED_PRICE_IMPACT_HIGH,
    ALLOWED_PRICE_IMPACT_MEDIUM,
    ALLOWED_PRICE_IMPACT_LOW,
];
function warningSeverity(priceImpact) {
    var e_2, _a;
    if (!priceImpact)
        return 4;
    var impact = IMPACT_TIERS.length;
    try {
        for (var IMPACT_TIERS_1 = __values(IMPACT_TIERS), IMPACT_TIERS_1_1 = IMPACT_TIERS_1.next(); !IMPACT_TIERS_1_1.done; IMPACT_TIERS_1_1 = IMPACT_TIERS_1.next()) {
            var impactLevel = IMPACT_TIERS_1_1.value;
            if (impactLevel.lessThan(priceImpact))
                return impact;
            impact--;
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (IMPACT_TIERS_1_1 && !IMPACT_TIERS_1_1.done && (_a = IMPACT_TIERS_1.return)) _a.call(IMPACT_TIERS_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    return 0;
}

/**
 * Parses a CurrencyAmount from the passed string.
 * Returns the CurrencyAmount, or undefined if parsing fails.
 */
function tryParseCurrencyAmount(value, currency) {
    if (!value || !currency) {
        return undefined;
    }
    try {
        var typedValueParsed = units.parseUnits(value, currency.decimals).toString();
        if (typedValueParsed !== '0') {
            return sdkCore.CurrencyAmount.fromRawAmount(currency, JSBI__default["default"].BigInt(typedValueParsed));
        }
    }
    catch (error) {
        // fails if the user specifies too many decimal places of precision (or maybe exceed max uint?)
        console.debug("Failed to parse input amount: \"" + value + "\"", error);
    }
    return undefined;
}

// returns whether tradeB is better than tradeA by at least a threshold percentage amount
// only used by v2 hooks
function isTradeBetter(tradeA, tradeB, minimumDelta) {
    if (minimumDelta === void 0) { minimumDelta = ZERO_PERCENT; }
    if (tradeA && !tradeB)
        return false;
    if (tradeB && !tradeA)
        return true;
    if (!tradeA || !tradeB)
        return undefined;
    if (tradeA.tradeType !== tradeB.tradeType ||
        !tradeA.inputAmount.currency.equals(tradeB.inputAmount.currency) ||
        !tradeA.outputAmount.currency.equals(tradeB.outputAmount.currency)) {
        throw new Error('Comparing incomparable trades');
    }
    if (minimumDelta.equalTo(ZERO_PERCENT)) {
        return tradeA.executionPrice.lessThan(tradeB.executionPrice);
    }
    else {
        return tradeA.executionPrice.asFraction
            .multiply(minimumDelta.add(ONE_HUNDRED_PERCENT))
            .lessThan(tradeB.executionPrice);
    }
}

function useAllCurrencyCombinations(currencyA, currencyB) {
    var chainId = currencyA === null || currencyA === void 0 ? void 0 : currencyA.chainId;
    var _a = __read(chainId ? [currencyA === null || currencyA === void 0 ? void 0 : currencyA.wrapped, currencyB === null || currencyB === void 0 ? void 0 : currencyB.wrapped] : [undefined, undefined], 2), tokenA = _a[0], tokenB = _a[1];
    var bases = React.useMemo(function () {
        var _a, _b, _c, _d, _e;
        if (!chainId || chainId !== (tokenB === null || tokenB === void 0 ? void 0 : tokenB.chainId))
            return [];
        var common = (_a = BASES_TO_CHECK_TRADES_AGAINST[chainId]) !== null && _a !== void 0 ? _a : [];
        var additionalA = tokenA ? (_c = (_b = ADDITIONAL_BASES[chainId]) === null || _b === void 0 ? void 0 : _b[tokenA.address]) !== null && _c !== void 0 ? _c : [] : [];
        var additionalB = tokenB ? (_e = (_d = ADDITIONAL_BASES[chainId]) === null || _d === void 0 ? void 0 : _d[tokenB.address]) !== null && _e !== void 0 ? _e : [] : [];
        return __spreadArray(__spreadArray(__spreadArray([], __read(common), false), __read(additionalA), false), __read(additionalB), false);
    }, [chainId, tokenA, tokenB]);
    var basePairs = React.useMemo(function () {
        return bases
            .flatMap(function (base) { return bases.map(function (otherBase) { return [base, otherBase]; }); })
            // though redundant with the first filter below, that expression runs more often, so this is probably worthwhile
            .filter(function (_a) {
            var _b = __read(_a, 2), t0 = _b[0], t1 = _b[1];
            return !t0.equals(t1);
        });
    }, [bases]);
    return React.useMemo(function () {
        return tokenA && tokenB
            ? __spreadArray(__spreadArray(__spreadArray([
                // the direct pair
                [tokenA, tokenB]
            ], __read(bases.map(function (base) { return [tokenA, base]; })), false), __read(bases.map(function (base) { return [tokenB, base]; })), false), __read(basePairs), false).filter(function (_a) {
                var _b = __read(_a, 2), t0 = _b[0], t1 = _b[1];
                return !t0.equals(t1);
            })
                // filter out duplicate pairs
                .filter(function (_a, i, otherPairs) {
                var _b = __read(_a, 2), t0 = _b[0], t1 = _b[1];
                // find the first index in the array at which there are the same 2 tokens as the current
                var firstIndexInOtherPairs = otherPairs.findIndex(function (_a) {
                    var _b = __read(_a, 2), t0Other = _b[0], t1Other = _b[1];
                    return (t0.equals(t0Other) && t1.equals(t1Other)) || (t0.equals(t1Other) && t1.equals(t0Other));
                });
                // only accept the first occurrence of the same 2 tokens
                return firstIndexInOtherPairs === i;
            })
                // optionally filter out some pairs for tokens with custom bases defined
                .filter(function (_a) {
                var _b = __read(_a, 2), tokenA = _b[0], tokenB = _b[1];
                if (!chainId)
                    return true;
                var customBases = CUSTOM_BASES[chainId];
                var customBasesA = customBases === null || customBases === void 0 ? void 0 : customBases[tokenA.address];
                var customBasesB = customBases === null || customBases === void 0 ? void 0 : customBases[tokenB.address];
                if (!customBasesA && !customBasesB)
                    return true;
                if (customBasesA && !customBasesA.find(function (base) { return tokenB.equals(base); }))
                    return false;
                if (customBasesB && !customBasesB.find(function (base) { return tokenA.equals(base); }))
                    return false;
                return true;
            })
            : [];
    }, [tokenA, tokenB, bases, basePairs, chainId]);
}

var PAIR_INTERFACE = new abi$6.Interface(abi$4);
var PairState;
(function (PairState) {
    PairState[PairState["LOADING"] = 0] = "LOADING";
    PairState[PairState["NOT_EXISTS"] = 1] = "NOT_EXISTS";
    PairState[PairState["EXISTS"] = 2] = "EXISTS";
    PairState[PairState["INVALID"] = 3] = "INVALID";
})(PairState || (PairState = {}));
function useV2Pairs(currencies) {
    var tokens = React.useMemo(function () { return currencies.map(function (_a) {
        var _b = __read(_a, 2), currencyA = _b[0], currencyB = _b[1];
        return [currencyA === null || currencyA === void 0 ? void 0 : currencyA.wrapped, currencyB === null || currencyB === void 0 ? void 0 : currencyB.wrapped];
    }); }, [currencies]);
    var pairAddresses = React.useMemo(function () {
        return tokens.map(function (_a) {
            var _b = __read(_a, 2), tokenA = _b[0], tokenB = _b[1];
            return tokenA &&
                tokenB &&
                tokenA.chainId === tokenB.chainId &&
                !tokenA.equals(tokenB) &&
                V2_FACTORY_ADDRESSES[tokenA.chainId]
                ? v2Sdk.computePairAddress({ factoryAddress: V2_FACTORY_ADDRESSES[tokenA.chainId], tokenA: tokenA, tokenB: tokenB })
                : undefined;
        });
    }, [tokens]);
    var results = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, 'getReserves');
    return React.useMemo(function () {
        return results.map(function (result, i) {
            var reserves = result.result, loading = result.loading;
            var tokenA = tokens[i][0];
            var tokenB = tokens[i][1];
            if (loading)
                return [PairState.LOADING, null];
            if (!tokenA || !tokenB || tokenA.equals(tokenB))
                return [PairState.INVALID, null];
            if (!reserves)
                return [PairState.NOT_EXISTS, null];
            var reserve0 = reserves.reserve0, reserve1 = reserves.reserve1;
            var _a = __read(tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA], 2), token0 = _a[0], token1 = _a[1];
            return [
                PairState.EXISTS,
                new v2Sdk.Pair(sdkCore.CurrencyAmount.fromRawAmount(token0, reserve0.toString()), sdkCore.CurrencyAmount.fromRawAmount(token1, reserve1.toString())),
            ];
        });
    }, [results, tokens]);
}

function useAllCommonPairs(currencyA, currencyB) {
    var allCurrencyCombinations = useAllCurrencyCombinations(currencyA, currencyB);
    var allPairs = useV2Pairs(allCurrencyCombinations);
    return React.useMemo(function () {
        return Object.values(allPairs
            // filter out invalid pairs
            .filter(function (result) { return Boolean(result[0] === PairState.EXISTS && result[1]); })
            .map(function (_a) {
            var _b = __read(_a, 2), pair = _b[1];
            return pair;
        }));
    }, [allPairs]);
}
var MAX_HOPS = 3;
/**
 * Returns the best v2 trade for a desired swap
 * @param tradeType whether the swap is an exact in/out
 * @param amountSpecified the exact amount to swap in/out
 * @param otherCurrency the desired output/payment currency
 */
function useBestV2Trade(tradeType, amountSpecified, otherCurrency, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.maxHops, maxHops = _c === void 0 ? MAX_HOPS : _c;
    var _d = __read(React.useMemo(function () {
        return tradeType === sdkCore.TradeType.EXACT_INPUT
            ? [amountSpecified === null || amountSpecified === void 0 ? void 0 : amountSpecified.currency, otherCurrency]
            : [otherCurrency, amountSpecified === null || amountSpecified === void 0 ? void 0 : amountSpecified.currency];
    }, [tradeType, amountSpecified, otherCurrency]), 2), currencyIn = _d[0], currencyOut = _d[1];
    var allowedPairs = useAllCommonPairs(currencyIn, currencyOut);
    return React.useMemo(function () {
        var _a, _b, _c, _d;
        if (amountSpecified && currencyIn && currencyOut && allowedPairs.length > 0) {
            if (maxHops === 1) {
                var options = { maxHops: 1, maxNumResults: 1 };
                if (tradeType === sdkCore.TradeType.EXACT_INPUT) {
                    var amountIn = amountSpecified;
                    return (_a = v2Sdk.Trade.bestTradeExactIn(allowedPairs, amountIn, currencyOut, options)[0]) !== null && _a !== void 0 ? _a : null;
                }
                else {
                    var amountOut = amountSpecified;
                    return (_b = v2Sdk.Trade.bestTradeExactOut(allowedPairs, currencyIn, amountOut, options)[0]) !== null && _b !== void 0 ? _b : null;
                }
            }
            // search through trades with varying hops, find best trade out of them
            var bestTradeSoFar = null;
            for (var i = 1; i <= maxHops; i++) {
                var options = { maxHops: i, maxNumResults: 1 };
                var currentTrade = void 0;
                if (tradeType === sdkCore.TradeType.EXACT_INPUT) {
                    var amountIn = amountSpecified;
                    currentTrade = (_c = v2Sdk.Trade.bestTradeExactIn(allowedPairs, amountIn, currencyOut, options)[0]) !== null && _c !== void 0 ? _c : null;
                }
                else {
                    var amountOut = amountSpecified;
                    currentTrade = (_d = v2Sdk.Trade.bestTradeExactOut(allowedPairs, currencyIn, amountOut, options)[0]) !== null && _d !== void 0 ? _d : null;
                }
                // if current trade is best yet, save it
                if (isTradeBetter(bestTradeSoFar, currentTrade, BETTER_TRADE_LESS_HOPS_THRESHOLD)) {
                    bestTradeSoFar = currentTrade;
                }
            }
            return bestTradeSoFar;
        }
        return null;
    }, [tradeType, amountSpecified, currencyIn, currencyOut, allowedPairs, maxHops]);
}

var TradeState;
(function (TradeState) {
    TradeState[TradeState["LOADING"] = 0] = "LOADING";
    TradeState[TradeState["INVALID"] = 1] = "INVALID";
    TradeState[TradeState["NO_ROUTE_FOUND"] = 2] = "NO_ROUTE_FOUND";
    TradeState[TradeState["VALID"] = 3] = "VALID";
    TradeState[TradeState["SYNCING"] = 4] = "SYNCING";
})(TradeState || (TradeState = {}));
var InterfaceTrade = /** @class */ (function (_super) {
    __extends(InterfaceTrade, _super);
    function InterfaceTrade(_a) {
        var gasUseEstimateUSD = _a.gasUseEstimateUSD, routes = __rest(_a, ["gasUseEstimateUSD"]);
        var _this = _super.call(this, routes) || this;
        _this.gasUseEstimateUSD = gasUseEstimateUSD;
        return _this;
    }
    return InterfaceTrade;
}(routerSdk.Trade));

var abi = [
	{
		inputs: [
		],
		name: "feeGrowthGlobal0X128",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "feeGrowthGlobal1X128",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "liquidity",
		outputs: [
			{
				internalType: "uint128",
				name: "",
				type: "uint128"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "index",
				type: "uint256"
			}
		],
		name: "observations",
		outputs: [
			{
				internalType: "uint32",
				name: "blockTimestamp",
				type: "uint32"
			},
			{
				internalType: "int56",
				name: "tickCumulative",
				type: "int56"
			},
			{
				internalType: "uint160",
				name: "secondsPerLiquidityCumulativeX128",
				type: "uint160"
			},
			{
				internalType: "bool",
				name: "initialized",
				type: "bool"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "key",
				type: "bytes32"
			}
		],
		name: "positions",
		outputs: [
			{
				internalType: "uint128",
				name: "_liquidity",
				type: "uint128"
			},
			{
				internalType: "uint256",
				name: "feeGrowthInside0LastX128",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "feeGrowthInside1LastX128",
				type: "uint256"
			},
			{
				internalType: "uint128",
				name: "tokensOwed0",
				type: "uint128"
			},
			{
				internalType: "uint128",
				name: "tokensOwed1",
				type: "uint128"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "protocolFees",
		outputs: [
			{
				internalType: "uint128",
				name: "token0",
				type: "uint128"
			},
			{
				internalType: "uint128",
				name: "token1",
				type: "uint128"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
		],
		name: "slot0",
		outputs: [
			{
				internalType: "uint160",
				name: "sqrtPriceX96",
				type: "uint160"
			},
			{
				internalType: "int24",
				name: "tick",
				type: "int24"
			},
			{
				internalType: "uint16",
				name: "observationIndex",
				type: "uint16"
			},
			{
				internalType: "uint16",
				name: "observationCardinality",
				type: "uint16"
			},
			{
				internalType: "uint16",
				name: "observationCardinalityNext",
				type: "uint16"
			},
			{
				internalType: "uint8",
				name: "feeProtocol",
				type: "uint8"
			},
			{
				internalType: "bool",
				name: "unlocked",
				type: "bool"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "int16",
				name: "wordPosition",
				type: "int16"
			}
		],
		name: "tickBitmap",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256"
			}
		],
		stateMutability: "view",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "int24",
				name: "tick",
				type: "int24"
			}
		],
		name: "ticks",
		outputs: [
			{
				internalType: "uint128",
				name: "liquidityGross",
				type: "uint128"
			},
			{
				internalType: "int128",
				name: "liquidityNet",
				type: "int128"
			},
			{
				internalType: "uint256",
				name: "feeGrowthOutside0X128",
				type: "uint256"
			},
			{
				internalType: "uint256",
				name: "feeGrowthOutside1X128",
				type: "uint256"
			},
			{
				internalType: "int56",
				name: "tickCumulativeOutside",
				type: "int56"
			},
			{
				internalType: "uint160",
				name: "secondsPerLiquidityOutsideX128",
				type: "uint160"
			},
			{
				internalType: "uint32",
				name: "secondsOutside",
				type: "uint32"
			},
			{
				internalType: "bool",
				name: "initialized",
				type: "bool"
			}
		],
		stateMutability: "view",
		type: "function"
	}
];

var POOL_STATE_INTERFACE = new abi$6.Interface(abi);
var PoolState;
(function (PoolState) {
    PoolState[PoolState["LOADING"] = 0] = "LOADING";
    PoolState[PoolState["NOT_EXISTS"] = 1] = "NOT_EXISTS";
    PoolState[PoolState["EXISTS"] = 2] = "EXISTS";
    PoolState[PoolState["INVALID"] = 3] = "INVALID";
})(PoolState || (PoolState = {}));
function usePools(poolKeys) {
    var chainId = useActiveWeb3React().chainId;
    var transformed = React.useMemo(function () {
        return poolKeys.map(function (_a) {
            var _b = __read(_a, 3), currencyA = _b[0], currencyB = _b[1], feeAmount = _b[2];
            if (!chainId || !currencyA || !currencyB || !feeAmount)
                return null;
            var tokenA = currencyA === null || currencyA === void 0 ? void 0 : currencyA.wrapped;
            var tokenB = currencyB === null || currencyB === void 0 ? void 0 : currencyB.wrapped;
            if (!tokenA || !tokenB || tokenA.equals(tokenB))
                return null;
            var _c = __read(tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA], 2), token0 = _c[0], token1 = _c[1];
            return [token0, token1, feeAmount];
        });
    }, [chainId, poolKeys]);
    var poolAddresses = React.useMemo(function () {
        var v3CoreFactoryAddress = chainId && V3_CORE_FACTORY_ADDRESSES[chainId];
        return transformed.map(function (value) {
            if (!v3CoreFactoryAddress || !value)
                return undefined;
            return v3Sdk.computePoolAddress({
                factoryAddress: v3CoreFactoryAddress,
                tokenA: value[0],
                tokenB: value[1],
                fee: value[2],
            });
        });
    }, [chainId, transformed]);
    var slot0s = useMultipleContractSingleData(poolAddresses, POOL_STATE_INTERFACE, 'slot0');
    var liquidities = useMultipleContractSingleData(poolAddresses, POOL_STATE_INTERFACE, 'liquidity');
    return React.useMemo(function () {
        return poolKeys.map(function (_key, index) {
            var _a;
            var _b = __read((_a = transformed[index]) !== null && _a !== void 0 ? _a : [], 3), token0 = _b[0], token1 = _b[1], fee = _b[2];
            if (!token0 || !token1 || !fee)
                return [PoolState.INVALID, null];
            var _c = slot0s[index], slot0 = _c.result, slot0Loading = _c.loading, slot0Valid = _c.valid;
            var _d = liquidities[index], liquidity = _d.result, liquidityLoading = _d.loading, liquidityValid = _d.valid;
            if (!slot0Valid || !liquidityValid)
                return [PoolState.INVALID, null];
            if (slot0Loading || liquidityLoading)
                return [PoolState.LOADING, null];
            if (!slot0 || !liquidity)
                return [PoolState.NOT_EXISTS, null];
            if (!slot0.sqrtPriceX96 || slot0.sqrtPriceX96.eq(0))
                return [PoolState.NOT_EXISTS, null];
            try {
                return [PoolState.EXISTS, new v3Sdk.Pool(token0, token1, fee, slot0.sqrtPriceX96, liquidity[0], slot0.tick)];
            }
            catch (error) {
                console.error('Error when constructing the pool', error);
                return [PoolState.NOT_EXISTS, null];
            }
        });
    }, [liquidities, poolKeys, slot0s, transformed]);
}

/**
 * Returns all the existing pools that should be considered for swapping between an input currency and an output currency
 * @param currencyIn the input currency
 * @param currencyOut the output currency
 */
function useV3SwapPools(currencyIn, currencyOut) {
    var chainId = useActiveWeb3React().chainId;
    var allCurrencyCombinations = useAllCurrencyCombinations(currencyIn, currencyOut);
    var allCurrencyCombinationsWithAllFees = React.useMemo(function () {
        return allCurrencyCombinations.reduce(function (list, _a) {
            var _b = __read(_a, 2), tokenA = _b[0], tokenB = _b[1];
            return chainId === SupportedChainId.MAINNET
                ? list.concat([
                    [tokenA, tokenB, v3Sdk.FeeAmount.LOW],
                    [tokenA, tokenB, v3Sdk.FeeAmount.MEDIUM],
                    [tokenA, tokenB, v3Sdk.FeeAmount.HIGH],
                ])
                : list.concat([
                    [tokenA, tokenB, v3Sdk.FeeAmount.LOWEST],
                    [tokenA, tokenB, v3Sdk.FeeAmount.LOW],
                    [tokenA, tokenB, v3Sdk.FeeAmount.MEDIUM],
                    [tokenA, tokenB, v3Sdk.FeeAmount.HIGH],
                ]);
        }, []);
    }, [allCurrencyCombinations, chainId]);
    var pools = usePools(allCurrencyCombinationsWithAllFees);
    return React.useMemo(function () {
        return {
            pools: pools
                .filter(function (tuple) {
                return tuple[0] === PoolState.EXISTS && tuple[1] !== null;
            })
                .map(function (_a) {
                var _b = __read(_a, 2), pool = _b[1];
                return pool;
            }),
            loading: pools.some(function (_a) {
                var _b = __read(_a, 1), state = _b[0];
                return state === PoolState.LOADING;
            }),
        };
    }, [pools]);
}

/**
 * Returns true if poolA is equivalent to poolB
 * @param poolA one of the two pools
 * @param poolB the other pool
 */
function poolEquals(poolA, poolB) {
    return (poolA === poolB ||
        (poolA.token0.equals(poolB.token0) && poolA.token1.equals(poolB.token1) && poolA.fee === poolB.fee));
}
function computeAllRoutes(currencyIn, currencyOut, pools, chainId, currentPath, allPaths, startCurrencyIn, maxHops) {
    var e_1, _a;
    if (currentPath === void 0) { currentPath = []; }
    if (allPaths === void 0) { allPaths = []; }
    if (startCurrencyIn === void 0) { startCurrencyIn = currencyIn; }
    if (maxHops === void 0) { maxHops = 2; }
    var tokenIn = currencyIn === null || currencyIn === void 0 ? void 0 : currencyIn.wrapped;
    var tokenOut = currencyOut === null || currencyOut === void 0 ? void 0 : currencyOut.wrapped;
    if (!tokenIn || !tokenOut)
        throw new Error('Missing tokenIn/tokenOut');
    var _loop_1 = function (pool) {
        if (!pool.involvesToken(tokenIn) || currentPath.find(function (pathPool) { return poolEquals(pool, pathPool); }))
            return "continue";
        var outputToken = pool.token0.equals(tokenIn) ? pool.token1 : pool.token0;
        if (outputToken.equals(tokenOut)) {
            allPaths.push(new v3Sdk.Route(__spreadArray(__spreadArray([], __read(currentPath), false), [pool], false), startCurrencyIn, currencyOut));
        }
        else if (maxHops > 1) {
            computeAllRoutes(outputToken, currencyOut, pools, chainId, __spreadArray(__spreadArray([], __read(currentPath), false), [pool], false), allPaths, startCurrencyIn, maxHops - 1);
        }
    };
    try {
        for (var pools_1 = __values(pools), pools_1_1 = pools_1.next(); !pools_1_1.done; pools_1_1 = pools_1.next()) {
            var pool = pools_1_1.value;
            _loop_1(pool);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (pools_1_1 && !pools_1_1.done && (_a = pools_1.return)) _a.call(pools_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return allPaths;
}
/**
 * Returns all the routes from an input currency to an output currency
 * @param currencyIn the input currency
 * @param currencyOut the output currency
 */
function useAllV3Routes(currencyIn, currencyOut) {
    var chainId = useActiveWeb3React().chainId;
    var _a = useV3SwapPools(currencyIn, currencyOut), pools = _a.pools, poolsLoading = _a.loading;
    return React.useMemo(function () {
        if (poolsLoading || !chainId || !pools || !currencyIn || !currencyOut)
            return { loading: true, routes: [] };
        var routes = computeAllRoutes(currencyIn, currencyOut, pools, chainId, [], [], currencyIn, 2);
        return { loading: false, routes: routes };
    }, [chainId, currencyIn, currencyOut, pools, poolsLoading]);
}

var _a$9;
var QUOTE_GAS_OVERRIDES = (_a$9 = {},
    _a$9[SupportedChainId.ARBITRUM_ONE] = 25000000,
    _a$9[SupportedChainId.ARBITRUM_RINKEBY] = 25000000,
    _a$9);
var DEFAULT_GAS_QUOTE = 2000000;
/**
 * Returns the best v3 trade for a desired swap
 * @param tradeType whether the swap is an exact in/out
 * @param amountSpecified the exact amount to swap in/out
 * @param otherCurrency the desired output/payment currency
 */
function useClientSideV3Trade(tradeType, amountSpecified, otherCurrency) {
    var _a;
    var _b = __read(React.useMemo(function () {
        return tradeType === sdkCore.TradeType.EXACT_INPUT
            ? [amountSpecified === null || amountSpecified === void 0 ? void 0 : amountSpecified.currency, otherCurrency]
            : [otherCurrency, amountSpecified === null || amountSpecified === void 0 ? void 0 : amountSpecified.currency];
    }, [tradeType, amountSpecified, otherCurrency]), 2), currencyIn = _b[0], currencyOut = _b[1];
    var _c = useAllV3Routes(currencyIn, currencyOut), routes = _c.routes, routesLoading = _c.loading;
    var quoter = useV3Quoter();
    var chainId = useActiveWeb3React().chainId;
    var quotesResults = useSingleContractWithCallData(quoter, amountSpecified
        ? routes.map(function (route) { return v3Sdk.SwapQuoter.quoteCallParameters(route, amountSpecified, tradeType).calldata; })
        : [], {
        gasRequired: chainId ? (_a = QUOTE_GAS_OVERRIDES[chainId]) !== null && _a !== void 0 ? _a : DEFAULT_GAS_QUOTE : undefined,
    });
    return React.useMemo(function () {
        if (!amountSpecified ||
            !currencyIn ||
            !currencyOut ||
            quotesResults.some(function (_a) {
                var valid = _a.valid;
                return !valid;
            }) ||
            // skip when tokens are the same
            (tradeType === sdkCore.TradeType.EXACT_INPUT
                ? amountSpecified.currency.equals(currencyOut)
                : amountSpecified.currency.equals(currencyIn))) {
            return {
                state: TradeState.INVALID,
                trade: undefined,
            };
        }
        if (routesLoading || quotesResults.some(function (_a) {
            var loading = _a.loading;
            return loading;
        })) {
            return {
                state: TradeState.LOADING,
                trade: undefined,
            };
        }
        var _a = quotesResults.reduce(function (currentBest, _a, i) {
            var result = _a.result;
            if (!result)
                return currentBest;
            // overwrite the current best if it's not defined or if this route is better
            if (tradeType === sdkCore.TradeType.EXACT_INPUT) {
                var amountOut_1 = sdkCore.CurrencyAmount.fromRawAmount(currencyOut, result.amountOut.toString());
                if (currentBest.amountOut === null || JSBI__default["default"].lessThan(currentBest.amountOut.quotient, amountOut_1.quotient)) {
                    return {
                        bestRoute: routes[i],
                        amountIn: amountSpecified,
                        amountOut: amountOut_1,
                    };
                }
            }
            else {
                var amountIn_1 = sdkCore.CurrencyAmount.fromRawAmount(currencyIn, result.amountIn.toString());
                if (currentBest.amountIn === null || JSBI__default["default"].greaterThan(currentBest.amountIn.quotient, amountIn_1.quotient)) {
                    return {
                        bestRoute: routes[i],
                        amountIn: amountIn_1,
                        amountOut: amountSpecified,
                    };
                }
            }
            return currentBest;
        }, {
            bestRoute: null,
            amountIn: null,
            amountOut: null,
        }), bestRoute = _a.bestRoute, amountIn = _a.amountIn, amountOut = _a.amountOut;
        if (!bestRoute || !amountIn || !amountOut) {
            return {
                state: TradeState.NO_ROUTE_FOUND,
                trade: undefined,
            };
        }
        return {
            state: TradeState.VALID,
            trade: new InterfaceTrade({
                v2Routes: [],
                v3Routes: [
                    {
                        routev3: bestRoute,
                        inputAmount: amountIn,
                        outputAmount: amountOut,
                    },
                ],
                tradeType: tradeType,
            }),
        };
    }, [amountSpecified, currencyIn, currencyOut, quotesResults, routes, routesLoading, tradeType]);
}

var _a$8;
// Stablecoin amounts used when calculating spot price for a given currency.
// The amount is large enough to filter low liquidity pairs.
var STABLECOIN_AMOUNT_OUT = (_a$8 = {},
    _a$8[SupportedChainId.MAINNET] = sdkCore.CurrencyAmount.fromRawAmount(USDC, 100000000000),
    _a$8[SupportedChainId.ARBITRUM_ONE] = sdkCore.CurrencyAmount.fromRawAmount(USDC_ARBITRUM, 10000000000),
    _a$8[SupportedChainId.OPTIMISM] = sdkCore.CurrencyAmount.fromRawAmount(DAI_OPTIMISM, 1e+22),
    _a$8[SupportedChainId.POLYGON] = sdkCore.CurrencyAmount.fromRawAmount(USDC_POLYGON, 10000000000),
    _a$8);
/**
 * Returns the price in USDC of the input currency
 * @param currency currency to compute the USDC price of
 */
function useUSDCPrice(currency) {
    var chainId = currency === null || currency === void 0 ? void 0 : currency.chainId;
    var amountOut = chainId ? STABLECOIN_AMOUNT_OUT[chainId] : undefined;
    var stablecoin = amountOut === null || amountOut === void 0 ? void 0 : amountOut.currency;
    // TODO(#2808): remove dependency on useBestV2Trade
    var v2USDCTrade = useBestV2Trade(sdkCore.TradeType.EXACT_OUTPUT, amountOut, currency, {
        maxHops: 2,
    });
    var v3USDCTrade = useClientSideV3Trade(sdkCore.TradeType.EXACT_OUTPUT, amountOut, currency);
    return React.useMemo(function () {
        if (!currency || !stablecoin) {
            return undefined;
        }
        // handle usdc
        if (currency === null || currency === void 0 ? void 0 : currency.wrapped.equals(stablecoin)) {
            return new sdkCore.Price(stablecoin, stablecoin, '1', '1');
        }
        // use v2 price if available, v3 as fallback
        if (v2USDCTrade) {
            var _a = v2USDCTrade.route.midPrice, numerator = _a.numerator, denominator = _a.denominator;
            return new sdkCore.Price(currency, stablecoin, denominator, numerator);
        }
        else if (v3USDCTrade.trade) {
            var _b = v3USDCTrade.trade.routes[0].midPrice, numerator = _b.numerator, denominator = _b.denominator;
            return new sdkCore.Price(currency, stablecoin, denominator, numerator);
        }
        return undefined;
    }, [currency, stablecoin, v2USDCTrade, v3USDCTrade.trade]);
}
function useUSDCValue(currencyAmount) {
    var price = useUSDCPrice(currencyAmount === null || currencyAmount === void 0 ? void 0 : currencyAmount.currency);
    return React.useMemo(function () {
        if (!price || !currencyAmount)
            return null;
        try {
            return price.quote(currencyAmount);
        }
        catch (error) {
            return null;
        }
    }, [currencyAmount, price]);
}
/**
 *
 * @param fiatValue string representation of a USD amount
 * @returns CurrencyAmount where currency is stablecoin on active chain
 */
function useStablecoinAmountFromFiatValue(fiatValue) {
    var _a;
    var chainId = useActiveWeb3React().chainId;
    var stablecoin = chainId ? (_a = STABLECOIN_AMOUNT_OUT[chainId]) === null || _a === void 0 ? void 0 : _a.currency : undefined;
    if (fiatValue === null || fiatValue === undefined || !chainId || !stablecoin) {
        return undefined;
    }
    // trim for decimal precision when parsing
    var parsedForDecimals = parseFloat(fiatValue).toFixed(stablecoin.decimals).toString();
    try {
        // parse USD string into CurrencyAmount based on stablecoin decimals
        return tryParseCurrencyAmount(parsedForDecimals, stablecoin);
    }
    catch (error) {
        return undefined;
    }
}

var StyledPriceContainer = styled__default["default"].button(templateObject_1$N || (templateObject_1$N = __makeTemplateObject(["\n  background-color: transparent;\n  border: none;\n  cursor: pointer;\n  align-items: center;\n  justify-content: flex-start;\n  padding: 0;\n  grid-template-columns: 1fr auto;\n  grid-gap: 0.25rem;\n  display: flex;\n  flex-direction: row;\n  text-align: left;\n  flex-wrap: wrap;\n  padding: 8px 0;\n  user-select: text;\n"], ["\n  background-color: transparent;\n  border: none;\n  cursor: pointer;\n  align-items: center;\n  justify-content: flex-start;\n  padding: 0;\n  grid-template-columns: 1fr auto;\n  grid-gap: 0.25rem;\n  display: flex;\n  flex-direction: row;\n  text-align: left;\n  flex-wrap: wrap;\n  padding: 8px 0;\n  user-select: text;\n"])));
function TradePrice(_a) {
    var _b, _c, _d, _e, _f, _g;
    var price = _a.price, showInverted = _a.showInverted, setShowInverted = _a.setShowInverted;
    var theme = React.useContext(styled.ThemeContext);
    var usdcPrice = useUSDCPrice(showInverted ? price.baseCurrency : price.quoteCurrency);
    var formattedPrice;
    try {
        formattedPrice = showInverted ? price.toSignificant(4) : (_b = price.invert()) === null || _b === void 0 ? void 0 : _b.toSignificant(4);
    }
    catch (error) {
        formattedPrice = '0';
    }
    var label = showInverted ? "" + ((_c = price.quoteCurrency) === null || _c === void 0 ? void 0 : _c.symbol) : ((_d = price.baseCurrency) === null || _d === void 0 ? void 0 : _d.symbol) + " ";
    var labelInverted = showInverted ? ((_e = price.baseCurrency) === null || _e === void 0 ? void 0 : _e.symbol) + " " : "" + ((_f = price.quoteCurrency) === null || _f === void 0 ? void 0 : _f.symbol);
    var flipPrice = React.useCallback(function () { return setShowInverted(!showInverted); }, [setShowInverted, showInverted]);
    var text = ((_g = '1 ' + labelInverted + ' = ' + formattedPrice) !== null && _g !== void 0 ? _g : '-') + " " + label;
    return (jsxRuntime.jsxs(StyledPriceContainer, __assign({ onClick: function (e) {
            e.stopPropagation(); // dont want this click to affect dropdowns / hovers
            flipPrice();
        }, title: text }, { children: [jsxRuntime.jsx(rebass.Text, __assign({ fontWeight: 500, color: theme.text1 }, { children: text }), void 0), ' ', usdcPrice && (jsxRuntime.jsx(ThemedText.DarkGray, { children: jsxRuntime.jsxs(macro.Trans, { children: ["($", usdcPrice.toSignificant(6, { groupSeparator: ',' }), ")"] }, void 0) }, void 0))] }), void 0));
}
var templateObject_1$N;

var Wrapper$d = styled__default["default"].div(templateObject_1$M || (templateObject_1$M = __makeTemplateObject(["\n  position: relative;\n  padding: 8px;\n"], ["\n  position: relative;\n  padding: 8px;\n"])));
var ArrowWrapper$1 = styled__default["default"].div(templateObject_3$p || (templateObject_3$p = __makeTemplateObject(["\n  padding: 4px;\n  border-radius: 12px;\n  height: 32px;\n  width: 32px;\n  position: relative;\n  margin-top: -14px;\n  margin-bottom: -14px;\n  left: calc(50% - 16px);\n  /* transform: rotate(90deg); */\n  background-color: ", ";\n  border: 4px solid ", ";\n  z-index: 2;\n  ", "\n"], ["\n  padding: 4px;\n  border-radius: 12px;\n  height: 32px;\n  width: 32px;\n  position: relative;\n  margin-top: -14px;\n  margin-bottom: -14px;\n  left: calc(50% - 16px);\n  /* transform: rotate(90deg); */\n  background-color: ", ";\n  border: 4px solid ", ";\n  z-index: 2;\n  ", "\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg1;
}, function (_a) {
    var theme = _a.theme;
    return theme.bg0;
}, function (_a) {
    var clickable = _a.clickable;
    return clickable
        ? styled.css(templateObject_2$w || (templateObject_2$w = __makeTemplateObject(["\n          :hover {\n            cursor: pointer;\n            opacity: 0.8;\n          }\n        "], ["\n          :hover {\n            cursor: pointer;\n            opacity: 0.8;\n          }\n        "]))) : null;
});
var SectionBreak = styled__default["default"].div(templateObject_4$g || (templateObject_4$g = __makeTemplateObject(["\n  height: 1px;\n  width: 100%;\n  background-color: ", ";\n"], ["\n  height: 1px;\n  width: 100%;\n  background-color: ", ";\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg3;
});
var ErrorText = styled__default["default"](rebass.Text)(templateObject_5$e || (templateObject_5$e = __makeTemplateObject(["\n  color: ", ";\n"], ["\n  color: ", ";\n"])), function (_a) {
    var theme = _a.theme, severity = _a.severity;
    return severity === 3 || severity === 4
        ? theme.red1
        : severity === 2
            ? theme.yellow2
            : severity === 1
                ? theme.text1
                : theme.text2;
});
var TruncatedText = styled__default["default"](rebass.Text)(templateObject_6$a || (templateObject_6$a = __makeTemplateObject(["\n  text-overflow: ellipsis;\n  max-width: 220px;\n  overflow: hidden;\n  text-align: right;\n"], ["\n  text-overflow: ellipsis;\n  max-width: 220px;\n  overflow: hidden;\n  text-align: right;\n"
    // styles
])));
// styles
styled__default["default"].span(templateObject_7$9 || (templateObject_7$9 = __makeTemplateObject(["\n  &::after {\n    display: inline-block;\n    animation: ellipsis 1.25s infinite;\n    content: '.';\n    width: 1em;\n    text-align: left;\n  }\n  @keyframes ellipsis {\n    0% {\n      content: '.';\n    }\n    33% {\n      content: '..';\n    }\n    66% {\n      content: '...';\n    }\n  }\n"], ["\n  &::after {\n    display: inline-block;\n    animation: ellipsis 1.25s infinite;\n    content: '.';\n    width: 1em;\n    text-align: left;\n  }\n  @keyframes ellipsis {\n    0% {\n      content: '.';\n    }\n    33% {\n      content: '..';\n    }\n    66% {\n      content: '...';\n    }\n  }\n"])));
var SwapCallbackErrorInner = styled__default["default"].div(templateObject_8$6 || (templateObject_8$6 = __makeTemplateObject(["\n  background-color: ", ";\n  border-radius: 1rem;\n  display: flex;\n  align-items: center;\n  font-size: 0.825rem;\n  width: 100%;\n  padding: 3rem 1.25rem 1rem 1rem;\n  margin-top: -2rem;\n  color: ", ";\n  z-index: -1;\n  p {\n    padding: 0;\n    margin: 0;\n    font-weight: 500;\n  }\n"], ["\n  background-color: ", ";\n  border-radius: 1rem;\n  display: flex;\n  align-items: center;\n  font-size: 0.825rem;\n  width: 100%;\n  padding: 3rem 1.25rem 1rem 1rem;\n  margin-top: -2rem;\n  color: ", ";\n  z-index: -1;\n  p {\n    padding: 0;\n    margin: 0;\n    font-weight: 500;\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return polished.transparentize(0.9, theme.red1);
}, function (_a) {
    var theme = _a.theme;
    return theme.red1;
});
var SwapCallbackErrorInnerAlertTriangle = styled__default["default"].div(templateObject_9$6 || (templateObject_9$6 = __makeTemplateObject(["\n  background-color: ", ";\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  margin-right: 12px;\n  border-radius: 12px;\n  min-width: 48px;\n  height: 48px;\n"], ["\n  background-color: ", ";\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  margin-right: 12px;\n  border-radius: 12px;\n  min-width: 48px;\n  height: 48px;\n"])), function (_a) {
    var theme = _a.theme;
    return polished.transparentize(0.9, theme.red1);
});
function SwapCallbackError(_a) {
    var error = _a.error;
    return (jsxRuntime.jsxs(SwapCallbackErrorInner, { children: [jsxRuntime.jsx(SwapCallbackErrorInnerAlertTriangle, { children: jsxRuntime.jsx(reactFeather.AlertTriangle, { size: 24 }, void 0) }, void 0), jsxRuntime.jsx("p", __assign({ style: { wordBreak: 'break-word' } }, { children: error }), void 0)] }, void 0));
}
var SwapShowAcceptChanges = styled__default["default"](AutoColumn)(templateObject_10$5 || (templateObject_10$5 = __makeTemplateObject(["\n  background-color: ", ";\n  color: ", ";\n  padding: 0.5rem;\n  border-radius: 12px;\n  margin-top: 8px;\n"], ["\n  background-color: ", ";\n  color: ", ";\n  padding: 0.5rem;\n  border-radius: 12px;\n  margin-top: 8px;\n"])), function (_a) {
    var theme = _a.theme;
    return polished.transparentize(0.95, theme.primary3);
}, function (_a) {
    var theme = _a.theme;
    return theme.primaryText1;
});
styled__default["default"](ThemedText.Black)(templateObject_11$4 || (templateObject_11$4 = __makeTemplateObject(["\n  border-bottom: 1px solid ", ";\n  padding-bottom: 0.5rem;\n"], ["\n  border-bottom: 1px solid ", ";\n  padding-bottom: 0.5rem;\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg2;
});
var ResponsiveTooltipContainer = styled__default["default"](TooltipContainer)(templateObject_13$1 || (templateObject_13$1 = __makeTemplateObject(["\n  background-color: ", ";\n  border: 1px solid ", ";\n  padding: 1rem;\n  width: ", ";\n\n  ", "\n"], ["\n  background-color: ", ";\n  border: 1px solid ", ";\n  padding: 1rem;\n  width: ", ";\n\n  ", "\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg0;
}, function (_a) {
    var theme = _a.theme;
    return theme.bg2;
}, function (_a) {
    var width = _a.width;
    return width !== null && width !== void 0 ? width : 'auto';
}, function (_a) {
    var theme = _a.theme, origin = _a.origin;
    return theme.mediaWidth.upToExtraSmall(templateObject_12$4 || (templateObject_12$4 = __makeTemplateObject(["\n    transform: scale(0.8);\n    transform-origin: ", ";\n  "], ["\n    transform: scale(0.8);\n    transform-origin: ", ";\n  "])), origin !== null && origin !== void 0 ? origin : 'top left');
});
styled__default["default"](TradePrice)(templateObject_14$1 || (templateObject_14$1 = __makeTemplateObject(["\n  ", "\n"], ["\n  ", "\n"])), loadingOpacityMixin);
var templateObject_1$M, templateObject_2$w, templateObject_3$p, templateObject_4$g, templateObject_5$e, templateObject_6$a, templateObject_7$9, templateObject_8$6, templateObject_9$6, templateObject_10$5, templateObject_11$4, templateObject_12$4, templateObject_13$1, templateObject_14$1;

/**
 * Formatted version of price impact text with warning colors
 */
function FormattedPriceImpact(_a) {
    var priceImpact = _a.priceImpact;
    return (jsxRuntime.jsx(ErrorText, __assign({ fontWeight: 500, fontSize: 14, severity: warningSeverity(priceImpact) }, { children: priceImpact ? priceImpact.multiply(-1).toFixed(2) + "%" : '-' }), void 0));
}

var StyledCard$1 = styled__default["default"](Card)(templateObject_1$L || (templateObject_1$L = __makeTemplateObject(["\n  padding: 0;\n"], ["\n  padding: 0;\n"])));
function TextWithLoadingPlaceholder(_a) {
    var syncing = _a.syncing, width = _a.width, children = _a.children;
    return syncing ? (jsxRuntime.jsx(LoadingRows, { children: jsxRuntime.jsx("div", { style: { height: '15px', width: width + "px" } }, void 0) }, void 0)) : (children);
}
function AdvancedSwapDetails(_a) {
    var trade = _a.trade, allowedSlippage = _a.allowedSlippage, _b = _a.syncing, syncing = _b === void 0 ? false : _b;
    var theme = React.useContext(styled.ThemeContext);
    var chainId = useActiveWeb3React().chainId;
    var _c = React.useMemo(function () {
        if (!trade)
            return { expectedOutputAmount: undefined, priceImpact: undefined };
        var expectedOutputAmount = trade.outputAmount;
        var realizedLpFeePercent = computeRealizedLPFeePercent(trade);
        var priceImpact = trade.priceImpact.subtract(realizedLpFeePercent);
        return { expectedOutputAmount: expectedOutputAmount, priceImpact: priceImpact };
    }, [trade]), expectedOutputAmount = _c.expectedOutputAmount, priceImpact = _c.priceImpact;
    return !trade ? null : (jsxRuntime.jsx(StyledCard$1, { children: jsxRuntime.jsxs(AutoColumn, __assign({ gap: "8px" }, { children: [jsxRuntime.jsxs(RowBetween, { children: [jsxRuntime.jsx(RowFixed, { children: jsxRuntime.jsx(ThemedText.SubHeader, __assign({ color: theme.text1 }, { children: jsxRuntime.jsx(macro.Trans, { children: "Expected Output" }, void 0) }), void 0) }, void 0), jsxRuntime.jsx(TextWithLoadingPlaceholder, __assign({ syncing: syncing, width: 65 }, { children: jsxRuntime.jsx(ThemedText.Black, __assign({ textAlign: "right", fontSize: 14 }, { children: expectedOutputAmount
                                    ? expectedOutputAmount.toSignificant(6) + "  " + expectedOutputAmount.currency.symbol
                                    : '-' }), void 0) }), void 0)] }, void 0), jsxRuntime.jsxs(RowBetween, { children: [jsxRuntime.jsx(RowFixed, { children: jsxRuntime.jsx(ThemedText.SubHeader, __assign({ color: theme.text1 }, { children: jsxRuntime.jsx(macro.Trans, { children: "Price Impact" }, void 0) }), void 0) }, void 0), jsxRuntime.jsx(TextWithLoadingPlaceholder, __assign({ syncing: syncing, width: 50 }, { children: jsxRuntime.jsx(ThemedText.Black, __assign({ textAlign: "right", fontSize: 14 }, { children: jsxRuntime.jsx(FormattedPriceImpact, { priceImpact: priceImpact }, void 0) }), void 0) }), void 0)] }, void 0), jsxRuntime.jsx(Separator$1, {}, void 0), jsxRuntime.jsxs(RowBetween, { children: [jsxRuntime.jsx(RowFixed, __assign({ style: { marginRight: '20px' } }, { children: jsxRuntime.jsxs(ThemedText.SubHeader, __assign({ color: theme.text3 }, { children: [trade.tradeType === sdkCore.TradeType.EXACT_INPUT ? (jsxRuntime.jsx(macro.Trans, { children: "Minimum received" }, void 0)) : (jsxRuntime.jsx(macro.Trans, { children: "Maximum sent" }, void 0)), ' ', jsxRuntime.jsx(macro.Trans, { children: "after slippage" }, void 0), " (", allowedSlippage.toFixed(2), "%)"] }), void 0) }), void 0), jsxRuntime.jsx(TextWithLoadingPlaceholder, __assign({ syncing: syncing, width: 70 }, { children: jsxRuntime.jsx(ThemedText.Black, __assign({ textAlign: "right", fontSize: 14, color: theme.text3 }, { children: trade.tradeType === sdkCore.TradeType.EXACT_INPUT
                                    ? trade.minimumAmountOut(allowedSlippage).toSignificant(6) + " " + trade.outputAmount.currency.symbol
                                    : trade.maximumAmountIn(allowedSlippage).toSignificant(6) + " " + trade.inputAmount.currency.symbol }), void 0) }), void 0)] }, void 0), !(trade === null || trade === void 0 ? void 0 : trade.gasUseEstimateUSD) || !chainId || !SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(chainId) ? null : (jsxRuntime.jsxs(RowBetween, { children: [jsxRuntime.jsx(ThemedText.SubHeader, __assign({ color: theme.text3 }, { children: jsxRuntime.jsx(macro.Trans, { children: "Network Fee" }, void 0) }), void 0), jsxRuntime.jsx(TextWithLoadingPlaceholder, __assign({ syncing: syncing, width: 50 }, { children: jsxRuntime.jsxs(ThemedText.Black, __assign({ textAlign: "right", fontSize: 14, color: theme.text3 }, { children: ["~$", trade.gasUseEstimateUSD.toFixed(2)] }), void 0) }), void 0)] }, void 0))] }), void 0) }, void 0));
}
var templateObject_1$L;

var _path$3, _line$1, _line2, _path2;

function _extends$4() { _extends$4 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends$4.apply(this, arguments); }

var SvgGasIcon = function SvgGasIcon(props) {
  return /*#__PURE__*/React__namespace.createElement("svg", _extends$4({
    width: 16,
    height: 16,
    viewBox: "0 0 16 16",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, props), _path$3 || (_path$3 = /*#__PURE__*/React__namespace.createElement("path", {
    d: "M10.0047 9.26921H10.2714C11.0078 9.26921 11.6047 9.86617 11.6047 10.6025V12.1359C11.6047 12.7987 12.142 13.3359 12.8047 13.3359C13.4675 13.3359 14.0047 12.7995 14.0047 12.1367V5.22059C14.0047 4.86697 13.7758 4.56227 13.5258 4.31223L10.6714 1.33594M4.00472 2.00254H8.00472C8.7411 2.00254 9.33805 2.59949 9.33805 3.33587V14.0015H2.67139V3.33587C2.67139 2.59949 3.26834 2.00254 4.00472 2.00254ZM14.0047 5.33587C14.0047 6.07225 13.4078 6.66921 12.6714 6.66921C11.935 6.66921 11.3381 6.07225 11.3381 5.33587C11.3381 4.59949 11.935 4.00254 12.6714 4.00254C13.4078 4.00254 14.0047 4.59949 14.0047 5.33587Z",
    stroke: "white"
  })), _line$1 || (_line$1 = /*#__PURE__*/React__namespace.createElement("line", {
    x1: 4,
    y1: 9.99414,
    x2: 8,
    y2: 9.99414,
    stroke: "white"
  })), _line2 || (_line2 = /*#__PURE__*/React__namespace.createElement("line", {
    x1: 4,
    y1: 11.9941,
    x2: 8,
    y2: 11.9941,
    stroke: "white"
  })), _path2 || (_path2 = /*#__PURE__*/React__namespace.createElement("path", {
    d: "M4 8.16113H8",
    stroke: "white"
  })));
};

var BadgeVariant;
(function (BadgeVariant) {
    BadgeVariant["DEFAULT"] = "DEFAULT";
    BadgeVariant["NEGATIVE"] = "NEGATIVE";
    BadgeVariant["POSITIVE"] = "POSITIVE";
    BadgeVariant["PRIMARY"] = "PRIMARY";
    BadgeVariant["WARNING"] = "WARNING";
    BadgeVariant["WARNING_OUTLINE"] = "WARNING_OUTLINE";
})(BadgeVariant || (BadgeVariant = {}));
function pickBackgroundColor(variant, theme) {
    switch (variant) {
        case BadgeVariant.NEGATIVE:
            return theme.error;
        case BadgeVariant.POSITIVE:
            return theme.success;
        case BadgeVariant.PRIMARY:
            return theme.primary1;
        case BadgeVariant.WARNING:
            return theme.warning;
        case BadgeVariant.WARNING_OUTLINE:
            return 'transparent';
        default:
            return theme.bg2;
    }
}
function pickBorder(variant, theme) {
    switch (variant) {
        case BadgeVariant.WARNING_OUTLINE:
            return "1px solid " + theme.warning;
        default:
            return 'unset';
    }
}
function pickFontColor(variant, theme) {
    switch (variant) {
        case BadgeVariant.NEGATIVE:
            return polished.readableColor(theme.error);
        case BadgeVariant.POSITIVE:
            return polished.readableColor(theme.success);
        case BadgeVariant.WARNING:
            return polished.readableColor(theme.warning);
        case BadgeVariant.WARNING_OUTLINE:
            return theme.warning;
        default:
            return polished.readableColor(theme.bg2);
    }
}
var Badge = styled__default["default"].div(templateObject_1$K || (templateObject_1$K = __makeTemplateObject(["\n  align-items: center;\n  background-color: ", ";\n  border: ", ";\n  border-radius: 0.5rem;\n  color: ", ";\n  display: inline-flex;\n  padding: 4px 6px;\n  justify-content: center;\n  font-weight: 500;\n"], ["\n  align-items: center;\n  background-color: ", ";\n  border: ", ";\n  border-radius: 0.5rem;\n  color: ", ";\n  display: inline-flex;\n  padding: 4px 6px;\n  justify-content: center;\n  font-weight: 500;\n"])), function (_a) {
    var theme = _a.theme, variant = _a.variant;
    return pickBackgroundColor(variant, theme);
}, function (_a) {
    var theme = _a.theme, variant = _a.variant;
    return pickBorder(variant, theme);
}, function (_a) {
    var theme = _a.theme, variant = _a.variant;
    return pickFontColor(variant, theme);
});
var templateObject_1$K;

function safeNamehash(name) {
    if (name === undefined)
        return undefined;
    try {
        return hash.namehash(name);
    }
    catch (error) {
        console.debug(error);
        return undefined;
    }
}

/**
 * Returns true if the string value is zero in hex
 * @param hexNumberString
 */
function isZero(hexNumberString) {
    return /^0x0*$/.test(hexNumberString);
}

/**
 * Does a lookup for an ENS name to find its contenthash.
 */
function useENSContentHash(ensName) {
    var _a;
    var ensNodeArgument = React.useMemo(function () { return [ensName === null ? undefined : safeNamehash(ensName)]; }, [ensName]);
    var registrarContract = useENSRegistrarContract(false);
    var resolverAddressResult = useSingleCallResult(registrarContract, 'resolver', ensNodeArgument);
    var resolverAddress = (_a = resolverAddressResult.result) === null || _a === void 0 ? void 0 : _a[0];
    var resolverContract = useENSResolverContract(resolverAddress && isZero(resolverAddress) ? undefined : resolverAddress, false);
    var contenthash = useSingleCallResult(resolverContract, 'contenthash', ensNodeArgument);
    return React.useMemo(function () {
        var _a, _b;
        return ({
            contenthash: (_b = (_a = contenthash.result) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : null,
            loading: resolverAddressResult.loading || contenthash.loading,
        });
    }, [contenthash.loading, contenthash.result, resolverAddressResult.loading]);
}

function useHttpLocations(uri) {
    var ens = React.useMemo(function () { return (uri ? parseENSAddress(uri) : undefined); }, [uri]);
    var resolvedContentHash = useENSContentHash(ens === null || ens === void 0 ? void 0 : ens.ensName);
    return React.useMemo(function () {
        if (ens) {
            return resolvedContentHash.contenthash ? uriToHttp(contenthashToUri(resolvedContentHash.contenthash)) : [];
        }
        else {
            return uri ? uriToHttp(uri) : [];
        }
    }, [ens, resolvedContentHash.contenthash, uri]);
}

var MaticLogo = "data:image/svg+xml,%3Csvg%20width%3D%221024%22%20height%3D%221024%22%20viewBox%3D%220%200%201024%201024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%22512%22%20cy%3D%22512%22%20r%3D%22512%22%20fill%3D%22%238247E5%22%2F%3E%3Cpath%20d%3D%22M681.469%20402.456C669.189%20395.312%20653.224%20395.312%20639.716%20402.456L543.928%20457.228L478.842%20492.949L383.055%20547.721C370.774%20554.865%20354.81%20554.865%20341.301%20547.721L265.162%20504.856C252.882%20497.712%20244.286%20484.614%20244.286%20470.325V385.786C244.286%20371.498%20251.654%20358.4%20265.162%20351.256L340.073%20309.581C352.353%20302.437%20368.318%20302.437%20381.827%20309.581L456.737%20351.256C469.018%20358.4%20477.614%20371.498%20477.614%20385.786V440.558L542.7%20403.646V348.874C542.7%20334.586%20535.332%20321.488%20521.824%20314.344L383.055%20235.758C370.774%20228.614%20354.81%20228.614%20341.301%20235.758L200.076%20314.344C186.567%20321.488%20179.199%20334.586%20179.199%20348.874V507.237C179.199%20521.525%20186.567%20534.623%20200.076%20541.767L341.301%20620.353C353.582%20627.498%20369.546%20627.498%20383.055%20620.353L478.842%20566.772L543.928%20529.86L639.716%20476.279C651.996%20469.135%20667.961%20469.135%20681.469%20476.279L756.38%20517.953C768.66%20525.098%20777.257%20538.195%20777.257%20552.484V637.023C777.257%20651.312%20769.888%20664.409%20756.38%20671.553L681.469%20714.419C669.189%20721.563%20653.224%20721.563%20639.716%20714.419L564.805%20672.744C552.525%20665.6%20543.928%20652.502%20543.928%20638.214V583.442L478.842%20620.353V675.125C478.842%20689.414%20486.21%20702.512%20499.719%20709.656L640.944%20788.242C653.224%20795.386%20669.189%20795.386%20682.697%20788.242L823.922%20709.656C836.203%20702.512%20844.799%20689.414%20844.799%20675.125V516.763C844.799%20502.474%20837.431%20489.377%20823.922%20482.232L681.469%20402.456Z%22%20fill%3D%22white%22%2F%3E%3C%2Fsvg%3E";

function chainIdToNetworkName(networkId) {
    switch (networkId) {
        case SupportedChainId.MAINNET:
            return 'ethereum';
        case SupportedChainId.ARBITRUM_ONE:
            return 'arbitrum';
        case SupportedChainId.OPTIMISM:
            return 'optimism';
        default:
            return 'ethereum';
    }
}
function getNativeLogoURI(chainId) {
    if (chainId === void 0) { chainId = SupportedChainId.MAINNET; }
    switch (chainId) {
        case SupportedChainId.POLYGON_MUMBAI:
        case SupportedChainId.POLYGON:
            return MaticLogo;
        default:
            return EthereumLogo;
    }
}
function getTokenLogoURI(address, chainId) {
    if (chainId === void 0) { chainId = SupportedChainId.MAINNET; }
    var networkName = chainIdToNetworkName(chainId);
    var networksWithUrls = [SupportedChainId.ARBITRUM_ONE, SupportedChainId.MAINNET, SupportedChainId.OPTIMISM];
    if (networksWithUrls.includes(chainId)) {
        return "https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/" + networkName + "/assets/" + address + "/logo.png";
    }
}
function useCurrencyLogoURIs(currency) {
    var locations = useHttpLocations(currency instanceof WrappedTokenInfo ? currency.logoURI : undefined);
    return React.useMemo(function () {
        var logoURIs = __spreadArray([], __read(locations), false);
        if (currency) {
            if (currency.isNative) {
                logoURIs.push(getNativeLogoURI(currency.chainId));
            }
            else if (currency.isToken) {
                var logoURI = getTokenLogoURI(currency.address, currency.chainId);
                if (logoURI) {
                    logoURIs.push(logoURI);
                }
            }
        }
        return logoURIs;
    }, [currency, locations]);
}

function useTheme() {
    return React.useContext(styled.ThemeContext);
}

var BAD_SRCS = {};
/**
 * Renders an image by sequentially trying a list of URIs, and then eventually a fallback triangle alert
 */
function Logo(_a) {
    var srcs = _a.srcs, alt = _a.alt, style = _a.style, rest = __rest(_a, ["srcs", "alt", "style"]);
    var _b = __read(React.useState(0), 2), refresh = _b[1];
    var theme = useTheme();
    var src = srcs.find(function (src) { return !BAD_SRCS[src]; });
    if (src) {
        return (jsxRuntime.jsx("img", __assign({}, rest, { alt: alt, src: src, style: style, onError: function () {
                if (src)
                    BAD_SRCS[src] = true;
                refresh(function (i) { return i + 1; });
            } }), void 0));
    }
    return jsxRuntime.jsx(reactFeather.Slash, __assign({}, rest, { style: __assign(__assign({}, style), { color: theme.bg4 }) }), void 0);
}

var StyledLogo$1 = styled__default["default"](Logo)(templateObject_1$J || (templateObject_1$J = __makeTemplateObject(["\n  width: ", ";\n  height: ", ";\n  background: radial-gradient(white 50%, #ffffff00 calc(75% + 1px), #ffffff00 100%);\n  border-radius: 50%;\n  -mox-box-shadow: 0 0 1px ", ";\n  -webkit-box-shadow: 0 0 1px ", ";\n  box-shadow: 0 0 1px ", ";\n  border: 0px solid rgba(255, 255, 255, 0);\n"], ["\n  width: ", ";\n  height: ", ";\n  background: radial-gradient(white 50%, #ffffff00 calc(75% + 1px), #ffffff00 100%);\n  border-radius: 50%;\n  -mox-box-shadow: 0 0 1px ", ";\n  -webkit-box-shadow: 0 0 1px ", ";\n  box-shadow: 0 0 1px ", ";\n  border: 0px solid rgba(255, 255, 255, 0);\n"])), function (_a) {
    var size = _a.size;
    return size;
}, function (_a) {
    var size = _a.size;
    return size;
}, function (_a) {
    var native = _a.native;
    return (native ? 'white' : 'black');
}, function (_a) {
    var native = _a.native;
    return (native ? 'white' : 'black');
}, function (_a) {
    var native = _a.native;
    return (native ? 'white' : 'black');
});
function CurrencyLogo(_a) {
    var _b, _c;
    var currency = _a.currency, _d = _a.size, size = _d === void 0 ? '24px' : _d, style = _a.style, rest = __rest(_a, ["currency", "size", "style"]);
    var logoURIs = useCurrencyLogoURIs(currency);
    return (jsxRuntime.jsx(StyledLogo$1, __assign({ size: size, native: (_b = currency === null || currency === void 0 ? void 0 : currency.isNative) !== null && _b !== void 0 ? _b : false, srcs: logoURIs, alt: ((_c = currency === null || currency === void 0 ? void 0 : currency.symbol) !== null && _c !== void 0 ? _c : 'token') + " logo", style: style }, rest), void 0));
}
var templateObject_1$J;

var Wrapper$c = styled__default["default"].div(templateObject_1$I || (templateObject_1$I = __makeTemplateObject(["\n  position: relative;\n  display: flex;\n  flex-direction: row;\n  margin-left: ", ";\n"], ["\n  position: relative;\n  display: flex;\n  flex-direction: row;\n  margin-left: ", ";\n"])), function (_a) {
    var sizeraw = _a.sizeraw, margin = _a.margin;
    return margin && (sizeraw / 3 + 8).toString() + 'px';
});
var HigherLogo = styled__default["default"](CurrencyLogo)(templateObject_2$v || (templateObject_2$v = __makeTemplateObject(["\n  z-index: 2;\n"], ["\n  z-index: 2;\n"])));
var CoveredLogo = styled__default["default"](CurrencyLogo)(templateObject_3$o || (templateObject_3$o = __makeTemplateObject(["\n  position: absolute;\n  left: ", " !important;\n"], ["\n  position: absolute;\n  left: ", " !important;\n"])), function (_a) {
    var sizeraw = _a.sizeraw;
    return '-' + (sizeraw / 2).toString() + 'px';
});
function DoubleCurrencyLogo(_a) {
    var currency0 = _a.currency0, currency1 = _a.currency1, _b = _a.size, size = _b === void 0 ? 16 : _b, _c = _a.margin, margin = _c === void 0 ? false : _c;
    return (jsxRuntime.jsxs(Wrapper$c, __assign({ sizeraw: size, margin: margin }, { children: [currency0 && jsxRuntime.jsx(HigherLogo, { currency: currency0, size: size.toString() + 'px' }, void 0), currency1 && jsxRuntime.jsx(CoveredLogo, { currency: currency1, size: size.toString() + 'px', sizeraw: size }, void 0)] }), void 0));
}
var templateObject_1$I, templateObject_2$v, templateObject_3$o;

/**
 * Returns a WrappedTokenInfo from the active token lists when possible,
 * or the passed token otherwise. */
function useTokenInfoFromActiveList(currency) {
    var chainId = useActiveWeb3React().chainId;
    var activeList = useCombinedActiveList();
    return React.useMemo(function () {
        if (!chainId)
            return;
        if (currency.isNative)
            return currency;
        try {
            return activeList[chainId][currency.wrapped.address].token;
        }
        catch (e) {
            return currency;
        }
    }, [activeList, chainId, currency]);
}

var _line;

function _extends$3() { _extends$3 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends$3.apply(this, arguments); }

var SvgDotLine = function SvgDotLine(props) {
  return /*#__PURE__*/React__namespace.createElement("svg", _extends$3({
    width: "100%",
    height: 35,
    viewBox: "800 0 300 200",
    xmlns: "http://www.w3.org/2000/svg"
  }, props), _line || (_line = /*#__PURE__*/React__namespace.createElement("line", {
    x1: 0,
    x2: 2000,
    y1: 100,
    y2: 100,
    stroke: "currentColor",
    strokeWidth: 20,
    strokeLinecap: "round",
    strokeDasharray: "1, 45"
  })));
};

var Wrapper$b = styled__default["default"](rebass.Box)(templateObject_1$H || (templateObject_1$H = __makeTemplateObject(["\n  align-items: center;\n  width: 100%;\n"], ["\n  align-items: center;\n  width: 100%;\n"])));
var RouteContainerRow = styled__default["default"](Row)(templateObject_2$u || (templateObject_2$u = __makeTemplateObject(["\n  display: grid;\n  grid-template-columns: 24px 1fr 24px;\n"], ["\n  display: grid;\n  grid-template-columns: 24px 1fr 24px;\n"])));
var RouteRow = styled__default["default"](Row)(templateObject_3$n || (templateObject_3$n = __makeTemplateObject(["\n  align-items: center;\n  display: flex;\n  justify-content: center;\n  padding: 0.1rem 0.5rem;\n  position: relative;\n"], ["\n  align-items: center;\n  display: flex;\n  justify-content: center;\n  padding: 0.1rem 0.5rem;\n  position: relative;\n"])));
var PoolBadge = styled__default["default"](Badge)(templateObject_4$f || (templateObject_4$f = __makeTemplateObject(["\n  display: flex;\n  padding: 4px 4px;\n"], ["\n  display: flex;\n  padding: 4px 4px;\n"])));
var DottedLine = styled__default["default"].div(templateObject_5$d || (templateObject_5$d = __makeTemplateObject(["\n  display: flex;\n  align-items: center;\n  position: absolute;\n  width: calc(100%);\n  z-index: 1;\n  opacity: 0.5;\n"], ["\n  display: flex;\n  align-items: center;\n  position: absolute;\n  width: calc(100%);\n  z-index: 1;\n  opacity: 0.5;\n"])));
var DotColor = styled__default["default"](SvgDotLine)(templateObject_6$9 || (templateObject_6$9 = __makeTemplateObject(["\n  path {\n    stroke: ", ";\n  }\n"], ["\n  path {\n    stroke: ", ";\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg4;
});
var OpaqueBadge = styled__default["default"](Badge)(templateObject_7$8 || (templateObject_7$8 = __makeTemplateObject(["\n  background-color: ", ";\n  border-radius: 8px;\n  display: grid;\n  font-size: 12px;\n  grid-gap: 4px;\n  grid-auto-flow: column;\n  justify-content: start;\n  padding: 4px 6px 4px 4px;\n  z-index: ", ";\n"], ["\n  background-color: ", ";\n  border-radius: 8px;\n  display: grid;\n  font-size: 12px;\n  grid-gap: 4px;\n  grid-auto-flow: column;\n  justify-content: start;\n  padding: 4px 6px 4px 4px;\n  z-index: ", ";\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg2;
}, Z_INDEX.sticky);
var ProtocolBadge = styled__default["default"](Badge)(templateObject_8$5 || (templateObject_8$5 = __makeTemplateObject(["\n  background-color: ", ";\n  border-radius: 4px;\n  color: ", ";\n  font-size: 10px;\n  padding: 2px 4px;\n  z-index: ", ";\n"], ["\n  background-color: ", ";\n  border-radius: 4px;\n  color: ", ";\n  font-size: 10px;\n  padding: 2px 4px;\n  z-index: ", ";\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg3;
}, function (_a) {
    var theme = _a.theme;
    return theme.text2;
}, Z_INDEX.sticky + 1);
var BadgeText = styled__default["default"](ThemedText.Small)(templateObject_9$5 || (templateObject_9$5 = __makeTemplateObject(["\n  word-break: normal;\n"], ["\n  word-break: normal;\n"])));
function RoutingDiagram(_a) {
    var currencyIn = _a.currencyIn, currencyOut = _a.currencyOut, routes = _a.routes;
    var tokenIn = useTokenInfoFromActiveList(currencyIn);
    var tokenOut = useTokenInfoFromActiveList(currencyOut);
    return (jsxRuntime.jsx(Wrapper$b, { children: routes.map(function (entry, index) { return (jsxRuntime.jsxs(RouteContainerRow, { children: [jsxRuntime.jsx(CurrencyLogo, { currency: tokenIn, size: '20px' }, void 0), jsxRuntime.jsx(Route, { entry: entry }, void 0), jsxRuntime.jsx(CurrencyLogo, { currency: tokenOut, size: '20px' }, void 0)] }, index)); }) }, void 0));
}
function Route(_a) {
    var _b = _a.entry, percent = _b.percent, path = _b.path, protocol = _b.protocol;
    return (jsxRuntime.jsxs(RouteRow, { children: [jsxRuntime.jsx(DottedLine, { children: jsxRuntime.jsx(DotColor, {}, void 0) }, void 0), jsxRuntime.jsxs(OpaqueBadge, { children: [jsxRuntime.jsx(ProtocolBadge, { children: jsxRuntime.jsx(BadgeText, __assign({ fontSize: 12 }, { children: protocol.toUpperCase() }), void 0) }, void 0), jsxRuntime.jsxs(BadgeText, __assign({ fontSize: 14, style: { minWidth: 'auto' } }, { children: [percent.toSignificant(2), "%"] }), void 0)] }, void 0), jsxRuntime.jsx(AutoRow, __assign({ gap: "1px", width: "100%", style: { justifyContent: 'space-evenly', zIndex: 2 } }, { children: path.map(function (_a, index) {
                    var _b = __read(_a, 3), currency0 = _b[0], currency1 = _b[1], feeAmount = _b[2];
                    return (jsxRuntime.jsx(Pool, { currency0: currency0, currency1: currency1, feeAmount: feeAmount }, index));
                }) }), void 0)] }, void 0));
}
function Pool(_a) {
    var currency0 = _a.currency0, currency1 = _a.currency1, feeAmount = _a.feeAmount;
    var tokenInfo0 = useTokenInfoFromActiveList(currency0);
    var tokenInfo1 = useTokenInfoFromActiveList(currency1);
    // TODO - link pool icon to info.uniswap.org via query params
    return (jsxRuntime.jsx(MouseoverTooltip, __assign({ text: jsxRuntime.jsxs(macro.Trans, { children: [(tokenInfo0 === null || tokenInfo0 === void 0 ? void 0 : tokenInfo0.symbol) + '/' + (tokenInfo1 === null || tokenInfo1 === void 0 ? void 0 : tokenInfo1.symbol) + ' ' + feeAmount / 10000, "% pool"] }, void 0) }, { children: jsxRuntime.jsxs(PoolBadge, { children: [jsxRuntime.jsx(rebass.Box, __assign({ margin: "0 4px 0 12px" }, { children: jsxRuntime.jsx(DoubleCurrencyLogo, { currency0: tokenInfo1, currency1: tokenInfo0, size: 20 }, void 0) }), void 0), jsxRuntime.jsxs(ThemedText.Small, __assign({ fontSize: 14 }, { children: [feeAmount / 10000, "%"] }), void 0)] }, void 0) }), void 0));
}
var templateObject_1$H, templateObject_2$u, templateObject_3$n, templateObject_4$f, templateObject_5$d, templateObject_6$9, templateObject_7$8, templateObject_8$5, templateObject_9$5;

var AUTO_ROUTER_SUPPORTED_CHAINS = Object.values(smartOrderRouter.ChainId);

function useAutoRouterSupported() {
    var chainId = useActiveWeb3React().chainId;
    return Boolean(chainId && AUTO_ROUTER_SUPPORTED_CHAINS.includes(chainId));
}

var _defs, _path$2;

function _extends$2() { _extends$2 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends$2.apply(this, arguments); }

var SvgAutoRouter = function SvgAutoRouter(props) {
  return /*#__PURE__*/React__namespace.createElement("svg", _extends$2({
    width: 23,
    height: 20,
    viewBox: "0 0 23 20",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, props), _defs || (_defs = /*#__PURE__*/React__namespace.createElement("defs", null, /*#__PURE__*/React__namespace.createElement("linearGradient", {
    id: "gradient1",
    x1: 0,
    y1: 0,
    x2: 1,
    y2: 0,
    gradientTransform: "rotate(95)"
  }, /*#__PURE__*/React__namespace.createElement("stop", {
    id: "stop1",
    offset: 0,
    stopColor: "#2274E2"
  }), /*#__PURE__*/React__namespace.createElement("stop", {
    id: "stop1",
    offset: 0.5,
    stopColor: "#2274E2"
  }), /*#__PURE__*/React__namespace.createElement("stop", {
    id: "stop2",
    offset: 1,
    stopColor: "#3FB672"
  })))), _path$2 || (_path$2 = /*#__PURE__*/React__namespace.createElement("path", {
    d: "M16 16C10 16 9 10 5 10M16 16C16 17.6569 17.3431 19 19 19C20.6569 19 22 17.6569 22 16C22 14.3431 20.6569 13 19 13C17.3431 13 16 14.3431 16 16ZM5 10C9 10 10 4 16 4M5 10H1.5M16 4C16 5.65685 17.3431 7 19 7C20.6569 7 22 5.65685 22 4C22 2.34315 20.6569 1 19 1C17.3431 1 16 2.34315 16 4Z",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    stroke: "url(#gradient1)"
  })));
};

var _path$1;

function _extends$1() { _extends$1 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends$1.apply(this, arguments); }

var SvgStaticRoute = function SvgStaticRoute(props) {
  return /*#__PURE__*/React__namespace.createElement("svg", _extends$1({
    width: 20,
    height: 20,
    viewBox: "0 0 20 22",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, props), _path$1 || (_path$1 = /*#__PURE__*/React__namespace.createElement("path", {
    d: "M19 18C19 18.5523 18.5523 19 18 19V21C19.6569 21 21 19.6569 21 18H19ZM18 19C17.4477 19 17 18.5523 17 18H15C15 19.6569 16.3431 21 18 21V19ZM17 18C17 17.4477 17.4477 17 18 17V15C16.3431 15 15 16.3431 15 18H17ZM18 17C18.5523 17 19 17.4477 19 18H21C21 16.3431 19.6569 15 18 15V17ZM8 7H16V5H8V7ZM16 11H8V13H16V11ZM8 19H16V17H8V19ZM4 15C4 17.2091 5.79086 19 8 19V17C6.89543 17 6 16.1046 6 15H4ZM8 11C5.79086 11 4 12.7909 4 15H6C6 13.8954 6.89543 13 8 13V11ZM18 9C18 10.1046 17.1046 11 16 11V13C18.2091 13 20 11.2091 20 9H18ZM16 7C17.1046 7 18 7.89543 18 9H20C20 6.79086 18.2091 5 16 5V7ZM7 6C7 6.55228 6.55228 7 6 7V9C7.65685 9 9 7.65685 9 6H7ZM6 7C5.44772 7 5 6.55228 5 6H3C3 7.65685 4.34315 9 6 9V7ZM5 6C5 5.44772 5.44772 5 6 5V3C4.34315 3 3 4.34315 3 6H5ZM6 5C6.55228 5 7 5.44772 7 6H9C9 4.34315 7.65685 3 6 3V5Z"
  })));
};

var StyledAutoRouterIcon = styled__default["default"](SvgAutoRouter)(templateObject_1$G || (templateObject_1$G = __makeTemplateObject(["\n  height: 16px;\n  width: 16px;\n\n  :hover {\n    filter: brightness(1.3);\n  }\n"], ["\n  height: 16px;\n  width: 16px;\n\n  :hover {\n    filter: brightness(1.3);\n  }\n"])));
var StyledStaticRouterIcon = styled__default["default"](SvgStaticRoute)(templateObject_2$t || (templateObject_2$t = __makeTemplateObject(["\n  height: 16px;\n  width: 16px;\n\n  fill: ", ";\n\n  :hover {\n    filter: brightness(1.3);\n  }\n"], ["\n  height: 16px;\n  width: 16px;\n\n  fill: ", ";\n\n  :hover {\n    filter: brightness(1.3);\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.text3;
});
var StyledAutoRouterLabel = styled__default["default"](ThemedText.Black)(templateObject_3$m || (templateObject_3$m = __makeTemplateObject(["\n  line-height: 1rem;\n\n  /* fallback color */\n  color: ", ";\n\n  @supports (-webkit-background-clip: text) and (-webkit-text-fill-color: transparent) {\n    background-image: linear-gradient(90deg, #2172e5 0%, #54e521 163.16%);\n    -webkit-background-clip: text;\n    -webkit-text-fill-color: transparent;\n  }\n"], ["\n  line-height: 1rem;\n\n  /* fallback color */\n  color: ", ";\n\n  @supports (-webkit-background-clip: text) and (-webkit-text-fill-color: transparent) {\n    background-image: linear-gradient(90deg, #2172e5 0%, #54e521 163.16%);\n    -webkit-background-clip: text;\n    -webkit-text-fill-color: transparent;\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.green1;
});
function AutoRouterLogo() {
    var autoRouterSupported = useAutoRouterSupported();
    return autoRouterSupported ? jsxRuntime.jsx(StyledAutoRouterIcon, {}, void 0) : jsxRuntime.jsx(StyledStaticRouterIcon, {}, void 0);
}
function AutoRouterLabel() {
    var autoRouterSupported = useAutoRouterSupported();
    return autoRouterSupported ? (jsxRuntime.jsx(StyledAutoRouterLabel, __assign({ fontSize: 14 }, { children: "Auto Router" }), void 0)) : (jsxRuntime.jsx(ThemedText.Black, __assign({ fontSize: 14 }, { children: jsxRuntime.jsx(macro.Trans, { children: "Trade Route" }, void 0) }), void 0));
}
var templateObject_1$G, templateObject_2$t, templateObject_3$m;

var Wrapper$a = styled__default["default"](AutoColumn)(templateObject_1$F || (templateObject_1$F = __makeTemplateObject(["\n  padding: ", ";\n  border-radius: 16px;\n  border: 1px solid ", ";\n  cursor: pointer;\n"], ["\n  padding: ", ";\n  border-radius: 16px;\n  border: 1px solid ", ";\n  cursor: pointer;\n"])), function (_a) {
    var fixedOpen = _a.fixedOpen;
    return (fixedOpen ? '12px' : '12px 8px 12px 12px');
}, function (_a) {
    var theme = _a.theme, fixedOpen = _a.fixedOpen;
    return (fixedOpen ? 'transparent' : theme.bg2);
});
var OpenCloseIcon = styled__default["default"](reactFeather.Plus)(templateObject_2$s || (templateObject_2$s = __makeTemplateObject(["\n  margin-left: 8px;\n  height: 20px;\n  stroke-width: 2px;\n  transition: transform 0.1s;\n  transform: ", ";\n  stroke: ", ";\n  cursor: pointer;\n  :hover {\n    opacity: 0.8;\n  }\n"], ["\n  margin-left: 8px;\n  height: 20px;\n  stroke-width: 2px;\n  transition: transform 0.1s;\n  transform: ", ";\n  stroke: ", ";\n  cursor: pointer;\n  :hover {\n    opacity: 0.8;\n  }\n"])), function (_a) {
    var open = _a.open;
    return (open ? 'rotate(45deg)' : 'none');
}, function (_a) {
    var theme = _a.theme;
    return theme.text3;
});
var V2_DEFAULT_FEE_TIER = 3000;
var SwapRoute = React.memo(function SwapRoute(_a) {
    var trade = _a.trade, syncing = _a.syncing, _b = _a.fixedOpen, fixedOpen = _b === void 0 ? false : _b, rest = __rest(_a, ["trade", "syncing", "fixedOpen"]);
    var autoRouterSupported = useAutoRouterSupported();
    var routes = getTokenPath(trade);
    var _c = __read(React.useState(false), 2), open = _c[0], setOpen = _c[1];
    var chainId = useActiveWeb3React().chainId;
    var _d = __read(useDarkModeManager(), 1), darkMode = _d[0];
    var formattedGasPriceString = (trade === null || trade === void 0 ? void 0 : trade.gasUseEstimateUSD)
        ? trade.gasUseEstimateUSD.toFixed(2) === '0.00'
            ? '<$0.01'
            : '$' + trade.gasUseEstimateUSD.toFixed(2)
        : undefined;
    return (jsxRuntime.jsxs(Wrapper$a, __assign({}, rest, { darkMode: darkMode, fixedOpen: fixedOpen }, { children: [jsxRuntime.jsxs(RowBetween, __assign({ onClick: function () { return setOpen(!open); } }, { children: [jsxRuntime.jsxs(AutoRow, __assign({ gap: "4px", width: "auto" }, { children: [jsxRuntime.jsx(AutoRouterLogo, {}, void 0), jsxRuntime.jsx(AutoRouterLabel, {}, void 0)] }), void 0), fixedOpen ? null : jsxRuntime.jsx(OpenCloseIcon, { open: open }, void 0)] }), void 0), jsxRuntime.jsx(AnimatedDropdown, __assign({ open: open || fixedOpen }, { children: jsxRuntime.jsxs(AutoRow, __assign({ gap: "4px", width: "auto", style: { paddingTop: '12px', margin: 0 } }, { children: [syncing ? (jsxRuntime.jsx(LoadingRows, { children: jsxRuntime.jsx("div", { style: { width: '400px', height: '30px' } }, void 0) }, void 0)) : (jsxRuntime.jsx(RoutingDiagram, { currencyIn: trade.inputAmount.currency, currencyOut: trade.outputAmount.currency, routes: routes }, void 0)), autoRouterSupported && (jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [jsxRuntime.jsx(Separator$1, {}, void 0), syncing ? (jsxRuntime.jsx(LoadingRows, { children: jsxRuntime.jsx("div", { style: { width: '250px', height: '15px' } }, void 0) }, void 0)) : (jsxRuntime.jsxs(ThemedText.Main, __assign({ fontSize: 12, width: 400, margin: 0 }, { children: [(trade === null || trade === void 0 ? void 0 : trade.gasUseEstimateUSD) && chainId && SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(chainId) ? (jsxRuntime.jsxs(macro.Trans, { children: ["Best price route costs ~", formattedGasPriceString, " in gas. "] }, void 0)) : null, ' ', jsxRuntime.jsx(macro.Trans, { children: "This route optimizes your total output by considering split routes, multiple hops, and the gas cost of each step." }, void 0)] }), void 0))] }, void 0))] }), void 0) }), void 0)] }), void 0));
});
function getTokenPath(trade) {
    return trade.swaps.map(function (_a) {
        var _b = _a.route, tokenPath = _b.path, pools = _b.pools, protocol = _b.protocol, inputAmount = _a.inputAmount, outputAmount = _a.outputAmount;
        var portion = trade.tradeType === sdkCore.TradeType.EXACT_INPUT
            ? inputAmount.divide(trade.inputAmount)
            : outputAmount.divide(trade.outputAmount);
        var percent = new sdkCore.Percent(portion.numerator, portion.denominator);
        var path = [];
        for (var i = 0; i < pools.length; i++) {
            var nextPool = pools[i];
            var tokenIn = tokenPath[i];
            var tokenOut = tokenPath[i + 1];
            var entry = [
                tokenIn,
                tokenOut,
                nextPool instanceof v2Sdk.Pair ? V2_DEFAULT_FEE_TIER : nextPool.fee,
            ];
            path.push(entry);
        }
        return {
            percent: percent,
            path: path,
            protocol: protocol,
        };
    });
}
var templateObject_1$F, templateObject_2$s;

var GasWrapper = styled__default["default"](RowFixed)(templateObject_1$E || (templateObject_1$E = __makeTemplateObject(["\n  border-radius: 8px;\n  padding: 4px 6px;\n  height: 24px;\n  color: ", ";\n  background-color: ", ";\n  font-size: 14px;\n  font-weight: 500;\n  user-select: none;\n"], ["\n  border-radius: 8px;\n  padding: 4px 6px;\n  height: 24px;\n  color: ", ";\n  background-color: ", ";\n  font-size: 14px;\n  font-weight: 500;\n  user-select: none;\n"])), function (_a) {
    var theme = _a.theme;
    return theme.text3;
}, function (_a) {
    var theme = _a.theme;
    return theme.bg1;
});
var StyledGasIcon = styled__default["default"](SvgGasIcon)(templateObject_2$r || (templateObject_2$r = __makeTemplateObject(["\n  margin-right: 4px;\n  height: 14px;\n  & > * {\n    stroke: ", ";\n  }\n"], ["\n  margin-right: 4px;\n  height: 14px;\n  & > * {\n    stroke: ", ";\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.text3;
});
function GasEstimateBadge(_a) {
    var _b;
    var trade = _a.trade, loading = _a.loading, showRoute = _a.showRoute, disableHover = _a.disableHover;
    var formattedGasPriceString = (trade === null || trade === void 0 ? void 0 : trade.gasUseEstimateUSD)
        ? trade.gasUseEstimateUSD.toFixed(2) === '0.00'
            ? '<$0.01'
            : '$' + trade.gasUseEstimateUSD.toFixed(2)
        : undefined;
    return (jsxRuntime.jsx(MouseoverTooltipContent, __assign({ wrap: false, disableHover: disableHover, content: loading ? null : (jsxRuntime.jsx(ResponsiveTooltipContainer, __assign({ origin: "top right", style: {
                padding: showRoute ? '0' : '12px',
                border: 'none',
                borderRadius: showRoute ? '16px' : '12px',
                maxWidth: '400px',
            } }, { children: showRoute ? (trade ? (jsxRuntime.jsx(SwapRoute, { trade: trade, syncing: loading, fixedOpen: showRoute }, void 0)) : null) : (jsxRuntime.jsxs(AutoColumn, __assign({ gap: "4px", justify: "center" }, { children: [jsxRuntime.jsx(ThemedText.Main, __assign({ fontSize: "12px", textAlign: "center" }, { children: jsxRuntime.jsx(macro.Trans, { children: "Estimated network fee" }, void 0) }), void 0), jsxRuntime.jsx(ThemedText.Body, __assign({ textAlign: "center", fontWeight: 500, style: { userSelect: 'none' } }, { children: jsxRuntime.jsxs(macro.Trans, { children: ["$", (_b = trade === null || trade === void 0 ? void 0 : trade.gasUseEstimateUSD) === null || _b === void 0 ? void 0 : _b.toFixed(2)] }, void 0) }), void 0), jsxRuntime.jsx(ThemedText.Main, __assign({ fontSize: "10px", textAlign: "center", maxWidth: "140px", color: "text3" }, { children: jsxRuntime.jsx(macro.Trans, { children: "Estimate may differ due to your wallet gas settings" }, void 0) }), void 0)] }), void 0)) }), void 0)), placement: "bottom", onOpen: function () {
            return ReactGA__default["default"].event({
                category: 'Gas',
                action: 'Gas Details Tooltip Open',
            });
        } }, { children: jsxRuntime.jsx(LoadingOpacityContainer, __assign({ "$loading": loading }, { children: jsxRuntime.jsxs(GasWrapper, { children: [jsxRuntime.jsx(StyledGasIcon, {}, void 0), formattedGasPriceString !== null && formattedGasPriceString !== void 0 ? formattedGasPriceString : null] }, void 0) }), void 0) }), void 0));
}
var templateObject_1$E, templateObject_2$r;

var Wrapper$9 = styled__default["default"](Row)(templateObject_1$D || (templateObject_1$D = __makeTemplateObject(["\n  width: 100%;\n  justify-content: center;\n"], ["\n  width: 100%;\n  justify-content: center;\n"])));
var StyledInfoIcon = styled__default["default"](reactFeather.Info)(templateObject_2$q || (templateObject_2$q = __makeTemplateObject(["\n  height: 16px;\n  width: 16px;\n  margin-right: 4px;\n  color: ", ";\n"], ["\n  height: 16px;\n  width: 16px;\n  margin-right: 4px;\n  color: ", ";\n"])), function (_a) {
    var theme = _a.theme;
    return theme.text3;
});
var StyledCard = styled__default["default"](OutlineCard)(templateObject_3$l || (templateObject_3$l = __makeTemplateObject(["\n  padding: 12px;\n  border: 1px solid ", ";\n"], ["\n  padding: 12px;\n  border: 1px solid ", ";\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg2;
});
var StyledHeaderRow = styled__default["default"](RowBetween)(templateObject_4$e || (templateObject_4$e = __makeTemplateObject(["\n  padding: 4px 8px;\n  border-radius: 12px;\n  background-color: ", ";\n  align-items: center;\n  cursor: ", ";\n  min-height: 40px;\n\n  :hover {\n    background-color: ", ";\n  }\n"], ["\n  padding: 4px 8px;\n  border-radius: 12px;\n  background-color: ", ";\n  align-items: center;\n  cursor: ", ";\n  min-height: 40px;\n\n  :hover {\n    background-color: ", ";\n  }\n"])), function (_a) {
    var open = _a.open, theme = _a.theme;
    return (open ? theme.bg1 : 'transparent');
}, function (_a) {
    var disabled = _a.disabled;
    return (disabled ? 'initial' : 'pointer');
}, function (_a) {
    var theme = _a.theme, disabled = _a.disabled;
    return (disabled ? theme.bg1 : polished.darken(0.015, theme.bg1));
});
var RotatingArrow = styled__default["default"](reactFeather.ChevronDown)(templateObject_5$c || (templateObject_5$c = __makeTemplateObject(["\n  transform: ", ";\n  transition: transform 0.1s linear;\n"], ["\n  transform: ", ";\n  transition: transform 0.1s linear;\n"])), function (_a) {
    var open = _a.open;
    return (open ? 'rotate(180deg)' : 'none');
});
var StyledPolling = styled__default["default"].div(templateObject_7$7 || (templateObject_7$7 = __makeTemplateObject(["\n  display: flex;\n  height: 16px;\n  width: 16px;\n  margin-right: 2px;\n  margin-left: 10px;\n  align-items: center;\n  color: ", ";\n  transition: 250ms ease color;\n\n  ", "\n"], ["\n  display: flex;\n  height: 16px;\n  width: 16px;\n  margin-right: 2px;\n  margin-left: 10px;\n  align-items: center;\n  color: ", ";\n  transition: 250ms ease color;\n\n  ", "\n"])), function (_a) {
    var theme = _a.theme;
    return theme.text1;
}, function (_a) {
    var theme = _a.theme;
    return theme.mediaWidth.upToMedium(templateObject_6$8 || (templateObject_6$8 = __makeTemplateObject(["\n    display: none;\n  "], ["\n    display: none;\n  "])));
});
var StyledPollingDot = styled__default["default"].div(templateObject_8$4 || (templateObject_8$4 = __makeTemplateObject(["\n  width: 8px;\n  height: 8px;\n  min-height: 8px;\n  min-width: 8px;\n  border-radius: 50%;\n  position: relative;\n  background-color: ", ";\n  transition: 250ms ease background-color;\n"], ["\n  width: 8px;\n  height: 8px;\n  min-height: 8px;\n  min-width: 8px;\n  border-radius: 50%;\n  position: relative;\n  background-color: ", ";\n  transition: 250ms ease background-color;\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg2;
});
var rotate360 = styled.keyframes(templateObject_9$4 || (templateObject_9$4 = __makeTemplateObject(["\n  from {\n    transform: rotate(0deg);\n  }\n  to {\n    transform: rotate(360deg);\n  }\n"], ["\n  from {\n    transform: rotate(0deg);\n  }\n  to {\n    transform: rotate(360deg);\n  }\n"])));
var Spinner = styled__default["default"].div(templateObject_10$4 || (templateObject_10$4 = __makeTemplateObject(["\n  animation: ", " 1s cubic-bezier(0.83, 0, 0.17, 1) infinite;\n  transform: translateZ(0);\n  border-top: 1px solid transparent;\n  border-right: 1px solid transparent;\n  border-bottom: 1px solid transparent;\n  border-left: 2px solid ", ";\n  background: transparent;\n  width: 14px;\n  height: 14px;\n  border-radius: 50%;\n  position: relative;\n  transition: 250ms ease border-color;\n  left: -3px;\n  top: -3px;\n"], ["\n  animation: ", " 1s cubic-bezier(0.83, 0, 0.17, 1) infinite;\n  transform: translateZ(0);\n  border-top: 1px solid transparent;\n  border-right: 1px solid transparent;\n  border-bottom: 1px solid transparent;\n  border-left: 2px solid ", ";\n  background: transparent;\n  width: 14px;\n  height: 14px;\n  border-radius: 50%;\n  position: relative;\n  transition: 250ms ease border-color;\n  left: -3px;\n  top: -3px;\n"])), rotate360, function (_a) {
    var theme = _a.theme;
    return theme.text1;
});
function SwapDetailsDropdown(_a) {
    var trade = _a.trade, syncing = _a.syncing, loading = _a.loading, showInverted = _a.showInverted, setShowInverted = _a.setShowInverted, allowedSlippage = _a.allowedSlippage;
    var theme = styled.useTheme();
    var chainId = useActiveWeb3React().chainId;
    var _b = __read(React.useState(false), 2), showDetails = _b[0], setShowDetails = _b[1];
    return (jsxRuntime.jsx(Wrapper$9, { children: jsxRuntime.jsxs(AutoColumn, __assign({ gap: '8px', style: { width: '100%', marginBottom: '-8px' } }, { children: [jsxRuntime.jsxs(StyledHeaderRow, __assign({ onClick: function () { return setShowDetails(!showDetails); }, disabled: !trade, open: showDetails }, { children: [jsxRuntime.jsxs(RowFixed, __assign({ style: { position: 'relative' } }, { children: [loading || syncing ? (jsxRuntime.jsx(StyledPolling, { children: jsxRuntime.jsx(StyledPollingDot, { children: jsxRuntime.jsx(Spinner, {}, void 0) }, void 0) }, void 0)) : (jsxRuntime.jsx(HideSmall, { children: jsxRuntime.jsx(MouseoverTooltipContent, __assign({ wrap: false, content: jsxRuntime.jsx(ResponsiveTooltipContainer, __assign({ origin: "top right", style: { padding: '0' } }, { children: jsxRuntime.jsx(Card, __assign({ padding: "12px" }, { children: jsxRuntime.jsx(AdvancedSwapDetails, { trade: trade, allowedSlippage: allowedSlippage, syncing: syncing }, void 0) }), void 0) }), void 0), placement: "bottom", disableHover: showDetails }, { children: jsxRuntime.jsx(StyledInfoIcon, { color: trade ? theme.text3 : theme.bg3 }, void 0) }), void 0) }, void 0)), trade ? (jsxRuntime.jsx(LoadingOpacityContainer, __assign({ "$loading": syncing }, { children: jsxRuntime.jsx(TradePrice, { price: trade.executionPrice, showInverted: showInverted, setShowInverted: setShowInverted }, void 0) }), void 0)) : loading || syncing ? (jsxRuntime.jsx(ThemedText.Main, __assign({ fontSize: 14 }, { children: jsxRuntime.jsx(macro.Trans, { children: "Fetching best price..." }, void 0) }), void 0)) : null] }), void 0), jsxRuntime.jsxs(RowFixed, { children: [!(trade === null || trade === void 0 ? void 0 : trade.gasUseEstimateUSD) ||
                                    showDetails ||
                                    !chainId ||
                                    !SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(chainId) ? null : (jsxRuntime.jsx(GasEstimateBadge, { trade: trade, loading: syncing || loading, showRoute: !showDetails, disableHover: showDetails }, void 0)), jsxRuntime.jsx(RotatingArrow, { stroke: trade ? theme.text3 : theme.bg3, open: Boolean(trade && showDetails) }, void 0)] }, void 0)] }), void 0), jsxRuntime.jsx(AnimatedDropdown, __assign({ open: showDetails }, { children: jsxRuntime.jsxs(AutoColumn, __assign({ gap: '8px', style: { padding: '0', paddingBottom: '8px' } }, { children: [trade ? (jsxRuntime.jsx(StyledCard, { children: jsxRuntime.jsx(AdvancedSwapDetails, { trade: trade, allowedSlippage: allowedSlippage, syncing: syncing }, void 0) }, void 0)) : null, trade ? jsxRuntime.jsx(SwapRoute, { trade: trade, syncing: syncing }, void 0) : null] }), void 0) }), void 0)] }), void 0) }, void 0));
}
var templateObject_1$D, templateObject_2$q, templateObject_3$l, templateObject_4$e, templateObject_5$c, templateObject_6$8, templateObject_7$7, templateObject_8$4, templateObject_9$4, templateObject_10$4;

var BaseButton = styled__default["default"](styledComponents.Button)(templateObject_1$C || (templateObject_1$C = __makeTemplateObject(["\n  padding: ", ";\n  width: ", ";\n  font-weight: 500;\n  text-align: center;\n  border-radius: ", ";\n  outline: none;\n  border: 1px solid transparent;\n  color: ", ";\n  text-decoration: none;\n  display: flex;\n  justify-content: center;\n  flex-wrap: nowrap;\n  align-items: center;\n  cursor: pointer;\n  position: relative;\n  z-index: 1;\n  &:disabled {\n    opacity: 50%;\n    cursor: auto;\n    pointer-events: none;\n  }\n\n  will-change: transform;\n  transition: transform 450ms ease;\n  transform: perspective(1px) translateZ(0);\n\n  > * {\n    user-select: none;\n  }\n\n  > a {\n    text-decoration: none;\n  }\n"], ["\n  padding: ", ";\n  width: ", ";\n  font-weight: 500;\n  text-align: center;\n  border-radius: ", ";\n  outline: none;\n  border: 1px solid transparent;\n  color: ", ";\n  text-decoration: none;\n  display: flex;\n  justify-content: center;\n  flex-wrap: nowrap;\n  align-items: center;\n  cursor: pointer;\n  position: relative;\n  z-index: 1;\n  &:disabled {\n    opacity: 50%;\n    cursor: auto;\n    pointer-events: none;\n  }\n\n  will-change: transform;\n  transition: transform 450ms ease;\n  transform: perspective(1px) translateZ(0);\n\n  > * {\n    user-select: none;\n  }\n\n  > a {\n    text-decoration: none;\n  }\n"])), function (_a) {
    var padding = _a.padding;
    return padding !== null && padding !== void 0 ? padding : '16px';
}, function (_a) {
    var width = _a.width;
    return width !== null && width !== void 0 ? width : '100%';
}, function (_a) {
    var $borderRadius = _a.$borderRadius;
    return $borderRadius !== null && $borderRadius !== void 0 ? $borderRadius : '20px';
}, function (_a) {
    var theme = _a.theme;
    return theme.text1;
});
var ButtonPrimary = styled__default["default"](BaseButton)(templateObject_2$p || (templateObject_2$p = __makeTemplateObject(["\n  background-color: ", ";\n  color: white;\n  &:focus {\n    box-shadow: 0 0 0 1pt ", ";\n    background-color: ", ";\n  }\n  &:hover {\n    background-color: ", ";\n  }\n  &:active {\n    box-shadow: 0 0 0 1pt ", ";\n    background-color: ", ";\n  }\n  &:disabled {\n    background-color: ", ";\n    color: ", ";\n    cursor: auto;\n    box-shadow: none;\n    border: 1px solid transparent;\n    outline: none;\n  }\n"], ["\n  background-color: ", ";\n  color: white;\n  &:focus {\n    box-shadow: 0 0 0 1pt ", ";\n    background-color: ", ";\n  }\n  &:hover {\n    background-color: ", ";\n  }\n  &:active {\n    box-shadow: 0 0 0 1pt ", ";\n    background-color: ", ";\n  }\n  &:disabled {\n    background-color: ", ";\n    color: ", ";\n    cursor: auto;\n    box-shadow: none;\n    border: 1px solid transparent;\n    outline: none;\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.primary1;
}, function (_a) {
    var theme = _a.theme;
    return polished.darken(0.05, theme.primary1);
}, function (_a) {
    var theme = _a.theme;
    return polished.darken(0.05, theme.primary1);
}, function (_a) {
    var theme = _a.theme;
    return polished.darken(0.05, theme.primary1);
}, function (_a) {
    var theme = _a.theme;
    return polished.darken(0.1, theme.primary1);
}, function (_a) {
    var theme = _a.theme;
    return polished.darken(0.1, theme.primary1);
}, function (_a) {
    var theme = _a.theme, altDisabledStyle = _a.altDisabledStyle, disabled = _a.disabled;
    return altDisabledStyle ? (disabled ? theme.primary1 : theme.bg2) : theme.bg2;
}, function (_a) {
    var altDisabledStyle = _a.altDisabledStyle, disabled = _a.disabled, theme = _a.theme;
    return altDisabledStyle ? (disabled ? theme.white : theme.text2) : theme.text2;
});
var ButtonLight = styled__default["default"](BaseButton)(templateObject_3$k || (templateObject_3$k = __makeTemplateObject(["\n  background-color: ", ";\n  color: ", ";\n  font-size: 16px;\n  font-weight: 500;\n  &:focus {\n    box-shadow: 0 0 0 1pt ", ";\n    background-color: ", ";\n  }\n  &:hover {\n    background-color: ", ";\n  }\n  &:active {\n    box-shadow: 0 0 0 1pt ", ";\n    background-color: ", ";\n  }\n  :disabled {\n    opacity: 0.4;\n    :hover {\n      cursor: auto;\n      background-color: ", ";\n      box-shadow: none;\n      border: 1px solid transparent;\n      outline: none;\n    }\n  }\n"], ["\n  background-color: ", ";\n  color: ", ";\n  font-size: 16px;\n  font-weight: 500;\n  &:focus {\n    box-shadow: 0 0 0 1pt ", ";\n    background-color: ", ";\n  }\n  &:hover {\n    background-color: ", ";\n  }\n  &:active {\n    box-shadow: 0 0 0 1pt ", ";\n    background-color: ", ";\n  }\n  :disabled {\n    opacity: 0.4;\n    :hover {\n      cursor: auto;\n      background-color: ", ";\n      box-shadow: none;\n      border: 1px solid transparent;\n      outline: none;\n    }\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.primary5;
}, function (_a) {
    var theme = _a.theme;
    return theme.primaryText1;
}, function (_a) {
    var theme = _a.theme, disabled = _a.disabled;
    return !disabled && polished.darken(0.03, theme.primary5);
}, function (_a) {
    var theme = _a.theme, disabled = _a.disabled;
    return !disabled && polished.darken(0.03, theme.primary5);
}, function (_a) {
    var theme = _a.theme, disabled = _a.disabled;
    return !disabled && polished.darken(0.03, theme.primary5);
}, function (_a) {
    var theme = _a.theme, disabled = _a.disabled;
    return !disabled && polished.darken(0.05, theme.primary5);
}, function (_a) {
    var theme = _a.theme, disabled = _a.disabled;
    return !disabled && polished.darken(0.05, theme.primary5);
}, function (_a) {
    var theme = _a.theme;
    return theme.primary5;
});
var ButtonGray = styled__default["default"](BaseButton)(templateObject_4$d || (templateObject_4$d = __makeTemplateObject(["\n  background-color: ", ";\n  color: ", ";\n  font-size: 16px;\n  font-weight: 500;\n\n  &:hover {\n    background-color: ", ";\n  }\n  &:active {\n    background-color: ", ";\n  }\n"], ["\n  background-color: ", ";\n  color: ", ";\n  font-size: 16px;\n  font-weight: 500;\n\n  &:hover {\n    background-color: ", ";\n  }\n  &:active {\n    background-color: ", ";\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg1;
}, function (_a) {
    var theme = _a.theme;
    return theme.text2;
}, function (_a) {
    var theme = _a.theme, disabled = _a.disabled;
    return !disabled && polished.darken(0.05, theme.bg2);
}, function (_a) {
    var theme = _a.theme, disabled = _a.disabled;
    return !disabled && polished.darken(0.1, theme.bg2);
});
styled__default["default"](BaseButton)(templateObject_5$b || (templateObject_5$b = __makeTemplateObject(["\n  border: 1px solid ", ";\n  color: ", ";\n  background-color: transparent;\n  font-size: 16px;\n  border-radius: 12px;\n  padding: ", ";\n\n  &:focus {\n    box-shadow: 0 0 0 1pt ", ";\n    border: 1px solid ", ";\n  }\n  &:hover {\n    border: 1px solid ", ";\n  }\n  &:active {\n    box-shadow: 0 0 0 1pt ", ";\n    border: 1px solid ", ";\n  }\n  &:disabled {\n    opacity: 50%;\n    cursor: auto;\n  }\n  a:hover {\n    text-decoration: none;\n  }\n"], ["\n  border: 1px solid ", ";\n  color: ", ";\n  background-color: transparent;\n  font-size: 16px;\n  border-radius: 12px;\n  padding: ", ";\n\n  &:focus {\n    box-shadow: 0 0 0 1pt ", ";\n    border: 1px solid ", ";\n  }\n  &:hover {\n    border: 1px solid ", ";\n  }\n  &:active {\n    box-shadow: 0 0 0 1pt ", ";\n    border: 1px solid ", ";\n  }\n  &:disabled {\n    opacity: 50%;\n    cursor: auto;\n  }\n  a:hover {\n    text-decoration: none;\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.primary4;
}, function (_a) {
    var theme = _a.theme;
    return theme.primary1;
}, function (_a) {
    var padding = _a.padding;
    return (padding ? padding : '10px');
}, function (_a) {
    var theme = _a.theme;
    return theme.primary4;
}, function (_a) {
    var theme = _a.theme;
    return theme.primary3;
}, function (_a) {
    var theme = _a.theme;
    return theme.primary3;
}, function (_a) {
    var theme = _a.theme;
    return theme.primary4;
}, function (_a) {
    var theme = _a.theme;
    return theme.primary3;
});
var ButtonOutlined = styled__default["default"](BaseButton)(templateObject_6$7 || (templateObject_6$7 = __makeTemplateObject(["\n  border: 1px solid ", ";\n  background-color: transparent;\n  color: ", ";\n  &:focus {\n    box-shadow: 0 0 0 1px ", ";\n  }\n  &:hover {\n    box-shadow: 0 0 0 1px ", ";\n  }\n  &:active {\n    box-shadow: 0 0 0 1px ", ";\n  }\n  &:disabled {\n    opacity: 50%;\n    cursor: auto;\n  }\n"], ["\n  border: 1px solid ", ";\n  background-color: transparent;\n  color: ", ";\n  &:focus {\n    box-shadow: 0 0 0 1px ", ";\n  }\n  &:hover {\n    box-shadow: 0 0 0 1px ", ";\n  }\n  &:active {\n    box-shadow: 0 0 0 1px ", ";\n  }\n  &:disabled {\n    opacity: 50%;\n    cursor: auto;\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg2;
}, function (_a) {
    var theme = _a.theme;
    return theme.text1;
}, function (_a) {
    var theme = _a.theme;
    return theme.bg4;
}, function (_a) {
    var theme = _a.theme;
    return theme.bg4;
}, function (_a) {
    var theme = _a.theme;
    return theme.bg4;
});
styled__default["default"](BaseButton)(templateObject_7$6 || (templateObject_7$6 = __makeTemplateObject(["\n  background-color: ", ";\n  color: white;\n  &:focus {\n    box-shadow: 0 0 0 1pt ", ";\n    background-color: ", ";\n  }\n  &:hover {\n    background-color: ", ";\n  }\n  &:active {\n    box-shadow: 0 0 0 1pt ", ";\n    background-color: ", ";\n  }\n  &:disabled {\n    background-color: ", ";\n    opacity: 50%;\n    cursor: auto;\n  }\n"], ["\n  background-color: ", ";\n  color: white;\n  &:focus {\n    box-shadow: 0 0 0 1pt ", ";\n    background-color: ", ";\n  }\n  &:hover {\n    background-color: ", ";\n  }\n  &:active {\n    box-shadow: 0 0 0 1pt ", ";\n    background-color: ", ";\n  }\n  &:disabled {\n    background-color: ", ";\n    opacity: 50%;\n    cursor: auto;\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.yellow3;
}, function (_a) {
    var theme = _a.theme;
    return polished.darken(0.05, theme.yellow3);
}, function (_a) {
    var theme = _a.theme;
    return polished.darken(0.05, theme.yellow3);
}, function (_a) {
    var theme = _a.theme;
    return polished.darken(0.05, theme.yellow3);
}, function (_a) {
    var theme = _a.theme;
    return polished.darken(0.1, theme.yellow3);
}, function (_a) {
    var theme = _a.theme;
    return polished.darken(0.1, theme.yellow3);
}, function (_a) {
    var theme = _a.theme;
    return theme.yellow3;
});
var ButtonEmpty = styled__default["default"](BaseButton)(templateObject_8$3 || (templateObject_8$3 = __makeTemplateObject(["\n  background-color: transparent;\n  color: ", ";\n  display: flex;\n  justify-content: center;\n  align-items: center;\n\n  &:focus {\n    text-decoration: underline;\n  }\n  &:hover {\n    text-decoration: none;\n  }\n  &:active {\n    text-decoration: none;\n  }\n  &:disabled {\n    opacity: 50%;\n    cursor: auto;\n  }\n"], ["\n  background-color: transparent;\n  color: ", ";\n  display: flex;\n  justify-content: center;\n  align-items: center;\n\n  &:focus {\n    text-decoration: underline;\n  }\n  &:hover {\n    text-decoration: none;\n  }\n  &:active {\n    text-decoration: none;\n  }\n  &:disabled {\n    opacity: 50%;\n    cursor: auto;\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.primary1;
});
styled__default["default"](BaseButton)(templateObject_9$3 || (templateObject_9$3 = __makeTemplateObject(["\n  padding: 0;\n  width: fit-content;\n  background: none;\n  text-decoration: none;\n  &:focus {\n    // eslint-disable-next-line @typescript-eslint/no-unused-vars\n    text-decoration: underline;\n  }\n  &:hover {\n    // text-decoration: underline;\n    opacity: 0.9;\n  }\n  &:active {\n    text-decoration: underline;\n  }\n  &:disabled {\n    opacity: 50%;\n    cursor: auto;\n  }\n"], ["\n  padding: 0;\n  width: fit-content;\n  background: none;\n  text-decoration: none;\n  &:focus {\n    // eslint-disable-next-line @typescript-eslint/no-unused-vars\n    text-decoration: underline;\n  }\n  &:hover {\n    // text-decoration: underline;\n    opacity: 0.9;\n  }\n  &:active {\n    text-decoration: underline;\n  }\n  &:disabled {\n    opacity: 50%;\n    cursor: auto;\n  }\n"])));
var ButtonConfirmedStyle = styled__default["default"](BaseButton)(templateObject_10$3 || (templateObject_10$3 = __makeTemplateObject(["\n  background-color: ", ";\n  color: ", ";\n  /* border: 1px solid ", "; */\n\n  &:disabled {\n    opacity: 50%;\n    background-color: ", ";\n    color: ", ";\n    cursor: auto;\n  }\n"], ["\n  background-color: ", ";\n  color: ", ";\n  /* border: 1px solid ", "; */\n\n  &:disabled {\n    opacity: 50%;\n    background-color: ", ";\n    color: ", ";\n    cursor: auto;\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg3;
}, function (_a) {
    var theme = _a.theme;
    return theme.text1;
}, function (_a) {
    var theme = _a.theme;
    return theme.green1;
}, function (_a) {
    var theme = _a.theme;
    return theme.bg2;
}, function (_a) {
    var theme = _a.theme;
    return theme.text2;
});
var ButtonErrorStyle = styled__default["default"](BaseButton)(templateObject_11$3 || (templateObject_11$3 = __makeTemplateObject(["\n  background-color: ", ";\n  border: 1px solid ", ";\n\n  &:focus {\n    box-shadow: 0 0 0 1pt ", ";\n    background-color: ", ";\n  }\n  &:hover {\n    background-color: ", ";\n  }\n  &:active {\n    box-shadow: 0 0 0 1pt ", ";\n    background-color: ", ";\n  }\n  &:disabled {\n    opacity: 50%;\n    cursor: auto;\n    box-shadow: none;\n    background-color: ", ";\n    border: 1px solid ", ";\n  }\n"], ["\n  background-color: ", ";\n  border: 1px solid ", ";\n\n  &:focus {\n    box-shadow: 0 0 0 1pt ", ";\n    background-color: ", ";\n  }\n  &:hover {\n    background-color: ", ";\n  }\n  &:active {\n    box-shadow: 0 0 0 1pt ", ";\n    background-color: ", ";\n  }\n  &:disabled {\n    opacity: 50%;\n    cursor: auto;\n    box-shadow: none;\n    background-color: ", ";\n    border: 1px solid ", ";\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.red1;
}, function (_a) {
    var theme = _a.theme;
    return theme.red1;
}, function (_a) {
    var theme = _a.theme;
    return polished.darken(0.05, theme.red1);
}, function (_a) {
    var theme = _a.theme;
    return polished.darken(0.05, theme.red1);
}, function (_a) {
    var theme = _a.theme;
    return polished.darken(0.05, theme.red1);
}, function (_a) {
    var theme = _a.theme;
    return polished.darken(0.1, theme.red1);
}, function (_a) {
    var theme = _a.theme;
    return polished.darken(0.1, theme.red1);
}, function (_a) {
    var theme = _a.theme;
    return theme.red1;
}, function (_a) {
    var theme = _a.theme;
    return theme.red1;
});
function ButtonConfirmed(_a) {
    var confirmed = _a.confirmed, altDisabledStyle = _a.altDisabledStyle, rest = __rest(_a, ["confirmed", "altDisabledStyle"]);
    if (confirmed) {
        return jsxRuntime.jsx(ButtonConfirmedStyle, __assign({}, rest), void 0);
    }
    else {
        return jsxRuntime.jsx(ButtonPrimary, __assign({}, rest, { altDisabledStyle: altDisabledStyle }), void 0);
    }
}
function ButtonError(_a) {
    var error = _a.error, rest = __rest(_a, ["error"]);
    if (error) {
        return jsxRuntime.jsx(ButtonErrorStyle, __assign({}, rest), void 0);
    }
    else {
        return jsxRuntime.jsx(ButtonPrimary, __assign({}, rest), void 0);
    }
}
styled__default["default"](ButtonOutlined)(templateObject_12$3 || (templateObject_12$3 = __makeTemplateObject(["\n  border: 1px solid;\n  border-color: ", ";\n"], ["\n  border: 1px solid;\n  border-color: ", ";\n"])), function (_a) {
    var theme = _a.theme;
    return theme.primary1;
});
styled__default["default"].div(templateObject_13 || (templateObject_13 = __makeTemplateObject(["\n  height: 17px;\n  width: 17px;\n  border-radius: 50%;\n  background-color: ", ";\n  display: flex;\n  align-items: center;\n  justify-content: center;\n"], ["\n  height: 17px;\n  width: 17px;\n  border-radius: 50%;\n  background-color: ", ";\n  display: flex;\n  align-items: center;\n  justify-content: center;\n"])), function (_a) {
    var theme = _a.theme;
    return theme.primary1;
});
styled__default["default"].div(templateObject_14 || (templateObject_14 = __makeTemplateObject(["\n  width: 20px;\n  padding: 0 10px;\n  position: absolute;\n  top: 11px;\n  right: 15px;\n"], ["\n  width: 20px;\n  padding: 0 10px;\n  position: absolute;\n  top: 11px;\n  right: 15px;\n"])));
styled__default["default"](reactFeather.Check)(templateObject_15 || (templateObject_15 = __makeTemplateObject(["\n  size: 13px;\n"], ["\n  size: 13px;\n"])));
var templateObject_1$C, templateObject_2$p, templateObject_3$k, templateObject_4$d, templateObject_5$b, templateObject_6$7, templateObject_7$6, templateObject_8$3, templateObject_9$3, templateObject_10$3, templateObject_11$3, templateObject_12$3, templateObject_13, templateObject_14, templateObject_15;

var parser = new uaParserJs.UAParser(window.navigator.userAgent);
var type$1 = parser.getDevice().type;
parser.getResult();
var isMobile = type$1 === 'mobile' || type$1 === 'tablet';

var AnimatedDialogOverlay = reactSpring.animated(dialog.DialogOverlay);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var StyledDialogOverlay = styled__default["default"](AnimatedDialogOverlay)(templateObject_1$B || (templateObject_1$B = __makeTemplateObject(["\n  &[data-reach-dialog-overlay] {\n    z-index: 2;\n    background-color: transparent;\n    overflow: hidden;\n\n    display: flex;\n    align-items: center;\n    justify-content: center;\n\n    background-color: ", ";\n  }\n"], ["\n  &[data-reach-dialog-overlay] {\n    z-index: 2;\n    background-color: transparent;\n    overflow: hidden;\n\n    display: flex;\n    align-items: center;\n    justify-content: center;\n\n    background-color: ", ";\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.modalBG;
});
var AnimatedDialogContent = reactSpring.animated(dialog.DialogContent);
// destructure to not pass custom props to Dialog DOM element
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var StyledDialogContent = styled__default["default"](function (_a) {
    _a.minHeight; _a.maxHeight; _a.mobile; _a.isOpen; var rest = __rest(_a, ["minHeight", "maxHeight", "mobile", "isOpen"]);
    return (jsxRuntime.jsx(AnimatedDialogContent, __assign({}, rest), void 0));
}).attrs({
    'aria-label': 'dialog',
})(templateObject_7$5 || (templateObject_7$5 = __makeTemplateObject(["\n  overflow-y: auto;\n\n  &[data-reach-dialog-content] {\n    margin: 0 0 2rem 0;\n    background-color: ", ";\n    border: 1px solid ", ";\n    box-shadow: 0 4px 8px 0 ", ";\n    padding: 0px;\n    width: 50vw;\n    overflow-y: auto;\n    overflow-x: hidden;\n\n    align-self: ", ";\n\n    max-width: 420px;\n    ", "\n    ", "\n    display: flex;\n    border-radius: 20px;\n    ", "\n    ", "\n  }\n"], ["\n  overflow-y: auto;\n\n  &[data-reach-dialog-content] {\n    margin: 0 0 2rem 0;\n    background-color: ", ";\n    border: 1px solid ", ";\n    box-shadow: 0 4px 8px 0 ", ";\n    padding: 0px;\n    width: 50vw;\n    overflow-y: auto;\n    overflow-x: hidden;\n\n    align-self: ", ";\n\n    max-width: 420px;\n    ", "\n    ", "\n    display: flex;\n    border-radius: 20px;\n    ", "\n    ", "\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg0;
}, function (_a) {
    var theme = _a.theme;
    return theme.bg1;
}, function (_a) {
    var theme = _a.theme;
    return polished.transparentize(0.95, theme.shadow1);
}, function (_a) {
    var mobile = _a.mobile;
    return (mobile ? 'flex-end' : 'center');
}, function (_a) {
    var maxHeight = _a.maxHeight;
    return maxHeight && styled.css(templateObject_2$o || (templateObject_2$o = __makeTemplateObject(["\n        max-height: ", "vh;\n      "], ["\n        max-height: ", "vh;\n      "])), maxHeight);
}, function (_a) {
    var minHeight = _a.minHeight;
    return minHeight && styled.css(templateObject_3$j || (templateObject_3$j = __makeTemplateObject(["\n        min-height: ", "vh;\n      "], ["\n        min-height: ", "vh;\n      "])), minHeight);
}, function (_a) {
    var theme = _a.theme;
    return theme.mediaWidth.upToMedium(templateObject_4$c || (templateObject_4$c = __makeTemplateObject(["\n      width: 65vw;\n      margin: 0;\n    "], ["\n      width: 65vw;\n      margin: 0;\n    "])));
}, function (_a) {
    var theme = _a.theme, mobile = _a.mobile;
    return theme.mediaWidth.upToSmall(templateObject_6$6 || (templateObject_6$6 = __makeTemplateObject(["\n      width:  85vw;\n      ", "\n    "], ["\n      width:  85vw;\n      ", "\n    "])), mobile && styled.css(templateObject_5$a || (templateObject_5$a = __makeTemplateObject(["\n          width: 100vw;\n          border-radius: 20px;\n          border-bottom-left-radius: 0;\n          border-bottom-right-radius: 0;\n        "], ["\n          width: 100vw;\n          border-radius: 20px;\n          border-bottom-left-radius: 0;\n          border-bottom-right-radius: 0;\n        "]))));
});
function Modal(_a) {
    var isOpen = _a.isOpen, onDismiss = _a.onDismiss, _b = _a.minHeight, minHeight = _b === void 0 ? false : _b, _c = _a.maxHeight, maxHeight = _c === void 0 ? 90 : _c, initialFocusRef = _a.initialFocusRef, children = _a.children;
    var fadeTransition = reactSpring.useTransition(isOpen, null, {
        config: { duration: 200 },
        from: { opacity: 0 },
        enter: { opacity: 1 },
        leave: { opacity: 0 },
    });
    var _d = __read(reactSpring.useSpring(function () { return ({ y: 0, config: { mass: 1, tension: 210, friction: 20 } }); }), 2), y = _d[0].y, set = _d[1];
    var bind = reactUseGesture.useGesture({
        onDrag: function (state) {
            set({
                y: state.down ? state.movement[1] : 0,
            });
            if (state.movement[1] > 300 || (state.velocity > 3 && state.direction[1] > 0)) {
                onDismiss();
            }
        },
    });
    return (jsxRuntime.jsx(jsxRuntime.Fragment, { children: fadeTransition.map(function (_a) {
            var item = _a.item, key = _a.key, props = _a.props;
            return item && (jsxRuntime.jsx(StyledDialogOverlay, __assign({ style: props, onDismiss: onDismiss, initialFocusRef: initialFocusRef, unstable_lockFocusAcrossFrames: false }, { children: jsxRuntime.jsxs(StyledDialogContent, __assign({}, (isMobile
                    ? __assign(__assign({}, bind()), { style: { transform: y.interpolate(function (y) { return "translateY(" + (y > 0 ? y : 0) + "px)"; }) } }) : {}), { "aria-label": "dialog content", minHeight: minHeight, maxHeight: maxHeight, mobile: isMobile }, { children: [!initialFocusRef && isMobile ? jsxRuntime.jsx("div", { tabIndex: 1 }, void 0) : null, children] }), void 0) }), key));
        }) }, void 0));
}
var templateObject_1$B, templateObject_2$o, templateObject_3$j, templateObject_4$c, templateObject_5$a, templateObject_6$6, templateObject_7$5;

var _a$7;
var ETHERSCAN_PREFIXES = (_a$7 = {},
    _a$7[SupportedChainId.MAINNET] = 'https://etherscan.io',
    _a$7[SupportedChainId.ROPSTEN] = 'https://ropsten.etherscan.io',
    _a$7[SupportedChainId.RINKEBY] = 'https://rinkeby.etherscan.io',
    _a$7[SupportedChainId.GOERLI] = 'https://goerli.etherscan.io',
    _a$7[SupportedChainId.KOVAN] = 'https://kovan.etherscan.io',
    _a$7[SupportedChainId.OPTIMISM] = 'https://optimistic.etherscan.io',
    _a$7[SupportedChainId.OPTIMISTIC_KOVAN] = 'https://kovan-optimistic.etherscan.io',
    _a$7[SupportedChainId.POLYGON_MUMBAI] = 'https://mumbai.polygonscan.com',
    _a$7[SupportedChainId.POLYGON] = 'https://polygonscan.com',
    _a$7);
var ExplorerDataType;
(function (ExplorerDataType) {
    ExplorerDataType["TRANSACTION"] = "transaction";
    ExplorerDataType["TOKEN"] = "token";
    ExplorerDataType["ADDRESS"] = "address";
    ExplorerDataType["BLOCK"] = "block";
})(ExplorerDataType || (ExplorerDataType = {}));
/**
 * Return the explorer link for the given data and data type
 * @param chainId the ID of the chain for which to return the data
 * @param data the data to return a link for
 * @param type the type of the data
 */
function getExplorerLink(chainId, data, type) {
    var _a;
    if (chainId === SupportedChainId.ARBITRUM_ONE) {
        switch (type) {
            case ExplorerDataType.TRANSACTION:
                return "https://arbiscan.io/tx/" + data;
            case ExplorerDataType.ADDRESS:
            case ExplorerDataType.TOKEN:
                return "https://arbiscan.io/address/" + data;
            case ExplorerDataType.BLOCK:
                return "https://arbiscan.io/block/" + data;
            default:
                return "https://arbiscan.io/";
        }
    }
    if (chainId === SupportedChainId.ARBITRUM_RINKEBY) {
        switch (type) {
            case ExplorerDataType.TRANSACTION:
                return "https://rinkeby-explorer.arbitrum.io/tx/" + data;
            case ExplorerDataType.ADDRESS:
            case ExplorerDataType.TOKEN:
                return "https://rinkeby-explorer.arbitrum.io/address/" + data;
            case ExplorerDataType.BLOCK:
                return "https://rinkeby-explorer.arbitrum.io/block/" + data;
            default:
                return "https://rinkeby-explorer.arbitrum.io/";
        }
    }
    var prefix = (_a = ETHERSCAN_PREFIXES[chainId]) !== null && _a !== void 0 ? _a : 'https://etherscan.io';
    switch (type) {
        case ExplorerDataType.TRANSACTION:
            return prefix + "/tx/" + data;
        case ExplorerDataType.TOKEN:
            return prefix + "/token/" + data;
        case ExplorerDataType.BLOCK:
            if (chainId === SupportedChainId.OPTIMISM || chainId === SupportedChainId.OPTIMISTIC_KOVAN) {
                return prefix + "/tx/" + data;
            }
            return prefix + "/block/" + data;
        case ExplorerDataType.ADDRESS:
            return prefix + "/address/" + data;
        default:
            return "" + prefix;
    }
}

var DetailsFooter = styled__default["default"].div(templateObject_1$A || (templateObject_1$A = __makeTemplateObject(["\n  padding-top: calc(16px + 2rem);\n  padding-bottom: 20px;\n  margin-left: auto;\n  margin-right: auto;\n  margin-top: -2rem;\n  width: 100%;\n  max-width: 400px;\n  border-bottom-left-radius: 20px;\n  border-bottom-right-radius: 20px;\n  color: ", ";\n  background-color: ", ";\n  z-index: ", ";\n\n  transform: ", ";\n  transition: transform 300ms ease-in-out;\n  text-align: center;\n"], ["\n  padding-top: calc(16px + 2rem);\n  padding-bottom: 20px;\n  margin-left: auto;\n  margin-right: auto;\n  margin-top: -2rem;\n  width: 100%;\n  max-width: 400px;\n  border-bottom-left-radius: 20px;\n  border-bottom-right-radius: 20px;\n  color: ", ";\n  background-color: ", ";\n  z-index: ", ";\n\n  transform: ", ";\n  transition: transform 300ms ease-in-out;\n  text-align: center;\n"])), function (_a) {
    var theme = _a.theme;
    return theme.text2;
}, function (_a) {
    var theme = _a.theme;
    return theme.advancedBG;
}, Z_INDEX.deprecated_zero, function (_a) {
    var show = _a.show;
    return (show ? 'translateY(0%)' : 'translateY(-100%)');
});
var StyledButtonEmpty = styled__default["default"](ButtonEmpty)(templateObject_2$n || (templateObject_2$n = __makeTemplateObject(["\n  text-decoration: none;\n"], ["\n  text-decoration: none;\n"])));
var AddressText$1 = styled__default["default"](ThemedText.Blue)(templateObject_4$b || (templateObject_4$b = __makeTemplateObject(["\n  font-size: 12px;\n\n  ", "\n"], ["\n  font-size: 12px;\n\n  ", "\n"])), function (_a) {
    var theme = _a.theme;
    return theme.mediaWidth.upToSmall(templateObject_3$i || (templateObject_3$i = __makeTemplateObject(["\n    font-size: 10px;\n"], ["\n    font-size: 10px;\n"])));
});
function UnsupportedCurrencyFooter(_a) {
    var show = _a.show, currencies = _a.currencies;
    var chainId = useActiveWeb3React().chainId;
    var _b = __read(React.useState(false), 2), showDetails = _b[0], setShowDetails = _b[1];
    var tokens = chainId && currencies
        ? currencies.map(function (currency) {
            return currency === null || currency === void 0 ? void 0 : currency.wrapped;
        })
        : [];
    var unsupportedTokens = useUnsupportedTokens();
    return (jsxRuntime.jsxs(DetailsFooter, __assign({ show: show }, { children: [jsxRuntime.jsx(Modal, __assign({ isOpen: showDetails, onDismiss: function () { return setShowDetails(false); } }, { children: jsxRuntime.jsx(Card, __assign({ padding: "2rem" }, { children: jsxRuntime.jsxs(AutoColumn, __assign({ gap: "lg" }, { children: [jsxRuntime.jsxs(RowBetween, { children: [jsxRuntime.jsx(ThemedText.MediumHeader, { children: jsxRuntime.jsx(macro.Trans, { children: "Unsupported Assets" }, void 0) }, void 0), jsxRuntime.jsx(CloseIcon, { onClick: function () { return setShowDetails(false); } }, void 0)] }, void 0), tokens.map(function (token) {
                                var _a;
                                return (token &&
                                    unsupportedTokens &&
                                    Object.keys(unsupportedTokens).includes(token.address) && (jsxRuntime.jsx(OutlineCard, { children: jsxRuntime.jsxs(AutoColumn, __assign({ gap: "10px" }, { children: [jsxRuntime.jsxs(AutoRow, __assign({ gap: "5px", align: "center" }, { children: [jsxRuntime.jsx(CurrencyLogo, { currency: token, size: '24px' }, void 0), jsxRuntime.jsx(ThemedText.Body, __assign({ fontWeight: 500 }, { children: token.symbol }), void 0)] }), void 0), chainId && (jsxRuntime.jsx(ExternalLink, __assign({ href: getExplorerLink(chainId, token.address, ExplorerDataType.ADDRESS) }, { children: jsxRuntime.jsx(AddressText$1, { children: token.address }, void 0) }), void 0))] }), void 0) }, (_a = token.address) === null || _a === void 0 ? void 0 : _a.concat('not-supported'))));
                            }), jsxRuntime.jsx(AutoColumn, __assign({ gap: "lg" }, { children: jsxRuntime.jsx(ThemedText.Body, __assign({ fontWeight: 500 }, { children: jsxRuntime.jsx(macro.Trans, { children: "Some assets are not available through this interface because they may not work well with the smart contracts or we are unable to allow trading for legal reasons." }, void 0) }), void 0) }), void 0)] }), void 0) }), void 0) }), void 0), jsxRuntime.jsx(StyledButtonEmpty, __assign({ padding: '0', onClick: function () { return setShowDetails(true); } }, { children: jsxRuntime.jsx(ThemedText.Blue, { children: jsxRuntime.jsx(macro.Trans, { children: "Read more about unsupported assets" }, void 0) }, void 0) }), void 0)] }), void 0));
}
var templateObject_1$A, templateObject_2$n, templateObject_3$i, templateObject_4$b;

/**
 * Does a lookup for an ENS name to find its address.
 */
function useENSAddress(ensName) {
    var _a;
    var debouncedName = useDebounce(ensName, 200);
    var ensNodeArgument = React.useMemo(function () { return [debouncedName === null ? undefined : safeNamehash(debouncedName)]; }, [debouncedName]);
    var registrarContract = useENSRegistrarContract(false);
    var resolverAddress = useSingleCallResult(registrarContract, 'resolver', ensNodeArgument);
    var resolverAddressResult = (_a = resolverAddress.result) === null || _a === void 0 ? void 0 : _a[0];
    var resolverContract = useENSResolverContract(resolverAddressResult && !isZero(resolverAddressResult) ? resolverAddressResult : undefined, false);
    var addr = useSingleCallResult(resolverContract, 'addr', ensNodeArgument);
    var changed = debouncedName !== ensName;
    return React.useMemo(function () {
        var _a, _b;
        return ({
            address: changed ? null : (_b = (_a = addr.result) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : null,
            loading: changed || resolverAddress.loading || addr.loading,
        });
    }, [addr.loading, addr.result, changed, resolverAddress.loading]);
}

/**
 * Does a reverse lookup for an address to find its ENS name.
 * Note this is not the same as looking up an ENS name to find an address.
 */
function useENSName(address) {
    var _a, _b;
    var debouncedAddress = useDebounce(address, 200);
    var ensNodeArgument = React.useMemo(function () {
        if (!debouncedAddress || !isAddress(debouncedAddress))
            return [undefined];
        return [hash.namehash(debouncedAddress.toLowerCase().substr(2) + ".addr.reverse")];
    }, [debouncedAddress]);
    var registrarContract = useENSRegistrarContract(false);
    var resolverAddress = useSingleCallResult(registrarContract, 'resolver', ensNodeArgument);
    var resolverAddressResult = (_a = resolverAddress.result) === null || _a === void 0 ? void 0 : _a[0];
    var resolverContract = useENSResolverContract(resolverAddressResult && !isZero(resolverAddressResult) ? resolverAddressResult : undefined, false);
    var nameCallRes = useSingleCallResult(resolverContract, 'name', ensNodeArgument);
    var name = (_b = nameCallRes.result) === null || _b === void 0 ? void 0 : _b[0];
    /* ENS does not enforce that an address owns a .eth domain before setting it as a reverse proxy
       and recommends that you perform a match on the forward resolution
       see: https://docs.ens.domains/dapp-developer-guide/resolving-names#reverse-resolution
    */
    var fwdAddr = useENSAddress(name);
    var checkedName = address === (fwdAddr === null || fwdAddr === void 0 ? void 0 : fwdAddr.address) ? name : null;
    var changed = debouncedAddress !== address;
    return React.useMemo(function () { return ({
        ENSName: changed ? null : checkedName,
        loading: changed || resolverAddress.loading || nameCallRes.loading,
    }); }, [changed, nameCallRes.loading, checkedName, resolverAddress.loading]);
}

/**
 * Given a name or address, does a lookup to resolve to an address and name
 * @param nameOrAddress ENS name or address
 */
function useENS(nameOrAddress) {
    var validated = isAddress(nameOrAddress);
    var reverseLookup = useENSName(validated ? validated : undefined);
    var lookup = useENSAddress(nameOrAddress);
    return React.useMemo(function () { return ({
        loading: reverseLookup.loading || lookup.loading,
        address: validated ? validated : lookup.address,
        name: reverseLookup.ENSName ? reverseLookup.ENSName : !validated && lookup.address ? nameOrAddress || null : null,
    }); }, [lookup.address, lookup.loading, nameOrAddress, reverseLookup.ENSName, reverseLookup.loading, validated]);
}

var InputPanel$1 = styled__default["default"].div(templateObject_1$z || (templateObject_1$z = __makeTemplateObject(["\n  ", "\n  position: relative;\n  border-radius: 1.25rem;\n  background-color: ", ";\n  z-index: 1;\n  width: 100%;\n"], ["\n  ", "\n  position: relative;\n  border-radius: 1.25rem;\n  background-color: ", ";\n  z-index: 1;\n  width: 100%;\n"])), function (_a) {
    var theme = _a.theme;
    return theme.flexColumnNoWrap;
}, function (_a) {
    var theme = _a.theme;
    return theme.bg1;
});
var ContainerRow = styled__default["default"].div(templateObject_2$m || (templateObject_2$m = __makeTemplateObject(["\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  border-radius: 1.25rem;\n  border: 1px solid ", ";\n  transition: border-color 300ms ", ",\n    color 500ms ", ";\n  background-color: ", ";\n"], ["\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  border-radius: 1.25rem;\n  border: 1px solid ", ";\n  transition: border-color 300ms ", ",\n    color 500ms ", ";\n  background-color: ", ";\n"])), function (_a) {
    var error = _a.error, theme = _a.theme;
    return (error ? theme.red1 : theme.bg2);
}, function (_a) {
    var error = _a.error;
    return (error ? 'step-end' : 'step-start');
}, function (_a) {
    var error = _a.error;
    return (error ? 'step-end' : 'step-start');
}, function (_a) {
    var theme = _a.theme;
    return theme.bg1;
});
var InputContainer = styled__default["default"].div(templateObject_3$h || (templateObject_3$h = __makeTemplateObject(["\n  flex: 1;\n  padding: 1rem;\n"], ["\n  flex: 1;\n  padding: 1rem;\n"])));
var Input$2 = styled__default["default"].input(templateObject_4$a || (templateObject_4$a = __makeTemplateObject(["\n  font-size: 1.25rem;\n  outline: none;\n  border: none;\n  flex: 1 1 auto;\n  width: 0;\n  background-color: ", ";\n  transition: color 300ms ", ";\n  color: ", ";\n  overflow: hidden;\n  text-overflow: ellipsis;\n  font-weight: 500;\n  width: 100%;\n  ::placeholder {\n    color: ", ";\n  }\n  padding: 0px;\n  -webkit-appearance: textfield;\n\n  ::-webkit-search-decoration {\n    -webkit-appearance: none;\n  }\n\n  ::-webkit-outer-spin-button,\n  ::-webkit-inner-spin-button {\n    -webkit-appearance: none;\n  }\n\n  ::placeholder {\n    color: ", ";\n  }\n"], ["\n  font-size: 1.25rem;\n  outline: none;\n  border: none;\n  flex: 1 1 auto;\n  width: 0;\n  background-color: ", ";\n  transition: color 300ms ", ";\n  color: ", ";\n  overflow: hidden;\n  text-overflow: ellipsis;\n  font-weight: 500;\n  width: 100%;\n  ::placeholder {\n    color: ", ";\n  }\n  padding: 0px;\n  -webkit-appearance: textfield;\n\n  ::-webkit-search-decoration {\n    -webkit-appearance: none;\n  }\n\n  ::-webkit-outer-spin-button,\n  ::-webkit-inner-spin-button {\n    -webkit-appearance: none;\n  }\n\n  ::placeholder {\n    color: ", ";\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg1;
}, function (_a) {
    var error = _a.error;
    return (error ? 'step-end' : 'step-start');
}, function (_a) {
    var error = _a.error, theme = _a.theme;
    return (error ? theme.red1 : theme.text1);
}, function (_a) {
    var theme = _a.theme;
    return theme.text4;
}, function (_a) {
    var theme = _a.theme;
    return theme.text4;
});
function AddressInputPanel(_a) {
    var id = _a.id, _b = _a.className, className = _b === void 0 ? 'recipient-address-input' : _b, label = _a.label, placeholder = _a.placeholder, value = _a.value, onChange = _a.onChange;
    var chainId = useActiveWeb3React().chainId;
    var theme = React.useContext(styled.ThemeContext);
    var _c = useENS(value), address = _c.address, loading = _c.loading, name = _c.name;
    var handleInput = React.useCallback(function (event) {
        var input = event.target.value;
        var withoutSpaces = input.replace(/\s+/g, '');
        onChange(withoutSpaces);
    }, [onChange]);
    var error = Boolean(value.length > 0 && !loading && !address);
    return (jsxRuntime.jsx(InputPanel$1, __assign({ id: id }, { children: jsxRuntime.jsx(ContainerRow, __assign({ error: error }, { children: jsxRuntime.jsx(InputContainer, { children: jsxRuntime.jsxs(AutoColumn, __assign({ gap: "md" }, { children: [jsxRuntime.jsxs(RowBetween, { children: [jsxRuntime.jsx(ThemedText.Black, __assign({ color: theme.text2, fontWeight: 500, fontSize: 14 }, { children: label !== null && label !== void 0 ? label : jsxRuntime.jsx(macro.Trans, { children: "Recipient" }, void 0) }), void 0), address && chainId && (jsxRuntime.jsx(ExternalLink, __assign({ href: getExplorerLink(chainId, name !== null && name !== void 0 ? name : address, ExplorerDataType.ADDRESS), style: { fontSize: '14px' } }, { children: jsxRuntime.jsx(macro.Trans, { children: "(View on Explorer)" }, void 0) }), void 0))] }, void 0), jsxRuntime.jsx(Input$2, { className: className, type: "text", autoComplete: "off", autoCorrect: "off", autoCapitalize: "off", spellCheck: "false", placeholder: placeholder !== null && placeholder !== void 0 ? placeholder : macro.t(templateObject_5$9 || (templateObject_5$9 = __makeTemplateObject(["Wallet Address or ENS name"], ["Wallet Address or ENS name"]))), error: error, pattern: "^(0x[a-fA-F0-9]{40})$", onChange: handleInput, value: value }, void 0)] }), void 0) }, void 0) }), void 0) }), void 0));
}
var templateObject_1$z, templateObject_2$m, templateObject_3$h, templateObject_4$a, templateObject_5$9;

function formatCurrencyAmount(amount, sigFigs) {
    if (!amount) {
        return '-';
    }
    if (JSBI__default["default"].equal(amount.quotient, JSBI__default["default"].BigInt(0))) {
        return '0';
    }
    if (amount.divide(amount.decimalScale).lessThan(new sdkCore.Fraction(1, 100000))) {
        return '<0.00001';
    }
    return amount.toSignificant(sigFigs);
}

var _path;

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

var SvgDropdown = function SvgDropdown(props) {
  return /*#__PURE__*/React__namespace.createElement("svg", _extends({
    width: 12,
    height: 7,
    viewBox: "0 0 12 7",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, props), _path || (_path = /*#__PURE__*/React__namespace.createElement("path", {
    d: "M0.97168 1L6.20532 6L11.439 1",
    stroke: "#AEAEAE"
  })));
};

/**
 * Returns the gas value plus a margin for unexpected or variable gas costs
 * @param value the gas value to pad
 */
function calculateGasMargin(value) {
    return value.mul(120).div(100);
}

/**
 * Be careful adding to this enum, always assign a unique value (typescript will not prevent duplicate values).
 * These values is persisted in state and if you change the value it will cause errors
 */
var TransactionType;
(function (TransactionType) {
    TransactionType[TransactionType["APPROVAL"] = 0] = "APPROVAL";
    TransactionType[TransactionType["SWAP"] = 1] = "SWAP";
    TransactionType[TransactionType["DEPOSIT_LIQUIDITY_STAKING"] = 2] = "DEPOSIT_LIQUIDITY_STAKING";
    TransactionType[TransactionType["WITHDRAW_LIQUIDITY_STAKING"] = 3] = "WITHDRAW_LIQUIDITY_STAKING";
    TransactionType[TransactionType["CLAIM"] = 4] = "CLAIM";
    TransactionType[TransactionType["VOTE"] = 5] = "VOTE";
    TransactionType[TransactionType["DELEGATE"] = 6] = "DELEGATE";
    TransactionType[TransactionType["WRAP"] = 7] = "WRAP";
    TransactionType[TransactionType["CREATE_V3_POOL"] = 8] = "CREATE_V3_POOL";
    TransactionType[TransactionType["ADD_LIQUIDITY_V3_POOL"] = 9] = "ADD_LIQUIDITY_V3_POOL";
    TransactionType[TransactionType["ADD_LIQUIDITY_V2_POOL"] = 10] = "ADD_LIQUIDITY_V2_POOL";
    TransactionType[TransactionType["MIGRATE_LIQUIDITY_V3"] = 11] = "MIGRATE_LIQUIDITY_V3";
    TransactionType[TransactionType["COLLECT_FEES"] = 12] = "COLLECT_FEES";
    TransactionType[TransactionType["REMOVE_LIQUIDITY_V3"] = 13] = "REMOVE_LIQUIDITY_V3";
    TransactionType[TransactionType["SUBMIT_PROPOSAL"] = 14] = "SUBMIT_PROPOSAL";
})(TransactionType || (TransactionType = {}));
var addTransaction = toolkit.createAction('transactions/addTransaction');
var clearAllTransactions = toolkit.createAction('transactions/clearAllTransactions');
var finalizeTransaction = toolkit.createAction('transactions/finalizeTransaction');
var checkedTransaction = toolkit.createAction('transactions/checkedTransaction');

var SUPPORTED_TRANSACTION_TYPES = [
    TransactionType.ADD_LIQUIDITY_V2_POOL,
    TransactionType.ADD_LIQUIDITY_V3_POOL,
    TransactionType.CREATE_V3_POOL,
    TransactionType.REMOVE_LIQUIDITY_V3,
    TransactionType.SWAP,
];
var FIREBASE_API_KEY = process.env.REACT_APP_FIREBASE_KEY;
var firebaseEnabled = typeof FIREBASE_API_KEY !== 'undefined';
if (firebaseEnabled)
    initializeFirebase();
function useMonitoringEventCallback() {
    var chainId = useActiveWeb3React().chainId;
    return React.useCallback(function log(type, _a) {
        var transactionResponse = _a.transactionResponse, walletAddress = _a.walletAddress;
        return __awaiter(this, void 0, void 0, function () {
            var db;
            return __generator(this, function (_b) {
                if (!firebaseEnabled)
                    return [2 /*return*/];
                db = database.getDatabase();
                if (!walletAddress) {
                    console.debug('Wallet address required to log monitoring events.');
                    return [2 /*return*/];
                }
                try {
                    database.push(database.ref(db, 'trm'), {
                        chainId: chainId,
                        origin: window.location.origin,
                        timestamp: Date.now(),
                        tx: transactionResponse,
                        type: type,
                        walletAddress: walletAddress,
                    });
                }
                catch (e) {
                    console.debug('Error adding document: ', e);
                }
                return [2 /*return*/];
            });
        });
    }, [chainId]);
}
function useTransactionMonitoringEventCallback() {
    var account = useActiveWeb3React().account;
    var log = useMonitoringEventCallback();
    return React.useCallback(function (info, transactionResponse) {
        if (SUPPORTED_TRANSACTION_TYPES.includes(info.type)) {
            log(TransactionType[info.type], {
                transactionResponse: (function (_a) {
                    var hash = _a.hash, v = _a.v, r = _a.r, s = _a.s;
                    return ({ hash: hash, v: v, r: r, s: s });
                })(transactionResponse),
                walletAddress: account !== null && account !== void 0 ? account : undefined,
            });
        }
    }, [account, log]);
}
function initializeFirebase() {
    app.initializeApp({
        apiKey: process.env.REACT_APP_FIREBASE_KEY,
        authDomain: 'interface-monitoring.firebaseapp.com',
        databaseURL: 'https://interface-monitoring-default-rtdb.firebaseio.com',
        projectId: 'interface-monitoring',
        storageBucket: 'interface-monitoring.appspot.com',
        messagingSenderId: '968187720053',
        appId: '1:968187720053:web:acedf72dce629d470be33c',
    });
}

// helper that can take a ethers library transaction response and add it to the list of transactions
function useTransactionAdder() {
    var _a = useActiveWeb3React(), chainId = _a.chainId, account = _a.account;
    var dispatch = useAppDispatch();
    var logMonitoringEvent = useTransactionMonitoringEventCallback();
    return React.useCallback(function (response, info) {
        if (!account)
            return;
        if (!chainId)
            return;
        var hash = response.hash;
        if (!hash) {
            throw Error('No transaction hash found.');
        }
        dispatch(addTransaction({ hash: hash, from: account, info: info, chainId: chainId }));
        logMonitoringEvent(info, response);
    }, [account, chainId, dispatch, logMonitoringEvent]);
}
// returns all the transactions for the current chain
function useAllTransactions() {
    var _a;
    var chainId = useActiveWeb3React().chainId;
    var state = useAppSelector(function (state) { return state.transactions; });
    return chainId ? (_a = state[chainId]) !== null && _a !== void 0 ? _a : {} : {};
}
function useTransaction(transactionHash) {
    var allTransactions = useAllTransactions();
    if (!transactionHash) {
        return undefined;
    }
    return allTransactions[transactionHash];
}
function useIsTransactionConfirmed(transactionHash) {
    var transactions = useAllTransactions();
    if (!transactionHash || !transactions[transactionHash])
        return false;
    return Boolean(transactions[transactionHash].receipt);
}
/**
 * Returns whether a transaction happened in the last day (86400 seconds * 1000 milliseconds / second)
 * @param tx to check for recency
 */
function isTransactionRecent(tx) {
    return new Date().getTime() - tx.addedTime < 86400000;
}
// returns whether a token has a pending approval transaction
function useHasPendingApproval(token, spender) {
    var allTransactions = useAllTransactions();
    return React.useMemo(function () {
        return typeof (token === null || token === void 0 ? void 0 : token.address) === 'string' &&
            typeof spender === 'string' &&
            Object.keys(allTransactions).some(function (hash) {
                var tx = allTransactions[hash];
                if (!tx)
                    return false;
                if (tx.receipt) {
                    return false;
                }
                else {
                    if (tx.info.type !== TransactionType.APPROVAL)
                        return false;
                    return tx.info.spender === spender && tx.info.tokenAddress === token.address && isTransactionRecent(tx);
                }
            });
    }, [allTransactions, spender, token === null || token === void 0 ? void 0 : token.address]);
}

// gets the current timestamp from the blockchain
function useCurrentBlockTimestamp() {
    var _a, _b;
    var multicall = useInterfaceMulticall();
    return (_b = (_a = useSingleCallResult(multicall, 'getCurrentBlockTimestamp')) === null || _a === void 0 ? void 0 : _a.result) === null || _b === void 0 ? void 0 : _b[0];
}

new abi$6.Interface(abi$5);
({
    1: [
        {
            tokens: [WRAPPED_NATIVE_CURRENCY[1], DAI],
            stakingRewardAddress: '0xa1484C3aa22a66C62b77E0AE78E15258bd0cB711',
        },
        {
            tokens: [WRAPPED_NATIVE_CURRENCY[1], USDC],
            stakingRewardAddress: '0x7FBa4B8Dc5E7616e59622806932DBea72537A56b',
        },
        {
            tokens: [WRAPPED_NATIVE_CURRENCY[1], USDT],
            stakingRewardAddress: '0x6C3e4cb2E96B01F4b866965A91ed4437839A121a',
        },
        {
            tokens: [WRAPPED_NATIVE_CURRENCY[1], WBTC],
            stakingRewardAddress: '0xCA35e32e7926b96A9988f61d510E038108d8068e',
        },
    ],
});

// mimics useAllBalances
function useAllTokenBalances() {
    var account = useActiveWeb3React().account;
    var allTokens = useAllTokens();
    var allTokensArray = React.useMemo(function () { return Object.values(allTokens !== null && allTokens !== void 0 ? allTokens : {}); }, [allTokens]);
    var balances = useTokenBalances(account !== null && account !== void 0 ? account : undefined, allTokensArray);
    return balances !== null && balances !== void 0 ? balances : {};
}

var StyledInput = styled__default["default"].input(templateObject_1$y || (templateObject_1$y = __makeTemplateObject(["\n  color: ", ";\n  width: 0;\n  position: relative;\n  font-weight: 500;\n  outline: none;\n  border: none;\n  flex: 1 1 auto;\n  background-color: ", ";\n  font-size: ", ";\n  text-align: ", ";\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  padding: 0px;\n  -webkit-appearance: textfield;\n  text-align: right;\n\n  ::-webkit-search-decoration {\n    -webkit-appearance: none;\n  }\n\n  [type='number'] {\n    -moz-appearance: textfield;\n  }\n\n  ::-webkit-outer-spin-button,\n  ::-webkit-inner-spin-button {\n    -webkit-appearance: none;\n  }\n\n  ::placeholder {\n    color: ", ";\n  }\n"], ["\n  color: ", ";\n  width: 0;\n  position: relative;\n  font-weight: 500;\n  outline: none;\n  border: none;\n  flex: 1 1 auto;\n  background-color: ", ";\n  font-size: ", ";\n  text-align: ", ";\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  padding: 0px;\n  -webkit-appearance: textfield;\n  text-align: right;\n\n  ::-webkit-search-decoration {\n    -webkit-appearance: none;\n  }\n\n  [type='number'] {\n    -moz-appearance: textfield;\n  }\n\n  ::-webkit-outer-spin-button,\n  ::-webkit-inner-spin-button {\n    -webkit-appearance: none;\n  }\n\n  ::placeholder {\n    color: ", ";\n  }\n"])), function (_a) {
    var error = _a.error, theme = _a.theme;
    return (error ? theme.red1 : theme.text1);
}, function (_a) {
    var theme = _a.theme;
    return theme.bg1;
}, function (_a) {
    var fontSize = _a.fontSize;
    return fontSize !== null && fontSize !== void 0 ? fontSize : '28px';
}, function (_a) {
    var align = _a.align;
    return align && align;
}, function (_a) {
    var theme = _a.theme;
    return theme.text4;
});
var inputRegex = RegExp("^\\d*(?:\\\\[.])?\\d*$"); // match escaped "." characters via in a non-capturing group
var Input$1 = React__default["default"].memo(function InnerInput(_a) {
    var value = _a.value, onUserInput = _a.onUserInput, placeholder = _a.placeholder, prependSymbol = _a.prependSymbol, rest = __rest(_a, ["value", "onUserInput", "placeholder", "prependSymbol"]);
    var enforcer = function (nextUserInput) {
        if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
            onUserInput(nextUserInput);
        }
    };
    return (jsxRuntime.jsx(StyledInput, __assign({}, rest, { value: prependSymbol && value ? prependSymbol + value : value, onChange: function (event) {
            if (prependSymbol) {
                var value_1 = event.target.value;
                // cut off prepended symbol
                var formattedValue = value_1.toString().includes(prependSymbol)
                    ? value_1.toString().slice(1, value_1.toString().length + 1)
                    : value_1;
                // replace commas with periods, because uniswap exclusively uses period as the decimal separator
                enforcer(formattedValue.replace(/,/g, '.'));
            }
            else {
                enforcer(event.target.value.replace(/,/g, '.'));
            }
        }, 
        // universal input options
        inputMode: "decimal", autoComplete: "off", autoCorrect: "off", 
        // text-specific options
        type: "text", pattern: "^[0-9]*[.,]?[0-9]*$", placeholder: placeholder || '0.0', minLength: 1, maxLength: 79, spellCheck: "false" }), void 0));
});
var templateObject_1$y;

// modified from https://usehooks.com/usePrevious/
function usePrevious(value) {
    // The ref object is a generic container whose current property is mutable ...
    // ... and can hold any value, similar to an instance property on a class
    var ref = React.useRef();
    // Store current value in ref
    React.useEffect(function () {
        ref.current = value;
    }, [value]); // Only re-run if value changes
    // Return previous value (happens before update in useEffect above)
    return ref.current;
}

/**
 * Returns the last value of type T that passes a filter function
 * @param value changing value
 * @param filterFn function that determines whether a given value should be considered for the last value
 */
function useLast(value, filterFn) {
    var _a = __read(React.useState(filterFn && filterFn(value) ? value : undefined), 2), last = _a[0], setLast = _a[1];
    React.useEffect(function () {
        setLast(function (last) {
            var shouldUse = filterFn ? filterFn(value) : true;
            if (shouldUse)
                return value;
            return last;
        });
    }, [filterFn, value]);
    return last;
}

function useOnClickOutside(node, handler) {
    var handlerRef = React.useRef(handler);
    React.useEffect(function () {
        handlerRef.current = handler;
    }, [handler]);
    React.useEffect(function () {
        var handleClickOutside = function (e) {
            var _a, _b;
            if ((_b = (_a = node.current) === null || _a === void 0 ? void 0 : _a.contains(e.target)) !== null && _b !== void 0 ? _b : false) {
                return;
            }
            if (handlerRef.current)
                handlerRef.current();
        };
        document.addEventListener('mousedown', handleClickOutside);
        return function () {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [node]);
}

function useToggle(initialState) {
    if (initialState === void 0) { initialState = false; }
    var _a = __read(React.useState(initialState), 2), state = _a[0], setState = _a[1];
    var toggle = React.useCallback(function () { return setState(function (state) { return !state; }); }, []);
    return [state, toggle];
}

function currencyId(currency) {
    if (currency.isNative)
        return 'ETH';
    if (currency.isToken)
        return currency.address;
    throw new Error('invalid currency');
}

var MobileWrapper = styled__default["default"](AutoColumn)(templateObject_2$l || (templateObject_2$l = __makeTemplateObject(["\n  ", ";\n"], ["\n  ", ";\n"])), function (_a) {
    var theme = _a.theme;
    return theme.mediaWidth.upToSmall(templateObject_1$x || (templateObject_1$x = __makeTemplateObject(["\n    display: none;\n  "], ["\n    display: none;\n  "])));
});
var BaseWrapper = styled__default["default"].div(templateObject_3$g || (templateObject_3$g = __makeTemplateObject(["\n  border: 1px solid ", ";\n  border-radius: 10px;\n  display: flex;\n  padding: 6px;\n\n  align-items: center;\n  :hover {\n    cursor: ", ";\n    background-color: ", ";\n  }\n\n  color: ", ";\n  background-color: ", ";\n  filter: ", ";\n"], ["\n  border: 1px solid ", ";\n  border-radius: 10px;\n  display: flex;\n  padding: 6px;\n\n  align-items: center;\n  :hover {\n    cursor: ", ";\n    background-color: ", ";\n  }\n\n  color: ", ";\n  background-color: ", ";\n  filter: ", ";\n"])), function (_a) {
    var theme = _a.theme, disable = _a.disable;
    return (disable ? 'transparent' : theme.bg3);
}, function (_a) {
    var disable = _a.disable;
    return !disable && 'pointer';
}, function (_a) {
    var theme = _a.theme, disable = _a.disable;
    return !disable && theme.bg2;
}, function (_a) {
    var theme = _a.theme, disable = _a.disable;
    return disable && theme.text3;
}, function (_a) {
    var theme = _a.theme, disable = _a.disable;
    return disable && theme.bg3;
}, function (_a) {
    var disable = _a.disable;
    return disable && 'grayscale(1)';
});
function CommonBases(_a) {
    var _b;
    var chainId = _a.chainId, onSelect = _a.onSelect, selectedCurrency = _a.selectedCurrency;
    var bases = typeof chainId !== 'undefined' ? (_b = COMMON_BASES[chainId]) !== null && _b !== void 0 ? _b : [] : [];
    return bases.length > 0 ? (jsxRuntime.jsx(MobileWrapper, __assign({ gap: "md" }, { children: jsxRuntime.jsx(AutoRow, __assign({ gap: "4px" }, { children: bases.map(function (currency) {
                var isSelected = selectedCurrency === null || selectedCurrency === void 0 ? void 0 : selectedCurrency.equals(currency);
                return (jsxRuntime.jsxs(BaseWrapper, __assign({ onClick: function () { return !isSelected && onSelect(currency); }, disable: isSelected }, { children: [jsxRuntime.jsx(CurrencyLogoFromList, { currency: currency }, void 0), jsxRuntime.jsx(rebass.Text, __assign({ fontWeight: 500, fontSize: 16 }, { children: currency.symbol }), void 0)] }), currencyId(currency)));
            }) }), void 0) }), void 0)) : null;
}
/** helper component to retrieve a base currency from the active token lists */
function CurrencyLogoFromList(_a) {
    var currency = _a.currency;
    var token = useTokenInfoFromActiveList(currency);
    return jsxRuntime.jsx(CurrencyLogo, { currency: token, style: { marginRight: 8 } }, void 0);
}
var templateObject_1$x, templateObject_2$l, templateObject_3$g;

var QuestionWrapper = styled__default["default"].div(templateObject_1$w || (templateObject_1$w = __makeTemplateObject(["\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 0px;\n  width: 18px;\n  height: 18px;\n  border: none;\n  background: none;\n  outline: none;\n  cursor: default;\n  border-radius: 36px;\n  font-size: 12px;\n  background-color: ", ";\n  color: ", ";\n\n  :hover,\n  :focus {\n    opacity: 0.7;\n  }\n"], ["\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 0px;\n  width: 18px;\n  height: 18px;\n  border: none;\n  background: none;\n  outline: none;\n  cursor: default;\n  border-radius: 36px;\n  font-size: 12px;\n  background-color: ", ";\n  color: ", ";\n\n  :hover,\n  :focus {\n    opacity: 0.7;\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg2;
}, function (_a) {
    var theme = _a.theme;
    return theme.text2;
});
var QuestionMark = styled__default["default"].span(templateObject_2$k || (templateObject_2$k = __makeTemplateObject(["\n  font-size: 14px;\n"], ["\n  font-size: 14px;\n"])));
function QuestionHelper(_a) {
    var text = _a.text;
    var _b = __read(React.useState(false), 2), show = _b[0], setShow = _b[1];
    var open = React.useCallback(function () { return setShow(true); }, [setShow]);
    var close = React.useCallback(function () { return setShow(false); }, [setShow]);
    return (jsxRuntime.jsx("span", __assign({ style: { marginLeft: 4, display: 'flex', alignItems: 'center' } }, { children: jsxRuntime.jsx(Tooltip, __assign({ text: text, show: show }, { children: jsxRuntime.jsx(QuestionWrapper, __assign({ onClick: open, onMouseEnter: open, onMouseLeave: close }, { children: jsxRuntime.jsx(QuestionMark, { children: "?" }, void 0) }), void 0) }), void 0) }), void 0));
}
var templateObject_1$w, templateObject_2$k;

var TokenListLogo = "data:image/svg+xml,%3Csvg%20width%3D%22225%22%20height%3D%22225%22%20viewBox%3D%220%200%20225%20225%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M74.8125%20190.529C65.7561%20190.513%2055.5298%20183.748%2051.9715%20175.42L19.9417%20100.456C16.3834%2092.1277%2020.8404%2085.39%2029.8968%2085.4068L111.417%2085.5579C120.473%2085.5747%20130.699%2092.3395%20134.258%20100.668L166.288%20175.632C169.846%20183.96%20165.389%20190.697%20156.332%20190.681L74.8125%20190.529Z%22%20fill%3D%22%23131313%22%2F%3E%3Cpath%20d%3D%22M92.1541%20164.065C83.0977%20164.049%2072.8715%20157.284%2069.3132%20148.956L28.3003%2052.9672C24.7419%2044.6391%2029.199%2037.9015%2038.2554%2037.9182L142.638%2038.1117C151.695%2038.1285%20161.921%2044.8933%20165.479%2053.2214L206.492%20149.21C210.051%20157.538%20205.594%20164.276%20196.537%20164.259L92.1541%20164.065Z%22%20fill%3D%22white%22%2F%3E%3Cpath%20d%3D%22M92.1541%20164.065C83.0977%20164.049%2072.8715%20157.284%2069.3132%20148.956L28.3003%2052.9672C24.7419%2044.6391%2029.199%2037.9015%2038.2554%2037.9182L142.638%2038.1117C151.695%2038.1285%20161.921%2044.8933%20165.479%2053.2214L206.492%20149.21C210.051%20157.538%20205.594%20164.276%20196.537%20164.259L92.1541%20164.065Z%22%20fill%3D%22url%28%23paint0_radial%29%22%2F%3E%3Cpath%20d%3D%22M92.1541%20164.065C83.0977%20164.049%2072.8715%20157.284%2069.3132%20148.956L28.3003%2052.9672C24.7419%2044.6391%2029.199%2037.9015%2038.2554%2037.9182L142.638%2038.1117C151.695%2038.1285%20161.921%2044.8933%20165.479%2053.2214L206.492%20149.21C210.051%20157.538%20205.594%20164.276%20196.537%20164.259L92.1541%20164.065Z%22%20fill%3D%22url%28%23paint1_radial%29%22%2F%3E%3Cpath%20d%3D%22M92.1541%20164.065C83.0977%20164.049%2072.8715%20157.284%2069.3132%20148.956L28.3003%2052.9672C24.7419%2044.6391%2029.199%2037.9015%2038.2554%2037.9182L142.638%2038.1117C151.695%2038.1285%20161.921%2044.8933%20165.479%2053.2214L206.492%20149.21C210.051%20157.538%20205.594%20164.276%20196.537%20164.259L92.1541%20164.065Z%22%20fill%3D%22url%28%23paint2_radial%29%22%2F%3E%3Cpath%20d%3D%22M92.1541%20164.065C83.0977%20164.049%2072.8715%20157.284%2069.3132%20148.956L28.3003%2052.9672C24.7419%2044.6391%2029.199%2037.9015%2038.2554%2037.9182L142.638%2038.1117C151.695%2038.1285%20161.921%2044.8933%20165.479%2053.2214L206.492%20149.21C210.051%20157.538%20205.594%20164.276%20196.537%20164.259L92.1541%20164.065Z%22%20fill%3D%22url%28%23paint3_radial%29%22%2F%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M92.958%20165.95C82.7695%20165.931%2071.265%20158.321%2067.2619%20148.952L26.2489%2052.9632C22.2458%2043.5941%2027.26%2036.0143%2037.4485%2036.0332L141.832%2036.2266C152.02%2036.2455%20163.525%2043.8559%20167.528%2053.225L208.541%20149.214C212.544%20158.583%20207.53%20166.163%20197.341%20166.144L92.958%20165.95ZM71.3614%20148.959C74.475%20156.246%2083.4229%20162.166%2091.3473%20162.18L195.73%20162.374C203.655%20162.388%20207.555%20156.493%20204.441%20149.206L163.428%2053.2174C160.315%2045.9304%20151.367%2040.0111%20143.442%2039.9964L39.0592%2039.803C31.1349%2039.7883%2027.2349%2045.6837%2030.3485%2052.9708L71.3614%20148.959Z%22%20fill%3D%22%23131313%22%2F%3E%3Cpath%20d%3D%22M68.565%2053.3425C81.1781%2053.3659%2095.4205%2062.7875%20100.376%2074.3862C105.332%2085.985%2099.1246%2095.3687%2086.5115%2095.3454C73.8984%2095.322%2059.6559%2085.9004%2054.7001%2074.3016C49.7443%2062.7028%2055.9518%2053.3191%2068.565%2053.3425Z%22%20fill%3D%22%23131313%22%2F%3E%3Cpath%20d%3D%22M90.6891%20104.981C103.302%20105.004%20117.545%20114.425%20122.5%20126.024C127.456%20137.623%20121.249%20147.007%20108.636%20146.983C96.0225%20146.96%2081.7801%20137.538%2076.8243%20125.94C71.8685%20114.341%2078.076%20104.957%2090.6891%20104.981Z%22%20fill%3D%22%23131313%22%2F%3E%3Cpath%20d%3D%22M147.538%20105.142C160.151%20105.166%20174.394%20114.587%20179.349%20126.186C184.305%20137.785%20178.098%20147.168%20165.485%20147.145C152.871%20147.122%20138.629%20137.7%20133.673%20126.101C128.717%20114.503%20134.925%20105.119%20147.538%20105.142Z%22%20fill%3D%22%23131313%22%2F%3E%3Cdefs%3E%3CradialGradient%20id%3D%22paint0_radial%22%20cx%3D%220%22%20cy%3D%220%22%20r%3D%221%22%20gradientUnits%3D%22userSpaceOnUse%22%20gradientTransform%3D%22translate%28134.41%2068.3006%29%20rotate%28-33.9533%29%20scale%2890.6795%2083.3208%29%22%3E%3Cstop%20offset%3D%220.661458%22%20stop-color%3D%22%23C4FCF8%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22white%22%20stop-opacity%3D%220%22%2F%3E%3C%2FradialGradient%3E%3CradialGradient%20id%3D%22paint1_radial%22%20cx%3D%220%22%20cy%3D%220%22%20r%3D%221%22%20gradientUnits%3D%22userSpaceOnUse%22%20gradientTransform%3D%22translate%2842.7873%20129.218%29%20rotate%28-24.1606%29%20scale%28213.359%20196.045%29%22%3E%3Cstop%20stop-color%3D%22%23FF0099%22%20stop-opacity%3D%220.9%22%2F%3E%3Cstop%20offset%3D%220.770833%22%20stop-color%3D%22white%22%20stop-opacity%3D%220%22%2F%3E%3C%2FradialGradient%3E%3CradialGradient%20id%3D%22paint2_radial%22%20cx%3D%220%22%20cy%3D%220%22%20r%3D%221%22%20gradientUnits%3D%22userSpaceOnUse%22%20gradientTransform%3D%22translate%28176.854%20148.655%29%20rotate%28-53.4908%29%20scale%28107.342%2098.6309%29%22%3E%3Cstop%20stop-color%3D%22%23FFEC43%22%2F%3E%3Cstop%20offset%3D%220.805707%22%20stop-color%3D%22%23FFF6A8%22%20stop-opacity%3D%220%22%2F%3E%3C%2FradialGradient%3E%3CradialGradient%20id%3D%22paint3_radial%22%20cx%3D%220%22%20cy%3D%220%22%20r%3D%221%22%20gradientUnits%3D%22userSpaceOnUse%22%20gradientTransform%3D%22translate%2857.5443%2053.4752%29%20rotate%2820.3896%29%20scale%28137.027%20125.907%29%22%3E%3Cstop%20offset%3D%220.125%22%20stop-color%3D%22%235886FE%22%20stop-opacity%3D%220.46%22%2F%3E%3Cstop%20offset%3D%220.673044%22%20stop-color%3D%22white%22%20stop-opacity%3D%220%22%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3C%2Fsvg%3E";

var rotate = styled.keyframes(templateObject_1$v || (templateObject_1$v = __makeTemplateObject(["\n  from {\n    transform: rotate(0deg);\n  }\n  to {\n    transform: rotate(360deg);\n  }\n"], ["\n  from {\n    transform: rotate(0deg);\n  }\n  to {\n    transform: rotate(360deg);\n  }\n"])));
var StyledSVG = styled__default["default"].svg(templateObject_2$j || (templateObject_2$j = __makeTemplateObject(["\n  animation: 2s ", " linear infinite;\n  height: ", ";\n  width: ", ";\n  path {\n    stroke: ", ";\n  }\n"], ["\n  animation: 2s ", " linear infinite;\n  height: ", ";\n  width: ", ";\n  path {\n    stroke: ", ";\n  }\n"
    /**
     * Takes in custom size and stroke for circle color, default to primary color as fill,
     * need ...rest for layered styles on top
     */
])), rotate, function (_a) {
    var size = _a.size;
    return size;
}, function (_a) {
    var size = _a.size;
    return size;
}, function (_a) {
    var stroke = _a.stroke, theme = _a.theme;
    return stroke !== null && stroke !== void 0 ? stroke : theme.primary1;
});
/**
 * Takes in custom size and stroke for circle color, default to primary color as fill,
 * need ...rest for layered styles on top
 */
function Loader(_a) {
    var _b = _a.size, size = _b === void 0 ? '16px' : _b, stroke = _a.stroke, rest = __rest(_a, ["size", "stroke"]);
    return (jsxRuntime.jsx(StyledSVG, __assign({ viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", size: size, stroke: stroke }, rest, { children: jsxRuntime.jsx("path", { d: "M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 9.27455 20.9097 6.80375 19.1414 5", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }, void 0) }), void 0));
}
var templateObject_1$v, templateObject_2$j;

var StyledListLogo = styled__default["default"](Logo)(templateObject_1$u || (templateObject_1$u = __makeTemplateObject(["\n  width: ", ";\n  height: ", ";\n"], ["\n  width: ", ";\n  height: ", ";\n"])), function (_a) {
    var size = _a.size;
    return size;
}, function (_a) {
    var size = _a.size;
    return size;
});
function ListLogo(_a) {
    var logoURI = _a.logoURI, style = _a.style, _b = _a.size, size = _b === void 0 ? '24px' : _b, alt = _a.alt;
    var srcs = useHttpLocations(logoURI);
    return jsxRuntime.jsx(StyledListLogo, { alt: alt, size: size, srcs: srcs, style: style }, void 0);
}
var templateObject_1$u;

var TokenSection = styled__default["default"].div(templateObject_1$t || (templateObject_1$t = __makeTemplateObject(["\n  padding: 4px 20px;\n  height: 56px;\n  display: grid;\n  grid-template-columns: auto minmax(auto, 1fr) auto;\n  grid-gap: 16px;\n  align-items: center;\n\n  opacity: ", ";\n"], ["\n  padding: 4px 20px;\n  height: 56px;\n  display: grid;\n  grid-template-columns: auto minmax(auto, 1fr) auto;\n  grid-gap: 16px;\n  align-items: center;\n\n  opacity: ", ";\n"])), function (_a) {
    var dim = _a.dim;
    return (dim ? '0.4' : '1');
});
var CheckIcon = styled__default["default"](reactFeather.CheckCircle)(templateObject_2$i || (templateObject_2$i = __makeTemplateObject(["\n  height: 16px;\n  width: 16px;\n  margin-right: 6px;\n  stroke: ", ";\n"], ["\n  height: 16px;\n  width: 16px;\n  margin-right: 6px;\n  stroke: ", ";\n"])), function (_a) {
    var theme = _a.theme;
    return theme.green1;
});
var NameOverflow = styled__default["default"].div(templateObject_3$f || (templateObject_3$f = __makeTemplateObject(["\n  white-space: nowrap;\n  text-overflow: ellipsis;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  max-width: 140px;\n  font-size: 12px;\n"], ["\n  white-space: nowrap;\n  text-overflow: ellipsis;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  max-width: 140px;\n  font-size: 12px;\n"])));
function ImportRow(_a) {
    var token = _a.token, style = _a.style, dim = _a.dim, showImportView = _a.showImportView, setImportToken = _a.setImportToken;
    var theme = useTheme();
    // check if already active on list or local storage tokens
    var isAdded = useIsUserAddedToken(token);
    var isActive = useIsTokenActive(token);
    var list = token instanceof WrappedTokenInfo ? token.list : undefined;
    return (jsxRuntime.jsxs(TokenSection, __assign({ style: style }, { children: [jsxRuntime.jsx(CurrencyLogo, { currency: token, size: '24px', style: { opacity: dim ? '0.6' : '1' } }, void 0), jsxRuntime.jsxs(AutoColumn, __assign({ gap: "4px", style: { opacity: dim ? '0.6' : '1' } }, { children: [jsxRuntime.jsxs(AutoRow, { children: [jsxRuntime.jsx(ThemedText.Body, __assign({ fontWeight: 500 }, { children: token.symbol }), void 0), jsxRuntime.jsx(ThemedText.DarkGray, __assign({ ml: "8px", fontWeight: 300 }, { children: jsxRuntime.jsx(NameOverflow, __assign({ title: token.name }, { children: token.name }), void 0) }), void 0)] }, void 0), list && list.logoURI && (jsxRuntime.jsxs(RowFixed, { children: [jsxRuntime.jsx(ThemedText.Small, __assign({ mr: "4px", color: theme.text3 }, { children: jsxRuntime.jsxs(macro.Trans, { children: ["via ", list.name, " "] }, void 0) }), void 0), jsxRuntime.jsx(ListLogo, { logoURI: list.logoURI, size: "12px" }, void 0)] }, void 0))] }), void 0), !isActive && !isAdded ? (jsxRuntime.jsx(ButtonPrimary, __assign({ width: "fit-content", padding: "6px 12px", fontWeight: 500, fontSize: "14px", onClick: function () {
                    setImportToken && setImportToken(token);
                    showImportView();
                } }, { children: jsxRuntime.jsx(macro.Trans, { children: "Import" }, void 0) }), void 0)) : (jsxRuntime.jsxs(RowFixed, __assign({ style: { minWidth: 'fit-content' } }, { children: [jsxRuntime.jsx(CheckIcon, {}, void 0), jsxRuntime.jsx(ThemedText.Main, __assign({ color: theme.green1 }, { children: jsxRuntime.jsx(macro.Trans, { children: "Active" }, void 0) }), void 0)] }), void 0))] }), void 0));
}
var templateObject_1$t, templateObject_2$i, templateObject_3$f;

var TextDot = styled__default["default"].div(templateObject_1$s || (templateObject_1$s = __makeTemplateObject(["\n  height: 3px;\n  width: 3px;\n  background-color: ", ";\n  border-radius: 50%;\n"], ["\n  height: 3px;\n  width: 3px;\n  background-color: ", ";\n  border-radius: 50%;\n"])), function (_a) {
    var theme = _a.theme;
    return theme.text2;
});
var Checkbox = styled__default["default"].input(templateObject_2$h || (templateObject_2$h = __makeTemplateObject(["\n  border: 1px solid ", ";\n  height: 20px;\n  margin: 0;\n"], ["\n  border: 1px solid ", ";\n  height: 20px;\n  margin: 0;\n"])), function (_a) {
    var theme = _a.theme;
    return theme.red3;
});
var PaddedColumn = styled__default["default"](AutoColumn)(templateObject_3$e || (templateObject_3$e = __makeTemplateObject(["\n  padding: 20px;\n"], ["\n  padding: 20px;\n"])));
var MenuItem = styled__default["default"](RowBetween)(templateObject_4$9 || (templateObject_4$9 = __makeTemplateObject(["\n  padding: 4px 20px;\n  height: 56px;\n  display: grid;\n  grid-template-columns: auto minmax(auto, 1fr) auto minmax(0, 72px);\n  grid-gap: 16px;\n  cursor: ", ";\n  pointer-events: ", ";\n  :hover {\n    background-color: ", ";\n  }\n  opacity: ", ";\n"], ["\n  padding: 4px 20px;\n  height: 56px;\n  display: grid;\n  grid-template-columns: auto minmax(auto, 1fr) auto minmax(0, 72px);\n  grid-gap: 16px;\n  cursor: ", ";\n  pointer-events: ", ";\n  :hover {\n    background-color: ", ";\n  }\n  opacity: ", ";\n"])), function (_a) {
    var disabled = _a.disabled;
    return !disabled && 'pointer';
}, function (_a) {
    var disabled = _a.disabled;
    return disabled && 'none';
}, function (_a) {
    var theme = _a.theme, disabled = _a.disabled;
    return !disabled && theme.bg2;
}, function (_a) {
    var disabled = _a.disabled, selected = _a.selected;
    return (disabled || selected ? 0.5 : 1);
});
var SearchInput = styled__default["default"].input(templateObject_5$8 || (templateObject_5$8 = __makeTemplateObject(["\n  position: relative;\n  display: flex;\n  padding: 16px;\n  align-items: center;\n  width: 100%;\n  white-space: nowrap;\n  background: none;\n  border: none;\n  outline: none;\n  border-radius: 20px;\n  color: ", ";\n  border-style: solid;\n  border: 1px solid ", ";\n  -webkit-appearance: none;\n\n  font-size: 18px;\n\n  ::placeholder {\n    color: ", ";\n  }\n  transition: border 100ms;\n  :focus {\n    border: 1px solid ", ";\n    outline: none;\n  }\n"], ["\n  position: relative;\n  display: flex;\n  padding: 16px;\n  align-items: center;\n  width: 100%;\n  white-space: nowrap;\n  background: none;\n  border: none;\n  outline: none;\n  border-radius: 20px;\n  color: ", ";\n  border-style: solid;\n  border: 1px solid ", ";\n  -webkit-appearance: none;\n\n  font-size: 18px;\n\n  ::placeholder {\n    color: ", ";\n  }\n  transition: border 100ms;\n  :focus {\n    border: 1px solid ", ";\n    outline: none;\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.text1;
}, function (_a) {
    var theme = _a.theme;
    return theme.bg3;
}, function (_a) {
    var theme = _a.theme;
    return theme.text3;
}, function (_a) {
    var theme = _a.theme;
    return theme.primary1;
});
var Separator = styled__default["default"].div(templateObject_6$5 || (templateObject_6$5 = __makeTemplateObject(["\n  width: 100%;\n  height: 1px;\n  background-color: ", ";\n"], ["\n  width: 100%;\n  height: 1px;\n  background-color: ", ";\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg2;
});
var SeparatorDark = styled__default["default"].div(templateObject_7$4 || (templateObject_7$4 = __makeTemplateObject(["\n  width: 100%;\n  height: 1px;\n  background-color: ", ";\n"], ["\n  width: 100%;\n  height: 1px;\n  background-color: ", ";\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg3;
});
var templateObject_1$s, templateObject_2$h, templateObject_3$e, templateObject_4$9, templateObject_5$8, templateObject_6$5, templateObject_7$4;

function currencyKey(currency) {
    return currency.isToken ? currency.address : 'ETHER';
}
var StyledBalanceText = styled__default["default"](rebass.Text)(templateObject_1$r || (templateObject_1$r = __makeTemplateObject(["\n  white-space: nowrap;\n  overflow: hidden;\n  max-width: 5rem;\n  text-overflow: ellipsis;\n"], ["\n  white-space: nowrap;\n  overflow: hidden;\n  max-width: 5rem;\n  text-overflow: ellipsis;\n"])));
var Tag = styled__default["default"].div(templateObject_2$g || (templateObject_2$g = __makeTemplateObject(["\n  background-color: ", ";\n  color: ", ";\n  font-size: 14px;\n  border-radius: 4px;\n  padding: 0.25rem 0.3rem 0.25rem 0.3rem;\n  max-width: 6rem;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  justify-self: flex-end;\n  margin-right: 4px;\n"], ["\n  background-color: ", ";\n  color: ", ";\n  font-size: 14px;\n  border-radius: 4px;\n  padding: 0.25rem 0.3rem 0.25rem 0.3rem;\n  max-width: 6rem;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  justify-self: flex-end;\n  margin-right: 4px;\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg3;
}, function (_a) {
    var theme = _a.theme;
    return theme.text2;
});
var FixedContentRow = styled__default["default"].div(templateObject_3$d || (templateObject_3$d = __makeTemplateObject(["\n  padding: 4px 20px;\n  height: 56px;\n  display: grid;\n  grid-gap: 16px;\n  align-items: center;\n"], ["\n  padding: 4px 20px;\n  height: 56px;\n  display: grid;\n  grid-gap: 16px;\n  align-items: center;\n"])));
function Balance(_a) {
    var balance = _a.balance;
    return jsxRuntime.jsx(StyledBalanceText, __assign({ title: balance.toExact() }, { children: balance.toSignificant(4) }), void 0);
}
var TagContainer = styled__default["default"].div(templateObject_4$8 || (templateObject_4$8 = __makeTemplateObject(["\n  display: flex;\n  justify-content: flex-end;\n"], ["\n  display: flex;\n  justify-content: flex-end;\n"])));
var TokenListLogoWrapper = styled__default["default"].img(templateObject_5$7 || (templateObject_5$7 = __makeTemplateObject(["\n  height: 20px;\n"], ["\n  height: 20px;\n"])));
function TokenTags(_a) {
    var currency = _a.currency;
    if (!(currency instanceof WrappedTokenInfo)) {
        return jsxRuntime.jsx("span", {}, void 0);
    }
    var tags = currency.tags;
    if (!tags || tags.length === 0)
        return jsxRuntime.jsx("span", {}, void 0);
    var tag = tags[0];
    return (jsxRuntime.jsxs(TagContainer, { children: [jsxRuntime.jsx(MouseoverTooltip, __assign({ text: tag.description }, { children: jsxRuntime.jsx(Tag, { children: tag.name }, tag.id) }), void 0), tags.length > 1 ? (jsxRuntime.jsx(MouseoverTooltip, __assign({ text: tags
                    .slice(1)
                    .map(function (_a) {
                    var name = _a.name, description = _a.description;
                    return name + ": " + description;
                })
                    .join('; \n') }, { children: jsxRuntime.jsx(Tag, { children: "..." }, void 0) }), void 0)) : null] }, void 0));
}
function CurrencyRow(_a) {
    var currency = _a.currency, onSelect = _a.onSelect, isSelected = _a.isSelected, otherSelected = _a.otherSelected, style = _a.style, showCurrencyAmount = _a.showCurrencyAmount;
    var account = useActiveWeb3React().account;
    var key = currencyKey(currency);
    var selectedTokenList = useCombinedActiveList();
    var isOnSelectedList = isTokenOnList(selectedTokenList, currency.isToken ? currency : undefined);
    var customAdded = useIsUserAddedToken(currency);
    var balance = useCurrencyBalance(account !== null && account !== void 0 ? account : undefined, currency);
    // only show add or remove buttons if not on selected list
    return (jsxRuntime.jsxs(MenuItem, __assign({ style: style, className: "token-item-" + key, onClick: function () { return (isSelected ? null : onSelect()); }, disabled: isSelected, selected: otherSelected }, { children: [jsxRuntime.jsx(CurrencyLogo, { currency: currency, size: '24px' }, void 0), jsxRuntime.jsxs(Column, { children: [jsxRuntime.jsx(rebass.Text, __assign({ title: currency.name, fontWeight: 500 }, { children: currency.symbol }), void 0), jsxRuntime.jsx(ThemedText.DarkGray, __assign({ ml: "0px", fontSize: '12px', fontWeight: 300 }, { children: !currency.isNative && !isOnSelectedList && customAdded ? (jsxRuntime.jsxs(macro.Trans, { children: [currency.name, " \u2022 Added by user"] }, void 0)) : (currency.name) }), void 0)] }, void 0), jsxRuntime.jsx(TokenTags, { currency: currency }, void 0), showCurrencyAmount && (jsxRuntime.jsx(RowFixed, __assign({ style: { justifySelf: 'flex-end' } }, { children: balance ? jsxRuntime.jsx(Balance, { balance: balance }, void 0) : account ? jsxRuntime.jsx(Loader, {}, void 0) : null }), void 0))] }), void 0));
}
var BREAK_LINE = 'BREAK';
function isBreakLine(x) {
    return x === BREAK_LINE;
}
function BreakLineComponent(_a) {
    var style = _a.style;
    var theme = useTheme();
    return (jsxRuntime.jsx(FixedContentRow, __assign({ style: style }, { children: jsxRuntime.jsx(LightGreyCard, __assign({ padding: "8px 12px", "$borderRadius": "8px" }, { children: jsxRuntime.jsxs(RowBetween, { children: [jsxRuntime.jsxs(RowFixed, { children: [jsxRuntime.jsx(TokenListLogoWrapper, { src: TokenListLogo }, void 0), jsxRuntime.jsx(ThemedText.Main, __assign({ ml: "6px", fontSize: "12px", color: theme.text1 }, { children: jsxRuntime.jsx(macro.Trans, { children: "Expanded results from inactive Token Lists" }, void 0) }), void 0)] }, void 0), jsxRuntime.jsx(QuestionHelper, { text: jsxRuntime.jsx(macro.Trans, { children: "Tokens from inactive lists. Import specific tokens below or click Manage to activate more lists." }, void 0) }, void 0)] }, void 0) }), void 0) }), void 0));
}
function CurrencyList(_a) {
    var height = _a.height, currencies = _a.currencies, otherListTokens = _a.otherListTokens, selectedCurrency = _a.selectedCurrency, onCurrencySelect = _a.onCurrencySelect, otherCurrency = _a.otherCurrency, fixedListRef = _a.fixedListRef, showImportView = _a.showImportView, setImportToken = _a.setImportToken, showCurrencyAmount = _a.showCurrencyAmount;
    var itemData = React.useMemo(function () {
        if (otherListTokens && (otherListTokens === null || otherListTokens === void 0 ? void 0 : otherListTokens.length) > 0) {
            return __spreadArray(__spreadArray(__spreadArray([], __read(currencies), false), [BREAK_LINE], false), __read(otherListTokens), false);
        }
        return currencies;
    }, [currencies, otherListTokens]);
    var Row = React.useCallback(function TokenRow(_a) {
        var data = _a.data, index = _a.index, style = _a.style;
        var row = data[index];
        if (isBreakLine(row)) {
            return jsxRuntime.jsx(BreakLineComponent, { style: style }, void 0);
        }
        var currency = row;
        var isSelected = Boolean(currency && selectedCurrency && selectedCurrency.equals(currency));
        var otherSelected = Boolean(currency && otherCurrency && otherCurrency.equals(currency));
        var handleSelect = function () { return currency && onCurrencySelect(currency); };
        var token = currency === null || currency === void 0 ? void 0 : currency.wrapped;
        var showImport = index > currencies.length;
        if (showImport && token) {
            return (jsxRuntime.jsx(ImportRow, { style: style, token: token, showImportView: showImportView, setImportToken: setImportToken, dim: true }, void 0));
        }
        else if (currency) {
            return (jsxRuntime.jsx(CurrencyRow, { style: style, currency: currency, isSelected: isSelected, onSelect: handleSelect, otherSelected: otherSelected, showCurrencyAmount: showCurrencyAmount }, void 0));
        }
        else {
            return null;
        }
    }, [
        currencies.length,
        onCurrencySelect,
        otherCurrency,
        selectedCurrency,
        setImportToken,
        showImportView,
        showCurrencyAmount,
    ]);
    var itemKey = React.useCallback(function (index, data) {
        var currency = data[index];
        if (isBreakLine(currency))
            return BREAK_LINE;
        return currencyKey(currency);
    }, []);
    return (jsxRuntime.jsx(reactWindow.FixedSizeList, __assign({ height: height, ref: fixedListRef, width: "100%", itemData: itemData, itemCount: itemData.length, itemSize: 56, itemKey: itemKey }, { children: Row }), void 0));
}
var templateObject_1$r, templateObject_2$g, templateObject_3$d, templateObject_4$8, templateObject_5$7;

var ContentWrapper = styled__default["default"](Column)(templateObject_1$q || (templateObject_1$q = __makeTemplateObject(["\n  width: 100%;\n  flex: 1 1;\n  position: relative;\n"], ["\n  width: 100%;\n  flex: 1 1;\n  position: relative;\n"])));
var Footer$1 = styled__default["default"].div(templateObject_2$f || (templateObject_2$f = __makeTemplateObject(["\n  width: 100%;\n  border-radius: 20px;\n  padding: 20px;\n  border-top-left-radius: 0;\n  border-top-right-radius: 0;\n  background-color: ", ";\n  border-top: 1px solid ", ";\n"], ["\n  width: 100%;\n  border-radius: 20px;\n  padding: 20px;\n  border-top-left-radius: 0;\n  border-top-right-radius: 0;\n  background-color: ", ";\n  border-top: 1px solid ", ";\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg1;
}, function (_a) {
    var theme = _a.theme;
    return theme.bg2;
});
function CurrencySearch(_a) {
    var selectedCurrency = _a.selectedCurrency, onCurrencySelect = _a.onCurrencySelect, otherSelectedCurrency = _a.otherSelectedCurrency, showCommonBases = _a.showCommonBases, showCurrencyAmount = _a.showCurrencyAmount, disableNonToken = _a.disableNonToken, onDismiss = _a.onDismiss, isOpen = _a.isOpen, showManageView = _a.showManageView, showImportView = _a.showImportView, setImportToken = _a.setImportToken;
    var chainId = useActiveWeb3React().chainId;
    var theme = useTheme();
    // refs for fixed size lists
    var fixedList = React.useRef();
    var _b = __read(React.useState(''), 2), searchQuery = _b[0], setSearchQuery = _b[1];
    var debouncedQuery = useDebounce(searchQuery, 200);
    var allTokens = useAllTokens();
    // if they input an address, use it
    var isAddressSearch = isAddress(debouncedQuery);
    var searchToken = useToken(debouncedQuery);
    var searchTokenIsAdded = useIsUserAddedToken(searchToken);
    React.useEffect(function () {
        if (isAddressSearch) {
            ReactGA__default["default"].event({
                category: 'Currency Select',
                action: 'Search by address',
                label: isAddressSearch,
            });
        }
    }, [isAddressSearch]);
    var filteredTokens = React.useMemo(function () {
        return Object.values(allTokens).filter(getTokenFilter(debouncedQuery));
    }, [allTokens, debouncedQuery]);
    var balances = useAllTokenBalances();
    var sortedTokens = React.useMemo(function () {
        return filteredTokens.sort(tokenComparator.bind(null, balances));
    }, [balances, filteredTokens]);
    var filteredSortedTokens = useSortTokensByQuery(debouncedQuery, sortedTokens);
    var native = useNativeCurrency();
    var filteredSortedTokensWithETH = React.useMemo(function () {
        var _a, _b;
        if (!native)
            return filteredSortedTokens;
        var s = debouncedQuery.toLowerCase().trim();
        if (((_b = (_a = native.symbol) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === null || _b === void 0 ? void 0 : _b.indexOf(s)) !== -1) {
            return native ? __spreadArray([native], __read(filteredSortedTokens), false) : filteredSortedTokens;
        }
        return filteredSortedTokens;
    }, [debouncedQuery, native, filteredSortedTokens]);
    var handleCurrencySelect = React.useCallback(function (currency) {
        onCurrencySelect(currency);
        onDismiss();
    }, [onDismiss, onCurrencySelect]);
    // clear the input on open
    React.useEffect(function () {
        if (isOpen)
            setSearchQuery('');
    }, [isOpen]);
    // manage focus on modal show
    var inputRef = React.useRef();
    var handleInput = React.useCallback(function (event) {
        var _a;
        var input = event.target.value;
        var checksummedInput = isAddress(input);
        setSearchQuery(checksummedInput || input);
        (_a = fixedList.current) === null || _a === void 0 ? void 0 : _a.scrollTo(0);
    }, []);
    var handleEnter = React.useCallback(function (e) {
        var _a, _b;
        if (e.key === 'Enter') {
            var s = debouncedQuery.toLowerCase().trim();
            if (s === ((_a = native === null || native === void 0 ? void 0 : native.symbol) === null || _a === void 0 ? void 0 : _a.toLowerCase())) {
                handleCurrencySelect(native);
            }
            else if (filteredSortedTokensWithETH.length > 0) {
                if (((_b = filteredSortedTokensWithETH[0].symbol) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === debouncedQuery.trim().toLowerCase() ||
                    filteredSortedTokensWithETH.length === 1) {
                    handleCurrencySelect(filteredSortedTokensWithETH[0]);
                }
            }
        }
    }, [debouncedQuery, native, filteredSortedTokensWithETH, handleCurrencySelect]);
    // menu ui
    var _c = __read(useToggle(false), 2), open = _c[0], toggle = _c[1];
    var node = React.useRef();
    useOnClickOutside(node, open ? toggle : undefined);
    // if no results on main list, show option to expand into inactive
    var filteredInactiveTokens = useSearchInactiveTokenLists(filteredTokens.length === 0 || (debouncedQuery.length > 2 && !isAddressSearch) ? debouncedQuery : undefined);
    return (jsxRuntime.jsxs(ContentWrapper, { children: [jsxRuntime.jsxs(PaddedColumn, __assign({ gap: "16px" }, { children: [jsxRuntime.jsxs(RowBetween, { children: [jsxRuntime.jsx(rebass.Text, __assign({ fontWeight: 500, fontSize: 16 }, { children: jsxRuntime.jsx(macro.Trans, { children: "Select a token" }, void 0) }), void 0), jsxRuntime.jsx(CloseIcon, { onClick: onDismiss }, void 0)] }, void 0), jsxRuntime.jsx(Row, { children: jsxRuntime.jsx(SearchInput, { type: "text", id: "token-search-input", placeholder: macro.t(templateObject_3$c || (templateObject_3$c = __makeTemplateObject(["Search name or paste address"], ["Search name or paste address"]))), autoComplete: "off", value: searchQuery, ref: inputRef, onChange: handleInput, onKeyDown: handleEnter }, void 0) }, void 0), showCommonBases && (jsxRuntime.jsx(CommonBases, { chainId: chainId, onSelect: handleCurrencySelect, selectedCurrency: selectedCurrency }, void 0))] }), void 0), jsxRuntime.jsx(Separator, {}, void 0), searchToken && !searchTokenIsAdded ? (jsxRuntime.jsx(Column, __assign({ style: { padding: '20px 0', height: '100%' } }, { children: jsxRuntime.jsx(ImportRow, { token: searchToken, showImportView: showImportView, setImportToken: setImportToken }, void 0) }), void 0)) : (filteredSortedTokens === null || filteredSortedTokens === void 0 ? void 0 : filteredSortedTokens.length) > 0 || (filteredInactiveTokens === null || filteredInactiveTokens === void 0 ? void 0 : filteredInactiveTokens.length) > 0 ? (jsxRuntime.jsx("div", __assign({ style: { flex: '1' } }, { children: jsxRuntime.jsx(AutoSizer__default["default"], __assign({ disableWidth: true }, { children: function (_a) {
                        var height = _a.height;
                        return (jsxRuntime.jsx(CurrencyList, { height: height, currencies: disableNonToken ? filteredSortedTokens : filteredSortedTokensWithETH, otherListTokens: filteredInactiveTokens, onCurrencySelect: handleCurrencySelect, otherCurrency: otherSelectedCurrency, selectedCurrency: selectedCurrency, fixedListRef: fixedList, showImportView: showImportView, setImportToken: setImportToken, showCurrencyAmount: showCurrencyAmount }, void 0));
                    } }), void 0) }), void 0)) : (jsxRuntime.jsx(Column, __assign({ style: { padding: '20px', height: '100%' } }, { children: jsxRuntime.jsx(ThemedText.Main, __assign({ color: theme.text3, textAlign: "center", mb: "20px" }, { children: jsxRuntime.jsx(macro.Trans, { children: "No results found." }, void 0) }), void 0) }), void 0)), jsxRuntime.jsx(Footer$1, { children: jsxRuntime.jsx(Row, __assign({ justify: "center" }, { children: jsxRuntime.jsx(ButtonText, __assign({ onClick: showManageView, color: theme.primary1, className: "list-token-manage-button" }, { children: jsxRuntime.jsxs(RowFixed, { children: [jsxRuntime.jsx(IconWrapper, __assign({ size: "16px", marginRight: "6px", stroke: theme.primaryText1 }, { children: jsxRuntime.jsx(reactFeather.Edit, {}, void 0) }), void 0), jsxRuntime.jsx(ThemedText.Main, __assign({ color: theme.primaryText1 }, { children: jsxRuntime.jsx(macro.Trans, { children: "Manage Token Lists" }, void 0) }), void 0)] }, void 0) }), void 0) }), void 0) }, void 0)] }, void 0));
}
var templateObject_1$q, templateObject_2$f, templateObject_3$c;

var UNISWAP_LOGO_URL = "data:image/svg+xml,%3Csvg%20width%3D%2214%22%20height%3D%2215%22%20viewBox%3D%220%200%2014%2015%22%20fill%3D%22black%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20style%3D%22mix-blend-mode%3Adarken%22%3E%3Cpath%20d%3D%22M4.15217%201.55141C3.96412%201.52242%203.95619%201.51902%204.04468%201.5055C4.21427%201.47958%204.61472%201.51491%204.89067%201.58012C5.53489%201.73232%206.12109%202.12221%206.74683%202.81466L6.91307%202.99862L7.15088%202.96062C8.15274%202.8006%209.17194%202.92778%2010.0244%203.31918C10.2589%203.42686%2010.6287%203.64121%2010.6749%203.69629C10.6896%203.71384%2010.7166%203.82684%2010.7349%203.94742C10.7982%204.36458%2010.7665%204.68434%2010.6382%204.92317C10.5683%205.05313%2010.5644%205.09432%2010.6114%205.20554C10.6489%205.2943%2010.7534%205.35999%2010.8569%205.35985C11.0687%205.35956%2011.2968%205.0192%2011.4024%204.54561L11.4444%204.3575L11.5275%204.45109C11.9835%204.96459%2012.3417%205.66488%2012.4032%206.16335L12.4192%206.29332L12.3426%206.17517C12.2107%205.97186%2012.0781%205.83346%2011.9084%205.72183C11.6024%205.52062%2011.2789%205.45215%2010.4222%205.40727C9.64839%205.36675%209.21045%205.30106%208.77621%205.16032C8.03738%204.9209%207.66493%204.60204%206.78729%203.4576C6.39748%202.94928%206.15654%202.66804%205.91687%202.44155C5.37228%201.92691%204.83716%201.65701%204.15217%201.55141Z%22%2F%3E%3Cpath%20d%3D%22M10.8494%202.68637C10.8689%202.34575%2010.9153%202.12108%2011.0088%201.9159C11.0458%201.83469%2011.0804%201.76822%2011.0858%201.76822C11.0911%201.76822%2011.075%201.82816%2011.05%201.90142C10.9821%202.10054%2010.9709%202.3729%2011.0177%202.68978C11.0771%203.09184%2011.1109%203.14985%2011.5385%203.58416C11.739%203.78788%2011.9723%204.0448%2012.0568%204.15511L12.2106%204.35568L12.0568%204.21234C11.8688%204.03705%2011.4364%203.6952%2011.3409%203.64633C11.2768%203.61356%2011.2673%203.61413%2011.2278%203.65321C11.1914%203.68922%2011.1837%203.74333%2011.1787%203.99915C11.1708%204.39786%2011.1161%204.65377%2010.9842%204.90965C10.9128%205.04805%2010.9015%205.01851%2010.9661%204.8623C11.0143%204.74566%2011.0192%204.69439%2011.0189%204.30842C11.0181%203.53291%2010.9255%203.34647%2010.3823%203.02709C10.2447%202.94618%2010.0179%202.8295%209.87839%202.76778C9.73887%202.70606%209.62805%202.6523%209.63208%202.64828C9.64746%202.63307%2010.1772%202.78675%2010.3905%202.86828C10.7077%202.98954%2010.76%203.00526%2010.7985%202.99063C10.8244%202.98082%2010.8369%202.90608%2010.8494%202.68637Z%22%2F%3E%3Cpath%20d%3D%22M4.51745%204.01304C4.13569%203.49066%203.89948%202.68973%203.95062%202.091L3.96643%201.90572L4.05333%201.92148C4.21652%201.95106%204.49789%202.05515%204.62964%202.13469C4.9912%202.35293%205.14773%202.64027%205.30697%203.37811C5.35362%203.59423%205.41482%203.8388%205.44298%203.9216C5.48831%204.05487%205.65962%204.36617%205.7989%204.56834C5.89922%204.71395%205.83258%204.78295%205.61082%204.76305C5.27215%204.73267%204.8134%204.41799%204.51745%204.01304Z%22%2F%3E%3Cpath%20d%3D%22M10.3863%207.90088C8.60224%207.18693%207.97389%206.56721%207.97389%205.52157C7.97389%205.36769%207.97922%205.24179%207.98571%205.24179C7.99221%205.24179%208.06124%205.29257%208.1391%205.35465C8.50088%205.64305%208.906%205.76623%2010.0275%205.92885C10.6875%206.02455%2011.0589%206.10185%2011.4015%206.21477C12.4904%206.57371%2013.1641%207.30212%2013.3248%208.29426C13.3715%208.58255%2013.3441%209.12317%2013.2684%209.4081C13.2087%209.63315%2013.0263%2010.0388%2012.9779%2010.0544C12.9645%2010.0587%2012.9514%2010.0076%2012.9479%209.93809C12.9296%209.56554%2012.7402%209.20285%2012.4221%208.93116C12.0604%208.62227%2011.5745%208.37633%2010.3863%207.90088Z%22%2F%3E%3Cpath%20d%3D%22M9.13385%208.19748C9.11149%208.06527%209.07272%207.89643%209.04769%207.82228L9.00217%207.68748L9.08672%207.7818C9.20374%207.91233%209.2962%208.07937%209.37457%208.30185C9.43438%208.47165%209.44111%208.52215%209.44066%208.79807C9.4402%209.06896%209.43273%209.12575%209.3775%209.27858C9.29042%209.51959%209.18233%209.69048%209.00097%209.87391C8.67507%2010.2036%208.25607%2010.3861%207.65143%2010.4618C7.54633%2010.4749%207.24%2010.4971%206.97069%2010.511C6.292%2010.5461%205.84531%2010.6186%205.44393%2010.7587C5.38623%2010.7788%205.3347%2010.7911%205.32947%2010.7859C5.31323%2010.7698%205.58651%2010.6079%205.81223%2010.4998C6.1305%2010.3474%206.44733%2010.2643%207.15719%2010.1468C7.50785%2010.0887%207.86998%2010.0183%207.96194%209.99029C8.83033%209.72566%209.27671%209.04276%209.13385%208.19748Z%22%2F%3E%3Cpath%20d%3D%22M9.95169%209.64109C9.71465%209.13463%209.66022%208.64564%209.79009%208.18961C9.80399%208.14088%209.82632%208.101%209.83976%208.101C9.85319%208.101%209.90913%208.13105%209.96404%208.16777C10.0733%208.24086%2010.2924%208.36395%2010.876%208.68023C11.6043%209.0749%2012.0196%209.3805%2012.302%209.72965C12.5493%2010.0354%2012.7023%2010.3837%2012.776%2010.8084C12.8177%2011.0489%2012.7932%2011.6277%2012.7311%2011.8699C12.5353%2012.6337%2012.0802%2013.2336%2011.4311%2013.5837C11.336%2013.635%2011.2506%2013.6771%2011.2414%2013.6773C11.2321%2013.6775%2011.2668%2013.5899%2011.3184%2013.4827C11.5367%2013.029%2011.5616%2012.5877%2011.3965%2012.0965C11.2954%2011.7957%2011.0893%2011.4287%2010.6732%2010.8084C10.1893%2010.0873%2010.0707%209.89539%209.95169%209.64109Z%22%2F%3E%3Cpath%20d%3D%22M3.25046%2012.3737C3.91252%2011.8181%204.73629%2011.4234%205.48666%2011.3022C5.81005%2011.25%206.34877%2011.2707%206.64823%2011.3469C7.12824%2011.469%207.55763%2011.7425%207.78094%2012.0683C7.99918%2012.3867%208.09281%2012.6642%208.19029%2013.2816C8.22875%2013.5252%208.27057%2013.7697%208.28323%2013.8251C8.35644%2014.1451%208.4989%2014.4008%208.67544%2014.5293C8.95583%2014.7333%209.43865%2014.7459%209.91362%2014.5618C9.99423%2014.5305%2010.0642%2014.5089%2010.0691%2014.5138C10.0864%2014.5308%209.84719%2014.6899%209.67847%2014.7737C9.45143%2014.8864%209.2709%2014.93%209.03102%2014.93C8.59601%2014.93%208.23486%2014.7101%207.9335%2014.2616C7.87419%2014.1733%207.7409%2013.909%207.63729%2013.6741C7.3191%2012.9528%207.16199%2012.7331%206.79255%2012.4926C6.47104%2012.2834%206.05641%2012.2459%205.74449%2012.3979C5.33475%2012.5976%205.22043%2013.118%205.51389%2013.4478C5.63053%2013.5789%205.84803%2013.6919%206.02588%2013.7139C6.35861%2013.7551%206.64455%2013.5035%206.64455%2013.1696C6.64455%2012.9528%206.56071%2012.8291%206.34966%2012.7344C6.0614%2012.6051%205.75156%2012.7562%205.75304%2013.0254C5.75368%2013.1402%205.80396%2013.2122%205.91971%2013.2643C5.99397%2013.2977%205.99569%2013.3003%205.93514%2013.2878C5.67066%2013.2333%205.6087%2012.9164%205.82135%2012.706C6.07667%2012.4535%206.60461%2012.5649%206.78591%2012.9097C6.86208%2013.0545%206.87092%2013.3429%206.80451%2013.517C6.6559%2013.9068%206.22256%2014.1117%205.78297%2014.0002C5.48368%2013.9242%205.36181%2013.842%205.00097%2013.4726C4.37395%2012.8306%204.13053%2012.7062%203.22657%2012.566L3.05335%2012.5391L3.25046%2012.3737Z%22%2F%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M0.308383%200.883984C2.40235%203.40996%203.84457%204.45213%204.00484%204.67231C4.13717%204.85412%204.08737%205.01757%203.86067%205.14567C3.7346%205.21689%203.47541%205.28905%203.34564%205.28905C3.19887%205.28905%203.14847%205.23278%203.14847%205.23278C3.06337%205.15255%203.01544%205.16658%202.5784%204.39555C1.97166%203.45981%201.46389%202.68357%201.45004%202.67057C1.41801%202.64052%201.41856%202.64153%202.51654%204.59413C2.69394%205.0011%202.55182%205.15049%202.55182%205.20845C2.55182%205.32636%202.51946%205.38834%202.37311%205.55059C2.12914%205.8211%202.02008%206.12505%201.94135%206.7541C1.8531%207.45926%201.60492%207.95737%200.917156%208.80989C0.514562%209.30893%200.448686%209.4004%200.3471%209.60153C0.219144%209.85482%200.183961%209.99669%200.169701%2010.3165C0.154629%2010.6547%200.183983%2010.8732%200.287934%2011.1965C0.378939%2011.4796%200.473932%2011.6665%200.716778%2012.0403C0.926351%2012.3629%201.04702%2012.6027%201.04702%2012.6965C1.04702%2012.7711%201.06136%2012.7712%201.38611%2012.6983C2.16328%2012.5239%202.79434%2012.2171%203.14925%2011.8411C3.36891%2011.6084%203.42048%2011.4799%203.42215%2011.1611C3.42325%2010.9525%203.41587%2010.9088%203.35914%2010.7888C3.2668%2010.5935%203.09869%2010.4311%202.72817%2010.1794C2.2427%209.84953%202.03534%209.58398%201.97807%209.21878C1.93108%208.91913%201.98559%208.70771%202.25416%208.14825C2.53214%207.56916%202.60103%207.32239%202.64763%206.73869C2.67773%206.36158%202.71941%206.21286%202.82842%206.09348C2.94212%205.969%203.04447%205.92684%203.32584%205.88863C3.78457%205.82635%204.07667%205.70839%204.31677%205.48849C4.52505%205.29772%204.61221%205.11391%204.62558%204.8372L4.63574%204.62747L4.51934%204.49259C4.09783%204.00411%200.0261003%200.5%200.000160437%200.5C-0.00538105%200.5%200.133325%200.672804%200.308383%200.883984ZM1.28364%2010.6992C1.37894%2010.5314%201.3283%2010.3158%201.16889%2010.2104C1.01827%2010.1109%200.78428%2010.1578%200.78428%2010.2875C0.78428%2010.3271%200.806303%2010.3559%200.855937%2010.3813C0.939514%2010.424%200.945581%2010.4721%200.879823%2010.5703C0.81323%2010.6698%200.818604%2010.7573%200.894991%2010.8167C1.0181%2010.9125%201.19237%2010.8598%201.28364%2010.6992Z%22%2F%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M4.92523%205.99865C4.70988%206.06439%204.50054%206.29124%204.43574%206.5291C4.39621%206.67421%204.41864%206.92875%204.47785%207.00736C4.57351%207.13433%204.66602%207.16778%204.91651%207.16603C5.40693%207.16263%205.83327%206.95358%205.88284%206.69224C5.92347%206.47801%205.73622%206.18112%205.4783%206.05078C5.34521%205.98355%205.06217%205.95688%204.92523%205.99865ZM5.49853%206.44422C5.57416%206.33741%205.54107%206.22198%205.41245%206.14391C5.1675%205.99525%204.79708%206.11827%204.79708%206.34826C4.79708%206.46274%204.99025%206.58765%205.16731%206.58765C5.28516%206.58765%205.44644%206.5178%205.49853%206.44422Z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E";

var _a$6;
var NETWORK_POLLING_INTERVALS = (_a$6 = {},
    _a$6[SupportedChainId.ARBITRUM_ONE] = ms__default["default"](templateObject_1$p || (templateObject_1$p = __makeTemplateObject(["1s"], ["1s"]))),
    _a$6[SupportedChainId.ARBITRUM_RINKEBY] = ms__default["default"](templateObject_2$e || (templateObject_2$e = __makeTemplateObject(["1s"], ["1s"]))),
    _a$6[SupportedChainId.OPTIMISM] = ms__default["default"](templateObject_3$b || (templateObject_3$b = __makeTemplateObject(["1s"], ["1s"]))),
    _a$6[SupportedChainId.OPTIMISTIC_KOVAN] = ms__default["default"](templateObject_4$7 || (templateObject_4$7 = __makeTemplateObject(["1s"], ["1s"]))),
    _a$6);
function getLibrary(provider) {
    var library = new providers.Web3Provider(provider, typeof provider.chainId === 'number'
        ? provider.chainId
        : typeof provider.chainId === 'string'
            ? parseInt(provider.chainId)
            : 'any');
    library.pollingInterval = 15000;
    library.detectNetwork().then(function (network) {
        var networkPollingInterval = NETWORK_POLLING_INTERVALS[network.chainId];
        if (networkPollingInterval) {
            console.debug('Setting polling interval', networkPollingInterval);
            library.pollingInterval = networkPollingInterval;
        }
    });
    return library;
}
var templateObject_1$p, templateObject_2$e, templateObject_3$b, templateObject_4$7;

var OVERLAY_READY = 'OVERLAY_READY';
var CHAIN_ID_NETWORK_ARGUMENT = {
    1: undefined,
    3: 'ropsten',
    4: 'rinkeby',
    42: 'kovan',
};
var FortmaticConnector = /** @class */ (function (_super) {
    __extends(FortmaticConnector, _super);
    function FortmaticConnector() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    FortmaticConnector.prototype.activate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var Fortmatic, _a, apiKey, chainId, provider, pollForOverlayReady, _b, account;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!!this.fortmatic) return [3 /*break*/, 2];
                        return [4 /*yield*/, Promise.resolve().then(function () { return fortmatic$1; })];
                    case 1:
                        Fortmatic = (_c.sent()).default;
                        _a = this, apiKey = _a.apiKey, chainId = _a.chainId;
                        if (chainId in CHAIN_ID_NETWORK_ARGUMENT) {
                            this.fortmatic = new Fortmatic(apiKey, CHAIN_ID_NETWORK_ARGUMENT[chainId]);
                        }
                        else {
                            throw new Error("Unsupported network ID: " + chainId);
                        }
                        _c.label = 2;
                    case 2:
                        provider = this.fortmatic.getProvider();
                        pollForOverlayReady = new Promise(function (resolve) {
                            var interval = setInterval(function () {
                                if (provider.overlayReady) {
                                    clearInterval(interval);
                                    _this.emit(OVERLAY_READY);
                                    resolve();
                                }
                            }, 200);
                        });
                        return [4 /*yield*/, Promise.all([
                                provider.enable().then(function (accounts) { return accounts[0]; }),
                                pollForOverlayReady,
                            ])];
                    case 3:
                        _b = __read.apply(void 0, [_c.sent(), 1]), account = _b[0];
                        return [2 /*return*/, { provider: this.fortmatic.getProvider(), chainId: this.chainId, account: account }];
                }
            });
        });
    };
    return FortmaticConnector;
}(fortmaticConnector.FortmaticConnector));

var RequestError = /** @class */ (function (_super) {
    __extends(RequestError, _super);
    function RequestError(message, code, data) {
        var _this = _super.call(this, message) || this;
        _this.code = code;
        _this.data = data;
        return _this;
    }
    return RequestError;
}(Error));
var MiniRpcProvider = /** @class */ (function () {
    function MiniRpcProvider(connector, chainId, url, batchWaitTimeMs) {
        var _this = this;
        this.isMetaMask = false;
        this.nextId = 1;
        this.batchTimeoutId = null;
        this.batch = [];
        this.clearBatch = function () { return __awaiter(_this, void 0, void 0, function () {
            var batch, response, json, byKey, json_1, json_1_1, result, _a, resolve, reject, method;
            var e_1, _b;
            var _this = this;
            var _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        console.debug('Clearing batch', this.batch);
                        batch = this.batch;
                        batch = batch.filter(function (b) {
                            if (b.request.method === 'wallet_switchEthereumChain') {
                                try {
                                    _this.connector.changeChainId(parseInt(b.request.params[0].chainId));
                                    b.resolve({ id: b.request.id });
                                }
                                catch (error) {
                                    b.reject(error);
                                }
                                return false;
                            }
                            return true;
                        });
                        this.batch = [];
                        this.batchTimeoutId = null;
                        _f.label = 1;
                    case 1:
                        _f.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fetch(this.url, {
                                method: 'POST',
                                headers: { 'content-type': 'application/json', accept: 'application/json' },
                                body: JSON.stringify(batch.map(function (item) { return item.request; })),
                            })];
                    case 2:
                        response = _f.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _f.sent();
                        batch.forEach(function (_a) {
                            var reject = _a.reject;
                            return reject(new Error('Failed to send batch call'));
                        });
                        return [2 /*return*/];
                    case 4:
                        if (!response.ok) {
                            batch.forEach(function (_a) {
                                var reject = _a.reject;
                                return reject(new RequestError(response.status + ": " + response.statusText, -32000));
                            });
                            return [2 /*return*/];
                        }
                        _f.label = 5;
                    case 5:
                        _f.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, response.json()];
                    case 6:
                        json = _f.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        _f.sent();
                        batch.forEach(function (_a) {
                            var reject = _a.reject;
                            return reject(new Error('Failed to parse JSON response'));
                        });
                        return [2 /*return*/];
                    case 8:
                        byKey = batch.reduce(function (memo, current) {
                            memo[current.request.id] = current;
                            return memo;
                        }, {});
                        try {
                            for (json_1 = __values(json), json_1_1 = json_1.next(); !json_1_1.done; json_1_1 = json_1.next()) {
                                result = json_1_1.value;
                                _a = byKey[result.id], resolve = _a.resolve, reject = _a.reject, method = _a.request.method;
                                if ('error' in result) {
                                    reject(new RequestError((_c = result === null || result === void 0 ? void 0 : result.error) === null || _c === void 0 ? void 0 : _c.message, (_d = result === null || result === void 0 ? void 0 : result.error) === null || _d === void 0 ? void 0 : _d.code, (_e = result === null || result === void 0 ? void 0 : result.error) === null || _e === void 0 ? void 0 : _e.data));
                                }
                                else if ('result' in result && resolve) {
                                    resolve(result.result);
                                }
                                else {
                                    reject(new RequestError("Received unexpected JSON-RPC response to " + method + " request.", -32000, result));
                                }
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (json_1_1 && !json_1_1.done && (_b = json_1.return)) _b.call(json_1);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                        return [2 /*return*/];
                }
            });
        }); };
        this.sendAsync = function (request, callback) {
            _this.request(request.method, request.params)
                .then(function (result) { return callback(null, { jsonrpc: '2.0', id: request.id, result: result }); })
                .catch(function (error) { return callback(error, null); });
        };
        this.request = function (method, params) { return __awaiter(_this, void 0, void 0, function () {
            var promise;
            var _this = this;
            var _a;
            return __generator(this, function (_b) {
                if (typeof method !== 'string') {
                    return [2 /*return*/, this.request(method.method, method.params)];
                }
                if (method === 'eth_chainId') {
                    return [2 /*return*/, "0x" + this.chainId.toString(16)];
                }
                promise = new Promise(function (resolve, reject) {
                    _this.batch.push({
                        request: {
                            jsonrpc: '2.0',
                            id: _this.nextId++,
                            method: method,
                            params: params,
                        },
                        resolve: resolve,
                        reject: reject,
                    });
                });
                this.batchTimeoutId = (_a = this.batchTimeoutId) !== null && _a !== void 0 ? _a : setTimeout(this.clearBatch, this.batchWaitTimeMs);
                return [2 /*return*/, promise];
            });
        }); };
        this.connector = connector;
        this.chainId = chainId;
        this.url = url;
        var parsed = new URL(url);
        this.host = parsed.host;
        this.path = parsed.pathname;
        // how long to wait to batch calls
        this.batchWaitTimeMs = batchWaitTimeMs !== null && batchWaitTimeMs !== void 0 ? batchWaitTimeMs : 50;
    }
    return MiniRpcProvider;
}());
var NetworkConnector = /** @class */ (function (_super) {
    __extends(NetworkConnector, _super);
    function NetworkConnector(_a) {
        var urls = _a.urls, defaultChainId = _a.defaultChainId;
        var _this = this;
        invariant__default["default"](defaultChainId || Object.keys(urls).length === 1, 'defaultChainId is a required argument with >1 url');
        _this = _super.call(this, { supportedChainIds: Object.keys(urls).map(function (k) { return Number(k); }) }) || this;
        _this.currentChainId = defaultChainId !== null && defaultChainId !== void 0 ? defaultChainId : Number(Object.keys(urls)[0]);
        _this.providers = Object.keys(urls).reduce(function (accumulator, chainId) {
            accumulator[Number(chainId)] = new MiniRpcProvider(_this, Number(chainId), urls[Number(chainId)]);
            return accumulator;
        }, {});
        return _this;
    }
    Object.defineProperty(NetworkConnector.prototype, "provider", {
        get: function () {
            return this.providers[this.currentChainId];
        },
        enumerable: false,
        configurable: true
    });
    NetworkConnector.prototype.activate = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, { provider: this.providers[this.currentChainId], chainId: this.currentChainId, account: null }];
            });
        });
    };
    NetworkConnector.prototype.getProvider = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.providers[this.currentChainId]];
            });
        });
    };
    NetworkConnector.prototype.getChainId = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.currentChainId];
            });
        });
    };
    NetworkConnector.prototype.getAccount = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, null];
            });
        });
    };
    NetworkConnector.prototype.deactivate = function () {
        return;
    };
    /**
     * Meant to be called only by MiniRpcProvider
     * @param chainId the new chain id
     */
    NetworkConnector.prototype.changeChainId = function (chainId) {
        if (chainId in this.providers) {
            this.currentChainId = chainId;
            this.emitUpdate({
                chainId: chainId,
                account: null,
                provider: this.providers[chainId],
            });
        }
        else {
            throw new Error("Unsupported chain ID: " + chainId);
        }
    };
    return NetworkConnector;
}(abstractConnector.AbstractConnector));

var FORMATIC_KEY = process.env.REACT_APP_FORTMATIC_KEY;
var PORTIS_ID = process.env.REACT_APP_PORTIS_ID;
var network = new NetworkConnector({
    urls: INFURA_NETWORK_URLS,
    defaultChainId: 1,
});
var networkLibrary;
function getNetworkLibrary() {
    return (networkLibrary = networkLibrary !== null && networkLibrary !== void 0 ? networkLibrary : getLibrary(network.provider));
}
new injectedConnector.InjectedConnector({
    supportedChainIds: ALL_SUPPORTED_CHAIN_IDS,
});
new safeAppsWeb3React.SafeAppConnector();
new walletconnectConnector.WalletConnectConnector({
    supportedChainIds: ALL_SUPPORTED_CHAIN_IDS,
    rpc: INFURA_NETWORK_URLS,
    qrcode: true,
});
// mainnet only
new FortmaticConnector({
    apiKey: FORMATIC_KEY !== null && FORMATIC_KEY !== void 0 ? FORMATIC_KEY : '',
    chainId: 1,
});
// mainnet only
new portisConnector.PortisConnector({
    dAppId: PORTIS_ID !== null && PORTIS_ID !== void 0 ? PORTIS_ID : '',
    networks: [1],
});
new walletlinkConnector.WalletLinkConnector({
    url: INFURA_NETWORK_URLS[SupportedChainId.MAINNET],
    appName: 'Uniswap',
    appLogoUrl: UNISWAP_LOGO_URL,
    supportedChainIds: [SupportedChainId.MAINNET, SupportedChainId.POLYGON],
});

var fetchTokenList = {
    pending: toolkit.createAction('lists/fetchTokenList/pending'),
    fulfilled: toolkit.createAction('lists/fetchTokenList/fulfilled'),
    rejected: toolkit.createAction('lists/fetchTokenList/rejected'),
};
// add and remove from list options
var addList = toolkit.createAction('lists/addList');
var removeList = toolkit.createAction('lists/removeList');
// select which lists to search across from loaded lists
var enableList = toolkit.createAction('lists/enableList');
var disableList = toolkit.createAction('lists/disableList');
// versioning
var acceptListUpdate = toolkit.createAction('lists/acceptListUpdate');

function useFetchListCallback() {
    var _this = this;
    var _a = useActiveWeb3React(), chainId = _a.chainId, library = _a.library;
    var dispatch = useAppDispatch();
    var ensResolver = React.useCallback(function (ensName) { return __awaiter(_this, void 0, void 0, function () {
        var networkLibrary, network;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(!library || chainId !== 1)) return [3 /*break*/, 2];
                    networkLibrary = getNetworkLibrary();
                    return [4 /*yield*/, networkLibrary.getNetwork()];
                case 1:
                    network = _a.sent();
                    if (networkLibrary && network.chainId === 1) {
                        return [2 /*return*/, resolveENSContentHash(ensName, networkLibrary)];
                    }
                    throw new Error('Could not construct mainnet ENS resolver');
                case 2: return [2 /*return*/, resolveENSContentHash(ensName, library)];
            }
        });
    }); }, [chainId, library]);
    // note: prevent dispatch if using for list search or unsupported list
    return React.useCallback(function (listUrl, sendDispatch) {
        if (sendDispatch === void 0) { sendDispatch = true; }
        return __awaiter(_this, void 0, void 0, function () {
            var requestId;
            return __generator(this, function (_a) {
                requestId = toolkit.nanoid();
                sendDispatch && dispatch(fetchTokenList.pending({ requestId: requestId, url: listUrl }));
                return [2 /*return*/, fetchTokenList$1(listUrl, ensResolver)
                        .then(function (tokenList) {
                        sendDispatch && dispatch(fetchTokenList.fulfilled({ url: listUrl, tokenList: tokenList, requestId: requestId }));
                        return tokenList;
                    })
                        .catch(function (error) {
                        console.debug("Failed to get list at url " + listUrl, error);
                        sendDispatch && dispatch(fetchTokenList.rejected({ url: listUrl, requestId: requestId, errorMessage: error.message }));
                        throw error;
                    })];
            });
        });
    }, [dispatch, ensResolver]);
}

var Wrapper$8 = styled__default["default"].div(templateObject_1$o || (templateObject_1$o = __makeTemplateObject(["\n  position: relative;\n  width: 100%;\n  overflow: auto;\n"], ["\n  position: relative;\n  width: 100%;\n  overflow: auto;\n"])));
function ImportList(_a) {
    var _b;
    var listURL = _a.listURL, list = _a.list, setModalView = _a.setModalView, onDismiss = _a.onDismiss;
    var theme = useTheme();
    var dispatch = useAppDispatch();
    // user must accept
    var _c = __read(React.useState(false), 2), confirmed = _c[0], setConfirmed = _c[1];
    var lists = useAllLists();
    var fetchList = useFetchListCallback();
    // monitor is list is loading
    var adding = Boolean((_b = lists[listURL]) === null || _b === void 0 ? void 0 : _b.loadingRequestId);
    var _d = __read(React.useState(null), 2), addError = _d[0], setAddError = _d[1];
    var handleAddList = React.useCallback(function () {
        if (adding)
            return;
        setAddError(null);
        fetchList(listURL)
            .then(function () {
            ReactGA__default["default"].event({
                category: 'Lists',
                action: 'Add List',
                label: listURL,
            });
            // turn list on
            dispatch(enableList(listURL));
            // go back to lists
            setModalView(CurrencyModalView.manage);
        })
            .catch(function (error) {
            ReactGA__default["default"].event({
                category: 'Lists',
                action: 'Add List Failed',
                label: listURL,
            });
            setAddError(error.message);
            dispatch(removeList(listURL));
        });
    }, [adding, dispatch, fetchList, listURL, setModalView]);
    return (jsxRuntime.jsxs(Wrapper$8, { children: [jsxRuntime.jsx(PaddedColumn, __assign({ gap: "14px", style: { width: '100%', flex: '1 1' } }, { children: jsxRuntime.jsxs(RowBetween, { children: [jsxRuntime.jsx(reactFeather.ArrowLeft, { style: { cursor: 'pointer' }, onClick: function () { return setModalView(CurrencyModalView.manage); } }, void 0), jsxRuntime.jsx(ThemedText.MediumHeader, { children: jsxRuntime.jsx(macro.Trans, { children: "Import List" }, void 0) }, void 0), jsxRuntime.jsx(CloseIcon, { onClick: onDismiss }, void 0)] }, void 0) }), void 0), jsxRuntime.jsx(SectionBreak, {}, void 0), jsxRuntime.jsx(PaddedColumn, __assign({ gap: "md" }, { children: jsxRuntime.jsxs(AutoColumn, __assign({ gap: "md" }, { children: [jsxRuntime.jsx(Card, __assign({ backgroundColor: theme.bg2, padding: "12px 20px" }, { children: jsxRuntime.jsx(RowBetween, { children: jsxRuntime.jsxs(RowFixed, { children: [list.logoURI && jsxRuntime.jsx(ListLogo, { logoURI: list.logoURI, size: "40px" }, void 0), jsxRuntime.jsxs(AutoColumn, __assign({ gap: "sm", style: { marginLeft: '20px' } }, { children: [jsxRuntime.jsxs(RowFixed, { children: [jsxRuntime.jsx(ThemedText.Body, __assign({ fontWeight: 600, mr: "6px" }, { children: list.name }), void 0), jsxRuntime.jsx(TextDot, {}, void 0), jsxRuntime.jsx(ThemedText.Main, __assign({ fontSize: '16px', ml: "6px" }, { children: jsxRuntime.jsxs(macro.Trans, { children: [list.tokens.length, " tokens"] }, void 0) }), void 0)] }, void 0), jsxRuntime.jsx(ExternalLink, __assign({ href: "https://tokenlists.org/token-list?url=" + listURL }, { children: jsxRuntime.jsx(ThemedText.Main, __assign({ fontSize: '12px', color: theme.blue1 }, { children: listURL }), void 0) }), void 0)] }), void 0)] }, void 0) }, void 0) }), void 0), jsxRuntime.jsxs(Card, __assign({ style: { backgroundColor: polished.transparentize(0.8, theme.red1) } }, { children: [jsxRuntime.jsxs(AutoColumn, __assign({ justify: "center", style: { textAlign: 'center', gap: '16px', marginBottom: '12px' } }, { children: [jsxRuntime.jsx(reactFeather.AlertTriangle, { stroke: theme.red1, size: 32 }, void 0), jsxRuntime.jsx(ThemedText.Body, __assign({ fontWeight: 500, fontSize: 20, color: theme.red1 }, { children: jsxRuntime.jsx(macro.Trans, { children: "Import at your own risk" }, void 0) }), void 0)] }), void 0), jsxRuntime.jsxs(AutoColumn, __assign({ style: { textAlign: 'center', gap: '16px', marginBottom: '12px' } }, { children: [jsxRuntime.jsx(ThemedText.Body, __assign({ fontWeight: 500, color: theme.red1 }, { children: jsxRuntime.jsx(macro.Trans, { children: "By adding this list you are implicitly trusting that the data is correct. Anyone can create a list, including creating fake versions of existing lists and lists that claim to represent projects that do not have one." }, void 0) }), void 0), jsxRuntime.jsx(ThemedText.Body, __assign({ fontWeight: 600, color: theme.red1 }, { children: jsxRuntime.jsx(macro.Trans, { children: "If you purchase a token from this list, you may not be able to sell it back." }, void 0) }), void 0)] }), void 0), jsxRuntime.jsxs(AutoRow, __assign({ justify: "center", style: { cursor: 'pointer' }, onClick: function () { return setConfirmed(!confirmed); } }, { children: [jsxRuntime.jsx(Checkbox, { name: "confirmed", type: "checkbox", checked: confirmed, onChange: function () { return setConfirmed(!confirmed); } }, void 0), jsxRuntime.jsx(ThemedText.Body, __assign({ ml: "10px", fontSize: "16px", color: theme.red1, fontWeight: 500 }, { children: jsxRuntime.jsx(macro.Trans, { children: "I understand" }, void 0) }), void 0)] }), void 0)] }), void 0), jsxRuntime.jsx(ButtonPrimary, __assign({ disabled: !confirmed, altDisabledStyle: true, "$borderRadius": "20px", padding: "10px 1rem", onClick: handleAddList }, { children: jsxRuntime.jsx(macro.Trans, { children: "Import" }, void 0) }), void 0), addError ? (jsxRuntime.jsx(ThemedText.Error, __assign({ title: addError, style: { textOverflow: 'ellipsis', overflow: 'hidden' }, error: true }, { children: addError }), void 0)) : null] }), void 0) }), void 0)] }, void 0));
}
var templateObject_1$o;

var WarningWrapper = styled__default["default"](Card)(templateObject_1$n || (templateObject_1$n = __makeTemplateObject(["\n  background-color: ", ";\n  width: fit-content;\n"], ["\n  background-color: ", ";\n  width: fit-content;\n"])), function (_a) {
    var theme = _a.theme, highWarning = _a.highWarning;
    return highWarning ? polished.transparentize(0.8, theme.red1) : polished.transparentize(0.8, theme.yellow2);
});
var AddressText = styled__default["default"](ThemedText.Blue)(templateObject_3$a || (templateObject_3$a = __makeTemplateObject(["\n  font-size: 12px;\n  word-break: break-all;\n\n  ", "\n"], ["\n  font-size: 12px;\n  word-break: break-all;\n\n  ", "\n"])), function (_a) {
    var theme = _a.theme;
    return theme.mediaWidth.upToSmall(templateObject_2$d || (templateObject_2$d = __makeTemplateObject(["\n    font-size: 10px;\n  "], ["\n    font-size: 10px;\n  "])));
});
var TokenImportCard = function (_a) {
    var list = _a.list, token = _a.token;
    var theme = styled.useTheme();
    var chainId = useActiveWeb3React().chainId;
    return (jsxRuntime.jsx(Card, __assign({ backgroundColor: theme.bg2, padding: "2rem" }, { children: jsxRuntime.jsxs(AutoColumn, __assign({ gap: "10px", justify: "center" }, { children: [jsxRuntime.jsx(CurrencyLogo, { currency: token, size: '32px' }, void 0), jsxRuntime.jsxs(AutoColumn, __assign({ gap: "4px", justify: "center" }, { children: [jsxRuntime.jsx(ThemedText.Body, __assign({ ml: "8px", mr: "8px", fontWeight: 500, fontSize: 20 }, { children: token.symbol }), void 0), jsxRuntime.jsx(ThemedText.DarkGray, __assign({ fontWeight: 400, fontSize: 14 }, { children: token.name }), void 0)] }), void 0), chainId && (jsxRuntime.jsx(ExternalLink, __assign({ href: getExplorerLink(chainId, token.address, ExplorerDataType.ADDRESS) }, { children: jsxRuntime.jsx(AddressText, __assign({ fontSize: 12 }, { children: token.address }), void 0) }), void 0)), list !== undefined ? (jsxRuntime.jsxs(RowFixed, { children: [list.logoURI && jsxRuntime.jsx(ListLogo, { logoURI: list.logoURI, size: "16px" }, void 0), jsxRuntime.jsx(ThemedText.Small, __assign({ ml: "6px", fontSize: 14, color: theme.text3 }, { children: jsxRuntime.jsxs(macro.Trans, { children: ["via ", list.name, " token list"] }, void 0) }), void 0)] }, void 0)) : (jsxRuntime.jsx(WarningWrapper, __assign({ "$borderRadius": "4px", padding: "4px", highWarning: true }, { children: jsxRuntime.jsxs(RowFixed, { children: [jsxRuntime.jsx(reactFeather.AlertCircle, { stroke: theme.red1, size: "10px" }, void 0), jsxRuntime.jsx(ThemedText.Body, __assign({ color: theme.red1, ml: "4px", fontSize: "10px", fontWeight: 500 }, { children: jsxRuntime.jsx(macro.Trans, { children: "Unknown Source" }, void 0) }), void 0)] }, void 0) }), void 0))] }), void 0) }), void 0));
};
var templateObject_1$n, templateObject_2$d, templateObject_3$a;

var Wrapper$7 = styled__default["default"].div(templateObject_1$m || (templateObject_1$m = __makeTemplateObject(["\n  align-items: center;\n  display: flex;\n  flex-direction: column;\n  flex: 1 1 auto;\n  height: 100%;\n  width: 100%;\n"], ["\n  align-items: center;\n  display: flex;\n  flex-direction: column;\n  flex: 1 1 auto;\n  height: 100%;\n  width: 100%;\n"])));
var Button = styled__default["default"](ButtonPrimary)(templateObject_2$c || (templateObject_2$c = __makeTemplateObject(["\n  margin-top: 1em;\n  padding: 10px 1em;\n"], ["\n  margin-top: 1em;\n  padding: 10px 1em;\n"])));
var Content = styled__default["default"].div(templateObject_3$9 || (templateObject_3$9 = __makeTemplateObject(["\n  padding: 1em;\n"], ["\n  padding: 1em;\n"])));
var Copy = styled__default["default"](ThemedText.Body)(templateObject_4$6 || (templateObject_4$6 = __makeTemplateObject(["\n  text-align: center;\n  margin: 0 2em 1em !important;\n  font-weight: 400;\n  font-size: 16px;\n"], ["\n  text-align: center;\n  margin: 0 2em 1em !important;\n  font-weight: 400;\n  font-size: 16px;\n"])));
var Header = styled__default["default"].div(templateObject_5$6 || (templateObject_5$6 = __makeTemplateObject(["\n  align-items: center;\n  display: flex;\n  gap: 14px;\n  justify-content: space-between;\n  padding: 20px;\n  width: 100%;\n"], ["\n  align-items: center;\n  display: flex;\n  gap: 14px;\n  justify-content: space-between;\n  padding: 20px;\n  width: 100%;\n"])));
var Icon = styled__default["default"](reactFeather.AlertCircle)(templateObject_6$4 || (templateObject_6$4 = __makeTemplateObject(["\n  stroke: ", ";\n  width: 48px;\n  height: 48px;\n"], ["\n  stroke: ", ";\n  width: 48px;\n  height: 48px;\n"])), function (_a) {
    var theme = _a.theme;
    return theme.text2;
});
var BlockedToken = function (_a) {
    var onBack = _a.onBack, onDismiss = _a.onDismiss, blockedTokens = _a.blockedTokens;
    return (jsxRuntime.jsxs(Wrapper$7, { children: [jsxRuntime.jsxs(Header, { children: [onBack ? jsxRuntime.jsx(reactFeather.ArrowLeft, { style: { cursor: 'pointer' }, onClick: onBack }, void 0) : jsxRuntime.jsx("div", {}, void 0), jsxRuntime.jsx(ThemedText.MediumHeader, { children: jsxRuntime.jsx(macro.Trans, { children: "Token not supported" }, void 0) }, void 0), onDismiss ? jsxRuntime.jsx(CloseIcon, { onClick: onDismiss }, void 0) : jsxRuntime.jsx("div", {}, void 0)] }, void 0), jsxRuntime.jsx(Icon, {}, void 0), jsxRuntime.jsxs(Content, { children: [jsxRuntime.jsx(Copy, { children: jsxRuntime.jsx(macro.Trans, { children: "This token is not supported in the Uniswap Labs app" }, void 0) }, void 0), jsxRuntime.jsx(TokenImportCard, { token: blockedTokens[0] }, void 0), jsxRuntime.jsx(Button, __assign({ disabled: true }, { children: jsxRuntime.jsx(macro.Trans, { children: "Import" }, void 0) }), void 0)] }, void 0)] }, void 0));
};
var templateObject_1$m, templateObject_2$c, templateObject_3$9, templateObject_4$6, templateObject_5$6, templateObject_6$4;

var Wrapper$6 = styled__default["default"].div(templateObject_1$l || (templateObject_1$l = __makeTemplateObject(["\n  position: relative;\n  width: 100%;\n  overflow: auto;\n"], ["\n  position: relative;\n  width: 100%;\n  overflow: auto;\n"])));
function ImportToken(props) {
    var tokens = props.tokens, list = props.list, onBack = props.onBack, onDismiss = props.onDismiss, handleCurrencySelect = props.handleCurrencySelect;
    var theme = useTheme();
    var addToken = useAddUserToken();
    var unsupportedTokens = useUnsupportedTokens();
    var unsupportedSet = new Set(Object.keys(unsupportedTokens));
    var intersection = new Set(tokens.filter(function (token) { return unsupportedSet.has(token.address); }));
    if (intersection.size > 0) {
        return jsxRuntime.jsx(BlockedToken, { onBack: onBack, onDismiss: onDismiss, blockedTokens: Array.from(intersection) }, void 0);
    }
    return (jsxRuntime.jsxs(Wrapper$6, { children: [jsxRuntime.jsx(PaddedColumn, __assign({ gap: "14px", style: { width: '100%', flex: '1 1' } }, { children: jsxRuntime.jsxs(RowBetween, { children: [onBack ? jsxRuntime.jsx(reactFeather.ArrowLeft, { style: { cursor: 'pointer' }, onClick: onBack }, void 0) : jsxRuntime.jsx("div", {}, void 0), jsxRuntime.jsx(ThemedText.MediumHeader, { children: jsxRuntime.jsx(macro.Plural, { value: tokens.length, one: "Import token", other: "Import tokens" }, void 0) }, void 0), onDismiss ? jsxRuntime.jsx(CloseIcon, { onClick: onDismiss }, void 0) : jsxRuntime.jsx("div", {}, void 0)] }, void 0) }), void 0), jsxRuntime.jsx(SectionBreak, {}, void 0), jsxRuntime.jsxs(AutoColumn, __assign({ gap: "md", style: { marginBottom: '32px', padding: '1rem' } }, { children: [jsxRuntime.jsxs(AutoColumn, __assign({ justify: "center", style: { textAlign: 'center', gap: '16px', padding: '1rem' } }, { children: [jsxRuntime.jsx(reactFeather.AlertCircle, { size: 48, stroke: theme.text2, strokeWidth: 1 }, void 0), jsxRuntime.jsx(ThemedText.Body, __assign({ fontWeight: 400, fontSize: 16 }, { children: jsxRuntime.jsx(macro.Trans, { children: "This token doesn't appear on the active token list(s). Make sure this is the token that you want to trade." }, void 0) }), void 0)] }), void 0), tokens.map(function (token) { return (jsxRuntime.jsx(TokenImportCard, { token: token, list: list }, 'import' + token.address)); }), jsxRuntime.jsx(ButtonPrimary, __assign({ altDisabledStyle: true, "$borderRadius": "20px", padding: "10px 1rem", onClick: function () {
                            tokens.map(function (token) { return addToken(token); });
                            handleCurrencySelect && handleCurrencySelect(tokens[0]);
                        }, className: ".token-dismiss-button" }, { children: jsxRuntime.jsx(macro.Trans, { children: "Import" }, void 0) }), void 0)] }), void 0)] }, void 0));
}
var templateObject_1$l;

function getColorFromUriPath(uri) {
    return __awaiter(this, void 0, void 0, function () {
        var formattedPath, palette, detectedHex, AAscore;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    formattedPath = uriToHttp(uri)[0];
                    return [4 /*yield*/, Vibrant__default["default"].from(formattedPath).getPalette()];
                case 1:
                    palette = _a.sent();
                    if (!(palette === null || palette === void 0 ? void 0 : palette.Vibrant)) {
                        return [2 /*return*/, null];
                    }
                    detectedHex = palette.Vibrant.hex;
                    AAscore = wcagContrast.hex(detectedHex, '#FFF');
                    while (AAscore < 3) {
                        detectedHex = polished.shade(0.005, detectedHex);
                        AAscore = wcagContrast.hex(detectedHex, '#FFF');
                    }
                    return [2 /*return*/, detectedHex];
            }
        });
    });
}
function useListColor(listImageUri) {
    var _a = __read(React.useState('#2172E5'), 2), color = _a[0], setColor = _a[1];
    React.useLayoutEffect(function () {
        var stale = false;
        if (listImageUri) {
            getColorFromUriPath(listImageUri).then(function (color) {
                if (!stale && color !== null) {
                    setColor(color);
                }
            });
        }
        return function () {
            stale = true;
            setColor('#2172E5');
        };
    }, [listImageUri]);
    return color;
}

function listVersionLabel(version) {
    return "v" + version.major + "." + version.minor + "." + version.patch;
}

var Wrapper$5 = styled__default["default"].button(templateObject_1$k || (templateObject_1$k = __makeTemplateObject(["\n  border-radius: 20px;\n  border: none;\n  background: ", ";\n  display: flex;\n  width: fit-content;\n  cursor: pointer;\n  outline: none;\n  padding: 0.4rem 0.4rem;\n  align-items: center;\n"], ["\n  border-radius: 20px;\n  border: none;\n  background: ", ";\n  display: flex;\n  width: fit-content;\n  cursor: pointer;\n  outline: none;\n  padding: 0.4rem 0.4rem;\n  align-items: center;\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg1;
});
var ToggleElement$1 = styled__default["default"].span(templateObject_2$b || (templateObject_2$b = __makeTemplateObject(["\n  border-radius: 50%;\n  height: 24px;\n  width: 24px;\n  background-color: ", ";\n  :hover {\n    opacity: 0.8;\n  }\n"], ["\n  border-radius: 50%;\n  height: 24px;\n  width: 24px;\n  background-color: ", ";\n  :hover {\n    opacity: 0.8;\n  }\n"])), function (_a) {
    var isActive = _a.isActive, bgColor = _a.bgColor, theme = _a.theme;
    return (isActive ? bgColor : theme.bg4);
});
var StatusText = styled__default["default"](ThemedText.Main)(templateObject_3$8 || (templateObject_3$8 = __makeTemplateObject(["\n  margin: 0 10px;\n  width: 24px;\n  color: ", ";\n"], ["\n  margin: 0 10px;\n  width: 24px;\n  color: ", ";\n"])), function (_a) {
    var theme = _a.theme, isActive = _a.isActive;
    return (isActive ? theme.text1 : theme.text3);
});
function ListToggle(_a) {
    var id = _a.id, isActive = _a.isActive, bgColor = _a.bgColor, toggle = _a.toggle;
    return (jsxRuntime.jsxs(Wrapper$5, __assign({ id: id, isActive: isActive, onClick: toggle }, { children: [isActive && (jsxRuntime.jsx(StatusText, __assign({ fontWeight: "600", margin: "0 6px", isActive: true }, { children: jsxRuntime.jsx(macro.Trans, { children: "ON" }, void 0) }), void 0)), jsxRuntime.jsx(ToggleElement$1, { isActive: isActive, bgColor: bgColor }, void 0), !isActive && (jsxRuntime.jsx(StatusText, __assign({ fontWeight: "600", margin: "0 6px", isActive: false }, { children: jsxRuntime.jsx(macro.Trans, { children: "OFF" }, void 0) }), void 0))] }), void 0));
}
var templateObject_1$k, templateObject_2$b, templateObject_3$8;

var Wrapper$4 = styled__default["default"](Column)(templateObject_1$j || (templateObject_1$j = __makeTemplateObject(["\n  flex: 1;\n  overflow-y: hidden;\n"], ["\n  flex: 1;\n  overflow-y: hidden;\n"])));
var UnpaddedLinkStyledButton = styled__default["default"](LinkStyledButton)(templateObject_2$a || (templateObject_2$a = __makeTemplateObject(["\n  padding: 0;\n  font-size: 1rem;\n  opacity: ", ";\n"], ["\n  padding: 0;\n  font-size: 1rem;\n  opacity: ", ";\n"])), function (_a) {
    var disabled = _a.disabled;
    return (disabled ? '0.4' : '1');
});
var PopoverContainer = styled__default["default"].div(templateObject_3$7 || (templateObject_3$7 = __makeTemplateObject(["\n  z-index: 100;\n  visibility: ", ";\n  opacity: ", ";\n  transition: visibility 150ms linear, opacity 150ms linear;\n  background: ", ";\n  border: 1px solid ", ";\n  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),\n    0px 24px 32px rgba(0, 0, 0, 0.01);\n  color: ", ";\n  border-radius: 0.5rem;\n  padding: 1rem;\n  display: grid;\n  grid-template-rows: 1fr;\n  grid-gap: 8px;\n  font-size: 1rem;\n  text-align: left;\n"], ["\n  z-index: 100;\n  visibility: ", ";\n  opacity: ", ";\n  transition: visibility 150ms linear, opacity 150ms linear;\n  background: ", ";\n  border: 1px solid ", ";\n  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),\n    0px 24px 32px rgba(0, 0, 0, 0.01);\n  color: ", ";\n  border-radius: 0.5rem;\n  padding: 1rem;\n  display: grid;\n  grid-template-rows: 1fr;\n  grid-gap: 8px;\n  font-size: 1rem;\n  text-align: left;\n"])), function (props) { return (props.show ? 'visible' : 'hidden'); }, function (props) { return (props.show ? 1 : 0); }, function (_a) {
    var theme = _a.theme;
    return theme.bg2;
}, function (_a) {
    var theme = _a.theme;
    return theme.bg3;
}, function (_a) {
    var theme = _a.theme;
    return theme.text2;
});
var StyledMenu$1 = styled__default["default"].div(templateObject_4$5 || (templateObject_4$5 = __makeTemplateObject(["\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  position: relative;\n  border: none;\n"], ["\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  position: relative;\n  border: none;\n"])));
var StyledTitleText = styled__default["default"].div(templateObject_5$5 || (templateObject_5$5 = __makeTemplateObject(["\n  font-size: 16px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  font-weight: 600;\n  color: ", ";\n"], ["\n  font-size: 16px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  font-weight: 600;\n  color: ", ";\n"])), function (_a) {
    var theme = _a.theme, active = _a.active;
    return (active ? theme.white : theme.text2);
});
var StyledListUrlText = styled__default["default"](ThemedText.Main)(templateObject_6$3 || (templateObject_6$3 = __makeTemplateObject(["\n  font-size: 12px;\n  color: ", ";\n"], ["\n  font-size: 12px;\n  color: ", ";\n"])), function (_a) {
    var theme = _a.theme, active = _a.active;
    return (active ? theme.white : theme.text2);
});
var RowWrapper = styled__default["default"](Row)(templateObject_7$3 || (templateObject_7$3 = __makeTemplateObject(["\n  background-color: ", ";\n  opacity: ", ";\n  transition: 200ms;\n  align-items: center;\n  padding: 1rem;\n  border-radius: 20px;\n"], ["\n  background-color: ", ";\n  opacity: ", ";\n  transition: 200ms;\n  align-items: center;\n  padding: 1rem;\n  border-radius: 20px;\n"])), function (_a) {
    var bgColor = _a.bgColor, active = _a.active, theme = _a.theme;
    return (active ? bgColor !== null && bgColor !== void 0 ? bgColor : 'transparent' : theme.bg2);
}, function (_a) {
    var hasActiveTokens = _a.hasActiveTokens;
    return (hasActiveTokens ? 1 : 0.4);
});
function listUrlRowHTMLId(listUrl) {
    return "list-row-" + listUrl.replace(/\./g, '-');
}
var ListRow = React.memo(function ListRow(_a) {
    var listUrl = _a.listUrl;
    var chainId = useActiveWeb3React().chainId;
    var listsByUrl = useAppSelector(function (state) { return state.lists.byUrl; });
    var dispatch = useAppDispatch();
    var _b = listsByUrl[listUrl], list = _b.current, pending = _b.pendingUpdate;
    var activeTokensOnThisChain = React.useMemo(function () {
        if (!list || !chainId) {
            return 0;
        }
        return list.tokens.reduce(function (acc, cur) { return (cur.chainId === chainId ? acc + 1 : acc); }, 0);
    }, [chainId, list]);
    var theme = useTheme();
    var listColor = useListColor(list === null || list === void 0 ? void 0 : list.logoURI);
    var isActive = useIsListActive(listUrl);
    var _c = __read(useToggle(false), 2), open = _c[0], toggle = _c[1];
    var node = React.useRef();
    var _d = __read(React.useState(), 2), referenceElement = _d[0], setReferenceElement = _d[1];
    var _e = __read(React.useState(), 2), popperElement = _e[0], setPopperElement = _e[1];
    var _f = reactPopper.usePopper(referenceElement, popperElement, {
        placement: 'auto',
        strategy: 'fixed',
        modifiers: [{ name: 'offset', options: { offset: [8, 8] } }],
    }), styles = _f.styles, attributes = _f.attributes;
    useOnClickOutside(node, open ? toggle : undefined);
    var handleAcceptListUpdate = React.useCallback(function () {
        if (!pending)
            return;
        ReactGA__default["default"].event({
            category: 'Lists',
            action: 'Update List from List Select',
            label: listUrl,
        });
        dispatch(acceptListUpdate(listUrl));
    }, [dispatch, listUrl, pending]);
    var handleRemoveList = React.useCallback(function () {
        ReactGA__default["default"].event({
            category: 'Lists',
            action: 'Start Remove List',
            label: listUrl,
        });
        if (window.prompt(macro.t(templateObject_8$2 || (templateObject_8$2 = __makeTemplateObject(["Please confirm you would like to remove this list by typing REMOVE"], ["Please confirm you would like to remove this list by typing REMOVE"])))) === "REMOVE") {
            ReactGA__default["default"].event({
                category: 'Lists',
                action: 'Confirm Remove List',
                label: listUrl,
            });
            dispatch(removeList(listUrl));
        }
    }, [dispatch, listUrl]);
    var handleEnableList = React.useCallback(function () {
        ReactGA__default["default"].event({
            category: 'Lists',
            action: 'Enable List',
            label: listUrl,
        });
        dispatch(enableList(listUrl));
    }, [dispatch, listUrl]);
    var handleDisableList = React.useCallback(function () {
        ReactGA__default["default"].event({
            category: 'Lists',
            action: 'Disable List',
            label: listUrl,
        });
        dispatch(disableList(listUrl));
    }, [dispatch, listUrl]);
    if (!list)
        return null;
    return (jsxRuntime.jsxs(RowWrapper, __assign({ active: isActive, hasActiveTokens: activeTokensOnThisChain > 0, bgColor: listColor, id: listUrlRowHTMLId(listUrl) }, { children: [list.logoURI ? (jsxRuntime.jsx(ListLogo, { size: "40px", style: { marginRight: '1rem' }, logoURI: list.logoURI, alt: list.name + " list logo" }, void 0)) : (jsxRuntime.jsx("div", { style: { width: '24px', height: '24px', marginRight: '1rem' } }, void 0)), jsxRuntime.jsxs(Column, __assign({ style: { flex: '1' } }, { children: [jsxRuntime.jsx(Row, { children: jsxRuntime.jsx(StyledTitleText, __assign({ active: isActive }, { children: list.name }), void 0) }, void 0), jsxRuntime.jsxs(RowFixed, __assign({ mt: "4px" }, { children: [jsxRuntime.jsx(StyledListUrlText, __assign({ active: isActive, mr: "6px" }, { children: jsxRuntime.jsxs(macro.Trans, { children: [activeTokensOnThisChain, " tokens"] }, void 0) }), void 0), jsxRuntime.jsxs(StyledMenu$1, __assign({ ref: node }, { children: [jsxRuntime.jsx(ButtonEmpty, __assign({ onClick: toggle, ref: setReferenceElement, padding: "0" }, { children: jsxRuntime.jsx(reactFeather.Settings, { stroke: isActive ? theme.bg1 : theme.text1, size: 12 }, void 0) }), void 0), open && (jsxRuntime.jsxs(PopoverContainer, __assign({ show: true, ref: setPopperElement, style: styles.popper }, attributes.popper, { children: [jsxRuntime.jsx("div", { children: list && listVersionLabel(list.version) }, void 0), jsxRuntime.jsx(SeparatorDark, {}, void 0), jsxRuntime.jsx(ExternalLink, __assign({ href: "https://tokenlists.org/token-list?url=" + listUrl }, { children: jsxRuntime.jsx(macro.Trans, { children: "View list" }, void 0) }), void 0), jsxRuntime.jsx(UnpaddedLinkStyledButton, __assign({ onClick: handleRemoveList, disabled: Object.keys(listsByUrl).length === 1 }, { children: jsxRuntime.jsx(macro.Trans, { children: "Remove list" }, void 0) }), void 0), pending && (jsxRuntime.jsx(UnpaddedLinkStyledButton, __assign({ onClick: handleAcceptListUpdate }, { children: jsxRuntime.jsx(macro.Trans, { children: "Update list" }, void 0) }), void 0))] }), void 0))] }), void 0)] }), void 0)] }), void 0), jsxRuntime.jsx(ListToggle, { isActive: isActive, bgColor: listColor, toggle: function () {
                    isActive ? handleDisableList() : handleEnableList();
                } }, void 0)] }), listUrl));
});
var ListContainer = styled__default["default"].div(templateObject_9$2 || (templateObject_9$2 = __makeTemplateObject(["\n  padding: 1rem;\n  height: 100%;\n  overflow: auto;\n  flex: 1;\n"], ["\n  padding: 1rem;\n  height: 100%;\n  overflow: auto;\n  flex: 1;\n"])));
function ManageLists(_a) {
    var setModalView = _a.setModalView, setImportList = _a.setImportList, setListUrl = _a.setListUrl;
    var chainId = useActiveWeb3React().chainId;
    var theme = useTheme();
    var _b = __read(React.useState(''), 2), listUrlInput = _b[0], setListUrlInput = _b[1];
    var lists = useAllLists();
    var tokenCountByListName = React.useMemo(function () {
        return Object.values(lists).reduce(function (acc, _a) {
            var _b;
            var list = _a.current;
            if (!list) {
                return acc;
            }
            return __assign(__assign({}, acc), (_b = {}, _b[list.name] = list.tokens.reduce(function (count, token) { return (token.chainId === chainId ? count + 1 : count); }, 0), _b));
        }, {});
    }, [chainId, lists]);
    // sort by active but only if not visible
    var activeListUrls = useActiveListUrls();
    var handleInput = React.useCallback(function (e) {
        setListUrlInput(e.target.value);
    }, []);
    var fetchList = useFetchListCallback();
    var validUrl = React.useMemo(function () {
        return uriToHttp(listUrlInput).length > 0 || Boolean(parseENSAddress(listUrlInput));
    }, [listUrlInput]);
    var sortedLists = React.useMemo(function () {
        var listUrls = Object.keys(lists);
        return listUrls
            .filter(function (listUrl) {
            // only show loaded lists, hide unsupported lists
            return Boolean(lists[listUrl].current) && !Boolean(UNSUPPORTED_LIST_URLS.includes(listUrl));
        })
            .sort(function (listUrlA, listUrlB) {
            var listA = lists[listUrlA].current;
            var listB = lists[listUrlB].current;
            // first filter on active lists
            if ((activeListUrls === null || activeListUrls === void 0 ? void 0 : activeListUrls.includes(listUrlA)) && !(activeListUrls === null || activeListUrls === void 0 ? void 0 : activeListUrls.includes(listUrlB))) {
                return -1;
            }
            if (!(activeListUrls === null || activeListUrls === void 0 ? void 0 : activeListUrls.includes(listUrlA)) && (activeListUrls === null || activeListUrls === void 0 ? void 0 : activeListUrls.includes(listUrlB))) {
                return 1;
            }
            if (listA && listB) {
                if (tokenCountByListName[listA.name] > tokenCountByListName[listB.name]) {
                    return -1;
                }
                if (tokenCountByListName[listA.name] < tokenCountByListName[listB.name]) {
                    return 1;
                }
                return listA.name.toLowerCase() < listB.name.toLowerCase()
                    ? -1
                    : listA.name.toLowerCase() === listB.name.toLowerCase()
                        ? 0
                        : 1;
            }
            if (listA)
                return -1;
            if (listB)
                return 1;
            return 0;
        });
    }, [lists, activeListUrls, tokenCountByListName]);
    // temporary fetched list for import flow
    var _c = __read(React.useState(), 2), tempList = _c[0], setTempList = _c[1];
    var _d = __read(React.useState(), 2), addError = _d[0], setAddError = _d[1];
    React.useEffect(function () {
        function fetchTempList() {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    fetchList(listUrlInput, false)
                        .then(function (list) { return setTempList(list); })
                        .catch(function () { return setAddError(macro.t(templateObject_10$2 || (templateObject_10$2 = __makeTemplateObject(["Error importing list"], ["Error importing list"])))); });
                    return [2 /*return*/];
                });
            });
        }
        // if valid url, fetch details for card
        if (validUrl) {
            fetchTempList();
        }
        else {
            setTempList(undefined);
            listUrlInput !== '' && setAddError(macro.t(templateObject_11$2 || (templateObject_11$2 = __makeTemplateObject(["Enter valid list location"], ["Enter valid list location"]))));
        }
        // reset error
        if (listUrlInput === '') {
            setAddError(undefined);
        }
    }, [fetchList, listUrlInput, validUrl]);
    // check if list is already imported
    var isImported = Object.keys(lists).includes(listUrlInput);
    // set list values and have parent modal switch to import list view
    var handleImport = React.useCallback(function () {
        if (!tempList)
            return;
        setImportList(tempList);
        setModalView(CurrencyModalView.importList);
        setListUrl(listUrlInput);
    }, [listUrlInput, setImportList, setListUrl, setModalView, tempList]);
    return (jsxRuntime.jsxs(Wrapper$4, { children: [jsxRuntime.jsxs(PaddedColumn, __assign({ gap: "14px" }, { children: [jsxRuntime.jsx(Row, { children: jsxRuntime.jsx(SearchInput, { type: "text", id: "list-add-input", placeholder: macro.t(templateObject_12$2 || (templateObject_12$2 = __makeTemplateObject(["https:// or ipfs:// or ENS name"], ["https:// or ipfs:// or ENS name"]))), value: listUrlInput, onChange: handleInput }, void 0) }, void 0), addError ? (jsxRuntime.jsx(ThemedText.Error, __assign({ title: addError, style: { textOverflow: 'ellipsis', overflow: 'hidden' }, error: true }, { children: addError }), void 0)) : null] }), void 0), tempList && (jsxRuntime.jsx(PaddedColumn, __assign({ style: { paddingTop: 0 } }, { children: jsxRuntime.jsx(Card, __assign({ backgroundColor: theme.bg2, padding: "12px 20px" }, { children: jsxRuntime.jsxs(RowBetween, { children: [jsxRuntime.jsxs(RowFixed, { children: [tempList.logoURI && jsxRuntime.jsx(ListLogo, { logoURI: tempList.logoURI, size: "40px" }, void 0), jsxRuntime.jsxs(AutoColumn, __assign({ gap: "4px", style: { marginLeft: '20px' } }, { children: [jsxRuntime.jsx(ThemedText.Body, __assign({ fontWeight: 600 }, { children: tempList.name }), void 0), jsxRuntime.jsx(ThemedText.Main, __assign({ fontSize: '12px' }, { children: jsxRuntime.jsxs(macro.Trans, { children: [tempList.tokens.length, " tokens"] }, void 0) }), void 0)] }), void 0)] }, void 0), isImported ? (jsxRuntime.jsxs(RowFixed, { children: [jsxRuntime.jsx(IconWrapper, __assign({ stroke: theme.text2, size: "16px", marginRight: '10px' }, { children: jsxRuntime.jsx(reactFeather.CheckCircle, {}, void 0) }), void 0), jsxRuntime.jsx(ThemedText.Body, __assign({ color: theme.text2 }, { children: jsxRuntime.jsx(macro.Trans, { children: "Loaded" }, void 0) }), void 0)] }, void 0)) : (jsxRuntime.jsx(ButtonPrimary, __assign({ style: { fontSize: '14px' }, padding: "6px 8px", width: "fit-content", onClick: handleImport }, { children: jsxRuntime.jsx(macro.Trans, { children: "Import" }, void 0) }), void 0))] }, void 0) }), void 0) }), void 0)), jsxRuntime.jsx(Separator, {}, void 0), jsxRuntime.jsx(ListContainer, { children: jsxRuntime.jsx(AutoColumn, __assign({ gap: "md" }, { children: sortedLists.map(function (listUrl) { return (jsxRuntime.jsx(ListRow, { listUrl: listUrl }, listUrl)); }) }), void 0) }, void 0)] }, void 0));
}
var templateObject_1$j, templateObject_2$a, templateObject_3$7, templateObject_4$5, templateObject_5$5, templateObject_6$3, templateObject_7$3, templateObject_8$2, templateObject_9$2, templateObject_10$2, templateObject_11$2, templateObject_12$2;

var Wrapper$3 = styled__default["default"].div(templateObject_1$i || (templateObject_1$i = __makeTemplateObject(["\n  width: 100%;\n  height: calc(100% - 60px);\n  position: relative;\n  padding-bottom: 80px;\n"], ["\n  width: 100%;\n  height: calc(100% - 60px);\n  position: relative;\n  padding-bottom: 80px;\n"])));
var Footer = styled__default["default"].div(templateObject_2$9 || (templateObject_2$9 = __makeTemplateObject(["\n  position: absolute;\n  bottom: 0;\n  width: 100%;\n  border-radius: 20px;\n  border-top-right-radius: 0;\n  border-top-left-radius: 0;\n  border-top: 1px solid ", ";\n  padding: 20px;\n  text-align: center;\n"], ["\n  position: absolute;\n  bottom: 0;\n  width: 100%;\n  border-radius: 20px;\n  border-top-right-radius: 0;\n  border-top-left-radius: 0;\n  border-top: 1px solid ", ";\n  padding: 20px;\n  text-align: center;\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg3;
});
function ManageTokens(_a) {
    var setModalView = _a.setModalView, setImportToken = _a.setImportToken;
    var chainId = useActiveWeb3React().chainId;
    var _b = __read(React.useState(''), 2), searchQuery = _b[0], setSearchQuery = _b[1];
    var theme = useTheme();
    // manage focus on modal show
    var inputRef = React.useRef();
    var handleInput = React.useCallback(function (event) {
        var input = event.target.value;
        var checksummedInput = isAddress(input);
        setSearchQuery(checksummedInput || input);
    }, []);
    // if they input an address, use it
    var isAddressSearch = isAddress(searchQuery);
    var searchToken = useToken(searchQuery);
    // all tokens for local lisr
    var userAddedTokens = useUserAddedTokens();
    var removeToken = useRemoveUserAddedToken();
    var handleRemoveAll = React.useCallback(function () {
        if (chainId && userAddedTokens) {
            userAddedTokens.map(function (token) {
                return removeToken(chainId, token.address);
            });
        }
    }, [removeToken, userAddedTokens, chainId]);
    var tokenList = React.useMemo(function () {
        return (chainId &&
            userAddedTokens.map(function (token) { return (jsxRuntime.jsxs(RowBetween, __assign({ width: "100%" }, { children: [jsxRuntime.jsxs(RowFixed, { children: [jsxRuntime.jsx(CurrencyLogo, { currency: token, size: '20px' }, void 0), jsxRuntime.jsx(ExternalLink, __assign({ href: getExplorerLink(chainId, token.address, ExplorerDataType.ADDRESS) }, { children: jsxRuntime.jsx(ThemedText.Main, __assign({ ml: '10px', fontWeight: 600 }, { children: token.symbol }), void 0) }), void 0)] }, void 0), jsxRuntime.jsxs(RowFixed, { children: [jsxRuntime.jsx(TrashIcon, { onClick: function () { return removeToken(chainId, token.address); } }, void 0), jsxRuntime.jsx(ExternalLinkIcon, { href: getExplorerLink(chainId, token.address, ExplorerDataType.ADDRESS) }, void 0)] }, void 0)] }), token.address)); }));
    }, [userAddedTokens, chainId, removeToken]);
    return (jsxRuntime.jsxs(Wrapper$3, { children: [jsxRuntime.jsxs(Column, __assign({ style: { width: '100%', height: '100%', flex: '1 1' } }, { children: [jsxRuntime.jsxs(PaddedColumn, __assign({ gap: "14px" }, { children: [jsxRuntime.jsx(Row, { children: jsxRuntime.jsx(SearchInput, { type: "text", id: "token-search-input", placeholder: '0x0000', value: searchQuery, autoComplete: "off", ref: inputRef, onChange: handleInput }, void 0) }, void 0), searchQuery !== '' && !isAddressSearch && (jsxRuntime.jsx(ThemedText.Error, __assign({ error: true }, { children: jsxRuntime.jsx(macro.Trans, { children: "Enter valid token address" }, void 0) }), void 0)), searchToken && (jsxRuntime.jsx(Card, __assign({ backgroundColor: theme.bg2, padding: "10px 0" }, { children: jsxRuntime.jsx(ImportRow, { token: searchToken, showImportView: function () { return setModalView(CurrencyModalView.importToken); }, setImportToken: setImportToken, style: { height: 'fit-content' } }, void 0) }), void 0))] }), void 0), jsxRuntime.jsx(Separator, {}, void 0), jsxRuntime.jsxs(PaddedColumn, __assign({ gap: "lg", style: { overflow: 'auto', marginBottom: '10px' } }, { children: [jsxRuntime.jsxs(RowBetween, { children: [jsxRuntime.jsx(ThemedText.Main, __assign({ fontWeight: 600 }, { children: jsxRuntime.jsxs(macro.Trans, { children: [userAddedTokens === null || userAddedTokens === void 0 ? void 0 : userAddedTokens.length, " Custom Tokens"] }, void 0) }), void 0), userAddedTokens.length > 0 && (jsxRuntime.jsx(ButtonText, __assign({ onClick: handleRemoveAll }, { children: jsxRuntime.jsx(ThemedText.Blue, { children: jsxRuntime.jsx(macro.Trans, { children: "Clear all" }, void 0) }, void 0) }), void 0))] }, void 0), tokenList] }), void 0)] }), void 0), jsxRuntime.jsx(Footer, { children: jsxRuntime.jsx(ThemedText.DarkGray, { children: jsxRuntime.jsx(macro.Trans, { children: "Tip: Custom tokens are stored locally in your browser" }, void 0) }, void 0) }, void 0)] }, void 0));
}
var templateObject_1$i, templateObject_2$9;

var Wrapper$2 = styled__default["default"].div(templateObject_1$h || (templateObject_1$h = __makeTemplateObject(["\n  width: 100%;\n  position: relative;\n  display: flex;\n  flex-flow: column;\n"], ["\n  width: 100%;\n  position: relative;\n  display: flex;\n  flex-flow: column;\n"])));
var ToggleWrapper = styled__default["default"](RowBetween)(templateObject_2$8 || (templateObject_2$8 = __makeTemplateObject(["\n  background-color: ", ";\n  border-radius: 12px;\n  padding: 6px;\n"], ["\n  background-color: ", ";\n  border-radius: 12px;\n  padding: 6px;\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg3;
});
var ToggleOption = styled__default["default"].div(templateObject_3$6 || (templateObject_3$6 = __makeTemplateObject(["\n  width: 48%;\n  padding: 10px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 12px;\n  font-weight: 600;\n  background-color: ", ";\n  color: ", ";\n  user-select: none;\n\n  :hover {\n    cursor: pointer;\n    opacity: 0.7;\n  }\n"], ["\n  width: 48%;\n  padding: 10px;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 12px;\n  font-weight: 600;\n  background-color: ", ";\n  color: ", ";\n  user-select: none;\n\n  :hover {\n    cursor: pointer;\n    opacity: 0.7;\n  }\n"])), function (_a) {
    var theme = _a.theme, active = _a.active;
    return (active ? theme.bg1 : theme.bg3);
}, function (_a) {
    var theme = _a.theme, active = _a.active;
    return (active ? theme.text1 : theme.text2);
});
function Manage(_a) {
    var onDismiss = _a.onDismiss, setModalView = _a.setModalView, setImportList = _a.setImportList, setImportToken = _a.setImportToken, setListUrl = _a.setListUrl;
    // toggle between tokens and lists
    var _b = __read(React.useState(true), 2), showLists = _b[0], setShowLists = _b[1];
    return (jsxRuntime.jsxs(Wrapper$2, { children: [jsxRuntime.jsx(PaddedColumn, { children: jsxRuntime.jsxs(RowBetween, { children: [jsxRuntime.jsx(reactFeather.ArrowLeft, { style: { cursor: 'pointer' }, onClick: function () { return setModalView(CurrencyModalView.search); } }, void 0), jsxRuntime.jsx(rebass.Text, __assign({ fontWeight: 500, fontSize: 20 }, { children: jsxRuntime.jsx(macro.Trans, { children: "Manage" }, void 0) }), void 0), jsxRuntime.jsx(CloseIcon, { onClick: onDismiss }, void 0)] }, void 0) }, void 0), jsxRuntime.jsx(Separator, {}, void 0), jsxRuntime.jsx(PaddedColumn, __assign({ style: { paddingBottom: 0 } }, { children: jsxRuntime.jsxs(ToggleWrapper, { children: [jsxRuntime.jsx(ToggleOption, __assign({ onClick: function () { return setShowLists(!showLists); }, active: showLists }, { children: jsxRuntime.jsx(macro.Trans, { children: "Lists" }, void 0) }), void 0), jsxRuntime.jsx(ToggleOption, __assign({ onClick: function () { return setShowLists(!showLists); }, active: !showLists }, { children: jsxRuntime.jsx(macro.Trans, { children: "Tokens" }, void 0) }), void 0)] }, void 0) }), void 0), showLists ? (jsxRuntime.jsx(ManageLists, { setModalView: setModalView, setImportList: setImportList, setListUrl: setListUrl }, void 0)) : (jsxRuntime.jsx(ManageTokens, { setModalView: setModalView, setImportToken: setImportToken }, void 0))] }, void 0));
}
var templateObject_1$h, templateObject_2$8, templateObject_3$6;

var CurrencyModalView;
(function (CurrencyModalView) {
    CurrencyModalView[CurrencyModalView["search"] = 0] = "search";
    CurrencyModalView[CurrencyModalView["manage"] = 1] = "manage";
    CurrencyModalView[CurrencyModalView["importToken"] = 2] = "importToken";
    CurrencyModalView[CurrencyModalView["importList"] = 3] = "importList";
})(CurrencyModalView || (CurrencyModalView = {}));
function CurrencySearchModal(_a) {
    var isOpen = _a.isOpen, onDismiss = _a.onDismiss, onCurrencySelect = _a.onCurrencySelect, selectedCurrency = _a.selectedCurrency, otherSelectedCurrency = _a.otherSelectedCurrency, _b = _a.showCommonBases, showCommonBases = _b === void 0 ? false : _b, _c = _a.showCurrencyAmount, showCurrencyAmount = _c === void 0 ? true : _c, _d = _a.disableNonToken, disableNonToken = _d === void 0 ? false : _d;
    var _e = __read(React.useState(CurrencyModalView.manage), 2), modalView = _e[0], setModalView = _e[1];
    var lastOpen = useLast(isOpen);
    React.useEffect(function () {
        if (isOpen && !lastOpen) {
            setModalView(CurrencyModalView.search);
        }
    }, [isOpen, lastOpen]);
    var handleCurrencySelect = React.useCallback(function (currency) {
        onCurrencySelect(currency);
        onDismiss();
    }, [onDismiss, onCurrencySelect]);
    // for token import view
    var prevView = usePrevious(modalView);
    // used for import token flow
    var _f = __read(React.useState(), 2), importToken = _f[0], setImportToken = _f[1];
    // used for import list
    var _g = __read(React.useState(), 2), importList = _g[0], setImportList = _g[1];
    var _h = __read(React.useState(), 2), listURL = _h[0], setListUrl = _h[1];
    var showImportView = React.useCallback(function () { return setModalView(CurrencyModalView.importToken); }, [setModalView]);
    var showManageView = React.useCallback(function () { return setModalView(CurrencyModalView.manage); }, [setModalView]);
    var handleBackImport = React.useCallback(function () { return setModalView(prevView && prevView !== CurrencyModalView.importToken ? prevView : CurrencyModalView.search); }, [setModalView, prevView]);
    // change min height if not searching
    var minHeight = modalView === CurrencyModalView.importToken || modalView === CurrencyModalView.importList ? 40 : 80;
    var content = null;
    switch (modalView) {
        case CurrencyModalView.search:
            content = (jsxRuntime.jsx(CurrencySearch, { isOpen: isOpen, onDismiss: onDismiss, onCurrencySelect: handleCurrencySelect, selectedCurrency: selectedCurrency, otherSelectedCurrency: otherSelectedCurrency, showCommonBases: showCommonBases, showCurrencyAmount: showCurrencyAmount, disableNonToken: disableNonToken, showImportView: showImportView, setImportToken: setImportToken, showManageView: showManageView }, void 0));
            break;
        case CurrencyModalView.importToken:
            if (importToken) {
                content = (jsxRuntime.jsx(ImportToken, { tokens: [importToken], onDismiss: onDismiss, list: importToken instanceof WrappedTokenInfo ? importToken.list : undefined, onBack: handleBackImport, handleCurrencySelect: handleCurrencySelect }, void 0));
            }
            break;
        case CurrencyModalView.importList:
            if (importList && listURL) {
                content = jsxRuntime.jsx(ImportList, { list: importList, listURL: listURL, onDismiss: onDismiss, setModalView: setModalView }, void 0);
            }
            break;
        case CurrencyModalView.manage:
            content = (jsxRuntime.jsx(Manage, { onDismiss: onDismiss, setModalView: setModalView, setImportToken: setImportToken, setImportList: setImportList, setListUrl: setListUrl }, void 0));
            break;
    }
    return (jsxRuntime.jsx(Modal, __assign({ isOpen: isOpen, onDismiss: onDismiss, maxHeight: 80, minHeight: minHeight }, { children: content }), void 0));
}

var TextWrapper = styled__default["default"].span(templateObject_1$g || (templateObject_1$g = __makeTemplateObject(["\n  margin-left: ", ";\n  color: ", ";\n  font-size: ", ";\n\n  @media screen and (max-width: 600px) {\n    font-size: ", ";\n  }\n"], ["\n  margin-left: ", ";\n  color: ", ";\n  font-size: ", ";\n\n  @media screen and (max-width: 600px) {\n    font-size: ", ";\n  }\n"])), function (_a) {
    var margin = _a.margin;
    return margin && '4px';
}, function (_a) {
    var theme = _a.theme, link = _a.link, textColor = _a.textColor;
    return (link ? theme.blue1 : textColor !== null && textColor !== void 0 ? textColor : theme.text1);
}, function (_a) {
    var fontSize = _a.fontSize;
    return fontSize !== null && fontSize !== void 0 ? fontSize : 'inherit';
}, function (_a) {
    var adjustSize = _a.adjustSize;
    return adjustSize && '12px';
});
var HoverInlineText = function (_a) {
    var text = _a.text, _b = _a.maxCharacters, maxCharacters = _b === void 0 ? 20 : _b, _c = _a.margin, margin = _c === void 0 ? false : _c, _d = _a.adjustSize, adjustSize = _d === void 0 ? false : _d, fontSize = _a.fontSize, textColor = _a.textColor, link = _a.link, rest = __rest(_a, ["text", "maxCharacters", "margin", "adjustSize", "fontSize", "textColor", "link"]);
    var _e = __read(React.useState(false), 2), showHover = _e[0], setShowHover = _e[1];
    if (!text) {
        return jsxRuntime.jsx("span", {}, void 0);
    }
    if (text.length > maxCharacters) {
        return (jsxRuntime.jsx(Tooltip, __assign({ text: text, show: showHover }, { children: jsxRuntime.jsx(TextWrapper, __assign({ onMouseEnter: function () { return setShowHover(true); }, onMouseLeave: function () { return setShowHover(false); }, margin: margin, adjustSize: adjustSize, textColor: textColor, link: link, fontSize: fontSize }, rest, { children: ' ' + text.slice(0, maxCharacters - 1) + '...' }), void 0) }), void 0));
    }
    return (jsxRuntime.jsx(TextWrapper, __assign({ margin: margin, adjustSize: adjustSize, link: link, fontSize: fontSize, textColor: textColor }, rest, { children: text }), void 0));
};
var templateObject_1$g;

function FiatValue(_a) {
    var fiatValue = _a.fiatValue, priceImpact = _a.priceImpact;
    var theme = useTheme();
    var priceImpactColor = React.useMemo(function () {
        if (!priceImpact)
            return undefined;
        if (priceImpact.lessThan('0'))
            return theme.green1;
        var severity = warningSeverity(priceImpact);
        if (severity < 1)
            return theme.text3;
        if (severity < 3)
            return theme.yellow1;
        return theme.red1;
    }, [priceImpact, theme.green1, theme.red1, theme.text3, theme.yellow1]);
    return (jsxRuntime.jsxs(ThemedText.Body, __assign({ fontSize: 14, color: fiatValue ? theme.text3 : theme.text4 }, { children: [fiatValue ? (jsxRuntime.jsxs(macro.Trans, { children: ["$", jsxRuntime.jsx(HoverInlineText, { text: fiatValue === null || fiatValue === void 0 ? void 0 : fiatValue.toSignificant(6, { groupSeparator: ',' }), textColor: fiatValue ? theme.text3 : theme.text4 }, void 0)] }, void 0)) : (''), priceImpact ? (jsxRuntime.jsxs("span", __assign({ style: { color: priceImpactColor } }, { children: [' ', jsxRuntime.jsxs(MouseoverTooltip, __assign({ text: macro.t(templateObject_1$f || (templateObject_1$f = __makeTemplateObject(["The estimated difference between the USD values of input and output amounts."], ["The estimated difference between the USD values of input and output amounts."]))) }, { children: ["(", jsxRuntime.jsxs(macro.Trans, { children: [priceImpact.multiply(-1).toSignificant(3), "%"] }, void 0), ")"] }), void 0)] }), void 0)) : null] }), void 0));
}
var templateObject_1$f;

var InputPanel = styled__default["default"].div(templateObject_1$e || (templateObject_1$e = __makeTemplateObject(["\n  ", "\n  position: relative;\n  border-radius: ", ";\n  background-color: ", ";\n  z-index: 1;\n  width: ", ";\n  transition: height 1s ease;\n  will-change: height;\n"], ["\n  ", "\n  position: relative;\n  border-radius: ", ";\n  background-color: ", ";\n  z-index: 1;\n  width: ", ";\n  transition: height 1s ease;\n  will-change: height;\n"])), function (_a) {
    var theme = _a.theme;
    return theme.flexColumnNoWrap;
}, function (_a) {
    var hideInput = _a.hideInput;
    return (hideInput ? '16px' : '20px');
}, function (_a) {
    var theme = _a.theme, hideInput = _a.hideInput;
    return (hideInput ? 'transparent' : theme.bg2);
}, function (_a) {
    var hideInput = _a.hideInput;
    return (hideInput ? '100%' : 'initial');
});
var FixedContainer = styled__default["default"].div(templateObject_2$7 || (templateObject_2$7 = __makeTemplateObject(["\n  width: 100%;\n  height: 100%;\n  position: absolute;\n  border-radius: 20px;\n  background-color: ", ";\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  z-index: 2;\n"], ["\n  width: 100%;\n  height: 100%;\n  position: absolute;\n  border-radius: 20px;\n  background-color: ", ";\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  z-index: 2;\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg2;
});
var Container$1 = styled__default["default"].div(templateObject_3$5 || (templateObject_3$5 = __makeTemplateObject(["\n  border-radius: ", ";\n  border: 1px solid ", ";\n  background-color: ", ";\n  width: ", ";\n  :focus,\n  :hover {\n    border: 1px solid ", ";\n  }\n"], ["\n  border-radius: ", ";\n  border: 1px solid ", ";\n  background-color: ", ";\n  width: ", ";\n  :focus,\n  :hover {\n    border: 1px solid ", ";\n  }\n"])), function (_a) {
    var hideInput = _a.hideInput;
    return (hideInput ? '16px' : '20px');
}, function (_a) {
    var theme = _a.theme;
    return theme.bg0;
}, function (_a) {
    var theme = _a.theme;
    return theme.bg1;
}, function (_a) {
    var hideInput = _a.hideInput;
    return (hideInput ? '100%' : 'initial');
}, function (_a) {
    var theme = _a.theme, hideInput = _a.hideInput;
    return (hideInput ? ' transparent' : theme.bg3);
});
var CurrencySelect = styled__default["default"](ButtonGray)(templateObject_4$4 || (templateObject_4$4 = __makeTemplateObject(["\n  align-items: center;\n  background-color: ", ";\n  box-shadow: ", ";\n  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);\n  color: ", ";\n  cursor: pointer;\n  border-radius: 16px;\n  outline: none;\n  user-select: none;\n  border: none;\n  font-size: 24px;\n  font-weight: 500;\n  height: ", ";\n  width: ", ";\n  padding: 0 8px;\n  justify-content: space-between;\n  margin-left: ", ";\n  :focus,\n  :hover {\n    background-color: ", ";\n  }\n  visibility: ", ";\n"], ["\n  align-items: center;\n  background-color: ", ";\n  box-shadow: ", ";\n  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);\n  color: ", ";\n  cursor: pointer;\n  border-radius: 16px;\n  outline: none;\n  user-select: none;\n  border: none;\n  font-size: 24px;\n  font-weight: 500;\n  height: ", ";\n  width: ", ";\n  padding: 0 8px;\n  justify-content: space-between;\n  margin-left: ", ";\n  :focus,\n  :hover {\n    background-color: ", ";\n  }\n  visibility: ", ";\n"])), function (_a) {
    var selected = _a.selected, theme = _a.theme;
    return (selected ? theme.bg2 : theme.primary1);
}, function (_a) {
    var selected = _a.selected;
    return (selected ? 'none' : '0px 6px 10px rgba(0, 0, 0, 0.075)');
}, function (_a) {
    var selected = _a.selected, theme = _a.theme;
    return (selected ? theme.text1 : theme.white);
}, function (_a) {
    var hideInput = _a.hideInput;
    return (hideInput ? '2.8rem' : '2.4rem');
}, function (_a) {
    var hideInput = _a.hideInput;
    return (hideInput ? '100%' : 'initial');
}, function (_a) {
    var hideInput = _a.hideInput;
    return (hideInput ? '0' : '12px');
}, function (_a) {
    var selected = _a.selected, theme = _a.theme;
    return (selected ? theme.bg3 : polished.darken(0.05, theme.primary1));
}, function (_a) {
    var visible = _a.visible;
    return (visible ? 'visible' : 'hidden');
});
var InputRow = styled__default["default"].div(templateObject_5$4 || (templateObject_5$4 = __makeTemplateObject(["\n  ", "\n  align-items: center;\n  justify-content: space-between;\n  padding: ", ";\n"], ["\n  ", "\n  align-items: center;\n  justify-content: space-between;\n  padding: ", ";\n"])), function (_a) {
    var theme = _a.theme;
    return theme.flexRowNoWrap;
}, function (_a) {
    var selected = _a.selected;
    return (selected ? ' 1rem 1rem 0.75rem 1rem' : '1rem 1rem 1rem 1rem');
});
var LabelRow = styled__default["default"].div(templateObject_6$2 || (templateObject_6$2 = __makeTemplateObject(["\n  ", "\n  align-items: center;\n  color: ", ";\n  font-size: 0.75rem;\n  line-height: 1rem;\n  padding: 0 1rem 1rem;\n  span:hover {\n    cursor: pointer;\n    color: ", ";\n  }\n"], ["\n  ", "\n  align-items: center;\n  color: ", ";\n  font-size: 0.75rem;\n  line-height: 1rem;\n  padding: 0 1rem 1rem;\n  span:hover {\n    cursor: pointer;\n    color: ", ";\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.flexRowNoWrap;
}, function (_a) {
    var theme = _a.theme;
    return theme.text1;
}, function (_a) {
    var theme = _a.theme;
    return polished.darken(0.2, theme.text2);
});
var FiatRow = styled__default["default"](LabelRow)(templateObject_7$2 || (templateObject_7$2 = __makeTemplateObject(["\n  justify-content: flex-end;\n"], ["\n  justify-content: flex-end;\n"])));
var Aligner = styled__default["default"].span(templateObject_8$1 || (templateObject_8$1 = __makeTemplateObject(["\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  width: 100%;\n"], ["\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  width: 100%;\n"])));
var StyledDropDown = styled__default["default"](SvgDropdown)(templateObject_9$1 || (templateObject_9$1 = __makeTemplateObject(["\n  margin: 0 0.25rem 0 0.35rem;\n  height: 35%;\n\n  path {\n    stroke: ", ";\n    stroke-width: 1.5px;\n  }\n"], ["\n  margin: 0 0.25rem 0 0.35rem;\n  height: 35%;\n\n  path {\n    stroke: ", ";\n    stroke-width: 1.5px;\n  }\n"])), function (_a) {
    var selected = _a.selected, theme = _a.theme;
    return (selected ? theme.text1 : theme.white);
});
var StyledTokenName = styled__default["default"].span(templateObject_10$1 || (templateObject_10$1 = __makeTemplateObject(["\n  ", "\n  font-size:  ", ";\n"], ["\n  ", "\n  font-size:  ", ";\n"])), function (_a) {
    var active = _a.active;
    return (active ? '  margin: 0 0.25rem 0 0.25rem;' : '  margin: 0 0.25rem 0 0.25rem;');
}, function (_a) {
    var active = _a.active;
    return (active ? '18px' : '18px');
});
var StyledBalanceMax = styled__default["default"].button(templateObject_11$1 || (templateObject_11$1 = __makeTemplateObject(["\n  background-color: transparent;\n  background-color: ", ";\n  border: none;\n  border-radius: 12px;\n  color: ", ";\n  cursor: pointer;\n  font-size: 11px;\n  font-weight: 500;\n  margin-left: 0.25rem;\n  opacity: ", ";\n  padding: 4px 6px;\n  pointer-events: ", ";\n\n  :hover {\n    opacity: ", ";\n  }\n\n  :focus {\n    outline: none;\n  }\n"], ["\n  background-color: transparent;\n  background-color: ", ";\n  border: none;\n  border-radius: 12px;\n  color: ", ";\n  cursor: pointer;\n  font-size: 11px;\n  font-weight: 500;\n  margin-left: 0.25rem;\n  opacity: ", ";\n  padding: 4px 6px;\n  pointer-events: ", ";\n\n  :hover {\n    opacity: ", ";\n  }\n\n  :focus {\n    outline: none;\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.primary5;
}, function (_a) {
    var theme = _a.theme;
    return theme.primary1;
}, function (_a) {
    var disabled = _a.disabled;
    return (!disabled ? 1 : 0.4);
}, function (_a) {
    var disabled = _a.disabled;
    return (!disabled ? 'initial' : 'none');
}, function (_a) {
    var disabled = _a.disabled;
    return (!disabled ? 0.8 : 0.4);
});
var StyledNumericalInput = styled__default["default"](Input$1)(templateObject_12$1 || (templateObject_12$1 = __makeTemplateObject(["\n  ", ";\n  text-align: left;\n"], ["\n  ", ";\n  text-align: left;\n"])), loadingOpacityMixin);
function CurrencyInputPanel(_a) {
    var value = _a.value, onUserInput = _a.onUserInput, onMax = _a.onMax, showMaxButton = _a.showMaxButton, onCurrencySelect = _a.onCurrencySelect, currency = _a.currency, otherCurrency = _a.otherCurrency, id = _a.id, showCommonBases = _a.showCommonBases, showCurrencyAmount = _a.showCurrencyAmount, disableNonToken = _a.disableNonToken, renderBalance = _a.renderBalance, fiatValue = _a.fiatValue, priceImpact = _a.priceImpact, _b = _a.hideBalance, hideBalance = _b === void 0 ? false : _b, _c = _a.pair, pair = _c === void 0 ? null : _c, // used for double token logo
    _d = _a.hideInput, // used for double token logo
    hideInput = _d === void 0 ? false : _d, _e = _a.locked, locked = _e === void 0 ? false : _e, _f = _a.loading, loading = _f === void 0 ? false : _f, rest = __rest(_a, ["value", "onUserInput", "onMax", "showMaxButton", "onCurrencySelect", "currency", "otherCurrency", "id", "showCommonBases", "showCurrencyAmount", "disableNonToken", "renderBalance", "fiatValue", "priceImpact", "hideBalance", "pair", "hideInput", "locked", "loading"]);
    var _g = __read(React.useState(false), 2), modalOpen = _g[0], setModalOpen = _g[1];
    var account = useActiveWeb3React().account;
    var selectedCurrencyBalance = useCurrencyBalance(account !== null && account !== void 0 ? account : undefined, currency !== null && currency !== void 0 ? currency : undefined);
    var theme = useTheme();
    var handleDismissSearch = React.useCallback(function () {
        setModalOpen(false);
    }, [setModalOpen]);
    return (jsxRuntime.jsxs(InputPanel, __assign({ id: id, hideInput: hideInput }, rest, { children: [locked && (jsxRuntime.jsx(FixedContainer, { children: jsxRuntime.jsxs(AutoColumn, __assign({ gap: "sm", justify: "center" }, { children: [jsxRuntime.jsx(reactFeather.Lock, {}, void 0), jsxRuntime.jsx(ThemedText.Label, __assign({ fontSize: "12px", textAlign: "center", padding: "0 12px" }, { children: jsxRuntime.jsx(macro.Trans, { children: "The market price is outside your specified price range. Single-asset deposit only." }, void 0) }), void 0)] }), void 0) }, void 0)), jsxRuntime.jsxs(Container$1, __assign({ hideInput: hideInput }, { children: [jsxRuntime.jsxs(InputRow, __assign({ style: hideInput ? { padding: '0', borderRadius: '8px' } : {}, selected: !onCurrencySelect }, { children: [!hideInput && (jsxRuntime.jsx(StyledNumericalInput, { className: "token-amount-input", value: value, onUserInput: onUserInput, "$loading": loading }, void 0)), jsxRuntime.jsx(CurrencySelect, __assign({ visible: currency !== undefined, selected: !!currency, hideInput: hideInput, className: "open-currency-select-button", onClick: function () {
                                    if (onCurrencySelect) {
                                        setModalOpen(true);
                                    }
                                } }, { children: jsxRuntime.jsxs(Aligner, { children: [jsxRuntime.jsxs(RowFixed, { children: [pair ? (jsxRuntime.jsx("span", __assign({ style: { marginRight: '0.5rem' } }, { children: jsxRuntime.jsx(DoubleCurrencyLogo, { currency0: pair.token0, currency1: pair.token1, size: 24, margin: true }, void 0) }), void 0)) : currency ? (jsxRuntime.jsx(CurrencyLogo, { style: { marginRight: '0.5rem' }, currency: currency, size: '24px' }, void 0)) : null, pair ? (jsxRuntime.jsxs(StyledTokenName, __assign({ className: "pair-name-container" }, { children: [pair === null || pair === void 0 ? void 0 : pair.token0.symbol, ":", pair === null || pair === void 0 ? void 0 : pair.token1.symbol] }), void 0)) : (jsxRuntime.jsx(StyledTokenName, __assign({ className: "token-symbol-container", active: Boolean(currency && currency.symbol) }, { children: (currency && currency.symbol && currency.symbol.length > 20
                                                        ? currency.symbol.slice(0, 4) +
                                                            '...' +
                                                            currency.symbol.slice(currency.symbol.length - 5, currency.symbol.length)
                                                        : currency === null || currency === void 0 ? void 0 : currency.symbol) || jsxRuntime.jsx(macro.Trans, { children: "Select a token" }, void 0) }), void 0))] }, void 0), onCurrencySelect && jsxRuntime.jsx(StyledDropDown, { selected: !!currency }, void 0)] }, void 0) }), void 0)] }), void 0), !hideInput && !hideBalance && currency && (jsxRuntime.jsx(FiatRow, { children: jsxRuntime.jsxs(RowBetween, { children: [jsxRuntime.jsx(LoadingOpacityContainer, __assign({ "$loading": loading }, { children: jsxRuntime.jsx(FiatValue, { fiatValue: fiatValue, priceImpact: priceImpact }, void 0) }), void 0), account ? (jsxRuntime.jsxs(RowFixed, __assign({ style: { height: '17px' } }, { children: [jsxRuntime.jsx(ThemedText.Body, __assign({ onClick: onMax, color: theme.text3, fontWeight: 500, fontSize: 14, style: { display: 'inline', cursor: 'pointer' } }, { children: !hideBalance && currency && selectedCurrencyBalance ? (renderBalance ? (renderBalance(selectedCurrencyBalance)) : (jsxRuntime.jsxs(macro.Trans, { children: ["Balance: ", formatCurrencyAmount(selectedCurrencyBalance, 4)] }, void 0))) : null }), void 0), showMaxButton && selectedCurrencyBalance ? (jsxRuntime.jsx(StyledBalanceMax, __assign({ onClick: onMax }, { children: jsxRuntime.jsx(macro.Trans, { children: "MAX" }, void 0) }), void 0)) : null] }), void 0)) : (jsxRuntime.jsx("span", {}, void 0))] }, void 0) }, void 0))] }), void 0), onCurrencySelect && (jsxRuntime.jsx(CurrencySearchModal, { isOpen: modalOpen, onDismiss: handleDismissSearch, onCurrencySelect: onCurrencySelect, selectedCurrency: currency, otherSelectedCurrency: otherCurrency, showCommonBases: showCommonBases, showCurrencyAmount: showCurrencyAmount, disableNonToken: disableNonToken }, void 0))] }), void 0));
}
var templateObject_1$e, templateObject_2$7, templateObject_3$5, templateObject_4$4, templateObject_5$4, templateObject_6$2, templateObject_7$2, templateObject_8$1, templateObject_9$1, templateObject_10$1, templateObject_11$1, templateObject_12$1;

/**
 * Given the price impact, get user confirmation.
 *
 * @param priceImpactWithoutFee price impact of the trade without the fee.
 */
function confirmPriceImpactWithoutFee(priceImpactWithoutFee) {
    if (!priceImpactWithoutFee.lessThan(PRICE_IMPACT_WITHOUT_FEE_CONFIRM_MIN)) {
        return (window.prompt("This swap has a price impact of at least " + PRICE_IMPACT_WITHOUT_FEE_CONFIRM_MIN.toFixed(0) + "%. Please type the word \"confirm\" to continue with this swap.") === 'confirm');
    }
    else if (!priceImpactWithoutFee.lessThan(ALLOWED_PRICE_IMPACT_HIGH)) {
        return window.confirm("This swap has a price impact of at least " + ALLOWED_PRICE_IMPACT_HIGH.toFixed(0) + "%. Please confirm that you would like to continue with this swap.");
    }
    return true;
}

/**
 * Returns true if the trade requires a confirmation of details before we can submit it
 * @param args either a pair of V2 trades or a pair of V3 trades
 */
function tradeMeaningfullyDiffers() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var _a = __read(args, 2), tradeA = _a[0], tradeB = _a[1];
    return (tradeA.tradeType !== tradeB.tradeType ||
        !tradeA.inputAmount.currency.equals(tradeB.inputAmount.currency) ||
        !tradeA.inputAmount.equalTo(tradeB.inputAmount) ||
        !tradeA.outputAmount.currency.equals(tradeB.outputAmount.currency) ||
        !tradeA.outputAmount.equalTo(tradeB.outputAmount));
}

function useAddTokenToMetamask(currencyToAdd) {
    var library = useActiveWeb3React().library;
    var token = currencyToAdd === null || currencyToAdd === void 0 ? void 0 : currencyToAdd.wrapped;
    var _a = __read(React.useState(), 2), success = _a[0], setSuccess = _a[1];
    var logoURL = useCurrencyLogoURIs(token)[0];
    var addToken = React.useCallback(function () {
        if (library && library.provider.isMetaMask && library.provider.request && token) {
            library.provider
                .request({
                method: 'wallet_watchAsset',
                params: {
                    //@ts-ignore // need this for incorrect ethers provider type
                    type: 'ERC20',
                    options: {
                        address: token.address,
                        symbol: token.symbol,
                        decimals: token.decimals,
                        image: logoURL,
                    },
                },
            })
                .then(function (success) {
                setSuccess(success);
            })
                .catch(function () { return setSuccess(false); });
        }
        else {
            setSuccess(false);
        }
    }, [library, logoURL, token]);
    return { addToken: addToken, success: success };
}

var Circle$1 = "data:image/svg+xml,%3Csvg%20width%3D%2294%22%20height%3D%2294%22%20viewBox%3D%220%200%2094%2094%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%20%20%3Cpath%20d%3D%22M92%2047C92%2022.1472%2071.8528%202%2047%202C22.1472%202%202%2022.1472%202%2047C2%2071.8528%2022.1472%2092%2047%2092%22%20stroke%3D%22%232172E5%22%20stroke-width%3D%223%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E";

var MetaMaskLogo = "f89237c6bc3f84db.png";

var VoteOption;
(function (VoteOption) {
    VoteOption[VoteOption["Against"] = 0] = "Against";
    VoteOption[VoteOption["For"] = 1] = "For";
    VoteOption[VoteOption["Abstain"] = 2] = "Abstain";
})(VoteOption || (VoteOption = {}));

function formatAmount(amountRaw, decimals, sigFigs) {
    return new sdkCore.Fraction(amountRaw, JSBI__default["default"].exponentiate(JSBI__default["default"].BigInt(10), JSBI__default["default"].BigInt(decimals))).toSignificant(sigFigs);
}
function FormattedCurrencyAmount(_a) {
    var rawAmount = _a.rawAmount, symbol = _a.symbol, decimals = _a.decimals, sigFigs = _a.sigFigs;
    return (jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [formatAmount(rawAmount, decimals, sigFigs), " ", symbol] }, void 0));
}
function FormattedCurrencyAmountManaged(_a) {
    var _b;
    var rawAmount = _a.rawAmount, currencyId = _a.currencyId, _c = _a.sigFigs, sigFigs = _c === void 0 ? 6 : _c;
    var currency = useCurrency(currencyId);
    return currency ? (jsxRuntime.jsx(FormattedCurrencyAmount, { rawAmount: rawAmount, decimals: currency.decimals, sigFigs: sigFigs, symbol: (_b = currency.symbol) !== null && _b !== void 0 ? _b : '???' }, void 0)) : null;
}
function ClaimSummary(_a) {
    var _b = _a.info, recipient = _b.recipient, uniAmountRaw = _b.uniAmountRaw;
    var ENSName = useENSName().ENSName;
    return typeof uniAmountRaw === 'string' ? (jsxRuntime.jsxs(macro.Trans, { children: ["Claim ", jsxRuntime.jsx(FormattedCurrencyAmount, { rawAmount: uniAmountRaw, symbol: 'UNI', decimals: 18, sigFigs: 4 }, void 0), " for", ' ', ENSName !== null && ENSName !== void 0 ? ENSName : recipient] }, void 0)) : (jsxRuntime.jsxs(macro.Trans, { children: ["Claim UNI reward for ", ENSName !== null && ENSName !== void 0 ? ENSName : recipient] }, void 0));
}
function SubmitProposalTransactionSummary(_) {
    return jsxRuntime.jsx(macro.Trans, { children: "Submit new proposal" }, void 0);
}
function ApprovalSummary(_a) {
    var info = _a.info;
    var token = useToken(info.tokenAddress);
    return jsxRuntime.jsxs(macro.Trans, { children: ["Approve ", token === null || token === void 0 ? void 0 : token.symbol] }, void 0);
}
function VoteSummary(_a) {
    var info = _a.info;
    var proposalKey = info.governorAddress + "/" + info.proposalId;
    if (info.reason && info.reason.trim().length > 0) {
        switch (info.decision) {
            case VoteOption.For:
                return jsxRuntime.jsxs(macro.Trans, { children: ["Vote for proposal ", proposalKey] }, void 0);
            case VoteOption.Abstain:
                return jsxRuntime.jsxs(macro.Trans, { children: ["Vote to abstain on proposal ", proposalKey] }, void 0);
            case VoteOption.Against:
                return jsxRuntime.jsxs(macro.Trans, { children: ["Vote against proposal ", proposalKey] }, void 0);
        }
    }
    else {
        switch (info.decision) {
            case VoteOption.For:
                return (jsxRuntime.jsxs(macro.Trans, { children: ["Vote for proposal ", proposalKey, " with reason \"", info.reason, "\""] }, void 0));
            case VoteOption.Abstain:
                return (jsxRuntime.jsxs(macro.Trans, { children: ["Vote to abstain on proposal ", proposalKey, " with reason \"", info.reason, "\""] }, void 0));
            case VoteOption.Against:
                return (jsxRuntime.jsxs(macro.Trans, { children: ["Vote against proposal ", proposalKey, " with reason \"", info.reason, "\""] }, void 0));
        }
    }
}
function DelegateSummary(_a) {
    var delegatee = _a.info.delegatee;
    var ENSName = useENSName(delegatee).ENSName;
    return jsxRuntime.jsxs(macro.Trans, { children: ["Delegate voting power to ", ENSName !== null && ENSName !== void 0 ? ENSName : delegatee] }, void 0);
}
function WrapSummary(_a) {
    var _b, _c, _d, _e, _f, _g;
    var _h = _a.info, chainId = _h.chainId, currencyAmountRaw = _h.currencyAmountRaw, unwrapped = _h.unwrapped;
    var native = chainId ? nativeOnChain(chainId) : undefined;
    if (unwrapped) {
        return (jsxRuntime.jsxs(macro.Trans, { children: ["Unwrap", ' ', jsxRuntime.jsx(FormattedCurrencyAmount, { rawAmount: currencyAmountRaw, symbol: (_c = (_b = native === null || native === void 0 ? void 0 : native.wrapped) === null || _b === void 0 ? void 0 : _b.symbol) !== null && _c !== void 0 ? _c : 'WETH', decimals: 18, sigFigs: 6 }, void 0), ' ', "to ", (_d = native === null || native === void 0 ? void 0 : native.symbol) !== null && _d !== void 0 ? _d : 'ETH'] }, void 0));
    }
    else {
        return (jsxRuntime.jsxs(macro.Trans, { children: ["Wrap", ' ', jsxRuntime.jsx(FormattedCurrencyAmount, { rawAmount: currencyAmountRaw, symbol: (_e = native === null || native === void 0 ? void 0 : native.symbol) !== null && _e !== void 0 ? _e : 'ETH', decimals: 18, sigFigs: 6 }, void 0), ' ', "to ", (_g = (_f = native === null || native === void 0 ? void 0 : native.wrapped) === null || _f === void 0 ? void 0 : _f.symbol) !== null && _g !== void 0 ? _g : 'WETH'] }, void 0));
    }
}
function DepositLiquidityStakingSummary(_) {
    // not worth rendering the tokens since you can should no longer deposit liquidity in the staking contracts
    // todo: deprecate and delete the code paths that allow this, show user more information
    return jsxRuntime.jsx(macro.Trans, { children: "Deposit liquidity" }, void 0);
}
function WithdrawLiquidityStakingSummary(_) {
    return jsxRuntime.jsx(macro.Trans, { children: "Withdraw deposited liquidity" }, void 0);
}
function MigrateLiquidityToV3Summary(_a) {
    var _b = _a.info, baseCurrencyId = _b.baseCurrencyId, quoteCurrencyId = _b.quoteCurrencyId;
    var baseCurrency = useCurrency(baseCurrencyId);
    var quoteCurrency = useCurrency(quoteCurrencyId);
    return (jsxRuntime.jsxs(macro.Trans, { children: ["Migrate ", baseCurrency === null || baseCurrency === void 0 ? void 0 : baseCurrency.symbol, "/", quoteCurrency === null || quoteCurrency === void 0 ? void 0 : quoteCurrency.symbol, " liquidity to V3"] }, void 0));
}
function CreateV3PoolSummary(_a) {
    var _b = _a.info, quoteCurrencyId = _b.quoteCurrencyId, baseCurrencyId = _b.baseCurrencyId;
    var baseCurrency = useCurrency(baseCurrencyId);
    var quoteCurrency = useCurrency(quoteCurrencyId);
    return (jsxRuntime.jsxs(macro.Trans, { children: ["Create ", baseCurrency === null || baseCurrency === void 0 ? void 0 : baseCurrency.symbol, "/", quoteCurrency === null || quoteCurrency === void 0 ? void 0 : quoteCurrency.symbol, " V3 pool"] }, void 0));
}
function CollectFeesSummary(_a) {
    var _b = _a.info, currencyId0 = _b.currencyId0, currencyId1 = _b.currencyId1;
    var currency0 = useCurrency(currencyId0);
    var currency1 = useCurrency(currencyId1);
    return (jsxRuntime.jsxs(macro.Trans, { children: ["Collect ", currency0 === null || currency0 === void 0 ? void 0 : currency0.symbol, "/", currency1 === null || currency1 === void 0 ? void 0 : currency1.symbol, " fees"] }, void 0));
}
function RemoveLiquidityV3Summary(_a) {
    var _b = _a.info, baseCurrencyId = _b.baseCurrencyId, quoteCurrencyId = _b.quoteCurrencyId, expectedAmountBaseRaw = _b.expectedAmountBaseRaw, expectedAmountQuoteRaw = _b.expectedAmountQuoteRaw;
    return (jsxRuntime.jsxs(macro.Trans, { children: ["Remove", ' ', jsxRuntime.jsx(FormattedCurrencyAmountManaged, { rawAmount: expectedAmountBaseRaw, currencyId: baseCurrencyId, sigFigs: 3 }, void 0), " and", ' ', jsxRuntime.jsx(FormattedCurrencyAmountManaged, { rawAmount: expectedAmountQuoteRaw, currencyId: quoteCurrencyId, sigFigs: 3 }, void 0)] }, void 0));
}
function AddLiquidityV3PoolSummary(_a) {
    var _b = _a.info, createPool = _b.createPool, quoteCurrencyId = _b.quoteCurrencyId, baseCurrencyId = _b.baseCurrencyId;
    var baseCurrency = useCurrency(baseCurrencyId);
    var quoteCurrency = useCurrency(quoteCurrencyId);
    return createPool ? (jsxRuntime.jsxs(macro.Trans, { children: ["Create pool and add ", baseCurrency === null || baseCurrency === void 0 ? void 0 : baseCurrency.symbol, "/", quoteCurrency === null || quoteCurrency === void 0 ? void 0 : quoteCurrency.symbol, " V3 liquidity"] }, void 0)) : (jsxRuntime.jsxs(macro.Trans, { children: ["Add ", baseCurrency === null || baseCurrency === void 0 ? void 0 : baseCurrency.symbol, "/", quoteCurrency === null || quoteCurrency === void 0 ? void 0 : quoteCurrency.symbol, " V3 liquidity"] }, void 0));
}
function AddLiquidityV2PoolSummary(_a) {
    var _b = _a.info, quoteCurrencyId = _b.quoteCurrencyId, expectedAmountBaseRaw = _b.expectedAmountBaseRaw, expectedAmountQuoteRaw = _b.expectedAmountQuoteRaw, baseCurrencyId = _b.baseCurrencyId;
    return (jsxRuntime.jsxs(macro.Trans, { children: ["Add ", jsxRuntime.jsx(FormattedCurrencyAmountManaged, { rawAmount: expectedAmountBaseRaw, currencyId: baseCurrencyId, sigFigs: 3 }, void 0), ' ', "and ", jsxRuntime.jsx(FormattedCurrencyAmountManaged, { rawAmount: expectedAmountQuoteRaw, currencyId: quoteCurrencyId, sigFigs: 3 }, void 0), ' ', "to Uniswap V2"] }, void 0));
}
function SwapSummary(_a) {
    var info = _a.info;
    if (info.tradeType === sdkCore.TradeType.EXACT_INPUT) {
        return (jsxRuntime.jsxs(macro.Trans, { children: ["Swap exactly", ' ', jsxRuntime.jsx(FormattedCurrencyAmountManaged, { rawAmount: info.inputCurrencyAmountRaw, currencyId: info.inputCurrencyId, sigFigs: 6 }, void 0), ' ', "for", ' ', jsxRuntime.jsx(FormattedCurrencyAmountManaged, { rawAmount: info.expectedOutputCurrencyAmountRaw, currencyId: info.outputCurrencyId, sigFigs: 6 }, void 0)] }, void 0));
    }
    else {
        return (jsxRuntime.jsxs(macro.Trans, { children: ["Swap", ' ', jsxRuntime.jsx(FormattedCurrencyAmountManaged, { rawAmount: info.expectedInputCurrencyAmountRaw, currencyId: info.inputCurrencyId, sigFigs: 6 }, void 0), ' ', "for exactly", ' ', jsxRuntime.jsx(FormattedCurrencyAmountManaged, { rawAmount: info.outputCurrencyAmountRaw, currencyId: info.outputCurrencyId, sigFigs: 6 }, void 0)] }, void 0));
    }
}
function TransactionSummary(_a) {
    var info = _a.info;
    switch (info.type) {
        case TransactionType.ADD_LIQUIDITY_V3_POOL:
            return jsxRuntime.jsx(AddLiquidityV3PoolSummary, { info: info }, void 0);
        case TransactionType.ADD_LIQUIDITY_V2_POOL:
            return jsxRuntime.jsx(AddLiquidityV2PoolSummary, { info: info }, void 0);
        case TransactionType.CLAIM:
            return jsxRuntime.jsx(ClaimSummary, { info: info }, void 0);
        case TransactionType.DEPOSIT_LIQUIDITY_STAKING:
            return jsxRuntime.jsx(DepositLiquidityStakingSummary, { info: info }, void 0);
        case TransactionType.WITHDRAW_LIQUIDITY_STAKING:
            return jsxRuntime.jsx(WithdrawLiquidityStakingSummary, { info: info }, void 0);
        case TransactionType.SWAP:
            return jsxRuntime.jsx(SwapSummary, { info: info }, void 0);
        case TransactionType.APPROVAL:
            return jsxRuntime.jsx(ApprovalSummary, { info: info }, void 0);
        case TransactionType.VOTE:
            return jsxRuntime.jsx(VoteSummary, { info: info }, void 0);
        case TransactionType.DELEGATE:
            return jsxRuntime.jsx(DelegateSummary, { info: info }, void 0);
        case TransactionType.WRAP:
            return jsxRuntime.jsx(WrapSummary, { info: info }, void 0);
        case TransactionType.CREATE_V3_POOL:
            return jsxRuntime.jsx(CreateV3PoolSummary, { info: info }, void 0);
        case TransactionType.MIGRATE_LIQUIDITY_V3:
            return jsxRuntime.jsx(MigrateLiquidityToV3Summary, { info: info }, void 0);
        case TransactionType.COLLECT_FEES:
            return jsxRuntime.jsx(CollectFeesSummary, { info: info }, void 0);
        case TransactionType.REMOVE_LIQUIDITY_V3:
            return jsxRuntime.jsx(RemoveLiquidityV3Summary, { info: info }, void 0);
        case TransactionType.SUBMIT_PROPOSAL:
            return jsxRuntime.jsx(SubmitProposalTransactionSummary, { info: info }, void 0);
    }
}

var Wrapper$1 = styled__default["default"].div(templateObject_1$d || (templateObject_1$d = __makeTemplateObject(["\n  height: 90px;\n  width: 90px;\n"], ["\n  height: 90px;\n  width: 90px;\n"])));
var dash = styled.keyframes(templateObject_2$6 || (templateObject_2$6 = __makeTemplateObject(["\n  0% {\n    stroke-dashoffset: 1000;\n  }\n  100% {\n    stroke-dashoffset: 0;\n  }\n"], ["\n  0% {\n    stroke-dashoffset: 1000;\n  }\n  100% {\n    stroke-dashoffset: 0;\n  }\n"])));
var dashCheck = styled.keyframes(templateObject_3$4 || (templateObject_3$4 = __makeTemplateObject(["\n  0% {\n    stroke-dashoffset: -100;\n  }\n  100% {\n    stroke-dashoffset: 900;\n  }\n"], ["\n  0% {\n    stroke-dashoffset: -100;\n  }\n  100% {\n    stroke-dashoffset: 900;\n  }\n"])));
var Circle = styled__default["default"].circle(templateObject_4$3 || (templateObject_4$3 = __makeTemplateObject(["\n  stroke-dasharray: 1000;\n  stroke-dashoffset: 0;\n  -webkit-animation: ", " 0.9s ease-in-out;\n  animation: ", " 0.9s ease-in-out;\n"], ["\n  stroke-dasharray: 1000;\n  stroke-dashoffset: 0;\n  -webkit-animation: ", " 0.9s ease-in-out;\n  animation: ", " 0.9s ease-in-out;\n"])), dash, dash);
var PolyLine = styled__default["default"].polyline(templateObject_5$3 || (templateObject_5$3 = __makeTemplateObject(["\n  stroke-dasharray: 1000;\n  stroke-dashoffset: 0;\n  stroke-dashoffset: -100;\n  -webkit-animation: ", " 0.9s 0.35s ease-in-out forwards;\n  animation: ", " 0.9s 0.35s ease-in-out forwards;\n"], ["\n  stroke-dasharray: 1000;\n  stroke-dashoffset: 0;\n  stroke-dashoffset: -100;\n  -webkit-animation: ", " 0.9s 0.35s ease-in-out forwards;\n  animation: ", " 0.9s 0.35s ease-in-out forwards;\n"])), dashCheck, dashCheck);
function AnimatedConfirmation() {
    var theme = useTheme();
    return (jsxRuntime.jsx(Wrapper$1, __assign({ className: "w4rAnimated_checkmark" }, { children: jsxRuntime.jsxs("svg", __assign({ version: "1.1", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 130.2 130.2" }, { children: [jsxRuntime.jsx(Circle, { className: "path circle", fill: "none", stroke: theme.green1, strokeWidth: "6", strokeMiterlimit: "10", cx: "65.1", cy: "65.1", r: "62.1" }, void 0), jsxRuntime.jsx(PolyLine, { className: "path check", fill: "none", stroke: theme.green1, strokeWidth: "6", strokeLinecap: "round", strokeMiterlimit: "10", points: "100.2,40.2 51.5,88.8 29.8,67.5 " }, void 0)] }), void 0) }), void 0));
}
var templateObject_1$d, templateObject_2$6, templateObject_3$4, templateObject_4$3, templateObject_5$3;

var Wrapper = styled__default["default"].div(templateObject_1$c || (templateObject_1$c = __makeTemplateObject(["\n  width: 100%;\n  padding: 1rem;\n"], ["\n  width: 100%;\n  padding: 1rem;\n"])));
var Section = styled__default["default"](AutoColumn)(templateObject_2$5 || (templateObject_2$5 = __makeTemplateObject(["\n  padding: ", ";\n"], ["\n  padding: ", ";\n"])), function (_a) {
    var inline = _a.inline;
    return (inline ? '0' : '0');
});
var BottomSection = styled__default["default"](Section)(templateObject_3$3 || (templateObject_3$3 = __makeTemplateObject(["\n  border-bottom-left-radius: 20px;\n  border-bottom-right-radius: 20px;\n"], ["\n  border-bottom-left-radius: 20px;\n  border-bottom-right-radius: 20px;\n"])));
var ConfirmedIcon = styled__default["default"](ColumnCenter)(templateObject_4$2 || (templateObject_4$2 = __makeTemplateObject(["\n  padding: ", ";\n"], ["\n  padding: ", ";\n"])), function (_a) {
    var inline = _a.inline;
    return (inline ? '20px 0' : '32px 0;');
});
var StyledLogo = styled__default["default"].img(templateObject_5$2 || (templateObject_5$2 = __makeTemplateObject(["\n  height: 16px;\n  width: 16px;\n  margin-left: 6px;\n"], ["\n  height: 16px;\n  width: 16px;\n  margin-left: 6px;\n"])));
function ConfirmationPendingContent(_a) {
    var onDismiss = _a.onDismiss, pendingText = _a.pendingText, inline = _a.inline;
    return (jsxRuntime.jsx(Wrapper, { children: jsxRuntime.jsxs(AutoColumn, __assign({ gap: "md" }, { children: [!inline && (jsxRuntime.jsxs(RowBetween, { children: [jsxRuntime.jsx("div", {}, void 0), jsxRuntime.jsx(CloseIcon, { onClick: onDismiss }, void 0)] }, void 0)), jsxRuntime.jsx(ConfirmedIcon, __assign({ inline: inline }, { children: jsxRuntime.jsx(CustomLightSpinner, { src: Circle$1, alt: "loader", size: inline ? '40px' : '90px' }, void 0) }), void 0), jsxRuntime.jsxs(AutoColumn, __assign({ gap: "12px", justify: 'center' }, { children: [jsxRuntime.jsx(rebass.Text, __assign({ fontWeight: 500, fontSize: 20, textAlign: "center" }, { children: jsxRuntime.jsx(macro.Trans, { children: "Waiting For Confirmation" }, void 0) }), void 0), jsxRuntime.jsx(rebass.Text, __assign({ fontWeight: 400, fontSize: 16, textAlign: "center" }, { children: pendingText }), void 0), jsxRuntime.jsx(rebass.Text, __assign({ fontWeight: 500, fontSize: 14, color: "#565A69", textAlign: "center", marginBottom: "12px" }, { children: jsxRuntime.jsx(macro.Trans, { children: "Confirm this transaction in your wallet" }, void 0) }), void 0)] }), void 0)] }), void 0) }, void 0));
}
function TransactionSubmittedContent(_a) {
    var _b;
    var onDismiss = _a.onDismiss, chainId = _a.chainId, hash = _a.hash, currencyToAdd = _a.currencyToAdd, inline = _a.inline;
    var theme = React.useContext(styled.ThemeContext);
    var library = useActiveWeb3React().library;
    var _c = useAddTokenToMetamask(currencyToAdd), addToken = _c.addToken, success = _c.success;
    return (jsxRuntime.jsx(Wrapper, { children: jsxRuntime.jsxs(Section, __assign({ inline: inline }, { children: [!inline && (jsxRuntime.jsxs(RowBetween, { children: [jsxRuntime.jsx("div", {}, void 0), jsxRuntime.jsx(CloseIcon, { onClick: onDismiss }, void 0)] }, void 0)), jsxRuntime.jsx(ConfirmedIcon, __assign({ inline: inline }, { children: jsxRuntime.jsx(reactFeather.ArrowUpCircle, { strokeWidth: 0.5, size: inline ? '40px' : '90px', color: theme.primary1 }, void 0) }), void 0), jsxRuntime.jsxs(AutoColumn, __assign({ gap: "12px", justify: 'center' }, { children: [jsxRuntime.jsx(rebass.Text, __assign({ fontWeight: 500, fontSize: 20, textAlign: "center" }, { children: jsxRuntime.jsx(macro.Trans, { children: "Transaction Submitted" }, void 0) }), void 0), chainId && hash && (jsxRuntime.jsx(ExternalLink, __assign({ href: getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION) }, { children: jsxRuntime.jsx(rebass.Text, __assign({ fontWeight: 500, fontSize: 14, color: theme.primary1 }, { children: jsxRuntime.jsx(macro.Trans, { children: "View on Explorer" }, void 0) }), void 0) }), void 0)), currencyToAdd && ((_b = library === null || library === void 0 ? void 0 : library.provider) === null || _b === void 0 ? void 0 : _b.isMetaMask) && (jsxRuntime.jsx(ButtonLight, __assign({ mt: "12px", padding: "6px 12px", width: "fit-content", onClick: addToken }, { children: !success ? (jsxRuntime.jsx(RowFixed, { children: jsxRuntime.jsxs(macro.Trans, { children: ["Add ", currencyToAdd.symbol, " to Metamask ", jsxRuntime.jsx(StyledLogo, { src: MetaMaskLogo }, void 0)] }, void 0) }, void 0)) : (jsxRuntime.jsxs(RowFixed, { children: [jsxRuntime.jsxs(macro.Trans, { children: ["Added ", currencyToAdd.symbol, " "] }, void 0), jsxRuntime.jsx(reactFeather.CheckCircle, { size: '16px', stroke: theme.green1, style: { marginLeft: '6px' } }, void 0)] }, void 0)) }), void 0)), jsxRuntime.jsx(ButtonPrimary, __assign({ onClick: onDismiss, style: { margin: '20px 0 0 0' } }, { children: jsxRuntime.jsx(rebass.Text, __assign({ fontWeight: 500, fontSize: 20 }, { children: inline ? jsxRuntime.jsx(macro.Trans, { children: "Return" }, void 0) : jsxRuntime.jsx(macro.Trans, { children: "Close" }, void 0) }), void 0) }), void 0)] }), void 0)] }), void 0) }, void 0));
}
function ConfirmationModalContent(_a) {
    var title = _a.title, bottomContent = _a.bottomContent, onDismiss = _a.onDismiss, topContent = _a.topContent;
    return (jsxRuntime.jsxs(Wrapper, { children: [jsxRuntime.jsxs(Section, { children: [jsxRuntime.jsxs(RowBetween, { children: [jsxRuntime.jsx(rebass.Text, __assign({ fontWeight: 500, fontSize: 16 }, { children: title }), void 0), jsxRuntime.jsx(CloseIcon, { onClick: onDismiss }, void 0)] }, void 0), topContent()] }, void 0), bottomContent && jsxRuntime.jsx(BottomSection, __assign({ gap: "12px" }, { children: bottomContent() }), void 0)] }, void 0));
}
function TransactionErrorContent(_a) {
    var message = _a.message, onDismiss = _a.onDismiss;
    var theme = React.useContext(styled.ThemeContext);
    return (jsxRuntime.jsxs(Wrapper, { children: [jsxRuntime.jsxs(Section, { children: [jsxRuntime.jsxs(RowBetween, { children: [jsxRuntime.jsx(rebass.Text, __assign({ fontWeight: 500, fontSize: 20 }, { children: jsxRuntime.jsx(macro.Trans, { children: "Error" }, void 0) }), void 0), jsxRuntime.jsx(CloseIcon, { onClick: onDismiss }, void 0)] }, void 0), jsxRuntime.jsxs(AutoColumn, __assign({ style: { marginTop: 20, padding: '2rem 0' }, gap: "24px", justify: "center" }, { children: [jsxRuntime.jsx(reactFeather.AlertTriangle, { color: theme.red1, style: { strokeWidth: 1.5 }, size: 64 }, void 0), jsxRuntime.jsx(rebass.Text, __assign({ fontWeight: 500, fontSize: 16, color: theme.red1, style: { textAlign: 'center', width: '85%', wordBreak: 'break-word' } }, { children: message }), void 0)] }), void 0)] }, void 0), jsxRuntime.jsx(BottomSection, __assign({ gap: "12px" }, { children: jsxRuntime.jsx(ButtonPrimary, __assign({ onClick: onDismiss }, { children: jsxRuntime.jsx(macro.Trans, { children: "Dismiss" }, void 0) }), void 0) }), void 0)] }, void 0));
}
function L2Content(_a) {
    var _b;
    var onDismiss = _a.onDismiss, chainId = _a.chainId, hash = _a.hash, pendingText = _a.pendingText, inline = _a.inline;
    var theme = React.useContext(styled.ThemeContext);
    var transaction = useTransaction(hash);
    var confirmed = useIsTransactionConfirmed(hash);
    var transactionSuccess = ((_b = transaction === null || transaction === void 0 ? void 0 : transaction.receipt) === null || _b === void 0 ? void 0 : _b.status) === 1;
    // convert unix time difference to seconds
    var secondsToConfirm = (transaction === null || transaction === void 0 ? void 0 : transaction.confirmedTime)
        ? (transaction.confirmedTime - transaction.addedTime) / 1000
        : undefined;
    var info = CHAIN_INFO[chainId];
    return (jsxRuntime.jsx(Wrapper, { children: jsxRuntime.jsxs(Section, __assign({ inline: inline }, { children: [!inline && (jsxRuntime.jsxs(RowBetween, __assign({ mb: "16px" }, { children: [jsxRuntime.jsx(Badge, { children: jsxRuntime.jsxs(RowFixed, { children: [jsxRuntime.jsx(StyledLogo, { src: info.logoUrl, style: { margin: '0 8px 0 0' } }, void 0), info.label] }, void 0) }, void 0), jsxRuntime.jsx(CloseIcon, { onClick: onDismiss }, void 0)] }), void 0)), jsxRuntime.jsx(ConfirmedIcon, __assign({ inline: inline }, { children: confirmed ? (transactionSuccess ? (
                    // <CheckCircle strokeWidth={1} size={inline ? '40px' : '90px'} color={theme.green1} />
                    jsxRuntime.jsx(AnimatedConfirmation, {}, void 0)) : (jsxRuntime.jsx(reactFeather.AlertCircle, { strokeWidth: 1, size: inline ? '40px' : '90px', color: theme.red1 }, void 0))) : (jsxRuntime.jsx(CustomLightSpinner, { src: Circle$1, alt: "loader", size: inline ? '40px' : '90px' }, void 0)) }), void 0), jsxRuntime.jsxs(AutoColumn, __assign({ gap: "12px", justify: 'center' }, { children: [jsxRuntime.jsx(rebass.Text, __assign({ fontWeight: 500, fontSize: 20, textAlign: "center" }, { children: !hash ? (jsxRuntime.jsx(macro.Trans, { children: "Confirm transaction in wallet" }, void 0)) : !confirmed ? (jsxRuntime.jsx(macro.Trans, { children: "Transaction Submitted" }, void 0)) : transactionSuccess ? (jsxRuntime.jsx(macro.Trans, { children: "Success" }, void 0)) : (jsxRuntime.jsx(macro.Trans, { children: "Error" }, void 0)) }), void 0), jsxRuntime.jsx(rebass.Text, __assign({ fontWeight: 400, fontSize: 16, textAlign: "center" }, { children: transaction ? jsxRuntime.jsx(TransactionSummary, { info: transaction.info }, void 0) : pendingText }), void 0), chainId && hash ? (jsxRuntime.jsx(ExternalLink, __assign({ href: getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION) }, { children: jsxRuntime.jsx(rebass.Text, __assign({ fontWeight: 500, fontSize: 14, color: theme.primary1 }, { children: jsxRuntime.jsx(macro.Trans, { children: "View on Explorer" }, void 0) }), void 0) }), void 0)) : (jsxRuntime.jsx("div", { style: { height: '17px' } }, void 0)), jsxRuntime.jsx(rebass.Text, __assign({ color: theme.text3, style: { margin: '20px 0 0 0' }, fontSize: '14px' }, { children: !secondsToConfirm ? (jsxRuntime.jsx("div", { style: { height: '24px' } }, void 0)) : (jsxRuntime.jsxs("div", { children: [jsxRuntime.jsx(macro.Trans, { children: "Transaction completed in " }, void 0), jsxRuntime.jsxs("span", __assign({ style: { fontWeight: 500, marginLeft: '4px', color: theme.text1 } }, { children: [secondsToConfirm, " seconds \uD83C\uDF89"] }), void 0)] }, void 0)) }), void 0), jsxRuntime.jsx(ButtonPrimary, __assign({ onClick: onDismiss, style: { margin: '4px 0 0 0' } }, { children: jsxRuntime.jsx(rebass.Text, __assign({ fontWeight: 500, fontSize: 20 }, { children: inline ? jsxRuntime.jsx(macro.Trans, { children: "Return" }, void 0) : jsxRuntime.jsx(macro.Trans, { children: "Close" }, void 0) }), void 0) }), void 0)] }), void 0)] }), void 0) }, void 0));
}
function TransactionConfirmationModal(_a) {
    var isOpen = _a.isOpen, onDismiss = _a.onDismiss, attemptingTxn = _a.attemptingTxn, hash = _a.hash, pendingText = _a.pendingText, content = _a.content, currencyToAdd = _a.currencyToAdd;
    var chainId = useActiveWeb3React().chainId;
    var isL2 = Boolean(chainId && L2_CHAIN_IDS.includes(chainId));
    if (!chainId)
        return null;
    // confirmation screen
    return (jsxRuntime.jsx(Modal, __assign({ isOpen: isOpen, onDismiss: onDismiss, maxHeight: 90 }, { children: isL2 && (hash || attemptingTxn) ? (jsxRuntime.jsx(L2Content, { chainId: chainId, hash: hash, onDismiss: onDismiss, pendingText: pendingText }, void 0)) : attemptingTxn ? (jsxRuntime.jsx(ConfirmationPendingContent, { onDismiss: onDismiss, pendingText: pendingText }, void 0)) : hash ? (jsxRuntime.jsx(TransactionSubmittedContent, { chainId: chainId, hash: hash, onDismiss: onDismiss, currencyToAdd: currencyToAdd }, void 0)) : (content()) }), void 0));
}
var templateObject_1$c, templateObject_2$5, templateObject_3$3, templateObject_4$2, templateObject_5$2;

function SwapModalFooter(_a) {
    var onConfirm = _a.onConfirm, swapErrorMessage = _a.swapErrorMessage, disabledConfirm = _a.disabledConfirm;
    return (jsxRuntime.jsx(jsxRuntime.Fragment, { children: jsxRuntime.jsxs(AutoRow, { children: [jsxRuntime.jsx(ButtonError, __assign({ onClick: onConfirm, disabled: disabledConfirm, style: { margin: '10px 0 0 0' }, id: "confirm-swap-or-send" }, { children: jsxRuntime.jsx(rebass.Text, __assign({ fontSize: 20, fontWeight: 500 }, { children: jsxRuntime.jsx(macro.Trans, { children: "Confirm Swap" }, void 0) }), void 0) }), void 0), swapErrorMessage ? jsxRuntime.jsx(SwapCallbackError, { error: swapErrorMessage }, void 0) : null] }, void 0) }, void 0));
}

function computeFiatValuePriceImpact(fiatValueInput, fiatValueOutput) {
    if (!fiatValueOutput || !fiatValueInput)
        return undefined;
    if (!fiatValueInput.currency.equals(fiatValueOutput.currency))
        return undefined;
    if (JSBI__default["default"].equal(fiatValueInput.quotient, JSBI__default["default"].BigInt(0)))
        return undefined;
    var pct = ONE_HUNDRED_PERCENT.subtract(fiatValueOutput.divide(fiatValueInput));
    return new sdkCore.Percent(pct.numerator, pct.denominator);
}

var ArrowWrapper = styled__default["default"].div(templateObject_1$b || (templateObject_1$b = __makeTemplateObject(["\n  padding: 4px;\n  border-radius: 12px;\n  height: 32px;\n  width: 32px;\n  position: relative;\n  margin-top: -18px;\n  margin-bottom: -18px;\n  left: calc(50% - 16px);\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  background-color: ", ";\n  border: 4px solid;\n  border-color: ", ";\n  z-index: 2;\n"], ["\n  padding: 4px;\n  border-radius: 12px;\n  height: 32px;\n  width: 32px;\n  position: relative;\n  margin-top: -18px;\n  margin-bottom: -18px;\n  left: calc(50% - 16px);\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  background-color: ", ";\n  border: 4px solid;\n  border-color: ", ";\n  z-index: 2;\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg1;
}, function (_a) {
    var theme = _a.theme;
    return theme.bg0;
});
function SwapModalHeader(_a) {
    var trade = _a.trade, allowedSlippage = _a.allowedSlippage, recipient = _a.recipient, showAcceptChanges = _a.showAcceptChanges, onAcceptChanges = _a.onAcceptChanges;
    var theme = React.useContext(styled.ThemeContext);
    var _b = __read(React.useState(false), 2), showInverted = _b[0], setShowInverted = _b[1];
    var fiatValueInput = useUSDCValue(trade.inputAmount);
    var fiatValueOutput = useUSDCValue(trade.outputAmount);
    return (jsxRuntime.jsxs(AutoColumn, __assign({ gap: '4px', style: { marginTop: '1rem' } }, { children: [jsxRuntime.jsx(LightCard, __assign({ padding: "0.75rem 1rem" }, { children: jsxRuntime.jsxs(AutoColumn, __assign({ gap: '8px' }, { children: [jsxRuntime.jsxs(RowBetween, __assign({ align: "center" }, { children: [jsxRuntime.jsx(RowFixed, __assign({ gap: '0px' }, { children: jsxRuntime.jsx(TruncatedText, __assign({ fontSize: 24, fontWeight: 500, color: showAcceptChanges && trade.tradeType === sdkCore.TradeType.EXACT_OUTPUT ? theme.primary1 : '' }, { children: trade.inputAmount.toSignificant(6) }), void 0) }), void 0), jsxRuntime.jsxs(RowFixed, __assign({ gap: '0px' }, { children: [jsxRuntime.jsx(CurrencyLogo, { currency: trade.inputAmount.currency, size: '20px', style: { marginRight: '12px' } }, void 0), jsxRuntime.jsx(rebass.Text, __assign({ fontSize: 20, fontWeight: 500 }, { children: trade.inputAmount.currency.symbol }), void 0)] }), void 0)] }), void 0), jsxRuntime.jsx(RowBetween, { children: jsxRuntime.jsx(FiatValue, { fiatValue: fiatValueInput }, void 0) }, void 0)] }), void 0) }), void 0), jsxRuntime.jsx(ArrowWrapper, { children: jsxRuntime.jsx(reactFeather.ArrowDown, { size: "16", color: theme.text2 }, void 0) }, void 0), jsxRuntime.jsx(LightCard, __assign({ padding: "0.75rem 1rem", style: { marginBottom: '0.25rem' } }, { children: jsxRuntime.jsxs(AutoColumn, __assign({ gap: '8px' }, { children: [jsxRuntime.jsxs(RowBetween, __assign({ align: "flex-end" }, { children: [jsxRuntime.jsx(RowFixed, __assign({ gap: '0px' }, { children: jsxRuntime.jsx(TruncatedText, __assign({ fontSize: 24, fontWeight: 500 }, { children: trade.outputAmount.toSignificant(6) }), void 0) }), void 0), jsxRuntime.jsxs(RowFixed, __assign({ gap: '0px' }, { children: [jsxRuntime.jsx(CurrencyLogo, { currency: trade.outputAmount.currency, size: '20px', style: { marginRight: '12px' } }, void 0), jsxRuntime.jsx(rebass.Text, __assign({ fontSize: 20, fontWeight: 500 }, { children: trade.outputAmount.currency.symbol }), void 0)] }), void 0)] }), void 0), jsxRuntime.jsx(RowBetween, { children: jsxRuntime.jsx(ThemedText.Body, __assign({ fontSize: 14, color: theme.text3 }, { children: jsxRuntime.jsx(FiatValue, { fiatValue: fiatValueOutput, priceImpact: computeFiatValuePriceImpact(fiatValueInput, fiatValueOutput) }, void 0) }), void 0) }, void 0)] }), void 0) }), void 0), jsxRuntime.jsx(RowBetween, __assign({ style: { marginTop: '0.25rem', padding: '0 1rem' } }, { children: jsxRuntime.jsx(TradePrice, { price: trade.executionPrice, showInverted: showInverted, setShowInverted: setShowInverted }, void 0) }), void 0), jsxRuntime.jsx(LightCard, __assign({ style: { padding: '.75rem', marginTop: '0.5rem' } }, { children: jsxRuntime.jsx(AdvancedSwapDetails, { trade: trade, allowedSlippage: allowedSlippage }, void 0) }), void 0), showAcceptChanges ? (jsxRuntime.jsx(SwapShowAcceptChanges, __assign({ justify: "flex-start", gap: '0px' }, { children: jsxRuntime.jsxs(RowBetween, { children: [jsxRuntime.jsxs(RowFixed, { children: [jsxRuntime.jsx(reactFeather.AlertTriangle, { size: 20, style: { marginRight: '8px', minWidth: 24 } }, void 0), jsxRuntime.jsx(ThemedText.Main, __assign({ color: theme.primary1 }, { children: jsxRuntime.jsx(macro.Trans, { children: "Price Updated" }, void 0) }), void 0)] }, void 0), jsxRuntime.jsx(ButtonPrimary, __assign({ style: { padding: '.5rem', width: 'fit-content', fontSize: '0.825rem', borderRadius: '12px' }, onClick: onAcceptChanges }, { children: jsxRuntime.jsx(macro.Trans, { children: "Accept" }, void 0) }), void 0)] }, void 0) }), void 0)) : null, jsxRuntime.jsx(AutoColumn, __assign({ justify: "flex-start", gap: "sm", style: { padding: '.75rem 1rem' } }, { children: trade.tradeType === sdkCore.TradeType.EXACT_INPUT ? (jsxRuntime.jsx(ThemedText.Italic, __assign({ fontWeight: 400, textAlign: "left", style: { width: '100%' } }, { children: jsxRuntime.jsxs(macro.Trans, { children: ["Output is estimated. You will receive at least", ' ', jsxRuntime.jsxs("b", { children: [trade.minimumAmountOut(allowedSlippage).toSignificant(6), " ", trade.outputAmount.currency.symbol] }, void 0), ' ', "or the transaction will revert."] }, void 0) }), void 0)) : (jsxRuntime.jsx(ThemedText.Italic, __assign({ fontWeight: 400, textAlign: "left", style: { width: '100%' } }, { children: jsxRuntime.jsxs(macro.Trans, { children: ["Input is estimated. You will sell at most", ' ', jsxRuntime.jsxs("b", { children: [trade.maximumAmountIn(allowedSlippage).toSignificant(6), " ", trade.inputAmount.currency.symbol] }, void 0), ' ', "or the transaction will revert."] }, void 0) }), void 0)) }), void 0), recipient !== null ? (jsxRuntime.jsx(AutoColumn, __assign({ justify: "flex-start", gap: "sm", style: { padding: '12px 0 0 0px' } }, { children: jsxRuntime.jsx(ThemedText.Main, { children: jsxRuntime.jsxs(macro.Trans, { children: ["Output will be sent to", ' ', jsxRuntime.jsx("b", __assign({ title: recipient }, { children: isAddress(recipient) ? shortenAddress(recipient) : recipient }), void 0)] }, void 0) }, void 0) }), void 0)) : null] }), void 0));
}
var templateObject_1$b;

function ConfirmSwapModal(_a) {
    var _b, _c, _d, _e, _f, _g;
    var trade = _a.trade, originalTrade = _a.originalTrade, onAcceptChanges = _a.onAcceptChanges, allowedSlippage = _a.allowedSlippage, onConfirm = _a.onConfirm, onDismiss = _a.onDismiss, recipient = _a.recipient, swapErrorMessage = _a.swapErrorMessage, isOpen = _a.isOpen, attemptingTxn = _a.attemptingTxn, txHash = _a.txHash;
    var showAcceptChanges = React.useMemo(function () { return Boolean(trade && originalTrade && tradeMeaningfullyDiffers(trade, originalTrade)); }, [originalTrade, trade]);
    var modalHeader = React.useCallback(function () {
        return trade ? (jsxRuntime.jsx(SwapModalHeader, { trade: trade, allowedSlippage: allowedSlippage, recipient: recipient, showAcceptChanges: showAcceptChanges, onAcceptChanges: onAcceptChanges }, void 0)) : null;
    }, [allowedSlippage, onAcceptChanges, recipient, showAcceptChanges, trade]);
    var modalBottom = React.useCallback(function () {
        return trade ? (jsxRuntime.jsx(SwapModalFooter, { onConfirm: onConfirm, trade: trade, disabledConfirm: showAcceptChanges, swapErrorMessage: swapErrorMessage }, void 0)) : null;
    }, [onConfirm, showAcceptChanges, swapErrorMessage, trade]);
    // text to show while loading
    var pendingText = (jsxRuntime.jsxs(macro.Trans, { children: ["Swapping ", (_b = trade === null || trade === void 0 ? void 0 : trade.inputAmount) === null || _b === void 0 ? void 0 : _b.toSignificant(6), " ", (_d = (_c = trade === null || trade === void 0 ? void 0 : trade.inputAmount) === null || _c === void 0 ? void 0 : _c.currency) === null || _d === void 0 ? void 0 : _d.symbol, " for", ' ', (_e = trade === null || trade === void 0 ? void 0 : trade.outputAmount) === null || _e === void 0 ? void 0 : _e.toSignificant(6), " ", (_g = (_f = trade === null || trade === void 0 ? void 0 : trade.outputAmount) === null || _f === void 0 ? void 0 : _f.currency) === null || _g === void 0 ? void 0 : _g.symbol] }, void 0));
    var confirmationContent = React.useCallback(function () {
        return swapErrorMessage ? (jsxRuntime.jsx(TransactionErrorContent, { onDismiss: onDismiss, message: swapErrorMessage }, void 0)) : (jsxRuntime.jsx(ConfirmationModalContent, { title: jsxRuntime.jsx(macro.Trans, { children: "Confirm Swap" }, void 0), onDismiss: onDismiss, topContent: modalHeader, bottomContent: modalBottom }, void 0));
    }, [onDismiss, modalBottom, modalHeader, swapErrorMessage]);
    return (jsxRuntime.jsx(TransactionConfirmationModal, { isOpen: isOpen, onDismiss: onDismiss, attemptingTxn: attemptingTxn, hash: txHash, content: confirmationContent, pendingText: pendingText, currencyToAdd: trade === null || trade === void 0 ? void 0 : trade.outputAmount.currency }, void 0));
}

var _a$5;
var ApplicationModal;
(function (ApplicationModal) {
    ApplicationModal[ApplicationModal["WALLET"] = 0] = "WALLET";
    ApplicationModal[ApplicationModal["SETTINGS"] = 1] = "SETTINGS";
    ApplicationModal[ApplicationModal["SELF_CLAIM"] = 2] = "SELF_CLAIM";
    ApplicationModal[ApplicationModal["ADDRESS_CLAIM"] = 3] = "ADDRESS_CLAIM";
    ApplicationModal[ApplicationModal["CLAIM_POPUP"] = 4] = "CLAIM_POPUP";
    ApplicationModal[ApplicationModal["MENU"] = 5] = "MENU";
    ApplicationModal[ApplicationModal["DELEGATE"] = 6] = "DELEGATE";
    ApplicationModal[ApplicationModal["VOTE"] = 7] = "VOTE";
    ApplicationModal[ApplicationModal["POOL_OVERVIEW_OPTIONS"] = 8] = "POOL_OVERVIEW_OPTIONS";
    ApplicationModal[ApplicationModal["NETWORK_SELECTOR"] = 9] = "NETWORK_SELECTOR";
    ApplicationModal[ApplicationModal["PRIVACY_POLICY"] = 10] = "PRIVACY_POLICY";
})(ApplicationModal || (ApplicationModal = {}));
var initialState$8 = {
    chainId: null,
    openModal: null,
    popupList: [],
};
var applicationSlice = toolkit.createSlice({
    name: 'application',
    initialState: initialState$8,
    reducers: {
        updateChainId: function (state, action) {
            var chainId = action.payload.chainId;
            state.chainId = chainId;
        },
        setOpenModal: function (state, action) {
            state.openModal = action.payload;
        },
        addPopup: function (state, _a) {
            var _b = _a.payload, content = _b.content, key = _b.key, _c = _b.removeAfterMs, removeAfterMs = _c === void 0 ? DEFAULT_TXN_DISMISS_MS : _c;
            state.popupList = (key ? state.popupList.filter(function (popup) { return popup.key !== key; }) : state.popupList).concat([
                {
                    key: key || toolkit.nanoid(),
                    show: true,
                    content: content,
                    removeAfterMs: removeAfterMs,
                },
            ]);
        },
        removePopup: function (state, _a) {
            var key = _a.payload.key;
            state.popupList.forEach(function (p) {
                if (p.key === key) {
                    p.show = false;
                }
            });
        },
    },
});
(_a$5 = applicationSlice.actions, _a$5.updateChainId); var setOpenModal = _a$5.setOpenModal; _a$5.addPopup; _a$5.removePopup;
var application = applicationSlice.reducer;

function useModalOpen(modal) {
    var openModal = useAppSelector(function (state) { return state.application.openModal; });
    return openModal === modal;
}
function useToggleModal(modal) {
    var open = useModalOpen(modal);
    var dispatch = useAppDispatch();
    return React.useCallback(function () { return dispatch(setOpenModal(open ? null : modal)); }, [dispatch, modal, open]);
}
function useWalletModalToggle() {
    return useToggleModal(ApplicationModal.WALLET);
}
function useToggleSettingsMenu() {
    return useToggleModal(ApplicationModal.SETTINGS);
}

var ToggleElement = styled__default["default"].span(templateObject_1$a || (templateObject_1$a = __makeTemplateObject(["\n  padding: 0.25rem 0.6rem;\n  border-radius: 9px;\n  background: ", ";\n  color: ", ";\n  font-size: 14px;\n  font-weight: ", ";\n  :hover {\n    user-select: ", ";\n    background: ", ";\n    color: ", ";\n  }\n"], ["\n  padding: 0.25rem 0.6rem;\n  border-radius: 9px;\n  background: ", ";\n  color: ", ";\n  font-size: 14px;\n  font-weight: ", ";\n  :hover {\n    user-select: ", ";\n    background: ", ";\n    color: ", ";\n  }\n"])), function (_a) {
    var theme = _a.theme, isActive = _a.isActive, isOnSwitch = _a.isOnSwitch;
    return (isActive ? (isOnSwitch ? theme.primary1 : theme.bg4) : 'none');
}, function (_a) {
    var theme = _a.theme, isActive = _a.isActive;
    return (isActive ? theme.white : theme.text2);
}, function (_a) {
    var isOnSwitch = _a.isOnSwitch;
    return (isOnSwitch ? '500' : '400');
}, function (_a) {
    var isOnSwitch = _a.isOnSwitch;
    return (isOnSwitch ? 'none' : 'initial');
}, function (_a) {
    var theme = _a.theme, isActive = _a.isActive, isOnSwitch = _a.isOnSwitch;
    return isActive ? (isOnSwitch ? polished.darken(0.05, theme.primary1) : polished.darken(0.05, theme.bg4)) : 'none';
}, function (_a) {
    var theme = _a.theme, isActive = _a.isActive, isOnSwitch = _a.isOnSwitch;
    return (isActive ? (isOnSwitch ? theme.white : theme.white) : theme.text3);
});
var StyledToggle = styled__default["default"].button(templateObject_2$4 || (templateObject_2$4 = __makeTemplateObject(["\n  border-radius: 12px;\n  border: none;\n  background: ", ";\n  display: flex;\n  width: fit-content;\n  cursor: pointer;\n  outline: none;\n  padding: 2px;\n"], ["\n  border-radius: 12px;\n  border: none;\n  background: ", ";\n  display: flex;\n  width: fit-content;\n  cursor: pointer;\n  outline: none;\n  padding: 2px;\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg0;
});
function Toggle(_a) {
    var id = _a.id, isActive = _a.isActive, toggle = _a.toggle, _b = _a.checked, checked = _b === void 0 ? jsxRuntime.jsx(macro.Trans, { children: "On" }, void 0) : _b, _c = _a.unchecked, unchecked = _c === void 0 ? jsxRuntime.jsx(macro.Trans, { children: "Off" }, void 0) : _c;
    return (jsxRuntime.jsxs(StyledToggle, __assign({ id: id, isActive: isActive, onClick: toggle }, { children: [jsxRuntime.jsx(ToggleElement, __assign({ isActive: isActive, isOnSwitch: true }, { children: checked }), void 0), jsxRuntime.jsx(ToggleElement, __assign({ isActive: !isActive, isOnSwitch: false }, { children: unchecked }), void 0)] }), void 0));
}
var templateObject_1$a, templateObject_2$4;

var SlippageError;
(function (SlippageError) {
    SlippageError["InvalidInput"] = "InvalidInput";
})(SlippageError || (SlippageError = {}));
var DeadlineError;
(function (DeadlineError) {
    DeadlineError["InvalidInput"] = "InvalidInput";
})(DeadlineError || (DeadlineError = {}));
var FancyButton = styled__default["default"].button(templateObject_1$9 || (templateObject_1$9 = __makeTemplateObject(["\n  color: ", ";\n  align-items: center;\n  height: 2rem;\n  border-radius: 36px;\n  font-size: 1rem;\n  width: auto;\n  min-width: 3.5rem;\n  border: 1px solid ", ";\n  outline: none;\n  background: ", ";\n  :hover {\n    border: 1px solid ", ";\n  }\n  :focus {\n    border: 1px solid ", ";\n  }\n"], ["\n  color: ", ";\n  align-items: center;\n  height: 2rem;\n  border-radius: 36px;\n  font-size: 1rem;\n  width: auto;\n  min-width: 3.5rem;\n  border: 1px solid ", ";\n  outline: none;\n  background: ", ";\n  :hover {\n    border: 1px solid ", ";\n  }\n  :focus {\n    border: 1px solid ", ";\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.text1;
}, function (_a) {
    var theme = _a.theme;
    return theme.bg3;
}, function (_a) {
    var theme = _a.theme;
    return theme.bg1;
}, function (_a) {
    var theme = _a.theme;
    return theme.bg4;
}, function (_a) {
    var theme = _a.theme;
    return theme.primary1;
});
var Option = styled__default["default"](FancyButton)(templateObject_2$3 || (templateObject_2$3 = __makeTemplateObject(["\n  margin-right: 8px;\n  :hover {\n    cursor: pointer;\n  }\n  background-color: ", ";\n  color: ", ";\n"], ["\n  margin-right: 8px;\n  :hover {\n    cursor: pointer;\n  }\n  background-color: ", ";\n  color: ", ";\n"])), function (_a) {
    var active = _a.active, theme = _a.theme;
    return active && theme.primary1;
}, function (_a) {
    var active = _a.active, theme = _a.theme;
    return (active ? theme.white : theme.text1);
});
var Input = styled__default["default"].input(templateObject_3$2 || (templateObject_3$2 = __makeTemplateObject(["\n  background: ", ";\n  font-size: 16px;\n  width: auto;\n  outline: none;\n  &::-webkit-outer-spin-button,\n  &::-webkit-inner-spin-button {\n    -webkit-appearance: none;\n  }\n  color: ", ";\n  text-align: right;\n"], ["\n  background: ", ";\n  font-size: 16px;\n  width: auto;\n  outline: none;\n  &::-webkit-outer-spin-button,\n  &::-webkit-inner-spin-button {\n    -webkit-appearance: none;\n  }\n  color: ", ";\n  text-align: right;\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg1;
}, function (_a) {
    var theme = _a.theme, color = _a.color;
    return (color === 'red' ? theme.red1 : theme.text1);
});
var OptionCustom = styled__default["default"](FancyButton)(templateObject_4$1 || (templateObject_4$1 = __makeTemplateObject(["\n  height: 2rem;\n  position: relative;\n  padding: 0 0.75rem;\n  flex: 1;\n  border: ", ";\n  :hover {\n    border: ", ";\n  }\n\n  input {\n    width: 100%;\n    height: 100%;\n    border: 0px;\n    border-radius: 2rem;\n  }\n"], ["\n  height: 2rem;\n  position: relative;\n  padding: 0 0.75rem;\n  flex: 1;\n  border: ", ";\n  :hover {\n    border: ", ";\n  }\n\n  input {\n    width: 100%;\n    height: 100%;\n    border: 0px;\n    border-radius: 2rem;\n  }\n"])), function (_a) {
    var theme = _a.theme, active = _a.active, warning = _a.warning;
    return active ? "1px solid " + (warning ? theme.red1 : theme.primary1) : warning && "1px solid " + theme.red1;
}, function (_a) {
    var theme = _a.theme, active = _a.active, warning = _a.warning;
    return active && "1px solid " + (warning ? polished.darken(0.1, theme.red1) : polished.darken(0.1, theme.primary1));
});
var SlippageEmojiContainer = styled__default["default"].span(templateObject_6$1 || (templateObject_6$1 = __makeTemplateObject(["\n  color: #f3841e;\n  ", "\n"], ["\n  color: #f3841e;\n  ", "\n"])), function (_a) {
    var theme = _a.theme;
    return theme.mediaWidth.upToSmall(templateObject_5$1 || (templateObject_5$1 = __makeTemplateObject(["\n    display: none;\n  "], ["\n    display: none;\n  "])));
});
var THREE_DAYS_IN_SECONDS = ms__default["default"](templateObject_7$1 || (templateObject_7$1 = __makeTemplateObject(["3 days"], ["3 days"]))) / 1000;
function TransactionSettings(_a) {
    var placeholderSlippage = _a.placeholderSlippage;
    var chainId = useActiveWeb3React().chainId;
    var theme = React.useContext(styled.ThemeContext);
    var userSlippageTolerance = useUserSlippageTolerance();
    var setUserSlippageTolerance = useSetUserSlippageTolerance();
    var _b = __read(useUserTransactionTTL(), 2), deadline = _b[0], setDeadline = _b[1];
    var _c = __read(React.useState(''), 2), slippageInput = _c[0], setSlippageInput = _c[1];
    var _d = __read(React.useState(false), 2), slippageError = _d[0], setSlippageError = _d[1];
    var _e = __read(React.useState(''), 2), deadlineInput = _e[0], setDeadlineInput = _e[1];
    var _f = __read(React.useState(false), 2), deadlineError = _f[0], setDeadlineError = _f[1];
    function parseSlippageInput(value) {
        // populate what the user typed and clear the error
        setSlippageInput(value);
        setSlippageError(false);
        if (value.length === 0) {
            setUserSlippageTolerance('auto');
        }
        else {
            var parsed = Math.floor(Number.parseFloat(value) * 100);
            if (!Number.isInteger(parsed) || parsed < 0 || parsed > 5000) {
                setUserSlippageTolerance('auto');
                if (value !== '.') {
                    setSlippageError(SlippageError.InvalidInput);
                }
            }
            else {
                setUserSlippageTolerance(new sdkCore.Percent(parsed, 10000));
            }
        }
    }
    var tooLow = userSlippageTolerance !== 'auto' && userSlippageTolerance.lessThan(new sdkCore.Percent(5, 10000));
    var tooHigh = userSlippageTolerance !== 'auto' && userSlippageTolerance.greaterThan(new sdkCore.Percent(1, 100));
    function parseCustomDeadline(value) {
        // populate what the user typed and clear the error
        setDeadlineInput(value);
        setDeadlineError(false);
        if (value.length === 0) {
            setDeadline(DEFAULT_DEADLINE_FROM_NOW);
        }
        else {
            try {
                var parsed = Math.floor(Number.parseFloat(value) * 60);
                if (!Number.isInteger(parsed) || parsed < 60 || parsed > THREE_DAYS_IN_SECONDS) {
                    setDeadlineError(DeadlineError.InvalidInput);
                }
                else {
                    setDeadline(parsed);
                }
            }
            catch (error) {
                console.error(error);
                setDeadlineError(DeadlineError.InvalidInput);
            }
        }
    }
    var showCustomDeadlineRow = Boolean(chainId && !L2_CHAIN_IDS.includes(chainId));
    return (jsxRuntime.jsxs(AutoColumn, __assign({ gap: "md" }, { children: [jsxRuntime.jsxs(AutoColumn, __assign({ gap: "sm" }, { children: [jsxRuntime.jsxs(RowFixed, { children: [jsxRuntime.jsx(ThemedText.Black, __assign({ fontWeight: 400, fontSize: 14, color: theme.text2 }, { children: jsxRuntime.jsx(macro.Trans, { children: "Slippage tolerance" }, void 0) }), void 0), jsxRuntime.jsx(QuestionHelper, { text: jsxRuntime.jsx(macro.Trans, { children: "Your transaction will revert if the price changes unfavorably by more than this percentage." }, void 0) }, void 0)] }, void 0), jsxRuntime.jsxs(RowBetween, { children: [jsxRuntime.jsx(Option, __assign({ onClick: function () {
                                    parseSlippageInput('');
                                }, active: userSlippageTolerance === 'auto' }, { children: jsxRuntime.jsx(macro.Trans, { children: "Auto" }, void 0) }), void 0), jsxRuntime.jsx(OptionCustom, __assign({ active: userSlippageTolerance !== 'auto', warning: !!slippageError, tabIndex: -1 }, { children: jsxRuntime.jsxs(RowBetween, { children: [tooLow || tooHigh ? (jsxRuntime.jsx(SlippageEmojiContainer, { children: jsxRuntime.jsx("span", __assign({ role: "img", "aria-label": "warning" }, { children: "\u26A0\uFE0F" }), void 0) }, void 0)) : null, jsxRuntime.jsx(Input, { placeholder: placeholderSlippage.toFixed(2), value: slippageInput.length > 0
                                                ? slippageInput
                                                : userSlippageTolerance === 'auto'
                                                    ? ''
                                                    : userSlippageTolerance.toFixed(2), onChange: function (e) { return parseSlippageInput(e.target.value); }, onBlur: function () {
                                                setSlippageInput('');
                                                setSlippageError(false);
                                            }, color: slippageError ? 'red' : '' }, void 0), "%"] }, void 0) }), void 0)] }, void 0), slippageError || tooLow || tooHigh ? (jsxRuntime.jsx(RowBetween, __assign({ style: {
                            fontSize: '14px',
                            paddingTop: '7px',
                            color: slippageError ? 'red' : '#F3841E',
                        } }, { children: slippageError ? (jsxRuntime.jsx(macro.Trans, { children: "Enter a valid slippage percentage" }, void 0)) : tooLow ? (jsxRuntime.jsx(macro.Trans, { children: "Your transaction may fail" }, void 0)) : (jsxRuntime.jsx(macro.Trans, { children: "Your transaction may be frontrun" }, void 0)) }), void 0)) : null] }), void 0), showCustomDeadlineRow && (jsxRuntime.jsxs(AutoColumn, __assign({ gap: "sm" }, { children: [jsxRuntime.jsxs(RowFixed, { children: [jsxRuntime.jsx(ThemedText.Black, __assign({ fontSize: 14, fontWeight: 400, color: theme.text2 }, { children: jsxRuntime.jsx(macro.Trans, { children: "Transaction deadline" }, void 0) }), void 0), jsxRuntime.jsx(QuestionHelper, { text: jsxRuntime.jsx(macro.Trans, { children: "Your transaction will revert if it is pending for more than this period of time." }, void 0) }, void 0)] }, void 0), jsxRuntime.jsxs(RowFixed, { children: [jsxRuntime.jsx(OptionCustom, __assign({ style: { width: '80px' }, warning: !!deadlineError, tabIndex: -1 }, { children: jsxRuntime.jsx(Input, { placeholder: (DEFAULT_DEADLINE_FROM_NOW / 60).toString(), value: deadlineInput.length > 0
                                        ? deadlineInput
                                        : deadline === DEFAULT_DEADLINE_FROM_NOW
                                            ? ''
                                            : (deadline / 60).toString(), onChange: function (e) { return parseCustomDeadline(e.target.value); }, onBlur: function () {
                                        setDeadlineInput('');
                                        setDeadlineError(false);
                                    }, color: deadlineError ? 'red' : '' }, void 0) }), void 0), jsxRuntime.jsx(ThemedText.Body, __assign({ style: { paddingLeft: '8px' }, fontSize: 14 }, { children: jsxRuntime.jsx(macro.Trans, { children: "minutes" }, void 0) }), void 0)] }, void 0)] }), void 0))] }), void 0));
}
var templateObject_1$9, templateObject_2$3, templateObject_3$2, templateObject_4$1, templateObject_5$1, templateObject_6$1, templateObject_7$1;

var StyledMenuIcon = styled__default["default"](reactFeather.Settings)(templateObject_1$8 || (templateObject_1$8 = __makeTemplateObject(["\n  height: 20px;\n  width: 20px;\n\n  > * {\n    stroke: ", ";\n  }\n\n  :hover {\n    opacity: 0.7;\n  }\n"], ["\n  height: 20px;\n  width: 20px;\n\n  > * {\n    stroke: ", ";\n  }\n\n  :hover {\n    opacity: 0.7;\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.text1;
});
var StyledCloseIcon = styled__default["default"](reactFeather.X)(templateObject_2$2 || (templateObject_2$2 = __makeTemplateObject(["\n  height: 20px;\n  width: 20px;\n  :hover {\n    cursor: pointer;\n  }\n\n  > * {\n    stroke: ", ";\n  }\n"], ["\n  height: 20px;\n  width: 20px;\n  :hover {\n    cursor: pointer;\n  }\n\n  > * {\n    stroke: ", ";\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.text1;
});
var StyledMenuButton = styled__default["default"].button(templateObject_3$1 || (templateObject_3$1 = __makeTemplateObject(["\n  position: relative;\n  width: 100%;\n  height: 100%;\n  border: none;\n  background-color: transparent;\n  margin: 0;\n  padding: 0;\n  border-radius: 0.5rem;\n  height: 20px;\n\n  :hover,\n  :focus {\n    cursor: pointer;\n    outline: none;\n  }\n"], ["\n  position: relative;\n  width: 100%;\n  height: 100%;\n  border: none;\n  background-color: transparent;\n  margin: 0;\n  padding: 0;\n  border-radius: 0.5rem;\n  height: 20px;\n\n  :hover,\n  :focus {\n    cursor: pointer;\n    outline: none;\n  }\n"])));
var EmojiWrapper = styled__default["default"].div(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n  position: absolute;\n  bottom: -6px;\n  right: 0px;\n  font-size: 14px;\n"], ["\n  position: absolute;\n  bottom: -6px;\n  right: 0px;\n  font-size: 14px;\n"])));
var StyledMenu = styled__default["default"].div(templateObject_5 || (templateObject_5 = __makeTemplateObject(["\n  margin-left: 0.5rem;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  position: relative;\n  border: none;\n  text-align: left;\n"], ["\n  margin-left: 0.5rem;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  position: relative;\n  border: none;\n  text-align: left;\n"])));
var MenuFlyout = styled__default["default"].span(templateObject_7 || (templateObject_7 = __makeTemplateObject(["\n  min-width: 20.125rem;\n  background-color: ", ";\n  border: 1px solid ", ";\n  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),\n    0px 24px 32px rgba(0, 0, 0, 0.01);\n  border-radius: 12px;\n  display: flex;\n  flex-direction: column;\n  font-size: 1rem;\n  position: absolute;\n  top: 2rem;\n  right: 0rem;\n  z-index: 100;\n\n  ", ";\n\n  user-select: none;\n"], ["\n  min-width: 20.125rem;\n  background-color: ", ";\n  border: 1px solid ", ";\n  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),\n    0px 24px 32px rgba(0, 0, 0, 0.01);\n  border-radius: 12px;\n  display: flex;\n  flex-direction: column;\n  font-size: 1rem;\n  position: absolute;\n  top: 2rem;\n  right: 0rem;\n  z-index: 100;\n\n  ", ";\n\n  user-select: none;\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg2;
}, function (_a) {
    var theme = _a.theme;
    return theme.bg3;
}, function (_a) {
    var theme = _a.theme;
    return theme.mediaWidth.upToMedium(templateObject_6 || (templateObject_6 = __makeTemplateObject(["\n    min-width: 18.125rem;\n  "], ["\n    min-width: 18.125rem;\n  "])));
});
var Break = styled__default["default"].div(templateObject_8 || (templateObject_8 = __makeTemplateObject(["\n  width: 100%;\n  height: 1px;\n  background-color: ", ";\n"], ["\n  width: 100%;\n  height: 1px;\n  background-color: ", ";\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg3;
});
var ModalContentWrapper = styled__default["default"].div(templateObject_9 || (templateObject_9 = __makeTemplateObject(["\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 2rem 0;\n  background-color: ", ";\n  border-radius: 20px;\n"], ["\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 2rem 0;\n  background-color: ", ";\n  border-radius: 20px;\n"])), function (_a) {
    var theme = _a.theme;
    return theme.bg2;
});
function SettingsTab(_a) {
    var placeholderSlippage = _a.placeholderSlippage;
    var chainId = useActiveWeb3React().chainId;
    var node = React.useRef();
    var open = useModalOpen(ApplicationModal.SETTINGS);
    var toggle = useToggleSettingsMenu();
    var theme = React.useContext(styled.ThemeContext);
    var _b = __read(useExpertModeManager(), 2), expertMode = _b[0], toggleExpertMode = _b[1];
    var _c = __read(useClientSideRouter(), 2), clientSideRouter = _c[0], setClientSideRouter = _c[1];
    // show confirmation view before turning on
    var _d = __read(React.useState(false), 2), showConfirmation = _d[0], setShowConfirmation = _d[1];
    useOnClickOutside(node, open ? toggle : undefined);
    return (
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451
    jsxRuntime.jsxs(StyledMenu, __assign({ ref: node }, { children: [jsxRuntime.jsx(Modal, __assign({ isOpen: showConfirmation, onDismiss: function () { return setShowConfirmation(false); }, maxHeight: 100 }, { children: jsxRuntime.jsx(ModalContentWrapper, { children: jsxRuntime.jsxs(AutoColumn, __assign({ gap: "lg" }, { children: [jsxRuntime.jsxs(RowBetween, __assign({ style: { padding: '0 2rem' } }, { children: [jsxRuntime.jsx("div", {}, void 0), jsxRuntime.jsx(rebass.Text, __assign({ fontWeight: 500, fontSize: 20 }, { children: jsxRuntime.jsx(macro.Trans, { children: "Are you sure?" }, void 0) }), void 0), jsxRuntime.jsx(StyledCloseIcon, { onClick: function () { return setShowConfirmation(false); } }, void 0)] }), void 0), jsxRuntime.jsx(Break, {}, void 0), jsxRuntime.jsxs(AutoColumn, __assign({ gap: "lg", style: { padding: '0 2rem' } }, { children: [jsxRuntime.jsx(rebass.Text, __assign({ fontWeight: 500, fontSize: 20 }, { children: jsxRuntime.jsx(macro.Trans, { children: "Expert mode turns off the confirm transaction prompt and allows high slippage trades that often result in bad rates and lost funds." }, void 0) }), void 0), jsxRuntime.jsx(rebass.Text, __assign({ fontWeight: 600, fontSize: 20 }, { children: jsxRuntime.jsx(macro.Trans, { children: "ONLY USE THIS MODE IF YOU KNOW WHAT YOU ARE DOING." }, void 0) }), void 0), jsxRuntime.jsx(ButtonError, __assign({ error: true, padding: '12px', onClick: function () {
                                            var confirmWord = macro.t(templateObject_10 || (templateObject_10 = __makeTemplateObject(["confirm"], ["confirm"])));
                                            if (window.prompt(macro.t(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Please type the word \"", "\" to enable expert mode."], ["Please type the word \"", "\" to enable expert mode."])), confirmWord)) === confirmWord) {
                                                toggleExpertMode();
                                                setShowConfirmation(false);
                                            }
                                        } }, { children: jsxRuntime.jsx(rebass.Text, __assign({ fontSize: 20, fontWeight: 500, id: "confirm-expert-mode" }, { children: jsxRuntime.jsx(macro.Trans, { children: "Turn On Expert Mode" }, void 0) }), void 0) }), void 0)] }), void 0)] }), void 0) }, void 0) }), void 0), jsxRuntime.jsxs(StyledMenuButton, __assign({ onClick: toggle, id: "open-settings-dialog-button", "aria-label": macro.t(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Transaction Settings"], ["Transaction Settings"]))) }, { children: [jsxRuntime.jsx(StyledMenuIcon, {}, void 0), expertMode ? (jsxRuntime.jsx(EmojiWrapper, { children: jsxRuntime.jsx("span", __assign({ role: "img", "aria-label": "wizard-icon" }, { children: "\uD83E\uDDD9" }), void 0) }, void 0)) : null] }), void 0), open && (jsxRuntime.jsx(MenuFlyout, { children: jsxRuntime.jsxs(AutoColumn, __assign({ gap: "md", style: { padding: '1rem' } }, { children: [jsxRuntime.jsx(rebass.Text, __assign({ fontWeight: 600, fontSize: 14 }, { children: jsxRuntime.jsx(macro.Trans, { children: "Transaction Settings" }, void 0) }), void 0), jsxRuntime.jsx(TransactionSettings, { placeholderSlippage: placeholderSlippage }, void 0), jsxRuntime.jsx(rebass.Text, __assign({ fontWeight: 600, fontSize: 14 }, { children: jsxRuntime.jsx(macro.Trans, { children: "Interface Settings" }, void 0) }), void 0), chainId && AUTO_ROUTER_SUPPORTED_CHAINS.includes(chainId) && (jsxRuntime.jsxs(RowBetween, { children: [jsxRuntime.jsxs(RowFixed, { children: [jsxRuntime.jsx(ThemedText.Black, __assign({ fontWeight: 400, fontSize: 14, color: theme.text2 }, { children: jsxRuntime.jsx(macro.Trans, { children: "Auto Router API" }, void 0) }), void 0), jsxRuntime.jsx(QuestionHelper, { text: jsxRuntime.jsx(macro.Trans, { children: "Use the Uniswap Labs API to get faster quotes." }, void 0) }, void 0)] }, void 0), jsxRuntime.jsx(Toggle, { id: "toggle-optimized-router-button", isActive: !clientSideRouter, toggle: function () {
                                        ReactGA__default["default"].event({
                                            category: 'Routing',
                                            action: clientSideRouter ? 'enable routing API' : 'disable routing API',
                                        });
                                        setClientSideRouter(!clientSideRouter);
                                    } }, void 0)] }, void 0)), jsxRuntime.jsxs(RowBetween, { children: [jsxRuntime.jsxs(RowFixed, { children: [jsxRuntime.jsx(ThemedText.Black, __assign({ fontWeight: 400, fontSize: 14, color: theme.text2 }, { children: jsxRuntime.jsx(macro.Trans, { children: "Expert Mode" }, void 0) }), void 0), jsxRuntime.jsx(QuestionHelper, { text: jsxRuntime.jsx(macro.Trans, { children: "Allow high price impact trades and skip the confirm screen. Use at your own risk." }, void 0) }, void 0)] }, void 0), jsxRuntime.jsx(Toggle, { id: "toggle-expert-mode-button", isActive: expertMode, toggle: expertMode
                                        ? function () {
                                            toggleExpertMode();
                                            setShowConfirmation(false);
                                        }
                                        : function () {
                                            toggle();
                                            setShowConfirmation(true);
                                        } }, void 0)] }, void 0)] }), void 0) }, void 0))] }), void 0));
}
var templateObject_1$8, templateObject_2$2, templateObject_3$1, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12;

var StyledSwapHeader = styled__default["default"].div(templateObject_1$7 || (templateObject_1$7 = __makeTemplateObject(["\n  padding: 1rem 1.25rem 0.5rem 1.25rem;\n  width: 100%;\n  color: ", ";\n"], ["\n  padding: 1rem 1.25rem 0.5rem 1.25rem;\n  width: 100%;\n  color: ", ";\n"])), function (_a) {
    var theme = _a.theme;
    return theme.text2;
});
function SwapHeader(_a) {
    var allowedSlippage = _a.allowedSlippage;
    return (jsxRuntime.jsx(StyledSwapHeader, { children: jsxRuntime.jsxs(RowBetween, { children: [jsxRuntime.jsx(RowFixed, { children: jsxRuntime.jsx(ThemedText.Black, __assign({ fontWeight: 500, fontSize: 16, style: { marginRight: '8px' } }, { children: jsxRuntime.jsx(macro.Trans, { children: "Swap" }, void 0) }), void 0) }, void 0), jsxRuntime.jsx(RowFixed, { children: jsxRuntime.jsx(SettingsTab, { placeholderSlippage: allowedSlippage }, void 0) }, void 0)] }, void 0) }, void 0));
}
var templateObject_1$7;

function parsedQueryString(search) {
    if (!search) {
        // react-router-dom places search string in the hash
        var hash = window.location.hash;
        search = hash.substr(hash.indexOf('?'));
    }
    return search && search.length > 1 ? qs.parse(search, { parseArrays: false, ignoreQueryPrefix: true }) : {};
}
function useParsedQueryString() {
    var search = reactRouterDom.useLocation().search;
    return React.useMemo(function () { return parsedQueryString(search); }, [search]);
}

var SUPPORTED_LOCALES = [
    // order as they appear in the language dropdown
    'en-US',
    'af-ZA',
    'ar-SA',
    'ca-ES',
    'cs-CZ',
    'da-DK',
    'de-DE',
    'el-GR',
    'es-ES',
    'fi-FI',
    'fr-FR',
    'he-IL',
    'hu-HU',
    'id-ID',
    'it-IT',
    'ja-JP',
    'ko-KR',
    'nl-NL',
    'no-NO',
    'pl-PL',
    'pt-BR',
    'pt-PT',
    'ro-RO',
    'ru-RU',
    'sr-SP',
    'sv-SE',
    'sw-TZ',
    'tr-TR',
    'uk-UA',
    'vi-VN',
    'zh-CN',
    'zh-TW',
];
var DEFAULT_LOCALE = 'en-US';
var LOCALE_LABEL = {
    'af-ZA': 'Afrikaans',
    'ar-SA': 'العربية',
    'ca-ES': 'Català',
    'cs-CZ': 'čeština',
    'da-DK': 'dansk',
    'de-DE': 'Deutsch',
    'el-GR': 'ελληνικά',
    'en-US': 'English',
    'es-ES': 'Español',
    'fi-FI': 'suomi',
    'fr-FR': 'français',
    'he-IL': 'עִברִית',
    'hu-HU': 'Magyar',
    'id-ID': 'bahasa Indonesia',
    'it-IT': 'Italiano',
    'ja-JP': '日本語',
    'ko-KR': '한국어',
    'nl-NL': 'Nederlands',
    'no-NO': 'norsk',
    'pl-PL': 'Polskie',
    'pt-BR': 'português',
    'pt-PT': 'português',
    'ro-RO': 'Română',
    'ru-RU': 'русский',
    'sr-SP': 'Српски',
    'sv-SE': 'svenska',
    'sw-TZ': 'Kiswahili',
    'tr-TR': 'Türkçe',
    'uk-UA': 'Український',
    'vi-VN': 'Tiếng Việt',
    'zh-CN': '简体中文',
    'zh-TW': '繁体中文',
    pseudo: 'ƥƨèúδô',
};

var Field$3;
(function (Field) {
    Field["LIQUIDITY_PERCENT"] = "LIQUIDITY_PERCENT";
    Field["LIQUIDITY"] = "LIQUIDITY";
    Field["CURRENCY_A"] = "CURRENCY_A";
    Field["CURRENCY_B"] = "CURRENCY_B";
})(Field$3 || (Field$3 = {}));
var typeInput$3 = toolkit.createAction('burn/typeInputBurn');

var initialState$7 = {
    independentField: Field$3.LIQUIDITY_PERCENT,
    typedValue: '0',
};
var burn = toolkit.createReducer(initialState$7, function (builder) {
    return builder.addCase(typeInput$3, function (state, _a) {
        var _b = _a.payload, field = _b.field, typedValue = _b.typedValue;
        return __assign(__assign({}, state), { independentField: field, typedValue: typedValue });
    });
});

var selectPercent = toolkit.createAction('burnV3/selectBurnPercent');

var initialState$6 = {
    percent: 0,
};
var burnV3 = toolkit.createReducer(initialState$6, function (builder) {
    return builder.addCase(selectPercent, function (state, _a) {
        var percent = _a.payload.percent;
        return __assign(__assign({}, state), { percent: percent });
    });
});

var _a$4;
// List of supported subgraphs. Note that the app currently only support one active subgraph at a time
var CHAIN_SUBGRAPH_URL = (_a$4 = {},
    _a$4[SupportedChainId.MAINNET] = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
    _a$4[SupportedChainId.RINKEBY] = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
    _a$4[SupportedChainId.ARBITRUM_ONE] = 'https://api.thegraph.com/subgraphs/name/ianlapham/arbitrum-minimal',
    _a$4[SupportedChainId.OPTIMISM] = 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-optimism-dev',
    _a$4[SupportedChainId.POLYGON] = 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-polygon',
    _a$4);
var api = react.createApi({
    reducerPath: 'dataApi',
    baseQuery: graphqlRequestBaseQuery(),
    endpoints: function (builder) { return ({
        allV3Ticks: builder.query({
            query: function (_a) {
                var poolAddress = _a.poolAddress, _b = _a.skip, skip = _b === void 0 ? 0 : _b;
                return ({
                    document: graphqlRequest.gql(templateObject_1$6 || (templateObject_1$6 = __makeTemplateObject(["\n          query allV3Ticks($poolAddress: String!, $skip: Int!) {\n            ticks(first: 1000, skip: $skip, where: { poolAddress: $poolAddress }, orderBy: tickIdx) {\n              tick: tickIdx\n              liquidityNet\n              price0\n              price1\n            }\n          }\n        "], ["\n          query allV3Ticks($poolAddress: String!, $skip: Int!) {\n            ticks(first: 1000, skip: $skip, where: { poolAddress: $poolAddress }, orderBy: tickIdx) {\n              tick: tickIdx\n              liquidityNet\n              price0\n              price1\n            }\n          }\n        "]))),
                    variables: {
                        poolAddress: poolAddress,
                        skip: skip,
                    },
                });
            },
        }),
        feeTierDistribution: builder.query({
            query: function (_a) {
                var token0 = _a.token0, token1 = _a.token1;
                return ({
                    document: graphqlRequest.gql(templateObject_2$1 || (templateObject_2$1 = __makeTemplateObject(["\n          query feeTierDistribution($token0: String!, $token1: String!) {\n            _meta {\n              block {\n                number\n              }\n            }\n            asToken0: pools(\n              orderBy: totalValueLockedToken0\n              orderDirection: desc\n              where: { token0: $token0, token1: $token1 }\n            ) {\n              feeTier\n              totalValueLockedToken0\n              totalValueLockedToken1\n            }\n            asToken1: pools(\n              orderBy: totalValueLockedToken0\n              orderDirection: desc\n              where: { token0: $token1, token1: $token0 }\n            ) {\n              feeTier\n              totalValueLockedToken0\n              totalValueLockedToken1\n            }\n          }\n        "], ["\n          query feeTierDistribution($token0: String!, $token1: String!) {\n            _meta {\n              block {\n                number\n              }\n            }\n            asToken0: pools(\n              orderBy: totalValueLockedToken0\n              orderDirection: desc\n              where: { token0: $token0, token1: $token1 }\n            ) {\n              feeTier\n              totalValueLockedToken0\n              totalValueLockedToken1\n            }\n            asToken1: pools(\n              orderBy: totalValueLockedToken0\n              orderDirection: desc\n              where: { token0: $token1, token1: $token0 }\n            ) {\n              feeTier\n              totalValueLockedToken0\n              totalValueLockedToken1\n            }\n          }\n        "]))),
                    variables: {
                        token0: token0,
                        token1: token1,
                    },
                });
            },
        }),
    }); },
});
// Graphql query client wrapper that builds a dynamic url based on chain id
function graphqlRequestBaseQuery() {
    var _this = this;
    return function (_a, _b) {
        var document = _a.document, variables = _a.variables;
        var getState = _b.getState;
        return __awaiter(_this, void 0, void 0, function () {
            var chainId, subgraphUrl, error_1, name_1, message, stack, request, response;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        chainId = getState().application.chainId;
                        subgraphUrl = chainId ? CHAIN_SUBGRAPH_URL[chainId] : undefined;
                        if (!subgraphUrl) {
                            return [2 /*return*/, {
                                    error: {
                                        name: 'UnsupportedChainId',
                                        message: "Subgraph queries against ChainId " + chainId + " are not supported.",
                                        stack: '',
                                    },
                                }];
                        }
                        _c = {};
                        return [4 /*yield*/, new graphqlRequest.GraphQLClient(subgraphUrl).request(document, variables)];
                    case 1: return [2 /*return*/, (_c.data = _d.sent(), _c.meta = {}, _c)];
                    case 2:
                        error_1 = _d.sent();
                        if (error_1 instanceof graphqlRequest.ClientError) {
                            name_1 = error_1.name, message = error_1.message, stack = error_1.stack, request = error_1.request, response = error_1.response;
                            return [2 /*return*/, { error: { name: name_1, message: message, stack: stack }, meta: { request: request, response: response } }];
                        }
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
}
var templateObject_1$6, templateObject_2$1;

// fired once when the app reloads but before the app renders
// allows any updates to be applied to store data loaded from localStorage
var updateVersion = toolkit.createAction('global/updateVersion');

var NEW_LIST_STATE = {
    error: null,
    current: null,
    loadingRequestId: null,
    pendingUpdate: null,
};
var initialState$5 = {
    lastInitializedDefaultListOfLists: DEFAULT_LIST_OF_LISTS,
    byUrl: __assign({}, DEFAULT_LIST_OF_LISTS.reduce(function (memo, listUrl) {
        memo[listUrl] = NEW_LIST_STATE;
        return memo;
    }, {})),
    activeListUrls: DEFAULT_ACTIVE_LIST_URLS,
};
var lists = toolkit.createReducer(initialState$5, function (builder) {
    return builder
        .addCase(fetchTokenList.pending, function (state, _a) {
        var _b, _c, _d, _e;
        var _f = _a.payload, requestId = _f.requestId, url = _f.url;
        var current = (_c = (_b = state.byUrl[url]) === null || _b === void 0 ? void 0 : _b.current) !== null && _c !== void 0 ? _c : null;
        var pendingUpdate = (_e = (_d = state.byUrl[url]) === null || _d === void 0 ? void 0 : _d.pendingUpdate) !== null && _e !== void 0 ? _e : null;
        state.byUrl[url] = {
            current: current,
            pendingUpdate: pendingUpdate,
            loadingRequestId: requestId,
            error: null,
        };
    })
        .addCase(fetchTokenList.fulfilled, function (state, _a) {
        var _b, _c, _d;
        var _e = _a.payload, requestId = _e.requestId, tokenList = _e.tokenList, url = _e.url;
        var current = (_b = state.byUrl[url]) === null || _b === void 0 ? void 0 : _b.current;
        var loadingRequestId = (_c = state.byUrl[url]) === null || _c === void 0 ? void 0 : _c.loadingRequestId;
        // no-op if update does nothing
        if (current) {
            var upgradeType = tokenLists.getVersionUpgrade(current.version, tokenList.version);
            if (upgradeType === tokenLists.VersionUpgrade.NONE)
                return;
            if (loadingRequestId === null || loadingRequestId === requestId) {
                state.byUrl[url] = {
                    current: current,
                    pendingUpdate: tokenList,
                    loadingRequestId: null,
                    error: null,
                };
            }
        }
        else {
            // activate if on default active
            if (DEFAULT_ACTIVE_LIST_URLS.includes(url)) {
                (_d = state.activeListUrls) === null || _d === void 0 ? void 0 : _d.push(url);
            }
            state.byUrl[url] = {
                current: tokenList,
                pendingUpdate: null,
                loadingRequestId: null,
                error: null,
            };
        }
    })
        .addCase(fetchTokenList.rejected, function (state, _a) {
        var _b;
        var _c = _a.payload, url = _c.url, requestId = _c.requestId, errorMessage = _c.errorMessage;
        if (((_b = state.byUrl[url]) === null || _b === void 0 ? void 0 : _b.loadingRequestId) !== requestId) {
            // no-op since it's not the latest request
            return;
        }
        state.byUrl[url] = {
            current: state.byUrl[url].current ? state.byUrl[url].current : null,
            pendingUpdate: null,
            loadingRequestId: null,
            error: errorMessage,
        };
    })
        .addCase(addList, function (state, _a) {
        var url = _a.payload;
        if (!state.byUrl[url]) {
            state.byUrl[url] = NEW_LIST_STATE;
        }
    })
        .addCase(removeList, function (state, _a) {
        var url = _a.payload;
        if (state.byUrl[url]) {
            delete state.byUrl[url];
        }
        // remove list from active urls if needed
        if (state.activeListUrls && state.activeListUrls.includes(url)) {
            state.activeListUrls = state.activeListUrls.filter(function (u) { return u !== url; });
        }
    })
        .addCase(enableList, function (state, _a) {
        var url = _a.payload;
        if (!state.byUrl[url]) {
            state.byUrl[url] = NEW_LIST_STATE;
        }
        if (state.activeListUrls && !state.activeListUrls.includes(url)) {
            state.activeListUrls.push(url);
        }
        if (!state.activeListUrls) {
            state.activeListUrls = [url];
        }
    })
        .addCase(disableList, function (state, _a) {
        var url = _a.payload;
        if (state.activeListUrls && state.activeListUrls.includes(url)) {
            state.activeListUrls = state.activeListUrls.filter(function (u) { return u !== url; });
        }
    })
        .addCase(acceptListUpdate, function (state, _a) {
        var _b;
        var url = _a.payload;
        if (!((_b = state.byUrl[url]) === null || _b === void 0 ? void 0 : _b.pendingUpdate)) {
            throw new Error('accept list update called without pending update');
        }
        state.byUrl[url] = __assign(__assign({}, state.byUrl[url]), { current: state.byUrl[url].pendingUpdate, pendingUpdate: null });
    })
        .addCase(updateVersion, function (state) {
        // state loaded from localStorage, but new lists have never been initialized
        if (!state.lastInitializedDefaultListOfLists) {
            state.byUrl = initialState$5.byUrl;
            state.activeListUrls = initialState$5.activeListUrls;
        }
        else if (state.lastInitializedDefaultListOfLists) {
            var lastInitializedSet_1 = state.lastInitializedDefaultListOfLists.reduce(function (s, l) { return s.add(l); }, new Set());
            var newListOfListsSet_1 = DEFAULT_LIST_OF_LISTS.reduce(function (s, l) { return s.add(l); }, new Set());
            DEFAULT_LIST_OF_LISTS.forEach(function (listUrl) {
                if (!lastInitializedSet_1.has(listUrl)) {
                    state.byUrl[listUrl] = NEW_LIST_STATE;
                }
            });
            state.lastInitializedDefaultListOfLists.forEach(function (listUrl) {
                if (!newListOfListsSet_1.has(listUrl)) {
                    delete state.byUrl[listUrl];
                }
            });
        }
        state.lastInitializedDefaultListOfLists = DEFAULT_LIST_OF_LISTS;
        // if no active lists, activate defaults
        if (!state.activeListUrls) {
            state.activeListUrls = DEFAULT_ACTIVE_LIST_URLS;
            // for each list on default list, initialize if needed
            DEFAULT_ACTIVE_LIST_URLS.map(function (listUrl) {
                if (!state.byUrl[listUrl]) {
                    state.byUrl[listUrl] = NEW_LIST_STATE;
                }
                return true;
            });
        }
    });
});

/**
 * Converts a filter to the corresponding string key
 * @param filter the filter to convert
 */
function filterToKey(filter) {
    var _a, _b, _c, _d;
    return ((_a = filter.address) !== null && _a !== void 0 ? _a : '') + ":" + ((_d = (_c = (_b = filter.topics) === null || _b === void 0 ? void 0 : _b.map(function (topic) { return (topic ? (Array.isArray(topic) ? topic.join(';') : topic) : '\0'); })) === null || _c === void 0 ? void 0 : _c.join('-')) !== null && _d !== void 0 ? _d : '');
}

var _a$3;
var slice = toolkit.createSlice({
    name: 'logs',
    initialState: {},
    reducers: {
        addListener: function (state, _a) {
            var _b = _a.payload, chainId = _b.chainId, filter = _b.filter;
            if (!state[chainId])
                state[chainId] = {};
            var key = filterToKey(filter);
            if (!state[chainId][key])
                state[chainId][key] = {
                    listeners: 1,
                };
            else
                state[chainId][key].listeners++;
        },
        fetchingLogs: function (state, _a) {
            var e_1, _b;
            var _c = _a.payload, chainId = _c.chainId, filters = _c.filters, blockNumber = _c.blockNumber;
            if (!state[chainId])
                return;
            try {
                for (var filters_1 = __values(filters), filters_1_1 = filters_1.next(); !filters_1_1.done; filters_1_1 = filters_1.next()) {
                    var filter = filters_1_1.value;
                    var key = filterToKey(filter);
                    if (!state[chainId][key])
                        continue;
                    state[chainId][key].fetchingBlockNumber = blockNumber;
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (filters_1_1 && !filters_1_1.done && (_b = filters_1.return)) _b.call(filters_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        },
        fetchedLogs: function (state, _a) {
            var _b = _a.payload, chainId = _b.chainId, filter = _b.filter, results = _b.results;
            if (!state[chainId])
                return;
            var key = filterToKey(filter);
            var fetchState = state[chainId][key];
            if (!fetchState || (fetchState.results && fetchState.results.blockNumber > results.blockNumber))
                return;
            fetchState.results = results;
        },
        fetchedLogsError: function (state, _a) {
            var _b = _a.payload, chainId = _b.chainId, filter = _b.filter, blockNumber = _b.blockNumber;
            if (!state[chainId])
                return;
            var key = filterToKey(filter);
            var fetchState = state[chainId][key];
            if (!fetchState || (fetchState.results && fetchState.results.blockNumber > blockNumber))
                return;
            fetchState.results = {
                blockNumber: blockNumber,
                error: true,
            };
        },
        removeListener: function (state, _a) {
            var _b = _a.payload, chainId = _b.chainId, filter = _b.filter;
            if (!state[chainId])
                return;
            var key = filterToKey(filter);
            if (!state[chainId][key])
                return;
            state[chainId][key].listeners--;
        },
    },
});
var logs = slice.reducer;
(_a$3 = slice.actions, _a$3.addListener); _a$3.removeListener; _a$3.fetchedLogs; _a$3.fetchedLogsError; _a$3.fetchingLogs;

var Field$2;
(function (Field) {
    Field["CURRENCY_A"] = "CURRENCY_A";
    Field["CURRENCY_B"] = "CURRENCY_B";
})(Field$2 || (Field$2 = {}));
var typeInput$2 = toolkit.createAction('mint/typeInputMint');
var resetMintState$1 = toolkit.createAction('mint/resetMintState');

var initialState$4 = {
    independentField: Field$2.CURRENCY_A,
    typedValue: '',
    otherTypedValue: '',
    startPriceTypedValue: '',
    leftRangeTypedValue: '',
    rightRangeTypedValue: '',
};
var mint = toolkit.createReducer(initialState$4, function (builder) {
    return builder
        .addCase(resetMintState$1, function () { return initialState$4; })
        .addCase(typeInput$2, function (state, _a) {
        var _b = _a.payload, field = _b.field, typedValue = _b.typedValue, noLiquidity = _b.noLiquidity;
        if (noLiquidity) {
            // they're typing into the field they've last typed in
            if (field === state.independentField) {
                return __assign(__assign({}, state), { independentField: field, typedValue: typedValue });
            }
            // they're typing into a new field, store the other value
            else {
                return __assign(__assign({}, state), { independentField: field, typedValue: typedValue, otherTypedValue: state.typedValue });
            }
        }
        else {
            return __assign(__assign({}, state), { independentField: field, typedValue: typedValue, otherTypedValue: '' });
        }
    });
});

var Field$1;
(function (Field) {
    Field["CURRENCY_A"] = "CURRENCY_A";
    Field["CURRENCY_B"] = "CURRENCY_B";
})(Field$1 || (Field$1 = {}));
var Bound;
(function (Bound) {
    Bound["LOWER"] = "LOWER";
    Bound["UPPER"] = "UPPER";
})(Bound || (Bound = {}));
var typeInput$1 = toolkit.createAction('mintV3/typeInputMint');
var typeStartPriceInput = toolkit.createAction('mintV3/typeStartPriceInput');
var typeLeftRangeInput = toolkit.createAction('mintV3/typeLeftRangeInput');
var typeRightRangeInput = toolkit.createAction('mintV3/typeRightRangeInput');
var resetMintState = toolkit.createAction('mintV3/resetMintState');
var setFullRange = toolkit.createAction('mintV3/setFullRange');

var initialState$3 = {
    independentField: Field$1.CURRENCY_A,
    typedValue: '',
    startPriceTypedValue: '',
    leftRangeTypedValue: '',
    rightRangeTypedValue: '',
};
var mintV3 = toolkit.createReducer(initialState$3, function (builder) {
    return builder
        .addCase(resetMintState, function () { return initialState$3; })
        .addCase(setFullRange, function (state) {
        return __assign(__assign({}, state), { leftRangeTypedValue: true, rightRangeTypedValue: true });
    })
        .addCase(typeStartPriceInput, function (state, _a) {
        var typedValue = _a.payload.typedValue;
        return __assign(__assign({}, state), { startPriceTypedValue: typedValue });
    })
        .addCase(typeLeftRangeInput, function (state, _a) {
        var typedValue = _a.payload.typedValue;
        return __assign(__assign({}, state), { leftRangeTypedValue: typedValue });
    })
        .addCase(typeRightRangeInput, function (state, _a) {
        var typedValue = _a.payload.typedValue;
        return __assign(__assign({}, state), { rightRangeTypedValue: typedValue });
    })
        .addCase(typeInput$1, function (state, _a) {
        var _b = _a.payload, field = _b.field, typedValue = _b.typedValue, noLiquidity = _b.noLiquidity;
        if (noLiquidity) {
            // they're typing into the field they've last typed in
            if (field === state.independentField) {
                return __assign(__assign({}, state), { independentField: field, typedValue: typedValue });
            }
            // they're typing into a new field, store the other value
            else {
                return __assign(__assign({}, state), { independentField: field, typedValue: typedValue });
            }
        }
        else {
            return __assign(__assign({}, state), { independentField: field, typedValue: typedValue });
        }
    });
});

var protocols = [routerSdk.Protocol.V2, routerSdk.Protocol.V3];
var DEFAULT_QUERY_PARAMS = {
    protocols: protocols.map(function (p) { return p.toLowerCase(); }).join(','),
    // example other params
    // forceCrossProtocol: 'true',
    // minSplits: '5',
};
function getClientSideQuote(_a) {
    var tokenInAddress = _a.tokenInAddress, tokenInChainId = _a.tokenInChainId, tokenInDecimals = _a.tokenInDecimals, tokenInSymbol = _a.tokenInSymbol, tokenOutAddress = _a.tokenOutAddress, tokenOutChainId = _a.tokenOutChainId, tokenOutDecimals = _a.tokenOutDecimals, tokenOutSymbol = _a.tokenOutSymbol, amount = _a.amount, type = _a.type;
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, Promise.resolve().then(function () { return index; })];
                case 1: return [2 /*return*/, (_b.sent()).getQuote({
                        type: type,
                        chainId: tokenInChainId,
                        tokenIn: {
                            address: tokenInAddress,
                            chainId: tokenInChainId,
                            decimals: tokenInDecimals,
                            symbol: tokenInSymbol,
                        },
                        tokenOut: {
                            address: tokenOutAddress,
                            chainId: tokenOutChainId,
                            decimals: tokenOutDecimals,
                            symbol: tokenOutSymbol,
                        },
                        amount: amount,
                    }, { protocols: protocols })];
            }
        });
    });
}
var routingApi = react.createApi({
    reducerPath: 'routingApi',
    baseQuery: react.fetchBaseQuery({
        baseUrl: 'https://api.uniswap.org/v1/',
    }),
    endpoints: function (build) { return ({
        getQuote: build.query({
            queryFn: function (args, _api, _extraOptions, fetch) {
                return __awaiter(this, void 0, void 0, function () {
                    var tokenInAddress, tokenInChainId, tokenOutAddress, tokenOutChainId, amount, useClientSideRouter, type, result, query, e_1;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                tokenInAddress = args.tokenInAddress, tokenInChainId = args.tokenInChainId, tokenOutAddress = args.tokenOutAddress, tokenOutChainId = args.tokenOutChainId, amount = args.amount, useClientSideRouter = args.useClientSideRouter, type = args.type;
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 6, , 7]);
                                if (!useClientSideRouter) return [3 /*break*/, 3];
                                return [4 /*yield*/, getClientSideQuote(args)];
                            case 2:
                                result = _a.sent();
                                return [3 /*break*/, 5];
                            case 3:
                                query = qs__default["default"].stringify(__assign(__assign({}, DEFAULT_QUERY_PARAMS), { tokenInAddress: tokenInAddress, tokenInChainId: tokenInChainId, tokenOutAddress: tokenOutAddress, tokenOutChainId: tokenOutChainId, amount: amount, type: type }));
                                return [4 /*yield*/, fetch("quote?" + query)];
                            case 4:
                                result = _a.sent();
                                _a.label = 5;
                            case 5: return [2 /*return*/, { data: result.data }];
                            case 6:
                                e_1 = _a.sent();
                                // TODO: fall back to client-side quoter when auto router fails.
                                // deprecate 'legacy' v2/v3 routers first.
                                return [2 /*return*/, { error: e_1 }];
                            case 7: return [2 /*return*/];
                        }
                    });
                });
            },
            keepUnusedDataFor: ms__default["default"](templateObject_1$5 || (templateObject_1$5 = __makeTemplateObject(["10s"], ["10s"]))),
            extraOptions: {
                maxRetries: 0,
            },
        }),
    }); },
});
var useGetQuoteQuery = routingApi.useGetQuoteQuery;
var templateObject_1$5;

var Field;
(function (Field) {
    Field["INPUT"] = "INPUT";
    Field["OUTPUT"] = "OUTPUT";
})(Field || (Field = {}));
var selectCurrency = toolkit.createAction('swap/selectCurrency');
var switchCurrencies = toolkit.createAction('swap/switchCurrencies');
var typeInput = toolkit.createAction('swap/typeInput');
var replaceSwapState = toolkit.createAction('swap/replaceSwapState');
var setRecipient = toolkit.createAction('swap/setRecipient');

var CHAIN_DATA_ABI = [
    {
        inputs: [],
        name: 'latestAnswer',
        outputs: [{ internalType: 'int256', name: '', type: 'int256' }],
        stateMutability: 'view',
        type: 'function',
    },
];
/**
 * Returns the price of 1 gas in WEI for the currently selected network using the chainlink fast gas price oracle
 */
function useGasPrice() {
    var _a, _b;
    var address = useENSAddress('fast-gas-gwei.data.eth').address;
    var contract = useContract(address !== null && address !== void 0 ? address : undefined, CHAIN_DATA_ABI, false);
    var resultStr = (_b = (_a = useSingleCallResult(contract, 'latestAnswer').result) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.toString();
    return typeof resultStr === 'string' ? JSBI__default["default"].BigInt(resultStr) : undefined;
}

var V3_SWAP_DEFAULT_SLIPPAGE = new sdkCore.Percent(50, 10000); // .50%
var ONE_TENTHS_PERCENT = new sdkCore.Percent(10, 10000); // .10%
/**
 * Return a guess of the gas cost used in computing slippage tolerance for a given trade
 * @param trade the trade for which to _guess_ the amount of gas it would cost to execute
 */
function guesstimateGas(trade) {
    if (!!trade) {
        return 100000 + trade.swaps.reduce(function (memo, swap) { return swap.route.pools.length + memo; }, 0) * 30000;
    }
    return undefined;
}
var MIN_AUTO_SLIPPAGE_TOLERANCE = new sdkCore.Percent(5, 1000); // 0.5%
var MAX_AUTO_SLIPPAGE_TOLERANCE = new sdkCore.Percent(25, 100); // 25%
/**
 * Returns slippage tolerance based on values from current trade, gas estimates from api, and active network.
 */
function useAutoSlippageTolerance(trade) {
    var chainId = useActiveWeb3React().chainId;
    var onL2 = chainId && L2_CHAIN_IDS.includes(chainId);
    var outputDollarValue = useUSDCValue(trade === null || trade === void 0 ? void 0 : trade.outputAmount);
    var nativeGasPrice = useGasPrice();
    var gasEstimate = guesstimateGas(trade);
    var nativeCurrency = useNativeCurrency();
    var nativeCurrencyPrice = useUSDCPrice(nativeCurrency !== null && nativeCurrency !== void 0 ? nativeCurrency : undefined);
    return React.useMemo(function () {
        if (!trade || onL2)
            return ONE_TENTHS_PERCENT;
        var nativeGasCost = nativeGasPrice && typeof gasEstimate === 'number'
            ? JSBI__default["default"].multiply(nativeGasPrice, JSBI__default["default"].BigInt(gasEstimate))
            : undefined;
        var dollarGasCost = nativeCurrency && nativeGasCost && nativeCurrencyPrice
            ? nativeCurrencyPrice.quote(sdkCore.CurrencyAmount.fromRawAmount(nativeCurrency, nativeGasCost))
            : undefined;
        // if valid estimate from api and using api trade, use gas estimate from api
        // NOTE - dont use gas estimate for L2s yet - need to verify accuracy
        // if not, use local heuristic
        var dollarCostToUse = chainId && SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(chainId) && (trade === null || trade === void 0 ? void 0 : trade.gasUseEstimateUSD)
            ? trade.gasUseEstimateUSD
            : dollarGasCost;
        if (outputDollarValue && dollarCostToUse) {
            // the rationale is that a user will not want their trade to fail for a loss due to slippage that is less than
            // the cost of the gas of the failed transaction
            var fraction = dollarCostToUse.asFraction.divide(outputDollarValue.asFraction);
            var result = new sdkCore.Percent(fraction.numerator, fraction.denominator);
            if (result.greaterThan(MAX_AUTO_SLIPPAGE_TOLERANCE))
                return MAX_AUTO_SLIPPAGE_TOLERANCE;
            if (result.lessThan(MIN_AUTO_SLIPPAGE_TOLERANCE))
                return MIN_AUTO_SLIPPAGE_TOLERANCE;
            return result;
        }
        return V3_SWAP_DEFAULT_SLIPPAGE;
    }, [trade, onL2, nativeGasPrice, gasEstimate, nativeCurrency, nativeCurrencyPrice, chainId, outputDollarValue]);
}

/**
 * Transforms a Routing API quote into an array of routes that can be used to create
 * a `Trade`.
 */
function computeRoutes(currencyIn, currencyOut, tradeType, quoteResult) {
    if (!quoteResult || !quoteResult.route || !currencyIn || !currencyOut)
        return undefined;
    if (quoteResult.route.length === 0)
        return [];
    var parsedTokenIn = parseToken(quoteResult.route[0][0].tokenIn);
    var parsedTokenOut = parseToken(quoteResult.route[0][quoteResult.route[0].length - 1].tokenOut);
    if (parsedTokenIn.address !== currencyIn.wrapped.address)
        return undefined;
    if (parsedTokenOut.address !== currencyOut.wrapped.address)
        return undefined;
    var parsedCurrencyIn = currencyIn.isNative ? nativeOnChain(currencyIn.chainId) : parsedTokenIn;
    var parsedCurrencyOut = currencyOut.isNative ? nativeOnChain(currencyOut.chainId) : parsedTokenOut;
    try {
        return quoteResult.route.map(function (route) {
            if (route.length === 0) {
                throw new Error('Expected route to have at least one pair or pool');
            }
            var rawAmountIn = route[0].amountIn;
            var rawAmountOut = route[route.length - 1].amountOut;
            if (!rawAmountIn || !rawAmountOut) {
                throw new Error('Expected both amountIn and amountOut to be present');
            }
            return {
                routev3: isV3Route(route) ? new v3Sdk.Route(route.map(parsePool), parsedCurrencyIn, parsedCurrencyOut) : null,
                routev2: !isV3Route(route) ? new v2Sdk.Route(route.map(parsePair), parsedCurrencyIn, parsedCurrencyOut) : null,
                inputAmount: sdkCore.CurrencyAmount.fromRawAmount(parsedCurrencyIn, rawAmountIn),
                outputAmount: sdkCore.CurrencyAmount.fromRawAmount(parsedCurrencyOut, rawAmountOut),
            };
        });
    }
    catch (e) {
        // `Route` constructor may throw if inputs/outputs are temporarily out of sync
        // (RTK-Query always returns the latest data which may not be the right inputs/outputs)
        // This is not fatal and will fix itself in future render cycles
        console.error(e);
        return undefined;
    }
}
function transformRoutesToTrade(route, tradeType, gasUseEstimateUSD) {
    var _a, _b;
    return new InterfaceTrade({
        v2Routes: (_a = route === null || route === void 0 ? void 0 : route.filter(function (r) { return r.routev2 !== null; }).map(function (_a) {
            var routev2 = _a.routev2, inputAmount = _a.inputAmount, outputAmount = _a.outputAmount;
            return ({ routev2: routev2, inputAmount: inputAmount, outputAmount: outputAmount });
        })) !== null && _a !== void 0 ? _a : [],
        v3Routes: (_b = route === null || route === void 0 ? void 0 : route.filter(function (r) { return r.routev3 !== null; }).map(function (_a) {
            var routev3 = _a.routev3, inputAmount = _a.inputAmount, outputAmount = _a.outputAmount;
            return ({ routev3: routev3, inputAmount: inputAmount, outputAmount: outputAmount });
        })) !== null && _b !== void 0 ? _b : [],
        tradeType: tradeType,
        gasUseEstimateUSD: gasUseEstimateUSD,
    });
}
var parseToken = function (_a) {
    var address = _a.address, chainId = _a.chainId, decimals = _a.decimals, symbol = _a.symbol;
    return new sdkCore.Token(chainId, address, parseInt(decimals.toString()), symbol);
};
var parsePool = function (_a) {
    var fee = _a.fee, sqrtRatioX96 = _a.sqrtRatioX96, liquidity = _a.liquidity, tickCurrent = _a.tickCurrent, tokenIn = _a.tokenIn, tokenOut = _a.tokenOut;
    return new v3Sdk.Pool(parseToken(tokenIn), parseToken(tokenOut), parseInt(fee), sqrtRatioX96, liquidity, parseInt(tickCurrent));
};
var parsePair = function (_a) {
    var reserve0 = _a.reserve0, reserve1 = _a.reserve1;
    return new v2Sdk.Pair(sdkCore.CurrencyAmount.fromRawAmount(parseToken(reserve0.token), reserve0.quotient), sdkCore.CurrencyAmount.fromRawAmount(parseToken(reserve1.token), reserve1.quotient));
};
function isV3Route(route) {
    return route[0].type === 'v3-pool';
}

function useFreshData(data, dataBlockNumber, maxBlockAge) {
    if (maxBlockAge === void 0) { maxBlockAge = 10; }
    var localBlockNumber = useBlockNumber();
    if (!localBlockNumber)
        return undefined;
    if (localBlockNumber - dataBlockNumber > maxBlockAge) {
        return undefined;
    }
    return data;
}
/**
 * Returns query arguments for the Routing API query or undefined if the
 * query should be skipped.
 */
function useRoutingAPIArguments(_a) {
    var tokenIn = _a.tokenIn, tokenOut = _a.tokenOut, amount = _a.amount, tradeType = _a.tradeType;
    var _b = __read(useClientSideRouter(), 1), clientSideRouter = _b[0];
    return React.useMemo(function () {
        return !tokenIn || !tokenOut || !amount || tokenIn.equals(tokenOut)
            ? undefined
            : {
                amount: amount.quotient.toString(),
                tokenInAddress: tokenIn.wrapped.address,
                tokenInChainId: tokenIn.wrapped.chainId,
                tokenInDecimals: tokenIn.wrapped.decimals,
                tokenInSymbol: tokenIn.wrapped.symbol,
                tokenOutAddress: tokenOut.wrapped.address,
                tokenOutChainId: tokenOut.wrapped.chainId,
                tokenOutDecimals: tokenOut.wrapped.decimals,
                tokenOutSymbol: tokenOut.wrapped.symbol,
                useClientSideRouter: clientSideRouter,
                type: (tradeType === sdkCore.TradeType.EXACT_INPUT ? 'exactIn' : 'exactOut'),
            };
    }, [amount, clientSideRouter, tokenIn, tokenOut, tradeType]);
}
/**
 * Returns the best trade by invoking the routing api or the smart order router on the client
 * @param tradeType whether the swap is an exact in/out
 * @param amountSpecified the exact amount to swap in/out
 * @param otherCurrency the desired output/payment currency
 */
function useRoutingAPITrade(tradeType, amountSpecified, otherCurrency) {
    var _a;
    var _b = __read(React.useMemo(function () {
        return tradeType === sdkCore.TradeType.EXACT_INPUT
            ? [amountSpecified === null || amountSpecified === void 0 ? void 0 : amountSpecified.currency, otherCurrency]
            : [otherCurrency, amountSpecified === null || amountSpecified === void 0 ? void 0 : amountSpecified.currency];
    }, [amountSpecified, otherCurrency, tradeType]), 2), currencyIn = _b[0], currencyOut = _b[1];
    var queryArgs = useRoutingAPIArguments({
        tokenIn: currencyIn,
        tokenOut: currencyOut,
        amount: amountSpecified,
        tradeType: tradeType,
    });
    var _c = useGetQuoteQuery(queryArgs !== null && queryArgs !== void 0 ? queryArgs : react.skipToken, {
        pollingInterval: ms__default["default"](templateObject_1$4 || (templateObject_1$4 = __makeTemplateObject(["15s"], ["15s"]))),
        refetchOnFocus: true,
    }), isLoading = _c.isLoading, isError = _c.isError, data = _c.data;
    var quoteResult = useFreshData(data, Number(data === null || data === void 0 ? void 0 : data.blockNumber) || 0);
    var route = React.useMemo(function () { return computeRoutes(currencyIn, currencyOut, tradeType, quoteResult); }, [currencyIn, currencyOut, quoteResult, tradeType]);
    // get USD gas cost of trade in active chains stablecoin amount
    var gasUseEstimateUSD = (_a = useStablecoinAmountFromFiatValue(quoteResult === null || quoteResult === void 0 ? void 0 : quoteResult.gasUseEstimateUSD)) !== null && _a !== void 0 ? _a : null;
    return React.useMemo(function () {
        if (!currencyIn || !currencyOut) {
            return {
                state: TradeState.INVALID,
                trade: undefined,
            };
        }
        if (isLoading && !quoteResult) {
            // only on first hook render
            return {
                state: TradeState.LOADING,
                trade: undefined,
            };
        }
        var otherAmount = tradeType === sdkCore.TradeType.EXACT_INPUT
            ? currencyOut && quoteResult
                ? sdkCore.CurrencyAmount.fromRawAmount(currencyOut, quoteResult.quote)
                : undefined
            : currencyIn && quoteResult
                ? sdkCore.CurrencyAmount.fromRawAmount(currencyIn, quoteResult.quote)
                : undefined;
        if (isError || !otherAmount || !route || route.length === 0 || !queryArgs) {
            return {
                state: TradeState.NO_ROUTE_FOUND,
                trade: undefined,
            };
        }
        try {
            var trade = transformRoutesToTrade(route, tradeType, gasUseEstimateUSD);
            return {
                // always return VALID regardless of isFetching status
                state: TradeState.VALID,
                trade: trade,
            };
        }
        catch (e) {
            console.debug('transformRoutesToTrade failed: ', e);
            return { state: TradeState.INVALID, trade: undefined };
        }
    }, [currencyIn, currencyOut, isLoading, quoteResult, tradeType, isError, route, queryArgs, gasUseEstimateUSD]);
}
var templateObject_1$4;

/**
 * Returns the best v2+v3 trade for a desired swap.
 * @param tradeType whether the swap is an exact in/out
 * @param amountSpecified the exact amount to swap in/out
 * @param otherCurrency the desired output/payment currency
 */
function useBestTrade(tradeType, amountSpecified, otherCurrency) {
    var autoRouterSupported = useAutoRouterSupported();
    var isWindowVisible = useIsWindowVisible();
    var _a = __read(useDebounce(React.useMemo(function () { return [amountSpecified, otherCurrency]; }, [amountSpecified, otherCurrency]), 200), 2), debouncedAmount = _a[0], debouncedOtherCurrency = _a[1];
    var routingAPITrade = useRoutingAPITrade(tradeType, autoRouterSupported && isWindowVisible ? debouncedAmount : undefined, debouncedOtherCurrency);
    var isLoading = amountSpecified !== undefined && debouncedAmount === undefined;
    // consider trade debouncing when inputs/outputs do not match
    var debouncing = routingAPITrade.trade &&
        amountSpecified &&
        (tradeType === sdkCore.TradeType.EXACT_INPUT
            ? !routingAPITrade.trade.inputAmount.equalTo(amountSpecified) ||
                !amountSpecified.currency.equals(routingAPITrade.trade.inputAmount.currency) ||
                !(debouncedOtherCurrency === null || debouncedOtherCurrency === void 0 ? void 0 : debouncedOtherCurrency.equals(routingAPITrade.trade.outputAmount.currency))
            : !routingAPITrade.trade.outputAmount.equalTo(amountSpecified) ||
                !amountSpecified.currency.equals(routingAPITrade.trade.outputAmount.currency) ||
                !(debouncedOtherCurrency === null || debouncedOtherCurrency === void 0 ? void 0 : debouncedOtherCurrency.equals(routingAPITrade.trade.inputAmount.currency)));
    var useFallback = !autoRouterSupported || (!debouncing && routingAPITrade.state === TradeState.NO_ROUTE_FOUND);
    // only use client side router if routing api trade failed or is not supported
    var bestV3Trade = useClientSideV3Trade(tradeType, useFallback ? debouncedAmount : undefined, useFallback ? debouncedOtherCurrency : undefined);
    // only return gas estimate from api if routing api trade is used
    return React.useMemo(function () { return (__assign(__assign(__assign({}, (useFallback ? bestV3Trade : routingAPITrade)), (debouncing ? { state: TradeState.SYNCING } : {})), (isLoading ? { state: TradeState.LOADING } : {}))); }, [bestV3Trade, debouncing, isLoading, routingAPITrade, useFallback]);
}

function useSwapState() {
    return useAppSelector(function (state) { return state.swap; });
}
function useSwapActionHandlers() {
    var dispatch = useAppDispatch();
    var onCurrencySelection = React.useCallback(function (field, currency) {
        dispatch(selectCurrency({
            field: field,
            currencyId: currency.isToken ? currency.address : currency.isNative ? 'ETH' : '',
        }));
    }, [dispatch]);
    var onSwitchTokens = React.useCallback(function () {
        dispatch(switchCurrencies());
    }, [dispatch]);
    var onUserInput = React.useCallback(function (field, typedValue) {
        dispatch(typeInput({ field: field, typedValue: typedValue }));
    }, [dispatch]);
    var onChangeRecipient = React.useCallback(function (recipient) {
        dispatch(setRecipient({ recipient: recipient }));
    }, [dispatch]);
    return {
        onSwitchTokens: onSwitchTokens,
        onCurrencySelection: onCurrencySelection,
        onUserInput: onUserInput,
        onChangeRecipient: onChangeRecipient,
    };
}
var BAD_RECIPIENT_ADDRESSES = {
    '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f': true,
    '0xf164fC0Ec4E93095b804a4795bBe1e041497b92a': true,
    '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D': true, // v2 router 02
};
// from the current swap inputs, compute the best trade and return it.
function useDerivedSwapInfo() {
    var _a, _b;
    var account = useActiveWeb3React().account;
    var _c = useSwapState(), independentField = _c.independentField, typedValue = _c.typedValue, _d = Field.INPUT, inputCurrencyId = _c[_d].currencyId, _e = Field.OUTPUT, outputCurrencyId = _c[_e].currencyId, recipient = _c.recipient;
    var inputCurrency = useCurrency(inputCurrencyId);
    var outputCurrency = useCurrency(outputCurrencyId);
    var recipientLookup = useENS(recipient !== null && recipient !== void 0 ? recipient : undefined);
    var to = (_a = (recipient === null ? account : recipientLookup.address)) !== null && _a !== void 0 ? _a : null;
    var relevantTokenBalances = useCurrencyBalances(account !== null && account !== void 0 ? account : undefined, React.useMemo(function () { return [inputCurrency !== null && inputCurrency !== void 0 ? inputCurrency : undefined, outputCurrency !== null && outputCurrency !== void 0 ? outputCurrency : undefined]; }, [inputCurrency, outputCurrency]));
    var isExactIn = independentField === Field.INPUT;
    var parsedAmount = React.useMemo(function () { var _a; return tryParseCurrencyAmount(typedValue, (_a = (isExactIn ? inputCurrency : outputCurrency)) !== null && _a !== void 0 ? _a : undefined); }, [inputCurrency, isExactIn, outputCurrency, typedValue]);
    var trade = useBestTrade(isExactIn ? sdkCore.TradeType.EXACT_INPUT : sdkCore.TradeType.EXACT_OUTPUT, parsedAmount, (_b = (isExactIn ? outputCurrency : inputCurrency)) !== null && _b !== void 0 ? _b : undefined);
    var currencyBalances = React.useMemo(function () {
        var _a;
        return (_a = {},
            _a[Field.INPUT] = relevantTokenBalances[0],
            _a[Field.OUTPUT] = relevantTokenBalances[1],
            _a);
    }, [relevantTokenBalances]);
    var currencies = React.useMemo(function () {
        var _a;
        return (_a = {},
            _a[Field.INPUT] = inputCurrency,
            _a[Field.OUTPUT] = outputCurrency,
            _a);
    }, [inputCurrency, outputCurrency]);
    // allowed slippage is either auto slippage, or custom user defined slippage if auto slippage disabled
    var autoSlippageTolerance = useAutoSlippageTolerance(trade.trade);
    var allowedSlippage = useUserSlippageToleranceWithDefault(autoSlippageTolerance);
    var inputError = React.useMemo(function () {
        var _a;
        var inputError;
        if (!account) {
            inputError = jsxRuntime.jsx(macro.Trans, { children: "Connect Wallet" }, void 0);
        }
        if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
            inputError = inputError !== null && inputError !== void 0 ? inputError : jsxRuntime.jsx(macro.Trans, { children: "Select a token" }, void 0);
        }
        if (!parsedAmount) {
            inputError = inputError !== null && inputError !== void 0 ? inputError : jsxRuntime.jsx(macro.Trans, { children: "Enter an amount" }, void 0);
        }
        var formattedTo = isAddress(to);
        if (!to || !formattedTo) {
            inputError = inputError !== null && inputError !== void 0 ? inputError : jsxRuntime.jsx(macro.Trans, { children: "Enter a recipient" }, void 0);
        }
        else {
            if (BAD_RECIPIENT_ADDRESSES[formattedTo]) {
                inputError = inputError !== null && inputError !== void 0 ? inputError : jsxRuntime.jsx(macro.Trans, { children: "Invalid recipient" }, void 0);
            }
        }
        // compare input balance to max input based on version
        var _b = __read([currencyBalances[Field.INPUT], (_a = trade.trade) === null || _a === void 0 ? void 0 : _a.maximumAmountIn(allowedSlippage)], 2), balanceIn = _b[0], amountIn = _b[1];
        if (balanceIn && amountIn && balanceIn.lessThan(amountIn)) {
            inputError = jsxRuntime.jsxs(macro.Trans, { children: ["Insufficient ", amountIn.currency.symbol, " balance"] }, void 0);
        }
        return inputError;
    }, [account, allowedSlippage, currencies, currencyBalances, parsedAmount, to, trade.trade]);
    return React.useMemo(function () { return ({
        currencies: currencies,
        currencyBalances: currencyBalances,
        parsedAmount: parsedAmount,
        inputError: inputError,
        trade: trade,
        allowedSlippage: allowedSlippage,
    }); }, [allowedSlippage, currencies, currencyBalances, inputError, parsedAmount, trade]);
}
function parseCurrencyFromURLParameter(urlParam) {
    if (typeof urlParam === 'string') {
        var valid = isAddress(urlParam);
        if (valid)
            return valid;
        if (urlParam.toUpperCase() === 'ETH')
            return 'ETH';
    }
    return '';
}
function parseTokenAmountURLParameter(urlParam) {
    return typeof urlParam === 'string' && !isNaN(parseFloat(urlParam)) ? urlParam : '';
}
function parseIndependentFieldURLParameter(urlParam) {
    return typeof urlParam === 'string' && urlParam.toLowerCase() === 'output' ? Field.OUTPUT : Field.INPUT;
}
var ENS_NAME_REGEX = /^[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)?$/;
var ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
function validatedRecipient(recipient) {
    if (typeof recipient !== 'string')
        return null;
    var address = isAddress(recipient);
    if (address)
        return address;
    if (ENS_NAME_REGEX.test(recipient))
        return recipient;
    if (ADDRESS_REGEX.test(recipient))
        return recipient;
    return null;
}
function queryParametersToSwapState(parsedQs) {
    var _a;
    var inputCurrency = parseCurrencyFromURLParameter(parsedQs.inputCurrency);
    var outputCurrency = parseCurrencyFromURLParameter(parsedQs.outputCurrency);
    if (inputCurrency === '' && outputCurrency === '') {
        // default to ETH input
        inputCurrency = 'ETH';
    }
    else if (inputCurrency === outputCurrency) {
        // clear output if identical
        outputCurrency = '';
    }
    var recipient = validatedRecipient(parsedQs.recipient);
    return _a = {},
        _a[Field.INPUT] = {
            currencyId: inputCurrency === '' ? null : inputCurrency !== null && inputCurrency !== void 0 ? inputCurrency : null,
        },
        _a[Field.OUTPUT] = {
            currencyId: outputCurrency === '' ? null : outputCurrency !== null && outputCurrency !== void 0 ? outputCurrency : null,
        },
        _a.typedValue = parseTokenAmountURLParameter(parsedQs.exactAmount),
        _a.independentField = parseIndependentFieldURLParameter(parsedQs.exactField),
        _a.recipient = recipient,
        _a;
}
// updates the swap state to use the defaults for a given network
function useDefaultsFromURLSearch() {
    var chainId = useActiveWeb3React().chainId;
    var dispatch = useAppDispatch();
    var parsedQs = useParsedQueryString();
    var _a = __read(React.useState(), 2), result = _a[0], setResult = _a[1];
    React.useEffect(function () {
        var _a, _b;
        if (!chainId)
            return;
        var parsed = queryParametersToSwapState(parsedQs);
        var inputCurrencyId = (_a = parsed[Field.INPUT].currencyId) !== null && _a !== void 0 ? _a : undefined;
        var outputCurrencyId = (_b = parsed[Field.OUTPUT].currencyId) !== null && _b !== void 0 ? _b : undefined;
        dispatch(replaceSwapState({
            typedValue: parsed.typedValue,
            field: parsed.independentField,
            inputCurrencyId: inputCurrencyId,
            outputCurrencyId: outputCurrencyId,
            recipient: parsed.recipient,
        }));
        setResult({ inputCurrencyId: inputCurrencyId, outputCurrencyId: outputCurrencyId });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, chainId]);
    return result;
}

var initialState$2 = queryParametersToSwapState(parsedQueryString());
var swap = toolkit.createReducer(initialState$2, function (builder) {
    return builder
        .addCase(replaceSwapState, function (state, _a) {
        var _b;
        var _c = _a.payload, typedValue = _c.typedValue, recipient = _c.recipient, field = _c.field, inputCurrencyId = _c.inputCurrencyId, outputCurrencyId = _c.outputCurrencyId;
        return _b = {},
            _b[Field.INPUT] = {
                currencyId: inputCurrencyId !== null && inputCurrencyId !== void 0 ? inputCurrencyId : null,
            },
            _b[Field.OUTPUT] = {
                currencyId: outputCurrencyId !== null && outputCurrencyId !== void 0 ? outputCurrencyId : null,
            },
            _b.independentField = field,
            _b.typedValue = typedValue,
            _b.recipient = recipient,
            _b;
    })
        .addCase(selectCurrency, function (state, _a) {
        var _b, _c;
        var _d = _a.payload, currencyId = _d.currencyId, field = _d.field;
        var otherField = field === Field.INPUT ? Field.OUTPUT : Field.INPUT;
        if (currencyId === state[otherField].currencyId) {
            // the case where we have to swap the order
            return __assign(__assign({}, state), (_b = { independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT }, _b[field] = { currencyId: currencyId }, _b[otherField] = { currencyId: state[field].currencyId }, _b));
        }
        else {
            // the normal case
            return __assign(__assign({}, state), (_c = {}, _c[field] = { currencyId: currencyId }, _c));
        }
    })
        .addCase(switchCurrencies, function (state) {
        var _a;
        return __assign(__assign({}, state), (_a = { independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT }, _a[Field.INPUT] = { currencyId: state[Field.OUTPUT].currencyId }, _a[Field.OUTPUT] = { currencyId: state[Field.INPUT].currencyId }, _a));
    })
        .addCase(typeInput, function (state, _a) {
        var _b = _a.payload, field = _b.field, typedValue = _b.typedValue;
        return __assign(__assign({}, state), { independentField: field, typedValue: typedValue });
    })
        .addCase(setRecipient, function (state, _a) {
        var recipient = _a.payload.recipient;
        state.recipient = recipient;
    });
});

var now = function () { return new Date().getTime(); };
var initialState$1 = {};
var transactions = toolkit.createReducer(initialState$1, function (builder) {
    return builder
        .addCase(updateVersion, function (transactions) {
        // in case there are any transactions in the store with the old format, remove them
        Object.keys(transactions).forEach(function (chainId) {
            var chainTransactions = transactions[chainId];
            Object.keys(chainTransactions).forEach(function (hash) {
                if (!('info' in chainTransactions[hash])) {
                    // clear old transactions that don't have the right format
                    delete chainTransactions[hash];
                }
            });
        });
    })
        .addCase(addTransaction, function (transactions, _a) {
        var _b, _c;
        var _d = _a.payload, chainId = _d.chainId, from = _d.from, hash = _d.hash, info = _d.info;
        if ((_b = transactions[chainId]) === null || _b === void 0 ? void 0 : _b[hash]) {
            throw Error('Attempted to add existing transaction.');
        }
        var txs = (_c = transactions[chainId]) !== null && _c !== void 0 ? _c : {};
        txs[hash] = { hash: hash, info: info, from: from, addedTime: now() };
        transactions[chainId] = txs;
    })
        .addCase(clearAllTransactions, function (transactions, _a) {
        var chainId = _a.payload.chainId;
        if (!transactions[chainId])
            return;
        transactions[chainId] = {};
    })
        .addCase(checkedTransaction, function (transactions, _a) {
        var _b;
        var _c = _a.payload, chainId = _c.chainId, hash = _c.hash, blockNumber = _c.blockNumber;
        var tx = (_b = transactions[chainId]) === null || _b === void 0 ? void 0 : _b[hash];
        if (!tx) {
            return;
        }
        if (!tx.lastCheckedBlockNumber) {
            tx.lastCheckedBlockNumber = blockNumber;
        }
        else {
            tx.lastCheckedBlockNumber = Math.max(blockNumber, tx.lastCheckedBlockNumber);
        }
    })
        .addCase(finalizeTransaction, function (transactions, _a) {
        var _b;
        var _c = _a.payload, hash = _c.hash, chainId = _c.chainId, receipt = _c.receipt;
        var tx = (_b = transactions[chainId]) === null || _b === void 0 ? void 0 : _b[hash];
        if (!tx) {
            return;
        }
        tx.receipt = receipt;
        tx.confirmedTime = now();
    });
});

var currentTimestamp = function () { return new Date().getTime(); };
function pairKey(token0Address, token1Address) {
    return token0Address + ";" + token1Address;
}
var initialState = {
    matchesDarkMode: false,
    userDarkMode: null,
    userExpertMode: false,
    userLocale: null,
    userClientSideRouter: false,
    userHideClosedPositions: false,
    userSlippageTolerance: 'auto',
    userSlippageToleranceHasBeenMigratedToAuto: true,
    userDeadline: DEFAULT_DEADLINE_FROM_NOW,
    tokens: {},
    pairs: {},
    timestamp: currentTimestamp(),
    URLWarningVisible: true,
    showSurveyPopup: undefined,
};
var user = toolkit.createReducer(initialState, function (builder) {
    return builder
        .addCase(updateVersion, function (state) {
        // slippage isnt being tracked in local storage, reset to default
        // noinspection SuspiciousTypeOfGuard
        if (typeof state.userSlippageTolerance !== 'number' ||
            !Number.isInteger(state.userSlippageTolerance) ||
            state.userSlippageTolerance < 0 ||
            state.userSlippageTolerance > 5000) {
            state.userSlippageTolerance = 'auto';
        }
        else {
            if (!state.userSlippageToleranceHasBeenMigratedToAuto &&
                [10, 50, 100].indexOf(state.userSlippageTolerance) !== -1) {
                state.userSlippageTolerance = 'auto';
                state.userSlippageToleranceHasBeenMigratedToAuto = true;
            }
        }
        // deadline isnt being tracked in local storage, reset to default
        // noinspection SuspiciousTypeOfGuard
        if (typeof state.userDeadline !== 'number' ||
            !Number.isInteger(state.userDeadline) ||
            state.userDeadline < 60 ||
            state.userDeadline > 180 * 60) {
            state.userDeadline = DEFAULT_DEADLINE_FROM_NOW;
        }
        state.lastUpdateVersionTimestamp = currentTimestamp();
    })
        .addCase(updateUserDarkMode, function (state, action) {
        state.userDarkMode = action.payload.userDarkMode;
        state.timestamp = currentTimestamp();
    })
        .addCase(updateMatchesDarkMode, function (state, action) {
        state.matchesDarkMode = action.payload.matchesDarkMode;
        state.timestamp = currentTimestamp();
    })
        .addCase(updateUserExpertMode, function (state, action) {
        state.userExpertMode = action.payload.userExpertMode;
        state.timestamp = currentTimestamp();
    })
        .addCase(updateUserLocale, function (state, action) {
        state.userLocale = action.payload.userLocale;
        state.timestamp = currentTimestamp();
    })
        .addCase(updateUserSlippageTolerance, function (state, action) {
        state.userSlippageTolerance = action.payload.userSlippageTolerance;
        state.timestamp = currentTimestamp();
    })
        .addCase(updateUserDeadline, function (state, action) {
        state.userDeadline = action.payload.userDeadline;
        state.timestamp = currentTimestamp();
    })
        .addCase(updateUserClientSideRouter, function (state, action) {
        state.userClientSideRouter = action.payload.userClientSideRouter;
    })
        .addCase(updateHideClosedPositions, function (state, action) {
        state.userHideClosedPositions = action.payload.userHideClosedPositions;
    })
        .addCase(updateShowSurveyPopup, function (state, action) {
        state.showSurveyPopup = action.payload.showSurveyPopup;
    })
        .addCase(addSerializedToken, function (state, _a) {
        var serializedToken = _a.payload.serializedToken;
        if (!state.tokens) {
            state.tokens = {};
        }
        state.tokens[serializedToken.chainId] = state.tokens[serializedToken.chainId] || {};
        state.tokens[serializedToken.chainId][serializedToken.address] = serializedToken;
        state.timestamp = currentTimestamp();
    })
        .addCase(removeSerializedToken, function (state, _a) {
        var _b = _a.payload, address = _b.address, chainId = _b.chainId;
        if (!state.tokens) {
            state.tokens = {};
        }
        state.tokens[chainId] = state.tokens[chainId] || {};
        delete state.tokens[chainId][address];
        state.timestamp = currentTimestamp();
    })
        .addCase(addSerializedPair, function (state, _a) {
        var serializedPair = _a.payload.serializedPair;
        if (serializedPair.token0.chainId === serializedPair.token1.chainId &&
            serializedPair.token0.address !== serializedPair.token1.address) {
            var chainId = serializedPair.token0.chainId;
            state.pairs[chainId] = state.pairs[chainId] || {};
            state.pairs[chainId][pairKey(serializedPair.token0.address, serializedPair.token1.address)] = serializedPair;
        }
        state.timestamp = currentTimestamp();
    })
        .addCase(removeSerializedPair, function (state, _a) {
        var _b = _a.payload, chainId = _b.chainId, tokenAAddress = _b.tokenAAddress, tokenBAddress = _b.tokenBAddress;
        if (state.pairs[chainId]) {
            // just delete both keys if either exists
            delete state.pairs[chainId][pairKey(tokenAAddress, tokenBAddress)];
            delete state.pairs[chainId][pairKey(tokenBAddress, tokenAAddress)];
        }
        state.timestamp = currentTimestamp();
    });
});

var _a$2;
var PERSISTED_KEYS = ['user', 'transactions', 'lists'];
var store = toolkit.configureStore({
    reducer: (_a$2 = {
            application: application,
            user: user,
            transactions: transactions,
            swap: swap,
            mint: mint,
            mintV3: mintV3,
            burn: burn,
            burnV3: burnV3,
            multicall: multicall.reducer,
            lists: lists,
            logs: logs
        },
        _a$2[api.reducerPath] = api.reducer,
        _a$2[routingApi.reducerPath] = routingApi.reducer,
        _a$2),
    middleware: function (getDefaultMiddleware) {
        return getDefaultMiddleware({ thunk: true })
            .concat(api.middleware)
            .concat(routingApi.middleware)
            .concat(reduxLocalstorageSimple.save({ states: PERSISTED_KEYS, debounce: 1000 }));
    },
    preloadedState: reduxLocalstorageSimple.load({ states: PERSISTED_KEYS, disableWarnings: process.env.NODE_ENV === 'test' }),
});
store.dispatch(updateVersion());
react.setupListeners(store.dispatch);

var _a$1, _b$1, _c$1;
/**
 * Given a locale string (e.g. from user agent), return the best match for corresponding SupportedLocale
 * @param maybeSupportedLocale the fuzzy locale identifier
 */
function parseLocale(maybeSupportedLocale) {
    if (typeof maybeSupportedLocale !== 'string')
        return undefined;
    var lowerMaybeSupportedLocale = maybeSupportedLocale.toLowerCase();
    return SUPPORTED_LOCALES.find(function (locale) { return locale.toLowerCase() === lowerMaybeSupportedLocale || locale.split('-')[0] === lowerMaybeSupportedLocale; });
}
/**
 * Returns the supported locale read from the user agent (navigator)
 */
function navigatorLocale() {
    var _a;
    if (!navigator.language)
        return undefined;
    var _b = __read(navigator.language.split('-'), 2), language = _b[0], region = _b[1];
    if (region) {
        return (_a = parseLocale(language + "-" + region.toUpperCase())) !== null && _a !== void 0 ? _a : parseLocale(language);
    }
    return parseLocale(language);
}
function storeLocale() {
    var _a;
    return (_a = store.getState().user.userLocale) !== null && _a !== void 0 ? _a : undefined;
}
(_c$1 = (_b$1 = (_a$1 = parseLocale(parsedQueryString().lng)) !== null && _a$1 !== void 0 ? _a$1 : storeLocale()) !== null && _b$1 !== void 0 ? _b$1 : navigatorLocale()) !== null && _c$1 !== void 0 ? _c$1 : DEFAULT_LOCALE;
function useUrlLocale() {
    var parsed = useParsedQueryString();
    return parseLocale(parsed.lng);
}
/**
 * Returns the currently active locale, from a combination of user agent, query string, and user settings stored in redux
 * Stores the query string locale in redux (if set) to persist across sessions
 */
function useActiveLocale() {
    var urlLocale = useUrlLocale();
    var userLocale = useUserLocale();
    return React.useMemo(function () { var _a, _b; return (_b = (_a = urlLocale !== null && urlLocale !== void 0 ? urlLocale : userLocale) !== null && _a !== void 0 ? _a : navigatorLocale()) !== null && _b !== void 0 ? _b : DEFAULT_LOCALE; }, [urlLocale, userLocale]);
}

function useLocationLinkProps(locale) {
    var location = reactRouterDom.useLocation();
    var qs$1 = useParsedQueryString();
    var activeLocale = useActiveLocale();
    return React.useMemo(function () {
        return !locale
            ? {}
            : {
                to: __assign(__assign({}, location), { search: qs.stringify(__assign(__assign({}, qs$1), { lng: locale })) }),
                onClick: function () {
                    ReactGA__default["default"].event({
                        category: 'Localization',
                        action: 'Switch Locale',
                        label: activeLocale + " -> " + locale,
                    });
                },
            };
    }, [location, qs$1, activeLocale, locale]);
}

var Container = styled__default["default"](ThemedText.Small)(templateObject_1$3 || (templateObject_1$3 = __makeTemplateObject(["\n  opacity: 0.6;\n  :hover {\n    opacity: 1;\n  }\n  margin-top: 1rem !important;\n"], ["\n  opacity: 0.6;\n  :hover {\n    opacity: 1;\n  }\n  margin-top: 1rem !important;\n"])));
var useTargetLocale = function (activeLocale) {
    var browserLocale = React.useMemo(function () { return navigatorLocale(); }, []);
    if (browserLocale && (browserLocale !== DEFAULT_LOCALE || activeLocale !== DEFAULT_LOCALE)) {
        if (activeLocale === browserLocale) {
            return DEFAULT_LOCALE;
        }
        else {
            return browserLocale;
        }
    }
    return null;
};
function SwitchLocaleLink() {
    var activeLocale = useActiveLocale();
    var targetLocale = useTargetLocale(activeLocale);
    var _a = useLocationLinkProps(targetLocale), to = _a.to, onClick = _a.onClick;
    if (!targetLocale || !to)
        return null;
    return (jsxRuntime.jsx(Container, { children: jsxRuntime.jsxs(macro.Trans, { children: ["Uniswap available in:", ' ', jsxRuntime.jsx(StyledInternalLink, __assign({ onClick: onClick, to: to }, { children: LOCALE_LABEL[targetLocale] }), void 0)] }, void 0) }, void 0));
}
var templateObject_1$3;

function TokenWarningModal(_a) {
    var isOpen = _a.isOpen, tokens = _a.tokens, onConfirm = _a.onConfirm, onDismiss = _a.onDismiss;
    return (jsxRuntime.jsx(Modal, __assign({ isOpen: isOpen, onDismiss: onDismiss, maxHeight: 100 }, { children: jsxRuntime.jsx(ImportToken, { tokens: tokens, handleCurrencySelect: onConfirm }, void 0) }), void 0));
}

function useTokenAllowance(token, owner, spender) {
    var contract = useTokenContract(token === null || token === void 0 ? void 0 : token.address, false);
    var inputs = React.useMemo(function () { return [owner, spender]; }, [owner, spender]);
    var allowance = useSingleCallResult(contract, 'allowance', inputs).result;
    return React.useMemo(function () { return (token && allowance ? sdkCore.CurrencyAmount.fromRawAmount(token, allowance.toString()) : undefined); }, [token, allowance]);
}

var ApprovalState;
(function (ApprovalState) {
    ApprovalState["UNKNOWN"] = "UNKNOWN";
    ApprovalState["NOT_APPROVED"] = "NOT_APPROVED";
    ApprovalState["PENDING"] = "PENDING";
    ApprovalState["APPROVED"] = "APPROVED";
})(ApprovalState || (ApprovalState = {}));
function useApprovalStateForSpender(amountToApprove, spender, useIsPendingApproval) {
    var _a;
    var account = useActiveWeb3React().account;
    var token = ((_a = amountToApprove === null || amountToApprove === void 0 ? void 0 : amountToApprove.currency) === null || _a === void 0 ? void 0 : _a.isToken) ? amountToApprove.currency : undefined;
    var currentAllowance = useTokenAllowance(token, account !== null && account !== void 0 ? account : undefined, spender);
    var pendingApproval = useIsPendingApproval(token, spender);
    return React.useMemo(function () {
        if (!amountToApprove || !spender)
            return ApprovalState.UNKNOWN;
        if (amountToApprove.currency.isNative)
            return ApprovalState.APPROVED;
        // we might not have enough data to know whether or not we need to approve
        if (!currentAllowance)
            return ApprovalState.UNKNOWN;
        // amountToApprove will be defined if currentAllowance is
        return currentAllowance.lessThan(amountToApprove)
            ? pendingApproval
                ? ApprovalState.PENDING
                : ApprovalState.NOT_APPROVED
            : ApprovalState.APPROVED;
    }, [amountToApprove, currentAllowance, pendingApproval, spender]);
}
function useApproval(amountToApprove, spender, useIsPendingApproval) {
    var _this = this;
    var _a;
    var chainId = useActiveWeb3React().chainId;
    var token = ((_a = amountToApprove === null || amountToApprove === void 0 ? void 0 : amountToApprove.currency) === null || _a === void 0 ? void 0 : _a.isToken) ? amountToApprove.currency : undefined;
    // check the current approval status
    var approvalState = useApprovalStateForSpender(amountToApprove, spender, useIsPendingApproval);
    var tokenContract = useTokenContract(token === null || token === void 0 ? void 0 : token.address);
    var approve = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        function logFailure(error) {
            console.warn(((token === null || token === void 0 ? void 0 : token.symbol) || 'Token') + " approval failed:", error);
            return;
        }
        var useExact, estimatedGas;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Bail early if there is an issue.
                    if (approvalState !== ApprovalState.NOT_APPROVED) {
                        return [2 /*return*/, logFailure('approve was called unnecessarily')];
                    }
                    else if (!chainId) {
                        return [2 /*return*/, logFailure('no chainId')];
                    }
                    else if (!token) {
                        return [2 /*return*/, logFailure('no token')];
                    }
                    else if (!tokenContract) {
                        return [2 /*return*/, logFailure('tokenContract is null')];
                    }
                    else if (!amountToApprove) {
                        return [2 /*return*/, logFailure('missing amount to approve')];
                    }
                    else if (!spender) {
                        return [2 /*return*/, logFailure('no spender')];
                    }
                    useExact = false;
                    return [4 /*yield*/, tokenContract.estimateGas.approve(spender, constants.MaxUint256).catch(function () {
                            // general fallback for tokens which restrict approval amounts
                            useExact = true;
                            return tokenContract.estimateGas.approve(spender, amountToApprove.quotient.toString());
                        })];
                case 1:
                    estimatedGas = _a.sent();
                    return [2 /*return*/, tokenContract
                            .approve(spender, useExact ? amountToApprove.quotient.toString() : constants.MaxUint256, {
                            gasLimit: calculateGasMargin(estimatedGas),
                        })
                            .then(function (response) { return ({
                            response: response,
                            tokenAddress: token.address,
                            spenderAddress: spender,
                        }); })
                            .catch(function (error) {
                            logFailure(error);
                            throw error;
                        })];
            }
        });
    }); }, [approvalState, token, tokenContract, amountToApprove, spender, chainId]);
    return [approvalState, approve];
}

var SwapRouterVersion;
(function (SwapRouterVersion) {
    SwapRouterVersion[SwapRouterVersion["V2"] = 0] = "V2";
    SwapRouterVersion[SwapRouterVersion["V3"] = 1] = "V3";
    SwapRouterVersion[SwapRouterVersion["V2V3"] = 2] = "V2V3";
})(SwapRouterVersion || (SwapRouterVersion = {}));
/**
 * Returns the swap router that will result in the least amount of txs (less gas) for a given swap.
 * Heuristic:
 * - if trade contains a single v2-only trade & V2 SwapRouter is approved: use V2 SwapRouter
 * - if trade contains only v3 & V3 SwapRouter is approved: use V3 SwapRouter
 * - else: approve and use V2+V3 SwapRouter
 */
function getTxOptimizedSwapRouter(_a) {
    var onlyV2Routes = _a.onlyV2Routes, onlyV3Routes = _a.onlyV3Routes, tradeHasSplits = _a.tradeHasSplits, approvalStates = _a.approvalStates;
    if ([approvalStates.v2, approvalStates.v3, approvalStates.v2V3].includes(ApprovalState.PENDING))
        return undefined;
    if (approvalStates.v2V3 === ApprovalState.APPROVED)
        return SwapRouterVersion.V2V3;
    if (approvalStates.v2 === ApprovalState.APPROVED && onlyV2Routes && !tradeHasSplits)
        return SwapRouterVersion.V2;
    if (approvalStates.v3 === ApprovalState.APPROVED && onlyV3Routes)
        return SwapRouterVersion.V3;
    return SwapRouterVersion.V2V3;
}

/** Returns approval state for all known swap routers */
function useSwapApprovalStates(trade, allowedSlippage, useIsPendingApproval) {
    var chainId = useActiveWeb3React().chainId;
    var amountToApprove = React.useMemo(function () { return (trade && trade.inputAmount.currency.isToken ? trade.maximumAmountIn(allowedSlippage) : undefined); }, [trade, allowedSlippage]);
    var v2RouterAddress = chainId ? V2_ROUTER_ADDRESS[chainId] : undefined;
    var v3RouterAddress = chainId ? V3_ROUTER_ADDRESS[chainId] : undefined;
    var swapRouterAddress = chainId ? SWAP_ROUTER_ADDRESSES[chainId] : undefined;
    var v2 = useApprovalStateForSpender(amountToApprove, v2RouterAddress, useIsPendingApproval);
    var v3 = useApprovalStateForSpender(amountToApprove, v3RouterAddress, useIsPendingApproval);
    var v2V3 = useApprovalStateForSpender(amountToApprove, swapRouterAddress, useIsPendingApproval);
    return React.useMemo(function () { return ({ v2: v2, v3: v3, v2V3: v2V3 }); }, [v2, v2V3, v3]);
}
function useSwapRouterAddress(trade) {
    var chainId = useActiveWeb3React().chainId;
    return React.useMemo(function () {
        return chainId
            ? trade instanceof v2Sdk.Trade
                ? V2_ROUTER_ADDRESS[chainId]
                : trade instanceof v3Sdk.Trade
                    ? V3_ROUTER_ADDRESS[chainId]
                    : SWAP_ROUTER_ADDRESSES[chainId]
            : undefined;
    }, [chainId, trade]);
}
// wraps useApproveCallback in the context of a swap
function useSwapApproval(trade, allowedSlippage, useIsPendingApproval) {
    var amountToApprove = React.useMemo(function () { return (trade && trade.inputAmount.currency.isToken ? trade.maximumAmountIn(allowedSlippage) : undefined); }, [trade, allowedSlippage]);
    var spender = useSwapRouterAddress(trade);
    var approval = useApproval(amountToApprove, spender, useIsPendingApproval);
    if (trade instanceof v2Sdk.Trade || trade instanceof v3Sdk.Trade) {
        var approvalState = approval[0];
        invariant__default["default"](approvalState === ApprovalState.APPROVED, 'Trying to approve legacy router');
    }
    return approval;
}
function useSwapApprovalOptimizedTrade(trade, allowedSlippage, useIsPendingApproval) {
    var _a;
    var onlyV2Routes = trade === null || trade === void 0 ? void 0 : trade.routes.every(function (route) { return route.protocol === routerSdk.Protocol.V2; });
    var onlyV3Routes = trade === null || trade === void 0 ? void 0 : trade.routes.every(function (route) { return route.protocol === routerSdk.Protocol.V3; });
    var tradeHasSplits = ((_a = trade === null || trade === void 0 ? void 0 : trade.routes.length) !== null && _a !== void 0 ? _a : 0) > 1;
    var approvalStates = useSwapApprovalStates(trade, allowedSlippage, useIsPendingApproval);
    var optimizedSwapRouter = React.useMemo(function () { return getTxOptimizedSwapRouter({ onlyV2Routes: onlyV2Routes, onlyV3Routes: onlyV3Routes, tradeHasSplits: tradeHasSplits, approvalStates: approvalStates }); }, [approvalStates, tradeHasSplits, onlyV2Routes, onlyV3Routes]);
    return React.useMemo(function () {
        if (!trade)
            return undefined;
        try {
            switch (optimizedSwapRouter) {
                case SwapRouterVersion.V2V3:
                    return trade;
                case SwapRouterVersion.V2:
                    var pairs = trade.swaps[0].route.pools.filter(function (pool) { return pool instanceof v2Sdk.Pair; });
                    var v2Route = new v2Sdk.Route(pairs, trade.inputAmount.currency, trade.outputAmount.currency);
                    return new v2Sdk.Trade(v2Route, trade.inputAmount, trade.tradeType);
                case SwapRouterVersion.V3:
                    return v3Sdk.Trade.createUncheckedTradeWithMultipleRoutes({
                        routes: trade.swaps.map(function (_a) {
                            var route = _a.route, inputAmount = _a.inputAmount, outputAmount = _a.outputAmount;
                            return ({
                                route: new v3Sdk.Route(route.pools.filter(function (p) { return p instanceof v3Sdk.Pool; }), inputAmount.currency, outputAmount.currency),
                                inputAmount: inputAmount,
                                outputAmount: outputAmount,
                            });
                        }),
                        tradeType: trade.tradeType,
                    });
                default:
                    return undefined;
            }
        }
        catch (e) {
            // TODO(#2989): remove try-catch
            console.debug(e);
            return undefined;
        }
    }, [trade, optimizedSwapRouter]);
}

function useGetAndTrackApproval(getApproval) {
    var addTransaction = useTransactionAdder();
    return React.useCallback(function () {
        return getApproval().then(function (pending) {
            if (pending) {
                var response = pending.response, tokenAddress = pending.tokenAddress, spender = pending.spenderAddress;
                addTransaction(response, { type: TransactionType.APPROVAL, tokenAddress: tokenAddress, spender: spender });
            }
        });
    }, [addTransaction, getApproval]);
}
function useApprovalOptimizedTrade(trade, allowedSlippage) {
    return useSwapApprovalOptimizedTrade(trade, allowedSlippage, useHasPendingApproval);
}
function useApproveCallbackFromTrade(trade, allowedSlippage) {
    var _a = __read(useSwapApproval(trade, allowedSlippage, useHasPendingApproval), 2), approval = _a[0], getApproval = _a[1];
    return [approval, useGetAndTrackApproval(getApproval)];
}

function useIsArgentWallet() {
    var _a, _b;
    var account = useActiveWeb3React().account;
    var argentWalletDetector = useArgentWalletDetectorContract();
    var inputs = React.useMemo(function () { return [account !== null && account !== void 0 ? account : undefined]; }, [account]);
    var call = useSingleCallResult(argentWalletDetector, 'isArgentWallet', inputs, reduxMulticall.NEVER_RELOAD);
    return (_b = (_a = call === null || call === void 0 ? void 0 : call.result) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : false;
}

// combines the block timestamp with the user setting to give the deadline that should be used for any submitted transaction
function useTransactionDeadline() {
    var chainId = useActiveWeb3React().chainId;
    var ttl = useAppSelector(function (state) { return state.user.userDeadline; });
    var blockTimestamp = useCurrentBlockTimestamp();
    return React.useMemo(function () {
        if (blockTimestamp && chainId && L2_CHAIN_IDS.includes(chainId))
            return blockTimestamp.add(L2_DEADLINE_FROM_NOW);
        if (blockTimestamp && ttl)
            return blockTimestamp.add(ttl);
        return undefined;
    }, [blockTimestamp, chainId, ttl]);
}

var _a, _b, _c, _d, _e;
var PermitType;
(function (PermitType) {
    PermitType[PermitType["AMOUNT"] = 1] = "AMOUNT";
    PermitType[PermitType["ALLOWED"] = 2] = "ALLOWED";
})(PermitType || (PermitType = {}));
// 20 minutes to submit after signing
var PERMIT_VALIDITY_BUFFER = 20 * 60;
// todo: read this information from extensions on token lists or elsewhere (permit registry?)
var PERMITTABLE_TOKENS = {
    1: (_a = {},
        _a[USDC.address] = { type: PermitType.AMOUNT, name: 'USD Coin', version: '2' },
        _a[DAI.address] = { type: PermitType.ALLOWED, name: 'Dai Stablecoin', version: '1' },
        _a[UNI[1].address] = { type: PermitType.AMOUNT, name: 'Uniswap' },
        _a),
    4: (_b = {
            '0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735': { type: PermitType.ALLOWED, name: 'Dai Stablecoin', version: '1' }
        },
        _b[UNI[4].address] = { type: PermitType.AMOUNT, name: 'Uniswap' },
        _b),
    3: (_c = {},
        _c[UNI[3].address] = { type: PermitType.AMOUNT, name: 'Uniswap' },
        _c['0x07865c6E87B9F70255377e024ace6630C1Eaa37F'] = { type: PermitType.AMOUNT, name: 'USD Coin', version: '2' },
        _c),
    5: (_d = {},
        _d[UNI[5].address] = { type: PermitType.AMOUNT, name: 'Uniswap' },
        _d),
    42: (_e = {},
        _e[UNI[42].address] = { type: PermitType.AMOUNT, name: 'Uniswap' },
        _e),
};
var UseERC20PermitState;
(function (UseERC20PermitState) {
    // returned for any reason, e.g. it is an argent wallet, or the currency does not support it
    UseERC20PermitState[UseERC20PermitState["NOT_APPLICABLE"] = 0] = "NOT_APPLICABLE";
    UseERC20PermitState[UseERC20PermitState["LOADING"] = 1] = "LOADING";
    UseERC20PermitState[UseERC20PermitState["NOT_SIGNED"] = 2] = "NOT_SIGNED";
    UseERC20PermitState[UseERC20PermitState["SIGNED"] = 3] = "SIGNED";
})(UseERC20PermitState || (UseERC20PermitState = {}));
var EIP712_DOMAIN_TYPE = [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
];
var EIP712_DOMAIN_TYPE_NO_VERSION = [
    { name: 'name', type: 'string' },
    { name: 'chainId', type: 'uint256' },
    { name: 'verifyingContract', type: 'address' },
];
var EIP2612_TYPE = [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
];
var PERMIT_ALLOWED_TYPE = [
    { name: 'holder', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'expiry', type: 'uint256' },
    { name: 'allowed', type: 'bool' },
];
function useERC20Permit(currencyAmount, spender, overridePermitInfo) {
    var _a, _b;
    var _c = useActiveWeb3React(), account = _c.account, chainId = _c.chainId, library = _c.library;
    var transactionDeadline = useTransactionDeadline();
    var tokenAddress = ((_a = currencyAmount === null || currencyAmount === void 0 ? void 0 : currencyAmount.currency) === null || _a === void 0 ? void 0 : _a.isToken) ? currencyAmount.currency.address : undefined;
    var eip2612Contract = useEIP2612Contract(tokenAddress);
    var isArgentWallet = useIsArgentWallet();
    var nonceInputs = React.useMemo(function () { return [account !== null && account !== void 0 ? account : undefined]; }, [account]);
    var tokenNonceState = useSingleCallResult(eip2612Contract, 'nonces', nonceInputs);
    var permitInfo = overridePermitInfo !== null && overridePermitInfo !== void 0 ? overridePermitInfo : (chainId && tokenAddress ? (_b = PERMITTABLE_TOKENS[chainId]) === null || _b === void 0 ? void 0 : _b[tokenAddress] : undefined);
    var _d = __read(React.useState(null), 2), signatureData = _d[0], setSignatureData = _d[1];
    return React.useMemo(function () {
        var _a, _b;
        if (isArgentWallet ||
            !currencyAmount ||
            !eip2612Contract ||
            !account ||
            !chainId ||
            !transactionDeadline ||
            !library ||
            !tokenNonceState.valid ||
            !tokenAddress ||
            !spender ||
            !permitInfo) {
            return {
                state: UseERC20PermitState.NOT_APPLICABLE,
                signatureData: null,
                gatherPermitSignature: null,
            };
        }
        var nonceNumber = (_b = (_a = tokenNonceState.result) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.toNumber();
        if (tokenNonceState.loading || typeof nonceNumber !== 'number') {
            return {
                state: UseERC20PermitState.LOADING,
                signatureData: null,
                gatherPermitSignature: null,
            };
        }
        var isSignatureDataValid = signatureData &&
            signatureData.owner === account &&
            signatureData.deadline >= transactionDeadline.toNumber() &&
            signatureData.tokenAddress === tokenAddress &&
            signatureData.nonce === nonceNumber &&
            signatureData.spender === spender &&
            ('allowed' in signatureData || JSBI__default["default"].equal(JSBI__default["default"].BigInt(signatureData.amount), currencyAmount.quotient));
        return {
            state: isSignatureDataValid ? UseERC20PermitState.SIGNED : UseERC20PermitState.NOT_SIGNED,
            signatureData: isSignatureDataValid ? signatureData : null,
            gatherPermitSignature: function gatherPermitSignature() {
                return __awaiter(this, void 0, void 0, function () {
                    var allowed, signatureDeadline, value, message, domain, data;
                    return __generator(this, function (_a) {
                        allowed = permitInfo.type === PermitType.ALLOWED;
                        signatureDeadline = transactionDeadline.toNumber() + PERMIT_VALIDITY_BUFFER;
                        value = currencyAmount.quotient.toString();
                        message = allowed
                            ? {
                                holder: account,
                                spender: spender,
                                allowed: allowed,
                                nonce: nonceNumber,
                                expiry: signatureDeadline,
                            }
                            : {
                                owner: account,
                                spender: spender,
                                value: value,
                                nonce: nonceNumber,
                                deadline: signatureDeadline,
                            };
                        domain = permitInfo.version
                            ? {
                                name: permitInfo.name,
                                version: permitInfo.version,
                                verifyingContract: tokenAddress,
                                chainId: chainId,
                            }
                            : {
                                name: permitInfo.name,
                                verifyingContract: tokenAddress,
                                chainId: chainId,
                            };
                        data = JSON.stringify({
                            types: {
                                EIP712Domain: permitInfo.version ? EIP712_DOMAIN_TYPE : EIP712_DOMAIN_TYPE_NO_VERSION,
                                Permit: allowed ? PERMIT_ALLOWED_TYPE : EIP2612_TYPE,
                            },
                            domain: domain,
                            primaryType: 'Permit',
                            message: message,
                        });
                        return [2 /*return*/, library
                                .send('eth_signTypedData_v4', [account, data])
                                .then(bytes.splitSignature)
                                .then(function (signature) {
                                setSignatureData(__assign(__assign({ v: signature.v, r: signature.r, s: signature.s, deadline: signatureDeadline }, (allowed ? { allowed: allowed } : { amount: value })), { nonce: nonceNumber, chainId: chainId, owner: account, spender: spender, tokenAddress: tokenAddress, permitType: permitInfo.type }));
                            })];
                    });
                });
            },
        };
    }, [
        currencyAmount,
        eip2612Contract,
        account,
        chainId,
        isArgentWallet,
        transactionDeadline,
        library,
        tokenNonceState.loading,
        tokenNonceState.valid,
        tokenNonceState.result,
        tokenAddress,
        spender,
        permitInfo,
        signatureData,
    ]);
}
({
    version: '1',
    name: 'Uniswap V2',
    type: PermitType.AMOUNT,
});
function useERC20PermitFromTrade(trade, allowedSlippage) {
    var chainId = useActiveWeb3React().chainId;
    var swapRouterAddress = chainId
        ? // v2 router does not support
            trade instanceof v2Sdk.Trade
                ? undefined
                : trade instanceof v3Sdk.Trade
                    ? V3_ROUTER_ADDRESS[chainId]
                    : SWAP_ROUTER_ADDRESSES[chainId]
        : undefined;
    var amountToApprove = React.useMemo(function () { return (trade ? trade.maximumAmountIn(allowedSlippage) : undefined); }, [trade, allowedSlippage]);
    return useERC20Permit(amountToApprove, swapRouterAddress, null);
}

/**
 * Returns true if the input currency or output currency cannot be traded in the interface
 * @param currencyIn the input currency to check
 * @param currencyOut the output currency to check
 */
function useIsSwapUnsupported(currencyIn, currencyOut) {
    var unsupportedTokens = useUnsupportedTokens();
    return React.useMemo(function () {
        if (!unsupportedTokens) {
            return false;
        }
        var currencyInUnsupported = Boolean((currencyIn === null || currencyIn === void 0 ? void 0 : currencyIn.isToken) && unsupportedTokens[currencyIn.address]);
        var currencyOutUnsupported = Boolean((currencyOut === null || currencyOut === void 0 ? void 0 : currencyOut.isToken) && unsupportedTokens[currencyOut.address]);
        return currencyInUnsupported || currencyOutUnsupported;
    }, [currencyIn, currencyOut, unsupportedTokens]);
}

var ERC20_INTERFACE = new abi$6.Interface([
    {
        constant: false,
        inputs: [
            { name: '_spender', type: 'address' },
            { name: '_value', type: 'uint256' },
        ],
        name: 'approve',
        outputs: [{ name: '', type: 'bool' }],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
]);
function approveAmountCalldata(amount, spender) {
    if (!amount.currency.isToken)
        throw new Error('Must call with an amount of token');
    var approveData = ERC20_INTERFACE.encodeFunctionData('approve', [spender, v3Sdk.toHex(amount.quotient)]);
    return {
        to: amount.currency.address,
        data: approveData,
        value: '0x0',
    };
}

var ArgentWalletContractABI = [
	{
		inputs: [
			{
				components: [
					{
						internalType: "address",
						name: "to",
						type: "address"
					},
					{
						internalType: "uint256",
						name: "value",
						type: "uint256"
					},
					{
						internalType: "bytes",
						name: "data",
						type: "bytes"
					}
				],
				name: "_transactions",
				type: "tuple[]"
			}
		],
		name: "wc_multiCall",
		outputs: [
			{
				internalType: "bytes[]",
				name: "",
				type: "bytes[]"
			}
		],
		stateMutability: "nonpayable",
		type: "function"
	},
	{
		inputs: [
			{
				internalType: "bytes32",
				name: "_msgHash",
				type: "bytes32"
			},
			{
				internalType: "bytes",
				name: "_signature",
				type: "bytes"
			}
		],
		name: "isValidSignature",
		outputs: [
			{
				internalType: "bytes4",
				name: "",
				type: "bytes4"
			}
		],
		stateMutability: "view",
		type: "function"
	}
];

function useArgentWalletContract() {
    var account = useActiveWeb3React().account;
    var isArgentWallet = useIsArgentWallet();
    return useContract(isArgentWallet ? account !== null && account !== void 0 ? account : undefined : undefined, ArgentWalletContractABI, true);
}

var SwapCallbackState;
(function (SwapCallbackState) {
    SwapCallbackState[SwapCallbackState["INVALID"] = 0] = "INVALID";
    SwapCallbackState[SwapCallbackState["LOADING"] = 1] = "LOADING";
    SwapCallbackState[SwapCallbackState["VALID"] = 2] = "VALID";
})(SwapCallbackState || (SwapCallbackState = {}));
/**
 * Returns the swap calls that can be used to make the trade
 * @param trade trade to execute
 * @param allowedSlippage user allowed slippage
 * @param recipientAddressOrName the ENS name or address of the recipient of the swap output
 * @param signatureData the signature data of the permit of the input token amount, if available
 */
function useSwapCallArguments(trade, // trade to execute, required
allowedSlippage, // in bips
recipientAddressOrName, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
signatureData) {
    var _a = useActiveWeb3React(), account = _a.account, chainId = _a.chainId, library = _a.library;
    var recipientAddress = useENS(recipientAddressOrName).address;
    var recipient = recipientAddressOrName === null ? account : recipientAddress;
    var deadline = useTransactionDeadline();
    var routerContract = useV2RouterContract();
    var argentWalletContract = useArgentWalletContract();
    return React.useMemo(function () {
        if (!trade || !recipient || !library || !account || !chainId || !deadline)
            return [];
        if (trade instanceof v2Sdk.Trade) {
            if (!routerContract)
                return [];
            var swapMethods = [];
            swapMethods.push(v2Sdk.Router.swapCallParameters(trade, {
                feeOnTransfer: false,
                allowedSlippage: allowedSlippage,
                recipient: recipient,
                deadline: deadline.toNumber(),
            }));
            if (trade.tradeType === sdkCore.TradeType.EXACT_INPUT) {
                swapMethods.push(v2Sdk.Router.swapCallParameters(trade, {
                    feeOnTransfer: true,
                    allowedSlippage: allowedSlippage,
                    recipient: recipient,
                    deadline: deadline.toNumber(),
                }));
            }
            return swapMethods.map(function (_a) {
                var methodName = _a.methodName, args = _a.args, value = _a.value;
                if (argentWalletContract && trade.inputAmount.currency.isToken) {
                    return {
                        address: argentWalletContract.address,
                        calldata: argentWalletContract.interface.encodeFunctionData('wc_multiCall', [
                            [
                                approveAmountCalldata(trade.maximumAmountIn(allowedSlippage), routerContract.address),
                                {
                                    to: routerContract.address,
                                    value: value,
                                    data: routerContract.interface.encodeFunctionData(methodName, args),
                                },
                            ],
                        ]),
                        value: '0x0',
                    };
                }
                else {
                    return {
                        address: routerContract.address,
                        calldata: routerContract.interface.encodeFunctionData(methodName, args),
                        value: value,
                    };
                }
            });
        }
        else {
            // swap options shared by v3 and v2+v3 swap routers
            var sharedSwapOptions = __assign({ recipient: recipient, slippageTolerance: allowedSlippage }, (signatureData
                ? {
                    inputTokenPermit: 'allowed' in signatureData
                        ? {
                            expiry: signatureData.deadline,
                            nonce: signatureData.nonce,
                            s: signatureData.s,
                            r: signatureData.r,
                            v: signatureData.v,
                        }
                        : {
                            deadline: signatureData.deadline,
                            amount: signatureData.amount,
                            s: signatureData.s,
                            r: signatureData.r,
                            v: signatureData.v,
                        },
                }
                : {}));
            var swapRouterAddress = chainId
                ? trade instanceof v3Sdk.Trade
                    ? V3_ROUTER_ADDRESS[chainId]
                    : SWAP_ROUTER_ADDRESSES[chainId]
                : undefined;
            if (!swapRouterAddress)
                return [];
            var _a = trade instanceof v3Sdk.Trade
                ? v3Sdk.SwapRouter.swapCallParameters(trade, __assign(__assign({}, sharedSwapOptions), { deadline: deadline.toString() }))
                : routerSdk.SwapRouter.swapCallParameters(trade, __assign(__assign({}, sharedSwapOptions), { deadlineOrPreviousBlockhash: deadline.toString() })), value = _a.value, calldata = _a.calldata;
            if (argentWalletContract && trade.inputAmount.currency.isToken) {
                return [
                    {
                        address: argentWalletContract.address,
                        calldata: argentWalletContract.interface.encodeFunctionData('wc_multiCall', [
                            [
                                approveAmountCalldata(trade.maximumAmountIn(allowedSlippage), swapRouterAddress),
                                {
                                    to: swapRouterAddress,
                                    value: value,
                                    data: calldata,
                                },
                            ],
                        ]),
                        value: '0x0',
                    },
                ];
            }
            return [
                {
                    address: swapRouterAddress,
                    calldata: calldata,
                    value: value,
                },
            ];
        }
    }, [
        trade,
        recipient,
        library,
        account,
        chainId,
        deadline,
        routerContract,
        allowedSlippage,
        argentWalletContract,
        signatureData,
    ]);
}
/**
 * This is hacking out the revert reason from the ethers provider thrown error however it can.
 * This object seems to be undocumented by ethers.
 * @param error an error from the ethers provider
 */
function swapErrorToUserReadableMessage(error) {
    var _a, _b, _c, _d;
    var reason;
    while (Boolean(error)) {
        reason = (_b = (_a = error.reason) !== null && _a !== void 0 ? _a : error.message) !== null && _b !== void 0 ? _b : reason;
        error = (_c = error.error) !== null && _c !== void 0 ? _c : (_d = error.data) === null || _d === void 0 ? void 0 : _d.originalError;
    }
    if ((reason === null || reason === void 0 ? void 0 : reason.indexOf('execution reverted: ')) === 0)
        reason = reason.substr('execution reverted: '.length);
    switch (reason) {
        case 'UniswapV2Router: EXPIRED':
            return (jsxRuntime.jsx(macro.Trans, { children: "The transaction could not be sent because the deadline has passed. Please check that your transaction deadline is not too low." }, void 0));
        case 'UniswapV2Router: INSUFFICIENT_OUTPUT_AMOUNT':
        case 'UniswapV2Router: EXCESSIVE_INPUT_AMOUNT':
            return (jsxRuntime.jsx(macro.Trans, { children: "This transaction will not succeed either due to price movement or fee on transfer. Try increasing your slippage tolerance." }, void 0));
        case 'TransferHelper: TRANSFER_FROM_FAILED':
            return jsxRuntime.jsx(macro.Trans, { children: "The input token cannot be transferred. There may be an issue with the input token." }, void 0);
        case 'UniswapV2: TRANSFER_FAILED':
            return jsxRuntime.jsx(macro.Trans, { children: "The output token cannot be transferred. There may be an issue with the output token." }, void 0);
        case 'UniswapV2: K':
            return (jsxRuntime.jsx(macro.Trans, { children: "The Uniswap invariant x*y=k was not satisfied by the swap. This usually means one of the tokens you are swapping incorporates custom behavior on transfer." }, void 0));
        case 'Too little received':
        case 'Too much requested':
        case 'STF':
            return (jsxRuntime.jsx(macro.Trans, { children: "This transaction will not succeed due to price movement. Try increasing your slippage tolerance. Note: fee on transfer and rebase tokens are incompatible with Uniswap V3." }, void 0));
        case 'TF':
            return (jsxRuntime.jsx(macro.Trans, { children: "The output token cannot be transferred. There may be an issue with the output token. Note: fee on transfer and rebase tokens are incompatible with Uniswap V3." }, void 0));
        default:
            if ((reason === null || reason === void 0 ? void 0 : reason.indexOf('undefined is not an object')) !== -1) {
                console.error(error, reason);
                return (jsxRuntime.jsx(macro.Trans, { children: "An error occurred when trying to execute this swap. You may need to increase your slippage tolerance. If that does not work, there may be an incompatibility with the token you are trading. Note: fee on transfer and rebase tokens are incompatible with Uniswap V3." }, void 0));
            }
            return (jsxRuntime.jsxs(macro.Trans, { children: ["Unknown error", reason ? ": \"" + reason + "\"" : '', ". Try increasing your slippage tolerance. Note: fee on transfer and rebase tokens are incompatible with Uniswap V3."] }, void 0));
    }
}
// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
function useSwapCallback(trade, // trade to execute, required
allowedSlippage, // in bips
recipientAddressOrName, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
signatureData) {
    var _a = useActiveWeb3React(), account = _a.account, chainId = _a.chainId, library = _a.library;
    var swapCalls = useSwapCallArguments(trade, allowedSlippage, recipientAddressOrName, signatureData);
    var addTransaction = useTransactionAdder();
    var recipientAddress = useENS(recipientAddressOrName).address;
    var recipient = recipientAddressOrName === null ? account : recipientAddress;
    return React.useMemo(function () {
        if (!trade || !library || !account || !chainId) {
            return { state: SwapCallbackState.INVALID, callback: null, error: jsxRuntime.jsx(macro.Trans, { children: "Missing dependencies" }, void 0) };
        }
        if (!recipient) {
            if (recipientAddressOrName !== null) {
                return { state: SwapCallbackState.INVALID, callback: null, error: jsxRuntime.jsx(macro.Trans, { children: "Invalid recipient" }, void 0) };
            }
            else {
                return { state: SwapCallbackState.LOADING, callback: null, error: null };
            }
        }
        return {
            state: SwapCallbackState.VALID,
            callback: function onSwap() {
                return __awaiter(this, void 0, void 0, function () {
                    var estimatedCalls, bestCallOption, errorCalls, firstNoErrorCall, _a, address, calldata, value;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0: return [4 /*yield*/, Promise.all(swapCalls.map(function (call) {
                                    var address = call.address, calldata = call.calldata, value = call.value;
                                    var tx = !value || isZero(value)
                                        ? { from: account, to: address, data: calldata }
                                        : {
                                            from: account,
                                            to: address,
                                            data: calldata,
                                            value: value,
                                        };
                                    return library
                                        .estimateGas(tx)
                                        .then(function (gasEstimate) {
                                        return {
                                            call: call,
                                            gasEstimate: gasEstimate,
                                        };
                                    })
                                        .catch(function (gasError) {
                                        console.debug('Gas estimate failed, trying eth_call to extract error', call);
                                        return library
                                            .call(tx)
                                            .then(function (result) {
                                            console.debug('Unexpected successful call after failed estimate gas', call, gasError, result);
                                            return { call: call, error: jsxRuntime.jsx(macro.Trans, { children: "Unexpected issue with estimating the gas. Please try again." }, void 0) };
                                        })
                                            .catch(function (callError) {
                                            console.debug('Call threw error', call, callError);
                                            return { call: call, error: swapErrorToUserReadableMessage(callError) };
                                        });
                                    });
                                }))
                                // a successful estimation is a bignumber gas estimate and the next call is also a bignumber gas estimate
                            ];
                            case 1:
                                estimatedCalls = _b.sent();
                                bestCallOption = estimatedCalls.find(function (el, ix, list) {
                                    return 'gasEstimate' in el && (ix === list.length - 1 || 'gasEstimate' in list[ix + 1]);
                                });
                                // check if any calls errored with a recognizable error
                                if (!bestCallOption) {
                                    errorCalls = estimatedCalls.filter(function (call) { return 'error' in call; });
                                    if (errorCalls.length > 0)
                                        throw errorCalls[errorCalls.length - 1].error;
                                    firstNoErrorCall = estimatedCalls.find(function (call) { return !('error' in call); });
                                    if (!firstNoErrorCall)
                                        throw new Error(macro.t(templateObject_1$2 || (templateObject_1$2 = __makeTemplateObject(["Unexpected error. Could not estimate gas for the swap."], ["Unexpected error. Could not estimate gas for the swap."]))));
                                    bestCallOption = firstNoErrorCall;
                                }
                                _a = bestCallOption.call, address = _a.address, calldata = _a.calldata, value = _a.value;
                                return [2 /*return*/, library
                                        .getSigner()
                                        .sendTransaction(__assign(__assign({ from: account, to: address, data: calldata }, ('gasEstimate' in bestCallOption ? { gasLimit: calculateGasMargin(bestCallOption.gasEstimate) } : {})), (value && !isZero(value) ? { value: value } : {})))
                                        .then(function (response) {
                                        addTransaction(response, trade.tradeType === sdkCore.TradeType.EXACT_INPUT
                                            ? {
                                                type: TransactionType.SWAP,
                                                tradeType: sdkCore.TradeType.EXACT_INPUT,
                                                inputCurrencyId: currencyId(trade.inputAmount.currency),
                                                inputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
                                                expectedOutputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
                                                outputCurrencyId: currencyId(trade.outputAmount.currency),
                                                minimumOutputCurrencyAmountRaw: trade.minimumAmountOut(allowedSlippage).quotient.toString(),
                                            }
                                            : {
                                                type: TransactionType.SWAP,
                                                tradeType: sdkCore.TradeType.EXACT_OUTPUT,
                                                inputCurrencyId: currencyId(trade.inputAmount.currency),
                                                maximumInputCurrencyAmountRaw: trade.maximumAmountIn(allowedSlippage).quotient.toString(),
                                                outputCurrencyId: currencyId(trade.outputAmount.currency),
                                                outputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
                                                expectedInputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
                                            });
                                        return response.hash;
                                    })
                                        .catch(function (error) {
                                        // if the user rejected the tx, pass this along
                                        if ((error === null || error === void 0 ? void 0 : error.code) === 4001) {
                                            throw new Error(macro.t(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Transaction rejected."], ["Transaction rejected."]))));
                                        }
                                        else {
                                            // otherwise, the error was unexpected and we need to convey that
                                            console.error("Swap failed", error, address, calldata, value);
                                            throw new Error(macro.t(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Swap failed: ", ""], ["Swap failed: ", ""])), swapErrorToUserReadableMessage(error)));
                                        }
                                    })];
                        }
                    });
                });
            },
            error: null,
        };
    }, [trade, library, account, chainId, recipient, recipientAddressOrName, swapCalls, addTransaction, allowedSlippage]);
}
var templateObject_1$2, templateObject_2, templateObject_3;

var WrapType;
(function (WrapType) {
    WrapType[WrapType["NOT_APPLICABLE"] = 0] = "NOT_APPLICABLE";
    WrapType[WrapType["WRAP"] = 1] = "WRAP";
    WrapType[WrapType["UNWRAP"] = 2] = "UNWRAP";
})(WrapType || (WrapType = {}));
var NOT_APPLICABLE = { wrapType: WrapType.NOT_APPLICABLE };
var WrapInputError;
(function (WrapInputError) {
    WrapInputError[WrapInputError["NO_ERROR"] = 0] = "NO_ERROR";
    WrapInputError[WrapInputError["ENTER_NATIVE_AMOUNT"] = 1] = "ENTER_NATIVE_AMOUNT";
    WrapInputError[WrapInputError["ENTER_WRAPPED_AMOUNT"] = 2] = "ENTER_WRAPPED_AMOUNT";
    WrapInputError[WrapInputError["INSUFFICIENT_NATIVE_BALANCE"] = 3] = "INSUFFICIENT_NATIVE_BALANCE";
    WrapInputError[WrapInputError["INSUFFICIENT_WRAPPED_BALANCE"] = 4] = "INSUFFICIENT_WRAPPED_BALANCE";
})(WrapInputError || (WrapInputError = {}));
function WrapErrorText(_a) {
    var wrapInputError = _a.wrapInputError;
    var native = useNativeCurrency();
    var wrapped = native === null || native === void 0 ? void 0 : native.wrapped;
    switch (wrapInputError) {
        case WrapInputError.NO_ERROR:
            return null;
        case WrapInputError.ENTER_NATIVE_AMOUNT:
            return jsxRuntime.jsxs(macro.Trans, { children: ["Enter ", native === null || native === void 0 ? void 0 : native.symbol, " amount"] }, void 0);
        case WrapInputError.ENTER_WRAPPED_AMOUNT:
            return jsxRuntime.jsxs(macro.Trans, { children: ["Enter ", wrapped === null || wrapped === void 0 ? void 0 : wrapped.symbol, " amount"] }, void 0);
        case WrapInputError.INSUFFICIENT_NATIVE_BALANCE:
            return jsxRuntime.jsxs(macro.Trans, { children: ["Insufficient ", native === null || native === void 0 ? void 0 : native.symbol, " balance"] }, void 0);
        case WrapInputError.INSUFFICIENT_WRAPPED_BALANCE:
            return jsxRuntime.jsxs(macro.Trans, { children: ["Insufficient ", wrapped === null || wrapped === void 0 ? void 0 : wrapped.symbol, " balance"] }, void 0);
    }
}
/**
 * Given the selected input and output currency, return a wrap callback
 * @param inputCurrency the selected input currency
 * @param outputCurrency the selected output currency
 * @param typedValue the user input value
 */
function useWrapCallback(inputCurrency, outputCurrency, typedValue) {
    var _this = this;
    var _a = useActiveWeb3React(), chainId = _a.chainId, account = _a.account;
    var wethContract = useWETHContract();
    var balance = useCurrencyBalance(account !== null && account !== void 0 ? account : undefined, inputCurrency !== null && inputCurrency !== void 0 ? inputCurrency : undefined);
    // we can always parse the amount typed as the input currency, since wrapping is 1:1
    var inputAmount = React.useMemo(function () { return tryParseCurrencyAmount(typedValue, inputCurrency !== null && inputCurrency !== void 0 ? inputCurrency : undefined); }, [inputCurrency, typedValue]);
    var addTransaction = useTransactionAdder();
    return React.useMemo(function () {
        if (!wethContract || !chainId || !inputCurrency || !outputCurrency)
            return NOT_APPLICABLE;
        var weth = WRAPPED_NATIVE_CURRENCY[chainId];
        if (!weth)
            return NOT_APPLICABLE;
        var hasInputAmount = Boolean(inputAmount === null || inputAmount === void 0 ? void 0 : inputAmount.greaterThan('0'));
        var sufficientBalance = inputAmount && balance && !balance.lessThan(inputAmount);
        if (inputCurrency.isNative && weth.equals(outputCurrency)) {
            return {
                wrapType: WrapType.WRAP,
                execute: sufficientBalance && inputAmount
                    ? function () { return __awaiter(_this, void 0, void 0, function () {
                        var txReceipt, error_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, wethContract.deposit({ value: "0x" + inputAmount.quotient.toString(16) })];
                                case 1:
                                    txReceipt = _a.sent();
                                    addTransaction(txReceipt, {
                                        type: TransactionType.WRAP,
                                        unwrapped: false,
                                        currencyAmountRaw: inputAmount === null || inputAmount === void 0 ? void 0 : inputAmount.quotient.toString(),
                                        chainId: chainId,
                                    });
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_1 = _a.sent();
                                    console.error('Could not deposit', error_1);
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); }
                    : undefined,
                inputError: sufficientBalance
                    ? undefined
                    : hasInputAmount
                        ? WrapInputError.INSUFFICIENT_NATIVE_BALANCE
                        : WrapInputError.ENTER_NATIVE_AMOUNT,
            };
        }
        else if (weth.equals(inputCurrency) && outputCurrency.isNative) {
            return {
                wrapType: WrapType.UNWRAP,
                execute: sufficientBalance && inputAmount
                    ? function () { return __awaiter(_this, void 0, void 0, function () {
                        var txReceipt, error_2;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, wethContract.withdraw("0x" + inputAmount.quotient.toString(16))];
                                case 1:
                                    txReceipt = _a.sent();
                                    addTransaction(txReceipt, {
                                        type: TransactionType.WRAP,
                                        unwrapped: true,
                                        currencyAmountRaw: inputAmount === null || inputAmount === void 0 ? void 0 : inputAmount.quotient.toString(),
                                        chainId: chainId,
                                    });
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_2 = _a.sent();
                                    console.error('Could not withdraw', error_2);
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); }
                    : undefined,
                inputError: sufficientBalance
                    ? undefined
                    : hasInputAmount
                        ? WrapInputError.INSUFFICIENT_WRAPPED_BALANCE
                        : WrapInputError.ENTER_WRAPPED_AMOUNT,
            };
        }
        else {
            return NOT_APPLICABLE;
        }
    }, [wethContract, chainId, inputCurrency, outputCurrency, inputAmount, balance, addTransaction]);
}

var MIN_NATIVE_CURRENCY_FOR_GAS = JSBI__default["default"].exponentiate(JSBI__default["default"].BigInt(10), JSBI__default["default"].BigInt(16)); // .01 ETH
/**
 * Given some token amount, return the max that can be spent of it
 * @param currencyAmount to return max of
 */
function maxAmountSpend(currencyAmount) {
    if (!currencyAmount)
        return undefined;
    if (currencyAmount.currency.isNative) {
        if (JSBI__default["default"].greaterThan(currencyAmount.quotient, MIN_NATIVE_CURRENCY_FOR_GAS)) {
            return sdkCore.CurrencyAmount.fromRawAmount(currencyAmount.currency, JSBI__default["default"].subtract(currencyAmount.quotient, MIN_NATIVE_CURRENCY_FOR_GAS));
        }
        else {
            return sdkCore.CurrencyAmount.fromRawAmount(currencyAmount.currency, JSBI__default["default"].BigInt(0));
        }
    }
    return currencyAmount;
}

var BodyWrapper = styled__default["default"].main(templateObject_1$1 || (templateObject_1$1 = __makeTemplateObject(["\n  position: relative;\n  margin-top: ", ";\n  max-width: ", ";\n  width: 100%;\n  background: ", ";\n  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),\n    0px 24px 32px rgba(0, 0, 0, 0.01);\n  border-radius: 24px;\n  margin-top: 1rem;\n  margin-left: auto;\n  margin-right: auto;\n  z-index: ", ";\n"], ["\n  position: relative;\n  margin-top: ", ";\n  max-width: ", ";\n  width: 100%;\n  background: ", ";\n  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),\n    0px 24px 32px rgba(0, 0, 0, 0.01);\n  border-radius: 24px;\n  margin-top: 1rem;\n  margin-left: auto;\n  margin-right: auto;\n  z-index: ", ";\n"
    /**
     * The styled container element that wraps the content of most pages and the tabs.
     */
])), function (_a) {
    var margin = _a.margin;
    return margin !== null && margin !== void 0 ? margin : '0px';
}, function (_a) {
    var maxWidth = _a.maxWidth;
    return maxWidth !== null && maxWidth !== void 0 ? maxWidth : '480px';
}, function (_a) {
    var theme = _a.theme;
    return theme.bg0;
}, Z_INDEX.deprecated_content);
/**
 * The styled container element that wraps the content of most pages and the tabs.
 */
function AppBody(_a) {
    var children = _a.children, rest = __rest(_a, ["children"]);
    return jsxRuntime.jsx(BodyWrapper, __assign({}, rest, { children: children }), void 0);
}
var templateObject_1$1;

var AlertWrapper = styled__default["default"].div(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  max-width: 460px;\n  width: 100%;\n"], ["\n  max-width: 460px;\n  width: 100%;\n"])));
function Swap(_a) {
    var _this = this;
    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    var history = _a.history;
    var account = useActiveWeb3React().account;
    var loadedUrlParams = useDefaultsFromURLSearch();
    // token warning stuff
    var _m = __read([
        useCurrency(loadedUrlParams === null || loadedUrlParams === void 0 ? void 0 : loadedUrlParams.inputCurrencyId),
        useCurrency(loadedUrlParams === null || loadedUrlParams === void 0 ? void 0 : loadedUrlParams.outputCurrencyId),
    ], 2), loadedInputCurrency = _m[0], loadedOutputCurrency = _m[1];
    var _o = __read(React.useState(false), 2), dismissTokenWarning = _o[0], setDismissTokenWarning = _o[1];
    var urlLoadedTokens = React.useMemo(function () { var _a, _b; return (_b = (_a = [loadedInputCurrency, loadedOutputCurrency]) === null || _a === void 0 ? void 0 : _a.filter(function (c) { var _a; return (_a = c === null || c === void 0 ? void 0 : c.isToken) !== null && _a !== void 0 ? _a : false; })) !== null && _b !== void 0 ? _b : []; }, [loadedInputCurrency, loadedOutputCurrency]);
    var handleConfirmTokenWarning = React.useCallback(function () {
        setDismissTokenWarning(true);
    }, []);
    // dismiss warning if all imported tokens are in active lists
    var defaultTokens = useAllTokens();
    var importTokensNotInDefault = React.useMemo(function () {
        return urlLoadedTokens &&
            urlLoadedTokens.filter(function (token) {
                return !Boolean(token.address in defaultTokens);
            });
    }, [defaultTokens, urlLoadedTokens]);
    var theme = React.useContext(styled.ThemeContext);
    // toggle wallet when disconnected
    var toggleWalletModal = useWalletModalToggle();
    // for expert mode
    var _p = __read(useExpertModeManager(), 1), isExpertMode = _p[0];
    // swap state
    var _q = useSwapState(), independentField = _q.independentField, typedValue = _q.typedValue, recipient = _q.recipient;
    var _r = useDerivedSwapInfo(), _s = _r.trade, tradeState = _s.state, trade = _s.trade, allowedSlippage = _r.allowedSlippage, currencyBalances = _r.currencyBalances, parsedAmount = _r.parsedAmount, currencies = _r.currencies, swapInputError = _r.inputError;
    var _t = useWrapCallback(currencies[Field.INPUT], currencies[Field.OUTPUT], typedValue), wrapType = _t.wrapType, onWrap = _t.execute, wrapInputError = _t.inputError;
    var showWrap = wrapType !== WrapType.NOT_APPLICABLE;
    var recipientAddress = useENSAddress(recipient).address;
    var parsedAmounts = React.useMemo(function () {
        var _a, _b;
        return showWrap
            ? (_a = {},
                _a[Field.INPUT] = parsedAmount,
                _a[Field.OUTPUT] = parsedAmount,
                _a) : (_b = {},
            _b[Field.INPUT] = independentField === Field.INPUT ? parsedAmount : trade === null || trade === void 0 ? void 0 : trade.inputAmount,
            _b[Field.OUTPUT] = independentField === Field.OUTPUT ? parsedAmount : trade === null || trade === void 0 ? void 0 : trade.outputAmount,
            _b);
    }, [independentField, parsedAmount, showWrap, trade]);
    var _u = __read(React.useMemo(function () { return [!(trade === null || trade === void 0 ? void 0 : trade.swaps), TradeState.LOADING === tradeState, TradeState.SYNCING === tradeState]; }, [trade, tradeState]), 3), routeNotFound = _u[0], routeIsLoading = _u[1], routeIsSyncing = _u[2];
    var fiatValueInput = useUSDCValue(parsedAmounts[Field.INPUT]);
    var fiatValueOutput = useUSDCValue(parsedAmounts[Field.OUTPUT]);
    var priceImpact = React.useMemo(function () { return (routeIsSyncing ? undefined : computeFiatValuePriceImpact(fiatValueInput, fiatValueOutput)); }, [fiatValueInput, fiatValueOutput, routeIsSyncing]);
    var _v = useSwapActionHandlers(), onSwitchTokens = _v.onSwitchTokens, onCurrencySelection = _v.onCurrencySelection, onUserInput = _v.onUserInput, onChangeRecipient = _v.onChangeRecipient;
    var isValid = !swapInputError;
    var dependentField = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT;
    var handleTypeInput = React.useCallback(function (value) {
        onUserInput(Field.INPUT, value);
    }, [onUserInput]);
    var handleTypeOutput = React.useCallback(function (value) {
        onUserInput(Field.OUTPUT, value);
    }, [onUserInput]);
    // reset if they close warning without tokens in params
    var handleDismissTokenWarning = React.useCallback(function () {
        setDismissTokenWarning(true);
        history.push('/swap/');
    }, [history]);
    // modal and loading
    var _w = __read(React.useState({
        showConfirm: false,
        tradeToConfirm: undefined,
        attemptingTxn: false,
        swapErrorMessage: undefined,
        txHash: undefined,
    }), 2), _x = _w[0], showConfirm = _x.showConfirm, tradeToConfirm = _x.tradeToConfirm, swapErrorMessage = _x.swapErrorMessage, attemptingTxn = _x.attemptingTxn, txHash = _x.txHash, setSwapState = _w[1];
    var formattedAmounts = React.useMemo(function () {
        var _a;
        var _b, _c, _d, _e;
        return (_a = {},
            _a[independentField] = typedValue,
            _a[dependentField] = showWrap
                ? (_c = (_b = parsedAmounts[independentField]) === null || _b === void 0 ? void 0 : _b.toExact()) !== null && _c !== void 0 ? _c : ''
                : (_e = (_d = parsedAmounts[dependentField]) === null || _d === void 0 ? void 0 : _d.toSignificant(6)) !== null && _e !== void 0 ? _e : '',
            _a);
    }, [dependentField, independentField, parsedAmounts, showWrap, typedValue]);
    var userHasSpecifiedInputOutput = Boolean(currencies[Field.INPUT] && currencies[Field.OUTPUT] && ((_b = parsedAmounts[independentField]) === null || _b === void 0 ? void 0 : _b.greaterThan(JSBI__default["default"].BigInt(0))));
    var approvalOptimizedTrade = useApprovalOptimizedTrade(trade, allowedSlippage);
    var approvalOptimizedTradeString = approvalOptimizedTrade instanceof v2Sdk.Trade
        ? 'V2SwapRouter'
        : approvalOptimizedTrade instanceof v3Sdk.Trade
            ? 'V3SwapRouter'
            : 'SwapRouter';
    // check whether the user has approved the router on the input token
    var _y = __read(useApproveCallbackFromTrade(approvalOptimizedTrade, allowedSlippage), 2), approvalState = _y[0], approveCallback = _y[1];
    var _z = useERC20PermitFromTrade(approvalOptimizedTrade, allowedSlippage), signatureState = _z.state, signatureData = _z.signatureData, gatherPermitSignature = _z.gatherPermitSignature;
    var handleApprove = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(signatureState === UseERC20PermitState.NOT_SIGNED && gatherPermitSignature)) return [3 /*break*/, 7];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 6]);
                    return [4 /*yield*/, gatherPermitSignature()];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 6];
                case 3:
                    error_1 = _b.sent();
                    if (!((error_1 === null || error_1 === void 0 ? void 0 : error_1.code) !== 4001)) return [3 /*break*/, 5];
                    return [4 /*yield*/, approveCallback()];
                case 4:
                    _b.sent();
                    _b.label = 5;
                case 5: return [3 /*break*/, 6];
                case 6: return [3 /*break*/, 9];
                case 7: return [4 /*yield*/, approveCallback()];
                case 8:
                    _b.sent();
                    ReactGA__default["default"].event({
                        category: 'Swap',
                        action: 'Approve',
                        label: [approvalOptimizedTradeString, (_a = approvalOptimizedTrade === null || approvalOptimizedTrade === void 0 ? void 0 : approvalOptimizedTrade.inputAmount) === null || _a === void 0 ? void 0 : _a.currency.symbol].join('/'),
                    });
                    _b.label = 9;
                case 9: return [2 /*return*/];
            }
        });
    }); }, [
        signatureState,
        gatherPermitSignature,
        approveCallback,
        approvalOptimizedTradeString,
        (_c = approvalOptimizedTrade === null || approvalOptimizedTrade === void 0 ? void 0 : approvalOptimizedTrade.inputAmount) === null || _c === void 0 ? void 0 : _c.currency.symbol,
    ]);
    // check if user has gone through approval process, used to show two step buttons, reset on token change
    var _0 = __read(React.useState(false), 2), approvalSubmitted = _0[0], setApprovalSubmitted = _0[1];
    // mark when a user has submitted an approval, reset onTokenSelection for input field
    React.useEffect(function () {
        if (approvalState === ApprovalState.PENDING) {
            setApprovalSubmitted(true);
        }
    }, [approvalState, approvalSubmitted]);
    var maxInputAmount = React.useMemo(function () { return maxAmountSpend(currencyBalances[Field.INPUT]); }, [currencyBalances]);
    var showMaxButton = Boolean((maxInputAmount === null || maxInputAmount === void 0 ? void 0 : maxInputAmount.greaterThan(0)) && !((_d = parsedAmounts[Field.INPUT]) === null || _d === void 0 ? void 0 : _d.equalTo(maxInputAmount)));
    // the callback to execute the swap
    var _1 = useSwapCallback(approvalOptimizedTrade, allowedSlippage, recipient, signatureData), swapCallback = _1.callback, swapCallbackError = _1.error;
    var handleSwap = React.useCallback(function () {
        if (!swapCallback) {
            return;
        }
        if (priceImpact && !confirmPriceImpactWithoutFee(priceImpact)) {
            return;
        }
        setSwapState({ attemptingTxn: true, tradeToConfirm: tradeToConfirm, showConfirm: showConfirm, swapErrorMessage: undefined, txHash: undefined });
        swapCallback()
            .then(function (hash) {
            var _a, _b, _c, _d;
            setSwapState({ attemptingTxn: false, tradeToConfirm: tradeToConfirm, showConfirm: showConfirm, swapErrorMessage: undefined, txHash: hash });
            ReactGA__default["default"].event({
                category: 'Swap',
                action: recipient === null
                    ? 'Swap w/o Send'
                    : (recipientAddress !== null && recipientAddress !== void 0 ? recipientAddress : recipient) === account
                        ? 'Swap w/o Send + recipient'
                        : 'Swap w/ Send',
                label: [
                    approvalOptimizedTradeString,
                    (_b = (_a = approvalOptimizedTrade === null || approvalOptimizedTrade === void 0 ? void 0 : approvalOptimizedTrade.inputAmount) === null || _a === void 0 ? void 0 : _a.currency) === null || _b === void 0 ? void 0 : _b.symbol,
                    (_d = (_c = approvalOptimizedTrade === null || approvalOptimizedTrade === void 0 ? void 0 : approvalOptimizedTrade.outputAmount) === null || _c === void 0 ? void 0 : _c.currency) === null || _d === void 0 ? void 0 : _d.symbol,
                    'MH',
                ].join('/'),
            });
        })
            .catch(function (error) {
            setSwapState({
                attemptingTxn: false,
                tradeToConfirm: tradeToConfirm,
                showConfirm: showConfirm,
                swapErrorMessage: error.message,
                txHash: undefined,
            });
        });
    }, [
        swapCallback,
        priceImpact,
        tradeToConfirm,
        showConfirm,
        recipient,
        recipientAddress,
        account,
        approvalOptimizedTradeString,
        (_f = (_e = approvalOptimizedTrade === null || approvalOptimizedTrade === void 0 ? void 0 : approvalOptimizedTrade.inputAmount) === null || _e === void 0 ? void 0 : _e.currency) === null || _f === void 0 ? void 0 : _f.symbol,
        (_h = (_g = approvalOptimizedTrade === null || approvalOptimizedTrade === void 0 ? void 0 : approvalOptimizedTrade.outputAmount) === null || _g === void 0 ? void 0 : _g.currency) === null || _h === void 0 ? void 0 : _h.symbol,
    ]);
    // errors
    var _2 = __read(React.useState(false), 2), showInverted = _2[0], setShowInverted = _2[1];
    // warnings on the greater of fiat value price impact and execution price impact
    var priceImpactSeverity = React.useMemo(function () {
        var executionPriceImpact = trade === null || trade === void 0 ? void 0 : trade.priceImpact;
        return warningSeverity(executionPriceImpact && priceImpact
            ? executionPriceImpact.greaterThan(priceImpact)
                ? executionPriceImpact
                : priceImpact
            : executionPriceImpact !== null && executionPriceImpact !== void 0 ? executionPriceImpact : priceImpact);
    }, [priceImpact, trade]);
    var isArgentWallet = useIsArgentWallet();
    // show approve flow when: no error on inputs, not approved or pending, or approved in current session
    // never show if price impact is above threshold in non expert mode
    var showApproveFlow = !isArgentWallet &&
        !swapInputError &&
        (approvalState === ApprovalState.NOT_APPROVED ||
            approvalState === ApprovalState.PENDING ||
            (approvalSubmitted && approvalState === ApprovalState.APPROVED)) &&
        !(priceImpactSeverity > 3 && !isExpertMode);
    var handleConfirmDismiss = React.useCallback(function () {
        setSwapState({ showConfirm: false, tradeToConfirm: tradeToConfirm, attemptingTxn: attemptingTxn, swapErrorMessage: swapErrorMessage, txHash: txHash });
        // if there was a tx hash, we want to clear the input
        if (txHash) {
            onUserInput(Field.INPUT, '');
        }
    }, [attemptingTxn, onUserInput, swapErrorMessage, tradeToConfirm, txHash]);
    var handleAcceptChanges = React.useCallback(function () {
        setSwapState({ tradeToConfirm: trade, swapErrorMessage: swapErrorMessage, txHash: txHash, attemptingTxn: attemptingTxn, showConfirm: showConfirm });
    }, [attemptingTxn, showConfirm, swapErrorMessage, trade, txHash]);
    var handleInputSelect = React.useCallback(function (inputCurrency) {
        setApprovalSubmitted(false); // reset 2 step UI for approvals
        onCurrencySelection(Field.INPUT, inputCurrency);
    }, [onCurrencySelection]);
    var handleMaxInput = React.useCallback(function () {
        maxInputAmount && onUserInput(Field.INPUT, maxInputAmount.toExact());
        ReactGA__default["default"].event({
            category: 'Swap',
            action: 'Max',
        });
    }, [maxInputAmount, onUserInput]);
    var handleOutputSelect = React.useCallback(function (outputCurrency) { return onCurrencySelection(Field.OUTPUT, outputCurrency); }, [onCurrencySelection]);
    var swapIsUnsupported = useIsSwapUnsupported(currencies[Field.INPUT], currencies[Field.OUTPUT]);
    var priceImpactTooHigh = priceImpactSeverity > 3 && !isExpertMode;
    return (jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [jsxRuntime.jsx(TokenWarningModal, { isOpen: importTokensNotInDefault.length > 0 && !dismissTokenWarning, tokens: importTokensNotInDefault, onConfirm: handleConfirmTokenWarning, onDismiss: handleDismissTokenWarning }, void 0), jsxRuntime.jsxs(AppBody, { children: [jsxRuntime.jsx(SwapHeader, { allowedSlippage: allowedSlippage }, void 0), jsxRuntime.jsxs(Wrapper$d, __assign({ id: "swap-page" }, { children: [jsxRuntime.jsx(ConfirmSwapModal, { isOpen: showConfirm, trade: trade, originalTrade: tradeToConfirm, onAcceptChanges: handleAcceptChanges, attemptingTxn: attemptingTxn, txHash: txHash, recipient: recipient, allowedSlippage: allowedSlippage, onConfirm: handleSwap, swapErrorMessage: swapErrorMessage, onDismiss: handleConfirmDismiss }, void 0), jsxRuntime.jsxs(AutoColumn, __assign({ gap: 'sm' }, { children: [jsxRuntime.jsxs("div", __assign({ style: { display: 'relative' } }, { children: [jsxRuntime.jsx(CurrencyInputPanel, { label: independentField === Field.OUTPUT && !showWrap ? jsxRuntime.jsx(macro.Trans, { children: "From (at most)" }, void 0) : jsxRuntime.jsx(macro.Trans, { children: "From" }, void 0), value: formattedAmounts[Field.INPUT], showMaxButton: showMaxButton, currency: currencies[Field.INPUT], onUserInput: handleTypeInput, onMax: handleMaxInput, fiatValue: fiatValueInput !== null && fiatValueInput !== void 0 ? fiatValueInput : undefined, onCurrencySelect: handleInputSelect, otherCurrency: currencies[Field.OUTPUT], showCommonBases: true, id: "swap-currency-input", loading: independentField === Field.OUTPUT && routeIsSyncing }, void 0), jsxRuntime.jsx(ArrowWrapper$1, __assign({ clickable: true }, { children: jsxRuntime.jsx(reactFeather.ArrowDown, { size: "16", onClick: function () {
                                                        setApprovalSubmitted(false); // reset 2 step UI for approvals
                                                        onSwitchTokens();
                                                    }, color: currencies[Field.INPUT] && currencies[Field.OUTPUT] ? theme.text1 : theme.text3 }, void 0) }), void 0), jsxRuntime.jsx(CurrencyInputPanel, { value: formattedAmounts[Field.OUTPUT], onUserInput: handleTypeOutput, label: independentField === Field.INPUT && !showWrap ? jsxRuntime.jsx(macro.Trans, { children: "To (at least)" }, void 0) : jsxRuntime.jsx(macro.Trans, { children: "To" }, void 0), showMaxButton: false, hideBalance: false, fiatValue: fiatValueOutput !== null && fiatValueOutput !== void 0 ? fiatValueOutput : undefined, priceImpact: priceImpact, currency: currencies[Field.OUTPUT], onCurrencySelect: handleOutputSelect, otherCurrency: currencies[Field.INPUT], showCommonBases: true, id: "swap-currency-output", loading: independentField === Field.INPUT && routeIsSyncing }, void 0)] }), void 0), recipient !== null && !showWrap ? (jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [jsxRuntime.jsxs(AutoRow, __assign({ justify: "space-between", style: { padding: '0 1rem' } }, { children: [jsxRuntime.jsx(ArrowWrapper$1, __assign({ clickable: false }, { children: jsxRuntime.jsx(reactFeather.ArrowDown, { size: "16", color: theme.text2 }, void 0) }), void 0), jsxRuntime.jsx(LinkStyledButton, __assign({ id: "remove-recipient-button", onClick: function () { return onChangeRecipient(null); } }, { children: jsxRuntime.jsx(macro.Trans, { children: "- Remove recipient" }, void 0) }), void 0)] }), void 0), jsxRuntime.jsx(AddressInputPanel, { id: "recipient", value: recipient, onChange: onChangeRecipient }, void 0)] }, void 0)) : null, !showWrap && userHasSpecifiedInputOutput && (trade || routeIsLoading || routeIsSyncing) && (jsxRuntime.jsx(SwapDetailsDropdown, { trade: trade, syncing: routeIsSyncing, loading: routeIsLoading, showInverted: showInverted, setShowInverted: setShowInverted, allowedSlippage: allowedSlippage }, void 0)), jsxRuntime.jsxs("div", { children: [swapIsUnsupported ? (jsxRuntime.jsx(ButtonPrimary, __assign({ disabled: true }, { children: jsxRuntime.jsx(ThemedText.Main, __assign({ mb: "4px" }, { children: jsxRuntime.jsx(macro.Trans, { children: "Unsupported Asset" }, void 0) }), void 0) }), void 0)) : !account ? (jsxRuntime.jsx(ButtonLight, __assign({ onClick: toggleWalletModal }, { children: jsxRuntime.jsx(macro.Trans, { children: "Connect Wallet" }, void 0) }), void 0)) : showWrap ? (jsxRuntime.jsx(ButtonPrimary, __assign({ disabled: Boolean(wrapInputError), onClick: onWrap }, { children: wrapInputError ? (jsxRuntime.jsx(WrapErrorText, { wrapInputError: wrapInputError }, void 0)) : wrapType === WrapType.WRAP ? (jsxRuntime.jsx(macro.Trans, { children: "Wrap" }, void 0)) : wrapType === WrapType.UNWRAP ? (jsxRuntime.jsx(macro.Trans, { children: "Unwrap" }, void 0)) : null }), void 0)) : routeNotFound && userHasSpecifiedInputOutput && !routeIsLoading && !routeIsSyncing ? (jsxRuntime.jsx(GreyCard, __assign({ style: { textAlign: 'center' } }, { children: jsxRuntime.jsx(ThemedText.Main, __assign({ mb: "4px" }, { children: jsxRuntime.jsx(macro.Trans, { children: "Insufficient liquidity for this trade." }, void 0) }), void 0) }), void 0)) : showApproveFlow ? (jsxRuntime.jsx(AutoRow, __assign({ style: { flexWrap: 'nowrap', width: '100%' } }, { children: jsxRuntime.jsxs(AutoColumn, __assign({ style: { width: '100%' }, gap: "12px" }, { children: [jsxRuntime.jsx(ButtonConfirmed, __assign({ onClick: handleApprove, disabled: approvalState !== ApprovalState.NOT_APPROVED ||
                                                                approvalSubmitted ||
                                                                signatureState === UseERC20PermitState.SIGNED, width: "100%", altDisabledStyle: approvalState === ApprovalState.PENDING, confirmed: approvalState === ApprovalState.APPROVED || signatureState === UseERC20PermitState.SIGNED }, { children: jsxRuntime.jsxs(AutoRow, __assign({ justify: "space-between", style: { flexWrap: 'nowrap' } }, { children: [jsxRuntime.jsxs("span", __assign({ style: { display: 'flex', alignItems: 'center' } }, { children: [jsxRuntime.jsx(CurrencyLogo, { currency: currencies[Field.INPUT], size: '20px', style: { marginRight: '8px', flexShrink: 0 } }, void 0), approvalState === ApprovalState.APPROVED || signatureState === UseERC20PermitState.SIGNED ? (jsxRuntime.jsxs(macro.Trans, { children: ["You can now trade ", (_j = currencies[Field.INPUT]) === null || _j === void 0 ? void 0 : _j.symbol] }, void 0)) : (jsxRuntime.jsxs(macro.Trans, { children: ["Allow the Uniswap Protocol to use your ", (_k = currencies[Field.INPUT]) === null || _k === void 0 ? void 0 : _k.symbol] }, void 0))] }), void 0), approvalState === ApprovalState.PENDING ? (jsxRuntime.jsx(Loader, { stroke: "white" }, void 0)) : (approvalSubmitted && approvalState === ApprovalState.APPROVED) ||
                                                                        signatureState === UseERC20PermitState.SIGNED ? (jsxRuntime.jsx(reactFeather.CheckCircle, { size: "20", color: theme.green1 }, void 0)) : (jsxRuntime.jsx(MouseoverTooltip, __assign({ text: jsxRuntime.jsxs(macro.Trans, { children: ["You must give the Uniswap smart contracts permission to use your", ' ', (_l = currencies[Field.INPUT]) === null || _l === void 0 ? void 0 : _l.symbol, ". You only have to do this once per token."] }, void 0) }, { children: jsxRuntime.jsx(reactFeather.HelpCircle, { size: "20", color: 'white', style: { marginLeft: '8px' } }, void 0) }), void 0))] }), void 0) }), void 0), jsxRuntime.jsx(ButtonError, __assign({ onClick: function () {
                                                                if (isExpertMode) {
                                                                    handleSwap();
                                                                }
                                                                else {
                                                                    setSwapState({
                                                                        tradeToConfirm: trade,
                                                                        attemptingTxn: false,
                                                                        swapErrorMessage: undefined,
                                                                        showConfirm: true,
                                                                        txHash: undefined,
                                                                    });
                                                                }
                                                            }, width: "100%", id: "swap-button", disabled: !isValid ||
                                                                routeIsSyncing ||
                                                                routeIsLoading ||
                                                                (approvalState !== ApprovalState.APPROVED && signatureState !== UseERC20PermitState.SIGNED) ||
                                                                priceImpactTooHigh, error: isValid && priceImpactSeverity > 2 }, { children: jsxRuntime.jsx(rebass.Text, __assign({ fontSize: 16, fontWeight: 500 }, { children: priceImpactTooHigh ? (jsxRuntime.jsx(macro.Trans, { children: "High Price Impact" }, void 0)) : trade && priceImpactSeverity > 2 ? (jsxRuntime.jsx(macro.Trans, { children: "Swap Anyway" }, void 0)) : (jsxRuntime.jsx(macro.Trans, { children: "Swap" }, void 0)) }), void 0) }), void 0)] }), void 0) }), void 0)) : (jsxRuntime.jsx(ButtonError, __assign({ onClick: function () {
                                                    if (isExpertMode) {
                                                        handleSwap();
                                                    }
                                                    else {
                                                        setSwapState({
                                                            tradeToConfirm: trade,
                                                            attemptingTxn: false,
                                                            swapErrorMessage: undefined,
                                                            showConfirm: true,
                                                            txHash: undefined,
                                                        });
                                                    }
                                                }, id: "swap-button", disabled: !isValid || routeIsSyncing || routeIsLoading || priceImpactTooHigh || !!swapCallbackError, error: isValid && priceImpactSeverity > 2 && !swapCallbackError }, { children: jsxRuntime.jsx(rebass.Text, __assign({ fontSize: 20, fontWeight: 500 }, { children: swapInputError ? (swapInputError) : routeIsSyncing || routeIsLoading ? (jsxRuntime.jsx(macro.Trans, { children: "Swap" }, void 0)) : priceImpactSeverity > 2 ? (jsxRuntime.jsx(macro.Trans, { children: "Swap Anyway" }, void 0)) : priceImpactTooHigh ? (jsxRuntime.jsx(macro.Trans, { children: "Price Impact Too High" }, void 0)) : (jsxRuntime.jsx(macro.Trans, { children: "Swap" }, void 0)) }), void 0) }), void 0)), isExpertMode && swapErrorMessage ? jsxRuntime.jsx(SwapCallbackError, { error: swapErrorMessage }, void 0) : null] }, void 0)] }), void 0)] }), void 0)] }, void 0), jsxRuntime.jsx(AlertWrapper, { children: jsxRuntime.jsx(NetworkAlert, {}, void 0) }, void 0), jsxRuntime.jsx(SwitchLocaleLink, {}, void 0), !swapIsUnsupported ? null : (jsxRuntime.jsx(UnsupportedCurrencyFooter, { show: swapIsUnsupported, currencies: [currencies[Field.INPUT], currencies[Field.OUTPUT]] }, void 0))] }, void 0));
}
var templateObject_1;

var $schema = "http://json-schema.org/draft-07/schema#";
var $id = "https://uniswap.org/tokenlist.schema.json";
var title = "Uniswap Token List";
var description = "Schema for lists of tokens compatible with the Uniswap Interface";
var definitions = {
	Version: {
		type: "object",
		description: "The version of the list, used in change detection",
		examples: [
			{
				major: 1,
				minor: 0,
				patch: 0
			}
		],
		additionalProperties: false,
		properties: {
			major: {
				type: "integer",
				description: "The major version of the list. Must be incremented when tokens are removed from the list or token addresses are changed.",
				minimum: 0,
				examples: [
					1,
					2
				]
			},
			minor: {
				type: "integer",
				description: "The minor version of the list. Must be incremented when tokens are added to the list.",
				minimum: 0,
				examples: [
					0,
					1
				]
			},
			patch: {
				type: "integer",
				description: "The patch version of the list. Must be incremented for any changes to the list.",
				minimum: 0,
				examples: [
					0,
					1
				]
			}
		},
		required: [
			"major",
			"minor",
			"patch"
		]
	},
	TagIdentifier: {
		type: "string",
		description: "The unique identifier of a tag",
		minLength: 1,
		maxLength: 10,
		pattern: "^[\\w]+$",
		examples: [
			"compound",
			"stablecoin"
		]
	},
	ExtensionIdentifier: {
		type: "string",
		description: "The name of a token extension property",
		minLength: 1,
		maxLength: 40,
		pattern: "^[\\w]+$",
		examples: [
			"color",
			"is_fee_on_transfer",
			"aliases"
		]
	},
	ExtensionMap: {
		type: "object",
		description: "An object containing any arbitrary or vendor-specific token metadata",
		maxProperties: 10,
		propertyNames: {
			$ref: "#/definitions/ExtensionIdentifier"
		},
		additionalProperties: {
			$ref: "#/definitions/ExtensionValue"
		},
		examples: [
			{
				color: "#000000",
				is_verified_by_me: true
			},
			{
				"x-bridged-addresses-by-chain": {
					"1": {
						bridgeAddress: "0x4200000000000000000000000000000000000010",
						tokenAddress: "0x4200000000000000000000000000000000000010"
					}
				}
			}
		]
	},
	ExtensionPrimitiveValue: {
		anyOf: [
			{
				type: "string",
				minLength: 1,
				maxLength: 42,
				examples: [
					"#00000"
				]
			},
			{
				type: "boolean",
				examples: [
					true
				]
			},
			{
				type: "number",
				examples: [
					15
				]
			},
			{
				type: "null"
			}
		]
	},
	ExtensionValue: {
		anyOf: [
			{
				$ref: "#/definitions/ExtensionPrimitiveValue"
			},
			{
				type: "object",
				maxProperties: 10,
				propertyNames: {
					$ref: "#/definitions/ExtensionIdentifier"
				},
				additionalProperties: {
					$ref: "#/definitions/ExtensionValueInner0"
				}
			}
		]
	},
	ExtensionValueInner0: {
		anyOf: [
			{
				$ref: "#/definitions/ExtensionPrimitiveValue"
			},
			{
				type: "object",
				maxProperties: 10,
				propertyNames: {
					$ref: "#/definitions/ExtensionIdentifier"
				},
				additionalProperties: {
					$ref: "#/definitions/ExtensionValueInner1"
				}
			}
		]
	},
	ExtensionValueInner1: {
		anyOf: [
			{
				$ref: "#/definitions/ExtensionPrimitiveValue"
			}
		]
	},
	TagDefinition: {
		type: "object",
		description: "Definition of a tag that can be associated with a token via its identifier",
		additionalProperties: false,
		properties: {
			name: {
				type: "string",
				description: "The name of the tag",
				pattern: "^[ \\w]+$",
				minLength: 1,
				maxLength: 20
			},
			description: {
				type: "string",
				description: "A user-friendly description of the tag",
				pattern: "^[ \\w\\.,:]+$",
				minLength: 1,
				maxLength: 200
			}
		},
		required: [
			"name",
			"description"
		],
		examples: [
			{
				name: "Stablecoin",
				description: "A token with value pegged to another asset"
			}
		]
	},
	TokenInfo: {
		type: "object",
		description: "Metadata for a single token in a token list",
		additionalProperties: false,
		properties: {
			chainId: {
				type: "integer",
				description: "The chain ID of the Ethereum network where this token is deployed",
				minimum: 1,
				examples: [
					1,
					42
				]
			},
			address: {
				type: "string",
				description: "The checksummed address of the token on the specified chain ID",
				pattern: "^0x[a-fA-F0-9]{40}$",
				examples: [
					"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
				]
			},
			decimals: {
				type: "integer",
				description: "The number of decimals for the token balance",
				minimum: 0,
				maximum: 255,
				examples: [
					18
				]
			},
			name: {
				type: "string",
				description: "The name of the token",
				minLength: 1,
				maxLength: 40,
				pattern: "^[ \\w.'+\\-%/À-ÖØ-öø-ÿ:&\\[\\]\\(\\)]+$",
				examples: [
					"USD Coin"
				]
			},
			symbol: {
				type: "string",
				description: "The symbol for the token; must be alphanumeric",
				pattern: "^[a-zA-Z0-9+\\-%/$.]+$",
				minLength: 1,
				maxLength: 20,
				examples: [
					"USDC"
				]
			},
			logoURI: {
				type: "string",
				description: "A URI to the token logo asset; if not set, interface will attempt to find a logo based on the token address; suggest SVG or PNG of size 64x64",
				format: "uri",
				examples: [
					"ipfs://QmXfzKRvjZz3u5JRgC4v5mGVbm9ahrUiB4DgzHBsnWbTMM"
				]
			},
			tags: {
				type: "array",
				description: "An array of tag identifiers associated with the token; tags are defined at the list level",
				items: {
					$ref: "#/definitions/TagIdentifier"
				},
				maxItems: 10,
				examples: [
					"stablecoin",
					"compound"
				]
			},
			extensions: {
				$ref: "#/definitions/ExtensionMap"
			}
		},
		required: [
			"chainId",
			"address",
			"decimals",
			"name",
			"symbol"
		]
	}
};
var type = "object";
var additionalProperties = false;
var properties = {
	name: {
		type: "string",
		description: "The name of the token list",
		minLength: 1,
		maxLength: 20,
		pattern: "^[\\w ]+$",
		examples: [
			"My Token List"
		]
	},
	timestamp: {
		type: "string",
		format: "date-time",
		description: "The timestamp of this list version; i.e. when this immutable version of the list was created"
	},
	version: {
		$ref: "#/definitions/Version"
	},
	tokens: {
		type: "array",
		description: "The list of tokens included in the list",
		items: {
			$ref: "#/definitions/TokenInfo"
		},
		minItems: 1,
		maxItems: 10000
	},
	keywords: {
		type: "array",
		description: "Keywords associated with the contents of the list; may be used in list discoverability",
		items: {
			type: "string",
			description: "A keyword to describe the contents of the list",
			minLength: 1,
			maxLength: 20,
			pattern: "^[\\w ]+$",
			examples: [
				"compound",
				"lending",
				"personal tokens"
			]
		},
		maxItems: 20,
		uniqueItems: true
	},
	tags: {
		type: "object",
		description: "A mapping of tag identifiers to their name and description",
		propertyNames: {
			$ref: "#/definitions/TagIdentifier"
		},
		additionalProperties: {
			$ref: "#/definitions/TagDefinition"
		},
		maxProperties: 20,
		examples: [
			{
				stablecoin: {
					name: "Stablecoin",
					description: "A token with value pegged to another asset"
				}
			}
		]
	},
	logoURI: {
		type: "string",
		description: "A URI for the logo of the token list; prefer SVG or PNG of size 256x256",
		format: "uri",
		examples: [
			"ipfs://QmXfzKRvjZz3u5JRgC4v5mGVbm9ahrUiB4DgzHBsnWbTMM"
		]
	}
};
var required = [
	"name",
	"timestamp",
	"version",
	"tokens"
];
var tokenlist_schema = {
	$schema: $schema,
	$id: $id,
	title: title,
	description: description,
	definitions: definitions,
	type: type,
	additionalProperties: additionalProperties,
	properties: properties,
	required: required
};

var tokenlist_schema$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    $schema: $schema,
    $id: $id,
    title: title,
    description: description,
    definitions: definitions,
    type: type,
    additionalProperties: additionalProperties,
    properties: properties,
    required: required,
    'default': tokenlist_schema
});

var fortmatic=function(e){var t={};function r(n){if(t[n])return t[n].exports;var o=t[n]={i:n,l:!1,exports:{}};return e[n].call(o.exports,o,o.exports,r),o.l=!0,o.exports}return r.m=e,r.c=t,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n});},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0});},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)r.d(n,o,function(t){return e[t]}.bind(null,o));return n},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=3)}([function(e,t){e.exports=function(e){return e&&e.__esModule?e:{default:e}};},function(e,t){e.exports=function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")};},function(e,t,r){function n(){return Math.floor(9e4*Math.random())+1e4}Object.defineProperty(t,"__esModule",{value:!0}),t.sendAsyncWrapper=function(e,t){var r=this;return new Promise(function(o,a){r.sendAsync({jsonrpc:"2.0",id:n(),method:e,params:t||[]},function(e,t){e?a(e):o(t.result);});})},t.sendFortmaticAsyncWrapper=function(e){var t=this;return new Promise(function(r,n){t.getProvider().sendFortmaticAsync(e,function(e,t){e?n(e):r(t?t.result:{});});})},t.randomId=n,t.findExistingResponse=function(e,t){for(var r=0;r<e.length;r++)if(e[r].id===t)return e[r];return null};},function(e,t,r){e.exports=r(4);},function(e,t,r){var n=r(0),o=n(r(1)),a=n(r(5)),i=r(2),s="fm_composeSend",c="fm_logout",u="fm_get_balances",l="fm_get_transactions",f="fm_is_logged_in",d="fm_accountSettings",h="fm_deposit",p="fm_get_user",m="fm_configure",y={};e.exports=function e(t,r,n){var g=this;if((0, o.default)(this,e),this.fortmaticClient="https://x2.fortmatic.com",!t)throw new Error("Please provide a Fortmatic API key that you acquired from the developer dashboard.");this.apiKey=t,this.options=n,this.ethNetwork=r,this.queryParams=btoa(JSON.stringify({API_KEY:t,ETH_NETWORK:r})),this.transactions={send:function(e,t){var r=new v(s,{to:e.to,value:e.amount});g.getProvider().sendFortmaticAsync(r,t);}},this.getProvider=function(){return y["fortmatic-".concat(g.queryParams)]||(y["fortmatic-".concat(g.queryParams)]=new a.default(g.fortmaticClient,{API_KEY:t,ETH_NETWORK:r})),y["fortmatic-".concat(g.queryParams)]},this.user={login:function(){return g.getProvider().enable()},logout:function(){g.getProvider().account=null,g.getProvider().network=null;var e=new v(c);return i.sendFortmaticAsyncWrapper.call(g,e)},getUser:function(){var e=new v(p);return i.sendFortmaticAsyncWrapper.call(g,e)},getBalances:function(){var e=new v(u);return i.sendFortmaticAsyncWrapper.call(g,e)},getTransactions:function(){var e=new v(l);return i.sendFortmaticAsyncWrapper.call(g,e)},isLoggedIn:function(){var e=new v(f);return i.sendFortmaticAsyncWrapper.call(g,e)},settings:function(){var e=new v(d);return i.sendFortmaticAsyncWrapper.call(g,e)},deposit:function(e){var t=new v(h,e);return i.sendFortmaticAsyncWrapper.call(g,t)}},this.configure=function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=new v(m);return t.params=[e],i.sendFortmaticAsyncWrapper.call(g,t)};};var v=function e(t,r){(0, o.default)(this,e),this.id=(0, i.randomId)(),this.method=t,this.params=r?[r]:[{}];};},function(e,t,r){var n=r(0);Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var o=n(r(6)),a=n(r(9)),i=n(r(1)),s=n(r(10)),c=r(11),u=n(r(12)),l=r(2),f=function(){function e(t,r){if((0, i.default)(this,e),this.fortmaticClient=t,this.requests={},this.queue=[],this.account=null,this.network=null,this.isFortmatic=!0,this.overlayReady=!1,this.isLoggedIn=!1,this.postMessages={FORTMATIC_HANDLE_BATCH_REQUEST:"FORTMATIC_HANDLE_BATCH_REQUEST",FORTMATIC_HANDLE_REQUEST:"FORTMATIC_HANDLE_REQUEST",FORTMATIC_HANDLE_FORTMATIC_REQUEST:"FORTMATIC_HANDLE_FORTMATIC_REQUEST",FORTMATIC_HANDLE_RESPONSE:"FORTMATIC_HANDLE_RESPONSE",FORTMATIC_OVERLAY_READY:"FORTMATIC_OVERLAY_READY",FORTMATIC_SHOW_OVERLAY:"FORTMATIC_SHOW_OVERLAY",FORTMATIC_HIDE_OVERLAY:"FORTMATIC_HIDE_OVERLAY",FORTMATIC_USER_DENIED:"FORTMATIC_USER_DENIED",FORTMATIC_USER_LOGOUT:"FORTMATIC_USER_LOGOUT",FORTMATIC_UNAUTHORIZED_API_KEY:"FORTMATIC_UNAUTHORIZED_API_KEY"},!r.API_KEY)throw new Error("Please provide a Fortmatic API key that you acquired from the developer dashboard.");this.options={API_KEY:r.API_KEY,ETH_NETWORK:r.ETH_NETWORK,DOMAIN_ORIGIN:window.location?window.location.origin:"",version:c.version},this.queryParams=btoa(JSON.stringify(this.options)),this.constructPostMessage(),this.overlay=this.createOverlay(),this.listenMessage();}return (0, s.default)(e,[{key:"constructPostMessage",value:function(){var e=this;Object.keys(this.postMessages).map(function(t){e.postMessages[t]+="-".concat(e.queryParams);});}},{key:"createOverlay",value:function(){var e=this;return new Promise(function(t,r){var n=function(){if(function(){var t=!0,r=!1,n=void 0;try{for(var o,a=document.getElementsByClassName("fortmatic-iframe")[Symbol.iterator]();!(t=(o=a.next()).done);t=!0)if(o.value.src.includes(e.queryParams))return !1}catch(e){r=!0,n=e;}finally{try{t||null==a.return||a.return();}finally{if(r)throw n}}return !0}()){var r=document.createElement("style");r.innerHTML=u.default.css,r.type="text/css",document.head.appendChild(r);var n=document.createElement("iframe");n.className="fortmatic-iframe",n.src="".concat(e.fortmaticClient,"/send?params=").concat(e.queryParams),document.body.appendChild(n);var o=document.createElement("img");o.src="https://static.fortmatic.com/assets/trans.gif",document.body.appendChild(o),t({iframe:n});}else console.error("Fortmatic: Duplicate instances found.");};["loaded","interactive","complete"].indexOf(document.readyState)>-1?n():window.addEventListener("load",n.bind(e),!1);})}},{key:"showOverlay",value:function(){var e=(0, a.default)(o.default.mark(function e(){return o.default.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,this.overlay;case 2:e.sent.iframe.style.display="block";case 4:case"end":return e.stop()}},e,this)}));return function(){return e.apply(this,arguments)}}()},{key:"hideOverlay",value:function(){var e=(0, a.default)(o.default.mark(function e(){return o.default.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,this.overlay;case 2:e.sent.iframe.style.display="none";case 4:case"end":return e.stop()}},e,this)}));return function(){return e.apply(this,arguments)}}()},{key:"sendAsync",value:function(e,t){e.length>0?this.enqueue({payload:{id:(0, l.randomId)(),batch:e.map(function(e){return e.id=(0, l.randomId)(),e}),method:"eth_batchRequest"},cb:t}):this.enqueue({payload:e,cb:t});}},{key:"sendFortmaticAsync",value:function(e,t){this.enqueue({payload:e,cb:t,isNative:!0});}},{key:"send",value:function(e,t){if("string"==typeof e)return l.sendAsyncWrapper.call(this,e,t);if(!t){console.warn("Non-async web3 methods will be deprecated in web3 > 1.0, and are not supported by the Fortmatic provider. An async method to be used instead."),this.sendAsync(e,function(){});var r={};switch(e.method){case"eth_accounts":r=this.account?[this.account]:[];break;case"eth_coinbase":r=this.account;break;case"net_version":r=this.network||(this.options.API_KEY.startsWith("pk_live")?1:4);break;case"eth_uninstallFilter":r=!0;break;default:r={};}return {id:e.id,jsonrpc:e.jsonrpc,result:r}}this.sendAsync(e,t);}},{key:"enqueue",value:function(e){this.queue.push(e),this.overlayReady&&this.dequeue();}},{key:"dequeue",value:function(){var e=(0, a.default)(o.default.mark(function e(){var t,r,n,a=this;return o.default.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:if(0!==this.queue.length){e.next=2;break}return e.abrupt("return");case 2:if(!(t=this.queue.shift())){e.next=11;break}return r=t.payload,n=t.cb,r.id=(0, l.randomId)(),e.next=9,this.postMessage(t.isNative?this.postMessages.FORTMATIC_HANDLE_FORTMATIC_REQUEST:this.postMessages.FORTMATIC_HANDLE_REQUEST,t.payload);case 9:r.batch&&r.batch.length>0?(r.batch.forEach(function(e){a.requests[e.id]={parentId:r.id,payload:e,cb:function(e,t){var n=a.requests[r.id].batchResponse;if(e&&e.response&&!(0, l.findExistingResponse)(n,e.response.id))throw n.push({jsonrpc:"2.0",id:e.response.id,error:{code:e.response.code,message:e.response.message}}),a.requests[r.id].cb(null,n),e.response;if(t&&t.result&&!(0, l.findExistingResponse)(n,t.id))return n.push(t);throw new Error("Fortmatic: unexpected callback behavior")}};}),this.requests[r.id]={payload:r,cb:n,batchResponse:[]}):this.requests[r.id]={payload:r,cb:n},this.dequeue();case 11:case"end":return e.stop()}},e,this)}));return function(){return e.apply(this,arguments)}}()},{key:"postMessage",value:function(){var e=(0, a.default)(o.default.mark(function e(t,r){var n;return o.default.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,this.overlay;case 2:if(!(n=e.sent).iframe.contentWindow){e.next=7;break}n.iframe.contentWindow.postMessage({msgType:t,payload:r},"*"),e.next=8;break;case 7:throw new Error("Fortmatic: Modal is not ready.");case 8:case"end":return e.stop()}},e,this)}));return function(t,r){return e.apply(this,arguments)}}()},{key:"enable",value:function(){return l.sendAsyncWrapper.call(this,"eth_accounts")}},{key:"listenMessage",value:function(){var e=this;window.addEventListener("message",function(t){if(t.origin===e.fortmaticClient){var r=t.data.response?t.data.response.id:null;switch(t.data.msgType){case e.postMessages.FORTMATIC_OVERLAY_READY:e.overlayReady=!0,e.dequeue();break;case e.postMessages.FORTMATIC_HANDLE_RESPONSE:try{e.requests[r].cb(null,t.data.response);var n=e.requests[r].parentId;n&&e.requests[n].payload.batch.length===e.requests[n].batchResponse.length&&e.requests[n].cb(null,e.requests[n].batchResponse),"eth_accounts"===e.requests[r].payload.method?e.account=t.data.response.result[0]:"eth_coinbase"===e.requests[r].payload.method?e.account=t.data.response.result:"net_version"===e.requests[r].payload.method&&(e.network=t.data.response.result);}catch(e){}e.isLoggedIn=!0,e.dequeue();break;case e.postMessages.FORTMATIC_HIDE_OVERLAY:e.hideOverlay();break;case e.postMessages.FORTMATIC_SHOW_OVERLAY:e.showOverlay();break;case e.postMessages.FORTMATIC_USER_LOGOUT:e.account=null,e.network=null,e.isLoggedIn=!1;break;case e.postMessages.FORTMATIC_UNAUTHORIZED_API_KEY:throw e.overlayReady=!1,new Error("Given API key is not authorized to access the resource.");case e.postMessages.FORTMATIC_USER_DENIED:if(r){var o=t.data.response&&t.data.response.message?t.data.response.message:"Fortmatic: Modal was closed without executing action!",a=t.data.response&&t.data.response.code?t.data.response.code:1;e.requests[r].cb({message:o,code:a,response:t.data.response});}else e.queue.forEach(function(e){return e.cb({message:"Fortmatic: Modal was closed without executing action!",code:1})});e.dequeue();}}});}}]),e}();t.default=f;},function(e,t,r){e.exports=r(7);},function(e,t,r){var n=function(){return this||"object"==typeof self&&self}()||Function("return this")(),o=n.regeneratorRuntime&&Object.getOwnPropertyNames(n).indexOf("regeneratorRuntime")>=0,a=o&&n.regeneratorRuntime;if(n.regeneratorRuntime=void 0,e.exports=r(8),o)n.regeneratorRuntime=a;else try{delete n.regeneratorRuntime;}catch(e){n.regeneratorRuntime=void 0;}},function(e,t){!function(t){var r,n=Object.prototype,o=n.hasOwnProperty,a="function"==typeof Symbol?Symbol:{},i=a.iterator||"@@iterator",s=a.asyncIterator||"@@asyncIterator",c=a.toStringTag||"@@toStringTag",u="object"==typeof e,l=t.regeneratorRuntime;if(l)u&&(e.exports=l);else {(l=t.regeneratorRuntime=u?e.exports:{}).wrap=_;var f="suspendedStart",d="suspendedYield",h="executing",p="completed",m={},y={};y[i]=function(){return this};var v=Object.getPrototypeOf,g=v&&v(v(L([])));g&&g!==n&&o.call(g,i)&&(y=g);var b=A.prototype=w.prototype=Object.create(y);T.prototype=b.constructor=A,A.constructor=T,A[c]=T.displayName="GeneratorFunction",l.isGeneratorFunction=function(e){var t="function"==typeof e&&e.constructor;return !!t&&(t===T||"GeneratorFunction"===(t.displayName||t.name))},l.mark=function(e){return Object.setPrototypeOf?Object.setPrototypeOf(e,A):(e.__proto__=A,c in e||(e[c]="GeneratorFunction")),e.prototype=Object.create(b),e},l.awrap=function(e){return {__await:e}},O(R.prototype),R.prototype[s]=function(){return this},l.AsyncIterator=R,l.async=function(e,t,r,n){var o=new R(_(e,t,r,n));return l.isGeneratorFunction(t)?o:o.next().then(function(e){return e.done?e.value:o.next()})},O(b),b[c]="Generator",b[i]=function(){return this},b.toString=function(){return "[object Generator]"},l.keys=function(e){var t=[];for(var r in e)t.push(r);return t.reverse(),function r(){for(;t.length;){var n=t.pop();if(n in e)return r.value=n,r.done=!1,r}return r.done=!0,r}},l.values=L,F.prototype={constructor:F,reset:function(e){if(this.prev=0,this.next=0,this.sent=this._sent=r,this.done=!1,this.delegate=null,this.method="next",this.arg=r,this.tryEntries.forEach(M),!e)for(var t in this)"t"===t.charAt(0)&&o.call(this,t)&&!isNaN(+t.slice(1))&&(this[t]=r);},stop:function(){this.done=!0;var e=this.tryEntries[0].completion;if("throw"===e.type)throw e.arg;return this.rval},dispatchException:function(e){if(this.done)throw e;var t=this;function n(n,o){return s.type="throw",s.arg=e,t.next=n,o&&(t.method="next",t.arg=r),!!o}for(var a=this.tryEntries.length-1;a>=0;--a){var i=this.tryEntries[a],s=i.completion;if("root"===i.tryLoc)return n("end");if(i.tryLoc<=this.prev){var c=o.call(i,"catchLoc"),u=o.call(i,"finallyLoc");if(c&&u){if(this.prev<i.catchLoc)return n(i.catchLoc,!0);if(this.prev<i.finallyLoc)return n(i.finallyLoc)}else if(c){if(this.prev<i.catchLoc)return n(i.catchLoc,!0)}else {if(!u)throw new Error("try statement without catch or finally");if(this.prev<i.finallyLoc)return n(i.finallyLoc)}}}},abrupt:function(e,t){for(var r=this.tryEntries.length-1;r>=0;--r){var n=this.tryEntries[r];if(n.tryLoc<=this.prev&&o.call(n,"finallyLoc")&&this.prev<n.finallyLoc){var a=n;break}}a&&("break"===e||"continue"===e)&&a.tryLoc<=t&&t<=a.finallyLoc&&(a=null);var i=a?a.completion:{};return i.type=e,i.arg=t,a?(this.method="next",this.next=a.finallyLoc,m):this.complete(i)},complete:function(e,t){if("throw"===e.type)throw e.arg;return "break"===e.type||"continue"===e.type?this.next=e.arg:"return"===e.type?(this.rval=this.arg=e.arg,this.method="return",this.next="end"):"normal"===e.type&&t&&(this.next=t),m},finish:function(e){for(var t=this.tryEntries.length-1;t>=0;--t){var r=this.tryEntries[t];if(r.finallyLoc===e)return this.complete(r.completion,r.afterLoc),M(r),m}},catch:function(e){for(var t=this.tryEntries.length-1;t>=0;--t){var r=this.tryEntries[t];if(r.tryLoc===e){var n=r.completion;if("throw"===n.type){var o=n.arg;M(r);}return o}}throw new Error("illegal catch attempt")},delegateYield:function(e,t,n){return this.delegate={iterator:L(e),resultName:t,nextLoc:n},"next"===this.method&&(this.arg=r),m}};}function _(e,t,r,n){var o=t&&t.prototype instanceof w?t:w,a=Object.create(o.prototype),i=new F(n||[]);return a._invoke=function(e,t,r){var n=f;return function(o,a){if(n===h)throw new Error("Generator is already running");if(n===p){if("throw"===o)throw a;return k()}for(r.method=o,r.arg=a;;){var i=r.delegate;if(i){var s=I(i,r);if(s){if(s===m)continue;return s}}if("next"===r.method)r.sent=r._sent=r.arg;else if("throw"===r.method){if(n===f)throw n=p,r.arg;r.dispatchException(r.arg);}else "return"===r.method&&r.abrupt("return",r.arg);n=h;var c=E(e,t,r);if("normal"===c.type){if(n=r.done?p:d,c.arg===m)continue;return {value:c.arg,done:r.done}}"throw"===c.type&&(n=p,r.method="throw",r.arg=c.arg);}}}(e,r,i),a}function E(e,t,r){try{return {type:"normal",arg:e.call(t,r)}}catch(e){return {type:"throw",arg:e}}}function w(){}function T(){}function A(){}function O(e){["next","throw","return"].forEach(function(t){e[t]=function(e){return this._invoke(t,e)};});}function R(e){var t;this._invoke=function(r,n){function a(){return new Promise(function(t,a){!function t(r,n,a,i){var s=E(e[r],e,n);if("throw"!==s.type){var c=s.arg,u=c.value;return u&&"object"==typeof u&&o.call(u,"__await")?Promise.resolve(u.__await).then(function(e){t("next",e,a,i);},function(e){t("throw",e,a,i);}):Promise.resolve(u).then(function(e){c.value=e,a(c);},function(e){return t("throw",e,a,i)})}i(s.arg);}(r,n,t,a);})}return t=t?t.then(a,a):a()};}function I(e,t){var n=e.iterator[t.method];if(n===r){if(t.delegate=null,"throw"===t.method){if(e.iterator.return&&(t.method="return",t.arg=r,I(e,t),"throw"===t.method))return m;t.method="throw",t.arg=new TypeError("The iterator does not provide a 'throw' method");}return m}var o=E(n,e.iterator,t.arg);if("throw"===o.type)return t.method="throw",t.arg=o.arg,t.delegate=null,m;var a=o.arg;return a?a.done?(t[e.resultName]=a.value,t.next=e.nextLoc,"return"!==t.method&&(t.method="next",t.arg=r),t.delegate=null,m):a:(t.method="throw",t.arg=new TypeError("iterator result is not an object"),t.delegate=null,m)}function x(e){var t={tryLoc:e[0]};1 in e&&(t.catchLoc=e[1]),2 in e&&(t.finallyLoc=e[2],t.afterLoc=e[3]),this.tryEntries.push(t);}function M(e){var t=e.completion||{};t.type="normal",delete t.arg,e.completion=t;}function F(e){this.tryEntries=[{tryLoc:"root"}],e.forEach(x,this),this.reset(!0);}function L(e){if(e){var t=e[i];if(t)return t.call(e);if("function"==typeof e.next)return e;if(!isNaN(e.length)){var n=-1,a=function t(){for(;++n<e.length;)if(o.call(e,n))return t.value=e[n],t.done=!1,t;return t.value=r,t.done=!0,t};return a.next=a}}return {next:k}}function k(){return {value:r,done:!0}}}(function(){return this||"object"==typeof self&&self}()||Function("return this")());},function(e,t){function r(e,t,r,n,o,a,i){try{var s=e[a](i),c=s.value;}catch(e){return void r(e)}s.done?t(c):Promise.resolve(c).then(n,o);}e.exports=function(e){return function(){var t=this,n=arguments;return new Promise(function(o,a){var i=e.apply(t,n);function s(e){r(i,o,a,s,c,"next",e);}function c(e){r(i,o,a,s,c,"throw",e);}s(void 0);})}};},function(e,t){function r(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n);}}e.exports=function(e,t,n){return t&&r(e.prototype,t),n&&r(e,n),e};},function(e){e.exports={name:"fortmatic",version:"1.1.3",description:"Fortmatic Javascript SDK",main:"lib/fortmatic.js",scripts:{build:"WEBPACK_ENV=production webpack","build:dev":"WEBPACK_ENV=development BABEL_ENV=development webpack --progress --colors --watch",test:"nyc --reporter=lcov --reporter=text-summary ava"},author:"Fortmatic <team@fortmatic.com> (https://fortmatic.com/)",license:"MIT",repository:{type:"git",url:"https://github.com/fortmatic/fortmatic-js"},keywords:["Auth","Login","Web3","Crypto","Ethereum","MetaMask","Wallet","Blockchain","Dapp"],homepage:"https://www.fortmatic.com",ava:{require:["@babel/register"],files:["test/**/*.spec.js"],babel:{testOptions:{presets:["@babel/env"],plugins:["@babel/plugin-proposal-function-bind","@babel/plugin-transform-runtime"]}},verbose:!0},nyc:{all:!1,"check-coverage":!0,"per-file":!0,lines:80,statements:80,functions:80,branches:80,include:["src/**/*.js"],exclude:["*/style.js"],require:[],reporter:["html","lcov"]},dependencies:{"@babel/runtime":"7.3.4"},devDependencies:{"@babel/core":"7.3.4","@babel/plugin-proposal-function-bind":"7.2.0","@babel/plugin-transform-modules-commonjs":"7.2.0","@babel/plugin-transform-runtime":"7.3.4","@babel/preset-env":"7.3.4","@babel/register":"7.0.0",ava:"2.2.0","babel-eslint":"10.0.1","babel-loader":"8.0.5",eslint:"5.9.0",lodash:"4.17.11",nyc:"13.1.0",sinon:"7.1.1",webpack:"4.26.1","webpack-cli":"3.1.2"}};},function(e,t,r){t.css="\n  .fortmatic-iframe {\n    display: none;\n    position: fixed;\n    top: 0;\n    right: 0;\n    width: 100%;\n    height: 100%;\n    border: none;\n    border-radius: 0;\n    z-index: 2147483647;\n  }\n";}]);

var fortmatic$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/_mergeNamespaces({
    __proto__: null,
    'default': fortmatic
}, [fortmatic]));

// from routing-api (https://github.com/Uniswap/routing-api/blob/main/lib/handlers/quote/quote.ts#L243-L311)
function transformSwapRouteToGetQuoteResult(type, amount, _a) {
    var e_1, _b;
    var quote = _a.quote, quoteGasAdjusted = _a.quoteGasAdjusted, route = _a.route, estimatedGasUsed = _a.estimatedGasUsed, estimatedGasUsedQuoteToken = _a.estimatedGasUsedQuoteToken, estimatedGasUsedUSD = _a.estimatedGasUsedUSD, gasPriceWei = _a.gasPriceWei, methodParameters = _a.methodParameters, blockNumber = _a.blockNumber;
    var routeResponse = [];
    try {
        for (var route_1 = __values(route), route_1_1 = route_1.next(); !route_1_1.done; route_1_1 = route_1.next()) {
            var subRoute = route_1_1.value;
            var amount_1 = subRoute.amount, quote_1 = subRoute.quote, tokenPath = subRoute.tokenPath;
            if (subRoute.protocol === routerSdk.Protocol.V3) {
                var pools = subRoute.route.pools;
                var curRoute = [];
                for (var i = 0; i < pools.length; i++) {
                    var nextPool = pools[i];
                    var tokenIn = tokenPath[i];
                    var tokenOut = tokenPath[i + 1];
                    var edgeAmountIn = undefined;
                    if (i === 0) {
                        edgeAmountIn = type === 'exactIn' ? amount_1.quotient.toString() : quote_1.quotient.toString();
                    }
                    var edgeAmountOut = undefined;
                    if (i === pools.length - 1) {
                        edgeAmountOut = type === 'exactIn' ? quote_1.quotient.toString() : amount_1.quotient.toString();
                    }
                    curRoute.push({
                        type: 'v3-pool',
                        tokenIn: {
                            chainId: tokenIn.chainId,
                            decimals: tokenIn.decimals,
                            address: tokenIn.address,
                            symbol: tokenIn.symbol,
                        },
                        tokenOut: {
                            chainId: tokenOut.chainId,
                            decimals: tokenOut.decimals,
                            address: tokenOut.address,
                            symbol: tokenOut.symbol,
                        },
                        fee: nextPool.fee.toString(),
                        liquidity: nextPool.liquidity.toString(),
                        sqrtRatioX96: nextPool.sqrtRatioX96.toString(),
                        tickCurrent: nextPool.tickCurrent.toString(),
                        amountIn: edgeAmountIn,
                        amountOut: edgeAmountOut,
                    });
                }
                routeResponse.push(curRoute);
            }
            else if (subRoute.protocol === routerSdk.Protocol.V2) {
                var pools = subRoute.route.pairs;
                var curRoute = [];
                for (var i = 0; i < pools.length; i++) {
                    var nextPool = pools[i];
                    var tokenIn = tokenPath[i];
                    var tokenOut = tokenPath[i + 1];
                    var edgeAmountIn = undefined;
                    if (i === 0) {
                        edgeAmountIn = type === 'exactIn' ? amount_1.quotient.toString() : quote_1.quotient.toString();
                    }
                    var edgeAmountOut = undefined;
                    if (i === pools.length - 1) {
                        edgeAmountOut = type === 'exactIn' ? quote_1.quotient.toString() : amount_1.quotient.toString();
                    }
                    var reserve0 = nextPool.reserve0;
                    var reserve1 = nextPool.reserve1;
                    curRoute.push({
                        type: 'v2-pool',
                        tokenIn: {
                            chainId: tokenIn.chainId,
                            decimals: tokenIn.decimals,
                            address: tokenIn.address,
                            symbol: tokenIn.symbol,
                        },
                        tokenOut: {
                            chainId: tokenOut.chainId,
                            decimals: tokenOut.decimals,
                            address: tokenOut.address,
                            symbol: tokenOut.symbol,
                        },
                        reserve0: {
                            token: {
                                chainId: reserve0.currency.wrapped.chainId,
                                decimals: reserve0.currency.wrapped.decimals,
                                address: reserve0.currency.wrapped.address,
                                symbol: reserve0.currency.wrapped.symbol,
                            },
                            quotient: reserve0.quotient.toString(),
                        },
                        reserve1: {
                            token: {
                                chainId: reserve1.currency.wrapped.chainId,
                                decimals: reserve1.currency.wrapped.decimals,
                                address: reserve1.currency.wrapped.address,
                                symbol: reserve1.currency.wrapped.symbol,
                            },
                            quotient: reserve1.quotient.toString(),
                        },
                        amountIn: edgeAmountIn,
                        amountOut: edgeAmountOut,
                    });
                }
                routeResponse.push(curRoute);
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (route_1_1 && !route_1_1.done && (_b = route_1.return)) _b.call(route_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    var result = {
        methodParameters: methodParameters,
        blockNumber: blockNumber.toString(),
        amount: amount.quotient.toString(),
        amountDecimals: amount.toExact(),
        quote: quote.quotient.toString(),
        quoteDecimals: quote.toExact(),
        quoteGasAdjusted: quoteGasAdjusted.quotient.toString(),
        quoteGasAdjustedDecimals: quoteGasAdjusted.toExact(),
        gasUseEstimateQuote: estimatedGasUsedQuoteToken.quotient.toString(),
        gasUseEstimateQuoteDecimals: estimatedGasUsedQuoteToken.toExact(),
        gasUseEstimate: estimatedGasUsed.toString(),
        gasUseEstimateUSD: estimatedGasUsedUSD.toExact(),
        gasPriceWei: gasPriceWei.toString(),
        route: routeResponse,
        routeString: smartOrderRouter.routeAmountsToString(route),
    };
    return result;
}

/** Minimal set of dependencies for the router to work locally. */
function buildDependencies() {
    var e_1, _a;
    var dependenciesByChain = {};
    try {
        for (var AUTO_ROUTER_SUPPORTED_CHAINS_1 = __values(AUTO_ROUTER_SUPPORTED_CHAINS), AUTO_ROUTER_SUPPORTED_CHAINS_1_1 = AUTO_ROUTER_SUPPORTED_CHAINS_1.next(); !AUTO_ROUTER_SUPPORTED_CHAINS_1_1.done; AUTO_ROUTER_SUPPORTED_CHAINS_1_1 = AUTO_ROUTER_SUPPORTED_CHAINS_1.next()) {
            var chainId = AUTO_ROUTER_SUPPORTED_CHAINS_1_1.value;
            var provider = new ethers.providers.JsonRpcProvider(INFURA_NETWORK_URLS[chainId]);
            dependenciesByChain[chainId] = {
                chainId: chainId,
                provider: provider,
            };
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (AUTO_ROUTER_SUPPORTED_CHAINS_1_1 && !AUTO_ROUTER_SUPPORTED_CHAINS_1_1.done && (_a = AUTO_ROUTER_SUPPORTED_CHAINS_1.return)) _a.call(AUTO_ROUTER_SUPPORTED_CHAINS_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return dependenciesByChain;
}
var GAMetric = /** @class */ (function (_super) {
    __extends(GAMetric, _super);
    function GAMetric() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GAMetric.prototype.putDimensions = function () {
        return;
    };
    GAMetric.prototype.putMetric = function (key, value, unit) {
        ReactGA__default["default"].timing({
            category: 'Routing API',
            variable: key + " | " + unit,
            value: value,
            label: 'client',
        });
    };
    return GAMetric;
}(smartOrderRouter.IMetric));
smartOrderRouter.setGlobalMetric(new GAMetric());

var routerParamsByChain = buildDependencies();
function getQuote(_a, alphaRouterConfig) {
    var type = _a.type, chainId = _a.chainId, tokenIn = _a.tokenIn, tokenOut = _a.tokenOut, amountRaw = _a.amount;
    return __awaiter(this, void 0, void 0, function () {
        var params, router, currencyIn, currencyOut, baseCurrency, quoteCurrency, amount, swapRoute;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    params = routerParamsByChain[chainId];
                    if (!params) {
                        throw new Error('Router dependencies not initialized.');
                    }
                    router = new smartOrderRouter.AlphaRouter(params);
                    currencyIn = new sdkCore.Token(tokenIn.chainId, tokenIn.address, tokenIn.decimals, tokenIn.symbol);
                    currencyOut = new sdkCore.Token(tokenOut.chainId, tokenOut.address, tokenOut.decimals, tokenOut.symbol);
                    baseCurrency = type === 'exactIn' ? currencyIn : currencyOut;
                    quoteCurrency = type === 'exactIn' ? currencyOut : currencyIn;
                    amount = sdkCore.CurrencyAmount.fromRawAmount(baseCurrency, JSBI__default["default"].BigInt(amountRaw));
                    return [4 /*yield*/, router.route(amount, quoteCurrency, type === 'exactIn' ? sdkCore.TradeType.EXACT_INPUT : sdkCore.TradeType.EXACT_OUTPUT, 
                        /*swapConfig=*/ undefined, alphaRouterConfig)];
                case 1:
                    swapRoute = _b.sent();
                    if (!swapRoute)
                        throw new Error('Failed to generate client side quote');
                    return [2 /*return*/, { data: transformSwapRouteToGetQuoteResult(type, amount, swapRoute) }];
            }
        });
    });
}

var index = /*#__PURE__*/Object.freeze({
    __proto__: null,
    getQuote: getQuote
});

exports.Swap = Swap;
//# sourceMappingURL=snowflake.js.map
