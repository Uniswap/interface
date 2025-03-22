import { BigNumber } from '@ethersproject/bignumber'
import { NONFUNGIBLE_POSITION_MANAGER_ADDRESSES } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import { useMemo } from 'react'
import { PositionDetails } from 'types/position'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { assume0xAddress } from 'utils/wagmi'
import { Address, erc721Abi } from 'viem'
import { useReadContract, useReadContracts } from 'wagmi'

const positionManagerAbi = [
  ...erc721Abi,
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'positions',
    outputs: [
      {
        internalType: 'uint96',
        name: 'nonce',
        type: 'uint96',
      },
      {
        internalType: 'address',
        name: 'operator',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'token0',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'token1',
        type: 'address',
      },
      {
        internalType: 'uint24',
        name: 'fee',
        type: 'uint24',
      },
      {
        internalType: 'int24',
        name: 'tickLower',
        type: 'int24',
      },
      {
        internalType: 'int24',
        name: 'tickUpper',
        type: 'int24',
      },
      {
        internalType: 'uint128',
        name: 'liquidity',
        type: 'uint128',
      },
      {
        internalType: 'uint256',
        name: 'feeGrowthInside0LastX128',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'feeGrowthInside1LastX128',
        type: 'uint256',
      },
      {
        internalType: 'uint128',
        name: 'tokensOwed0',
        type: 'uint128',
      },
      {
        internalType: 'uint128',
        name: 'tokensOwed1',
        type: 'uint128',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'index',
        type: 'uint256',
      },
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

interface UseV3PositionsResults {
  loading: boolean
  positions?: PositionDetails[]
}

function useV3PositionsFromTokenIds(tokenIds: BigNumber[] | undefined): UseV3PositionsResults {
  const { chainId } = useAccount()
  const address = assume0xAddress(NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId ?? UniverseChainId.Mainnet])

  const {
    data: positionDataRaw,
    isLoading,
    error,
  } = useReadContracts({
    contracts: useMemo(() => {
      if (!tokenIds || !address) {
        return []
      }
      return tokenIds.map(
        (tokenId) =>
          ({ address, abi: positionManagerAbi, functionName: 'positions', args: [tokenId.toBigInt()] }) as const,
      )
    }, [address, tokenIds]),
    query: { enabled: Boolean(address && tokenIds) },
  })

  const positions = useMemo(() => {
    if (positionDataRaw && !isLoading && !error && tokenIds) {
      const list: PositionDetails[] = []
      for (const [index, data] of positionDataRaw.entries()) {
        const tokenId = tokenIds[index]

        if (!data.result) {
          continue
        }

        const [
          nonce,
          operator,
          token0,
          token1,
          fee,
          tickLower,
          tickUpper,
          liquidity,
          feeGrowthInside0LastX128,
          feeGrowthInside1LastX128,
          tokensOwed0,
          tokensOwed1,
        ] = data.result

        list.push({
          tokenId,
          fee,
          feeGrowthInside0LastX128: BigNumber.from(feeGrowthInside0LastX128),
          feeGrowthInside1LastX128: BigNumber.from(feeGrowthInside1LastX128),
          liquidity: BigNumber.from(liquidity),
          nonce: BigNumber.from(nonce),
          operator,
          tickLower,
          tickUpper,
          token0,
          token1,
          tokensOwed0: BigNumber.from(tokensOwed0),
          tokensOwed1: BigNumber.from(tokensOwed1),
        })
      }
      return list
    }
    return undefined
  }, [positionDataRaw, isLoading, error, tokenIds])

  return { loading: isLoading, positions }
}

interface UseV3PositionResults {
  loading: boolean
  position?: PositionDetails
}

export function useV3PositionFromTokenId(tokenId: BigNumber | undefined): UseV3PositionResults {
  const position = useV3PositionsFromTokenIds(tokenId ? [tokenId] : undefined)
  return {
    loading: position.loading,
    position: position.positions?.[0],
  }
}

export function useV3Positions(account: Address | undefined): UseV3PositionsResults {
  const { chainId } = useAccount()

  const { data: accountBalance, isLoading: balanceLoading } = useReadContract({
    address: assume0xAddress(NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId ?? UniverseChainId.Mainnet]),
    abi: positionManagerAbi,
    functionName: 'balanceOf',
    args: account ? [assume0xAddress(account)] : undefined,
    query: { enabled: !!account },
  })

  const address = assume0xAddress(NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId ?? UniverseChainId.Mainnet])

  const { data: tokenIdsRaw, isLoading: tokenIdsLoading } = useReadContracts({
    contracts: useMemo(() => {
      if (!address || !accountBalance) {
        return []
      }
      return Array.from(
        { length: Number(accountBalance) ?? 0 },
        (_, index) =>
          ({
            address,
            chainId,
            abi: positionManagerAbi,
            functionName: 'tokenOfOwnerByIndex',
            args: [account, index],
          }) as const,
      )
    }, [address, accountBalance, chainId, account]),
    query: { enabled: Boolean(account && address) },
  })

  const tokenIds = useMemo(
    () => tokenIdsRaw?.flatMap(({ result }) => (result ? BigNumber.from(result) : [])) ?? [],
    [tokenIdsRaw],
  )

  const { positions, loading: positionsLoading } = useV3PositionsFromTokenIds(tokenIds)

  return { loading: tokenIdsLoading || balanceLoading || positionsLoading, positions }
}
