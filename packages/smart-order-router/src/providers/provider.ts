export type ProviderConfig = {
  /**
   * The block number to use when getting data on-chain.
   */
  blockNumber?: number | Promise<number>;
};

export type LocalCacheEntry<T> = {
  entry: T;
  blockNumber: number;
};
