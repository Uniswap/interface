import { JSBI, Token, TokenAmount } from '@uniswap/sdk'
import React, { useMemo } from 'react'
import { RouteComponentProps } from 'react-router'
import { useTotalSupply } from '../../data/TotalSupply'
import { useAllTokenV1ExchangeAddresses } from '../../data/V1'
import { useActiveWeb3React } from '../../hooks'
import { useTokenBalances } from '../../state/wallet/hooks'
import { TYPE } from '../../theme'

function V1PairMigration({ liquidityTokenAmount }: { liquidityTokenAmount: TokenAmount }) {
  const totalSupply = useTotalSupply(liquidityTokenAmount.token)

  return (
    <div>
      Exchange: {liquidityTokenAmount.token.address}; totalSupply: {totalSupply?.toSignificant(6)}; your amount:
      {liquidityTokenAmount.toSignificant(6)}
    </div>
  )
}

/**
 * Page component for migrating liquidity from V1
 */
export default function MigrateV1({}: RouteComponentProps) {
  const { account, chainId } = useActiveWeb3React()
  const userTokenV1ExchangeAddresses = useAllTokenV1ExchangeAddresses()

  const v1ExchangeTokens: Token[] = useMemo(() => {
    return userTokenV1ExchangeAddresses.map(exchangeAddress => new Token(chainId, exchangeAddress, 18))
  }, [chainId, userTokenV1ExchangeAddresses])

  const tokenBalances = useTokenBalances(account, v1ExchangeTokens)

  const unmigratedLiquidity = useMemo(
    () =>
      Object.keys(tokenBalances)
        .filter(tokenAddress =>
          tokenBalances[tokenAddress] ? JSBI.greaterThan(tokenBalances[tokenAddress]?.raw, JSBI.BigInt(0)) : false
        )
        .map(ta => tokenBalances[ta]),
    [tokenBalances]
  )

  return (
    <div>
      <div style={{ maxWidth: 600, padding: 15 }}>
        <TYPE.largeHeader>Uniswap V2 Migration</TYPE.largeHeader>
      </div>
      {unmigratedLiquidity?.map(amount => (
        <V1PairMigration key={amount.token.address} liquidityTokenAmount={amount} />
      ))}
    </div>
  )
}
