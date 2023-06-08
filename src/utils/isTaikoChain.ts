import { ChainId } from '@uniswap/sdk'

export default function isTaikoChain(chainId?: number): boolean {
  return [ChainId.TAIKO, ChainId.TAIKO_TESTNET, ChainId.TAIKO_INTERNAL_1].includes(chainId as ChainId)
}
