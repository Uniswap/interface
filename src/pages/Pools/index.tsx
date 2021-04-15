import React, { useCallback, useState } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import { SwapPoolTabs } from '../../components/NavigationTabs'
import { PageWrapper } from './styleds'

import { TYPE } from '../../theme'
import { Box, Flex, Text } from 'rebass'
import { RowBetween, RowFixed } from '../../components/Row'
import { ButtonPrimary, ButtonSecondary, ButtonWithLink } from '../../components/Button'
import { AutoColumn } from '../../components/Column'

import { useActiveWeb3React } from '../../hooks'
import threeBlurredCircles from '../../assets/svg/three-blurred-circles.svg'
import { ChevronDown } from 'react-feather'
import AggregatedPairsList from '../../components/Pool/AggregatedPairsList'
import { CardSection } from '../../components/earn/styled'
import CurrencySearchModal from '../../components/SearchModal/CurrencySearchModal'
import { useRouter } from '../../hooks/useRouter'
import { Currency } from 'dxswap-sdk'
import { useLiquidityMiningFeatureFlag } from '../../hooks/useLiquidityMiningFeatureFlag'
import { useAggregatedByToken0ExistingPairsWithRemainingRewardsAndMaximumApy } from '../../hooks/useAggregatedByToken0ExistingPairsWithRemainingRewardsAndMaximumApy'
import { PairsFilterType } from '../../components/Pool/ListFilter'
import { useLPPairs } from '../../hooks/useLiquidityPositions'

const VoteCard = styled.div`
  overflow: hidden;
  background-color: ${({ theme }) => theme.bg1};
  border: 1px solid ${({ theme }) => theme.bg2};
  border-radius: 8px;
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
  gap: 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    flex-direction: column;
    justify-content: space-between;
    margin-bottom: 8px;
  `};
`

const ResponsiveButtonPrimary = styled(ButtonPrimary)`
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `};
`

const ResponsiveButtonSecondary = styled(ButtonSecondary)`
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
  `};
`

const PointableFlex = styled(Flex)`
  cursor: pointer;
`

interface TitleProps {
  onCurrencySelection: (currency: Currency) => void
}

// decoupling the title from the rest of the component avoids full-rerender everytime the pair selection modal is opened
function Title({ onCurrencySelection }: TitleProps) {
  const [openTokenModal, setOpenTokenModal] = useState(false)
  const liquidityMiningEnabled = useLiquidityMiningFeatureFlag()

  const handleAllClick = useCallback(() => {
    setOpenTokenModal(true)
  }, [])

  const handleModalClose = useCallback(() => {
    setOpenTokenModal(false)
  }, [])

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
          <Box mr="6px">
            <img src={threeBlurredCircles} alt="Circles" />
          </Box>
          <PointableFlex onClick={handleAllClick}>
            <Box>
              <Text mr="8px" fontWeight="600" fontSize="16px" lineHeight="20px">
                ALL
              </Text>
            </Box>
            <Box>
              <ChevronDown size={12} />
            </Box>
          </PointableFlex>
        </Flex>
        <ButtonRow>
          <ResponsiveButtonPrimary id="join-pool-button" as={Link} padding="8px 14px" to="/create">
            <Text fontWeight={700} fontSize={12}>
              CREATE PAIR
            </Text>
          </ResponsiveButtonPrimary>
          {liquidityMiningEnabled && (
            <ResponsiveButtonSecondary as={Link} padding="8px 14px" to="/liquidity-mining/create">
              <Text fontWeight={700} fontSize={12} lineHeight="15px">
                CREATE LIQ. MINING
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
  const router = useRouter()
  const [aggregatedDataFilter, setAggregatedDataFilter] = useState(PairsFilterType.ALL)
  const {
    loading: loadingAggregatedData,
    aggregatedData
  } = useAggregatedByToken0ExistingPairsWithRemainingRewardsAndMaximumApy(aggregatedDataFilter)
  const { loading: loadingUserLpPositions, pairs: userLpPairs } = useLPPairs(account || undefined)

  const handleCurrencySelect = useCallback(
    token => {
      router.push({
        pathname: `/pools/${token.address}`
      })
    },
    [router]
  )

  return (
    <>
      <PageWrapper>
        <SwapPoolTabs active={'pool'} />
        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="32px" style={{ width: '100%' }}>
            <Title onCurrencySelection={handleCurrencySelect} />
            <AggregatedPairsList
              loading={loadingUserLpPositions || loadingAggregatedData}
              aggregatedData={aggregatedData}
              userLpPairs={userLpPairs}
              filter={aggregatedDataFilter}
              onFilterChange={setAggregatedDataFilter}
            />
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
