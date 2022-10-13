"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Portal = void 0;
var _react = require("react");
var _reactDom = require("react-dom");
const Portal = ({ children , type  })=>{
    const [portalNode, setPortalNode] = (0, _react).useState(null);
    (0, _react).useEffect(()=>{
        const element = document.createElement(type);
        document.body.appendChild(element);
        setPortalNode(element);
        return ()=>{
            document.body.removeChild(element);
        };
    }, [
        type
    ]);
    return portalNode ? /*#__PURE__*/ (0, _reactDom).createPortal(children, portalNode) : null;
};
exports.Portal = Portal;

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  Object.assign(exports.default, exports);
  module.exports = exports.default;
}

//# sourceMappingURL=index.js.map