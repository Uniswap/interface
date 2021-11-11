import { useCallback, useEffect, useState } from 'react'
import { BigNumber } from '@ethersproject/bignumber'
import { useZapContract } from 'hooks/useContract'

const useZap = () => {
  const zapContract = useZapContract()

  const calculateZapInAmounts = useCallback(
    async (tokenIn: string, tokenOut: string, pool: string, userIn: BigNumber) => {
      try {
        const result = await zapContract?.calculateZapInAmounts(tokenIn, tokenOut, pool, userIn)

        return result
      } catch (err) {
        console.error(err)
        throw err
      }
    },
    [zapContract]
  )

  const calculateZapOutAmount = useCallback(
    async (tokenIn: string, tokenOut: string, pool: string, lpQty: BigNumber) => {
      try {
        const result = await zapContract?.calculateZapOutAmount(tokenIn, tokenOut, pool, lpQty)

        return result
      } catch (err) {
        console.error(err)
        throw err
      }
    },
    [zapContract]
  )

  return {
    zapContract,
    calculateZapInAmounts,
    calculateZapOutAmount
  }
}

export const useZapInAmounts = (tokenIn?: string, tokenOut?: string, pool?: string, userIn?: BigNumber) => {
  const { calculateZapInAmounts } = useZap()
  const [result, setResult] = useState<{
    amounts: {
      tokenInAmount: BigNumber
      tokenOutAmount: BigNumber
    }
    error?: Error
  }>({
    amounts: {
      tokenInAmount: BigNumber.from(0),
      tokenOutAmount: BigNumber.from(0)
    },
    error: undefined
  })

  useEffect(() => {
    async function handleCalculateZapInAmounts() {
      if (!userIn) {
        setResult({
          amounts: {
            tokenInAmount: BigNumber.from(0),
            tokenOutAmount: BigNumber.from(0)
          },
          error: undefined
        })

        return
      }

      try {
        if (tokenIn && tokenOut && pool && userIn?.gt(0)) {
          const amounts = await calculateZapInAmounts(tokenIn, tokenOut, pool, userIn)

          setResult({
            amounts,
            error: undefined
          })
        }
      } catch (err) {
        setResult({
          amounts: {
            tokenInAmount: BigNumber.from(0),
            tokenOutAmount: BigNumber.from(0)
          },
          error: err as Error
        })
      }
    }

    handleCalculateZapInAmounts()
  }, [calculateZapInAmounts, pool, tokenIn, tokenOut, userIn])

  return result
}

export const useZapOutAmount = (tokenIn?: string, tokenOut?: string, pool?: string, lpQty?: BigNumber) => {
  const { calculateZapOutAmount } = useZap()
  const [result, setResult] = useState<{ amount: BigNumber; error?: Error }>({
    amount: BigNumber.from(0),
    error: undefined
  })

  useEffect(() => {
    async function handleCalculateZapOutAmount() {
      if (!lpQty || lpQty.eq(0)) {
        setResult({
          amount: BigNumber.from(0),
          error: undefined
        })

        return
      }

      try {
        if (tokenIn && tokenOut && pool && lpQty?.gt(0)) {
          const amount = await calculateZapOutAmount(tokenIn, tokenOut, pool, lpQty)
          setResult({
            amount,
            error: undefined
          })
        }
      } catch (err) {
        setResult({
          amount: BigNumber.from(0),
          error: err as Error
        })
      }
    }

    handleCalculateZapOutAmount()
  }, [calculateZapOutAmount, tokenIn, tokenOut, pool, lpQty])

  return result
}

export default useZap
