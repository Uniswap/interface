// @flow strict
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  createPopper as defaultCreatePopper,
  type Options as PopperOptions,
  type VirtualElement,
  type State as PopperState,
  type Instance as PopperInstance,
} from '@popperjs/core';
import isEqual from 'react-fast-compare';
import { fromEntries, useIsomorphicLayoutEffect } from './utils';

type Options = $Shape<{
  ...PopperOptions,
  createPopper: typeof defaultCreatePopper,
}>;

type Styles = {
  [key: string]: $Shape<CSSStyleDeclaration>,
};

type Attributes = {
  [key: string]: { [key: string]: string },
};

type State = {
  styles: Styles,
  attributes: Attributes,
};

const EMPTY_MODIFIERS = [];

type UsePopperResult = $ReadOnly<{
  state: ?PopperState,
  styles: Styles,
  attributes: Attributes,
  update: ?$PropertyType<PopperInstance, 'update'>,
  forceUpdate: ?$PropertyType<PopperInstance, 'forceUpdate'>,
}>;

export const usePopper = (
  referenceElement: ?(Element | VirtualElement),
  popperElement: ?HTMLElement,
  options: Options = {}
): UsePopperResult => {
  const prevOptions = React.useRef<?PopperOptions>(null);

  const optionsWithDefaults = {
    onFirstUpdate: options.onFirstUpdate,
    placement: options.placement || 'bottom',
    strategy: options.strategy || 'absolute',
    modifiers: options.modifiers || EMPTY_MODIFIERS,
  };

  const [state, setState] = React.useState<State>({
    styles: {
      popper: {
        position: optionsWithDefaults.strategy,
        left: '0',
        top: '0',
      },
      arrow: {
        position: 'absolute',
      },
    },
    attributes: {},
  });

  const updateStateModifier = React.useMemo(
    () => ({
      name: 'updateState',
      enabled: true,
      phase: 'write',
      fn: ({ state }) => {
        const elements = Object.keys(state.elements);

        ReactDOM.flushSync(() => {
          setState({
            styles: fromEntries(
              elements.map((element) => [element, state.styles[element] || {}])
            ),
            attributes: fromEntries(
              elements.map((element) => [element, state.attributes[element]])
            ),
          });
        });
      },
      requires: ['computeStyles'],
    }),
    []
  );

  const popperOptions = React.useMemo(() => {
    const newOptions = {
      onFirstUpdate: optionsWithDefaults.onFirstUpdate,
      placement: optionsWithDefaults.placement,
      strategy: optionsWithDefaults.strategy,
      modifiers: [
        ...optionsWithDefaults.modifiers,
        updateStateModifier,
        { name: 'applyStyles', enabled: false },
      ],
    };

    if (isEqual(prevOptions.current, newOptions)) {
      return prevOptions.current || newOptions;
    } else {
      prevOptions.current = newOptions;
      return newOptions;
    }
  }, [
    optionsWithDefaults.onFirstUpdate,
    optionsWithDefaults.placement,
    optionsWithDefaults.strategy,
    optionsWithDefaults.modifiers,
    updateStateModifier,
  ]);

  const popperInstanceRef = React.useRef();

  useIsomorphicLayoutEffect(() => {
    if (popperInstanceRef.current) {
      popperInstanceRef.current.setOptions(popperOptions);
    }
  }, [popperOptions]);

  useIsomorphicLayoutEffect(() => {
    if (referenceElement == null || popperElement == null) {
      return;
    }

    const createPopper = options.createPopper || defaultCreatePopper;
    const popperInstance = createPopper(
      referenceElement,
      popperElement,
      popperOptions
    );

    popperInstanceRef.current = popperInstance;

    return () => {
      popperInstance.destroy();
      popperInstanceRef.current = null;
    };
  }, [referenceElement, popperElement, options.createPopper]);

  return {
    state: popperInstanceRef.current ? popperInstanceRef.current.state : null,
    styles: state.styles,
    attributes: state.attributes,
    update: popperInstanceRef.current ? popperInstanceRef.current.update : null,
    forceUpdate: popperInstanceRef.current
      ? popperInstanceRef.current.forceUpdate
      : null,
  };
};
