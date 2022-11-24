import { BigNumber } from '@ethersproject/bignumber'
import { useCallback, useEffect, useState } from 'react'

import { EVMNetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'
import { useZapContract } from 'hooks/useContract'

const useZap = (isStaticFeeContract: boolean, isOldStaticFeeContract: boolean) => {
  const zapContract = useZapContract(isStaticFeeContract, isOldStaticFeeContract)
  const { isEVM, networkInfo } = useActiveWeb3React()
  const calculateZapInAmounts = useCallback(
    async (tokenIn: string, tokenOut: string, pool: string, userIn: BigNumber) => {
      if (!isEVM) return
      try {
        const result =
          isStaticFeeContract && !isOldStaticFeeContract
            ? await zapContract?.calculateZapInAmounts(
                (networkInfo as EVMNetworkInfo).classic.static.factory,
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
    [zapContract, isEVM, networkInfo, isStaticFeeContract, isOldStaticFeeContract],
  )

  const calculateZapOutAmount = useCallback(
    async (tokenIn: string, tokenOut: string, pool: string, lpQty: BigNumber) => {
      if (!isEVM) return
      try {
        const result =
          isStaticFeeContract && !isOldStaticFeeContract
            ? await zapContract?.calculateZapOutAmount(
                (networkInfo as EVMNetworkInfo).classic.static.factory,
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
    [zapContract, isEVM, networkInfo, isStaticFeeContract, isOldStaticFeeContract],
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
