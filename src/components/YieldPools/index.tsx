import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { useMedia } from 'react-use'
import { t, Trans } from '@lingui/macro'
import { stringify } from 'qs'

import { AMP_HINT } from 'constants/index'
import FairLaunchPools from 'components/YieldPools/FairLaunchPools'
import InfoHelper from 'components/InfoHelper'
import { useFarmsData } from 'state/farms/hooks'
import { formattedNum } from 'utils'
import { useFarmRewards, useFarmRewardsUSD } from 'utils/dmm'
import {
  TotalRewardsContainer,
  TableHeader,
  ClickableText,
  StakedOnlyToggleWrapper,
  StakedOnlyToggle,
  StakedOnlyToggleText,
  HeadingContainer,
  HeadingRight,
  MenuFlyout,
  SearchContainer,
  SearchInput,
} from './styleds'
import ConfirmHarvestingModal from './ConfirmHarvestingModal'
import { Flex, Text } from 'rebass'
import LocalLoader from 'components/LocalLoader'
import useTheme from 'hooks/useTheme'
import { useBlockNumber } from 'state/application/hooks'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { ChevronUp, ChevronDown } from 'react-feather'
import { TYPE } from 'theme'
import { fixedFormatting } from 'utils/formatBalance'
import Search from 'components/Icons/Search'
import useDebounce from 'hooks/useDebounce'
import { Farm } from 'state/farms/types'
import { BigNumber } from 'ethers'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { ChainId } from '@dynamic-amm/sdk'
import { useActiveWeb3React } from 'hooks'
import { useHistory, useLocation } from 'react-router-dom'

const YieldPools = ({ loading, active }: { loading: boolean; active?: boolean }) => {
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()
  const above1000 = useMedia('(min-width: 1000px)')
  const { data: farmsByFairLaunch } = useFarmsData()
  const totalRewards = useFarmRewards(Object.values(farmsByFairLaunch).flat())
  const totalRewardsUSD = useFarmRewardsUSD(totalRewards)
  const [stakedOnly, setStakedOnly] = useState({
    active: false,
    ended: false,
  })

  const activeTab = active ? 'active' : 'ended'

  const blockNumber = useBlockNumber()
  const currentTimestamp = Math.floor(Date.now() / 1000)

  const ref = useRef<HTMLDivElement>()
  const [open, setOpen] = useState(false)
  useOnClickOutside(ref, open ? () => setOpen(prev => !prev) : undefined)
  const qs = useParsedQueryString()
  const search = (qs.search as string) || ''
  const history = useHistory()
  const location = useLocation()
  const debouncedSearchText = useDebounce(search.trim().toLowerCase(), 200)
  const [isCheckUserStaked, setIsCheckUserStaked] = useState(false)

  const doSearch = useCallback(
    (search: string) => {
      const target = {
        ...location,
        search: stringify({ ...qs, search }),
      }

      history.replace(target)
    },
    [history, location, qs],
  )

  const filterFarm = useCallback(
    (farm: Farm) => {
      // TODO: hard code for SIPHER. Need to be remove later
      const isSipherFarm =
        farm.fairLaunchAddress.toLowerCase() === '0xc0601973451d9369252Aee01397c0270CD2Ecd60'.toLowerCase() &&
        chainId === ChainId.MAINNET

      if (farm.rewardPerSeconds) {
        // for active/ended farms
        return (
          currentTimestamp &&
          (active ? farm.endTime >= currentTimestamp : farm.endTime < currentTimestamp) &&
          // search farms
          (debouncedSearchText
            ? farm.token0?.symbol.toLowerCase().includes(debouncedSearchText) ||
              farm.token1?.symbol.toLowerCase().includes(debouncedSearchText) ||
              farm.id === debouncedSearchText
            : true) &&
          // stakedOnly
          (stakedOnly[activeTab]
            ? farm.userData?.stakedBalance && BigNumber.from(farm.userData.stakedBalance).gt(0)
            : true)
        )
      } else {
        // for active/ended farms
        return (
          blockNumber &&
          (isSipherFarm ? active : active ? farm.endBlock >= blockNumber : farm.endBlock < blockNumber) &&
          // search farms
          (debouncedSearchText
            ? farm.token0?.symbol.toLowerCase().includes(debouncedSearchText) ||
              farm.token1?.symbol.toLowerCase().includes(debouncedSearchText) ||
              farm.id === debouncedSearchText
            : true) &&
          // stakedOnly
          (stakedOnly[activeTab]
            ? farm.userData?.stakedBalance && BigNumber.from(farm.userData.stakedBalance).gt(0)
            : true)
        )
      }
    },
    [active, activeTab, blockNumber, debouncedSearchText, stakedOnly, currentTimestamp],
  )

  const farms = useMemo(
    () =>
      Object.keys(farmsByFairLaunch).reduce((acc: { [key: string]: Farm[] }, address) => {
        const currentFarms = farmsByFairLaunch[address].filter(farm => filterFarm(farm))
        if (currentFarms.length) acc[address] = currentFarms
        return acc
      }, {}),
    [farmsByFairLaunch, filterFarm],
  )

  const noFarms = !Object.keys(farms).length

  useEffect(() => {
    // auto enable stakedOnly if user have rewards on ended farms
    if (!active && !stakedOnly['ended'] && !isCheckUserStaked) {
      const staked = Object.keys(farmsByFairLaunch).filter(address => {
        return !!farmsByFairLaunch[address].filter(farm => {
          if (farm.rewardPerSeconds) {
            return (
              currentTimestamp &&
              farm.endTime < currentTimestamp &&
              farm.userData?.stakedBalance &&
              BigNumber.from(farm.userData.stakedBalance).gt(0)
            )
          } else {
            return (
              blockNumber &&
              farm.endBlock < blockNumber &&
              farm.userData?.stakedBalance &&
              BigNumber.from(farm.userData.stakedBalance).gt(0)
            )
          }
        }).length
      })

      if (staked.length) {
        setIsCheckUserStaked(true)
        setStakedOnly(prev => ({ ...prev, ended: true }))
      }
    }
  }, [active, stakedOnly, farmsByFairLaunch, blockNumber, isCheckUserStaked, currentTimestamp])

  return (
    <>
      <ConfirmHarvestingModal />
      <HeadingContainer>
        <StakedOnlyToggleWrapper>
          <StakedOnlyToggle
            className="staked-only-switch"
            checked={stakedOnly[active ? 'active' : 'ended']}
            onClick={() => setStakedOnly(prev => ({ ...prev, [activeTab]: !prev[activeTab] }))}
          />
          <StakedOnlyToggleText>
            <Trans>Staked Only</Trans>
          </StakedOnlyToggleText>
        </StakedOnlyToggleWrapper>
        <HeadingRight>
          <SearchContainer>
            <SearchInput
              placeholder={t`Search by token name or pool address`}
              maxLength={255}
              value={search}
              onChange={e => doSearch(e.target.value)}
            />
            <Search color={theme.subText} />
          </SearchContainer>
          <TotalRewardsContainer
            ref={ref as any}
            onClick={() => setOpen(prev => !prev)}
            disabled={totalRewardsUSD <= 0}
          >
            <Flex width="max-content">
              <Trans>My Total Rewards</Trans>:
              <Text marginLeft="4px">{totalRewardsUSD ? formattedNum(totalRewardsUSD.toString(), true) : '$0'}</Text>
            </Flex>

            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {totalRewardsUSD > 0 && totalRewards.length > 0 && open && (
              <MenuFlyout>
                {totalRewards.map(reward => {
                  if (!reward || !reward.amount || reward.amount.lte(0)) {
                    return null
                  }

                  return (
                    <TYPE.body key={reward.token.address} color={theme.text11} fontWeight={'normal'} fontSize={16}>
                      {fixedFormatting(reward.amount, reward.token.decimals)} {reward.token.symbol}
                    </TYPE.body>
                  )
                })}
              </MenuFlyout>
            )}
          </TotalRewardsContainer>
        </HeadingRight>
      </HeadingContainer>

      {above1000 && (
        <TableHeader>
          <Flex grid-area="pools" alignItems="center" justifyContent="flex-start">
            <ClickableText>
              <Trans>Pools | AMP</Trans>
            </ClickableText>
            <InfoHelper text={AMP_HINT} />
          </Flex>

          <Flex grid-area="liq" alignItems="center" justifyContent="flex-center">
            <ClickableText>
              <Trans>Staked TVL</Trans>
            </ClickableText>
          </Flex>

          <Flex grid-area="end" alignItems="center" justifyContent="flex-start">
            <ClickableText>
              <Trans>Ending In</Trans>
            </ClickableText>
            <InfoHelper text={t`Once a farm has ended, you will continue to receive returns through LP Fees`} />
          </Flex>

          <Flex grid-area="apy" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>APR</Trans>
            </ClickableText>
            <InfoHelper
              text={
                active
                  ? t`Total estimated return based on yearly fees and bonus rewards of the pool`
                  : t`Estimated return based on yearly fees of the pool`
              }
            />
          </Flex>

          <Flex grid-area="vesting_duration" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>Vesting</Trans>
            </ClickableText>
            <InfoHelper text={t`After harvesting, your rewards will unlock linearly over the indicated time period`} />
          </Flex>

          <Flex grid-area="reward" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>My Rewards</Trans>
            </ClickableText>
          </Flex>

          <Flex grid-area="staked_balance" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>My Deposit</Trans>
            </ClickableText>
          </Flex>
        </TableHeader>
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
          style={{ borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}
        >
          <Text color={theme.subText}>
            {stakedOnly[activeTab] || debouncedSearchText ? (
              <Trans>No Farms found</Trans>
            ) : (
              <Trans>Currently there are no Farms.</Trans>
            )}
          </Text>
        </Flex>
      ) : (
        Object.keys(farms).map(fairLaunchAddress => {
          return (
            <FairLaunchPools
              key={fairLaunchAddress}
              fairLaunchAddress={fairLaunchAddress}
              farms={farms[fairLaunchAddress]}
            />
          )
        })
      )}
    </>
  )
}

export default YieldPools
