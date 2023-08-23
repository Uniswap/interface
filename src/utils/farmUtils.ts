import { Currency, CurrencyAmount } from '@pollum-io/sdk-core'
import { ChainId } from '@pollum-io/smart-order-router'
import { useWeb3React } from '@web3-react/core'
import { DualStakingInfo, StakingInfo } from 'components/Farm/constants'
import { EMPTY } from 'constants/addresses'
import { TokenAmount } from 'graphql/utils/types'
import { useEffect, useState } from 'react'
import { TokenAddressMap } from 'state/lists/hooks'
import { Token } from 'types/v3'

import { unwrappedToken } from './unwrappedToken'

export interface Call {
  address: string
  callData: string
  gasRequired?: number
}

export function useUSDCPricesFromAddresses(addressArray: string[]) {
  const { chainId } = useWeb3React()
  const [prices, setPrices] = useState<{ address: string; price: number }[] | undefined>()
  const addressStr = addressArray.join('_')
  // TODO: review this function USDCPRICES
  useEffect(() => {
    if (!chainId) return
    ;(async () => {
      const addresses = addressStr.split('_')

      const pricesV2: any[] = []
      // TODO: review response
      const res = await fetch(
        `${process.env.REACT_APP_LEADERBOARD_APP_URL}/utils/token-prices/v3?chainId=${chainId}&addresses=${addressStr}`
      )
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || res.statusText || `Failed to get v3 token price`)
      }
      const data = await res.json()

      const pricesV3 = data && data.data && data.data.length > 0 ? data.data : []

      const prices = addresses.map((address) => {
        const priceV3 = pricesV3.find((item: any) => item && item.id.toLowerCase() === address.toLowerCase())
        if (priceV3 && priceV3.price) {
          return {
            address,
            price: priceV3.price,
          }
        } else {
          const priceV2 = pricesV2.find((item: any) => item && item.id.toLowerCase() === address.toLowerCase())
          if (priceV2 && priceV2.price) {
            return {
              address,
              price: priceV2.price,
            }
          }
          return { address, price: 0 }
        }
      })
      setPrices(prices)
    })()
  }, [chainId, addressStr])

  return prices
}

export function getTokenFromAddress(
  tokenAddress: string,
  chainId: ChainId,
  tokenMap: TokenAddressMap,
  tokens: Token[]
) {
  const tokenIndex = Object.keys(tokenMap[chainId]).findIndex(
    (address) => address.toLowerCase() === tokenAddress.toLowerCase()
  )
  if (tokenIndex === -1) {
    const token = tokens.find((item) => item.address.toLowerCase() === tokenAddress.toLowerCase())
    return token
  }

  return Object.values(tokenMap[chainId])[tokenIndex]
}

export function formatTokenAmount(amount?: TokenAmount | CurrencyAmount<Currency>, digits = 3) {
  if (!amount) return '-'
  const amountStr = (amount as CurrencyAmount<Currency>).toExact()
  if (Math.abs(Number(amountStr)) > 1) {
    return Number(amountStr).toLocaleString('us')
  }
  return (amount as CurrencyAmount<Currency>).toSignificant(digits)
}

export function formatAPY(apy: number) {
  if (apy > 100000000) {
    return '>100000000'
  } else {
    return apy.toLocaleString('us')
  }
}

export function getAPYWithFee(rewards: number, fee: number) {
  return fee > 0 ? ((1 + ((rewards + fee / 12) * 12) / 12) ** 12 - 1) * 100 : 0
}

export function getTVLStaking(
  valueOfTotalStakedAmountInUSDC?: CurrencyAmount<Currency>,
  valueOfTotalStakedAmountInBaseToken?: TokenAmount
) {
  if (!valueOfTotalStakedAmountInUSDC) {
    return valueOfTotalStakedAmountInBaseToken ? formatTokenAmount(valueOfTotalStakedAmountInBaseToken) + ' ETH' : '-'
  }
  return `$${formatTokenAmount(valueOfTotalStakedAmountInUSDC)}`
}

export function getRewardRate(rate?: TokenAmount, rewardToken?: Token) {
  if (!rate || !rewardToken) return
  const ratee = 0.0
  return `${ratee.toFixed(2).replace(/[.,]00$/, '')} ${rewardToken.symbol}  / day`
}

export function getEarnedUSDLPFarm(stakingInfo: StakingInfo | undefined) {
  if (!stakingInfo || !stakingInfo.earnedAmount) return
  // const earnedUSD = Number(stakingInfo.earnedAmount.toExact()) * stakingInfo.rewardTokenPrice
  const earnedUSD = Number(0) * stakingInfo.rewardTokenPrice
  if (earnedUSD < 0.001 && earnedUSD > 0) {
    return '< $0.001'
  }
  return `$${earnedUSD.toLocaleString('us')}`
}

export function getEarnedUSDDualFarm(stakingInfo: DualStakingInfo | undefined) {
  if (!stakingInfo || !stakingInfo.earnedAmountA || !stakingInfo.earnedAmountB) return
  // const earnedUSD =
  //   Number(stakingInfo.earnedAmountA.toExact()) * stakingInfo.rewardTokenAPrice +
  //   Number(stakingInfo.earnedAmountB.toExact()) * Number(stakingInfo.rewardTokenBPrice)
  const earnedUSD = Number(0) * stakingInfo.rewardTokenAPrice + Number(0) * Number(stakingInfo.rewardTokenBPrice)
  if (earnedUSD < 0.001 && earnedUSD > 0) {
    return '< $0.001'
  }
  return `$${earnedUSD.toLocaleString('us')}`
}

export function getStakedAmountStakingInfo(
  stakingInfo?: StakingInfo | DualStakingInfo,
  userLiquidityUnstaked?: TokenAmount
) {
  if (!stakingInfo) return
  const stakingTokenPair = stakingInfo.stakingTokenPair
  const baseTokenCurrency = unwrappedToken(stakingInfo.baseToken as unknown as Currency)
  const empty = unwrappedToken(EMPTY[570])
  const token0 = stakingInfo.tokens[0]
  const baseToken = baseTokenCurrency === empty ? token0 : stakingInfo.baseToken
  if (!stakingInfo.totalSupply || !stakingTokenPair || !stakingInfo.totalStakedAmount || !stakingInfo.stakedAmount)
    return
  // take the total amount of LP tokens staked, multiply by ETH value of all LP tokens, divide by all LP tokens
  const valueOfTotalStakedAmountInBaseToken = 0
  // new TokenAmount(
  //   baseToken,
  //   JSBI.divide(
  //     JSBI.multiply(
  //       JSBI.multiply(stakingInfo.totalStakedAmount.raw, stakingTokenPair.reserveOf(baseToken).raw),
  //       JSBI.BigInt(2) // this is b/c the value of LP shares are ~double the value of the WETH they entitle owner to
  //     ),
  //     stakingInfo.totalSupply.raw
  //   )
  // )

  const valueOfMyStakedAmountInBaseToken = 0

  // new TokenAmount(
  //   baseToken,
  //   JSBI.divide(
  //     JSBI.multiply(
  //       JSBI.multiply(stakingInfo.stakedAmount.raw, stakingTokenPair.reserveOf(baseToken).raw),
  //       JSBI.BigInt(2) // this is b/c the value of LP shares are ~double the value of the WETH they entitle owner to
  //     ),
  //     stakingInfo.totalSupply.raw
  //   )
  // )

  // get the USD value of staked WETH
  const USDPrice = stakingInfo.usdPrice
  const valueOfTotalStakedAmountInUSDC = 0
  //  USDPrice?.quote(valueOfTotalStakedAmountInBaseToken)

  const valueOfMyStakedAmountInUSDC = 0
  // USDPrice?.quote(valueOfMyStakedAmountInBaseToken)

  const stakedAmounts = {
    totalStakedBase: valueOfTotalStakedAmountInBaseToken,
    totalStakedUSD: valueOfTotalStakedAmountInUSDC,
    myStakedBase: valueOfMyStakedAmountInBaseToken,
    myStakedUSD: valueOfMyStakedAmountInUSDC,
    unStakedBase: undefined,
    unStakedUSD: undefined,
  }

  if (!userLiquidityUnstaked) return stakedAmounts

  const valueOfUnstakedAmountInBaseToken = 0
  // new TokenAmount(
  //   baseToken,
  //   JSBI.divide(
  //     JSBI.multiply(
  //       JSBI.multiply(userLiquidityUnstaked.raw, stakingTokenPair.reserveOf(baseToken).raw),
  //       JSBI.BigInt(2)
  //     ),
  //     stakingInfo.totalSupply.raw
  //   )
  // )

  const valueOfUnstakedAmountInUSDC = 0
  // USDPrice?.quote(valueOfUnstakedAmountInBaseToken)
  return {
    ...stakedAmounts,
    unStakedBase: valueOfUnstakedAmountInBaseToken,
    unStakedUSD: valueOfUnstakedAmountInUSDC,
  }
}

export function formatReward(earned: number) {
  if (earned === 0) {
    return '0'
  }

  if (earned < 0.01 && earned > 0) {
    return '< 0.01'
  }

  const _earned = String(earned).split('.')

  if (!_earned[1]) return _earned[0]

  return `${_earned[0].length > 8 ? `${_earned[0].slice(0, 8)}..` : _earned[0]}${
    !_earned[1].split('').every((el) => el === '0') ? `.${_earned[1].slice(0, 2)}` : ``
  }`
}

export function getV3TokenFromAddress(tokenAddress: string, chainId: ChainId, tokenMap: TokenAddressMap) {
  const tokenIndex = Object.keys(tokenMap[chainId]).findIndex(
    (address) => address.toLowerCase() === tokenAddress.toLowerCase()
  )
  if (tokenIndex === -1) {
    return undefined
  }

  const token = Object.values(tokenMap[chainId])[tokenIndex]
  return token
}
