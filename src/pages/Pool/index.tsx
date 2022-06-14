import React, { useContext, useMemo, useState } from 'react'
import styled, { ThemeContext, keyframes } from 'styled-components'
import { Text, Flex } from 'rebass'
import { t, Trans } from '@lingui/macro'

import { Pair, JSBI } from '@kyberswap/ks-sdk-classic'
import { Token, TokenAmount, ChainId } from '@kyberswap/ks-sdk-core'
import FullPositionCard from 'components/PositionCard'
import Card from 'components/Card'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { AutoColumn } from 'components/Column'
import { AutoRow } from 'components/Row'
import { ExternalLink, StyledInternalLink, TYPE } from '../../theme'
import { useActiveWeb3React } from 'hooks'
import { usePairsByAddress, usePairByAddress } from 'data/Reserves'
import { useTokenBalancesWithLoadingIndicator } from 'state/wallet/hooks'
import { useToV2LiquidityTokens, useLiquidityPositionTokenPairs } from 'state/user/hooks'
import { UserLiquidityPosition, useUserLiquidityPositions } from 'state/pools/hooks'
import useDebounce from 'hooks/useDebounce'
import Search from 'components/Search'
import { useFarmsData, useTotalApr } from 'state/farms/hooks'
import { Farm } from 'state/farms/types'
import { useToken } from 'hooks/Tokens'
import LocalLoader from 'components/LocalLoader'
import { ButtonPrimary } from 'components/Button'
import InfoHelper from 'components/InfoHelper'
import { isMobile } from 'react-device-detect'
import { Info } from 'react-feather'
import { OUTSIDE_FAIRLAUNCH_ADDRESSES, DMM_ANALYTICS, CHAIN_ROUTE } from 'constants/index'
import { PoolElasticIcon, PoolClassicIcon } from 'components/Icons'
import useTheme from 'hooks/useTheme'
import { auto } from '@popperjs/core'
import ProAmmPool from '../ProAmmPool'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useHistory, useLocation } from 'react-router-dom'
import Wallet from 'components/Icons/Wallet'
import { useWindowSize } from 'hooks/useWindowSize'
import { MouseoverTooltip } from 'components/Tooltip'
import { ELASTIC_NOT_SUPPORTED, VERSION } from 'constants/v2'

export const Tab = styled.div<{ active: boolean }>`
  padding: 4px 0;
  color: ${({ active, theme }) => (active ? theme.text : theme.subText)};
  border-bottom: 2px solid ${({ active, theme }) => (!active ? 'transparent' : theme.primary)};
  font-weight: ${props => (props.active ? '500' : '400')};
  cursor: pointer;
  :hover {
    color: ${props => props.theme.text};
  }
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
  padding: 16px 20px;
  background-color: ${({ theme }) => theme.bg17};
  text-align: center;
  border-radius: 999px;
  font-size: 14px;
  line-height: 1.5;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    border-radius: 8px;
    text-align: start;
    `}
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

  ${({ theme }) => theme.mediaWidth.upToSmall`
    align-items: flex-start;
    flex-direction: column-reverse;
    >div {
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

const PreloadCard = styled.div`
  width: 100%;
  height: 436px;
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
  const theme = useTheme()
  const history = useHistory()
  const location = useLocation()
  const qs = useParsedQueryString()
  const tab = (qs.tab as string) || VERSION.CLASSIC
  const setTab = (tab: VERSION) => {
    history.replace(location.pathname + '?tab=' + tab)
  }

  const { chainId } = useActiveWeb3React()

  const notSupportedMsg = ELASTIC_NOT_SUPPORTED[chainId as ChainId]

  return (
    <>
      <PageWrapper>
        <AutoColumn>
          <Flex>
            <MouseoverTooltip text={notSupportedMsg || ''}>
              <Flex
                onClick={() => {
                  if (!!notSupportedMsg) return
                  if (tab === VERSION.CLASSIC) setTab(VERSION.ELASTIC)
                }}
                alignItems="center"
                role="button"
              >
                <Text
                  fontWeight={500}
                  fontSize={20}
                  color={tab === VERSION.ELASTIC ? theme.primary : theme.subText}
                  width={auto}
                  marginRight={'5px'}
                  style={{ cursor: 'pointer' }}
                >
                  <Trans>Elastic Pools</Trans>
                </Text>
                <PoolElasticIcon size={16} color={tab === VERSION.ELASTIC ? theme.primary : theme.subText} />
              </Flex>
            </MouseoverTooltip>
            <Text
              fontWeight={500}
              fontSize={20}
              color={theme.subText}
              width={auto}
              marginRight={'18px'}
              marginLeft={'18px'}
            >
              |
            </Text>

            <Flex
              role="button"
              alignItems={'center'}
              onClick={() => {
                if (tab === VERSION.ELASTIC) setTab(VERSION.CLASSIC)
              }}
            >
              <Text
                fontWeight={500}
                fontSize={20}
                color={tab === VERSION.CLASSIC ? theme.primary : theme.subText}
                width={auto}
                marginRight={'5px'}
                style={{ cursor: 'pointer' }}
              >
                <Trans>Classic Pools</Trans>
              </Text>
              <PoolClassicIcon size={16} color={tab === VERSION.ELASTIC ? theme.subText : theme.primary} />
            </Flex>
          </Flex>
        </AutoColumn>
        {tab === VERSION.ELASTIC ? <ProAmmPool /> : <Pool />}
      </PageWrapper>
      <SwitchLocaleLink />
    </>
  )
}

function Pool() {
  const theme = useContext(ThemeContext)
  const { account, chainId } = useActiveWeb3React()
  const { width } = useWindowSize()

  const under768 = width && width <= 768

  const liquidityPositionTokenPairs = useLiquidityPositionTokenPairs()
  const { loading: loadingUserLiquidityPositions, data: userLiquidityPositions } = useUserLiquidityPositions(account)

  const { data: farms, loading: farmLoading } = useFarmsData()

  const [searchText, setSearchText] = useState('')
  const debouncedSearchText = useDebounce(searchText.trim().toLowerCase(), 300)

  const userFarms = Object.values(farms)
    .flat()
    .filter(
      farm =>
        JSBI.greaterThan(JSBI.BigInt(farm.userData?.stakedBalance || 0), JSBI.BigInt(0)) &&
        !OUTSIDE_FAIRLAUNCH_ADDRESSES[farm.fairLaunchAddress],
    )

  const tokenPairsWithLiquidityTokens = useToV2LiquidityTokens(liquidityPositionTokenPairs)

  const liquidityTokens = useMemo(() => tokenPairsWithLiquidityTokens.map(tpwlt => tpwlt.liquidityTokens), [
    tokenPairsWithLiquidityTokens,
  ])

  const [v2PairsBalances, fetchingV2PairBalances] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    liquidityTokens.flatMap(x => x),
  )

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

  const allV2PairsWithLiquidity = v2Pairs.map(([, pair]) => pair).filter((v2Pair): v2Pair is Pair => Boolean(v2Pair))

  // // remove any pairs that also are included in pairs with stake in mining pool
  const v2PairsWithoutStakedAmount = allV2PairsWithLiquidity
    .filter(v2Pair => {
      return debouncedSearchText
        ? v2Pair.token0.symbol?.toLowerCase().includes(debouncedSearchText) ||
            v2Pair.token1.symbol?.toLowerCase().includes(debouncedSearchText) ||
            v2Pair.address.toLowerCase() === debouncedSearchText
        : true
    })
    .filter(v2Pair => !userFarms.map(farm => farm.id.toLowerCase()).includes(v2Pair.address.toLowerCase()))

  const transformedUserLiquidityPositions: {
    [key: string]: UserLiquidityPosition
  } = {}

  userLiquidityPositions?.liquidityPositions.forEach((position: UserLiquidityPosition) => {
    transformedUserLiquidityPositions[position.pool.id] = position
  })

  const [showStaked, setShowStaked] = useState(false)

  const loading = v2IsLoading || loadingUserLiquidityPositions || farmLoading

  const { mixpanelHandler } = useMixpanel()

  return (
    <>
      <PageWrapper style={{ padding: 0, marginTop: '24px' }}>
        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="lg" style={{ width: '100%' }}>
            <AutoRow>
              <InstructionText>
                <Trans>Here you can view all your liquidity and staked balances in the Classic Pools</Trans>
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
                    Pools
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
                    Staked Pools
                  </Tab>
                </Flex>

                <ExternalLink href={`${DMM_ANALYTICS}/${CHAIN_ROUTE[chainId as ChainId]}/account/${account}`}>
                  <Flex alignItems="center">
                    <Wallet size={16} />
                    <Text fontSize="14px" marginLeft="4px">
                      <Trans>Analyze Wallet</Trans> ↗
                    </Text>
                  </Flex>
                </ExternalLink>
              </Flex>
            </TitleRow>

            <Flex alignItems="center" flexDirection="row" justifyContent="flex-end" sx={{ gap: '12px' }}>
              <Search
                style={{ width: 'unset', flex: under768 ? 1 : undefined }}
                minWidth={under768 ? '224px' : '254px'}
                searchValue={searchText}
                onSearch={(newSearchText: string) => setSearchText(newSearchText)}
                placeholder={t`Search by token name or pool address`}
              />

              <ButtonPrimary
                as={StyledInternalLink}
                to="/find"
                style={{
                  color: theme.textReverse,
                  padding: '10px 12px',
                  fontSize: '14px',
                  width: 'max-content',
                  height: '36px',
                  textDecoration: 'none',
                }}
              >
                <Text>
                  <Trans>Import Pool</Trans>
                </Text>
                {!isMobile && <InfoHelper text={t`You can manually import your pool`} color={theme.textReverse} />}
              </ButtonPrimary>
            </Flex>

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
                          farmStatus={!farm ? 'NO_FARM' : farm.isEnded ? 'FARM_ENDED' : 'FARM_ACTIVE'}
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
                    <StyledInternalLink id="import-pool-link" to={'/find'}>
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
                      <StyledInternalLink to="/pools?tab=classic">Pools.</StyledInternalLink>
                    </Trans>
                    <br />
                    {t`Don't see a pool you joined?`}{' '}
                    <StyledInternalLink id="import-pool-link" to={'/find'}>
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
                  <StyledInternalLink id="import-pool-link" to={'/find'}>
                    <Trans>Import it.</Trans>
                  </StyledInternalLink>
                </Text>
              </>
            ) : (
              <Flex flexDirection="column" alignItems="center" marginTop="60px">
                <Info size={48} color={theme.subText} />
                <Text fontSize={16} lineHeight={1.5} color={theme.subText} textAlign="center" marginTop="1rem">
                  <Trans>
                    No staked liquidity found. Check out our <StyledInternalLink to="/farms">Farms.</StyledInternalLink>
                  </Trans>
                  {/* <br /> */}
                  {/* {t`Don't see a pool you joined?`}{' '} */}
                  {/* <StyledInternalLink id="import-pool-link" to={'/find'}> */}
                  {/*   <Trans>Import it.</Trans> */}
                  {/* </StyledInternalLink> */}
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
      farmStatus={farm.isEnded ? 'FARM_ENDED' : 'FARM_ACTIVE'}
      farmAPR={farmAPR}
      tab={tab}
    />
  )
}
