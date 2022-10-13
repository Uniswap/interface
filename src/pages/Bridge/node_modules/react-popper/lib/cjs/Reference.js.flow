// @flow strict
import * as React from 'react';
import warning from 'warning';
import { ManagerReferenceNodeSetterContext } from './Manager';
import { safeInvoke, unwrapArray, setRef } from './utils';
import { type Ref } from './RefTypes';

export type ReferenceChildrenProps = $ReadOnly<{ ref: Ref }>;
export type ReferenceProps = $ReadOnly<{|
  children: (ReferenceChildrenProps) => React.Node,
  innerRef?: Ref,
|}>;

export function Reference({ children, innerRef }: ReferenceProps): React.Node {
  const setReferenceNode = React.useContext(ManagerReferenceNodeSetterContext);

  const refHandler = React.useCallback(
    (node: ?HTMLElement) => {
      setRef(innerRef, node);
      safeInvoke(setReferenceNode, node);
    },
    [innerRef, setReferenceNode]
  );

  // ran on unmount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => () => setRef(innerRef, null), []);

  React.useEffect(() => {
    warning(
      Boolean(setReferenceNode),
      '`Reference` should not be used outside of a `Manager` component.'
    );
  }, [setReferenceNode]);

  return unwrapArray(children)({ ref: refHandler });
}
