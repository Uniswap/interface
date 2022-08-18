import { Trans, t } from '@lingui/macro'
import { stringify } from 'querystring'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'react-feather'
import { useHistory, useLocation } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import FarmIssueAnnouncement from 'components/FarmIssueAnnouncement'
import InfoHelper from 'components/InfoHelper'
import LocalLoader from 'components/LocalLoader'
import Toggle from 'components/Toggle'
import { VERSION } from 'constants/v2'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useParsedQueryString from 'hooks/useParsedQueryString'
import useTheme from 'hooks/useTheme'
import { useBlockNumber } from 'state/application/hooks'
import { useFailedNFTs, useGetProMMFarms, useProMMFarms } from 'state/farms/promm/hooks'
import { ProMMFarm } from 'state/farms/promm/types'
import { StyledInternalLink } from 'theme'

import ProMMFarmGroup from './ProMMFarmGroup'
import { DepositModal, StakeUnstakeModal } from './ProMMFarmModals'
import HarvestModal from './ProMMFarmModals/HarvestModal'
import WithdrawModal from './ProMMFarmModals/WithdrawModal'
import {
  ClickableText,
  HeadingContainer,
  HeadingRight,
  ProMMFarmTableHeader,
  SearchContainer,
  SearchInput,
  StakedOnlyToggleText,
  StakedOnlyToggleWrapper,
} from './styleds'

type ModalType = 'deposit' | 'withdraw' | 'stake' | 'unstake' | 'harvest' | 'forcedWithdraw'

function ProMMFarms({ active }: { active: boolean }) {
  const theme = useTheme()
  const [stakedOnly, setStakedOnly] = useState({
    active: false,
    ended: false,
  })
  const activeTab = active ? 'active' : 'ended'
  const { data: farms, loading } = useProMMFarms()
  const getProMMFarms = useGetProMMFarms()

  const blockNumber = useBlockNumber()

  const failedNFTs = useFailedNFTs()

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

  const above1000 = useMedia('(min-width: 1000px)')

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
    const now = +new Date() / 1000
    return Object.keys(farms).reduce((acc: { [key: string]: ProMMFarm[] }, address) => {
      const currentFarms = farms[address].filter(farm => {
        const filterAcive = active ? farm.endTime >= now : farm.endTime < now
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

        return filterAcive && filterSearchText && filterStaked
      })

      if (currentFarms.length) acc[address] = currentFarms
      return acc
    }, {})
  }, [farms, active, activeTab, search, stakedOnly])

  const noFarms = !Object.keys(filteredFarms).length

  const [selectedFarm, setSeletedFarm] = useState<null | string>(null)
  const [selectedModal, setSeletedModal] = useState<ModalType | null>(null)
  const [selectedPoolId, setSeletedPoolId] = useState<number | null>(null)

  const onDismiss = () => {
    setSeletedFarm(null)
    setSeletedModal(null)
    setSeletedPoolId(null)
  }

  return (
    <>
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

          {!!failedNFTs.length && <FarmIssueAnnouncement />}
        </>
      )}

      {above1000 && (
        <ProMMFarmTableHeader>
          <Flex grid-area="token_pairs" alignItems="center" justifyContent="flex-start">
            <ClickableText>
              <Trans>Pool</Trans>
            </ClickableText>
          </Flex>

          {/*   <Flex grid-area="pool_fee" alignItems="center" justifyContent="flex-start">
            <HoverDropdown
              hideIcon
              padding="8px 0"
              content={
                <ClickableText sx={{ gap: '4px' }}>
                  <Trans>Target volume</Trans>
                  <Info size={12} />
                </ClickableText>
              }
              dropdownContent={
                <Text color={theme.subText} fontSize="12px" maxWidth="400px" lineHeight={1.5}>
                  <Trans>
                    Some farms have a target trading volume (represented by the progress bar) to determine the amount of
                    reward you will earn. The more trading volume your liquidity positions support, the more rewards per
                    second you will make.
                    <br />
                    <br />
                    Once you have fully unlocked the target volume, you will start earning the maximum rewards per
                    second. Adjusting the staked amount will recalculate the target volume.
                    <br />
                    Learn more{' '}
                    <ExternalLink href="https://docs.kyberswap.com/guides/farming-mechanisms">here.</ExternalLink>
                  </Trans>
                </Text>
              }
            />
          </Flex>
          */}

          <Flex grid-area="liq" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>Staked TVL</Trans>
            </ClickableText>
          </Flex>

          <Flex grid-area="apy" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>AVG APR</Trans>
            </ClickableText>
            <InfoHelper
              text={
                active
                  ? t`Average estimated return based on yearly fees of the pool and bonus rewards of the pool`
                  : t`Average estimated return based on yearly fees of the pool`
              }
            />
          </Flex>

          <Flex grid-area="end" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>Ending In</Trans>
            </ClickableText>
            <InfoHelper text={t`Once a farm has ended, you will continue to receive returns through LP Fees`} />
          </Flex>

          <Flex grid-area="staked_balance" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>My Deposit</Trans>
            </ClickableText>
          </Flex>

          <Flex grid-area="reward" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>My Rewards</Trans>
            </ClickableText>
          </Flex>

          <Flex grid-area="action" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>Actions</Trans>
            </ClickableText>
          </Flex>
        </ProMMFarmTableHeader>
      )}

      {loading && noFarms ? (
        <Flex backgroundColor={theme.background}>
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
        Object.keys(filteredFarms).map(fairLaunchAddress => {
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
        })
      )}
    </>
  )
}

export default ProMMFarms
