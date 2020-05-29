import { JSBI, Token } from '@uniswap/sdk'
import React, { useMemo } from 'react'
import { RouteComponentProps } from 'react-router'
import { useAllV1ExchangeAddresses } from '../../data/V1'
import { useActiveWeb3React } from '../../hooks'
import { useTokenBalances } from '../../state/wallet/hooks'

const PLACEHOLDER_ACCOUNT = (
  <div>
    <h1>You must connect a wallet to use this tool.</h1>
  </div>
)

/**
 * Page component for migrating liquidity from V1
 */
export default function MigrateV1({}: RouteComponentProps) {
  const { account, chainId } = useActiveWeb3React()
  const v1ExchangeAddresses = useAllV1ExchangeAddresses()

  const v1ExchangeTokens: Token[] = useMemo(() => {
    return v1ExchangeAddresses.map(exchangeAddress => new Token(chainId, exchangeAddress, 18))
  }, [chainId, v1ExchangeAddresses])

  const tokenBalances = useTokenBalances(account, v1ExchangeTokens)

  const unmigratedExchangeAddresses = useMemo(
    () =>
      Object.keys(tokenBalances).filter(tokenAddress =>
        tokenBalances[tokenAddress] ? JSBI.greaterThan(tokenBalances[tokenAddress]?.raw, JSBI.BigInt(0)) : false
      ),
    [tokenBalances]
  )

  if (!account) {
    return PLACEHOLDER_ACCOUNT
  }

  return <div>{unmigratedExchangeAddresses?.join('\n')}</div>
}
