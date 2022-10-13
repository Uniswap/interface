// @flow strict
import * as React from 'react';
import {
  type State,
  type Placement,
  type PositioningStrategy,
  type VirtualElement,
  type StrictModifiers,
  type Modifier,
} from '@popperjs/core/lib';
import { ManagerReferenceNodeContext } from './Manager';
import type { Ref } from './RefTypes';
import { unwrapArray, setRef } from './utils';
import { usePopper } from './usePopper';

type ReferenceElement = ?(VirtualElement | HTMLElement);
type Modifiers = Array<StrictModifiers | $Shape<Modifier<string, {}>>>;

export type PopperArrowProps = {|
  ref: Ref,
  style: CSSStyleDeclaration,
|};
export type PopperChildrenProps = {|
  ref: Ref,
  style: CSSStyleDeclaration,

  placement: Placement,
  isReferenceHidden: ?boolean,
  hasPopperEscaped: ?boolean,

  update: () => Promise<null | $Shape<State>>,
  forceUpdate: () => void,
  arrowProps: PopperArrowProps,
|};
export type PopperChildren = (PopperChildrenProps) => React.Node;

export type PopperProps = $ReadOnly<{|
  children: PopperChildren,
  innerRef?: Ref,
  modifiers?: Modifiers,
  placement?: Placement,
  strategy?: PositioningStrategy,
  referenceElement?: ReferenceElement,
  onFirstUpdate?: ($Shape<State>) => void,
|}>;

const NOOP = () => void 0;
const NOOP_PROMISE = () => Promise.resolve(null);
const EMPTY_MODIFIERS = [];

export function Popper({
  placement = 'bottom',
  strategy = 'absolute',
  modifiers = EMPTY_MODIFIERS,
  referenceElement,
  onFirstUpdate,
  innerRef,
  children,
}: PopperProps): React.Node {
  const referenceNode = React.useContext(ManagerReferenceNodeContext);

  const [popperElement, setPopperElement] = React.useState(null);
  const [arrowElement, setArrowElement] = React.useState(null);

  React.useEffect(() => {
    setRef(innerRef, popperElement)
  }, [innerRef, popperElement]);

  const options = React.useMemo(
    () => ({
      placement,
      strategy,
      onFirstUpdate,
      modifiers: [
        ...modifiers,
        {
          name: 'arrow',
          enabled: arrowElement != null,
          options: { element: arrowElement },
        },
      ],
    }),
    [placement, strategy, onFirstUpdate, modifiers, arrowElement]
  );

  const { state, styles, forceUpdate, update } = usePopper(
    referenceElement || referenceNode,
    popperElement,
    options
  );

  const childrenProps = React.useMemo(
    () => ({
      ref: setPopperElement,
      style: styles.popper,
      placement: state ? state.placement : placement,
      hasPopperEscaped:
        state && state.modifiersData.hide
          ? state.modifiersData.hide.hasPopperEscaped
          : null,
      isReferenceHidden:
        state && state.modifiersData.hide
          ? state.modifiersData.hide.isReferenceHidden
          : null,
      arrowProps: {
        style: styles.arrow,
        ref: setArrowElement,
      },
      forceUpdate: forceUpdate || NOOP,
      update: update || NOOP_PROMISE,
    }),
    [
      setPopperElement,
      setArrowElement,
      placement,
      state,
      styles,
      update,
      forceUpdate,
    ]
  );

  return unwrapArray(children)(childrenProps);
}
