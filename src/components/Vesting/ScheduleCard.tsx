import { Token } from '@kyberswap/ks-sdk-core'
import { BigNumber } from 'ethers'

import { ZERO_ADDRESS } from 'constants/index'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { Schedule } from 'state/vesting/hooks'
import { calculateGasMargin } from 'utils'
import { fixedFormatting } from 'utils/formatBalance'

import VestingCard from './VestingCard'

const ScheduleCard = ({ schedules }: { schedules: Schedule[] }) => {
  const endTime = schedules.reduce((max, schedule) => (max < schedule.endTime ? schedule.endTime : max), 0)
  const currentTimestamp = Math.floor(+new Date() / 1000)
  const remainTime = endTime - currentTimestamp
  const { mixpanelHandler } = useMixpanel()

  const info = schedules.reduce<{
    [tokenAddress: string]: {
      vestableIndexes: number[]
      vestableAmount: BigNumber
      /* fullyIndexes: number[] */
      /* fullyAmount: BigNumber */
      totalAmount: BigNumber
      unlockedAmount: BigNumber
      vestedAmount: BigNumber
      token: Token
      tokenPrice: number
    }
  }>((result, schedule, index) => {
    const address = (schedule.token.isNative ? ZERO_ADDRESS : schedule.token.address) as string

    if (!result[address]) {
      result[address] = {
        vestableIndexes: [],
        vestableAmount: BigNumber.from(0),
        /* fullyIndexes: [], */
        /* fullyAmount: BigNumber.from(0), */
        totalAmount: BigNumber.from(0),
        unlockedAmount: BigNumber.from(0),
        vestedAmount: BigNumber.from(0),
        token: schedule.token,
        tokenPrice: schedule.tokenPrice,
      }
    }

    result[address].totalAmount = result[address].totalAmount.add(BigNumber.from(schedule.quantity))
    result[address].vestedAmount = result[address].vestedAmount.add(BigNumber.from(schedule.vestedQuantity))
    /**
     * fullyVestedAlready = schedule.quantity - schedule.vestedQuantity
     */
    const fullyVestedAlready = schedule.quantity.sub(schedule.vestedQuantity).isZero()
    const isEnd = currentTimestamp > schedule.endTime

    const timePeriod = BigNumber.from(schedule.endTime - schedule.startTime)

    const unlockedAmount = isEnd
      ? schedule.quantity
      : schedule.quantity.mul(BigNumber.from(currentTimestamp).sub(BigNumber.from(schedule.startTime))).div(timePeriod)

    result[address].unlockedAmount = result[address].unlockedAmount.add(unlockedAmount)
    const vestableAmount = unlockedAmount.sub(BigNumber.from(schedule.vestedQuantity)) // vestableAmount = unlock - vestedQuanitty

    result[address].vestableAmount = result[address].vestableAmount.add(
      vestableAmount.isNegative() ? BigNumber.from(0) : vestableAmount,
    )

    if (!fullyVestedAlready) {
      result[address].vestableIndexes.push(schedule.index)
    }

    /* if (!fullyVestedAlready && isEnd) { */
    /*   result[address].fullyIndexes.push(schedule.index) */
    /*   result[address].fullyAmount = result[address].fullyAmount.add(schedule.quantity) */
    /* } */

    return result
  }, {})

  const addTransactionWithType = useTransactionAdder()

  const handleClaimAll = async () => {
    const contract = schedules?.[0].contract
    if (!contract) return
    let tokens = Object.keys(info)
    let indices = tokens.map(key => info[key].vestableIndexes)

    tokens = tokens.filter((_token, index) => !!indices[index].length)
    indices = indices.filter(ind => !!ind.length)

    const estimateGas = await contract.estimateGas.vestScheduleForMultipleTokensAtIndices(tokens, indices)
    const tx = await contract.vestScheduleForMultipleTokensAtIndices(tokens, indices, {
      gasLimit: calculateGasMargin(estimateGas),
    })
    if (tx) {
      addTransactionWithType({
        hash: tx.hash,
        type: TRANSACTION_TYPE.CLAIM_REWARD,
        extraInfo: { summary: 'all rewards' },
      })
      mixpanelHandler(MIXPANEL_TYPE.ELASTIC_ALL_REWARD_CLAIMED, {
        reward_tokens_and_qty: Object.assign(
          {},
          ...Object.keys(info).map(k => {
            return { [k]: fixedFormatting(info[k].vestableAmount, info[k].token.decimals) }
          }),
        ),
      })
    }
  }

  return <VestingCard info={info} endTime={endTime} remainTime={remainTime} onClaimAll={handleClaimAll} />
}

export default ScheduleCard
