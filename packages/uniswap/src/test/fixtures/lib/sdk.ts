import { Token } from '@uniswap/sdk-core'
import { getWrappedNativeAddress } from 'uniswap/src/constants/addresses'
import { DEFAULT_NATIVE_ADDRESS_LEGACY } from 'uniswap/src/features/chains/evm/defaults'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export const ETH = new Token(UniverseChainId.Mainnet, DEFAULT_NATIVE_ADDRESS_LEGACY, 18, 'ETH', 'Ethereum')

export const WETH = new Token(
  UniverseChainId.Mainnet,
  getWrappedNativeAddress(UniverseChainId.Mainnet),
  18,
  'WETH',
  'Wrapped Ether',
)
