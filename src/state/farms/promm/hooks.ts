import { useQuery } from '@apollo/client'
import { defaultAbiCoder } from '@ethersproject/abi'
import { getCreate2Address } from '@ethersproject/address'
import { keccak256 } from '@ethersproject/solidity'
import { ChainId, Token, TokenAmount } from '@kyberswap/ks-sdk-core'
import { FeeAmount, Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import { PROMM_JOINED_POSITION } from 'apollo/queries/promm'
import PROMM_POOL_ABI from 'constants/abis/v2/pool.json'
import { ZERO_ADDRESS } from 'constants/index'
import { CONTRACT_NOT_FOUND_MSG } from 'constants/messages'
import { NETWORKS_INFO } from 'constants/networks'
import { FARM_CONTRACTS, VERSION } from 'constants/v2'
import { providers, useActiveWeb3React } from 'hooks'
import { useAllTokens, useTokens } from 'hooks/Tokens'
import { useProAmmNFTPositionManagerContract, useProMMFarmContract, useProMMFarmContracts } from 'hooks/useContract'
import { usePools } from 'hooks/usePools'
import usePrevious from 'hooks/usePrevious'
import { AppState } from 'state'
import { useETHPrice, useTokensPrice } from 'state/application/hooks'
import { useAppDispatch } from 'state/hooks'
import { usePoolBlocks } from 'state/prommPools/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { PositionDetails } from 'types/position'
import { calculateGasMargin, getContractForReading, isAddressString } from 'utils'

import { setLoading, updatePrommFarms } from './actions'
import { ProMMFarm, ProMMFarmResponse } from './types'

export const useProMMFarms = () => {
  return useSelector((state: AppState) => state.prommFarms)
}

export const useGetProMMFarms = () => {
  const dispatch = useAppDispatch()
  const { chainId, account } = useActiveWeb3React()
  const prommFarmContracts = useProMMFarmContracts()
  const tokens = useAllTokens()

  // dont need all tokens on dependency
  const allTokensRef = useRef(tokens)
  allTokensRef.current = tokens

  const positionManager = useProAmmNFTPositionManagerContract()

  const prevChainId = usePrevious(chainId)
  const getProMMFarms = useCallback(async () => {
    const farmsAddress = FARM_CONTRACTS[chainId as ChainId]

    if (!farmsAddress) {
      dispatch(updatePrommFarms({}))
      return
    }
    dispatch(setLoading(true))

    if (prevChainId !== chainId) dispatch(updatePrommFarms({}))

    const promises = farmsAddress.map(async address => {
      const contract = prommFarmContracts?.[address]
      if (!contract || !chainId) return

      const [poolLength, userDepositedNFT, rewardLocker] = await Promise.all([
        contract.poolLength(),
        account ? await contract.getDepositedNFTs(account) : Promise.resolve([]),
        contract.rewardLocker(),
      ])

      const nftInfosFromContract = await Promise.all(
        userDepositedNFT.map((id: BigNumber) => positionManager?.positions(id)),
      )

      const nftInfos = nftInfosFromContract.map((result: any, index) => ({
        tokenId: userDepositedNFT[index],
        poolId: getCreate2Address(
          NETWORKS_INFO[chainId || ChainId.MAINNET].elastic.coreFactory,
          keccak256(
            ['bytes'],
            [
              defaultAbiCoder.encode(
                ['address', 'address', 'uint24'],
                [result.info.token0, result.info.token1, result.info.fee],
              ),
            ],
          ),
          NETWORKS_INFO[chainId || ChainId.MAINNET].elastic.initCodeHash,
        ),
        feeGrowthInsideLast: result.pos.feeGrowthInsideLast,
        nonce: result.pos.nonce,
        liquidity: result.pos.liquidity,
        operator: result.pos.operator,
        tickLower: result.pos.tickLower,
        tickUpper: result.pos.tickUpper,
        rTokenOwed: result.pos.rTokenOwed,
        fee: result.info.fee,
        token0: result.info.token0,
        token1: result.info.token1,
      }))

      const pids = [...Array(BigNumber.from(poolLength).toNumber()).keys()]

      const poolInfos: ProMMFarm[] = await Promise.all(
        pids.map(async pid => {
          const poolInfo: ProMMFarmResponse = await contract.getPoolInfo(pid)

          const userNFTForPool = nftInfos.filter(item => item.poolId === poolInfo.poolAddress)

          const userInfo = await Promise.all(
            userNFTForPool.map(item =>
              contract
                .getUserInfo(item.tokenId, pid)
                .then((res: any) => ({ ...res, pid, tokenId: item.tokenId }))
                .catch((e: any) => new Error(JSON.stringify(e))),
            ),
          )

          const userNFTInfo = userInfo
            // .filter(item => item.pid === pid)
            .map((item, index) => {
              return {
                ...userNFTForPool[index],
                stakedLiquidity: item instanceof Error ? BigNumber.from(0) : item.liquidity,
                rewardPendings: item instanceof Error ? [] : item.rewardPending,
              }
            })

          const poolContract = getContractForReading(poolInfo.poolAddress, PROMM_POOL_ABI, providers[chainId])

          const [token0, token1, feeTier, liquidityState, poolState] = await Promise.all([
            poolContract.token0(),
            poolContract.token1(),
            poolContract.swapFeeUnits(),
            poolContract.getLiquidityState(),
            poolContract.getPoolState(),
          ])

          return {
            ...poolInfo,
            token0,
            token1,
            feeTier,
            baseL: liquidityState.baseL,
            reinvestL: liquidityState.reinvestL,
            sqrtP: poolState.sqrtP,
            currentTick: poolState.currentTick,
            pid: pid,
            userDepositedNFTs: userNFTInfo,
            rewardLocker,
            token0Info: allTokensRef.current?.[token0],
            token1Info: allTokensRef.current?.[token1],
          }
        }),
      )

      return poolInfos
    })

    const farms = await Promise.all(promises)

    dispatch(
      updatePrommFarms(
        farmsAddress.reduce((acc, address, index) => {
          return {
            ...acc,
            [address]: farms[index],
          }
        }, {}),
      ),
    )
    dispatch(setLoading(false))
  }, [chainId, prevChainId, dispatch, prommFarmContracts, account, positionManager])

  return getProMMFarms
}

export const useProMMFarmsFetchOnlyOne = () => {
  const { data: farms } = useProMMFarms()
  const getProMMFarm = useGetProMMFarms()

  const firstRender = useRef(true)

  const { chainId } = useActiveWeb3React()
  const previousChainId = usePrevious(chainId)

  useEffect(() => {
    if ((!Object.keys(farms).length && firstRender.current) || chainId !== previousChainId) {
      getProMMFarm()
      firstRender.current = false
    }
  }, [previousChainId, farms, getProMMFarm, chainId])

  return farms
}

export const useFarmAction = (address: string) => {
  const addTransactionWithType = useTransactionAdder()
  const contract = useProMMFarmContract(address)
  const posManager = useProAmmNFTPositionManagerContract()

  const approve = useCallback(async () => {
    if (!posManager) {
      throw new Error(CONTRACT_NOT_FOUND_MSG)
    }
    const estimateGas = await posManager.estimateGas.setApprovalForAll(address, true)
    const tx = await posManager.setApprovalForAll(address, true, {
      gasLimit: calculateGasMargin(estimateGas),
    })
    addTransactionWithType(tx, { type: 'Approve', summary: `Elastic Farm` })

    return tx.hash
  }, [addTransactionWithType, address, posManager])

  // Deposit
  const deposit = useCallback(
    async (nftIds: BigNumber[]) => {
      if (!contract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }

      const estimateGas = await contract.estimateGas.deposit(nftIds)
      const tx = await contract.deposit(nftIds, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      addTransactionWithType(tx, { type: 'Deposit', summary: `liquidity` })

      return tx.hash
    },
    [addTransactionWithType, contract],
  )

  const withdraw = useCallback(
    async (nftIds: BigNumber[]) => {
      if (!contract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }

      const estimateGas = await contract.estimateGas.withdraw(nftIds)
      const tx = await contract.withdraw(nftIds, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      addTransactionWithType(tx, { type: 'Withdraw', summary: `liquidity` })

      return tx.hash
    },
    [addTransactionWithType, contract],
  )

  const stake = useCallback(
    async (pid: BigNumber, nftIds: BigNumber[], liqs: BigNumber[]) => {
      if (!contract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }

      const estimateGas = await contract.estimateGas.join(pid, nftIds, liqs)
      const tx = await contract.join(pid, nftIds, liqs, {
        gasLimit: calculateGasMargin(estimateGas),
      })
      addTransactionWithType(tx, { type: 'Stake', summary: `liquidity into farm` })

      return tx.hash
    },
    [addTransactionWithType, contract],
  )

  const unstake = useCallback(
    async (pid: BigNumber, nftIds: BigNumber[], liqs: BigNumber[]) => {
      if (!contract) {
        throw new Error(CONTRACT_NOT_FOUND_MSG)
      }
      try {
        const estimateGas = await contract.estimateGas.exit(pid, nftIds, liqs)
        const tx = await contract.exit(pid, nftIds, liqs, {
          gasLimit: calculateGasMargin(estimateGas),
        })
        addTransactionWithType(tx, { type: 'Unstake', summary: `liquidity from farm` })

        return tx.hash
      } catch (e) {
        console.log(e)
      }
    },
    [addTransactionWithType, contract],
  )

  const harvest = useCallback(
    async (nftIds: BigNumber[], poolIds: BigNumber[]) => {
      if (!contract) return

      const encodeData = poolIds.map(id => defaultAbiCoder.encode(['tupple(uint256[] pIds)'], [{ pIds: [id] }]))

      try {
        const estimateGas = await contract.estimateGas.harvestMultiplePools(nftIds, encodeData)
        const tx = await contract.harvestMultiplePools(nftIds, encodeData, {
          gasLimit: calculateGasMargin(estimateGas),
        })
        addTransactionWithType(tx, { type: 'Harvest' })
        return tx
      } catch (e) {
        console.log(e)
      }
    },
    [addTransactionWithType, contract],
  )

  return { deposit, withdraw, approve, stake, unstake, harvest }
}

export const usePostionFilter = (positions: PositionDetails[], validPools: string[]) => {
  const filterOptions = [
    {
      code: 'in_rage',
      value: t`In range`,
    },
    {
      code: 'out_range',
      value: t`Out of range`,
    },
    {
      code: 'all',
      value: t`All positions`,
    },
  ]

  const [activeFilter, setActiveFilter] = useState('all')

  const tokenList = useMemo(() => {
    if (!positions) return []
    return positions?.map(pos => [pos.token0, pos.token1]).flat()
  }, [positions])

  const tokens = useTokens(tokenList)

  const poolKeys = useMemo(() => {
    if (!tokens) return []
    return positions?.map(
      pos =>
        [tokens[pos.token0], tokens[pos.token1], pos.fee] as [
          Token | undefined,
          Token | undefined,
          FeeAmount | undefined,
        ],
    )
  }, [tokens, positions])

  const pools = usePools(poolKeys)

  const eligiblePositions = useMemo(() => {
    return positions
      ?.filter(pos => validPools?.includes(pos.poolId.toLowerCase()))
      .filter(pos => {
        // remove closed position
        if (pos.liquidity.eq(0)) return false

        const pool = pools.find(
          p =>
            p[1]?.token0.address.toLowerCase() === pos.token0.toLowerCase() &&
            p[1]?.token1.address.toLowerCase() === pos.token1.toLowerCase() &&
            p[1]?.fee === pos.fee,
        )

        if (activeFilter === 'out_range') {
          if (pool && pool[1]) {
            return pool[1].tickCurrent < pos.tickLower || pool[1].tickCurrent > pos.tickUpper
          }
          return true
        } else if (activeFilter === 'in_rage') {
          if (pool && pool[1]) {
            return pool[1].tickCurrent >= pos.tickLower && pool[1].tickCurrent <= pos.tickUpper
          }
          return true
        }
        return true
      })
  }, [positions, validPools, activeFilter, pools])

  return {
    activeFilter,
    setActiveFilter,
    eligiblePositions,
    filterOptions,
  }
}

type Response = {
  joinedPositions: {
    id: number
    pool: {
      liquidity: string
      reinvestL: string
      tick: number

      feeTier: number
      sqrtPrice: string
      token0: {
        id: string
        symbol: string
        name: string
        decimals: number
        derivedETH: string
      }
      token1: {
        id: string
        symbol: string
        name: string
        decimals: number
        derivedETH: string
      }
    }

    position: {
      tickLower: {
        tickIdx: number
      }
      tickUpper: {
        tickIdx: number
      }
      liquidity: number
    }
  }[]

  farmingPool: {
    id: string
    startTime: string
    endTime: string
    pool: {
      feesUSD: string
      totalValueLockedUSD: string
    }
    rewardTokens: {
      decimals: string
      id: string
      symbol: string
      name: string
    }[]
    totalRewardAmounts: string[]
  }
  farmingPools: {
    pool: {
      feesUSD: string
      totalValueLockedUSD: string
    }
  }[]
}

export const useProMMFarmTVL = (fairlaunchAddress: string, pid: number) => {
  const { chainId } = useActiveWeb3React()
  const dataClient = NETWORKS_INFO[chainId || ChainId.MAINNET].elasticClient
  const { block24 } = usePoolBlocks()

  const { data } = useQuery<Response>(PROMM_JOINED_POSITION(fairlaunchAddress.toLowerCase(), pid, block24), {
    client: dataClient,
    fetchPolicy: 'cache-first',
  })

  const rewardAddress = useMemo(
    () => data?.farmingPool?.rewardTokens.map(item => isAddressString(item.id)) || [],
    [data],
  )
  const rwTokenMap = useTokens(rewardAddress)

  const rwTokens = useMemo(() => Object.values(rwTokenMap), [rwTokenMap])

  const prices = useTokensPrice(rwTokens, VERSION.ELASTIC)

  const priceMap: { [key: string]: number } = useMemo(
    () =>
      prices?.reduce(
        (acc, cur, index) => ({
          ...acc,
          [rwTokens[index]?.isToken ? rwTokens[index].address : ZERO_ADDRESS]: cur,
        }),
        {},
      ),
    [prices, rwTokens],
  )

  const ethPriceUSD = useETHPrice(VERSION.ELASTIC)

  return useMemo(() => {
    let tvl = 0
    data?.joinedPositions.forEach(({ position, pool }) => {
      const token0 = new Token(chainId as ChainId, pool.token0.id, Number(pool.token0.decimals), pool.token0.symbol)
      const token1 = new Token(chainId as ChainId, pool.token1.id, Number(pool.token1.decimals), pool.token1.symbol)
      const poolObj = new Pool(
        token0,
        token1,
        Number(pool.feeTier),
        pool.sqrtPrice,
        pool.liquidity,
        pool.reinvestL,
        Number(pool.tick),
      )

      const pos = new Position({
        pool: poolObj,
        liquidity: position.liquidity,
        tickLower: Number(position.tickLower.tickIdx),
        tickUpper: Number(position.tickUpper.tickIdx),
      })

      tvl += Number(pos.amount0.toExact()) * Number(pool.token0.derivedETH) * Number(ethPriceUSD.currentPrice)
      tvl += Number(pos.amount1.toExact()) * Number(pool.token1.derivedETH) * Number(ethPriceUSD.currentPrice)
    })

    const poolAPY =
      Number(data?.farmingPool?.pool?.totalValueLockedUSD || 0) !== 0
        ? ((Number(data?.farmingPool?.pool.feesUSD || 0) - Number(data?.farmingPools?.[0]?.pool?.feesUSD || 0)) *
            365 *
            100) /
          Number(data?.farmingPool.pool.totalValueLockedUSD)
        : 0
    const totalRewardValue = data?.farmingPool?.rewardTokens.reduce((acc, token, index) => {
      const t = TokenAmount.fromRawAmount(
        new Token(chainId as ChainId, token.id, Number(token.decimals)),
        data?.farmingPool.totalRewardAmounts[index],
      )
      return acc + Number(t.toExact()) * priceMap[isAddressString(token.id)]
    }, 0)

    const farmDuration = (Number(data?.farmingPool?.endTime || 0) - Number(data?.farmingPool?.startTime || 0)) / 86400

    const farmAPR =
      Number(data?.farmingPool?.pool?.totalValueLockedUSD || 0) !== 0 && farmDuration !== 0
        ? (365 * 100 * (totalRewardValue || 0)) /
          farmDuration /
          Number(data?.farmingPool?.pool?.totalValueLockedUSD || 1)
        : 0

    return { tvl, farmAPR, poolAPY }
  }, [chainId, data, ethPriceUSD.currentPrice, priceMap])
}
