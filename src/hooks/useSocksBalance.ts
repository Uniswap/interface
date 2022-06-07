import { Token } from '@uniswap/sdk-core'
import { SOCKS_CONTROLLER_ADDRESSES } from 'constants/addresses'
import { SupportedChainId } from 'constants/chains'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useMemo } from 'react'
import { useTokenBalance } from 'state/wallet/hooks'

// technically a 721, not an ERC20, but suffices for our purposes
const SOCKS = new Token(SupportedChainId.MAINNET, SOCKS_CONTROLLER_ADDRESSES[SupportedChainId.MAINNET], 0)

export function useHasSocks(): boolean | undefined {
  const { account, chainId } = useActiveWeb3React()

  const balance = useTokenBalance(account ?? undefined, chainId === SupportedChainId.MAINNET ? SOCKS : undefined)

  return useMemo(() => Boolean(balance?.greaterThan(0)), [balance])
}
