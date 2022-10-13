import { dehydrate, hydrate } from "../core/index.mjs";

/**
 * Restores persisted data to the QueryCache
 *  - data obtained from persister.restoreClient
 *  - data is hydrated using hydrateOptions
 * If data is expired, busted, empty, or throws, it runs persister.removeClient
 */
export async function persistQueryClientRestore({
  queryClient,
  persister,
  maxAge = 1000 * 60 * 60 * 24,
  buster = '',
  hydrateOptions
}) {
  try {
    const persistedClient = await persister.restoreClient();

    if (persistedClient) {
      if (persistedClient.timestamp) {
        const expired = Date.now() - persistedClient.timestamp > maxAge;
        const busted = persistedClient.buster !== buster;

        if (expired || busted) {
          persister.removeClient();
        } else {
          hydrate(queryClient, persistedClient.clientState, hydrateOptions);
        }
      } else {
        persister.removeClient();
      }
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      queryClient.getLogger().error(err);
      queryClient.getLogger().warn('Encountered an error attempting to restore client cache from persisted location. As a precaution, the persisted cache will be discarded.');
    }

    persister.removeClient();
  }
}
/**
 * Persists data from the QueryCache
 *  - data dehydrated using dehydrateOptions
 *  - data is persisted using persister.persistClient
 */

export async function persistQueryClientSave({
  queryClient,
  persister,
  buster = '',
  dehydrateOptions
}) {
  const persistClient = {
    buster,
    timestamp: Date.now(),
    clientState: dehydrate(queryClient, dehydrateOptions)
  };
  await persister.persistClient(persistClient);
}
/**
 * Subscribe to QueryCache and MutationCache updates (for persisting)
 * @returns an unsubscribe function (to discontinue monitoring)
 */

export function persistQueryClientSubscribe(props) {
  const unsubscribeQueryCache = props.queryClient.getQueryCache().subscribe(() => {
    persistQueryClientSave(props);
  });
  const unusbscribeMutationCache = props.queryClient.getMutationCache().subscribe(() => {
    persistQueryClientSave(props);
  });
  return () => {
    unsubscribeQueryCache();
    unusbscribeMutationCache();
  };
}
/**
 * Restores persisted data to QueryCache and persists further changes.
 */

export function persistQueryClient(props) {
  let hasUnsubscribed = false;
  let persistQueryClientUnsubscribe;

  const unsubscribe = () => {
    hasUnsubscribed = true;
    persistQueryClientUnsubscribe == null ? void 0 : persistQueryClientUnsubscribe();
  }; // Attempt restore


  const restorePromise = persistQueryClientRestore(props).then(() => {
    if (!hasUnsubscribed) {
      // Subscribe to changes in the query cache to trigger the save
      persistQueryClientUnsubscribe = persistQueryClientSubscribe(props);
    }
  });
  return [unsubscribe, restorePromise];
}