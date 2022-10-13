// @flow strict
import * as React from 'react';

export const ManagerReferenceNodeContext: React.Context<?Element>  = React.createContext();
export const ManagerReferenceNodeSetterContext: React.Context<
  void | ((?Element) => void)
> = React.createContext();

export type ManagerProps = $ReadOnly<{
  children: React.Node,
}>;

export function Manager({ children }: ManagerProps): React.Node {
  const [referenceNode, setReferenceNode] = React.useState<?Element>(null);

  const hasUnmounted = React.useRef(false);
  React.useEffect(() => {
    return () => {
      hasUnmounted.current = true;
    };
  }, []);

  const handleSetReferenceNode = React.useCallback((node) => {
    if (!hasUnmounted.current) {
      setReferenceNode(node);
    }
  }, []);

  return (
    <ManagerReferenceNodeContext.Provider value={referenceNode}>
      <ManagerReferenceNodeSetterContext.Provider
        value={handleSetReferenceNode}
      >
        {children}
      </ManagerReferenceNodeSetterContext.Provider>
    </ManagerReferenceNodeContext.Provider>
  );
}
