import React, { useState } from 'react'
import { BigNumber } from '@ethersproject/bignumber'

import { Token } from '@kyberswap/ks-sdk-core'
import { ButtonDropdown } from 'components/Button'
import { useActiveWeb3React } from 'hooks'
import useVesting from 'hooks/useVesting'
import { useAppDispatch } from 'state/hooks'
import { useBlockNumber } from 'state/application/hooks'
import Schedule from './Schedule'
import UnlockedBlock from './UnlockedBlock'
import { ClaimAllSection, RewardLockerSchedulesTitle, RewardLockerSchedulesWrapper } from './styleds'
import { setAttemptingTxn, setShowConfirm, setTxHash, setVestingError } from 'state/vesting/actions'
import { Flex, Text } from 'rebass'
import { useMedia } from 'react-use'
import useTheme from 'hooks/useTheme'
import { useIsDarkMode } from 'state/user/hooks'
import { RewardLockerVersion } from 'state/farms/types'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { fixedFormatting } from 'utils/formatBalance'

const RewardLockerSchedules = ({
  rewardLockerAddress,
  schedules,
  idx,
  rewardLockerVersion,
}: {
  rewardLockerAddress: string
  schedules: [BigNumber, BigNumber, BigNumber, BigNumber, Token, number, RewardLockerVersion][]
  idx: number
  rewardLockerVersion: RewardLockerVersion
}) => {
  const theme = useTheme()
  const isDarkMode = useIsDarkMode()
  const dispatch = useAppDispatch()
  const above500 = useMedia('(min-width: 500px)')
  const currentBlockNumber = useBlockNumber()
  const currentTimestamp = Math.round(Date.now() / 1000)
  const { account, chainId } = useActiveWeb3React()
  const [expanded, setExpanded] = useState<boolean>(true)
  const { vestMultipleTokensAtIndices } = useVesting(rewardLockerAddress)
  const { mixpanelHandler } = useMixpanel()
  if (!schedules) {
    schedules = []
  }
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
        token: schedule[4] as Token,
      }
    }

    result[address].totalAmount = result[address].totalAmount.add(BigNumber.from(schedule[2]))
    /**
     * fullyVestedAlready = schedule.quantity - schedule.vestedQuantity
     */
    const fullyVestedAlready = schedule[2].sub(schedule[3]).isZero()

    /**
     * v1: isEnd = schedule.endBlock < currentBlock
     * v2: isEnd = schedule.endTime < currentTimestamp
     */
    const isEnd =
      rewardLockerVersion === RewardLockerVersion.V1
        ? schedule[1].lt(currentBlockNumber)
        : schedule[1].lt(currentTimestamp)
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
      ? schedule[2]
      : rewardLockerVersion === RewardLockerVersion.V1
      ? schedule[2].mul(BigNumber.from(currentBlockNumber).sub(schedule[0])).div(schedule[1].sub(schedule[0]))
      : schedule[2].mul(BigNumber.from(currentTimestamp).sub(schedule[0])).div(schedule[1].sub(schedule[0]))
    const vestableAmount = unlockedAmount.sub(BigNumber.from(schedule[3])) // vestableAmount = unlock - vestedQuanitty
    if (!fullyVestedAlready) {
      result[address].vestableIndexes.push(schedule[5])
    }
    result[address].vestableAmount = result[address].vestableAmount.add(
      vestableAmount.isNegative() ? BigNumber.from(0) : vestableAmount,
    )
    if (!fullyVestedAlready && (rewardLockerVersion === RewardLockerVersion.V2 || !!currentBlockNumber) && isEnd) {
      result[address].fullyIndexes.push(schedule[5])
      result[address].fullyAmount = result[address].fullyAmount.add(schedule[2])
    }

    result[address].unlockedAmount = result[address].unlockedAmount.add(unlockedAmount)
    return result
  }, {})
  const onClaimAll = async () => {
    if (!chainId || !account) {
      return
    }

    dispatch(setShowConfirm(true))
    dispatch(setAttemptingTxn(true))
    dispatch(setTxHash(''))

    try {
      const addresses = Object.values(info)
        .filter(item => item.vestableIndexes.length > 0)
        .map(item => item.token.address)
      const indices = Object.keys(info).reduce<number[][]>((acc, k) => {
        if (info[k].vestableIndexes.length > 0) acc.push(info[k].vestableIndexes)
        return acc
      }, [])
      const txHash = await vestMultipleTokensAtIndices(addresses, indices)
      if (txHash) {
        mixpanelHandler(MIXPANEL_TYPE.ALL_REWARDS_CLAIMED, {
          reward_tokens_and_amounts: Object.assign(
            {},
            ...Object.keys(info).map(k => {
              return { [k]: fixedFormatting(info[k].vestableAmount, info[k].token.decimals) }
            }),
          ),
        })
      }
      dispatch(setTxHash(txHash))
    } catch (err) {
      console.error(err)
      dispatch(setVestingError(err as Error))
    }

    dispatch(setAttemptingTxn(false))
  }

  return (
    <RewardLockerSchedulesWrapper showBorder={!expanded}>
      <RewardLockerSchedulesTitle backgroundColor={isDarkMode ? `${theme.bg12}40` : `${theme.bg12}80`}>
        <Flex justifyContent="space-between" alignItems="center" width="100%" marginBottom={above500 ? 0 : '10px'}>
          <Text>Group {idx}</Text>
          {!above500 && (
            <ButtonDropdown
              expanded={expanded}
              marginLeft="8px"
              padding="9px"
              width="max-content"
              onClick={() => setExpanded(prev => !prev)}
            />
          )}
        </Flex>

        <ClaimAllSection>
          <UnlockedBlock info={info} onClaimAll={onClaimAll} />

          {above500 && (
            <ButtonDropdown
              expanded={expanded}
              marginLeft="8px"
              padding="9px"
              width="max-content"
              onClick={() => setExpanded(prev => !prev)}
            />
          )}
        </ClaimAllSection>
      </RewardLockerSchedulesTitle>

      {expanded && (
        <>
          {schedules.map(
            (s, index) =>
              !BigNumber.from(s[2])
                .sub(BigNumber.from(s[3]))
                .isZero() && (
                <Schedule
                  rewardLockerAddress={rewardLockerAddress}
                  schedule={s}
                  key={index}
                  currentTimestamp={currentTimestamp}
                />
              ),
          )}

          {schedules.map(
            (s, index) =>
              BigNumber.from(s[2])
                .sub(BigNumber.from(s[3]))
                .isZero() && (
                <Schedule
                  rewardLockerAddress={rewardLockerAddress}
                  schedule={s}
                  key={index}
                  currentTimestamp={currentTimestamp}
                />
              ),
          )}
        </>
      )}
    </RewardLockerSchedulesWrapper>
  )
}

export default RewardLockerSchedules
