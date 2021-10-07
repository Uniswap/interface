import React, { useState } from 'react'
import { Flex, Text } from 'rebass'
import { useMedia } from 'react-use'
import { ChevronDown, ChevronUp } from 'react-feather'
import { BigNumber } from '@ethersproject/bignumber'
import { t, Trans } from '@lingui/macro'

import { Token } from 'libs/sdk/src'
import { AutoRow, RowBetween } from 'components/Row'
import InfoHelper from 'components/InfoHelper'
import { VestingHeader, VestPeriods, MenuFlyout, Seperator, Tag, NoVestingSchedule } from 'components/Vesting/styleds'
import RewardLockerSchedules from 'components/Vesting/RewardLockerSchedules'
import useTheme from 'hooks/useTheme'
import { useBlockNumber } from 'state/application/hooks'
import { Reward } from 'state/farms/types'
import { useRewardLockerAddresses, useSchedules } from 'state/vesting/hooks'
import { ExternalLink, TYPE } from 'theme'
import { formattedNum } from 'utils'
import { useFarmRewardsUSD } from 'utils/dmm'
import { fixedFormatting } from 'utils/formatBalance'
import ConfirmVestingModal from './ConfirmVestingModal'
import LocalLoader from 'components/LocalLoader'

const Vesting = ({ loading }: { loading: boolean }) => {
  const { schedulesByRewardLocker } = useSchedules()
  const rewardLockerAddresses = useRewardLockerAddresses()
  const above768 = useMedia('(min-width: 768px)')
  const above1000 = useMedia('(min-width: 1000px)') // Extra large screen
  const above1400 = useMedia('(min-width: 1400px)') // Extra large screen
  const theme = useTheme()
  const currentBlockNumber = useBlockNumber()
  const [open, setOpen] = useState<number>(-1)

  const schedules = Object.values(schedulesByRewardLocker).flat()

  const info = schedules.reduce<{
    [key: string]: {
      vestableIndexes: number[]
      vestableAmount: BigNumber
      fullyIndexes: number[]
      fullyAmount: BigNumber
      totalAmount: BigNumber
      unlockedAmount: BigNumber
      token: Token
    }
  }>((result, schedule) => {
    if (!currentBlockNumber) return result
    const address = (schedule[4] as Token).symbol as string
    if (!result[address]) {
      result[address] = {
        vestableIndexes: [],
        vestableAmount: BigNumber.from(0),
        fullyIndexes: [],
        fullyAmount: BigNumber.from(0),
        totalAmount: BigNumber.from(0),
        unlockedAmount: BigNumber.from(0),
        token: schedule[4] as Token
      }
    }

    result[address].totalAmount = result[address].totalAmount.add(BigNumber.from(schedule[2]))
    /**
     * fullyVestedAlready = schedule.quantity - schedule.vestedQuantity
     */
    const fullyVestedAlready = BigNumber.from(schedule[2])
      .sub(BigNumber.from(schedule[3]))
      .isZero()

    /**
     * isEnd = schedule.endBlock - currentBlock >= 0
     */
    const isEnd = !BigNumber.from(currentBlockNumber)
      .sub(BigNumber.from(schedule[1]))
      .isNegative()
    // const vestedAndVestablePercent = BigNumber.from(currentBlockNumber)
    //   .sub(BigNumber.from(s[1]))
    //   .isNegative()
    //   ? BigNumber.from(currentBlockNumber)
    //       .sub(BigNumber.from(s[0]))
    //       .mul(100)
    //       .div(BigNumber.from(s[1]).sub(BigNumber.from(s[0])))
    //   : 100
    // const unlockedAmount = BigNumber.from(s[2])
    //   .mul(vestedAndVestablePercent)
    //   .div(100)
    const unlockedAmount = isEnd
      ? BigNumber.from(schedule[2])
      : BigNumber.from(schedule[2])
          .mul(BigNumber.from(currentBlockNumber).sub(BigNumber.from(schedule[0])))
          .div(BigNumber.from(schedule[1]).sub(BigNumber.from(schedule[0])))
    const vestableAmount = unlockedAmount.sub(BigNumber.from(schedule[3])) // vestableAmount = unlock - vestedQuanitty
    if (!fullyVestedAlready) {
      result[address].vestableIndexes.push(schedule[5])
    }
    result[address].vestableAmount = result[address].vestableAmount.add(
      vestableAmount.isNegative() ? BigNumber.from(0) : vestableAmount
    )

    if (!fullyVestedAlready && !!currentBlockNumber && BigNumber.from(currentBlockNumber).gt(schedule[1])) {
      result[address].fullyIndexes.push(schedule[5])
      result[address].fullyAmount = result[address].fullyAmount.add(BigNumber.from(schedule[2]))
    }

    result[address].unlockedAmount = result[address].unlockedAmount.add(unlockedAmount)
    return result
  }, {})

  const totalUSD = useFarmRewardsUSD(
    Object.keys(info).map(k => {
      return { token: info[k].token, amount: info[k].totalAmount } as Reward
    })
  )
  const lockedUSD = useFarmRewardsUSD(
    Object.keys(info).map(k => {
      return { token: info[k].token, amount: info[k].totalAmount.sub(info[k].unlockedAmount) } as Reward
    })
  )
  const claimedUSD = useFarmRewardsUSD(
    Object.keys(info).map(k => {
      return { token: info[k].token, amount: info[k].unlockedAmount.sub(info[k].vestableAmount) } as Reward
    })
  )
  const unlockedUSD = useFarmRewardsUSD(
    Object.keys(info).map(k => {
      return { token: info[k].token, amount: info[k].vestableAmount } as Reward
    })
  )

  const totalBlock = (
    <div style={{ position: 'relative' }}>
      <Flex alignItems="center">
        <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={28}>
          {formattedNum(totalUSD.toString(), true)}
        </TYPE.body>
        {totalUSD > 0 && (
          <>
            <TYPE.body
              color={'#08a1e7'}
              fontWeight={'normal'}
              fontSize={14}
              style={{ margin: '0.25rem 0.25rem 0.25rem 1rem', cursor: 'pointer' }}
              onClick={() => setOpen(open !== 0 ? 0 : -1)}
            >
              Details
            </TYPE.body>

            <span onClick={() => setOpen(open !== 0 ? 0 : -1)}>
              {open === 0 ? (
                <ChevronUp size="16" color="#08a1e7" style={{ marginTop: '0.25rem' }} />
              ) : (
                <ChevronDown size="16" color="#08a1e7" style={{ marginTop: '0.25rem' }} />
              )}
            </span>
          </>
        )}
      </Flex>

      {open === 0 && (
        <MenuFlyout>
          {Object.keys(info).map(k => (
            <div key={k}>
              <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={16}>
                {fixedFormatting(info[k].totalAmount, 18)} {k}
              </TYPE.body>
            </div>
          ))}
        </MenuFlyout>
      )}
    </div>
  )

  const lockedBlock = (
    <div style={{ position: 'relative' }}>
      <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={14}>
        <Trans>Locked Rewards</Trans>
      </TYPE.body>

      <Flex marginTop="0.375rem" alignItems="center" onClick={() => lockedUSD > 0 && setOpen(open !== 1 ? 1 : -1)}>
        <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={20}>
          {formattedNum(lockedUSD.toString(), true)}
        </TYPE.body>
        {lockedUSD > 0 && (
          <>
            {open === 1 ? (
              <ChevronUp size="14" color="#08a1e7" style={{ margin: '0.15rem 0 0 0.25rem' }} />
            ) : (
              <ChevronDown size="14" color="#08a1e7" style={{ margin: '0.15rem 0 0 0.25rem' }} />
            )}
          </>
        )}
      </Flex>
      {open === 1 && (
        <MenuFlyout>
          {Object.keys(info).map(k => (
            <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={18} key={k}>
              {fixedFormatting(info[k].totalAmount.sub(info[k].unlockedAmount), 18)} {k}
            </TYPE.body>
          ))}
        </MenuFlyout>
      )}
    </div>
  )

  const claimedBlock = (
    <div style={{ position: 'relative' }}>
      <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={14}>
        <Trans>Claimed Rewards</Trans>
      </TYPE.body>

      <Flex onClick={() => claimedUSD > 0 && setOpen(open !== 2 ? 2 : -1)} alignItems="center" marginTop="6px">
        <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={20}>
          {formattedNum(claimedUSD.toString(), true)}
        </TYPE.body>
        {claimedUSD > 0 && (
          <>
            {open === 2 ? (
              <ChevronUp size="14" color="#08a1e7" style={{ margin: '0.15rem 0 0 0.25rem' }} />
            ) : (
              <ChevronDown size="14" color="#08a1e7" style={{ margin: '0.15rem 0 0 0.25rem' }} />
            )}
          </>
        )}
      </Flex>

      {open === 2 && (
        <MenuFlyout>
          {Object.keys(info).map(k => (
            <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={18} key={k}>
              {fixedFormatting(info[k].unlockedAmount.sub(info[k].vestableAmount), 18)} {k}
            </TYPE.body>
          ))}
        </MenuFlyout>
      )}
    </div>
  )

  const unLockedBlock = (
    <div>
      <Tag style={{ width: `${above1400 ? '210px' : '100%'}`, padding: '20px' }}>
        <div style={{ position: 'relative' }}>
          <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={14}>
            <Trans>Unlocked Rewards</Trans>
          </TYPE.body>

          <Flex onClick={() => setOpen(open !== 3 ? 3 : -1)} alignItems="center" marginTop="6px">
            <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={20}>
              {formattedNum(unlockedUSD.toString(), true)}
            </TYPE.body>
            {unlockedUSD > 0 && (
              <>
                {open === 3 ? (
                  <ChevronUp size="14" color="#08a1e7" style={{ margin: '0.15rem 0 0 0.25rem' }} />
                ) : (
                  <ChevronDown size="14" color="#08a1e7" style={{ margin: '0.15rem 0 0 0.25rem' }} />
                )}
              </>
            )}
          </Flex>

          {open === 3 && (
            <MenuFlyout>
              {Object.keys(info).map(k => (
                <TYPE.body color={theme.text11} fontWeight={'normal'} fontSize={18} key={k}>
                  {fixedFormatting(info[k].vestableAmount, 18)} {k}
                </TYPE.body>
              ))}
            </MenuFlyout>
          )}
        </div>
      </Tag>
    </div>
  )

  const noVesting = rewardLockerAddresses.every(
    rewardLockerAddress => !schedulesByRewardLocker[rewardLockerAddress]?.length
  )

  return (
    <>
      <ConfirmVestingModal />
      <VestingHeader>
        <RowBetween marginBottom="20px" align="center">
          <Flex color={theme.text11} fontSize={16}>
            <Text fontWeight={600}>
              <Trans>TOTAL HARVESTED REWARDS</Trans>
            </Text>
            <InfoHelper
              text={t`Your total harvested rewards. Each time you harvest new rewards, they are locked and vested linearly over a short period (duration depends on the pool). Unlocked rewards can be claimed at any time with no deadline.`}
            />
          </Flex>

          {above768 && (
            <ExternalLink href="https://kyber.network/about/knc" style={{ textDecoration: 'none' }}>
              <Flex justifyContent="flex-end">
                <Trans>What can KNC be used for? </Trans> →
              </Flex>
            </ExternalLink>
          )}
        </RowBetween>

        {above1000 ? (
          <AutoRow justify="space-between" marginTop="1.5rem">
            {totalBlock}
            <Seperator />
            {lockedBlock}
            <Seperator />
            {claimedBlock}
            {unLockedBlock}
          </AutoRow>
        ) : (
          <>
            <div style={{ paddingBottom: '1rem', borderBottom: '1px solid #404b51' }}>{totalBlock}</div>
            <AutoRow justify="space-between" marginY="1.5rem">
              {lockedBlock}
              <Seperator />
              {claimedBlock}
            </AutoRow>
            {unLockedBlock}
          </>
        )}

        {!above768 && (
          <ExternalLink href="https://kyber.network/about/knc" style={{ textDecoration: 'none' }}>
            <Flex justifyContent="flex-end" style={{ marginTop: '20px' }}>
              <Trans>What can KNC be used for? </Trans> →
            </Flex>
          </ExternalLink>
        )}
      </VestingHeader>

      <VestPeriods>
        <AutoRow>
          <TYPE.body color={theme.text11} fontWeight={600} fontSize={16} marginRight="6px">
            <Trans>VESTING PERIODS</Trans>
          </TYPE.body>
          <InfoHelper
            text={t`Each time you harvest new rewards, a new vesting schedule (duration depends on the pool) is created. Multiple vesting schedules can run concurrently. Unlocked rewards can be claimed at any time with no deadline.`}
          />
        </AutoRow>
      </VestPeriods>

      {noVesting ? (
        loading ? (
          <Flex backgroundColor={theme.background}>
            <LocalLoader />
          </Flex>
        ) : (
          <NoVestingSchedule>
            <Trans>No vesting schedule!</Trans>
          </NoVestingSchedule>
        )
      ) : (
        <div style={{ backgroundColor: theme.background, borderRadius: '8px' }}>
          {rewardLockerAddresses
            .filter(rewardLockerAddress => !!schedulesByRewardLocker[rewardLockerAddress]?.length)
            .map((rewardLockerAddress, index) => (
              <RewardLockerSchedules
                idx={index + 1}
                key={rewardLockerAddress}
                rewardLockerAddress={rewardLockerAddress}
                schedules={schedulesByRewardLocker[rewardLockerAddress]}
              />
            ))}
        </div>
      )}
    </>
  )
}

export default Vesting
