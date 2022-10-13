import React from 'react';
import { useTheme } from "./theme.mjs";
import useMediaQuery from "./useMediaQuery.mjs";
export const isServer = typeof window === 'undefined';
export function getQueryStatusColor({
  queryState,
  observerCount,
  isStale,
  theme
}) {
  return queryState.fetchStatus === 'fetching' ? theme.active : !observerCount ? theme.gray : queryState.fetchStatus === 'paused' ? theme.paused : isStale ? theme.warning : theme.success;
}
export function getQueryStatusLabel(query) {
  return query.state.fetchStatus === 'fetching' ? 'fetching' : !query.getObserversCount() ? 'inactive' : query.state.fetchStatus === 'paused' ? 'paused' : query.isStale() ? 'stale' : 'fresh';
}
export function styled(type, newStyles, queries = {}) {
  return /*#__PURE__*/React.forwardRef(({
    style,
    ...rest
  }, ref) => {
    const theme = useTheme();
    const mediaStyles = Object.entries(queries).reduce((current, [key, value]) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useMediaQuery(key) ? { ...current,
        ...(typeof value === 'function' ? value(rest, theme) : value)
      } : current;
    }, {});
    return /*#__PURE__*/React.createElement(type, { ...rest,
      style: { ...(typeof newStyles === 'function' ? newStyles(rest, theme) : newStyles),
        ...style,
        ...mediaStyles
      },
      ref
    });
  });
}
export function useIsMounted() {
  const mountedRef = React.useRef(false);
  const isMounted = React.useCallback(() => mountedRef.current, []);
  React[isServer ? 'useEffect' : 'useLayoutEffect'](() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  return isMounted;
}
/**
 * Displays a string regardless the type of the data
 * @param {unknown} value Value to be stringified
 */

export const displayValue = value => {
  const name = Object.getOwnPropertyNames(Object(value));
  const newValue = typeof value === 'bigint' ? value.toString() + "n" : value;
  return JSON.stringify(newValue, name);
};