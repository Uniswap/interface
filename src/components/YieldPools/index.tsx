import React, { useState, useRef, useMemo, useEffect } from 'react'
import { useMedia } from 'react-use'
import { t, Trans } from '@lingui/macro'

import RainMakerBannel from 'assets/images/rain-maker.png'
import RainMakerMobileBanner from 'assets/images/rain-maker-mobile.png'
import { AMP_HINT } from 'constants/index'
import FairLaunchPools from 'components/YieldPools/FairLaunchPools'
import InfoHelper from 'components/InfoHelper'
import { useFarmsData } from 'state/farms/hooks'
import { formattedNum } from 'utils'
import { useFarmRewards, useFarmRewardsUSD } from 'utils/dmm'
import {
  AdContainer,
  TotalRewardsContainer,
  TableHeader,
  ClickableText,
  StakedOnlyToggleWrapper,
  StakedOnlyToggle,
  StakedOnlyToggleText,
  HeadingContainer,
  HeadingRight,
  LearnMoreBtn,
  MenuFlyout,
  SearchContainer,
  SearchInput
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

const YieldPools = ({ loading, active }: { loading: boolean; active?: boolean }) => {
  const theme = useTheme()
  const mdBreakpoint = useMedia('(min-width: 768px)')
  const above1000 = useMedia('(min-width: 1000px)')
  const { data: farmsByFairLaunch } = useFarmsData()
  const totalRewards = useFarmRewards(Object.values(farmsByFairLaunch).flat())
  const totalRewardsUSD = useFarmRewardsUSD(totalRewards)
  const [stakedOnly, setStakedOnly] = useState({
    active: false,
    ended: false
  })

  const activeTab = active ? 'active' : 'ended'

  const blockNumber = useBlockNumber()

  const ref = useRef<HTMLDivElement>()
  const [open, setOpen] = useState(false)
  useOnClickOutside(ref, open ? () => setOpen(prev => !prev) : undefined)

  const [searchText, setSearchText] = useState('')
  const debouncedSearchText = useDebounce(searchText.trim().toLowerCase(), 200)
  const [isCheckUserStaked, setIsCheckUserStaked] = useState(false)

  const farms = useMemo(
    () =>
      Object.keys(farmsByFairLaunch).reduce((acc: { [key: string]: Farm[] }, address) => {
        const currentFarms = farmsByFairLaunch[address].filter(
          farm =>
            // for active/ended farms
            blockNumber &&
            (active ? farm.endBlock >= blockNumber : farm.endBlock < blockNumber) &&
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
        if (currentFarms.length) acc[address] = currentFarms
        return acc
      }, {}),
    [farmsByFairLaunch, debouncedSearchText, active, blockNumber, activeTab, stakedOnly]
  )

  const noFarms = !Object.keys(farms).length

  useEffect(() => {
    setSearchText('')
  }, [active])

  useEffect(() => {
    // auto enable stakedOnly if user have rewards on ended farms
    if (!active && !stakedOnly['ended'] && !isCheckUserStaked) {
      const staked = Object.keys(farmsByFairLaunch).filter(address => {
        return !!farmsByFairLaunch[address].filter(farm => {
          return (
            blockNumber &&
            farm.endBlock < blockNumber &&
            farm.userData?.stakedBalance &&
            BigNumber.from(farm.userData.stakedBalance).gt(0)
          )
        }).length
      })

      if (staked.length) {
        setIsCheckUserStaked(true)
        setStakedOnly(prev => ({ ...prev, ended: true }))
      }
    }
  }, [active, stakedOnly, farmsByFairLaunch, blockNumber, isCheckUserStaked])

  return (
    <>
      <ConfirmHarvestingModal />
      <AdContainer>
        <LearnMoreBtn href="https://docs.kyberswap.com/guides/yield-farming" target="_blank" rel="noopener noreferrer">
          <Trans>Learn more</Trans> -&gt;
        </LearnMoreBtn>
        <img src={mdBreakpoint ? RainMakerBannel : RainMakerMobileBanner} alt="RainMaker" width="100%" />
      </AdContainer>
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
              placeholder={t`Search by tokens or pool address`}
              maxLength={255}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
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
                      {fixedFormatting(reward.amount, 18)} {reward.token.symbol}
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

          <Flex grid-area="end" alignItems="right" justifyContent="flex-end">
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
