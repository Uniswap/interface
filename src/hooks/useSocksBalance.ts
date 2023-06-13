import { ChainId, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { SOCKS_CONTROLLER_ADDRESSES } from 'constants/addresses'
import { useMemo } from 'react'
import { useTokenBalance } from 'state/connection/hooks'

// technically a 721, not an ERC20, but suffices for our purposes
const SOCKS = new Token(ChainId.MAINNET, SOCKS_CONTROLLER_ADDRESSES[ChainId.MAINNET], 0)

export function useHasSocks(): boolean | undefined {
  const { account, chainId } = useWeb3React()

  const balance = useTokenBalance(account ?? undefined, chainId === ChainId.MAINNET ? SOCKS : undefined)

  return useMemo(() => Boolean(balance?.greaterThan(0)), [balance])
}
