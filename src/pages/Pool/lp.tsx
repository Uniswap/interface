import React, { useContext, useMemo } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { t, Trans } from '@lingui/macro'
import { Pair as PairUNI } from '@uniswap/sdk'
import { Pair as PairSUSHI } from '@sushiswap/sdk'
import { SwapPoolTabs } from '../../components/NavigationTabs'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import FullPositionCardUNI from '../../components/PositionCard/PositionCardUNI'
import FullPositionCardSUSHI from '../../components/PositionCard/PositionCardSUSHI'
import { useTokenBalancesWithLoadingIndicator } from '../../state/wallet/hooks'
import { StyledInternalLink, TYPE, HideSmall } from '../../theme'
import { Text } from 'rebass'
import Card from '../../components/Card'
import { RowBetween, RowFixed } from '../../components/Row'
import { AutoColumn } from '../../components/Column'
import { useActiveWeb3React } from '../../hooks'
import { useTrackedTokenPairs, toV2LiquidityToken, toV2LiquidityTokenSushi } from '../../state/user/hooks'
import { Dots } from '../../components/swap/styleds'
import { DataCard, CardNoise, CardBGImage } from '../../components/earn/styled'
import { usePairs } from 'data/ReservesUNI'
import { usePairs as usePairsSUSHI } from 'data/ReservesSUSHI'

const PageWrapper = styled(AutoColumn)`
  max-width: 510px;
  width: 100%;
`

const VoteCard = styled(DataCard)`
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #27ae60 0%, #000000 100%);
  overflow: hidden;
`

const TitleRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
    flex-direction: column-reverse;
  `};
`

const ButtonRow = styled(RowFixed)`
  gap: 8px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    flex-direction: row-reverse;
    justify-content: space-between;
  `};
`

const EmptyProposals = styled.div`
  border: 1px solid ${({ theme }) => theme.text4};
  padding: 16px 12px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

export default function Pool() {
  const theme = useContext(ThemeContext)
  const { account } = useActiveWeb3React()

  // fetch the user's balances of all tracked V2 LP tokens
  const trackedTokenPairs = useTrackedTokenPairs()
  //trackedTokenPairs = [ [Token, Token],  [Token, Token] ]
  const tokenPairsWithLiquidityTokensUNI = useMemo(
    () => trackedTokenPairs.map(tokens => ({ liquidityToken: toV2LiquidityToken(tokens), tokens })),
    [trackedTokenPairs]
  )

  const tokenPairsWithLiquidityTokensSUSHI = useMemo(
    () => trackedTokenPairs.map(tokens => ({ liquidityToken: toV2LiquidityTokenSushi(tokens), tokens })),
    [trackedTokenPairs]
  )
  //All are Token DMM
  // const tokenPairsWithLiquidityTokens = [...tokenPairsWithLiquidityTokensUNI, ...tokenPairsWithLiquidityTokensSUSHI]
  // const tokenPairsWithLiquidityTokens = [...tokenPairsWithLiquidityTokensUNI, ...tokenPairsWithLiquidityTokensSUSHI]

  const liquidityTokensUNI = useMemo(() => tokenPairsWithLiquidityTokensUNI.map(tpwlt => tpwlt.liquidityToken), [
    tokenPairsWithLiquidityTokensUNI
  ])
  const liquidityTokensSUSHI = useMemo(() => tokenPairsWithLiquidityTokensSUSHI.map(tpwlt => tpwlt.liquidityToken), [
    tokenPairsWithLiquidityTokensSUSHI
  ])

  const [v2PairsBalancesUNI, fetchingV2PairBalancesUNI] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    liquidityTokensUNI
  )
  const [v2PairsBalancesSUSHI, fetchingV2PairBalancesSUSHI] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    liquidityTokensSUSHI
  )
  // fetch the reserves for all V2 pools in which the user has a balance
  const liquidityTokensWithBalancesUNI = useMemo(
    () =>
      tokenPairsWithLiquidityTokensUNI.filter(({ liquidityToken }) =>
        v2PairsBalancesUNI[liquidityToken.address]?.greaterThan('0')
      ),
    [tokenPairsWithLiquidityTokensUNI, v2PairsBalancesUNI]
  )
  const liquidityTokensWithBalancesSUSHI = useMemo(
    () =>
      tokenPairsWithLiquidityTokensSUSHI.filter(({ liquidityToken }) =>
        v2PairsBalancesSUSHI[liquidityToken.address]?.greaterThan('0')
      ),
    [tokenPairsWithLiquidityTokensSUSHI, v2PairsBalancesSUSHI]
  )
  const v2PairsUNI = usePairs(liquidityTokensWithBalancesUNI.map(({ tokens }) => tokens))
  const v2PairsSUSHI = usePairsSUSHI(liquidityTokensWithBalancesSUSHI.map(({ tokens }) => tokens))

  const v2IsLoading =
    fetchingV2PairBalancesUNI ||
    fetchingV2PairBalancesSUSHI ||
    v2PairsUNI?.length < liquidityTokensWithBalancesUNI.length ||
    v2PairsSUSHI?.length < liquidityTokensWithBalancesSUSHI.length ||
    v2PairsUNI?.some(V2Pair => !V2Pair) ||
    v2PairsSUSHI?.some(v2PairsSUSHI => !v2PairsSUSHI)

  const allV2PairsWithLiquidityUNI = v2PairsUNI
    .map(([, pair]) => pair)
    .filter((v2Pair): v2Pair is PairUNI => Boolean(v2Pair))
  const v2PairsWithoutStakedAmountUNI = allV2PairsWithLiquidityUNI

  const allV2PairsWithLiquiditySUSHI = v2PairsSUSHI
    .map(([, pair]) => pair)
    .filter((v2Pair): v2Pair is PairSUSHI => Boolean(v2Pair))
  const v2PairsWithoutStakedAmountSUSHI = allV2PairsWithLiquiditySUSHI

  return (
    <>
      <PageWrapper>
        <SwapPoolTabs active={'pool'} />
        <VoteCard>
          <CardBGImage />
          <CardNoise />
          <CardBGImage />
          <CardNoise />
        </VoteCard>

        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="lg" style={{ width: '100%' }}>
            <TitleRow style={{ marginTop: '1rem' }} padding={'0'}>
              <HideSmall>
                <TYPE.mediumHeader style={{ marginTop: '0.5rem', justifySelf: 'flex-start' }}>
                  <Trans>My Pools on External Platforms</Trans>
                </TYPE.mediumHeader>
              </HideSmall>
            </TitleRow>

            {!account ? (
              <Card padding="40px">
                <TYPE.body color={theme.text3} textAlign="center">
                  <Trans>Connect to a wallet to view your liquidity.</Trans>
                </TYPE.body>
              </Card>
            ) : v2IsLoading ? (
              <EmptyProposals>
                <TYPE.body color={theme.text3} textAlign="center">
                  <Dots>
                    <Trans>Loading</Trans>
                  </Dots>
                </TYPE.body>
              </EmptyProposals>
            ) : allV2PairsWithLiquidityUNI?.length > 0 || allV2PairsWithLiquiditySUSHI?.length > 0 ? (
              <>
                {v2PairsWithoutStakedAmountUNI.map(v2Pair => (
                  <FullPositionCardUNI key={`UNI-${v2Pair.liquidityToken.address}`} pair={v2Pair} />
                ))}
                {v2PairsWithoutStakedAmountSUSHI.map(v2Pair => (
                  <FullPositionCardSUSHI key={`SUSHI-${v2Pair.liquidityToken.address}`} pair={v2Pair} />
                ))}
              </>
            ) : (
              <EmptyProposals>
                <TYPE.body color={theme.text3} textAlign="center">
                  <Trans>No liquidity found.</Trans>
                </TYPE.body>
              </EmptyProposals>
            )}

            <AutoColumn justify={'center'} gap="md">
              <Text textAlign="center" fontSize={14} style={{ padding: '.5rem 0 .5rem 0' }}>
                {t`Don't see a pool you joined?`}{' '}
                <StyledInternalLink id="import-pool-link" to={'/findExternal'}>
                  <Trans>Import it.</Trans>
                </StyledInternalLink>
              </Text>
            </AutoColumn>
          </AutoColumn>
        </AutoColumn>
      </PageWrapper>
      <SwitchLocaleLink />
    </>
  )
}
