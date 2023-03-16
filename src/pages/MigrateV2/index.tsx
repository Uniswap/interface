import { getCreate2Address } from '@ethersproject/address'
import { keccak256, pack } from '@ethersproject/solidity'
import { Trans } from '@lingui/macro'
import { Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { useWeb3React } from '@web3-react/core'
import MigrateSushiPositionCard from 'components/PositionCard/Sushi'
import MigrateV2PositionCard from 'components/PositionCard/V2'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { PairState, useV2Pairs } from 'hooks/useV2Pairs'
import { ReactNode, useMemo } from 'react'
import { Text } from 'rebass'
import { useTheme } from 'styled-components/macro'

import { LightCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import QuestionHelper from '../../components/QuestionHelper'
import { AutoRow } from '../../components/Row'
import { Dots } from '../../components/swap/styleds'
import { V2_FACTORY_ADDRESSES } from '../../constants/addresses'
import { useTokenBalancesWithLoadingIndicator } from '../../state/connection/hooks'
import { toV2LiquidityToken, useTrackedTokenPairs } from '../../state/user/hooks'
import { BackArrow, StyledInternalLink, ThemedText } from '../../theme'
import { BodyWrapper } from '../AppBody'

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
    '0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303'
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
  const { account, chainId } = useWeb3React()

  const v2FactoryAddress = chainId ? V2_FACTORY_ADDRESSES[chainId] : undefined

  // fetch the user's balances of all tracked V2 LP tokens
  const trackedTokenPairs = useTrackedTokenPairs()

  // calculate v2 + sushi pair contract addresses for all token pairs
  const tokenPairsWithLiquidityTokens = useMemo(
    () =>
      trackedTokenPairs.map((tokens) => {
        // sushi liquidity token or null
        const sushiLiquidityToken = chainId === 1 ? toSushiLiquidityToken(tokens) : null
        return {
          v2liquidityToken: v2FactoryAddress ? toV2LiquidityToken(tokens) : undefined,
          sushiLiquidityToken,
          tokens,
        }
      }),
    [trackedTokenPairs, chainId, v2FactoryAddress]
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
  const [pairBalances, fetchingPairBalances] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    allLiquidityTokens
  )

  // filter for v2 liquidity tokens that the user has a balance in
  const tokenPairsWithV2Balance = useMemo(() => {
    if (fetchingPairBalances) return []

    return tokenPairsWithLiquidityTokens
      .filter(({ v2liquidityToken }) => v2liquidityToken && pairBalances[v2liquidityToken.address]?.greaterThan(0))
      .map((tokenPairsWithLiquidityTokens) => tokenPairsWithLiquidityTokens.tokens)
  }, [fetchingPairBalances, tokenPairsWithLiquidityTokens, pairBalances])

  // filter for v2 liquidity tokens that the user has a balance in
  const tokenPairsWithSushiBalance = useMemo(() => {
    if (fetchingPairBalances) return []

    return tokenPairsWithLiquidityTokens.filter(
      ({ sushiLiquidityToken }) => !!sushiLiquidityToken && pairBalances[sushiLiquidityToken.address]?.greaterThan(0)
    )
  }, [fetchingPairBalances, tokenPairsWithLiquidityTokens, pairBalances])

  const v2Pairs = useV2Pairs(tokenPairsWithV2Balance)
  const v2IsLoading = fetchingPairBalances || v2Pairs.some(([pairState]) => pairState === PairState.LOADING)

  return (
    <>
      <BodyWrapper style={{ padding: 24 }}>
        <AutoColumn gap="16px">
          <AutoRow style={{ alignItems: 'center', justifyContent: 'space-between' }} gap="8px">
            <BackArrow to="/pools" />
            <ThemedText.DeprecatedMediumHeader>
              <Trans>Migrate V2 Liquidity</Trans>
            </ThemedText.DeprecatedMediumHeader>
            <div>
              <QuestionHelper text={<Trans>Migrate your liquidity tokens from Uniswap V2 to Uniswap V3.</Trans>} />
            </div>
          </AutoRow>

          <ThemedText.DeprecatedBody style={{ marginBottom: 8, fontWeight: 400 }}>
            <Trans>
              For each pool shown below, click migrate to remove your liquidity from Uniswap V2 and deposit it into
              Uniswap V3.
            </Trans>
          </ThemedText.DeprecatedBody>

          {!account ? (
            <LightCard padding="40px">
              <ThemedText.DeprecatedBody color={theme.textTertiary} textAlign="center">
                <Trans>Connect to a wallet to view your V2 liquidity.</Trans>
              </ThemedText.DeprecatedBody>
            </LightCard>
          ) : v2IsLoading ? (
            <LightCard padding="40px">
              <ThemedText.DeprecatedBody color={theme.textTertiary} textAlign="center">
                <Dots>
                  <Trans>Loading</Trans>
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
            <EmptyState message={<Trans>No V2 Liquidity found.</Trans>} />
          )}

          <AutoColumn justify="center" gap="md">
            <Text textAlign="center" fontSize={14} style={{ padding: '.5rem 0 .5rem 0' }}>
              <Trans>
                Don’t see one of your v2 positions?{' '}
                <StyledInternalLink id="import-pool-link" to="/pools/v2/find">
                  Import it.
                </StyledInternalLink>
              </Trans>
            </Text>
          </AutoColumn>
        </AutoColumn>
      </BodyWrapper>
      <SwitchLocaleLink />
    </>
  )
}
