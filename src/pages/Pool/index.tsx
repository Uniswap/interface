import { JSBI, Pair } from '@kyberswap/ks-sdk-classic'
import { Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { useMemo, useState } from 'react'
import { Info } from 'react-feather'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled, { keyframes } from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Card from 'components/Card'
import ClassicElasticTab from 'components/ClassicElasticTab'
import { AutoColumn } from 'components/Column'
import Wallet from 'components/Icons/Wallet'
import Withdraw from 'components/Icons/Withdraw'
import LocalLoader from 'components/LocalLoader'
import FullPositionCard from 'components/PositionCard'
import { AutoRow } from 'components/Row'
import Search from 'components/Search'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import Tutorial, { TutorialType } from 'components/Tutorial'
import { APP_PATHS, DMM_ANALYTICS_URL, OUTSIDE_FAIRLAUNCH_ADDRESSES } from 'constants/index'
import { VERSION } from 'constants/v2'
import { usePairByAddress, usePairsByAddress } from 'data/Reserves'
import { useActiveWeb3React } from 'hooks'
import { useToken } from 'hooks/Tokens'
import useDebounce from 'hooks/useDebounce'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useSyncNetworkParamWithStore } from 'hooks/useSyncNetworkParamWithStore'
import useTheme from 'hooks/useTheme'
import ProAmmPool from 'pages/ProAmmPool'
import { useFarmsData, useTotalApr } from 'state/farms/hooks'
import { Farm } from 'state/farms/types'
import { UserLiquidityPosition, useUserLiquidityPositions } from 'state/pools/hooks'
import { useLiquidityPositionTokenPairs, useToV2LiquidityTokens } from 'state/user/hooks'
import { useTokenBalancesWithLoadingIndicator } from 'state/wallet/hooks'
import { ExternalLink, StyledInternalLink, TYPE } from 'theme'

export const Tab = styled.div<{ active: boolean }>`
  padding: 4px 0;
  color: ${({ active, theme }) => (active ? theme.primary : theme.subText)};
  font-weight: 500;
  cursor: pointer;
  :hover {
    color: ${props => props.theme.primary};
  }
  ${({ theme }) => theme.mediaWidth.upToSmall`
    font-size: 15px;
  `};
`

export const PageWrapper = styled(AutoColumn)`
  padding: 32px 0 100px;
  width: 100%;
  max-width: 1224px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    padding: 24px 12px 100px;
    max-width: 832px;
  `}
  ${({ theme }) => theme.mediaWidth.upToSmall`
    max-width: 392px;
  `};
`

export const InstructionText = styled.div`
  width: 100%;
  padding: 16px 0;
  font-size: 12px;
  line-height: 1.5;
  border-top: 1px solid ${({ theme }) => theme.border};
  color: ${({ theme }) => theme.subText};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`

export const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    gap: 1rem;
    width: 100%;
    flex-direction: column;
  `};
`

export const PositionCardGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(392px, auto) minmax(392px, auto) minmax(392px, auto);
  gap: 24px;
  max-width: 1224px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 1fr 1fr;
    max-width: 832px;
  `}
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr;
    max-width: 392px;
  `};
`

export const FilterRow = styled(Flex)`
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
      width: 100%;
      justify-content: flex-end;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    align-items: flex-start;
    flex-direction: column-reverse;
    gap: 0;

    > div {
      margin-top: 12px;
      width: 100%
      justify-content: space-between
      &:nth-child(1){
        margin-top: 20px
      }
    }
  `}
`

const shimmer = keyframes`
    100% {
      transform: translateX(100%);
    }
`

export const PreloadCard = styled.div<{ width?: string; height?: string }>`
  width: ${({ width }) => width ?? '100%'};
  height: ${({ height }) => height ?? '436px'};
  background: ${({ theme }) => theme.background};
  border-radius: 8px;
  position: relative;
  display: inline-block;
  overflow: hidden;

  &::after {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    background-image: linear-gradient(90deg, rgba(#fff, 0) 0, rgba(#fff, 0.2) 20%, rgba(#fff, 0.5) 60%, rgba(#fff, 0));
    animation: ${shimmer} 2s infinite;

    content: '';
  }
`
export default function PoolCombination() {
  const { tab = VERSION.ELASTIC } = useParsedQueryString<{
    tab: string
  }>()

  return (
    <>
      <PageWrapper>
        <AutoColumn>
          <ClassicElasticTab />
        </AutoColumn>
        {tab === VERSION.ELASTIC ? <ProAmmPool /> : <Pool />}
      </PageWrapper>
      <SwitchLocaleLink />
    </>
  )
}

function Pool() {
  const theme = useTheme()
  const { account, chainId, isEVM, networkInfo } = useActiveWeb3React()

  const under768 = useMedia('(max-width:768px)')
  const liquidityPositionTokenPairs = useLiquidityPositionTokenPairs()
  const { loading: loadingUserLiquidityPositions, data: userLiquidityPositions } = useUserLiquidityPositions()

  const { data: farms, loading: farmLoading } = useFarmsData()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchValue = searchParams.get('search') || ''
  const debouncedSearchText = useDebounce(searchValue.trim().toLowerCase(), 300)

  const onSearch = (search: string) => {
    searchParams.set('search', search)
    setSearchParams(searchParams)
  }

  useSyncNetworkParamWithStore()

  const userFarms = useMemo(
    () =>
      Object.values(farms)
        .flat()
        .filter(
          farm =>
            JSBI.greaterThan(JSBI.BigInt(farm.userData?.stakedBalance || 0), JSBI.BigInt(0)) &&
            !OUTSIDE_FAIRLAUNCH_ADDRESSES[farm.fairLaunchAddress],
        ),
    [farms],
  )

  const tokenPairsWithLiquidityTokens = useToV2LiquidityTokens(liquidityPositionTokenPairs)

  const liquidityTokens = useMemo(
    () => tokenPairsWithLiquidityTokens.map(tpwlt => tpwlt.liquidityTokens),
    [tokenPairsWithLiquidityTokens],
  )

  const tokens = useMemo(() => liquidityTokens.flat(), [liquidityTokens])
  const [v2PairsBalances, fetchingV2PairBalances] = useTokenBalancesWithLoadingIndicator(tokens)

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
    [tokenPairsWithLiquidityTokens, liquidityTokens, v2PairsBalances],
  )

  const v2Pairs = usePairsByAddress(
    liquidityTokensWithBalances.map(({ liquidityToken, tokens }) => ({
      address: liquidityToken.address,
      currencies: tokens,
    })),
  )

  const v2IsLoading =
    fetchingV2PairBalances ||
    v2Pairs?.length < liquidityTokensWithBalances.length ||
    v2Pairs?.some(V2Pair => !V2Pair[1])

  const allV2PairsWithLiquidity = useMemo(
    () => v2Pairs.map(([, pair]) => pair).filter((v2Pair): v2Pair is Pair => Boolean(v2Pair)),
    [v2Pairs],
  )

  // remove any pairs that also are included in pairs with stake in mining pool
  const v2PairsWithoutStakedAmount = useMemo(
    () =>
      allV2PairsWithLiquidity
        .filter(v2Pair => {
          return debouncedSearchText
            ? v2Pair.token0.symbol?.toLowerCase().includes(debouncedSearchText) ||
                v2Pair.token1.symbol?.toLowerCase().includes(debouncedSearchText) ||
                v2Pair.address.toLowerCase() === debouncedSearchText
            : true
        })
        .filter(v2Pair => !userFarms.map(farm => farm.id.toLowerCase()).includes(v2Pair.address.toLowerCase())),
    [allV2PairsWithLiquidity, debouncedSearchText, userFarms],
  )

  const transformedUserLiquidityPositions: {
    [key: string]: UserLiquidityPosition
  } = {}

  userLiquidityPositions?.liquidityPositions.forEach((position: UserLiquidityPosition) => {
    transformedUserLiquidityPositions[position.pool.id] = position
  })

  const [showStaked, setShowStaked] = useState(false)

  const loading = v2IsLoading || loadingUserLiquidityPositions || farmLoading

  const { mixpanelHandler } = useMixpanel()

  const upToSmall = useMedia('(max-width: 768px)')

  if (!isEVM) return <Navigate to="/" replace />
  return (
    <>
      <PageWrapper style={{ padding: 0, marginTop: '24px' }}>
        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="lg" style={{ width: '100%' }}>
            <AutoRow>
              <InstructionText>
                <Trans>Here you can view all your liquidity and staked balances in the Classic Pools</Trans>
                {!upToSmall && (
                  <ExternalLink href={`${DMM_ANALYTICS_URL[chainId]}/account/${account}`}>
                    <Flex alignItems="center">
                      <Wallet size={16} />
                      <Text fontSize="14px" marginLeft="4px">
                        <Trans>Analyze Wallet</Trans> ↗
                      </Text>
                    </Flex>
                  </ExternalLink>
                )}
              </InstructionText>
            </AutoRow>
            <TitleRow>
              <Flex justifyContent="space-between" flex={1} alignItems="center" width="100%">
                <Flex sx={{ gap: '1.5rem' }} alignItems="center">
                  <Tab
                    active={!showStaked}
                    onClick={() => {
                      if (showStaked) {
                        mixpanelHandler(MIXPANEL_TYPE.MYPOOLS_POOLS_VIEWED)
                      }
                      setShowStaked(false)
                    }}
                    role="button"
                  >
                    <Trans>My Pools</Trans>
                  </Tab>
                  <Tab
                    active={showStaked}
                    onClick={() => {
                      if (!showStaked) {
                        mixpanelHandler(MIXPANEL_TYPE.MYPOOLS_STAKED_VIEWED)
                      }
                      setShowStaked(true)
                    }}
                    role="button"
                  >
                    <Trans>My Staked Pools</Trans>
                  </Tab>
                </Flex>

                {upToSmall && (
                  <Flex sx={{ gap: '12px' }}>
                    <ExternalLink href={`${DMM_ANALYTICS_URL[chainId]}/account/${account}`}>
                      <Flex
                        sx={{ borderRadius: '50%' }}
                        width="36px"
                        backgroundColor={rgba(theme.subText, 0.2)}
                        height="36px"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Wallet size={16} color={theme.subText} />
                      </Flex>
                    </ExternalLink>

                    <Tutorial type={TutorialType.CLASSIC_MY_POOLS} />
                  </Flex>
                )}
              </Flex>

              <Flex
                alignItems="center"
                flexDirection="row"
                justifyContent="flex-end"
                sx={{ gap: '12px' }}
                width={under768 ? '100%' : undefined}
              >
                <Search
                  style={{ width: 'unset', flex: under768 ? 1 : undefined }}
                  minWidth={under768 ? '224px' : '254px'}
                  searchValue={searchValue}
                  onSearch={onSearch}
                  placeholder={t`Search by token name or pool address`}
                />

                <ButtonPrimary
                  as={StyledInternalLink}
                  to={APP_PATHS.FIND_POOL}
                  style={{
                    color: theme.textReverse,
                    padding: '10px 12px',
                    fontSize: '14px',
                    width: 'max-content',
                    height: '36px',
                    textDecoration: 'none',
                  }}
                >
                  <Withdraw />
                  <Text marginLeft="4px">
                    <Trans>Import Pool</Trans>
                  </Text>
                </ButtonPrimary>

                {!upToSmall && <Tutorial type={TutorialType.CLASSIC_MY_POOLS} />}
              </Flex>
            </TitleRow>

            {!account ? (
              <Card padding="40px">
                <TYPE.body color={theme.text3} textAlign="center">
                  <Trans>Connect to a wallet to view your liquidity.</Trans>
                </TYPE.body>
              </Card>
            ) : !showStaked ? (
              loading && !v2PairsWithoutStakedAmount.length && !userFarms.length ? (
                <PositionCardGrid>
                  <PreloadCard></PreloadCard>
                  <PreloadCard></PreloadCard>
                  <PreloadCard></PreloadCard>
                </PositionCardGrid>
              ) : v2PairsWithoutStakedAmount?.length > 0 || !!userFarms.length ? (
                <>
                  <PositionCardGrid>
                    {v2PairsWithoutStakedAmount.map(v2Pair => {
                      const farm = Object.values(farms)
                        .flat()
                        .find(farm => farm.id.toLowerCase() === v2Pair.address.toLowerCase())

                      return (
                        <FullPositionCard
                          key={v2Pair.liquidityToken.address}
                          pair={v2Pair}
                          myLiquidity={transformedUserLiquidityPositions[v2Pair.address.toLowerCase()]}
                          farm={farm}
                          tab="ALL"
                        />
                      )
                    })}

                    {userFarms
                      .filter(
                        farm =>
                          farm.token0.symbol.toLowerCase().includes(debouncedSearchText) ||
                          farm.token1.symbol.toLowerCase().includes(debouncedSearchText) ||
                          farm.id.toLowerCase() === debouncedSearchText,
                      )
                      .map(farm => (
                        <StakedPool
                          farm={farm}
                          key={farm.id}
                          userLiquidityPositions={userLiquidityPositions?.liquidityPositions}
                          tab={'ALL'}
                        />
                      ))}
                  </PositionCardGrid>
                  <Text fontSize={16} color={theme.subText} textAlign="center" marginTop="1rem">
                    {t`Don't see a pool you joined?`}{' '}
                    <StyledInternalLink id="import-pool-link" to={APP_PATHS.FIND_POOL}>
                      <Trans>Import it.</Trans>
                    </StyledInternalLink>
                  </Text>
                </>
              ) : (
                <Flex flexDirection="column" alignItems="center" marginTop="60px">
                  <Info size={48} color={theme.subText} />
                  <Text fontSize={16} lineHeight={1.5} color={theme.subText} textAlign="center" marginTop="1rem">
                    <Trans>
                      No liquidity found. Check out our{' '}
                      <StyledInternalLink to={`${APP_PATHS.POOLS}/${networkInfo.route}?tab=classic`}>
                        Pools.
                      </StyledInternalLink>
                    </Trans>
                    <br />
                    {t`Don't see a pool you joined?`}{' '}
                    <StyledInternalLink id="import-pool-link" to={APP_PATHS.FIND_POOL}>
                      <Trans>Import it.</Trans>
                    </StyledInternalLink>
                  </Text>
                </Flex>
              )
            ) : loading && !userFarms.length ? (
              <LocalLoader />
            ) : !!userFarms.length ? (
              <>
                <PositionCardGrid>
                  {userFarms
                    .filter(
                      farm =>
                        farm.token0.symbol.toLowerCase().includes(debouncedSearchText) ||
                        farm.token1.symbol.toLowerCase().includes(debouncedSearchText) ||
                        farm.id.toLowerCase() === debouncedSearchText,
                    )
                    .map(farm => (
                      <StakedPool
                        farm={farm}
                        key={farm.id}
                        userLiquidityPositions={userLiquidityPositions?.liquidityPositions}
                        tab="STAKED"
                      />
                    ))}
                </PositionCardGrid>
                <Text fontSize={16} color={theme.subText} textAlign="center" marginTop="1rem">
                  {t`Don't see a pool you joined?`}{' '}
                  <StyledInternalLink id="import-pool-link" to={APP_PATHS.FIND_POOL}>
                    <Trans>Import it.</Trans>
                  </StyledInternalLink>
                </Text>
              </>
            ) : (
              <Flex flexDirection="column" alignItems="center" marginTop="60px">
                <Info size={48} color={theme.subText} />
                <Text fontSize={16} lineHeight={1.5} color={theme.subText} textAlign="center" marginTop="1rem">
                  <Trans>
                    No staked liquidity found. Check out our{' '}
                    <StyledInternalLink to={`${APP_PATHS.FARMS}/${networkInfo.route}`}>Farms.</StyledInternalLink>
                  </Trans>
                </Text>
              </Flex>
            )}
          </AutoColumn>
        </AutoColumn>
      </PageWrapper>
      <SwitchLocaleLink />
    </>
  )
}

const StakedPool = ({
  farm,
  userLiquidityPositions,
  tab,
}: {
  farm: Farm
  tab: 'ALL' | 'STAKED'
  userLiquidityPositions?: UserLiquidityPosition[]
}) => {
  const token0 = useToken(farm.token0?.id) || undefined
  const token1 = useToken(farm.token1?.id) || undefined
  const { farmAPR } = useTotalApr(farm)

  const pair = usePairByAddress(token0?.wrapped, token1?.wrapped, farm.id)[1]

  if (!pair) return <PreloadCard />

  return (
    <FullPositionCard
      pair={pair}
      stakedBalance={TokenAmount.fromRawAmount(pair.liquidityToken, farm.userData?.stakedBalance || '0')}
      myLiquidity={userLiquidityPositions?.find(position => position.pool.id === pair.address)}
      farm={farm}
      farmAPR={farmAPR}
      tab={tab}
    />
  )
}
