import * as React from 'react';
import warning from 'warning';
import { ManagerReferenceNodeSetterContext } from './Manager';
import { safeInvoke, unwrapArray, setRef } from './utils';
export function Reference(_ref) {
  var children = _ref.children,
      innerRef = _ref.innerRef;
  var setReferenceNode = React.useContext(ManagerReferenceNodeSetterContext);
  var refHandler = React.useCallback(function (node) {
    setRef(innerRef, node);
    safeInvoke(setReferenceNode, node);
  }, [innerRef, setReferenceNode]); // ran on unmount
  // eslint-disable-next-line react-hooks/exhaustive-deps

  React.useEffect(function () {
    return function () {
      return setRef(innerRef, null);
    };
  }, []);
  React.useEffect(function () {
    warning(Boolean(setReferenceNode), '`Reference` should not be used outside of a `Manager` component.');
  }, [setReferenceNode]);
  return unwrapArray(children)({
    ref: refHandler
  });
}