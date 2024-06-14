import { BigNumber } from '@ethersproject/bignumber'
import { Contract, ContractInterface } from '@ethersproject/contracts'
import { ChainId, CurrencyAmount, Token } from '@ubeswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useDefaultActiveTokens, useToken } from 'hooks/Tokens'
import { useMoolaStakingRewardsContract, usePairContract, useStakingContract } from 'hooks/useContract'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import JSBI from 'jsbi'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useEffect, useState } from 'react'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import MOOLA_STAKING_ABI from 'uniswap/src/abis/moola-staking-rewards.json'
import { Erc20, MoolaStakingRewards } from 'uniswap/src/abis/types'
import { isAddress } from 'utilities/src/addresses'
import { useCUSDPrice, useCUSDPriceOfULP, useCUSDPrices } from './useCUSDPrice'

const BIG_INT_SECONDS_IN_YEAR = JSBI.BigInt(60 * 60 * 24 * 365)

type PairToken = {
  token0Address: string
  token1Address: string
}
export interface CustomStakingInfo {
  totalStakedAmount: CurrencyAmount<Token> | undefined
  stakingToken: Token | null | undefined
  rewardTokens: Token[]
  earnedAmounts: CurrencyAmount<Token>[]
  totalRewardRates: CurrencyAmount<Token>[]
  stakedAmount: CurrencyAmount<Token> | undefined
  userValueCUSD: string | undefined
  valueOfTotalStakedAmountInCUSD: string | undefined
  stakingRewardAddress: string
  active: boolean
  readonly getHypotheticalRewardRate: (
    stakedAmount: CurrencyAmount<Token>,
    totalStakedAmount: CurrencyAmount<Token>,
    totalRewardRates: CurrencyAmount<Token>[]
  ) => CurrencyAmount<Token>[]
  tokens: Token[] | undefined
  rewardRates: CurrencyAmount<Token>[]
  rewardsUSDPerYear: string
}

export const useCustomStakingInfo = (farmAddress: string): CustomStakingInfo => {
  const { account, chainId, provider } = useWeb3React()
  const tokens = useDefaultActiveTokens(ChainId.CELO)

  const stakingContract = useStakingContract(isAddress(farmAddress) ? farmAddress : '')
  const multiStakingContract = useMoolaStakingRewardsContract(isAddress(farmAddress) ? farmAddress : '')
  const [externalRewardsTokens, setExternalRewardsTokens] = useState<Array<Token>>([])
  const [externalRewardsRates, setExternalRewardsRates] = useState<Array<BigNumber>>([])
  const [externalEarnedAmounts, setExternalEarnedAmounts] = useState<Array<BigNumber>>([])
  const [fetchingMultiStaking, setFetchingMultiStaking] = useState<boolean>(false)
  const [pairToken, setPairToken] = useState<PairToken | undefined>(undefined)
  const currentBlockTimestamp = useCurrentBlockTimestamp()

  useEffect(() => {
    const fetchMultiStaking = async () => {
      if (fetchingMultiStaking || !multiStakingContract) {
        return
      }
      const externalRewardsTokens = []
      const rates = []
      const amounts: BigNumber[] = []
      try {
        setFetchingMultiStaking(true)
        const externalInfo = await Promise.all([
          multiStakingContract.externalStakingRewards(),
          multiStakingContract.callStatic.earnedExternal(account ?? ''),
        ])
        let stakingRewardsAddress = externalInfo[0]
        const externalEarned = externalInfo[1]
        if (externalEarned.length) {
          externalEarned.map((earned) => amounts.push(earned))
        }
        for (let i = 0; i < externalEarned.length; i += 1) {
          const moolaStaking = new Contract(
            stakingRewardsAddress,
            MOOLA_STAKING_ABI as ContractInterface,
            provider
          ) as unknown as MoolaStakingRewards
          const [rewardsTokenAddress, rewardRate] = await Promise.all([
            moolaStaking.rewardsToken(),
            moolaStaking.rewardRate(),
          ])
          const token: Token | undefined = rewardsTokenAddress ? tokens[rewardsTokenAddress] : undefined
          if (token) {
            externalRewardsTokens.push(token)
          } else {
            const tokenContract = new Contract(
              rewardsTokenAddress,
              ERC20_ABI as ContractInterface,
              provider
            ) as unknown as Erc20
            const [tokenName, symbol, decimals] = await Promise.all([
              tokenContract.name(),
              tokenContract.symbol(),
              tokenContract.decimals(),
            ])
            externalRewardsTokens.push(new Token(chainId as number, rewardsTokenAddress, decimals, symbol, tokenName))
          }
          rates.push(rewardRate)
          if (i < externalEarned.length - 1) stakingRewardsAddress = await moolaStaking.externalStakingRewards()
        }
      } catch (err) {
        console.error(err)
      }
      setFetchingMultiStaking(false)
      setExternalRewardsTokens(externalRewardsTokens)
      setExternalRewardsRates(rates)
      setExternalEarnedAmounts(amounts)
    }
    fetchMultiStaking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, multiStakingContract])

  const balanceOf = useSingleCallResult(stakingContract, 'balanceOf', [account || undefined])?.result?.[0]

  const periodFinish = useSingleCallResult(stakingContract, 'periodFinish', [])?.result?.[0]
  const periodFinishSeconds = periodFinish?.toNumber()
  const active =
    periodFinishSeconds && currentBlockTimestamp ? periodFinishSeconds > currentBlockTimestamp.toNumber() : false

  const rewardTokenAddress = useSingleCallResult(stakingContract, 'rewardsToken', [])?.result?.[0]
  const rewardToken = useToken(rewardTokenAddress)

  let rewardRates: any = useSingleCallResult(stakingContract, 'rewardRate', [])?.result
  rewardRates = rewardRates ? [...rewardRates, ...externalRewardsRates] : externalRewardsRates

  const earnedAmount = useSingleCallResult(stakingContract, 'earned', [account || undefined])?.result?.[0]
  const earnedAmountsAll: BigNumber[] = earnedAmount ? [earnedAmount, ...externalEarnedAmounts] : externalEarnedAmounts
  const totalSupply = useSingleCallResult(stakingContract, 'totalSupply', [])?.result?.[0]

  const stakingTokenAddress = useSingleCallResult(stakingContract, 'stakingToken', [])?.result?.[0]
  const stakingToken = useToken(stakingTokenAddress)
  const stakedAmount = stakingToken
    ? CurrencyAmount.fromRawAmount(stakingToken, JSBI.BigInt(balanceOf ?? 0))
    : undefined

  const pair = usePairContract(stakingTokenAddress)

  useEffect(() => {
    const getPairToken = async (pair: Contract) => {
      let token0Address: string | undefined = undefined
      let token1Address: string | undefined = undefined
      try {
        const tokens = await Promise.all([pair.token0(), pair.token1()])
        token0Address = tokens[0]
        token1Address = tokens[1]
      } catch (err) {
        console.error(err)
      }
      setPairToken(token0Address && token1Address ? { token0Address, token1Address } : undefined)
    }
    if (pair && !pairToken) {
      getPairToken(pair)
    }
  }, [pair, pairToken])

  const token0 = useToken(pairToken ? pairToken.token0Address : undefined)
  const token1 = useToken(pairToken ? pairToken.token1Address : undefined)
  const cusdPriceOfULP0 = useCUSDPrice(stakingToken ?? undefined)
  const cusdPriceOfULP1 = useCUSDPriceOfULP(pairToken && stakingToken ? stakingToken : undefined)

  const lpPrice = cusdPriceOfULP1 ? cusdPriceOfULP1 : cusdPriceOfULP0

  const rewardTokens: Token[] = rewardToken && isAddress(farmAddress) ? [rewardToken, ...externalRewardsTokens] : []

  const cusdPriceOfRewardTokens = useCUSDPrices(rewardTokens)
  const earnedAmounts: CurrencyAmount<Token>[] =
    rewardTokens && isAddress(farmAddress)
      ? rewardTokens?.map((rewardsToken, index) =>
          CurrencyAmount.fromRawAmount(rewardsToken, JSBI.BigInt(earnedAmountsAll[index] ?? 0))
        )
      : []

  const totalRewardRates =
    rewardTokens && isAddress(farmAddress)
      ? rewardTokens.map((rewardsToken, i) =>
          CurrencyAmount.fromRawAmount(rewardsToken, rewardRates && rewardRates[i] ? rewardRates[i] : JSBI.BigInt(0))
        )
      : []

  const totalStakedAmount =
    stakingToken && totalSupply ? CurrencyAmount.fromRawAmount(stakingToken, JSBI.BigInt(totalSupply)) : undefined

  const tvlUSD = totalStakedAmount && lpPrice ? lpPrice.quote(totalStakedAmount).toSignificant(6) : undefined
  const userValueCUSD = stakedAmount && lpPrice ? lpPrice.quote(stakedAmount).toExact() : undefined
  const rewardsUSDPerYear = cusdPriceOfRewardTokens
    ? totalRewardRates.reduce((totalRewardsUSDPerYear: string, rewardRate, index) => {
        return JSBI.add(
          JSBI.BigInt(totalRewardsUSDPerYear),
          JSBI.multiply(
            cusdPriceOfRewardTokens[index]?.quote(rewardRate).quotient ?? JSBI.BigInt(0),
            JSBI.BigInt(BIG_INT_SECONDS_IN_YEAR)
          )
        ).toString()
      }, '0')
    : '0'

  const getHypotheticalRewardRate = (
    _stakedAmount: CurrencyAmount<Token>,
    _totalStakedAmount: CurrencyAmount<Token>,
    _totalRewardRates: CurrencyAmount<Token>[]
  ): CurrencyAmount<Token>[] => {
    return rewardTokens && rewardTokens.length > 0
      ? rewardTokens.map((rewardToken, index) =>
          CurrencyAmount.fromRawAmount(
            rewardToken,
            JSBI.greaterThan(_totalStakedAmount.quotient, JSBI.BigInt(0))
              ? JSBI.divide(
                  JSBI.multiply(_totalRewardRates[index].quotient, _stakedAmount.quotient),
                  _totalStakedAmount.quotient
                )
              : JSBI.BigInt(0)
          )
        )
      : []
  }

  const userRewardRates =
    rewardTokens && rewardTokens.length > 0 && totalStakedAmount && stakedAmount
      ? rewardTokens.map((rewardToken, index) =>
          CurrencyAmount.fromRawAmount(
            rewardToken,
            JSBI.greaterThan(totalStakedAmount.quotient, JSBI.BigInt(0))
              ? JSBI.divide(
                  JSBI.multiply(totalRewardRates[index].quotient, stakedAmount.quotient),
                  totalStakedAmount.quotient
                )
              : JSBI.BigInt(0)
          )
        )
      : []

  return {
    totalStakedAmount,
    stakingToken,
    rewardTokens,
    totalRewardRates,
    stakedAmount,
    userValueCUSD,
    valueOfTotalStakedAmountInCUSD: Number(tvlUSD) < 1 ? '0' : tvlUSD,
    active,
    stakingRewardAddress: farmAddress,
    getHypotheticalRewardRate,
    tokens: pairToken && token0 && token1 ? [token0, token1] : stakingToken ? [stakingToken, stakingToken] : undefined,
    earnedAmounts,
    rewardRates: userRewardRates,
    rewardsUSDPerYear,
  }
}
