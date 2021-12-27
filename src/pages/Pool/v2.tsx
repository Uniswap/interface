import { Trans } from '@lingui/macro'
import { Pair } from '@uniswap/v2-sdk'
import JSBI from 'jsbi'
import { useContext, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components/macro'

import { ButtonPrimary, ButtonSecondary } from '../../components/Button'
import Card from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import { CardBGImage, CardNoise, CardSection, DataCard } from '../../components/earn/styled'
import { SwapPoolTabs } from '../../components/NavigationTabs'
import FullPositionCard from '../../components/PositionCard'
import { RowBetween, RowFixed } from '../../components/Row'
import { Dots } from '../../components/swap/styleds'
import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
import { BIG_INT_ZERO } from '../../constants/misc'
import { useV2Pairs } from '../../hooks/useV2Pairs'
import { useActiveWeb3React } from '../../hooks/web3'
import { useStakingInfo } from '../../state/stake/hooks'
import { toV2LiquidityToken, useTrackedTokenPairs } from '../../state/user/hooks'
import { useTokenBalancesWithLoadingIndicator } from '../../state/wallet/hooks'
import { ExternalLink, HideSmall, ThemedText } from '../../theme'

const PageWrapper = styled(AutoColumn)`
  max-width: 640px;
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

const ResponsiveButtonPrimary = styled(ButtonPrimary)`
  width: fit-content;
  border-radius: 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 48%;
  `};
`

const ResponsiveButtonSecondary = styled(ButtonSecondary)`
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 48%;
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
  const tokenPairsWithLiquidityTokens = useMemo(
    () => trackedTokenPairs.map((tokens) => ({ liquidityToken: toV2LiquidityToken(tokens), tokens })),
    [trackedTokenPairs]
  )
  const liquidityTokens = useMemo(
    () => tokenPairsWithLiquidityTokens.map((tpwlt) => tpwlt.liquidityToken),
    [tokenPairsWithLiquidityTokens]
  )
  const [v2PairsBalances, fetchingV2PairBalances] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    liquidityTokens
  )

  // fetch the reserves for all V2 pools in which the user has a balance
  const liquidityTokensWithBalances = useMemo(
    () =>
      tokenPairsWithLiquidityTokens.filter(({ liquidityToken }) =>
        v2PairsBalances[liquidityToken.address]?.greaterThan('0')
      ),
    [tokenPairsWithLiquidityTokens, v2PairsBalances]
  )

  const v2Pairs = useV2Pairs(liquidityTokensWithBalances.map(({ tokens }) => tokens))
  const v2IsLoading =
    fetchingV2PairBalances || v2Pairs?.length < liquidityTokensWithBalances.length || v2Pairs?.some((V2Pair) => !V2Pair)

  const allV2PairsWithLiquidity = v2Pairs.map(([, pair]) => pair).filter((v2Pair): v2Pair is Pair => Boolean(v2Pair))

  // show liquidity even if its deposited in rewards contract
  const stakingInfo = useStakingInfo()
  const stakingInfosWithBalance = stakingInfo?.filter((pool) =>
    JSBI.greaterThan(pool.stakedAmount.quotient, BIG_INT_ZERO)
  )
  const stakingPairs = useV2Pairs(stakingInfosWithBalance?.map((stakingInfo) => stakingInfo.tokens))

  // remove any pairs that also are included in pairs with stake in mining pool
  const v2PairsWithoutStakedAmount = allV2PairsWithLiquidity.filter((v2Pair) => {
    return (
      stakingPairs
        ?.map((stakingPair) => stakingPair[1])
        .filter((stakingPair) => stakingPair?.liquidityToken.address === v2Pair.liquidityToken.address).length === 0
    )
  })

  return (
    <>
      <PageWrapper>
        <SwapPoolTabs active={'pool'} />
        <VoteCard>
          <CardBGImage />
          <CardNoise />
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <ThemedText.White fontWeight={600}>
                  <Trans>Liquidity provider rewards</Trans>
                </ThemedText.White>
              </RowBetween>
              <RowBetween>
                <ThemedText.White fontSize={14}>
                  <Trans>
                    Liquidity providers earn a 0.3% fee on all trades proportional to their share of the pool. Fees are
                    added to the pool, accrue in real time and can be claimed by withdrawing your liquidity.
                  </Trans>
                </ThemedText.White>
              </RowBetween>
              <ExternalLink
                style={{ color: 'white', textDecoration: 'underline' }}
                target="_blank"
                href="https://uniswap.org/docs/v2/core-concepts/pools/"
              >
                <ThemedText.White fontSize={14}>
                  <Trans>Read more about providing liquidity</Trans>
                </ThemedText.White>
              </ExternalLink>
            </AutoColumn>
          </CardSection>
          <CardBGImage />
          <CardNoise />
        </VoteCard>
        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="md" style={{ width: '100%' }}>
            <TitleRow style={{ marginTop: '1rem' }} padding={'0'}>
              <HideSmall>
                <ThemedText.MediumHeader style={{ marginTop: '0.5rem', justifySelf: 'flex-start' }}>
                  <Trans>Your liquidity</Trans>
                </ThemedText.MediumHeader>
              </HideSmall>
              <ButtonRow>
                <ResponsiveButtonSecondary as={Link} padding="6px 8px" to="/add/XDC">
                  <Trans>Create a pair</Trans>
                </ResponsiveButtonSecondary>
                <ResponsiveButtonPrimary id="find-pool-button" as={Link} to="/pool/find" padding="6px 8px">
                  <Text fontWeight={500} fontSize={16}>
                    <Trans>Import Pool</Trans>
                  </Text>
                </ResponsiveButtonPrimary>
                <ResponsiveButtonPrimary id="join-pool-button" as={Link} to="/add/XDC" padding="6px 8px">
                  <Text fontWeight={500} fontSize={16}>
                    <Trans>Add Liquidity</Trans>
                  </Text>
                </ResponsiveButtonPrimary>
              </ButtonRow>
            </TitleRow>

            {!account ? (
              <Card padding="40px">
                <ThemedText.Body color={theme.text3} textAlign="center">
                  <Trans>Connect to a wallet to view your liquidity.</Trans>
                </ThemedText.Body>
              </Card>
            ) : v2IsLoading ? (
              <EmptyProposals>
                <ThemedText.Body color={theme.text3} textAlign="center">
                  <Dots>
                    <Trans>Loading</Trans>
                  </Dots>
                </ThemedText.Body>
              </EmptyProposals>
            ) : allV2PairsWithLiquidity?.length > 0 || stakingPairs?.length > 0 ? (
              <>
                <ButtonSecondary>
                  <RowBetween>
                    <Trans>
                      <ExternalLink href={'https://v2.info.uniswap.org/account/' + account}>
                        Account analytics and accrued fees
                      </ExternalLink>
                      <span> ↗ </span>
                    </Trans>
                  </RowBetween>
                </ButtonSecondary>
                {v2PairsWithoutStakedAmount.map((v2Pair) => (
                  <FullPositionCard key={v2Pair.liquidityToken.address} pair={v2Pair} />
                ))}
                {stakingPairs.map(
                  (stakingPair, i) =>
                    stakingPair[1] && ( // skip pairs that arent loaded
                      <FullPositionCard
                        key={stakingInfosWithBalance[i].stakingRewardAddress}
                        pair={stakingPair[1]}
                        stakedBalance={stakingInfosWithBalance[i].stakedAmount}
                      />
                    )
                )}
              </>
            ) : (
              <EmptyProposals>
                <ThemedText.Body color={theme.text3} textAlign="center">
                  <Trans>No liquidity found.</Trans>
                </ThemedText.Body>
              </EmptyProposals>
            )}
          </AutoColumn>
        </AutoColumn>
      </PageWrapper>
      <SwitchLocaleLink />
    </>
  )
}
