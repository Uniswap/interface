import { useCelo, useProvider } from '@celo/react-celo'
import IUniswapV2PairABI from '@ubeswap/core/build/abi/IUniswapV2Pair.json'
import { JSBI, Token, TokenAmount } from '@ubeswap/sdk'
import ERC20_ABI from 'constants/abis/erc20'
import MOOLA_STAKING_ABI from 'constants/abis/moola/MoolaStakingRewards.json'
import { BigNumber, ContractInterface, ethers } from 'ethers'
import { Erc20, MoolaStakingRewards } from 'generated'
import { useAllTokens, useToken } from 'hooks/Tokens'
import { useMultiStakingContract, useStakingContract } from 'hooks/useContract'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import { useEffect, useMemo, useState } from 'react'
import { useSingleCallResult } from 'state/multicall/hooks'
import { getProviderOrSigner } from 'utils'
import { isAddress } from 'web3-utils'

import { BIG_INT_SECONDS_IN_YEAR } from './../../constants/index'
import { useCUSDPrice, useCUSDPriceOfULP, useCUSDPrices } from './../../utils/useCUSDPrice'

type PairToken = {
  token0Address: string
  token1Address: string
}
export interface CustomStakingInfo {
  totalStakedAmount: TokenAmount | undefined
  stakingToken: Token | null | undefined
  rewardTokens: Token[]
  earnedAmounts: TokenAmount[]
  totalRewardRates: TokenAmount[]
  stakedAmount: TokenAmount | undefined
  userValueCUSD: string | undefined
  valueOfTotalStakedAmountInCUSD: string | undefined
  stakingRewardAddress: string
  active: boolean
  readonly getHypotheticalRewardRate: (
    stakedAmount: TokenAmount,
    totalStakedAmount: TokenAmount,
    totalRewardRates: TokenAmount[]
  ) => TokenAmount[]
  tokens: Token[] | undefined
  rewardRates: TokenAmount[]
  rewardsUSDPerYear: string
}

export const useCustomStakingInfo = (farmAddress: string): CustomStakingInfo => {
  const { address: account, network } = useCelo()
  const { chainId } = network
  const library = useProvider()
  const provider = getProviderOrSigner(library, account || undefined)
  const tokens = useAllTokens()

  const stakingContract = useStakingContract(isAddress(farmAddress) ? farmAddress : '')
  const multiStakingContract = useMultiStakingContract(isAddress(farmAddress) ? farmAddress : '')
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
          const moolaStaking = new ethers.Contract(
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
            const tokenContract = new ethers.Contract(
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
  const stakedAmount = stakingToken ? new TokenAmount(stakingToken, JSBI.BigInt(balanceOf ?? 0)) : undefined

  const pair = useMemo(() => {
    return stakingTokenAddress
      ? new ethers.Contract(stakingTokenAddress, IUniswapV2PairABI as ContractInterface, provider)
      : undefined
  }, [provider, stakingTokenAddress])

  useEffect(() => {
    const getPairToken = async (pair: ethers.Contract) => {
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
  const earnedAmounts: TokenAmount[] =
    rewardTokens && isAddress(farmAddress)
      ? rewardTokens?.map(
          (rewardsToken, index) => new TokenAmount(rewardsToken, JSBI.BigInt(earnedAmountsAll[index] ?? 0))
        )
      : []

  const totalRewardRates =
    rewardTokens && isAddress(farmAddress)
      ? rewardTokens.map(
          (rewardsToken, i) =>
            new TokenAmount(rewardsToken, rewardRates && rewardRates[i] ? rewardRates[i] : JSBI.BigInt(0))
        )
      : []

  const totalStakedAmount =
    stakingToken && totalSupply ? new TokenAmount(stakingToken, JSBI.BigInt(totalSupply)) : undefined

  const tvlUSD = totalStakedAmount && lpPrice ? lpPrice.quote(totalStakedAmount).toSignificant(6) : undefined
  const userValueCUSD = stakedAmount && lpPrice ? lpPrice.quote(stakedAmount).toExact() : undefined
  const rewardsUSDPerYear = cusdPriceOfRewardTokens
    ? totalRewardRates.reduce((totalRewardsUSDPerYear: string, rewardRate, index) => {
        return JSBI.add(
          JSBI.BigInt(totalRewardsUSDPerYear),
          JSBI.multiply(
            cusdPriceOfRewardTokens[index]?.quote(rewardRate).raw ?? JSBI.BigInt(0),
            JSBI.BigInt(BIG_INT_SECONDS_IN_YEAR)
          )
        ).toString()
      }, '0')
    : '0'

  const getHypotheticalRewardRate = (
    _stakedAmount: TokenAmount,
    _totalStakedAmount: TokenAmount,
    _totalRewardRates: TokenAmount[]
  ): TokenAmount[] => {
    return rewardTokens && rewardTokens.length > 0
      ? rewardTokens.map(
          (rewardToken, index) =>
            new TokenAmount(
              rewardToken,
              JSBI.greaterThan(_totalStakedAmount.raw, JSBI.BigInt(0))
                ? JSBI.divide(JSBI.multiply(_totalRewardRates[index].raw, _stakedAmount.raw), _totalStakedAmount.raw)
                : JSBI.BigInt(0)
            )
        )
      : []
  }

  const userRewardRates =
    rewardTokens && rewardTokens.length > 0 && totalStakedAmount && stakedAmount
      ? rewardTokens.map(
          (rewardToken, index) =>
            new TokenAmount(
              rewardToken,
              JSBI.greaterThan(totalStakedAmount.raw, JSBI.BigInt(0))
                ? JSBI.divide(JSBI.multiply(totalRewardRates[index].raw, stakedAmount.raw), totalStakedAmount.raw)
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
