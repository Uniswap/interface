import { gql } from '@apollo/client'
import { ChainId, Fraction } from '@kyberswap/ks-sdk-core'
import { BigNumber, Contract, ethers } from 'ethers'
import { useEffect, useMemo, useState } from 'react'
import { useLocalStorage } from 'react-use'

import { ERC20_ABI } from 'constants/abis/erc20'
import { KNC_ADDRESS } from 'constants/tokens'
import { useKyberswapConfig } from 'hooks/useKyberswapConfig'
import { getEthPrice, getKNCPriceByETH } from 'state/application/hooks'

const POOLS_BULK = gql`
  query pools($allPools: [Bytes]!) {
    pools(where: { id_in: $allPools }, orderBy: trackedReserveETH, orderDirection: desc) {
      id
      reserveUSD
      totalSupply
    }
  }
`
const ETH_PRICE = gql`
  query bundles {
    bundles(where: { id: 1 }) {
      id
      ethPrice
    }
  }
`
const TRESUARY_ADDRESS = '0x0e590bb5f02a0c38888bffb45dee050b8fb60bda'
const LP_ADDRESSES = [
  '0x61639d6ec06c13a96b5eb9560b359d7c648c7759', // eth-knc
  '0x1cf68bbc2b6d3c6cfe1bd3590cf0e10b06a05f17', // eth-wbtc
  '0xce9874c42dce7fffbe5e48b026ff1182733266cb', //eth-usdt
  '0x306121f1344ac5f84760998484c0176d7bfb7134', //usdc-usdt
  '0xd343d5dba2fba55eef58189619c05e33cab95ca1', //wbtc-usdt
  '0x9a56f30ff04884cb06da80cb3aef09c6132f5e77', //eth-sipher
  '0xe0ca51b6cfac04b215c3b6e473e3ec1412c93fc7', //usdc-und
  '0x38ff2ea1a930478f002af766e63774fc02f04fdf', //knc-und
  '0xa97642500517c728ce1339a466de0f10c19034cd', //eth-req
  '0x5ba740fcc020d5b9e39760cbd2fe236586b9dc0a', //eth-sand
]

const MATIC_TRESUARY_ADDRESS = '0x91c9D4373B077eF8082F468C7c97f2c499e36F5b'
const MATIC_LP_ADDRESSES = [
  '0x45963db838a070cf7be8e7046fd63e23d376c665', //matic-dai
  '0x37e6449b0e99befd2a708ea048d970f4ff4dc65d', //matic-knc
  '0x3904ac366d348636694cb6720aa1540e76441b1b', //usdc-usdt
  '0x7018c0bd73255c8966d0b26634e0bc0c7595d255', //usdc-dai
  '0x95d708e9ee04b0136b98579141624d19c89b9d68', //usdc-eth
  '0xd8b9e9444fcbf26bea4badd6142dd6a962bca86a', //knc-eth
  '0xecf185d8114664e42dae0701eaff1a50a3613a05', //usdt-vis
  '0x3f1f398887525d2d9acd154ec5e4a3979adffae6', //usdt-pgx
  '0xa4653d9614057daa5b3ec04a7289337e56746e8c', //pgx-vis
  '0xa1219dbe76eecbf7571fed6b020dd9154396b70e', //usdc-jeur
  '0xbb2d00675b775e0f8acd590e08da081b2a36d3a6', //usdc-jGBP
]
const REWARD_POOL_ADDRESS = '0xd2d0a0557e5b78e29542d440ec968f9253daa2e2'

const getTresuaryBalances = async (provider: ethers.providers.JsonRpcProvider) => {
  const contracts = LP_ADDRESSES.map((a: string) => new Contract(a, ERC20_ABI, provider))
  const balances: { id: string; balance: BigNumber }[] = await Promise.all(
    contracts.map((c: Contract) =>
      c.balanceOf(TRESUARY_ADDRESS).then((res: BigNumber) => {
        return { id: c.address, balance: res }
      }),
    ),
  )
  return balances
}

const getMaticTresuaryBalances = async (provider: ethers.providers.JsonRpcProvider) => {
  const contracts = MATIC_LP_ADDRESSES.map((a: string) => new Contract(a, ERC20_ABI, provider))
  const balances: { id: string; balance: BigNumber }[] = await Promise.all(
    contracts.map((c: Contract) =>
      c.balanceOf(MATIC_TRESUARY_ADDRESS).then((res: BigNumber) => {
        return { id: c.address, balance: res }
      }),
    ),
  )
  return balances
}

export default function useTotalVotingReward(): {
  usd: number
  knc: number
  kncPriceETH: number
} {
  const [totalVotingReward, setTotalVotingReward] = useState(0)
  const [kncPriceETH, setKncPriceETH] = useState(0)
  const { classicClient: classicClientMainnet, blockClient, provider } = useKyberswapConfig(ChainId.MAINNET)
  const { classicClient: classicClientMatic, provider: providerMatic } = useKyberswapConfig(ChainId.MATIC)

  const [localStoredTotalVotingReward, setLocalStoredTotalVotingReward] = useLocalStorage(
    'kyberdao-totalVotingRewards',
    0,
  )

  useEffect(() => {
    if (totalVotingReward) {
      setLocalStoredTotalVotingReward(totalVotingReward)
    }
  }, [totalVotingReward, setLocalStoredTotalVotingReward])

  useEffect(() => {
    const run = async () => {
      try {
        if (!provider || !providerMatic) return
        const rewards = await Promise.all([
          (async () => {
            const poolsQuery = classicClientMainnet.query({
              query: POOLS_BULK,
              variables: {
                allPools: LP_ADDRESSES,
              },
              fetchPolicy: 'network-only',
            })
            const balances = await getTresuaryBalances(provider)
            const pools = await poolsQuery
            const balancesNum = balances.map(result => {
              const pool = pools.data.pools.find((pool: any) => pool.id === result.id)
              return (
                (parseFloat(new Fraction(result.balance.toString(), 10 ** 18).toSignificant(18)) *
                  parseFloat(pool.reserveUSD)) /
                parseFloat(pool.totalSupply)
              )
            })
            return balancesNum.reduce((a: number, b: number) => a + b, 0)
          })(),
          (async () => {
            const poolsMaticQuery = classicClientMatic.query({
              query: POOLS_BULK,
              variables: {
                allPools: MATIC_LP_ADDRESSES,
              },
              fetchPolicy: 'network-only',
            })
            const balancesMatic = await getMaticTresuaryBalances(providerMatic)
            const poolsMatic = await poolsMaticQuery

            const balancesMaticNum = balancesMatic.map(result => {
              const pool = poolsMatic.data.pools.find((pool: any) => pool.id === result.id)
              return (
                (parseFloat(new Fraction(result.balance.toString(), 10 ** 18).toSignificant(18)) *
                  parseFloat(pool.reserveUSD)) /
                parseFloat(pool.totalSupply)
              )
            })
            return balancesMaticNum.reduce((a: number, b: number) => a + b, 0)
          })(),
          (async () => {
            const ethBalanceQuery = provider.getBalance(TRESUARY_ADDRESS)
            const ethPrice = await classicClientMainnet.query({
              query: ETH_PRICE,
              fetchPolicy: 'network-only',
            })
            const ethBalance = await ethBalanceQuery
            return (
              parseFloat(new Fraction(ethBalance.toString(), 10 ** 18).toSignificant(18)) *
              parseFloat(ethPrice.data.bundles[0].ethPrice)
            )
          })(),
          (async () => {
            const maticBalanceQuery = providerMatic.getBalance(MATIC_TRESUARY_ADDRESS)
            const maticPrice = await classicClientMatic.query({
              query: ETH_PRICE,
              fetchPolicy: 'network-only',
            })
            const maticBalance = await maticBalanceQuery
            return (
              parseFloat(new Fraction(maticBalance.toString(), 10 ** 18).toSignificant(18)) *
              parseFloat(maticPrice.data.bundles[0].ethPrice)
            )
          })(),
          (async () => {
            const KNCContract = new Contract(KNC_ADDRESS, ERC20_ABI, provider)
            const kncBalance = await KNCContract.balanceOf(REWARD_POOL_ADDRESS)
            return parseFloat(new Fraction(kncBalance.toString(), 10 ** 18).toSignificant(18))
          })(),
        ])
        setTotalVotingReward(rewards.reduce((a: number, b: number) => a + b, 0))
      } catch {
        setTotalVotingReward(0)
      }
    }
    run()
  }, [classicClientMainnet, classicClientMatic, provider, providerMatic])

  useEffect(() => {
    async function checkForKNCPrice() {
      const kncPriceByETH = await getKNCPriceByETH(ChainId.MAINNET, classicClientMainnet)
      const ethPrice = await getEthPrice(ChainId.MAINNET, classicClientMainnet, blockClient)
      const kncPrice = kncPriceByETH * ethPrice[0] || 0
      setKncPriceETH(kncPrice)
    }
    checkForKNCPrice()
  }, [classicClientMainnet, blockClient])

  return {
    usd: Math.floor(totalVotingReward || localStoredTotalVotingReward || 0),
    knc: useMemo(
      () =>
        kncPriceETH && kncPriceETH !== 0
          ? Math.floor((totalVotingReward || localStoredTotalVotingReward || 0) / kncPriceETH)
          : 0,
      [totalVotingReward, kncPriceETH, localStoredTotalVotingReward],
    ),
    kncPriceETH,
  }
}
