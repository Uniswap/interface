import { Pair as FewPair, computePairAddress, getFewTokenFromOriginalToken } from '@ring-protocol/few-v2-sdk'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { FEW_INIT_CODE_HASH_MAP, FEW_V2_FACTORY_ADDRESSES } from 'constants/misc'
import { PairState } from 'hooks/useV2Pairs'
import { useMemo } from 'react'
import { assume0xAddress } from 'utils/wagmi'
import { useReadContracts } from 'wagmi'

// use PairState from V2 hooks to keep type parity

function useFewV2Pairs(
  currencies: [Currency | undefined, Currency | undefined][],
  options?: { inputsAreFewTokens?: boolean },
): [PairState, FewPair | null][] {
  const chainId = currencies[0]?.[0]?.chainId
  // const tokens = useMemo(
  //   () => currencies.map(([currencyA, currencyB]) => [currencyA?.wrapped, currencyB?.wrapped]),
  //   [currencies],
  // )

  const fewTokens = useMemo(
    () =>
      currencies.map(([currencyA, currencyB]) => {
        const tokenA = currencyA?.wrapped
        const tokenB = currencyB?.wrapped
        const chainId = currencyA?.chainId ?? currencyB?.chainId

        if (!tokenA || !tokenB || !chainId) {
          return [undefined, undefined]
        }

        try {
          if (options?.inputsAreFewTokens) {
            return [tokenA, tokenB]
          }

          const fewTokenA = getFewTokenFromOriginalToken(tokenA, chainId)
          const fewTokenB = getFewTokenFromOriginalToken(tokenB, chainId)
          return [fewTokenA, fewTokenB]
        } catch {
          return [undefined, undefined]
        }
      }),
    [currencies, options?.inputsAreFewTokens],
  )

  // const pairAddresses = useMemo(
  //   () =>
  //     tokens.map(([tokenA, tokenB]) => {
  //       return tokenA &&
  //         tokenB &&
  //         tokenA.chainId === tokenB.chainId &&
  //         !tokenA.equals(tokenB) &&
  //         FEW_V2_FACTORY_ADDRESSES[tokenA.chainId]
  //         ? computePairAddress({
  //             initCodeHash: FEW_INIT_CODE_HASH_MAP[tokenA.chainId],
  //             factoryAddress: FEW_V2_FACTORY_ADDRESSES[tokenA.chainId],
  //             tokenA,
  //             tokenB,
  //           })
  //         : undefined
  //     }),
  //   [tokens],
  // )
  // console.log('pairAddresses', pairAddresses)

  const pairAddresses = useMemo(
    () =>
      fewTokens.map(([fewTokenA, fewTokenB]) => {
        return fewTokenA &&
          fewTokenB &&
          fewTokenA.chainId === fewTokenB.chainId &&
          !fewTokenA.equals(fewTokenB) &&
          FEW_V2_FACTORY_ADDRESSES[fewTokenA.chainId]
          ? computePairAddress({
              initCodeHash: FEW_INIT_CODE_HASH_MAP[fewTokenA.chainId],
              factoryAddress: FEW_V2_FACTORY_ADDRESSES[fewTokenA.chainId],
              tokenA: fewTokenA,
              tokenB: fewTokenB,
            })
          : undefined
      }),
    [fewTokens],
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
        const fewTokenA = fewTokens[i][0]
        const fewTokenB = fewTokens[i][1]

        // const tokenA = tokens[i][0]
        // const tokenB = tokens[i][1]

        if (!fewTokenA || !fewTokenB || fewTokenA.equals(fewTokenB)) {
          return [PairState.INVALID, null]
        }

        if (!result) {
          return [PairState.NOT_EXISTS, null]
        }

        const [reserve0, reserve1] = result
        const [token0, token1] = fewTokenA.sortsBefore(fewTokenB) ? [fewTokenA, fewTokenB] : [fewTokenB, fewTokenA]

        return [
          PairState.EXISTS,
          new FewPair(
            CurrencyAmount.fromRawAmount(token0, reserve0.toString()),
            CurrencyAmount.fromRawAmount(token1, reserve1.toString()),
          ),
        ]
      }) ?? []
    )
  }, [data, isLoading, pairAddresses.length, fewTokens])
}

export function useFewV2Pair(
  tokenA?: Currency,
  tokenB?: Currency,
  options?: { inputsAreFewTokens?: boolean },
): [PairState, FewPair | null] {
  const inputs: [[Currency | undefined, Currency | undefined]] = useMemo(() => [[tokenA, tokenB]], [tokenA, tokenB])
  return useFewV2Pairs(inputs, options)[0]
}
