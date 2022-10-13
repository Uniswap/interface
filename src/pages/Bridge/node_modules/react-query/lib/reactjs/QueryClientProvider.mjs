import React from 'react';
export const defaultContext = /*#__PURE__*/React.createContext(undefined);
const QueryClientSharingContext = /*#__PURE__*/React.createContext(false); // If we are given a context, we will use it.
// Otherwise, if contextSharing is on, we share the first and at least one
// instance of the context across the window
// to ensure that if React Query is used across
// different bundles or microfrontends they will
// all use the same **instance** of context, regardless
// of module scoping.

function getQueryClientContext(context, contextSharing) {
  if (context) {
    return context;
  }

  if (contextSharing && typeof window !== 'undefined') {
    if (!window.ReactQueryClientContext) {
      window.ReactQueryClientContext = defaultContext;
    }

    return window.ReactQueryClientContext;
  }

  return defaultContext;
}

export const useQueryClient = ({
  context
} = {}) => {
  const queryClient = React.useContext(getQueryClientContext(context, React.useContext(QueryClientSharingContext)));

  if (!queryClient) {
    throw new Error('No QueryClient set, use QueryClientProvider to set one');
  }

  return queryClient;
};
export const QueryClientProvider = ({
  client,
  children,
  context,
  contextSharing = false
}) => {
  React.useEffect(() => {
    client.mount();
    return () => {
      client.unmount();
    };
  }, [client]);
  const Context = getQueryClientContext(context, contextSharing);
  return /*#__PURE__*/React.createElement(QueryClientSharingContext.Provider, {
    value: !context && contextSharing
  }, /*#__PURE__*/React.createElement(Context.Provider, {
    value: client
  }, children));
};