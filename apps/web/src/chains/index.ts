import { createTransactions, createUtilities } from '@universe/chains'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'

const ctx = { getViemEnabled: () => getFeatureFlag(FeatureFlags.ViemEnabled) }

export const {
  decodeFunctionResult,
  encodeFunctionData,
  formatUnits,
  getAddress,
  isAddress,
  namehash,
  parseEther,
  parseUnits,
  toBigInt,
  zeroAddress,
} = createUtilities(ctx)
export const { signTypedData } = createTransactions(ctx)

export type { Abi, Address, Block, Hash, SignableMessage } from '@universe/chains'
export { erc20Abi, erc20Abi_bytes32, erc721Abi } from '@universe/chains'
