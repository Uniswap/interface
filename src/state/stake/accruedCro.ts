import BigNumber from 'bignumber.js'

export interface HourlyRewardRaw {
  reward: string
  timestamp: string
}

interface HourlyReward {
  reward: BigNumber
  date: string
  time: string
}

const groupBy = (array: {}[], key: string) => {
  return array.reduce((result, currentValue) => {
    ;(result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue)
    return result
  }, {})
}

function computeDailyReward(rewardInDay: HourlyReward[]): BigNumber {
  return rewardInDay.reduce((previousValue: BigNumber, { reward }: HourlyReward) => {
    return reward.lt(previousValue) ? reward : previousValue
  }, new BigNumber(Infinity))
}

export function computeAccruedCro(rewardsPerHour: HourlyRewardRaw[]): { totalAccruedCro: string } {
  const emptyResult = { totalAccruedCro: '0.00' }
  const rewards: HourlyReward[] = rewardsPerHour.map(({ reward, timestamp }) => {
    return {
      reward: new BigNumber(reward),
      date: new Date(+timestamp * 1000).toISOString().split('T')[0],
      time: new Date(+timestamp * 1000).toISOString().split('T')[1]
    }
  })
  if (rewards.length == 0) return emptyResult
  const rewardGroupByDate = groupBy(rewards, 'date') as { [key: string]: HourlyReward[] }

  const totalAccruedCro = Object.keys(rewardGroupByDate)
    .sort()
    .reduce<BigNumber>((previousValue: BigNumber, currentValue: string) => {
      const rewardsListPerDay = rewardGroupByDate[currentValue]
      const reward = computeDailyReward(rewardsListPerDay)
      return previousValue.plus(reward)
    }, new BigNumber(0))

  return { totalAccruedCro: totalAccruedCro.toString() }
}
