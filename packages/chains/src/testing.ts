// Test-only helpers we want to use directly in other packages.
// Not the best long-term, we'll merge this w/ the rest later on.
export {
  concat,
  createTestClient,
  // We already have `encodeFunctionData` in `createUtilities`,
  // but we want something viem specific just for testing until
  // we make sure "create" can be forced to viem in tests.
  encodeFunctionData as viemEncodeFunctionData,
  keccak256,
  publicActions,
  toHex,
  walletActions,
} from 'viem'
