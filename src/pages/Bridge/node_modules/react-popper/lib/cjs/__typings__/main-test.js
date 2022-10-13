"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Test = void 0;

var React = _interopRequireWildcard(require("react"));

var _ = require("..");

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

var Test = function Test() {
  var _React$createElement;

  return /*#__PURE__*/React.createElement(_.Manager, null, /*#__PURE__*/React.createElement(_.Reference, null), /*#__PURE__*/React.createElement(_.Reference, null, function (_ref) {
    var ref = _ref.ref;
    return /*#__PURE__*/React.createElement("div", {
      ref: ref
    });
  }), /*#__PURE__*/React.createElement(_.Popper // $FlowExpectError: should be one of allowed placements
  , (_React$createElement = {
    placement: "custom"
  }, _React$createElement["placement"] = "top", _React$createElement.strategy = "custom", _React$createElement["strategy"] = "fixed", _React$createElement.modifiers = [{
    name: 'flip',
    enabled: 'bar',
    order: 'foo'
  }], _React$createElement["modifiers"] = [{
    name: 'flip',
    enabled: false
  }], _React$createElement), function (_ref2) {
    var ref = _ref2.ref,
        style = _ref2.style,
        placement = _ref2.placement,
        isReferenceHidden = _ref2.isReferenceHidden,
        hasPopperEscaped = _ref2.hasPopperEscaped,
        update = _ref2.update,
        arrowProps = _ref2.arrowProps;
    return /*#__PURE__*/React.createElement("div", {
      ref: ref,
      style: _extends({}, style, {
        opacity: isReferenceHidden === true || hasPopperEscaped === true ? 0 : 1
      }),
      "data-placement": placement,
      onClick: function onClick() {
        return update();
      }
    }, "Popper", /*#__PURE__*/React.createElement("div", {
      ref: arrowProps.ref,
      style: arrowProps.style
    }));
  }), /*#__PURE__*/React.createElement(_.Popper, null, function (_ref3) {
    var ref = _ref3.ref,
        style = _ref3.style,
        placement = _ref3.placement;
    return /*#__PURE__*/React.createElement("div", {
      ref: ref,
      style: style,
      "data-placement": placement
    }, "Popper");
  }));
};

exports.Test = Test;