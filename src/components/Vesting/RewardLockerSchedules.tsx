import { BigNumber } from '@ethersproject/bignumber'
import { Token } from '@kyberswap/ks-sdk-core'

import { ZERO_ADDRESS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useTimestampFromBlock } from 'hooks/useTimestampFromBlock'
import useVesting from 'hooks/useVesting'
import { useBlockNumber } from 'state/application/hooks'
import { RewardLockerVersion } from 'state/farms/classic/types'
import { useAppDispatch } from 'state/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { setAttemptingTxn, setShowConfirm, setTxHash, setVestingError } from 'state/vesting/actions'
import { fixedFormatting } from 'utils/formatBalance'

import VestingCard from './VestingCard'

const RewardLockerSchedules = ({
  rewardLockerAddress,
  schedules,
  rewardLockerVersion,
}: {
  rewardLockerAddress: string
  schedules: [BigNumber, BigNumber, BigNumber, BigNumber, Token, number, RewardLockerVersion][]
  rewardLockerVersion: RewardLockerVersion
}) => {
  const dispatch = useAppDispatch()
  const currentBlockNumber = useBlockNumber()
  const currentTimestamp = Math.round(Date.now() / 1000)
  const { account, chainId } = useActiveWeb3React()
  const { vestMultipleTokensAtIndices } = useVesting(rewardLockerAddress)
  const { mixpanelHandler } = useMixpanel()
  if (!schedules) {
    schedules = []
  }

  const rewardTokenMap: { [address: string]: Token } = {}
  schedules.forEach(schedule => {
    const address =
      schedule[4].address === ZERO_ADDRESS ? NativeCurrencies[chainId].wrapped.address : schedule[4].address

    if (!rewardTokenMap[address]) {
      rewardTokenMap[address] = schedule[4]
    }
  })

  const rewardPriceMap = useTokenPrices(Object.keys(rewardTokenMap))

  const info = schedules.reduce<{
    [key: string]: {
      vestableIndexes: number[]
      vestableAmount: BigNumber
      // fullyIndexes: number[]
      // fullyAmount: BigNumber
      totalAmount: BigNumber
      unlockedAmount: BigNumber
      vestedAmount: BigNumber
      token: Token
      tokenPrice: number
    }
  }>((result, schedule) => {
    if (!currentBlockNumber) return result
    const address =
      schedule[4].address === ZERO_ADDRESS ? NativeCurrencies[chainId].wrapped.address : schedule[4].address

    if (!result[address]) {
      result[address] = {
        vestableIndexes: [],
        vestableAmount: BigNumber.from(0),
        // fullyIndexes: [],
        // fullyAmount: BigNumber.from(0),
        totalAmount: BigNumber.from(0),
        unlockedAmount: BigNumber.from(0),
        vestedAmount: BigNumber.from(0),
        token: schedule[4] as Token,
        tokenPrice: rewardPriceMap[address],
      }
    }

    result[address].totalAmount = result[address].totalAmount.add(BigNumber.from(schedule[2]))

    result[address].vestedAmount = result[address].vestedAmount.add(BigNumber.from(schedule[3]))
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
    // if (!fullyVestedAlready && (rewardLockerVersion === RewardLockerVersion.V2 || !!currentBlockNumber) && isEnd) {
    //   result[address].fullyIndexes.push(schedule[5])
    //   result[address].fullyAmount = result[address].fullyAmount.add(schedule[2])
    // }

    result[address].unlockedAmount = result[address].unlockedAmount.add(unlockedAmount)
    return result
  }, {})

  const onClaimAll = async () => {
    if (!account) {
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

  const maxEndBlock = schedules.reduce((acc, cur) => {
    // timestapm or blockNumber version
    const version = cur[6]
    if (version === RewardLockerVersion.V1) {
      return acc && acc < cur[1].toNumber() ? cur[1].toNumber() : acc
    }

    return acc
  }, currentBlockNumber)

  const endTimestampFromBlock = useTimestampFromBlock(maxEndBlock)

  const endTime = schedules.reduce((acc, cur) => {
    // timestapm or blockNumber version
    const version = cur[6]
    if (version === RewardLockerVersion.V2) {
      return acc && acc < cur[1].toNumber() ? cur[1].toNumber() : acc
    }

    return acc
  }, endTimestampFromBlock || 0)

  return <VestingCard info={info} endTime={endTime} remainTime={endTime - currentTimestamp} onClaimAll={onClaimAll} />
}

export default RewardLockerSchedules
