import { Trans } from '@lingui/macro'
import { InterfacePageName } from '@uniswap/analytics-events'
import { Pair } from '@uniswap/v2-sdk'
import { useWeb3React } from '@web3-react/core'
import { Trace } from 'analytics'
import { V2Unsupported } from 'components/V2Unsupported'
import { useNetworkSupportsV2 } from 'hooks/useNetworkSupportsV2'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { ChevronsRight } from 'react-feather'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { useTheme } from 'styled-components'
import { ExternalLink, HideSmall, ThemedText } from 'theme/components'

import { ButtonOutlined, ButtonPrimary, ButtonSecondary } from '../../components/Button'
import Card from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import { CardBGImage, CardNoise, CardSection, DataCard } from '../../components/earn/styled'
import FullPositionCard from '../../components/PositionCard'
import { RowBetween, RowFixed } from '../../components/Row'
import { Dots } from '../../components/swap/styled'
import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
import { BIG_INT_ZERO } from '../../constants/misc'
import { useV2Pairs } from '../../hooks/useV2Pairs'
import { useTokenBalancesWithLoadingIndicator } from '../../state/connection/hooks'
import { useStakingInfo } from '../../state/stake/hooks'
import { toV2LiquidityToken, useTrackedTokenPairs } from '../../state/user/hooks'

const PageWrapper = styled(AutoColumn)`
  max-width: 640px;
  width: 100%;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    padding: 0px 8px;
  `};
`

const LPFeeExplainer = styled(DataCard)`
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #27ae60 0%, #000000 100%);
  margin: 0 0 16px 0;
  overflow: hidden;
`

const TitleRow = styled(RowBetween)`
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
    flex-direction: column-reverse;
  `};
`

const ButtonRow = styled(RowFixed)`
  gap: 8px;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    width: 100%;
    flex-direction: row-reverse;
    justify-content: space-between;
  `};
`

const ResponsiveButtonPrimary = styled(ButtonPrimary)`
  height: 40px;
  width: fit-content;
  border-radius: 12px;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    width: 48%;
  `};
`

const ResponsiveButtonSecondary = styled(ButtonSecondary)`
  height: 40px;
  width: fit-content;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    width: 48%;
  `};
`

const EmptyProposals = styled.div`
  border: 1px solid ${({ theme }) => theme.neutral2};
  padding: 16px 12px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

export default function Pool() {
  const theme = useTheme()
  const { account } = useWeb3React()
  const networkSupportsV2 = useNetworkSupportsV2()

  // fetch the user's balances of all tracked V2 LP tokens
  let trackedTokenPairs = useTrackedTokenPairs()
  if (!networkSupportsV2) trackedTokenPairs = []
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
    <Trace page={InterfacePageName.POOL_PAGE} shouldLogImpression>
      <>
        <PageWrapper>
          <LPFeeExplainer>
            <CardBGImage />
            <CardNoise />
            <CardSection>
              <AutoColumn gap="md">
                <RowBetween>
                  <ThemedText.DeprecatedWhite fontWeight={535}>
                    <Trans>Liquidity provider rewards</Trans>
                  </ThemedText.DeprecatedWhite>
                </RowBetween>
                <RowBetween>
                  <ThemedText.DeprecatedWhite fontSize={14}>
                    <Trans>
                      Liquidity providers earn a 0.3% fee on all trades proportional to their share of the pool. Fees
                      are added to the pool, accrue in real time and can be claimed by withdrawing your liquidity.
                    </Trans>
                  </ThemedText.DeprecatedWhite>
                </RowBetween>
                <ExternalLink
                  style={{ color: theme.white, textDecoration: 'underline' }}
                  target="_blank"
                  href="https://docs.uniswap.org/contracts/v2/concepts/core-concepts/pools"
                >
                  <ThemedText.DeprecatedWhite fontSize={14}>
                    <Trans>Read more about providing liquidity</Trans>
                  </ThemedText.DeprecatedWhite>
                </ExternalLink>
              </AutoColumn>
            </CardSection>
            <CardBGImage />
            <CardNoise />
          </LPFeeExplainer>

          {!networkSupportsV2 ? (
            <V2Unsupported />
          ) : (
            <AutoColumn gap="lg" justify="center">
              <AutoColumn gap="md" style={{ width: '100%' }}>
                <TitleRow style={{ marginTop: '1rem' }} padding="0">
                  <HideSmall>
                    <ThemedText.DeprecatedMediumHeader style={{ marginTop: '0.5rem', justifySelf: 'flex-start' }}>
                      <Trans>Your V2 liquidity</Trans>
                    </ThemedText.DeprecatedMediumHeader>
                  </HideSmall>
                  <ButtonRow>
                    <ResponsiveButtonSecondary as={Link} padding="6px 8px" to="/add/v2/ETH">
                      <Trans>Create a pair</Trans>
                    </ResponsiveButtonSecondary>
                    <ResponsiveButtonPrimary id="find-pool-button" as={Link} to="/pools/v2/find" padding="6px 8px">
                      <Text fontWeight={535} fontSize={16}>
                        <Trans>Import Pool</Trans>
                      </Text>
                    </ResponsiveButtonPrimary>
                    <ResponsiveButtonPrimary id="join-pool-button" as={Link} to="/add/v2/ETH" padding="6px 8px">
                      <Text fontWeight={535} fontSize={16}>
                        <Trans>Add V2 Liquidity</Trans>
                      </Text>
                    </ResponsiveButtonPrimary>
                  </ButtonRow>
                </TitleRow>

                {!account ? (
                  <Card padding="40px">
                    <ThemedText.DeprecatedBody color={theme.neutral3} textAlign="center">
                      <Trans>Connect to a wallet to view your liquidity.</Trans>
                    </ThemedText.DeprecatedBody>
                  </Card>
                ) : v2IsLoading ? (
                  <EmptyProposals>
                    <ThemedText.DeprecatedBody color={theme.neutral3} textAlign="center">
                      <Dots>
                        <Trans>Loading</Trans>
                      </Dots>
                    </ThemedText.DeprecatedBody>
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
                    <RowFixed justify="center" style={{ width: '100%' }}>
                      <ButtonOutlined
                        as={Link}
                        to="/migrate/v2"
                        id="import-pool-link"
                        style={{
                          padding: '8px 16px',
                          margin: '0 4px',
                          borderRadius: '12px',
                          width: 'fit-content',
                          fontSize: '14px',
                        }}
                      >
                        <ChevronsRight size={16} style={{ marginRight: '8px' }} />
                        <Trans>Migrate Liquidity to V3</Trans>
                      </ButtonOutlined>
                    </RowFixed>
                  </>
                ) : (
                  <EmptyProposals>
                    <ThemedText.DeprecatedBody color={theme.neutral3} textAlign="center">
                      <Trans>No liquidity found.</Trans>
                    </ThemedText.DeprecatedBody>
                  </EmptyProposals>
                )}
              </AutoColumn>
            </AutoColumn>
          )}
        </PageWrapper>
        <SwitchLocaleLink />
      </>
    </Trace>
  )
}
