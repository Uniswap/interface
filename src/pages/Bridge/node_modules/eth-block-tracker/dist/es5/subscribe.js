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

var EventEmitter = require('events');

var BaseBlockTracker = require('./base');

var createRandomId = require('json-rpc-random-id')();

var SubscribeBlockTracker =
/*#__PURE__*/
function (_BaseBlockTracker) {
  _inherits(SubscribeBlockTracker, _BaseBlockTracker);

  function SubscribeBlockTracker() {
    var _this;

    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, SubscribeBlockTracker);

    // parse + validate args
    if (!opts.provider) throw new Error('SubscribeBlockTracker - no provider specified.'); // BaseBlockTracker constructor

    _this = _possibleConstructorReturn(this, _getPrototypeOf(SubscribeBlockTracker).call(this, opts)); // config

    _this._provider = opts.provider;
    return _this;
  } //
  // public
  //


  _createClass(SubscribeBlockTracker, [{
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
                return this.getLatestBlock();

              case 2:
                return _context.abrupt("return", _context.sent);

              case 3:
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
    value: function () {
      var _start2 = _asyncToGenerator(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee2() {
        var blockNumber;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!(this._subscriptionId == null)) {
                  _context2.next = 15;
                  break;
                }

                _context2.prev = 1;
                _context2.next = 4;
                return this._call('eth_blockNumber');

              case 4:
                blockNumber = _context2.sent;
                _context2.next = 7;
                return this._call('eth_subscribe', 'newHeads', {});

              case 7:
                this._subscriptionId = _context2.sent;

                this._provider.on('data', this._handleSubData.bind(this));

                this._newPotentialLatest(blockNumber);

                _context2.next = 15;
                break;

              case 12:
                _context2.prev = 12;
                _context2.t0 = _context2["catch"](1);
                this.emit('error', _context2.t0);

              case 15:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this, [[1, 12]]);
      }));

      function _start() {
        return _start2.apply(this, arguments);
      }

      return _start;
    }()
  }, {
    key: "_end",
    value: function () {
      var _end2 = _asyncToGenerator(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee3() {
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (!(this._subscriptionId != null)) {
                  _context3.next = 10;
                  break;
                }

                _context3.prev = 1;
                _context3.next = 4;
                return this._call('eth_unsubscribe', this._subscriptionId);

              case 4:
                delete this._subscriptionId;
                _context3.next = 10;
                break;

              case 7:
                _context3.prev = 7;
                _context3.t0 = _context3["catch"](1);
                this.emit('error', _context3.t0);

              case 10:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this, [[1, 7]]);
      }));

      function _end() {
        return _end2.apply(this, arguments);
      }

      return _end;
    }()
  }, {
    key: "_call",
    value: function _call(method) {
      var _this2 = this;

      var params = Array.prototype.slice.call(arguments, 1);
      return new Promise(function (resolve, reject) {
        _this2._provider.sendAsync({
          id: createRandomId(),
          method: method,
          params: params,
          jsonrpc: "2.0"
        }, function (err, res) {
          if (err) reject(err);else resolve(res.result);
        });
      });
    }
  }, {
    key: "_handleSubData",
    value: function _handleSubData(err, data) {
      if (data.method === 'eth_subscription' && data.params.subscription === this._subscriptionId) {
        this._newPotentialLatest(data.params.result.number);
      }
    }
  }]);

  return SubscribeBlockTracker;
}(BaseBlockTracker);

module.exports = SubscribeBlockTracker;