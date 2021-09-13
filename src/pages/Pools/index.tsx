import React, { useCallback, useState } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { SwapPoolTabs } from '../../components/NavigationTabs'
import { PageWrapper } from './styleds'

import { TYPE } from '../../theme'
import { Box, Flex, Text } from 'rebass'
import { RowBetween, RowFixed } from '../../components/Row'
import { ButtonSecondary, ButtonWithLink } from '../../components/Button'
import { AutoColumn } from '../../components/Column'

import { useActiveWeb3React } from '../../hooks'
import threeBlurredCircles from '../../assets/svg/three-blurred-circles.svg'
import { ChevronDown, X } from 'react-feather'
import { CardSection } from '../../components/earn/styled'
import CurrencySearchModal from '../../components/SearchModal/CurrencySearchModal'
import { Currency, Token } from '@swapr/sdk'
import { useLiquidityMiningFeatureFlag } from '../../hooks/useLiquidityMiningFeatureFlag'
import { useAllPairsWithLiquidityAndMaximumApyAndStakingIndicator } from '../../hooks/useAllPairsWithLiquidityAndMaximumApyAndStakingIndicator'
import ListFilter, { PairsFilterType } from '../../components/Pool/ListFilter'
import { useLPPairs } from '../../hooks/useLiquidityPositions'
import PairsList from '../../components/Pool/PairsList'
import CurrencyLogo from '../../components/CurrencyLogo'

const VoteCard = styled.div`
  overflow: hidden;
  background-color: ${({ theme }) => theme.bg1};
  border: 1px solid ${({ theme }) => theme.bg2};
  border-radius: 8px;
`

const TitleRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;
    width: 100%;
    flex-direction: column;
  `};
`

const ButtonRow = styled(RowFixed)`
  & > a + a {
    margin-left: 8px;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    justify-content: space-between;
    margin: 26px 0 8px 0;
  `};
`

const ResponsiveButtonSecondary = styled(ButtonSecondary)`
  width: fit-content;
  font-weight: 400;
  color: ${({ theme }) => theme.text1};
  border: 1px solid ${({ theme }) => theme.bg5};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
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

const ResetFilterIconContainer = styled(Flex)`
  border: solid 1px ${props => props.theme.bg3};
  border-radius: 8px;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
`

const ResetFilterIcon = styled(X)`
  width: 12px;
  height: 12px;
  color: ${props => props.theme.purple3};
`

interface TitleProps {
  filteredToken?: Token
  onCurrencySelection: (currency: Currency) => void
  onFilteredTokenReset: () => void
  aggregatedDataFilter: PairsFilterType
}

// decoupling the title from the rest of the component avoids full-rerender everytime the pair selection modal is opened
function Title({ onCurrencySelection, filteredToken, onFilteredTokenReset, aggregatedDataFilter }: TitleProps) {
  const [openTokenModal, setOpenTokenModal] = useState(false)
  const liquidityMiningEnabled = useLiquidityMiningFeatureFlag()

  const handleAllClick = useCallback(() => {
    setOpenTokenModal(true)
  }, [])

  const handleModalClose = useCallback(() => {
    setOpenTokenModal(false)
  }, [])

  const handleResetFilterLocal = useCallback(
    (e: any) => {
      onFilteredTokenReset()
      e.stopPropagation()
    },
    [onFilteredTokenReset]
  )

  return (
    <>
      <TitleRow style={{ marginTop: '1rem' }} padding={'0'}>
        <Flex alignItems="center">
          <Box mr="8px">
            <Text fontSize="26px" lineHeight="32px">
              Pairs
            </Text>
          </Box>
          <Box mr="8px">
            <Text fontSize="26px" lineHeight="32px">
              /
            </Text>
          </Box>
          {aggregatedDataFilter === PairsFilterType.MY ? (
            <Box>
              <TYPE.mediumHeader fontWeight="400" fontSize="26px" lineHeight="32px">
                MY PAIRS
              </TYPE.mediumHeader>
            </Box>
          ) : (
            <PointableFlex onClick={handleAllClick}>
              {!filteredToken && (
                <Box mr="6px" height="21px">
                  <img src={threeBlurredCircles} alt="Circles" />
                </Box>
              )}
              {filteredToken && (
                <Box mr="8px">
                  <CurrencyLogo currency={filteredToken} size="21px" />
                </Box>
              )}
              <Text mr="8px" fontWeight="600" fontSize="16px" lineHeight="20px">
                {filteredToken ? filteredToken.symbol : 'ALL'}
              </Text>
              <Box>
                <ChevronDown size={12} />
              </Box>
              {filteredToken && (
                <Box ml="6px">
                  <ResetFilterIconContainer onClick={handleResetFilterLocal}>
                    <ResetFilterIcon />
                  </ResetFilterIconContainer>
                </Box>
              )}
            </PointableFlex>
          )}
        </Flex>
        <ButtonRow>
          <ResponsiveButtonSecondary id="join-pool-button" as={Link} padding="8px 14px" to="/create">
            <Text fontWeight={700} fontSize={12}>
              CREATE PAIR
            </Text>
          </ResponsiveButtonSecondary>
          {liquidityMiningEnabled && (
            <ResponsiveButtonSecondary as={Link} padding="8px 14px" to="/liquidity-mining/create">
              <Text fontWeight={700} fontSize={12} lineHeight="15px">
                Create Rewards
              </Text>
            </ResponsiveButtonSecondary>
          )}
        </ButtonRow>
      </TitleRow>
      <CurrencySearchModal
        isOpen={openTokenModal}
        onDismiss={handleModalClose}
        onCurrencySelect={onCurrencySelection}
        showNativeCurrency={false}
      />
    </>
  )
}

export default function Pools() {
  const { account, chainId } = useActiveWeb3React()
  const [filterToken, setFilterToken] = useState<Token | undefined>()
  const [aggregatedDataFilter, setAggregatedDataFilter] = useState(PairsFilterType.ALL)
  const { loading: loadingAggregatedData, aggregatedData } = useAllPairsWithLiquidityAndMaximumApyAndStakingIndicator(
    aggregatedDataFilter,
    filterToken
  )
  const { loading: loadingUserLpPositions, data: userLpPairs } = useLPPairs(account || undefined)

  const handleCurrencySelect = useCallback(token => {
    setFilterToken(token as Token)
  }, [])

  const handleFilterTokenReset = useCallback(() => {
    setFilterToken(undefined)
  }, [])

  const handleFilterChange = useCallback(filter => {
    setAggregatedDataFilter(filter)
  }, [])

  return (
    <>
      <PageWrapper>
        <SwapPoolTabs active={'pool'} />
        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="27px" style={{ width: '100%' }}>
            <Title
              aggregatedDataFilter={aggregatedDataFilter}
              onCurrencySelection={handleCurrencySelect}
              filteredToken={filterToken}
              onFilteredTokenReset={handleFilterTokenReset}
            />
            <ListFilter filter={aggregatedDataFilter} onFilterChange={handleFilterChange} />
            {aggregatedDataFilter === PairsFilterType.MY ? (
              <PairsList loading={loadingUserLpPositions} aggregatedPairs={userLpPairs} />
            ) : (
              <PairsList
                loading={loadingUserLpPositions || loadingAggregatedData}
                aggregatedPairs={aggregatedData}
                filter={aggregatedDataFilter}
              />
            )}
          </AutoColumn>
        </AutoColumn>
        {account && (
          <ButtonWithLink
            link={`https://dxstats.eth.link/#/account/${account}?chainId=${chainId}`}
            text={'ACCOUNT ANALYTICS AND ACCRUED FEES'}
            marginTop="32px"
          />
        )}
        {/* Should not be needed since when we fetch liquidity positions from the subgraph */}
        {/* <TYPE.body color="text4" textAlign="center" fontWeight="500" fontSize="14px" lineHeight="17px" marginTop="32px">
          Don't see a pool you joined?{' '}
          <StyledInternalLink color="text5" id="import-pool-link" to="/find">
            Import it.
          </StyledInternalLink>
        </TYPE.body> */}
        <VoteCard style={{ marginTop: '32px' }}>
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <TYPE.body fontWeight={600} lineHeight="20px">
                  Liquidity provider rewards
                </TYPE.body>
              </RowBetween>
              <RowBetween>
                <TYPE.body fontWeight="500" fontSize="12px" lineHeight="20px" letterSpacing="-0.4px">
                  Liquidity providers earn a swap fee (0.25% by default, of which ~10% taken by the protocol as a fee)
                  on all trades proportional to their share of the pool.
                  <br /> Fees are added to the pool, accrue in real time and can be claimed by withdrawing your
                  liquidity.
                  <br /> The swap fee value is decided by DXdao and liquidty providers, it can be between 0% and 10% and
                  it uses 0.25% as default value that is assigned when the pair is created.
                </TYPE.body>
              </RowBetween>
            </AutoColumn>
          </CardSection>
        </VoteCard>
      </PageWrapper>
    </>
  )
}
