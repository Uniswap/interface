import { computePoolAddress } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import FarmIssueAnnouncement from 'components/FarmIssueAnnouncement'
import LocalLoader from 'components/LocalLoader'
import ShareModal from 'components/ShareModal'
import { APP_PATHS, FARM_TAB } from 'constants/index'
import { EVMNetworkInfo } from 'constants/networks/type'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useOpenModal } from 'state/application/hooks'
import { useElasticFarms, useFailedNFTs } from 'state/farms/elastic/hooks'
import { FarmingPool } from 'state/farms/elastic/types'
import { StyledInternalLink } from 'theme'
import { isAddressString } from 'utils'

import ElasticFarmGroup from './ElasticFarmGroup'
import { DepositModal, StakeUnstakeModal } from './ElasticFarmModals'
import HarvestModal from './ElasticFarmModals/HarvestModal'
import WithdrawModal from './ElasticFarmModals/WithdrawModal'
import { SharePoolContext } from './SharePoolContext'

type ModalType = 'deposit' | 'withdraw' | 'stake' | 'unstake' | 'harvest' | 'forcedWithdraw'

function ElasticFarms({ stakedOnly }: { stakedOnly: { active: boolean; ended: boolean } }) {
  const theme = useTheme()
  const { isEVM, networkInfo, chainId } = useActiveWeb3React()

  const [searchParams] = useSearchParams()
  const filteredToken0Id = searchParams.get('token0') || undefined
  const filteredToken1Id = searchParams.get('token1') || undefined

  const { farms, loading, userFarmInfo } = useElasticFarms()

  const failedNFTs = useFailedNFTs()

  const ref = useRef<HTMLDivElement>()
  const [open, setOpen] = useState(false)
  useOnClickOutside(ref, open ? () => setOpen(prev => !prev) : undefined)
  const qs = useParsedQueryString<{ search: string; type: string; tab: string }>()

  const type = searchParams.get('type')
  const activeTab: string = type || FARM_TAB.ACTIVE
  const stakedOnlyKey = activeTab === FARM_TAB.ACTIVE ? 'active' : 'ended'

  const tab = searchParams.get('tab')
  const search: string = searchParams.get('search')?.toLowerCase() || ''

  const filteredFarms = useMemo(() => {
    const now = Date.now() / 1000

    // filter active/ended farm
    let result = farms
      ?.map(farm => {
        const pools = farm.pools.filter(pool =>
          activeTab === FARM_TAB.MY_FARMS
            ? true
            : activeTab === FARM_TAB.ACTIVE
            ? pool.endTime >= now
            : pool.endTime < now,
        )
        return { ...farm, pools }
      })
      .filter(farm => !!farm.pools.length)

    const searchAddress = isAddressString(chainId, search)
    // filter by address
    if (searchAddress) {
      if (isEVM)
        result = result?.map(farm => {
          farm.pools = farm.pools.filter(pool => {
            const poolAddress = computePoolAddress({
              factoryAddress: (networkInfo as EVMNetworkInfo).elastic.coreFactory,
              tokenA: pool.token0.wrapped,
              tokenB: pool.token1.wrapped,
              fee: pool.pool.fee,
              initCodeHashManualOverride: (networkInfo as EVMNetworkInfo).elastic.initCodeHash,
            })
            return [poolAddress, pool.pool.token1.address, pool.pool.token0.address].includes(searchAddress)
          })
          return farm
        })
    } else {
      // filter by symbol and name of token
      result = result?.map(farm => {
        farm.pools = farm.pools.filter(pool => {
          return (
            pool.token0.symbol?.toLowerCase().includes(search) ||
            pool.token1.symbol?.toLowerCase().includes(search) ||
            pool.token0.name?.toLowerCase().includes(search) ||
            pool.token1.name?.toLowerCase().includes(search)
          )
        })
        return farm
      })
    }

    if (filteredToken0Id || filteredToken1Id) {
      if (filteredToken1Id && filteredToken0Id) {
        result = result?.map(farm => {
          farm.pools = farm.pools.filter(pool => {
            return (
              (pool.token0.wrapped.address.toLowerCase() === filteredToken0Id.toLowerCase() &&
                pool.token1.wrapped.address.toLowerCase() === filteredToken1Id.toLowerCase()) ||
              (pool.token1.wrapped.address.toLowerCase() === filteredToken0Id.toLowerCase() &&
                pool.token0.wrapped.address.toLowerCase() === filteredToken1Id.toLowerCase())
            )
          })
          return farm
        })
      } else {
        const address = filteredToken1Id || filteredToken0Id
        result = result?.map(farm => {
          farm.pools = farm.pools.filter(pool => {
            return (
              pool.token0.wrapped.address.toLowerCase() === address?.toLowerCase() ||
              pool.token1.wrapped.address.toLowerCase() === address?.toLowerCase()
            )
          })
          return farm
        })
      }
    }

    if ((stakedOnly[stakedOnlyKey] || activeTab === FARM_TAB.MY_FARMS) && isEVM) {
      result = result?.map(item => {
        if (!userFarmInfo?.[item.id].depositedPositions.length) {
          return { ...item, pools: [] }
        }
        const stakedPools = userFarmInfo?.[item.id].depositedPositions.map(pos =>
          computePoolAddress({
            factoryAddress: (networkInfo as EVMNetworkInfo).elastic.coreFactory,
            tokenA: pos.pool.token0,
            tokenB: pos.pool.token1,
            fee: pos.pool.fee,
            initCodeHashManualOverride: (networkInfo as EVMNetworkInfo).elastic.initCodeHash,
          }).toLowerCase(),
        )

        const pools = item.pools.filter(pool => stakedPools.includes(pool.poolAddress.toLowerCase()))
        return { ...item, pools }
      })
    }

    return result?.filter(farm => !!farm.pools.length) || []
  }, [
    farms,
    search,
    stakedOnly,
    stakedOnlyKey,
    activeTab,
    chainId,
    userFarmInfo,
    isEVM,
    networkInfo,
    filteredToken0Id,
    filteredToken1Id,
  ])

  const noFarms = !filteredFarms.length

  const [selectedFarm, setSeletedFarm] = useState<null | string>(null)
  const [selectedModal, setSeletedModal] = useState<ModalType | null>(null)
  const [selectedPool, setSeletedPool] = useState<FarmingPool>()
  const pid = selectedPool?.pid
  const selectedPoolId = Number.isNaN(Number(pid)) ? null : Number(pid)

  const openShareModal = useOpenModal(ApplicationModal.SHARE)
  const isShareModalOpen = useModalOpen(ApplicationModal.SHARE)
  const [sharePoolAddress, setSharePoolAddress] = useState('')
  const networkRoute = networkInfo.route || undefined
  const shareUrl = sharePoolAddress
    ? `${window.location.origin}/farms/${networkRoute}?search=${sharePoolAddress}&tab=elastic&type=${activeTab}`
    : undefined

  const onDismiss = () => {
    setSeletedFarm(null)
    setSeletedModal(null)
    setSeletedPool(undefined)
  }

  const renderAnnouncement = () => {
    // show announcement only when user was affected in one of the visible farms on the UI
    const now = Date.now() / 1000

    if (activeTab === 'ended') {
      const endedFarms = farms?.filter(farm => farm.pools.every(p => p.endTime < now))
      const shouldShow = endedFarms?.some(farm =>
        userFarmInfo?.[farm.id].depositedPositions
          .map(pos => pos.nftId.toString())
          .some(nft => failedNFTs.includes(nft)),
      )
      return shouldShow ? <FarmIssueAnnouncement isEnded /> : null
    }

    return null
  }

  useEffect(() => {
    if (sharePoolAddress) {
      openShareModal()
    }
  }, [openShareModal, sharePoolAddress])

  useEffect(() => {
    setSharePoolAddress(addr => {
      if (!isShareModalOpen) {
        return ''
      }

      return addr
    })
  }, [isShareModalOpen, setSharePoolAddress])

  return (
    <SharePoolContext.Provider value={setSharePoolAddress}>
      {selectedFarm && selectedModal === 'deposit' && (
        <DepositModal selectedFarmAddress={selectedFarm} onDismiss={onDismiss} />
      )}

      {selectedFarm && selectedPoolId !== null && ['stake', 'unstake'].includes(selectedModal || '') && (
        <StakeUnstakeModal
          type={selectedModal as any}
          poolId={selectedPoolId}
          poolAddress={selectedPool?.poolAddress ?? ''}
          selectedFarmAddress={selectedFarm}
          onDismiss={onDismiss}
        />
      )}

      {selectedFarm && selectedModal === 'withdraw' && (
        <WithdrawModal selectedFarmAddress={selectedFarm} onDismiss={onDismiss} />
      )}

      {selectedFarm && selectedModal === 'forcedWithdraw' && (
        <WithdrawModal selectedFarmAddress={selectedFarm} onDismiss={onDismiss} forced />
      )}

      {selectedFarm && selectedModal === 'harvest' && (
        <HarvestModal farmsAddress={selectedFarm} poolId={selectedPoolId} onDismiss={onDismiss} />
      )}

      {renderAnnouncement()}

      {type === FARM_TAB.ENDED && tab !== VERSION.CLASSIC && (
        <Text fontStyle="italic" fontSize={12} marginBottom="1rem" color={theme.subText}>
          <Trans>
            Your rewards may be automatically harvested a few days after the farm ends. Please check the{' '}
            <StyledInternalLink to={`${APP_PATHS.FARMS}/${networkInfo.route}?type=vesting`}>Vesting</StyledInternalLink>{' '}
            tab to see your rewards
          </Trans>
        </Text>
      )}

      {(!type || type === FARM_TAB.ACTIVE) && qs.tab !== VERSION.CLASSIC && (
        <Text fontSize={12} marginBottom="1.25rem" color={theme.subText}>
          <Trans>
            Note: Farms will run in{' '}
            <Text as="span" color={theme.warning}>
              multiple phases
            </Text>
            . Once the current phase ends, you can harvest your rewards from the farm in the{' '}
            <StyledInternalLink to={`${APP_PATHS.FARMS}/${networkInfo.route}?type=${FARM_TAB.ENDED}`}>
              Ended
            </StyledInternalLink>{' '}
            tab. To continue earning rewards in the new phase, you must restake your NFT position into the active farm
          </Trans>
        </Text>
      )}

      {loading && noFarms ? (
        <Flex
          sx={{
            borderRadius: '16px',
          }}
          backgroundColor={theme.background}
        >
          <LocalLoader />
        </Flex>
      ) : noFarms ? (
        <Flex
          backgroundColor={theme.background}
          justifyContent="center"
          padding="32px"
          style={{ borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}
        >
          <Text color={theme.subText}>
            {stakedOnly[stakedOnlyKey] || search ? (
              <Trans>No Farms found</Trans>
            ) : (
              <Trans>Currently there are no Farms.</Trans>
            )}
          </Text>
        </Flex>
      ) : (
        <Flex
          sx={{
            flexDirection: 'column',
            rowGap: '48px',
          }}
        >
          {filteredFarms.map(farm => {
            return (
              <ElasticFarmGroup
                key={farm.id}
                address={farm.id}
                onOpenModal={(modalType: ModalType, pool?: FarmingPool) => {
                  setSeletedModal(modalType)
                  setSeletedFarm(farm.id)
                  setSeletedPool(pool)
                }}
                pools={farm.pools}
                userInfo={userFarmInfo?.[farm.id]}
              />
            )
          })}
        </Flex>
      )}
      <ShareModal
        title={!sharePoolAddress ? t`Share farms with your friends` : t`Share this farm with your friends!`}
        url={shareUrl}
      />
    </SharePoolContext.Provider>
  )
}

export default ElasticFarms
