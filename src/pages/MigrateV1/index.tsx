import { JSBI, Token } from '@uniswap/sdk'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import { RouteComponentProps } from 'react-router'
import { ThemeContext } from 'styled-components'
import { ButtonPrimary } from '../../components/Button'
import { AutoColumn } from '../../components/Column'
import { AutoRow } from '../../components/Row'
import { SearchInput } from '../../components/SearchModal/styleds'
import TokenLogo from '../../components/TokenLogo'
import { useAllTokenV1Exchanges } from '../../data/V1'
import { useActiveWeb3React } from '../../hooks'
import { useTokenByAddressAndAutomaticallyAdd } from '../../hooks/Tokens'
import { useTokenBalances } from '../../state/wallet/hooks'
import { TYPE } from '../../theme'

export default function MigrateV1({ history }: RouteComponentProps) {
  const { account, chainId } = useActiveWeb3React()
  const allV1Exchanges = useAllTokenV1Exchanges()

  const v1LiquidityTokens: Token[] = useMemo(() => {
    return Object.keys(allV1Exchanges).map(exchangeAddress => new Token(chainId, exchangeAddress, 18))
  }, [chainId, allV1Exchanges])

  const v1LiquidityBalances = useTokenBalances(account, v1LiquidityTokens)

  const [tokenSearch, setTokenSearch] = useState<string>('')
  const handleTokenSearchChange = useCallback(e => setTokenSearch(e.target.value), [setTokenSearch])

  const searchedToken = useTokenByAddressAndAutomaticallyAdd(tokenSearch)

  const unmigratedLiquidityExchangeAddresses = useMemo(
    () =>
      Object.keys(v1LiquidityBalances)
        .filter(tokenAddress =>
          v1LiquidityBalances[tokenAddress]
            ? JSBI.greaterThan(v1LiquidityBalances[tokenAddress]?.raw, JSBI.BigInt(0))
            : false
        )
        .map(tokenAddress => v1LiquidityBalances[tokenAddress])
        .sort((a1, a2) => {
          if (searchedToken) {
            if (allV1Exchanges[a1.token.address].address === searchedToken.address) return -1
            if (allV1Exchanges[a2.token.address].address === searchedToken.address) return 1
          }
          return a1.token.address < a2.token.address ? -1 : 1
        }),
    [allV1Exchanges, searchedToken, v1LiquidityBalances]
  )

  const theme = useContext(ThemeContext)

  return (
    <div style={{ width: '100%', maxWidth: 560, padding: 16 }}>
      <AutoColumn gap="24px" style={{ padding: 24, backgroundColor: theme.bg1, borderRadius: 12 }}>
        <AutoRow style={{ justifyContent: 'space-between' }}>
          <TYPE.largeHeader>Your Uniswap V1 Liquidity</TYPE.largeHeader>
          <TYPE.subHeader>
            {unmigratedLiquidityExchangeAddresses?.length} pool
            {unmigratedLiquidityExchangeAddresses?.length === 1 ? '' : 's'} found
          </TYPE.subHeader>
        </AutoRow>
        <AutoRow>
          <SearchInput
            value={tokenSearch}
            onChange={handleTokenSearchChange}
            placeholder="Don't see your liquidity? Enter a token address here."
          />
        </AutoRow>

        {unmigratedLiquidityExchangeAddresses?.map(amount => (
          <div key={amount.token.address} style={{ borderRadius: '0.5rem', padding: 16, backgroundColor: theme.bg3 }}>
            <AutoRow style={{ justifyContent: 'space-between' }}>
              <div>
                <TokenLogo size="24px" address={allV1Exchanges[amount.token.address].address} />
              </div>
              <TYPE.mediumHeader fontWeight={400}>
                {v1LiquidityBalances[amount.token.address]?.toSignificant(6)}{' '}
                {allV1Exchanges[amount.token.address].symbol} Pool Tokens
              </TYPE.mediumHeader>
              <div>
                <ButtonPrimary
                  onClick={() => {
                    history.push(`/migrate/v1/${amount.token.address}`)
                  }}
                  style={{ padding: '8px 12px', borderRadius: '12px' }}
                >
                  Migrate
                </ButtonPrimary>
              </div>
            </AutoRow>
          </div>
        ))}
      </AutoColumn>
    </div>
  )
}
