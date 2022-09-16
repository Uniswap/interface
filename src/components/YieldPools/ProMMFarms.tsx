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
import { useBlockNumber, useModalOpen, useOpenModal } from 'state/application/hooks'
import { useFailedNFTs, useGetProMMFarms, useProMMFarms } from 'state/farms/promm/hooks'
import { ProMMFarm } from 'state/farms/promm/types'
import { StyledInternalLink } from 'theme'

import ProMMFarmGroup from './ProMMFarmGroup'
import { DepositModal, StakeUnstakeModal } from './ProMMFarmModals'
import HarvestModal from './ProMMFarmModals/HarvestModal'
import WithdrawModal from './ProMMFarmModals/WithdrawModal'
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
const affectedFairlaunchAddress = '0x5C503D4b7DE0633f031229bbAA6A5e4A31cc35d8'

function ProMMFarms({ active }: { active: boolean }) {
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()
  const [stakedOnly, setStakedOnly] = useState({
    active: false,
    ended: false,
  })
  const activeTab = active ? 'active' : 'ended'
  const { data: farms, loading } = useProMMFarms()
  const getProMMFarms = useGetProMMFarms()

  const failedNFTs = useFailedNFTs()
  const blockNumber = useBlockNumber()

  useEffect(() => {
    getProMMFarms()
  }, [getProMMFarms, blockNumber])

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
    return Object.keys(farms).reduce((acc: { [key: string]: ProMMFarm[] }, address) => {
      const currentFarms = farms[address].filter(farm => {
        const filterActive = active ? farm.endTime >= now : farm.endTime < now
        const filterSearchText = search
          ? farm.token0.toLowerCase().includes(search) ||
            farm.token1.toLowerCase().includes(search) ||
            farm.poolAddress.toLowerCase() === search ||
            farm?.token0Info?.symbol?.toLowerCase().includes(search) ||
            farm?.token1Info?.symbol?.toLowerCase().includes(search) ||
            farm?.token0Info?.name?.toLowerCase().includes(search) ||
            farm?.token1Info?.name?.toLowerCase().includes(search)
          : true

        let filterStaked = true
        if (stakedOnly[activeTab]) {
          filterStaked = farm.userDepositedNFTs.length > 0
        }

        return filterActive && filterSearchText && filterStaked
      })

      if (currentFarms.length) acc[address] = currentFarms
      return acc
    }, {})
  }, [farms, active, search, stakedOnly, activeTab])

  const noFarms = !Object.keys(filteredFarms).length

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
    if (activeTab === 'active') {
      const shouldShow = farms?.[affectedFairlaunchAddress]
        ?.filter(farm => now <= farm.endTime) // active
        .flatMap(farm => farm.userDepositedNFTs.map(item => item.tokenId.toString()))
        .some(nft => failedNFTs.includes(nft))

      return shouldShow ? <FarmIssueAnnouncement isEnded={false} /> : null
    }

    if (activeTab === 'ended') {
      const shouldShow = farms?.[affectedFairlaunchAddress]
        ?.filter(farm => now > farm.endTime) // active
        .flatMap(farm => farm.userDepositedNFTs.map(item => item.tokenId.toString()))
        .some(nft => failedNFTs.includes(nft))

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
          {Object.keys(filteredFarms).map(fairLaunchAddress => {
            return (
              <ProMMFarmGroup
                key={fairLaunchAddress}
                address={fairLaunchAddress}
                onOpenModal={(modalType: ModalType, pid?: number, forced?: boolean) => {
                  setSeletedModal(modalType)
                  setSeletedFarm(fairLaunchAddress)
                  setSeletedPoolId(pid ?? null)
                }}
                farms={filteredFarms[fairLaunchAddress]}
              />
            )
          })}
        </Flex>
      )}
      <ShareModal title={t`Share this farm with your friends!`} url={shareUrl} />
    </SharePoolContext.Provider>
  )
}

export default ProMMFarms
