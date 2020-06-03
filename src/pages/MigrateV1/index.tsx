import { Fraction, JSBI, Token, TokenAmount } from '@uniswap/sdk'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import { ArrowLeft } from 'react-feather'
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
import { useWalletModalToggle } from '../../state/application/hooks'
import { useTokenBalances } from '../../state/wallet/hooks'
import { TYPE } from '../../theme'
import { GreyCard } from '../../components/Card'
import { BodyWrapper } from '../AppBody'
import { EmptyState } from './EmptyState'

const POOL_TOKEN_AMOUNT_MIN = new Fraction(JSBI.BigInt(1), JSBI.BigInt(1000000))

export function FormattedPoolTokenAmount({ tokenAmount }: { tokenAmount: TokenAmount }) {
  return (
    <>
      {tokenAmount.equalTo(JSBI.BigInt(0))
        ? '0'
        : tokenAmount.greaterThan(POOL_TOKEN_AMOUNT_MIN)
        ? tokenAmount.toSignificant(6)
        : `<${POOL_TOKEN_AMOUNT_MIN.toSignificant(1)}`}
    </>
  )
}

export default function MigrateV1({ history }: RouteComponentProps) {
  const { account, chainId } = useActiveWeb3React()
  const allV1Exchanges = useAllTokenV1Exchanges()

  const v1LiquidityTokens: Token[] = useMemo(() => {
    return Object.keys(allV1Exchanges).map(exchangeAddress => new Token(chainId, exchangeAddress, 18))
  }, [chainId, allV1Exchanges])

  const v1LiquidityBalances = useTokenBalances(account, v1LiquidityTokens)

  const [tokenSearch, setTokenSearch] = useState<string>('')
  const handleTokenSearchChange = useCallback(e => setTokenSearch(e.target.value), [setTokenSearch])

  const searchedToken: Token | undefined = useTokenByAddressAndAutomaticallyAdd(tokenSearch)

  const unmigratedLiquidityExchangeAddresses: TokenAmount[] = useMemo(
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

  const toggleWalletModal = useWalletModalToggle()

  const handleBackClick = useCallback(() => {
    history.push('/pool')
  }, [history])

  return (
    <BodyWrapper style={{ maxWidth: 450, padding: 24 }}>
      <AutoColumn gap="24px">
        <AutoRow style={{ justifyContent: 'space-between' }}>
          <div>
            <ArrowLeft style={{ cursor: 'pointer' }} onClick={handleBackClick} />
          </div>
          <TYPE.largeHeader>Migrate Liquidity</TYPE.largeHeader>
          <div></div>
        </AutoRow>
        <GreyCard style={{ marginTop: '0', padding: 0, display: 'inline-block' }}>
          <TYPE.main style={{ lineHeight: '140%' }}>
            For each pool, approve the migration helper and click migrate liquidity. Your liquidity will be withdrawn
            from Uniswap V1 and deposited into Uniswap V2.
          </TYPE.main>
          <TYPE.black padding={'1rem 0 0 0'} style={{ lineHeight: '140%' }}>
            If your liquidity does not appear below automatically, you may need to find it by pasting the token address
            into the search box below.
          </TYPE.black>
        </GreyCard>
        <AutoRow>
          <SearchInput
            value={tokenSearch}
            onChange={handleTokenSearchChange}
            placeholder="Find liquidity by pasting a token address."
          />
        </AutoRow>

        {unmigratedLiquidityExchangeAddresses.map(poolTokenAmount => (
          <div
            key={poolTokenAmount.token.address}
            style={{ borderRadius: '20px', padding: 16, backgroundColor: theme.bg2 }}
          >
            <AutoRow style={{ justifyContent: 'space-between' }}>
              <AutoRow style={{ justifyContent: 'flex-start', width: 'fit-content' }}>
                <TokenLogo size="32px" address={allV1Exchanges[poolTokenAmount.token.address].address} />{' '}
                <div style={{ marginLeft: '.75rem' }}>
                  <TYPE.main fontWeight={600}>
                    <FormattedPoolTokenAmount tokenAmount={poolTokenAmount} />
                  </TYPE.main>
                  <TYPE.main fontWeight={500}>
                    {allV1Exchanges[poolTokenAmount.token.address].symbol} Pool Tokens
                  </TYPE.main>
                </div>
              </AutoRow>
              <div>
                <ButtonPrimary
                  onClick={() => {
                    history.push(`/migrate/v1/${poolTokenAmount.token.address}`)
                  }}
                  style={{ padding: '8px 12px', borderRadius: '12px' }}
                >
                  Migrate
                </ButtonPrimary>
              </div>
            </AutoRow>
          </div>
        ))}

        {account && unmigratedLiquidityExchangeAddresses.length === 0 ? (
          <EmptyState message="No V1 Liquidity found." />
        ) : null}

        {!account ? <ButtonPrimary onClick={toggleWalletModal}>Connect to a wallet</ButtonPrimary> : null}
      </AutoColumn>
    </BodyWrapper>
  )
}
