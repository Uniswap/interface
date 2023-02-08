import { computePoolAddress } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { rgba } from 'polished'
import { useMemo, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Info } from 'react-feather'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import Card from 'components/Card'
import { AutoColumn } from 'components/Column'
import Wallet from 'components/Icons/Wallet'
import Search from 'components/Search'
import SubscribeNotificationButton from 'components/SubscribeButton'
import Toggle from 'components/Toggle'
import Tutorial, { TutorialType } from 'components/Tutorial'
import { APP_PATHS, PROMM_ANALYTICS_URL } from 'constants/index'
import { EVMNetworkInfo } from 'constants/networks/type'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useProAmmPositions } from 'hooks/useProAmmPositions'
import useTheme from 'hooks/useTheme'
import { FilterRow, InstructionText, PageWrapper, PositionCardGrid, Tab } from 'pages/Pool'
import { FarmUpdater, useElasticFarms } from 'state/farms/elastic/hooks'
import { ExternalLink, StyledInternalLink, TYPE } from 'theme'
import { PositionDetails } from 'types/position'

import ContentLoader from './ContentLoader'
import PositionListItem from './PositionListItem'

const Hightlight = styled.span`
  color: ${({ theme }) => theme.text};
`

const TabRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    gap: 1rem;
    width: 100%;
    flex-direction: column;
  `}
`

interface AddressSymbolMapInterface {
  [key: string]: string
}

const renderNotificationButton = (iconOnly: boolean) => {
  return null // temp off feature, will release soon
  return (
    <SubscribeNotificationButton
      iconOnly={iconOnly}
      subscribeTooltip={
        <div>
          <Trans>
            Subscribe to receive email notifications on <Hightlight>all</Hightlight> your liquidity positions. When your
            liquidity position goes <Hightlight>out-of-range</Hightlight>, back <Hightlight>in-range</Hightlight> or is{' '}
            <Hightlight>closed</Hightlight> you will receive a notification
          </Trans>
        </div>
      }
    />
  )
}

export default function ProAmmPool() {
  const { account, chainId, isEVM, networkInfo } = useActiveWeb3React()
  const tokenAddressSymbolMap = useRef<AddressSymbolMapInterface>({})
  const { positions, loading: positionsLoading } = useProAmmPositions(account)

  const { farms, loading, userFarmInfo } = useElasticFarms()

  const farmingPools = useMemo(() => farms?.map(farm => farm.pools).flat() || [], [farms])

  const farmPositions = useMemo(() => {
    if (!isEVM) return []
    return Object.values(userFarmInfo || {})
      .map(info => {
        return info.depositedPositions
          .map(pos => {
            const poolAddress = computePoolAddress({
              factoryAddress: (networkInfo as EVMNetworkInfo).elastic.coreFactory,
              tokenA: pos.pool.token0,
              tokenB: pos.pool.token1,
              fee: pos.pool.fee,
              initCodeHashManualOverride: (networkInfo as EVMNetworkInfo).elastic.initCodeHash,
            })
            const pool = farmingPools.filter(pool => pool.poolAddress.toLowerCase() === poolAddress.toLowerCase())

            const joinedLiquidity =
              // I'm sure we can always find pool
              // eslint-disable-next-line
              Object.values(info.joinedPositions)
                .flat()
                .filter(joinedPos => joinedPos.nftId.toString() === pos.nftId.toString())
                .reduce(
                  (acc, cur) =>
                    acc.gt(BigNumber.from(cur.liquidity.toString())) ? acc : BigNumber.from(cur.liquidity.toString()),
                  BigNumber.from(0),
                ) || BigNumber.from(0)

            return {
              nonce: BigNumber.from('1'),
              tokenId: pos.nftId,
              operator: '0x0000000000000000000000000000000000000000',
              poolId: poolAddress,
              tickLower: pos.tickLower,
              tickUpper: pos.tickUpper,
              liquidity: BigNumber.from(pos.liquidity.toString()),
              // not used
              feeGrowthInsideLast: BigNumber.from(0),
              stakedLiquidity: joinedLiquidity,
              // not used
              rTokenOwed: BigNumber.from(0),
              token0: pos.pool.token0.address,
              token1: pos.pool.token1.address,
              fee: pos.pool.fee,
              endTime: pool?.[0]?.endTime,
              rewardPendings: [],
            }
          })
          .flat()
      })
      .flat()
      .filter(item => item.liquidity.gt(0))
  }, [farmingPools, userFarmInfo, isEVM, networkInfo])

  const [openPositions, closedPositions] = useMemo(
    () =>
      positions?.reduce<[PositionDetails[], PositionDetails[]]>(
        (acc, p) => {
          acc[p.liquidity?.eq(0) ? 1 : 0].push(p)
          return acc
        },
        [[], []],
      ) ?? [[], []],
    [positions],
  )

  const theme = useTheme()

  const {
    search: searchValueInQs = '',
    tab = VERSION.ELASTIC,
    nftId,
  } = useParsedQueryString<{
    search: string
    tab: string
    nftId: string
  }>()

  const navigate = useNavigate()
  const location = useLocation()
  const onSearch = (search: string) => {
    navigate(location.pathname + '?search=' + search + '&tab=' + tab, { replace: true })
  }

  const debouncedSearchText = useDebounce(searchValueInQs.trim().toLowerCase(), 300)

  const [showClosed, setShowClosed] = useState(false)

  const filteredFarmPositions = useMemo(
    () =>
      farmPositions.filter(pos => {
        return (
          debouncedSearchText.trim().length === 0 ||
          (!!tokenAddressSymbolMap.current[pos.token0.toLowerCase()] &&
            tokenAddressSymbolMap.current[pos.token0.toLowerCase()].includes(debouncedSearchText)) ||
          (!!tokenAddressSymbolMap.current[pos.token1.toLowerCase()] &&
            tokenAddressSymbolMap.current[pos.token1.toLowerCase()].includes(debouncedSearchText)) ||
          pos.poolId.toLowerCase() === debouncedSearchText
        )
      }),
    [debouncedSearchText, farmPositions],
  )

  const filteredPositions = useMemo(
    () =>
      (!showClosed
        ? [...openPositions, ...filteredFarmPositions]
        : [...openPositions, ...filteredFarmPositions, ...closedPositions]
      )
        .filter(position => {
          if (nftId) return position.tokenId.toString() === nftId
          return (
            debouncedSearchText.trim().length === 0 ||
            (!!tokenAddressSymbolMap.current[position.token0.toLowerCase()] &&
              tokenAddressSymbolMap.current[position.token0.toLowerCase()].includes(debouncedSearchText)) ||
            (!!tokenAddressSymbolMap.current[position.token1.toLowerCase()] &&
              tokenAddressSymbolMap.current[position.token1.toLowerCase()].includes(debouncedSearchText)) ||
            position.poolId.toLowerCase() === debouncedSearchText
          )
        })
        .filter((pos, index, array) => array.findIndex(pos2 => pos2.tokenId.eq(pos.tokenId)) === index),
    [showClosed, openPositions, closedPositions, debouncedSearchText, filteredFarmPositions, nftId],
  )

  const [showStaked, setShowStaked] = useState(false)

  const upToSmall = useMedia('(max-width: 768px)')

  const activeFarmAddress = useMemo(() => {
    const now = Date.now() / 1000
    return (
      farms
        ?.map(farm => farm.pools)
        .flat()
        ?.filter(farm => farm.endTime >= now)
        .map(farm => farm.poolAddress.toLowerCase()) || []
    )
  }, [farms])

  if (!isEVM) return <Navigate to="/" />
  return (
    <>
      <PageWrapper style={{ padding: 0, marginTop: '24px' }}>
        <AutoColumn gap="lg" style={{ width: '100%' }}>
          <InstructionText>
            <Trans>Here you can view all your liquidity and staked balances in the Elastic Pools</Trans>
            {!upToSmall && (
              <ExternalLink href={`${PROMM_ANALYTICS_URL[chainId]}/account/${account}`}>
                <Flex alignItems="center">
                  <Wallet size={16} />
                  <Text fontSize="14px" marginLeft="4px">
                    <Trans>Analyze Wallet</Trans> ↗
                  </Text>
                </Flex>
              </ExternalLink>
            )}
          </InstructionText>
          <TabRow>
            <Flex justifyContent="space-between" flex={1} alignItems="center" width="100%">
              <Flex sx={{ gap: '1rem' }} alignItems="center">
                <Tab
                  active={!showStaked}
                  role="button"
                  onClick={() => {
                    setShowStaked(false)
                  }}
                >
                  <Trans>My Positions</Trans>
                </Tab>

                <Tab
                  active={showStaked}
                  onClick={() => {
                    setShowStaked(true)
                  }}
                  role="button"
                >
                  {isMobile ? <Trans>Farming Positions</Trans> : <Trans>My Farming Positions</Trans>}
                </Tab>
              </Flex>

              {upToSmall && (
                <Flex sx={{ gap: '8px' }}>
                  <ExternalLink href={`${PROMM_ANALYTICS_URL[chainId]}/account/${account}`}>
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
                  <Tutorial type={TutorialType.ELASTIC_MY_POOLS} />
                  {renderNotificationButton(true)}
                </Flex>
              )}
            </Flex>
            <FilterRow>
              <Flex alignItems="center" style={{ gap: '8px' }}>
                <Text fontSize="14px" color={theme.subText}>
                  <Trans>Show closed positions</Trans>
                </Text>
                <Toggle isActive={showClosed} toggle={() => setShowClosed(prev => !prev)} />
              </Flex>
              <Search
                minWidth="254px"
                searchValue={searchValueInQs}
                onSearch={onSearch}
                placeholder={t`Search by token or pool address`}
              />
              {!upToSmall && (
                <>
                  <Tutorial type={TutorialType.ELASTIC_MY_POOLS} />
                  {renderNotificationButton(false)}
                </>
              )}
            </FilterRow>
          </TabRow>

          {!account ? (
            <Card padding="40px">
              <TYPE.body color={theme.text3} textAlign="center">
                <Trans>Connect to a wallet to view your liquidity.</Trans>
              </TYPE.body>
            </Card>
          ) : (positionsLoading && !positions) || (loading && !farms && !userFarmInfo) ? (
            <PositionCardGrid>
              <ContentLoader />
              <ContentLoader />
              <ContentLoader />
            </PositionCardGrid>
          ) : filteredPositions.length > 0 || filteredFarmPositions.length > 0 ? (
            <>
              {/* Use display attribute here instead of condition rendering to prevent re-render full list when toggle showStaked => increase performance */}
              <PositionCardGrid style={{ display: showStaked ? 'none' : 'grid' }}>
                {filteredPositions.map(p => (
                  <PositionListItem
                    refe={tokenAddressSymbolMap}
                    positionDetails={p}
                    key={p.tokenId.toString()}
                    hasUserDepositedInFarm={!!p.stakedLiquidity}
                    hasActiveFarm={activeFarmAddress.includes(p.poolId.toLowerCase())}
                  />
                ))}
              </PositionCardGrid>
              <PositionCardGrid style={{ display: !showStaked ? 'none' : 'grid' }}>
                {filteredFarmPositions.map(p => {
                  return (
                    <PositionListItem
                      key={p.tokenId.toString()}
                      stakedLayout
                      hasUserDepositedInFarm
                      refe={tokenAddressSymbolMap}
                      positionDetails={p}
                      hasActiveFarm={activeFarmAddress.includes(p.poolId.toLowerCase())}
                    />
                  )
                })}
              </PositionCardGrid>
            </>
          ) : (
            <Flex flexDirection="column" alignItems="center" marginTop="60px">
              <Info size={48} color={theme.subText} />
              <Text fontSize={16} lineHeight={1.5} color={theme.subText} textAlign="center" marginTop="1rem">
                <Trans>
                  No liquidity found. Check out our{' '}
                  <StyledInternalLink to={`${APP_PATHS.POOLS}/${networkInfo.route}?tab=elastic`}>
                    Pools.
                  </StyledInternalLink>
                </Trans>
              </Text>
            </Flex>
          )}
        </AutoColumn>
      </PageWrapper>
      <FarmUpdater />
    </>
  )
}
