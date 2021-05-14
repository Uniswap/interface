import { Trade } from 'dxswap-sdk'
import { BigNumber } from 'ethers'
import { useCallback, useEffect, useState } from 'react'
import { useActiveWeb3React } from '.'
import { INITIAL_ALLOWED_SLIPPAGE } from '../constants'
import { useBlockNumber } from '../state/application/hooks'
import { Field } from '../state/swap/actions'
import { tryParseAmount, useSwapState } from '../state/swap/hooks'
import { useUserPreferredGasPrice } from '../state/user/hooks'
import { useCurrencyBalance } from '../state/wallet/hooks'
import { calculateGasMargin } from '../utils'
import isZero from '../utils/isZero'
import { useCurrency } from './Tokens'
import useENS from './useENS'
import { useSwapsCallArguments } from './useSwapCallback'

export function useSwapsGasEstimations(
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE,
  recipientAddressOrName: string | null,
  trades?: (Trade | undefined)[]
): { loading: boolean; estimations: (BigNumber | null)[][] } {
  const blockNumber = useBlockNumber() // used to force updates at each block
  const { account, library, chainId } = useActiveWeb3React()
  const platformSwapCalls = useSwapsCallArguments(trades, allowedSlippage, recipientAddressOrName)
  const [preferredGasPrice] = useUserPreferredGasPrice()

  const {
    independentField,
    typedValue,
    INPUT: { currencyId: inputCurrencyId },
    OUTPUT: { currencyId: outputCurrencyId }
  } = useSwapState()
  const isExactIn = independentField === Field.INPUT
  const independentCurrencyId = isExactIn ? inputCurrencyId : outputCurrencyId
  const independentCurrency = useCurrency(independentCurrencyId)
  const independentCurrencyBalance = useCurrencyBalance(account || undefined, independentCurrency || undefined)
  const typedIndependentCurrencyAmount = tryParseAmount(typedValue, independentCurrency || undefined, chainId)

  // this boolean represents whether the user has approved the traded token and whether they
  // have enough balance for the trade to go through or not. If any of the preconditions are
  // not satisfied, the trade won't go through, so no gas estimations are performed
  const calculateGasFees =
    !!account &&
    !!preferredGasPrice &&
    typedIndependentCurrencyAmount &&
    independentCurrencyBalance &&
    (independentCurrencyBalance.greaterThan(typedIndependentCurrencyAmount) ||
      independentCurrencyBalance.equalTo(typedIndependentCurrencyAmount))

  const [loading, setLoading] = useState(false)
  const [estimations, setEstimations] = useState<(BigNumber | null)[][]>([])

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddress || account

  const updateEstimations = useCallback(async () => {
    setLoading(true)
    const estimatedCalls = []
    for (const platformCalls of platformSwapCalls) {
      const specificCalls = []
      for (const call of platformCalls) {
        const {
          parameters: { methodName, args, value },
          contract
        } = call
        const options = !value || isZero(value) ? {} : { value }

        let estimatedCall = null
        try {
          estimatedCall = calculateGasMargin(await contract.estimateGas[methodName](...args, { ...options }))
        } catch (error) {
          console.error(error)
          // silent fail
        } finally {
          specificCalls.push(estimatedCall)
        }
      }
      estimatedCalls.push(specificCalls)
    }
    setEstimations(estimatedCalls)
    setLoading(false)
  }, [platformSwapCalls])

  useEffect(() => {
    if (!trades || trades.length === 0 || !library || !chainId || !recipient || !account || !calculateGasFees) {
      setEstimations([])
      return
    }
    updateEstimations()
  }, [chainId, library, recipient, trades, updateEstimations, blockNumber, account, calculateGasFees])

  return { loading: loading, estimations }
}
