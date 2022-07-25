import React from 'react'
import { usePrommSchedules } from 'state/vesting/hooks'
import { Text } from 'rebass'
import { Trans } from '@lingui/macro'
import useTheme from 'hooks/useTheme'
import ScheduleCard from './ScheduleCard'
import LocalLoader from 'components/LocalLoader'
import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { BigNumber } from 'ethers'
import VestingSummary from './VestingSummary'
import { ScheduleGrid } from './styleds'

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
      <VestingSummary
        loading={loading}
        totalHarvested={totalHarvested}
        locked={locked}
        unlocked={unlocked}
        claimed={claimed}
      />

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
