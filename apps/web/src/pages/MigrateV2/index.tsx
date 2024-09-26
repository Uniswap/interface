import { getCreate2Address } from '@ethersproject/address'
import { keccak256, pack } from '@ethersproject/solidity'
import { Token, V2_FACTORY_ADDRESSES } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { LightCard } from 'components/Card/cards'
import MigrateSushiPositionCard from 'components/PositionCard/Sushi'
import MigrateV2PositionCard from 'components/PositionCard/V2'
import QuestionHelper from 'components/QuestionHelper'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { V2Unsupported } from 'components/V2Unsupported'
import { AutoColumn } from 'components/deprecated/Column'
import { AutoRow } from 'components/deprecated/Row'
import { Dots } from 'components/swap/styled'
import { useAccount } from 'hooks/useAccount'
import { useNetworkSupportsV2 } from 'hooks/useNetworkSupportsV2'
import { PairState, useV2Pairs } from 'hooks/useV2Pairs'
import { useRpcTokenBalancesWithLoadingIndicator } from 'lib/hooks/useCurrencyBalance'
import styled, { useTheme } from 'lib/styled-components'
import { BodyWrapper } from 'pages/App/AppBody'
import { ReactNode, useMemo } from 'react'
import { Text } from 'rebass'
import { toV2LiquidityToken, useTrackedTokenPairs } from 'state/user/hooks'
import { BackArrowLink, StyledInternalLink, ThemedText } from 'theme/components'
import { Trans } from 'uniswap/src/i18n'

export const MigrateHeader = styled(ThemedText.H1Small)`
  font-weight: 535;
`

function EmptyState({ message }: { message: ReactNode }) {
  return (
    <AutoColumn style={{ minHeight: 200, justifyContent: 'center', alignItems: 'center' }}>
      <ThemedText.DeprecatedBody>{message}</ThemedText.DeprecatedBody>
    </AutoColumn>
  )
}

// quick hack because sushi init code hash is different
const computeSushiPairAddress = ({ tokenA, tokenB }: { tokenA: Token; tokenB: Token }): string => {
  const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA] // does safety checks
  return getCreate2Address(
    '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
    keccak256(['bytes'], [pack(['address', 'address'], [token0.address, token1.address])]),
    '0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303',
  )
}

/**
 * Given two tokens return the sushiswap liquidity token that represents its liquidity shares
 * @param tokenA one of the two tokens
 * @param tokenB the other token
 */
function toSushiLiquidityToken([tokenA, tokenB]: [Token, Token]): Token {
  return new Token(tokenA.chainId, computeSushiPairAddress({ tokenA, tokenB }), 18, 'SLP', 'SushiSwap LP Token')
}

export default function MigrateV2() {
  const theme = useTheme()
  const account = useAccount()

  const v2FactoryAddress = account.chainId ? V2_FACTORY_ADDRESSES[account.chainId] : undefined

  // fetch the user's balances of all tracked V2 LP tokens
  const trackedTokenPairs = useTrackedTokenPairs()

  // calculate v2 + sushi pair contract addresses for all token pairs
  const tokenPairsWithLiquidityTokens = useMemo(
    () =>
      trackedTokenPairs.map((tokens) => {
        // sushi liquidity token or null
        const sushiLiquidityToken = account.chainId === 1 ? toSushiLiquidityToken(tokens) : null
        return {
          v2liquidityToken: v2FactoryAddress ? toV2LiquidityToken(tokens) : undefined,
          sushiLiquidityToken,
          tokens,
        }
      }),
    [trackedTokenPairs, account.chainId, v2FactoryAddress],
  )

  //  get pair liquidity token addresses for balance-fetching purposes
  const allLiquidityTokens = useMemo(() => {
    const v2 = tokenPairsWithLiquidityTokens.map(({ v2liquidityToken }) => v2liquidityToken)
    const sushi = tokenPairsWithLiquidityTokens
      .map(({ sushiLiquidityToken }) => sushiLiquidityToken)
      .filter((token): token is Token => !!token)

    return [...v2, ...sushi]
  }, [tokenPairsWithLiquidityTokens])

  // fetch pair balances
  const [pairBalances, fetchingPairBalances] = useRpcTokenBalancesWithLoadingIndicator(
    account.address,
    allLiquidityTokens,
  )

  // filter for v2 liquidity tokens that the user has a balance in
  const tokenPairsWithV2Balance = useMemo(() => {
    if (fetchingPairBalances) {
      return []
    }

    return tokenPairsWithLiquidityTokens
      .filter(({ v2liquidityToken }) => v2liquidityToken && pairBalances[v2liquidityToken.address]?.greaterThan(0))
      .map((tokenPairsWithLiquidityTokens) => tokenPairsWithLiquidityTokens.tokens)
  }, [fetchingPairBalances, tokenPairsWithLiquidityTokens, pairBalances])

  // filter for v2 liquidity tokens that the user has a balance in
  const tokenPairsWithSushiBalance = useMemo(() => {
    if (fetchingPairBalances) {
      return []
    }

    return tokenPairsWithLiquidityTokens.filter(
      ({ sushiLiquidityToken }) => !!sushiLiquidityToken && pairBalances[sushiLiquidityToken.address]?.greaterThan(0),
    )
  }, [fetchingPairBalances, tokenPairsWithLiquidityTokens, pairBalances])

  const v2Pairs = useV2Pairs(tokenPairsWithV2Balance)
  const v2IsLoading = fetchingPairBalances || v2Pairs.some(([pairState]) => pairState === PairState.LOADING)

  const networkSupportsV2 = useNetworkSupportsV2()
  if (!networkSupportsV2) {
    return <V2Unsupported />
  }

  return (
    <>
      <BodyWrapper style={{ padding: 24 }}>
        <AutoColumn gap="16px">
          <AutoRow style={{ alignItems: 'center', justifyContent: 'space-between' }} gap="8px">
            <BackArrowLink to="/pools" />
            <MigrateHeader>
              <Trans i18nKey="migrate.v2Title" />
            </MigrateHeader>
            <div>
              <QuestionHelper text={<Trans i18nKey="migrate.v2Subtitle" />} />
            </div>
          </AutoRow>

          <ThemedText.DeprecatedBody style={{ marginBottom: 8, fontWeight: 485 }}>
            <Trans i18nKey="migrate.v2Instruction" />
          </ThemedText.DeprecatedBody>

          {!account ? (
            <LightCard padding="40px">
              <ThemedText.DeprecatedBody color={theme.neutral3} textAlign="center">
                <Trans i18nKey="migrate.connectWallet" />
              </ThemedText.DeprecatedBody>
            </LightCard>
          ) : v2IsLoading ? (
            <LightCard padding="40px">
              <ThemedText.DeprecatedBody color={theme.neutral3} textAlign="center">
                <Dots>
                  <Trans i18nKey="common.loading" />
                </Dots>
              </ThemedText.DeprecatedBody>
            </LightCard>
          ) : v2Pairs.filter(([, pair]) => !!pair).length > 0 ? (
            <>
              {v2Pairs
                .filter(([, pair]) => !!pair)
                .map(([, pair]) => (
                  <MigrateV2PositionCard key={(pair as Pair).liquidityToken.address} pair={pair as Pair} />
                ))}

              {tokenPairsWithSushiBalance.map(({ sushiLiquidityToken, tokens }) => {
                return (
                  <MigrateSushiPositionCard
                    key={(sushiLiquidityToken as Token).address}
                    tokenA={tokens[0]}
                    tokenB={tokens[1]}
                    liquidityToken={sushiLiquidityToken as Token}
                  />
                )
              })}
            </>
          ) : (
            <EmptyState message={<Trans i18nKey="migrate.noV2Liquidity" />} />
          )}

          <AutoColumn justify="center" gap="md">
            <Text textAlign="center" fontSize={14} style={{ padding: '.5rem 0 .5rem 0' }}>
              <Trans
                i18nKey="migrate.missingV2Position"
                components={{
                  link: <StyledInternalLink id="import-pool-link" to="/pools/v2/find"></StyledInternalLink>,
                }}
              />
            </Text>
          </AutoColumn>
        </AutoColumn>
      </BodyWrapper>
      <SwitchLocaleLink />
    </>
  )
}
