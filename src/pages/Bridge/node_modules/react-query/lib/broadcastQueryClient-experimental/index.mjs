import { BroadcastChannel } from 'broadcast-channel';
export function broadcastQueryClient({
  queryClient,
  broadcastChannel = 'react-query'
}) {
  let transaction = false;

  const tx = cb => {
    transaction = true;
    cb();
    transaction = false;
  };

  const channel = new BroadcastChannel(broadcastChannel, {
    webWorkerSupport: false
  });
  const queryCache = queryClient.getQueryCache();
  queryClient.getQueryCache().subscribe(queryEvent => {
    if (transaction) {
      return;
    }

    const {
      query: {
        queryHash,
        queryKey,
        state
      }
    } = queryEvent;

    if (queryEvent.type === 'updated' && queryEvent.action.type === 'success') {
      channel.postMessage({
        type: 'updated',
        queryHash,
        queryKey,
        state
      });
    }

    if (queryEvent.type === 'removed') {
      channel.postMessage({
        type: 'removed',
        queryHash,
        queryKey
      });
    }
  });

  channel.onmessage = action => {
    if (!(action != null && action.type)) {
      return;
    }

    tx(() => {
      const {
        type,
        queryHash,
        queryKey,
        state
      } = action;

      if (type === 'updated') {
        const query = queryCache.get(queryHash);

        if (query) {
          query.setState(state);
          return;
        }

        queryCache.build(queryClient, {
          queryKey,
          queryHash
        }, state);
      } else if (type === 'removed') {
        const query = queryCache.get(queryHash);

        if (query) {
          queryCache.remove(query);
        }
      }
    });
  };
}