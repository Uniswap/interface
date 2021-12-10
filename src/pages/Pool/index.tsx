import React, { useContext, useMemo, useState } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { Text } from 'rebass'
import { t, Trans } from '@lingui/macro'

import { Pair, JSBI, Token } from '@dynamic-amm/sdk'
import { BIG_INT_ZERO } from '../../constants'
import { SwapPoolTabs } from 'components/NavigationTabs'
import FullPositionCard from 'components/PositionCard'
import { DataCard, CardNoise, CardBGImage } from 'components/earn/styled'
import Card from 'components/Card'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { AutoColumn } from 'components/Column'
import { AutoRow, RowBetween } from 'components/Row'
import { Dots } from 'components/swap/styleds'
import { StyledInternalLink, TYPE, HideSmall } from '../../theme'
import { useActiveWeb3React } from 'hooks'
import { usePairs, usePairsByAddress } from 'data/Reserves'
import { useTokenBalancesWithLoadingIndicator } from 'state/wallet/hooks'
import { useToV2LiquidityTokens, useLiquidityPositionTokenPairs } from 'state/user/hooks'
import { useStakingInfo } from 'state/stake/hooks'
import { UserLiquidityPosition, useUserLiquidityPositions } from 'state/pools/hooks'
import useDebounce from 'hooks/useDebounce'
import Search from 'components/Search'

export const PageWrapper = styled(AutoColumn)`
  padding: 16px 0 100px;
  width: 100%;
  max-width: 1008px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    max-width: 664px;
  `}
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 12px 0 100px;
    max-width: 350px;
  `};
`

const VoteCard = styled(DataCard)`
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #27ae60 0%, #000000 100%);
  overflow: hidden;
`

const InstructionText = styled.div`
  width: 100%;
  padding: 16px 20px;
  background-color: ${({ theme }) => theme.bg17};
  border-radius: 5px;
  font-size: 14px;
  line-height: 1.5;
`

const TitleRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
    flex-direction: column-reverse;
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

const PositionCardGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(320px, auto) minmax(320px, auto) minmax(320px, auto);
  gap: 24px;
  max-width: 1008px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr 1fr;
    max-width: 664px;
  `}
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr;
    max-width: 350px;
  `};
`

export default function Pool() {
  const theme = useContext(ThemeContext)
  const { account } = useActiveWeb3React()

  const liquidityPositionTokenPairs = useLiquidityPositionTokenPairs()

  //trackedTokenPairs = [ [Token, Token],  [Token, Token] ]
  const tokenPairsWithLiquidityTokens = useToV2LiquidityTokens(liquidityPositionTokenPairs)

  const liquidityTokens = useMemo(() => tokenPairsWithLiquidityTokens.map(tpwlt => tpwlt.liquidityTokens), [
    tokenPairsWithLiquidityTokens
  ])
  const [v2PairsBalances, fetchingV2PairBalances] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    liquidityTokens.flatMap(x => x)
  )
  // fetch the reserves for all V2 pools in which the user has a balance
  // const liquidityTokensWithBalances = useMemo(
  //   () =>
  //     tokenPairsWithLiquidityTokens.filter(({ liquidityToken }) =>
  //       v2PairsBalances[liquidityToken.address]?.greaterThan('0')
  //     ),
  //   [tokenPairsWithLiquidityTokens, v2PairsBalances]
  // )
  const liquidityTokensWithBalances = useMemo(
    () =>
      liquidityTokens.reduce<{ liquidityToken: Token; tokens: [Token, Token] }[]>((acc, lpTokens, index) => {
        lpTokens
          .filter((lp: Token) => v2PairsBalances[lp.address]?.greaterThan('0'))
          .forEach((lp: Token) => {
            acc.push({ liquidityToken: lp, tokens: tokenPairsWithLiquidityTokens[index].tokens })
          })
        return acc
      }, []),
    [tokenPairsWithLiquidityTokens, liquidityTokens, v2PairsBalances]
  )

  const v2Pairs = usePairsByAddress(
    liquidityTokensWithBalances.map(({ liquidityToken, tokens }) => ({
      address: liquidityToken.address,
      currencies: tokens
    }))
  )
  const v2IsLoading =
    fetchingV2PairBalances || v2Pairs?.length < liquidityTokensWithBalances.length || v2Pairs?.some(V2Pair => !V2Pair)
  const allV2PairsWithLiquidity = v2Pairs.map(([, pair]) => pair).filter((v2Pair): v2Pair is Pair => Boolean(v2Pair))
  // const allV2PairsWithLiquidity = v2Pairs.map(([, pair]) => pair).filter((v2Pair): v2Pair is Pair => Boolean(v2Pair))

  const [searchText, setSearchText] = useState('')
  const debouncedSearchText = useDebounce(searchText.trim().toLowerCase(), 200)

  // show liquidity even if its deposited in rewards contract
  const stakingInfo = useStakingInfo()
  const stakingInfosWithBalance = stakingInfo?.filter(pool => JSBI.greaterThan(pool.stakedAmount.raw, BIG_INT_ZERO))
  const stakingPairs = usePairs(stakingInfosWithBalance?.map(stakingInfo => stakingInfo.tokens)).flatMap(x => x)
  // // remove any pairs that also are included in pairs with stake in mining pool
  const v2PairsWithoutStakedAmount = allV2PairsWithLiquidity.filter(v2Pair => {
    return (
      (debouncedSearchText
        ? v2Pair.token0.symbol?.toLowerCase().includes(debouncedSearchText) ||
          v2Pair.token1.symbol?.toLowerCase().includes(debouncedSearchText) ||
          v2Pair.address.toLowerCase() === debouncedSearchText
        : true) &&
      stakingPairs
        ?.map(stakingPair => stakingPair[1])
        .filter(stakingPair => stakingPair?.liquidityToken.address === v2Pair.liquidityToken.address).length === 0
    )
  })

  const { loading: loadingUserLiquidityPositions, data: userLiquidityPositions } = useUserLiquidityPositions(account)

  const transformedUserLiquidityPositions: {
    [key: string]: UserLiquidityPosition
  } = {}

  userLiquidityPositions?.liquidityPositions.forEach((position: UserLiquidityPosition) => {
    transformedUserLiquidityPositions[position.pool.id] = position
  })

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
            <AutoRow>
              <InstructionText>
                <Trans>Here you can view all your liquidity positions and add/remove more liquidity.</Trans>
              </InstructionText>
            </AutoRow>

            <TitleRow style={{ marginTop: '1rem' }} padding={'0'}>
              <HideSmall>
                <TYPE.mediumHeader style={{ marginTop: '0.5rem', justifySelf: 'flex-start' }}>
                  <Trans>My Liquidity Pools</Trans>
                </TYPE.mediumHeader>
              </HideSmall>

              <Search
                searchValue={searchText}
                setSearchValue={setSearchText}
                placeholder={t`Search by tokens or pool address`}
              />
            </TitleRow>

            {!account ? (
              <Card padding="40px">
                <TYPE.body color={theme.text3} textAlign="center">
                  <Trans>Connect to a wallet to view your liquidity.</Trans>
                </TYPE.body>
              </Card>
            ) : v2IsLoading || loadingUserLiquidityPositions ? (
              <EmptyProposals>
                <TYPE.body color={theme.text3} textAlign="center">
                  <Dots>
                    <Trans>Loading</Trans>
                  </Dots>
                </TYPE.body>
              </EmptyProposals>
            ) : allV2PairsWithLiquidity?.length > 0 || stakingPairs?.length > 0 ? (
              <PositionCardGrid>
                {v2PairsWithoutStakedAmount.map(v2Pair => (
                  <FullPositionCard
                    key={v2Pair.liquidityToken.address}
                    pair={v2Pair}
                    myLiquidity={transformedUserLiquidityPositions[v2Pair.address.toLowerCase()]}
                  />
                ))}
                {stakingPairs.map(
                  (stakingPair, i) =>
                    stakingPair[1] && ( // skip pairs that arent loaded
                      <FullPositionCard
                        key={stakingInfosWithBalance[i].stakingRewardAddress}
                        pair={stakingPair[1]}
                        stakedBalance={stakingInfosWithBalance[i].stakedAmount}
                        myLiquidity={transformedUserLiquidityPositions[stakingPair[1].address.toLowerCase()]}
                      />
                    )
                )}
              </PositionCardGrid>
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
                <StyledInternalLink id="import-pool-link" to={'/find'}>
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
