import React, { useRef, useState, useMemo } from 'react'
import { Flex, Text } from 'rebass'
import { t, Trans } from '@lingui/macro'
import { AutoColumn } from 'components/Column'
import { useActiveWeb3React } from 'hooks'
import { useProAmmPositions } from 'hooks/useProAmmPositions'
import { PositionDetails } from 'types/position'
import PositionListItem from './PositionListItem'
import { FilterRow, Tab, PositionCardGrid, PageWrapper, InstructionText } from 'pages/Pool'
import Search from 'components/Search'
import useDebounce from 'hooks/useDebounce'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useHistory, useLocation } from 'react-router-dom'
import { Info } from 'react-feather'
import { StyledInternalLink, ExternalLink, TYPE } from 'theme'
import useTheme from 'hooks/useTheme'
import ContentLoader from './ContentLoader'
import Wallet from 'components/Icons/Wallet'
import { PROMM_ANALYTICS, CHAIN_ROUTE } from 'constants/index'
import { ChainId } from '@kyberswap/ks-sdk-core'
import FarmingPoolsToggle from 'components/Toggle/FarmingPoolsToggle'
import { useProMMFarmsFetchOnlyOne, useProMMFarms } from 'state/farms/promm/hooks'
import Card from 'components/Card'
import { VERSION } from 'constants/v2'

interface AddressSymbolMapInterface {
  [key: string]: string
}

export default function ProAmmPool() {
  const { account, chainId } = useActiveWeb3React()
  const tokenAddressSymbolMap = useRef<AddressSymbolMapInterface>({})
  const { positions, loading: positionsLoading } = useProAmmPositions(account)

  const farms = useProMMFarmsFetchOnlyOne()
  const { loading } = useProMMFarms()

  const farmPositions = useMemo(() => {
    return Object.values(farms)
      .map(item => item.map(it => it.userDepositedNFTs))
      .flat()
      .flat()
  }, [farms])

  const [openPositions, closedPositions] = positions?.reduce<[PositionDetails[], PositionDetails[]]>(
    (acc, p) => {
      acc[p.liquidity?.isZero() ? 1 : 0].push(p)
      return acc
    },
    [[], []],
  ) ?? [[], []]

  const theme = useTheme()

  const qs = useParsedQueryString()
  const searchValueInQs: string = (qs.search as string) ?? ''

  const history = useHistory()
  const location = useLocation()

  const tab = (qs.tab as string) || VERSION.ELASTIC

  const onSearch = (search: string) => {
    history.replace(location.pathname + '?search=' + search + '&tab=' + tab)
  }

  const debouncedSearchText = useDebounce(searchValueInQs.trim().toLowerCase(), 300)

  const [showClosed, setShowClosed] = useState(false)

  const filteredPositions = (!showClosed ? openPositions : [...openPositions, ...closedPositions]).filter(position => {
    return (
      debouncedSearchText.trim().length === 0 ||
      (!!tokenAddressSymbolMap.current[position.token0.toLowerCase()] &&
        tokenAddressSymbolMap.current[position.token0.toLowerCase()].includes(debouncedSearchText)) ||
      (!!tokenAddressSymbolMap.current[position.token1.toLowerCase()] &&
        tokenAddressSymbolMap.current[position.token1.toLowerCase()].includes(debouncedSearchText)) ||
      position.poolId.toLowerCase() === debouncedSearchText
    )
  })

  const filteredFarmPositions = farmPositions.filter(pos => {
    return (
      debouncedSearchText.trim().length === 0 ||
      (!!tokenAddressSymbolMap.current[pos.token0.toLowerCase()] &&
        tokenAddressSymbolMap.current[pos.token0.toLowerCase()].includes(debouncedSearchText)) ||
      (!!tokenAddressSymbolMap.current[pos.token1.toLowerCase()] &&
        tokenAddressSymbolMap.current[pos.token1.toLowerCase()].includes(debouncedSearchText)) ||
      pos.poolId.toLowerCase() === debouncedSearchText
    )
  })
  const [showStaked, setShowStaked] = useState(false)

  return (
    <>
      <PageWrapper style={{ padding: 0, marginTop: '24px' }}>
        <AutoColumn gap="lg" style={{ width: '100%' }}>
          <InstructionText>
            <Trans>Here you can view all your liquidity and staked balances in the Elastic Pools</Trans>
          </InstructionText>
          <Flex alignItems="center" justifyContent="space-between">
            <Flex justifyContent="space-between" flex={1} alignItems="center">
              <Flex sx={{ gap: '1.5rem' }} alignItems="center">
                <Tab
                  active={!showStaked}
                  role="button"
                  onClick={() => {
                    setShowStaked(false)
                  }}
                >
                  Pools
                </Tab>

                <Tab
                  active={showStaked}
                  onClick={() => {
                    setShowStaked(true)
                  }}
                  role="button"
                >
                  Staked Pools
                </Tab>
              </Flex>
            </Flex>

            <ExternalLink href={`${PROMM_ANALYTICS}/${CHAIN_ROUTE[chainId as ChainId]}/account/${account}`}>
              <Flex alignItems="center">
                <Wallet size={16} />
                <Text fontSize="14px" marginLeft="4px">
                  <Trans>Analyze Wallet</Trans>↗
                </Text>
              </Flex>
            </ExternalLink>
          </Flex>

          <FilterRow>
            <Flex alignItems="center" style={{ gap: '20px' }}>
              <Text fontSize="14px" color={theme.subText} marginRight="6px">
                <Trans>Show closed positions</Trans>
              </Text>
              <FarmingPoolsToggle isActive={showClosed} toggle={() => setShowClosed(prev => !prev)} />
            </Flex>
            <Search
              minWidth="254px"
              searchValue={searchValueInQs}
              onSearch={onSearch}
              placeholder={t`Search by token or pool address`}
            />
          </FilterRow>
          {!account ? (
            <Card padding="40px">
              <TYPE.body color={theme.text3} textAlign="center">
                <Trans>Connect to a wallet to view your liquidity.</Trans>
              </TYPE.body>
            </Card>
          ) : positionsLoading || loading ? (
            <PositionCardGrid>
              <ContentLoader />
              <ContentLoader />
              <ContentLoader />
            </PositionCardGrid>
          ) : (filteredPositions && filteredPositions.length > 0) || filteredFarmPositions.length > 0 ? (
            <PositionCardGrid>
              {!showStaked &&
                filteredPositions.map(p => {
                  return (
                    <PositionListItem refe={tokenAddressSymbolMap} key={p.tokenId.toString()} positionDetails={p} />
                  )
                })}

              {filteredFarmPositions.map(p => {
                return (
                  <PositionListItem
                    stakedLayout={showStaked}
                    farmAvailable
                    refe={tokenAddressSymbolMap}
                    key={p.tokenId.toString()}
                    positionDetails={p}
                  />
                )
              })}
            </PositionCardGrid>
          ) : (
            <Flex flexDirection="column" alignItems="center" marginTop="60px">
              <Info size={48} color={theme.subText} />
              <Text fontSize={16} lineHeight={1.5} color={theme.subText} textAlign="center" marginTop="1rem">
                <Trans>
                  No liquidity found. Check out our{' '}
                  <StyledInternalLink to="/pools?tab=elastic">Pools.</StyledInternalLink>
                </Trans>
              </Text>
            </Flex>
          )}
        </AutoColumn>
      </PageWrapper>
    </>
  )
}
