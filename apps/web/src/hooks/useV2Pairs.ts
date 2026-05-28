import { Currency, CurrencyAmount, V2_FACTORY_ADDRESSES } from '@uniswap/sdk-core'
import { Pair, computePairAddress } from '@uniswap/v2-sdk'
import { useMemo } from 'react'
import { assume0xAddress } from 'utils/wagmi'
import { useReadContracts } from 'wagmi'

export enum PairState {
  LOADING = 0,
  NOT_EXISTS = 1,
  EXISTS = 2,
  INVALID = 3,
}

export function useV2Pairs(currencies: [Currency | undefined, Currency | undefined][]): [PairState, Pair | null][] {
  const chainId = currencies[0]?.[0]?.chainId
  const tokens = useMemo(
    () => currencies.map(([currencyA, currencyB]) => [currencyA?.wrapped, currencyB?.wrapped]),
    [currencies],
  )

  const pairAddresses = useMemo(
    () =>
      tokens.map(([tokenA, tokenB]) => {
        return tokenA &&
          tokenB &&
          tokenA.chainId === tokenB.chainId &&
          !tokenA.equals(tokenB) &&
          V2_FACTORY_ADDRESSES[tokenA.chainId]
          ? computePairAddress({ factoryAddress: V2_FACTORY_ADDRESSES[tokenA.chainId], tokenA, tokenB })
          : undefined
      }),
    [tokens],
  )

  const { data, isLoading } = useReadContracts({
    contracts: useMemo(() => {
      return pairAddresses.map(
        (pairAddress) =>
          ({
            address: assume0xAddress(pairAddress) ?? '0x', // Edge case: if an address is undefined, we pass in a blank address to keep the result array the same length as pairAddresses
            abi: [
              {
                constant: true,
                inputs: [],
                name: 'getReserves',
                outputs: [
                  {
                    internalType: 'uint112',
                    name: 'reserve0',
                    type: 'uint112',
                  },
                  {
                    internalType: 'uint112',
                    name: 'reserve1',
                    type: 'uint112',
                  },
                  {
                    internalType: 'uint32',
                    name: 'blockTimestampLast',
                    type: 'uint32',
                  },
                ],
                payable: false,
                stateMutability: 'view',
                type: 'function',
              },
            ],
            functionName: 'getReserves',
            chainId,
          }) as const,
      )
    }, [pairAddresses, chainId]),
  })

  return useMemo(() => {
    if (isLoading) {
      return Array.from({ length: pairAddresses.length }, () => [PairState.LOADING, null])
    }

    return (
      data?.map(({ result }, i) => {
        const tokenA = tokens[i][0]
        const tokenB = tokens[i][1]

        if (!tokenA || !tokenB || tokenA.equals(tokenB)) {
          return [PairState.INVALID, null]
        }

        if (!result) {
          return [PairState.NOT_EXISTS, null]
        }

        const [reserve0, reserve1] = result
        const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]

        return [
          PairState.EXISTS,
          new Pair(
            CurrencyAmount.fromRawAmount(token0, reserve0.toString()),
            CurrencyAmount.fromRawAmount(token1, reserve1.toString()),
          ),
        ]
      }) ?? []
    )
  }, [data, isLoading, pairAddresses.length, tokens])
}

export function useV2Pair(tokenA?: Currency, tokenB?: Currency): [PairState, Pair | null] {
  const inputs: [[Currency | undefined, Currency | undefined]] = useMemo(() => [[tokenA, tokenB]], [tokenA, tokenB])
  return useV2Pairs(inputs)[0]
}
