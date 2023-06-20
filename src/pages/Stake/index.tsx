import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { SupportedChainId } from 'constants/chains'
import { useMemo, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
//import { useInfiniteQuery } from 'react-query'
import { useStakingPools } from 'state/pool/hooks'
import styled from 'styled-components/macro'

//import { ButtonPrimary } from '../../components/Button'
import { OutlineCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import CreateModal from '../../components/createPool/CreateModal'
//import PoolCard from '../../components/earn/PoolCard'
import { CardBGImage, CardNoise, CardSection, DataCard } from '../../components/earn/styled'
import Loader from '../../components/Loader'
import PoolPositionList from '../../components/PoolPositionList'
import { RowBetween } from '../../components/Row'
//import { LoadingSparkle } from '../../nft/components/common/Loading/LoadingSparkle'
import { Center } from '../../nft/components/Flex'
import { useModalIsOpen, useToggleCreateModal } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import { PoolRegisteredLog, useBscPools, useRegisteredPools, useRegistryContract } from '../../state/pool/hooks'
import { ThemedText } from '../../theme'
//import { PoolPositionDetails } from '../../types/position'

//export interface PoolEventResponse {
//  events: PoolRegisteredLog[]
//  cursor?: string
//}

const PageWrapper = styled(AutoColumn)`
  padding: 68px 8px 0px;
  max-width: 640px;
  width: 100%;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding: 48px 8px 0px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 20px;
  }
`

const TopSection = styled(AutoColumn)`
  max-width: 720px;
  width: 100%;
`

//const PoolSection = styled.div`
//  display: grid;
//  grid-template-columns: 1fr;
//  column-gap: 10px;
//  row-gap: 15px;
//  width: 100%;
//  justify-self: center;
//`

const MainContentWrapper = styled.main`
  background-color: ${({ theme }) => theme.deprecated_bg1};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  padding: 0;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
`

const DataRow = styled(RowBetween)`
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
flex-direction: column;
`};
`

function highestAprFirst(a: any, b: any) {
  return b.apr - a.apr
}

export default function Stake() {
  const showDelegateModal = useModalIsOpen(ApplicationModal.CREATE)
  const toggleCreateModal = useToggleCreateModal()

  const itemsPerPage = 10
  const [hasMore, setHasMore] = useState(true)
  const [records, setRecords] = useState(itemsPerPage)

  // TODO: return loading
  const smartPoolsLogs = useRegisteredPools()
  const registry = useRegistryContract()
  const bscPools = useBscPools(registry)
  const { chainId } = useWeb3React()

  const allPools: PoolRegisteredLog[] = useMemo(() => {
    if (chainId === SupportedChainId.BNB) return [...(smartPoolsLogs ?? []), ...(bscPools ?? [])]
    return [...(smartPoolsLogs ?? [])]
  }, [chainId, smartPoolsLogs, bscPools])

  const poolAddresses = allPools.map((p) => p.pool)
  const poolIds = allPools.map((p) => p.id)
  const { stakingPools, loading: loadingPools } = useStakingPools(poolAddresses, poolIds)

  // TODO: check PoolPositionDetails type as irr and apr are number not string
  const poolsWithStats: PoolRegisteredLog[] = useMemo(() => {
    return allPools
      .map((p, i) => {
        const apr = stakingPools?.[i].apr
        const irr = stakingPools?.[i].irr
        return {
          ...p,
          irr,
          apr,
        }
      })
      .sort(highestAprFirst)
  }, [allPools, stakingPools])

  // TODO: useStakingPools hook also returns stake, ownStake, can use as filter and add stake to page
  //const [activeFilters, filtersDispatch] = useReducer(reduceFilters, initialFilterState)

  const fetchMoreData = () => {
    if (poolsWithStats && records === poolsWithStats.length) {
      setHasMore(false)
    } else {
      setTimeout(() => {
        setRecords(records + itemsPerPage)
      }, 500)
    }
  }

  const showItems = (records: number, poolsWithStats: PoolRegisteredLog[]) => {
    const items: PoolRegisteredLog[] = []

    for (let i = 0; i < records; i++) {
      if (poolsWithStats[i] !== undefined) {
        items.push(poolsWithStats[i])
      }
    }

    return items
  }

  const items = useMemo(() => {
    if (!poolsWithStats) return []
    return showItems(records, poolsWithStats)
  }, [records, poolsWithStats])

  return (
    <PageWrapper gap="lg" justify="center">
      <TopSection gap="md">
        <DataCard>
          <CardBGImage />
          <CardNoise />
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <ThemedText.DeprecatedWhite fontWeight={600}>
                  <Trans>Staking Pools</Trans>
                </ThemedText.DeprecatedWhite>
              </RowBetween>
              <RowBetween>
                <ThemedText.DeprecatedWhite fontSize={14}>
                  <Trans>Select a pool to stake to, you will keep your voting power and earn staking rewards.</Trans>
                </ThemedText.DeprecatedWhite>
              </RowBetween>{' '}
            </AutoColumn>
          </CardSection>
          <CardBGImage />
          <CardNoise />
        </DataCard>
      </TopSection>

      <AutoColumn gap="lg" style={{ width: '100%', maxWidth: '720px' }}>
        <DataRow style={{ alignItems: 'baseline' }}>
          <ThemedText.DeprecatedMediumHeader style={{ marginTop: '0.5rem' }}>
            <Trans>All Pools</Trans>
          </ThemedText.DeprecatedMediumHeader>
          {/* TODO: must add stake modal to stake for user or for pool */}
          <CreateModal isOpen={showDelegateModal} onDismiss={toggleCreateModal} title={<Trans>Stake</Trans>} />
          {/*<ButtonPrimary style={{ width: 'fit-content' }} padding="8px" $borderRadius="8px" onClick={toggleCreateModal}>
            <Trans>Stake</Trans>
          </ButtonPrimary>*/}
        </DataRow>

        <MainContentWrapper>
          {/* TODO: check why on some mobile wallets pool list not rendered */}
          {!poolsWithStats ? (
            <OutlineCard>
              <Trans>Please connect your wallet</Trans>
            </OutlineCard>
          ) : loadingPools ? (
            <Loader style={{ margin: 'auto' }} />
          ) : poolsWithStats?.length > 0 ? (
            <InfiniteScroll
              next={fetchMoreData}
              hasMore={!!hasMore}
              loader={
                loadingPools ? (
                  <Center paddingY="20">
                    <h4>Loading...</h4>
                  </Center>
                ) : null
              }
              dataLength={poolsWithStats.length}
              style={{ overflow: 'unset' }}
            >
              <PoolPositionList positions={items} filterByOperator={false} />
            </InfiniteScroll>
          ) : poolsWithStats?.length === 0 ? (
            <OutlineCard>
              <Trans>No pool found</Trans>
            </OutlineCard>
          ) : null}
        </MainContentWrapper>
      </AutoColumn>
    </PageWrapper>
  )
}
