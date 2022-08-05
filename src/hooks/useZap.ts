import { BigNumber } from '@ethersproject/bignumber'
import { useCallback, useEffect, useState } from 'react'

import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useZapContract } from 'hooks/useContract'

const useZap = (isStaticFeeContract: boolean, isOldStaticFeeContract: boolean) => {
  const zapContract = useZapContract(isStaticFeeContract, isOldStaticFeeContract)
  const { chainId } = useActiveWeb3React()
  const calculateZapInAmounts = useCallback(
    async (tokenIn: string, tokenOut: string, pool: string, userIn: BigNumber) => {
      try {
        const result =
          isStaticFeeContract && !isOldStaticFeeContract
            ? await zapContract?.calculateZapInAmounts(
                chainId && NETWORKS_INFO[chainId].classic.static.factory,
                tokenIn,
                tokenOut,
                pool,
                userIn,
              )
            : await zapContract?.calculateZapInAmounts(tokenIn, tokenOut, pool, userIn)

        return result
      } catch (err) {
        console.error(err)
        throw err
      }
    },
    [zapContract, chainId, isStaticFeeContract, isOldStaticFeeContract],
  )

  const calculateZapOutAmount = useCallback(
    async (tokenIn: string, tokenOut: string, pool: string, lpQty: BigNumber) => {
      try {
        const result =
          isStaticFeeContract && !isOldStaticFeeContract
            ? await zapContract?.calculateZapOutAmount(
                chainId && NETWORKS_INFO[chainId].classic.static.factory,
                tokenIn,
                tokenOut,
                pool,
                lpQty,
              )
            : await zapContract?.calculateZapOutAmount(tokenIn, tokenOut, pool, lpQty)

        return result
      } catch (err) {
        console.error(err)
        throw err
      }
    },
    [zapContract, chainId, isStaticFeeContract, isOldStaticFeeContract],
  )

  return {
    zapContract,
    calculateZapInAmounts,
    calculateZapOutAmount,
  }
}

export const useZapInAmounts = (
  isStaticFeeContract: boolean,
  isOldStaticFeeContract: boolean,
  tokenIn?: string,
  tokenOut?: string,
  pool?: string,
  userIn?: BigNumber,
) => {
  const { calculateZapInAmounts } = useZap(isStaticFeeContract, isOldStaticFeeContract)
  const [result, setResult] = useState<{
    amounts: {
      tokenInAmount: BigNumber
      tokenOutAmount: BigNumber
    }
    error?: Error
  }>({
    amounts: {
      tokenInAmount: BigNumber.from(0),
      tokenOutAmount: BigNumber.from(0),
    },
    error: undefined,
  })

  useEffect(() => {
    async function handleCalculateZapInAmounts() {
      if (!userIn) {
        setResult({
          amounts: {
            tokenInAmount: BigNumber.from(0),
            tokenOutAmount: BigNumber.from(0),
          },
          error: undefined,
        })

        return
      }

      try {
        if (tokenIn && tokenOut && pool && userIn?.gt(0)) {
          const amounts = await calculateZapInAmounts(tokenIn, tokenOut, pool, userIn)

          setResult({
            amounts,
            error: undefined,
          })
        }
      } catch (err) {
        setResult({
          amounts: {
            tokenInAmount: BigNumber.from(0),
            tokenOutAmount: BigNumber.from(0),
          },
          error: err as Error,
        })
      }
    }

    handleCalculateZapInAmounts()
  }, [calculateZapInAmounts, pool, tokenIn, tokenOut, userIn])

  return result
}

export const useZapOutAmount = (
  isStaticFeeContract: boolean,
  isOldStaticFeeContract: boolean,
  tokenIn?: string,
  tokenOut?: string,
  pool?: string,
  lpQty?: BigNumber,
) => {
  const { calculateZapOutAmount } = useZap(isStaticFeeContract, isOldStaticFeeContract)
  const [result, setResult] = useState<{ amount: BigNumber; error?: any }>({
    amount: BigNumber.from(0),
    error: undefined,
  })

  useEffect(() => {
    async function handleCalculateZapOutAmount() {
      if (!lpQty || lpQty.eq(0)) {
        setResult({
          amount: BigNumber.from(0),
          error: undefined,
        })

        return
      }

      try {
        if (tokenIn && tokenOut && pool && lpQty?.gt(0)) {
          const amount = await calculateZapOutAmount(tokenIn, tokenOut, pool, lpQty)
          setResult({
            amount,
            error: undefined,
          })
        }
      } catch (err) {
        setResult({
          amount: BigNumber.from(0),
          error: err as Error,
        })
      }
    }

    handleCalculateZapOutAmount()
  }, [calculateZapOutAmount, tokenIn, tokenOut, pool, lpQty])

  return result
}

export default useZap
