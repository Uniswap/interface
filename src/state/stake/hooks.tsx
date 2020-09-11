import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import dayjs from 'dayjs'
import { useCallback } from 'react'
import { Field, StakeContractAddress } from '../../constants/stakeContractAddress'
import { useActiveWeb3React } from '../../hooks'
import { useCROStakeContract } from '../../hooks/useContract'
import { gql } from 'graphql-request'
import graphQLClient from '../../utils/graphqlClient'
import { computeAccruedCro } from './accruedCro'

export function StakeContractAddressMapper(key: string): string {
  const address: string | undefined = StakeContractAddress[key]

  if (typeof address === 'undefined') throw new Error(`Stake address not match ${key}`)

  return address
}

export interface PersonalStakes {
  dayDiff: number // day difference between now and due date
  amount: BigNumber
  address: string
  isDue: boolean
  terms: Field
}

export function useCryptoStakeSummary() {
  const { account } = useActiveWeb3React()

  const oneYearContract = useCROStakeContract(StakeContractAddress.ONE_YEAR, true)
  const twoYearContract = useCROStakeContract(StakeContractAddress.TWO_YEAR, true)
  const threeYearContract = useCROStakeContract(StakeContractAddress.THREE_YEAR, true)
  const fourYearContract = useCROStakeContract(StakeContractAddress.FOUR_YEAR, true)

  const getStakeSummaryFromContract = useCallback(async (): Promise<{
    [Field.ONE_YEAR]: BigNumber
    [Field.TWO_YEAR]: BigNumber
    [Field.THREE_YEAR]: BigNumber
    [Field.FOUR_YEAR]: BigNumber
  }> => {
    if (!account || !oneYearContract || !twoYearContract || !threeYearContract || !fourYearContract)
      return {
        [Field.ONE_YEAR]: BigNumber.from(0),
        [Field.TWO_YEAR]: BigNumber.from(0),
        [Field.THREE_YEAR]: BigNumber.from(0),
        [Field.FOUR_YEAR]: BigNumber.from(0)
      }

    async function getActualStaked(contract: Contract): Promise<BigNumber> {
      return contract?.totalStakedFor(account)
    }

    const [oneYearStake, twoYearStake, threeYearStake, fourYearStake] = await Promise.all<BigNumber>([
      getActualStaked(oneYearContract),
      getActualStaked(twoYearContract),
      getActualStaked(threeYearContract),
      getActualStaked(fourYearContract)
    ])

    return {
      [Field.ONE_YEAR]: oneYearStake,
      [Field.TWO_YEAR]: twoYearStake,
      [Field.THREE_YEAR]: threeYearStake,
      [Field.FOUR_YEAR]: fourYearStake
    }
  }, [account, oneYearContract, twoYearContract, threeYearContract, fourYearContract])

  const getOutstandingStakes = useCallback(async () => {
    if (!account || !oneYearContract || !twoYearContract || !threeYearContract || !fourYearContract)
      return {
        [Field.ONE_YEAR]: [],
        [Field.TWO_YEAR]: [],
        [Field.THREE_YEAR]: [],
        [Field.FOUR_YEAR]: []
      }

    async function getAllStakedItem(contract: Contract, terms: Field) {
      const [createdTimeStamps, amountList, addressList]: [
        BigNumber[],
        BigNumber[],
        string[]
      ] = await contract?.getPersonalStakes(account)

      const now = dayjs()

      const StakedList: PersonalStakes[] = addressList.map((address, index) => {
        const dueDate = dayjs.unix(createdTimeStamps[index].toNumber())
        return {
          dayDiff: dueDate.diff(now, 'millisecond'),
          amount: amountList[index],
          address,
          isDue: now.isAfter(dueDate) || now.isSame(dueDate),
          terms
        }
      })

      return StakedList
    }

    const result = await Promise.all([
      getAllStakedItem(oneYearContract, Field.ONE_YEAR),
      getAllStakedItem(twoYearContract, Field.TWO_YEAR),
      getAllStakedItem(threeYearContract, Field.THREE_YEAR),
      getAllStakedItem(fourYearContract, Field.FOUR_YEAR)
    ])

    return {
      [Field.ONE_YEAR]: result[0],
      [Field.TWO_YEAR]: result[1],
      [Field.THREE_YEAR]: result[2],
      [Field.FOUR_YEAR]: result[3]
    }
  }, [account, oneYearContract, twoYearContract, threeYearContract, fourYearContract])

  const getTotalAccruedCro: () => Promise<{
    totalAccruedCro: string
  }> = useCallback(async () => {
    const emptyResult = { totalAccruedCro: '0' }
    if (!account || !oneYearContract || !twoYearContract || !threeYearContract || !fourYearContract) return emptyResult

    async function getAccruedCro(address: string) {
      const d = new Date()
      const currentUTC0000TimestampNanos = d.setHours(0, 0, 0, 0)
      const currentUTC0000DateTimestamp: number = currentUTC0000TimestampNanos / 1000
      const query = gql`
        query rewards($address: String, $timestamp: Int!) {
          rewardPositionSnapshots(where: { address: $address, timestamp_lt: $timestamp }) {
            timestamp
            reward
          }
        }
      `

      const data = await graphQLClient.request(query, { address, timestamp: currentUTC0000DateTimestamp })
      return data.rewardPositionSnapshots
    }

    const data = await getAccruedCro(account)
    return computeAccruedCro(data)
  }, [account, oneYearContract, twoYearContract, threeYearContract, fourYearContract])

  return {
    oneYearContract,
    twoYearContract,
    threeYearContract,
    fourYearContract,
    getStakeSummaryFromContract,
    getOutstandingStakes,
    getTotalAccruedCro
  }
}
