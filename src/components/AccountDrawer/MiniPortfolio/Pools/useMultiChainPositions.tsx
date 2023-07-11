import { ChainId, CurrencyAmount, Token, V3_CORE_FACTORY_ADDRESSES } from '@thinkincoin-libs/sdk-core'
import IUniswapV3PoolStateJSON from '@uniswap/v3-core/artifacts/contracts/interfaces/pool/IUniswapV3PoolState.sol/IUniswapV3PoolState.json'
import { computePoolAddress, Pool, Position } from '@thinkincoin-libs/uniswap-v3-sdk'
import { DEFAULT_ERC20_DECIMALS } from 'constants/tokens'
import { BigNumber } from 'ethers/lib/ethers'
import { Interface } from 'ethers/lib/utils'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PositionDetails } from 'types/position'
import { NonfungiblePositionManager, UniswapInterfaceMulticall } from 'types/v3'
import { UniswapV3PoolInterface } from 'types/v3/UniswapV3Pool'
import { currencyKey } from 'utils/currencyKey'

import { PositionInfo, useCachedPositions, useGetCachedTokens, usePoolAddressCache } from './cache'
import { Call, DEFAULT_GAS_LIMIT } from './getTokensAsync'
import { useInterfaceMulticallContracts, usePoolPriceMap, useV3ManagerContracts } from './hooks'

function createPositionInfo(
  owner: string,
  chainId: ChainId,
  details: PositionDetails,
  slot0: any,
  tokenA: Token,
  tokenB: Token
): PositionInfo {
  /* Instantiates a Pool with a hardcoded 0 liqudity value since the sdk only uses this value for swap state and this avoids an RPC fetch */
  const pool = new Pool(tokenA, tokenB, details.fee, slot0.sqrtPriceX96.toString(), 0, slot0.tick)
  const position = new Position({
    pool,
    liquidity: details.liquidity.toString(),
    tickLower: details.tickLower,
    tickUpper: details.tickUpper,
  })
  const inRange = slot0.tick >= details.tickLower && slot0.tick < details.tickUpper
  const closed = details.liquidity.eq(0)
  return { owner, chainId, pool, position, details, inRange, closed }
}

type FeeAmounts = [BigNumber, BigNumber]

const MAX_UINT128 = BigNumber.from(2).pow(128).sub(1)

const DEFAULT_CHAINS = [
  ChainId.MAINNET,
  ChainId.ARBITRUM_ONE,
  ChainId.OPTIMISM,
  ChainId.POLYGON,
  ChainId.CELO,
  ChainId.BNB,
  ChainId.AVALANCHE,
]

type UseMultiChainPositionsData = { positions?: PositionInfo[]; loading: boolean }

/**
 * Returns all positions for a given account on multiple chains.
 *
 * This hook doesn't use the redux-multicall library to avoid having to manually fetching blocknumbers for each chain.
 *
 * @param account - account to fetch positions for
 * @param chains - chains to fetch positions from
 * @returns positions, fees
 */
export default function useMultiChainPositions(account: string, chains = DEFAULT_CHAINS): UseMultiChainPositionsData {
  const pms = useV3ManagerContracts(chains)
  const multicalls = useInterfaceMulticallContracts(chains)

  const getTokens = useGetCachedTokens(chains)
  const poolAddressCache = usePoolAddressCache()

  const [cachedPositions, setPositions] = useCachedPositions(account)
  const positions = cachedPositions?.result
  const positionsFetching = useRef(false)
  const positionsLoading = !cachedPositions?.result && positionsFetching.current

  const [feeMap, setFeeMap] = useState<{ [key: string]: FeeAmounts }>({})

  const { priceMap, pricesLoading } = usePoolPriceMap(positions)

  const fetchPositionFees = useCallback(
    async (pm: NonfungiblePositionManager, positionIds: BigNumber[], chainId: number) => {
      const callData = positionIds.map((id) =>
        pm.interface.encodeFunctionData('collect', [
          { tokenId: id, recipient: account, amount0Max: MAX_UINT128, amount1Max: MAX_UINT128 },
        ])
      )
      const fees = (await pm.callStatic.multicall(callData)).reduce((acc, feeBytes, index) => {
        const key = chainId.toString() + positionIds[index]
        acc[key] = pm.interface.decodeFunctionResult('collect', feeBytes) as FeeAmounts
        return acc
      }, {} as { [key: string]: FeeAmounts })

      setFeeMap((prev) => ({ ...prev, ...fees }))
    },
    [account]
  )

  const fetchPositionIds = useCallback(
    async (pm: NonfungiblePositionManager, balance: BigNumber) => {
      const callData = Array.from({ length: balance.toNumber() }, (_, i) =>
        pm.interface.encodeFunctionData('tokenOfOwnerByIndex', [account, i])
      )
      return (await pm.callStatic.multicall(callData)).map((idByte) => BigNumber.from(idByte))
    },
    [account]
  )

  const fetchPositionDetails = useCallback(async (pm: NonfungiblePositionManager, positionIds: BigNumber[]) => {
    const callData = positionIds.map((id) => pm.interface.encodeFunctionData('positions', [id]))
    return (await pm.callStatic.multicall(callData)).map(
      (positionBytes, index) =>
        ({
          ...pm.interface.decodeFunctionResult('positions', positionBytes),
          tokenId: positionIds[index],
        } as unknown as PositionDetails)
    )
  }, [])

  // Combines PositionDetails with Pool data to build our return type
  const fetchPositionInfo = useCallback(
    async (positionDetails: PositionDetails[], chainId: ChainId, multicall: UniswapInterfaceMulticall) => {
      const poolInterface = new Interface(IUniswapV3PoolStateJSON.abi) as UniswapV3PoolInterface
      const tokens = await getTokens(
        positionDetails.flatMap((details) => [details.token0, details.token1]),
        chainId
      )

      const calls: Call[] = []
      const poolPairs: [Token, Token][] = []
      positionDetails.forEach((details) => {
        const tokenA = tokens[details.token0] ?? new Token(chainId, details.token0, DEFAULT_ERC20_DECIMALS)
        const tokenB = tokens[details.token1] ?? new Token(chainId, details.token1, DEFAULT_ERC20_DECIMALS)

        let poolAddress = poolAddressCache.get(details, chainId)
        if (!poolAddress) {
          const factoryAddress = V3_CORE_FACTORY_ADDRESSES[chainId]
          poolAddress = computePoolAddress({ factoryAddress, tokenA, tokenB, fee: details.fee })
          poolAddressCache.set(details, chainId, poolAddress)
        }
        poolPairs.push([tokenA, tokenB])
        calls.push({
          target: poolAddress,
          callData: poolInterface.encodeFunctionData('slot0'),
          gasLimit: DEFAULT_GAS_LIMIT,
        })
      }, [])

      return (await multicall.callStatic.multicall(calls)).returnData.reduce((acc: PositionInfo[], result, i) => {
        if (result.success) {
          const slot0 = poolInterface.decodeFunctionResult('slot0', result.returnData)
          acc.push(createPositionInfo(account, chainId, positionDetails[i], slot0, ...poolPairs[i]))
        } else {
          console.debug('slot0 fetch errored', result)
        }
        return acc
      }, [])
    },
    [account, poolAddressCache, getTokens]
  )

  const fetchPositionsForChain = useCallback(
    async (chainId: ChainId): Promise<PositionInfo[]> => {
      try {
        const pm = pms[chainId]
        const multicall = multicalls[chainId]
        const balance = await pm?.balanceOf(account)
        if (!pm || !multicall || balance.lt(1)) return []

        const positionIds = await fetchPositionIds(pm, balance)
        // Fetches fees in the background and stores them separetely from the results of this function
        fetchPositionFees(pm, positionIds, chainId)

        const postionDetails = await fetchPositionDetails(pm, positionIds)
        return fetchPositionInfo(postionDetails, chainId, multicall)
      } catch (error) {
        console.error(`Failed to fetch positions for chain ${chainId}`, error)
        return []
      }
    },
    [account, fetchPositionDetails, fetchPositionFees, fetchPositionIds, fetchPositionInfo, pms, multicalls]
  )

  const fetchAllPositions = useCallback(async () => {
    positionsFetching.current = true
    const positions = (await Promise.all(chains.map(fetchPositionsForChain))).flat()
    positionsFetching.current = false
    setPositions(positions)
  }, [chains, fetchPositionsForChain, setPositions])

  // Fetches positions when existing positions are stale and the document has focus
  useEffect(() => {
    if (positionsFetching.current || cachedPositions?.stale === false) return
    else if (document.hasFocus()) {
      fetchAllPositions()
    } else {
      // Avoids refetching positions until the user returns to Interface to avoid polling unnused rpc data
      const onFocus = () => {
        fetchAllPositions()
        window.removeEventListener('focus', onFocus)
      }
      window.addEventListener('focus', onFocus)
      return () => {
        window.removeEventListener('focus', onFocus)
      }
    }
    return
  }, [fetchAllPositions, positionsFetching, cachedPositions?.stale])

  const positionsWithFeesAndPrices: PositionInfo[] | undefined = useMemo(
    () =>
      positions?.map((position) => {
        const key = position.chainId.toString() + position.details.tokenId
        const fees = feeMap[key]
          ? [
              // We parse away from SDK/ethers types so fees can be multiplied by primitive number prices
              parseFloat(CurrencyAmount.fromRawAmount(position.pool.token0, feeMap[key]?.[0].toString()).toExact()),
              parseFloat(CurrencyAmount.fromRawAmount(position.pool.token1, feeMap[key]?.[1].toString()).toExact()),
            ]
          : undefined
        const prices = [priceMap[currencyKey(position.pool.token0)], priceMap[currencyKey(position.pool.token1)]]
        return { ...position, fees, prices } as PositionInfo
      }),
    [feeMap, positions, priceMap]
  )

  return { positions: positionsWithFeesAndPrices, loading: pricesLoading || positionsLoading }
}
