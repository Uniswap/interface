"use strict";

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var pify = require('pify');

var BaseBlockTracker = require('./base');

var sec = 1000;

var PollingBlockTracker =
/*#__PURE__*/
function (_BaseBlockTracker) {
  _inherits(PollingBlockTracker, _BaseBlockTracker);

  function PollingBlockTracker() {
    var _this;

    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, PollingBlockTracker);

    // parse + validate args
    if (!opts.provider) throw new Error('PollingBlockTracker - no provider specified.');
    var pollingInterval = opts.pollingInterval || 20 * sec;
    var retryTimeout = opts.retryTimeout || pollingInterval / 10;
    var keepEventLoopActive = opts.keepEventLoopActive !== undefined ? opts.keepEventLoopActive : true;
    var setSkipCacheFlag = opts.setSkipCacheFlag || false; // BaseBlockTracker constructor

    _this = _possibleConstructorReturn(this, _getPrototypeOf(PollingBlockTracker).call(this, Object.assign({
      blockResetDuration: pollingInterval
    }, opts))); // config

    _this._provider = opts.provider;
    _this._pollingInterval = pollingInterval;
    _this._retryTimeout = retryTimeout;
    _this._keepEventLoopActive = keepEventLoopActive;
    _this._setSkipCacheFlag = setSkipCacheFlag;
    return _this;
  } //
  // public
  //
  // trigger block polling


  _createClass(PollingBlockTracker, [{
    key: "checkForLatestBlock",
    value: function () {
      var _checkForLatestBlock = _asyncToGenerator(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee() {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this._updateLatestBlock();

              case 2:
                _context.next = 4;
                return this.getLatestBlock();

              case 4:
                return _context.abrupt("return", _context.sent);

              case 5:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function checkForLatestBlock() {
        return _checkForLatestBlock.apply(this, arguments);
      }

      return checkForLatestBlock;
    }() //
    // private
    //

  }, {
    key: "_start",
    value: function _start() {
      var _this2 = this;

      this._performSync()["catch"](function (err) {
        return _this2.emit('error', err);
      });
    }
  }, {
    key: "_performSync",
    value: function () {
      var _performSync2 = _asyncToGenerator(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee2() {
        var newErr;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!this._isRunning) {
                  _context2.next = 16;
                  break;
                }

                _context2.prev = 1;
                _context2.next = 4;
                return this._updateLatestBlock();

              case 4:
                _context2.next = 6;
                return timeout(this._pollingInterval, !this._keepEventLoopActive);

              case 6:
                _context2.next = 14;
                break;

              case 8:
                _context2.prev = 8;
                _context2.t0 = _context2["catch"](1);
                newErr = new Error("PollingBlockTracker - encountered an error while attempting to update latest block:\n".concat(_context2.t0.stack));

                try {
                  this.emit('error', newErr);
                } catch (emitErr) {
                  console.error(newErr);
                }

                _context2.next = 14;
                return timeout(this._retryTimeout, !this._keepEventLoopActive);

              case 14:
                _context2.next = 0;
                break;

              case 16:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this, [[1, 8]]);
      }));

      function _performSync() {
        return _performSync2.apply(this, arguments);
      }

      return _performSync;
    }()
  }, {
    key: "_updateLatestBlock",
    value: function () {
      var _updateLatestBlock2 = _asyncToGenerator(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee3() {
        var latestBlock;
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this._fetchLatestBlock();

              case 2:
                latestBlock = _context3.sent;

                this._newPotentialLatest(latestBlock);

              case 4:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function _updateLatestBlock() {
        return _updateLatestBlock2.apply(this, arguments);
      }

      return _updateLatestBlock;
    }()
  }, {
    key: "_fetchLatestBlock",
    value: function () {
      var _fetchLatestBlock2 = _asyncToGenerator(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee4() {
        var _this3 = this;

        var req, res;
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                req = {
                  jsonrpc: "2.0",
                  id: 1,
                  method: 'eth_blockNumber',
                  params: []
                };
                if (this._setSkipCacheFlag) req.skipCache = true;
                _context4.next = 4;
                return pify(function (cb) {
                  return _this3._provider.sendAsync(req, cb);
                })();

              case 4:
                res = _context4.sent;

                if (!res.error) {
                  _context4.next = 7;
                  break;
                }

                throw new Error("PollingBlockTracker - encountered error fetching block:\n".concat(res.error));

              case 7:
                return _context4.abrupt("return", res.result);

              case 8:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function _fetchLatestBlock() {
        return _fetchLatestBlock2.apply(this, arguments);
      }

      return _fetchLatestBlock;
    }()
  }]);

  return PollingBlockTracker;
}(BaseBlockTracker);

module.exports = PollingBlockTracker;

function timeout(duration, unref) {
  return new Promise(function (resolve) {
    var timoutRef = setTimeout(resolve, duration); // don't keep process open

    if (timoutRef.unref && unref) {
      timoutRef.unref();
    }
  });
}