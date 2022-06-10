import React from 'react'
import { usePrommSchedules } from 'state/vesting/hooks'
import { Text, Flex } from 'rebass'
import { Trans, t } from '@lingui/macro'
import styled from 'styled-components'
import useTheme from 'hooks/useTheme'
import AgriCulture from 'components/Icons/AgriCulture'
import { MouseoverTooltip } from 'components/Tooltip'
import ScheduleCard from './ScheduleCard'
import Loader from 'components/Loader'
import LocalLoader from 'components/LocalLoader'
import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { BigNumber } from 'ethers'
import { formatDollarAmount } from 'utils/numbers'
import HoverDropdown from 'components/HoverDropdown'
import { ChevronDown, Lock, DollarSign, Unlock } from 'react-feather'
import CurrencyLogo from 'components/CurrencyLogo'

const SummaryWrapper = styled.div`
  display: grid;
  gap: 24px;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  margin-top: 32px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr 1fr;
  `}

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    grid-template-columns: 1fr;
  `}
`

const SummaryItem = styled.div`
  border-radius: 8px;
  background: ${({ theme }) => theme.background};
  padding: 20px 20px 24px;
`
const SummaryItemTitle = styled.div`
  border-bottom: 1px dashed ${({ theme }) => theme.border};
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
`
const ScheduleGrid = styled.div`
  display: grid;
  gap: 24px;
  grid-template-columns: 1fr 1fr 1fr;
  margin-top: 16px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr 1fr;
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr;
  `}
`

const ProMMVesting = () => {
  const theme = useTheme()
  const { loading, schedulesByRewardLocker } = usePrommSchedules()

  const totalHarvested: { value: number; amountByAddress: { [tokenAddress: string]: CurrencyAmount<Token> } } = {
    value: 0,
    amountByAddress: {},
  }
  const locked: { value: number; amountByAddress: { [tokenAddress: string]: CurrencyAmount<Token> } } = {
    value: 0,
    amountByAddress: {},
  }
  const unlocked: { value: number; amountByAddress: { [tokenAddress: string]: CurrencyAmount<Token> } } = {
    value: 0,
    amountByAddress: {},
  }
  const claimed: { value: number; amountByAddress: { [tokenAddress: string]: CurrencyAmount<Token> } } = {
    value: 0,
    amountByAddress: {},
  }

  const currentTimestamp = Math.floor(+new Date() / 1000)
  Object.values(schedulesByRewardLocker).forEach(schedule => {
    schedule.forEach(item => {
      const address = (item.token.isNative ? item.token.symbol : item.token.address) as string
      // total
      const harvested = CurrencyAmount.fromRawAmount(item.token, item.quantity.toString())
      const harvestedUsd = item.tokenPrice * parseFloat(harvested.toExact())
      totalHarvested.value += harvestedUsd
      if (!totalHarvested.amountByAddress[address]) totalHarvested.amountByAddress[address] = harvested
      else totalHarvested.amountByAddress[address] = totalHarvested.amountByAddress[address].add(harvested)

      // claimed
      const vested = CurrencyAmount.fromRawAmount(item.token, item.vestedQuantity.toString())
      const vestedUsd = item.tokenPrice * parseFloat(vested.toExact())
      claimed.value += vestedUsd
      if (!claimed.amountByAddress[address]) claimed.amountByAddress[address] = vested
      else claimed.amountByAddress[address] = claimed.amountByAddress[address].add(vested)

      const isEnd = currentTimestamp > item.endTime
      const timePeriod = BigNumber.from(item.endTime - item.startTime)
      const unlockedBigint = isEnd
        ? item.quantity
        : item.quantity.mul(
            BigNumber.from(currentTimestamp)
              .sub(BigNumber.from(item.startTime))
              .div(timePeriod),
          )
      // unlocked
      const vestableAmount = CurrencyAmount.fromRawAmount(
        item.token,
        unlockedBigint.sub(BigNumber.from(item.vestedQuantity)).toString(),
      ) // vestableAmount = unlock - vestedQuanitty
      const unlockedUsd = item.tokenPrice * parseFloat(vestableAmount.toExact())
      unlocked.value += unlockedUsd
      if (!unlocked.amountByAddress[address]) unlocked.amountByAddress[address] = vestableAmount
      else unlocked.amountByAddress[address] = unlocked.amountByAddress[address].add(vestableAmount)

      // locked = total - unlocked
      const lockedAmount = CurrencyAmount.fromRawAmount(item.token, item.quantity.sub(unlockedBigint).toString())
      locked.value += item.tokenPrice * parseFloat(lockedAmount.toExact())
      if (!locked.amountByAddress[address]) locked.amountByAddress[address] = lockedAmount
      else locked.amountByAddress[address] = locked.amountByAddress[address].add(lockedAmount)
    })
  })

  const noVesting = Object.keys(schedulesByRewardLocker).every(
    rewardLockerAddress => !schedulesByRewardLocker[rewardLockerAddress]?.length,
  )

  return (
    <>
      <Text fontWeight={500} fontSize="1rem">
        <Trans>Summary</Trans>
      </Text>

      <SummaryWrapper>
        <SummaryItem>
          <Flex justifyContent="space-between" alignItems="center">
            <MouseoverTooltip
              text={t`The total amount of rewards you have harvested from the farms. Harvested rewards are locked initially and vested linearly over a short period.`}
            >
              <SummaryItemTitle>
                <Trans>Total Harvested Rewards</Trans>
              </SummaryItemTitle>
            </MouseoverTooltip>
            <AgriCulture color={theme.subText} />
          </Flex>

          <Flex marginTop="24px" alignItems="center" justifyContent="space-between">
            <Text fontWeight={500} fontSize={24}>
              {loading ? <Loader /> : formatDollarAmount(totalHarvested.value)}
            </Text>

            <HoverDropdown
              placement="right"
              hideIcon
              content={
                <Flex alignItems="center" color={theme.subText} fontSize="14px">
                  <Text>
                    <Trans>Details</Trans>
                  </Text>
                  <ChevronDown size={16} />
                </Flex>
              }
              dropdownContent={
                Object.values(totalHarvested.amountByAddress).length
                  ? Object.values(totalHarvested.amountByAddress).map(amount => (
                      <Flex alignItems="center" key={amount.currency.address} paddingY="4px">
                        <CurrencyLogo size="16px" currency={amount.currency} />
                        <Text fontSize="12px" marginLeft="4px">
                          {amount.toSignificant(8)} {amount.currency.symbol}
                        </Text>
                      </Flex>
                    ))
                  : ''
              }
            />
          </Flex>
        </SummaryItem>

        <SummaryItem>
          <Flex justifyContent="space-between" alignItems="center">
            <MouseoverTooltip text={t`The amount of rewards that are locked as they are currently vesting`}>
              <SummaryItemTitle>
                <Trans>Locked Rewards</Trans>
              </SummaryItemTitle>
            </MouseoverTooltip>
            <Lock size={20} color={theme.subText} />
          </Flex>

          <Flex marginTop="24px" alignItems="center" justifyContent="space-between">
            <Text fontWeight={500} fontSize={24}>
              {loading ? <Loader /> : formatDollarAmount(locked.value)}
            </Text>

            <HoverDropdown
              hideIcon
              placement="right"
              content={
                <Flex alignItems="center" color={theme.subText} fontSize="14px">
                  <Text>
                    <Trans>Details</Trans>
                  </Text>
                  <ChevronDown size={16} />
                </Flex>
              }
              dropdownContent={
                Object.values(locked.amountByAddress).length
                  ? Object.values(locked.amountByAddress).map(amount => (
                      <Flex alignItems="center" key={amount.currency.address} paddingY="4px">
                        <CurrencyLogo size="16px" currency={amount.currency} />
                        <Text fontSize="12px" marginLeft="4px">
                          {amount.toSignificant(8)} {amount.currency.symbol}
                        </Text>
                      </Flex>
                    ))
                  : ''
              }
            />
          </Flex>
        </SummaryItem>

        <SummaryItem>
          <Flex justifyContent="space-between" alignItems="center">
            <MouseoverTooltip
              text={t`The amount of rewards that are unlocked and can be claimed instantly as their vesting is over`}
            >
              <SummaryItemTitle>
                <Trans>Unlocked Rewards</Trans>
              </SummaryItemTitle>
            </MouseoverTooltip>
            <Unlock size={20} color={theme.subText} />
          </Flex>

          <Flex marginTop="24px" alignItems="center" justifyContent="space-between">
            <Text fontWeight={500} fontSize={24}>
              {loading ? <Loader /> : formatDollarAmount(unlocked.value)}
            </Text>

            <HoverDropdown
              hideIcon
              placement="right"
              content={
                <Flex alignItems="center" color={theme.subText} fontSize="14px">
                  <Text>
                    <Trans>Details</Trans>
                  </Text>
                  <ChevronDown size={16} />
                </Flex>
              }
              dropdownContent={
                Object.values(unlocked.amountByAddress).length
                  ? Object.values(unlocked.amountByAddress).map(amount => (
                      <Flex alignItems="center" key={amount.currency.address} paddingY="4px">
                        <CurrencyLogo size="16px" currency={amount.currency} />
                        <Text fontSize="12px" marginLeft="4px">
                          {amount.toSignificant(8)} {amount.currency.symbol}
                        </Text>
                      </Flex>
                    ))
                  : ''
              }
            />
          </Flex>
        </SummaryItem>

        <SummaryItem>
          <Flex justifyContent="space-between" alignItems="center">
            <MouseoverTooltip text={t`The amount of rewards you have already claimed`}>
              <SummaryItemTitle>
                <Trans>Claimed Rewards</Trans>
              </SummaryItemTitle>
            </MouseoverTooltip>
            <DollarSign size={20} color={theme.subText} />
          </Flex>

          <Flex marginTop="24px" alignItems="center" justifyContent="space-between">
            <Text fontWeight={500} fontSize={24}>
              {loading ? <Loader /> : formatDollarAmount(claimed.value)}
            </Text>

            <HoverDropdown
              hideIcon
              placement="right"
              content={
                <Flex alignItems="center" color={theme.subText} fontSize="14px">
                  <Text>
                    <Trans>Details</Trans>
                  </Text>
                  <ChevronDown size={16} />
                </Flex>
              }
              dropdownContent={
                Object.values(claimed.amountByAddress).length
                  ? Object.values(claimed.amountByAddress).map(amount => (
                      <Flex alignItems="center" key={amount.currency.address} paddingY="4px">
                        <CurrencyLogo size="16px" currency={amount.currency} />
                        <Text fontSize="12px" marginLeft="4px">
                          {amount.toSignificant(8)} {amount.currency.symbol}
                        </Text>
                      </Flex>
                    ))
                  : ''
              }
            />
          </Flex>
        </SummaryItem>
      </SummaryWrapper>

      <Text fontSize={16} fontWeight="500" marginTop="24px">
        <Trans>Vesting Schedules</Trans>
      </Text>

      {noVesting ? (
        loading ? (
          <LocalLoader />
        ) : (
          <Text textAlign="center" color={theme.subText} marginTop="24px">
            <Trans>No vesting schedule!</Trans>
          </Text>
        )
      ) : (
        <ScheduleGrid>
          {Object.keys(schedulesByRewardLocker).map(rewardLocker => {
            if (schedulesByRewardLocker[rewardLocker].length)
              return <ScheduleCard key={rewardLocker} schedules={schedulesByRewardLocker[rewardLocker]} />
            return null
          })}
        </ScheduleGrid>
      )}
    </>
  )
}

export default ProMMVesting
