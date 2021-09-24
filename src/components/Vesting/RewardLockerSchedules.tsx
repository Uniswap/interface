import React, { useState } from 'react'
import { BigNumber } from '@ethersproject/bignumber'
import { useMedia } from 'react-use'
import { Trans } from '@lingui/macro'

import { ChainId, Token } from 'libs/sdk/src'
import { ButtonDropdown } from 'components/Button'
import { AutoRow, RowBetween } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import useVesting from 'hooks/useVesting'
import { useAppDispatch } from 'state/hooks'
import { useBlockNumber } from 'state/application/hooks'
import { ExternalLink } from 'theme'
import { getEtherscanLink, shortenAddress } from 'utils'
import Schedule from './Schedule'
import UnlockedBlock from './UnlockedBlock'
import { RewardLockerSchedulesWrapper, RewardLockerSchedulesTitle, ClaimAllSection, NoVestingSchedule } from './styleds'
import { setAttemptingTxn, setShowConfirm, setTxHash, setVestingError } from 'state/vesting/actions'

const RewardLockerSchedules = ({
  rewardLockerAddress,
  schedules
}: {
  rewardLockerAddress: string
  schedules: [BigNumber, BigNumber, BigNumber, BigNumber, Token, number][]
}) => {
  const dispatch = useAppDispatch()
  const currentBlockNumber = useBlockNumber()
  const { account, chainId } = useActiveWeb3React()
  const above768 = useMedia('(min-width: 768px)')
  const [expanded, setExpanded] = useState<boolean>(true)
  const { vestMultipleTokensAtIndices } = useVesting(rewardLockerAddress)

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

  const onClaimAll = async () => {
    if (!chainId || !account) {
      return
    }

    dispatch(setShowConfirm(true))
    dispatch(setAttemptingTxn(true))
    dispatch(setTxHash(''))

    try {
      const addresses = Object.keys(info).map(k => info[k].token.address)
      const indices = Object.keys(info).reduce<number[][]>((acc, k) => {
        acc.push(info[k].vestableIndexes)
        return acc
      }, [])

      const txHash = await vestMultipleTokensAtIndices(addresses, indices)
      dispatch(setTxHash(txHash))
    } catch (err) {
      console.error(err)
      dispatch(setVestingError((err as Error).message))
    }

    dispatch(setAttemptingTxn(false))
  }

  return (
    <RewardLockerSchedulesWrapper>
      <RewardLockerSchedulesTitle showBorder={expanded}>
        {above768 ? (
          <>
            <span>
              Contract:{' '}
              <ExternalLink href={getEtherscanLink(chainId as ChainId, rewardLockerAddress, 'address')}>
                {shortenAddress(rewardLockerAddress)}
              </ExternalLink>
            </span>
            <ClaimAllSection>
              <UnlockedBlock info={info} onClaimAll={onClaimAll} />
              <ButtonDropdown
                expanded={expanded}
                marginLeft="8px"
                padding="9px"
                width="fit-content"
                onClick={() => setExpanded(!expanded)}
              />
            </ClaimAllSection>
          </>
        ) : (
          <>
            <RowBetween marginBottom="1rem">
              <span>
                Contract:{' '}
                <ExternalLink href={getEtherscanLink(chainId as ChainId, rewardLockerAddress, 'address')}>
                  {shortenAddress(rewardLockerAddress)}
                </ExternalLink>
              </span>
              <ButtonDropdown
                expanded={expanded}
                marginLeft="8px"
                padding="9px"
                width="fit-content"
                onClick={() => setExpanded(!expanded)}
              />
            </RowBetween>
            <AutoRow justify="flex-end">
              <UnlockedBlock info={info} onClaimAll={onClaimAll} />
            </AutoRow>
          </>
        )}
      </RewardLockerSchedulesTitle>

      {expanded && schedules.length === 0 && (
        <NoVestingSchedule>
          <Trans>No vesting schedule!</Trans>
        </NoVestingSchedule>
      )}

      {expanded && schedules.length > 0 && (
        <>
          {schedules.map(
            (s, index) =>
              !BigNumber.from(s[2])
                .sub(BigNumber.from(s[3]))
                .isZero() && <Schedule rewardLockerAddress={rewardLockerAddress} schedule={s} key={index} />
          )}

          {schedules.map(
            (s, index) =>
              BigNumber.from(s[2])
                .sub(BigNumber.from(s[3]))
                .isZero() && <Schedule rewardLockerAddress={rewardLockerAddress} schedule={s} key={index} />
          )}
        </>
      )}
    </RewardLockerSchedulesWrapper>
  )
}

export default RewardLockerSchedules
