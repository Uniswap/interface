/** Second element of every wallet-scoped DataApi query key: `[cacheKey, WalletAddressKey, inputs]`. */
export type WalletAddressKey = { evmAddress?: string; svmAddress?: string }

export function buildWalletAddressKey(input: WalletAddressKey | undefined): WalletAddressKey {
  return {
    ...(input?.evmAddress && { evmAddress: input.evmAddress }),
    ...(input?.svmAddress && { svmAddress: input.svmAddress }),
  }
}
