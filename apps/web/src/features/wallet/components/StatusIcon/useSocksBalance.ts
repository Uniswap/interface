import { SOCKS_CONTROLLER_ADDRESSES, Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { useAccount } from '~/connection/hooks/useAccount'
import { useTokenBalance } from '~/lib/hooks/useCurrencyBalance'

// technically a 721, not an ERC20, but suffices for our purposes
const SOCKS = new Token(UniverseChainId.Mainnet, SOCKS_CONTROLLER_ADDRESSES[UniverseChainId.Mainnet], 0)

export function useHasSocks(): boolean | undefined {
  const account = useAccount()

  const balance = useTokenBalance(account.address, account.chainId === UniverseChainId.Mainnet ? SOCKS : undefined)

  return useMemo(() => Boolean(balance?.greaterThan(0)), [balance])
}
