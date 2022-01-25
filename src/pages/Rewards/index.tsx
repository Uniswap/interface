import React, { useCallback, useEffect, useState } from 'react'
import styled from 'styled-components'
import { Redirect, RouteComponentProps } from 'react-router-dom'
import { SwapPoolTabs } from '../../components/NavigationTabs'
import { PageWrapper } from '../Pools/styleds'
import { Link } from 'react-router-dom'

import { TYPE } from '../../theme'
import { Box, Flex, Text } from 'rebass'
import { RowBetween, RowFixed } from '../../components/Row'
import { AutoColumn } from '../../components/Column'
import { ReactComponent as ThreeBlurredCircles } from '../../assets/svg/three-blurred-circles.svg'

import { ChevronDown } from 'react-feather'
import { useToken } from '../../hooks/Tokens'

import DoubleCurrencyLogo from '../../components/DoubleLogo'
import { PairState, usePair } from '../../data/Reserves'

import PairSearchModal from '../../components/SearchModal/PairSearchModal'
import { ButtonSecondary } from '../../components/Button'
import { useLiquidityMiningFeatureFlag } from '../../hooks/useLiquidityMiningFeatureFlag'

import { PairsFilterType } from '../../components/Pool/ListFilter'

import { Pair } from '@swapr/sdk'
import { ResetFilterIcon, ResetFilterIconContainer } from '../Pools'
import { useRouter } from '../../hooks/useRouter'
import { RewardsList } from '../../components/LiquidityMiningCampaigns/RewardsList'

const TitleRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
    flex-direction: column-reverse;
  `};
`

const PointableFlex = styled(Flex)`
  border: solid 1px ${props => props.theme.bg3};
  border-radius: 8px;
  height: 36px;
  align-items: center;
  padding: 0 10px;
  cursor: pointer;
`

const ResponsiveButtonSecondary = styled(ButtonSecondary)`
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `};
`

const ButtonRow = styled(RowFixed)`
  gap: 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    flex-direction: column;
    justify-content: space-between;
    margin-bottom: 8px;
  `};
`

export default function Rewards({
  match: {
    params: { currencyIdA, currencyIdB }
  }
}: RouteComponentProps<{ currencyIdA: string; currencyIdB: string }>) {
  const router = useRouter()
  const token0 = useToken(currencyIdA)
  const token1 = useToken(currencyIdB)

  const wrappedPair = usePair(token0 || undefined, token1 || undefined)
  const [aggregatedDataFilter, setAggregatedDataFilter] = useState(PairsFilterType.ALL)
  const [filterPair, setFilterPair] = useState<Pair | null>(null)

  const liquidityMiningEnabled = useLiquidityMiningFeatureFlag()
  const [openPairsModal, setOpenPairsModal] = useState(false)

  useEffect(() => {
    if (filterPair) return
    if (wrappedPair[0] === PairState.NOT_EXISTS || wrappedPair[0] === PairState.LOADING) setFilterPair(null)
    else if (wrappedPair[0] === PairState.EXISTS && !filterPair) setFilterPair(wrappedPair[1])
  }, [wrappedPair, filterPair])

  const handleAllClick = useCallback(() => {
    setOpenPairsModal(true)
  }, [])

  useEffect(() => {
    if (router.location.state?.showSwpr) {
      setAggregatedDataFilter(PairsFilterType.SWPR)
    }
  }, [router])

  const handleModalClose = useCallback(() => {
    setOpenPairsModal(false)
  }, [])

  const handlePairSelect = useCallback(
    pair => {
      router.push({
        pathname: `/rewards/${pair.token0.address}/${pair.token1.address}`
      })
      setFilterPair(pair)
    },
    [router]
  )
  const handleFilterTokenReset = useCallback(
    e => {
      setAggregatedDataFilter(PairsFilterType.ALL)
      router.push({
        pathname: `/rewards`
      })
      setFilterPair(null)
      e.stopPropagation()
    },
    [router]
  )

  if (token0 && (wrappedPair[0] === PairState.NOT_EXISTS || wrappedPair[0] === PairState.INVALID)) {
    return <Redirect to="/rewards" />
  }

  return (
    <>
      <PageWrapper>
        <SwapPoolTabs active={'pool'} />

        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="lg" style={{ width: '100%' }}>
            <TitleRow style={{ marginTop: '1rem' }} padding={'0'}>
              <Flex alignItems="center">
                <Box mr="8px">
                  <TYPE.mediumHeader
                    onClick={handleFilterTokenReset}
                    style={{ cursor: 'pointer' }}
                    fontWeight="400"
                    fontSize="26px"
                    lineHeight="32px"
                    color="text4"
                  >
                    Rewards
                  </TYPE.mediumHeader>
                </Box>
                <Box mr="8px">
                  <TYPE.mediumHeader fontWeight="400" fontSize="26px" lineHeight="32px" color="text4">
                    /
                  </TYPE.mediumHeader>
                </Box>
                <PointableFlex onClick={handleAllClick}>
                  {!filterPair && wrappedPair[0] === PairState.LOADING && (
                    <Box mr="6px" height="21px">
                      <ThreeBlurredCircles />
                    </Box>
                  )}
                  {filterPair && (
                    <Box mr="4px">
                      <DoubleCurrencyLogo
                        loading={!filterPair.token0 || !filterPair.token1}
                        currency0={filterPair.token0 || undefined}
                        currency1={filterPair.token1 || undefined}
                        size={20}
                      />
                    </Box>
                  )}
                  <Box mr="4px">
                    <Text fontWeight="600" fontSize="16px" lineHeight="20px">
                      {filterPair
                        ? `${filterPair.token0.symbol}/${filterPair.token1.symbol}`
                        : wrappedPair[0] === PairState.LOADING
                        ? 'LOADING'
                        : aggregatedDataFilter === PairsFilterType.MY
                        ? 'MY PAIRS'
                        : aggregatedDataFilter === PairsFilterType.SWPR
                        ? 'SWAPR'
                        : 'ALL'}
                    </Text>
                  </Box>

                  {aggregatedDataFilter !== PairsFilterType.ALL || filterPair ? (
                    <Box ml="6px">
                      <ResetFilterIconContainer onClick={handleFilterTokenReset}>
                        <ResetFilterIcon />
                      </ResetFilterIconContainer>
                    </Box>
                  ) : (
                    <Box>
                      <ChevronDown size={12} />
                    </Box>
                  )}
                </PointableFlex>
              </Flex>
              <ButtonRow>
                {liquidityMiningEnabled && (
                  <ResponsiveButtonSecondary as={Link} padding="8px 14px" to="/liquidity-mining/create">
                    <Text fontWeight={700} fontSize={12} lineHeight="15px">
                      CREATE CAMPAIGN
                    </Text>
                  </ResponsiveButtonSecondary>
                )}
              </ButtonRow>
            </TitleRow>
          </AutoColumn>
        </AutoColumn>
        <RewardsList
          pair={
            filterPair !== null && filterPair.token0 !== undefined && filterPair.token1 !== undefined
              ? filterPair
              : undefined
          }
          loading={wrappedPair[0] === PairState.LOADING}
          dataFilter={aggregatedDataFilter}
          setDataFiler={setAggregatedDataFilter}
        />
      </PageWrapper>
      <PairSearchModal isOpen={openPairsModal} onDismiss={handleModalClose} onPairSelect={handlePairSelect} />
    </>
  )
}
