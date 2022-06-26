import { useCallback, useEffect, useState } from 'react'
import { BigNumber } from '@ethersproject/bignumber'
import { useZapContract } from 'hooks/useContract'
import { useActiveWeb3React } from 'hooks'
import { STATIC_FEE_FACTORY_ADDRESSES } from 'constants/index'

const useZap = (isStaticFeeContract: boolean) => {
  const zapContract = useZapContract(isStaticFeeContract)
  const { chainId } = useActiveWeb3React()
  const calculateZapInAmounts = useCallback(
    async (tokenIn: string, tokenOut: string, pool: string, userIn: BigNumber) => {
      try {
        const result = isStaticFeeContract
          ? await zapContract?.calculateZapInAmounts(
              chainId && STATIC_FEE_FACTORY_ADDRESSES[chainId],
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
    [zapContract, chainId, isStaticFeeContract],
  )

  const calculateZapOutAmount = useCallback(
    async (tokenIn: string, tokenOut: string, pool: string, lpQty: BigNumber) => {
      try {
        const result = isStaticFeeContract
          ? await zapContract?.calculateZapOutAmount(
              chainId && STATIC_FEE_FACTORY_ADDRESSES[chainId],
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
    [zapContract, chainId, isStaticFeeContract],
  )

  return {
    zapContract,
    calculateZapInAmounts,
    calculateZapOutAmount,
  }
}

export const useZapInAmounts = (
  isStaticFeeContract: boolean,
  tokenIn?: string,
  tokenOut?: string,
  pool?: string,
  userIn?: BigNumber,
) => {
  const { calculateZapInAmounts } = useZap(isStaticFeeContract)
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
  tokenIn?: string,
  tokenOut?: string,
  pool?: string,
  lpQty?: BigNumber,
) => {
  const { calculateZapOutAmount } = useZap(isStaticFeeContract)
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
