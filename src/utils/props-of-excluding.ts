import React from 'react'

/**
 * Helper type that returns the props type of another component, excluding
 * any of the keys passed as the optional second argument.
 */
type PropsOfExcluding<TComponent, TExcludingProps = void> = TComponent extends React.ComponentType<infer P>
  ? TExcludingProps extends string | number | symbol
    ? Omit<P, TExcludingProps>
    : P
  : unknown

export default PropsOfExcluding
