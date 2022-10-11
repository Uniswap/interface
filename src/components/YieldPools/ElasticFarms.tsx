import { computePoolAddress } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { stringify } from 'querystring'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'react-feather'
import { useHistory, useLocation } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import FarmIssueAnnouncement from 'components/FarmIssueAnnouncement'
import LocalLoader from 'components/LocalLoader'
import ShareModal from 'components/ShareModal'
import Toggle from 'components/Toggle'
import { NETWORKS_INFO } from 'constants/networks'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useOpenModal } from 'state/application/hooks'
import { useElasticFarms, useFailedNFTs } from 'state/farms/elastic/hooks'
import { StyledInternalLink } from 'theme'
import { isAddressString } from 'utils'

import ElasticFarmGroup from './ElasticFarmGroup'
import { DepositModal, StakeUnstakeModal } from './ElasticFarmModals'
import HarvestModal from './ElasticFarmModals/HarvestModal'
import WithdrawModal from './ElasticFarmModals/WithdrawModal'
import { SharePoolContext } from './SharePoolContext'
import {
  HeadingContainer,
  HeadingRight,
  SearchContainer,
  SearchInput,
  StakedOnlyToggleText,
  StakedOnlyToggleWrapper,
} from './styleds'

type ModalType = 'deposit' | 'withdraw' | 'stake' | 'unstake' | 'harvest' | 'forcedWithdraw'

// this address exists on both Polygon and Avalanche

function ElasticFarms({ active }: { active: boolean }) {
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()
  const [stakedOnly, setStakedOnly] = useState({
    active: false,
    ended: false,
  })
  const activeTab = active ? 'active' : 'ended'

  const { farms, loading, userFarmInfo } = useElasticFarms()

  const failedNFTs = useFailedNFTs()

  const ref = useRef<HTMLDivElement>()
  const [open, setOpen] = useState(false)
  useOnClickOutside(ref, open ? () => setOpen(prev => !prev) : undefined)
  const qs = useParsedQueryString()
  const search = ((qs.search as string) || '').toLowerCase()
  const history = useHistory()
  const location = useLocation()

  const handleSearch = useCallback(
    (search: string) => {
      const target = {
        ...location,
        search: stringify({ ...qs, search }),
      }

      history.replace(target)
    },
    [history, location, qs],
  )

  const filteredFarms = useMemo(() => {
    const now = Date.now() / 1000

    // filter active/ended farm
    let result = farms
      ?.map(farm => {
        const pools = farm.pools.filter(pool => (active ? pool.endTime >= now : pool.endTime < now))
        return { ...farm, pools }
      })
      .filter(farm => !!farm.pools.length)

    const searchAddress = isAddressString(search)
    // filter by address
    if (searchAddress) {
      if (chainId)
        result = result?.map(farm => {
          farm.pools = farm.pools.filter(pool => {
            const poolAddress = computePoolAddress({
              factoryAddress: NETWORKS_INFO[chainId].elastic.coreFactory,
              tokenA: pool.token0.wrapped,
              tokenB: pool.token1.wrapped,
              fee: pool.pool.fee,
              initCodeHashManualOverride: NETWORKS_INFO[chainId].elastic.initCodeHash,
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
            pool.token0.symbol?.toLowerCase().includes(search) ||
            pool.token1.name?.toLowerCase().includes(search) ||
            pool.token1.name?.toLowerCase().includes(search)
          )
        })
        return farm
      })
    }

    if (stakedOnly[activeTab] && chainId) {
      result = result?.map(item => {
        if (!userFarmInfo?.[item.id].depositedPositions.length) {
          return { ...item, pools: [] }
        }
        const stakedPools = userFarmInfo?.[item.id].depositedPositions.map(pos =>
          computePoolAddress({
            factoryAddress: NETWORKS_INFO[chainId].elastic.coreFactory,
            tokenA: pos.pool.token0,
            tokenB: pos.pool.token1,
            fee: pos.pool.fee,
            initCodeHashManualOverride: NETWORKS_INFO[chainId].elastic.initCodeHash,
          }).toLowerCase(),
        )

        const pools = item.pools.filter(pool => stakedPools.includes(pool.poolAddress.toLowerCase()))
        return { ...item, pools }
      })
    }

    return result?.filter(farm => !!farm.pools.length) || []
  }, [farms, active, search, stakedOnly, activeTab, chainId, userFarmInfo])

  const noFarms = !filteredFarms.length

  const [selectedFarm, setSeletedFarm] = useState<null | string>(null)
  const [selectedModal, setSeletedModal] = useState<ModalType | null>(null)
  const [selectedPoolId, setSeletedPoolId] = useState<number | null>(null)

  const openShareModal = useOpenModal(ApplicationModal.SHARE)
  const isShareModalOpen = useModalOpen(ApplicationModal.SHARE)
  const [sharePoolAddress, setSharePoolAddress] = useState('')
  const networkRoute = chainId ? NETWORKS_INFO[chainId].route : undefined
  const shareUrl = sharePoolAddress
    ? `${window.location.origin}/farms?search=${sharePoolAddress}&tab=elastic&type=${activeTab}&networkId=${networkRoute}`
    : undefined

  const onDismiss = () => {
    setSeletedFarm(null)
    setSeletedModal(null)
    setSeletedPoolId(null)
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

      <HeadingContainer>
        <StakedOnlyToggleWrapper>
          <StakedOnlyToggleText>
            <Trans>Staked Only</Trans>
          </StakedOnlyToggleText>
          <Toggle
            isActive={stakedOnly[active ? 'active' : 'ended']}
            toggle={() => setStakedOnly(prev => ({ ...prev, [activeTab]: !prev[activeTab] }))}
          />
        </StakedOnlyToggleWrapper>
        <HeadingRight>
          <SearchContainer>
            <SearchInput
              placeholder={t`Search by token name or pool address`}
              maxLength={255}
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
            <Search color={theme.subText} />
          </SearchContainer>
        </HeadingRight>
      </HeadingContainer>

      {qs.type === 'ended' && qs.tab !== VERSION.CLASSIC && (
        <Text fontStyle="italic" fontSize={12} marginBottom="1rem" color={theme.subText}>
          <Trans>
            Your rewards may be automatically harvested a few days after the farm ends. Please check the{' '}
            <StyledInternalLink to="/farms?type=vesting">Vesting</StyledInternalLink> tab to see your rewards
          </Trans>
        </Text>
      )}

      {(!qs.type || qs.type === 'active') && qs.tab !== VERSION.CLASSIC && (
        <>
          <Text fontSize={12} fontWeight="500" marginBottom="0.375rem">
            <Trans>Farms will run in multiple phases</Trans>
          </Text>
          <Text fontStyle="italic" fontSize={12} marginBottom="1rem" color={theme.subText}>
            <Trans>
              Once the current phase ends, you can harvest your rewards from the farm in the{' '}
              <StyledInternalLink to="/farms?type=ended">Ended</StyledInternalLink> tab. To continue earning rewards in
              the new phase, you must restake your NFT position into the active farm
            </Trans>
          </Text>
        </>
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
            {stakedOnly[activeTab] || search ? (
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
                onOpenModal={(modalType: ModalType, pid?: number | string, forced?: boolean) => {
                  setSeletedModal(modalType)
                  setSeletedFarm(farm.id)
                  setSeletedPoolId(Number(pid) ?? null)
                }}
                pools={farm.pools}
                userInfo={userFarmInfo?.[farm.id]}
              />
            )
          })}
        </Flex>
      )}
      <ShareModal title={t`Share this farm with your friends!`} url={shareUrl} />
    </SharePoolContext.Provider>
  )
}

export default ElasticFarms
