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

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var EthQuery = require('eth-query');

var pify = require('pify');

var SafeEventEmitter = require('safe-event-emitter');

var sec = 1000;

var calculateSum = function calculateSum(accumulator, currentValue) {
  return accumulator + currentValue;
};

var blockTrackerEvents = ['sync', 'latest'];

var BaseBlockTracker =
/*#__PURE__*/
function (_SafeEventEmitter) {
  _inherits(BaseBlockTracker, _SafeEventEmitter);

  //
  // public
  //
  function BaseBlockTracker() {
    var _this;

    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, BaseBlockTracker);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(BaseBlockTracker).call(this)); // config

    _this._blockResetDuration = opts.blockResetDuration || 20 * sec; // state

    _this._blockResetTimeout;
    _this._currentBlock = null;
    _this._isRunning = false; // bind functions for internal use

    _this._onNewListener = _this._onNewListener.bind(_assertThisInitialized(_this));
    _this._onRemoveListener = _this._onRemoveListener.bind(_assertThisInitialized(_this));
    _this._resetCurrentBlock = _this._resetCurrentBlock.bind(_assertThisInitialized(_this)); // listen for handler changes

    _this._setupInternalEvents();

    return _this;
  }

  _createClass(BaseBlockTracker, [{
    key: "isRunning",
    value: function isRunning() {
      return this._isRunning;
    }
  }, {
    key: "getCurrentBlock",
    value: function getCurrentBlock() {
      return this._currentBlock;
    }
  }, {
    key: "getLatestBlock",
    value: function () {
      var _getLatestBlock = _asyncToGenerator(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee() {
        var _this2 = this;

        var latestBlock;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!this._currentBlock) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt("return", this._currentBlock);

              case 2:
                _context.next = 4;
                return new Promise(function (resolve) {
                  return _this2.once('latest', resolve);
                });

              case 4:
                latestBlock = _context.sent;
                return _context.abrupt("return", latestBlock);

              case 6:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function getLatestBlock() {
        return _getLatestBlock.apply(this, arguments);
      }

      return getLatestBlock;
    }() // dont allow module consumer to remove our internal event listeners

  }, {
    key: "removeAllListeners",
    value: function removeAllListeners(eventName) {
      // perform default behavior, preserve fn arity
      if (eventName) {
        _get(_getPrototypeOf(BaseBlockTracker.prototype), "removeAllListeners", this).call(this, eventName);
      } else {
        _get(_getPrototypeOf(BaseBlockTracker.prototype), "removeAllListeners", this).call(this);
      } // re-add internal events


      this._setupInternalEvents(); // trigger stop check just in case


      this._onRemoveListener();
    } //
    // to be implemented in subclass
    //

  }, {
    key: "_start",
    value: function _start() {// default behavior is noop
    }
  }, {
    key: "_end",
    value: function _end() {} // default behavior is noop
    //
    // private
    //

  }, {
    key: "_setupInternalEvents",
    value: function _setupInternalEvents() {
      // first remove listeners for idempotence
      this.removeListener('newListener', this._onNewListener);
      this.removeListener('removeListener', this._onRemoveListener); // then add them

      this.on('newListener', this._onNewListener);
      this.on('removeListener', this._onRemoveListener);
    }
  }, {
    key: "_onNewListener",
    value: function _onNewListener(eventName, handler) {
      // `newListener` is called *before* the listener is added
      if (!blockTrackerEvents.includes(eventName)) return;

      this._maybeStart();
    }
  }, {
    key: "_onRemoveListener",
    value: function _onRemoveListener(eventName, handler) {
      // `removeListener` is called *after* the listener is removed
      if (this._getBlockTrackerEventCount() > 0) return;

      this._maybeEnd();
    }
  }, {
    key: "_maybeStart",
    value: function _maybeStart() {
      if (this._isRunning) return;
      this._isRunning = true; // cancel setting latest block to stale

      this._cancelBlockResetTimeout();

      this._start();
    }
  }, {
    key: "_maybeEnd",
    value: function _maybeEnd() {
      if (!this._isRunning) return;
      this._isRunning = false;

      this._setupBlockResetTimeout();

      this._end();
    }
  }, {
    key: "_getBlockTrackerEventCount",
    value: function _getBlockTrackerEventCount() {
      var _this3 = this;

      return blockTrackerEvents.map(function (eventName) {
        return _this3.listenerCount(eventName);
      }).reduce(calculateSum);
    }
  }, {
    key: "_newPotentialLatest",
    value: function _newPotentialLatest(newBlock) {
      var currentBlock = this._currentBlock; // only update if blok number is higher

      if (currentBlock && hexToInt(newBlock) <= hexToInt(currentBlock)) return;

      this._setCurrentBlock(newBlock);
    }
  }, {
    key: "_setCurrentBlock",
    value: function _setCurrentBlock(newBlock) {
      var oldBlock = this._currentBlock;
      this._currentBlock = newBlock;
      this.emit('latest', newBlock);
      this.emit('sync', {
        oldBlock: oldBlock,
        newBlock: newBlock
      });
    }
  }, {
    key: "_setupBlockResetTimeout",
    value: function _setupBlockResetTimeout() {
      // clear any existing timeout
      this._cancelBlockResetTimeout(); // clear latest block when stale


      this._blockResetTimeout = setTimeout(this._resetCurrentBlock, this._blockResetDuration); // nodejs - dont hold process open

      if (this._blockResetTimeout.unref) {
        this._blockResetTimeout.unref();
      }
    }
  }, {
    key: "_cancelBlockResetTimeout",
    value: function _cancelBlockResetTimeout() {
      clearTimeout(this._blockResetTimeout);
    }
  }, {
    key: "_resetCurrentBlock",
    value: function _resetCurrentBlock() {
      this._currentBlock = null;
    }
  }]);

  return BaseBlockTracker;
}(SafeEventEmitter);

module.exports = BaseBlockTracker;

function hexToInt(hexInt) {
  return Number.parseInt(hexInt, 16);
}