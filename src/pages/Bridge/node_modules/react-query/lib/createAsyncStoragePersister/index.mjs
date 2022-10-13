import { asyncThrottle } from "./asyncThrottle.mjs";
import { noop } from "../core/utils.mjs";
export const createAsyncStoragePersister = ({
  storage,
  key = "REACT_QUERY_OFFLINE_CACHE",
  throttleTime = 1000,
  serialize = JSON.stringify,
  deserialize = JSON.parse,
  retry
}) => {
  if (typeof storage !== 'undefined') {
    const trySave = async persistedClient => {
      try {
        await storage.setItem(key, serialize(persistedClient));
      } catch (error) {
        return error;
      }
    };

    return {
      persistClient: asyncThrottle(async persistedClient => {
        let client = persistedClient;
        let error = await trySave(client);
        let errorCount = 0;

        while (error && client) {
          errorCount++;
          client = await (retry == null ? void 0 : retry({
            persistedClient: client,
            error,
            errorCount
          }));

          if (client) {
            error = await trySave(client);
          }
        }
      }, {
        interval: throttleTime
      }),
      restoreClient: async () => {
        const cacheString = await storage.getItem(key);

        if (!cacheString) {
          return;
        }

        return deserialize(cacheString);
      },
      removeClient: () => storage.removeItem(key)
    };
  }

  return {
    persistClient: noop,
    restoreClient: noop,
    removeClient: noop
  };
};