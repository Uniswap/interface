/* Shared helpers for the embedded wallet EIP-1193 provider. */

// JSON.stringify does not handle BigInts, so we need to convert them to strings
export const safeJSONStringify = (param: any): string => {
  return JSON.stringify(
    param,
    // oxlint-disable-next-line typescript/no-unsafe-return -- biome-parity: oxlint is stricter here
    (_, value) => (typeof value === 'bigint' ? value.toString() : value), // return everything else unchanged
  )
}

export const NoWalletFoundError = new Error('Attempted embedded wallet function with no embedded wallet connected')
