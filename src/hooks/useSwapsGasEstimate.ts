import { ChainId, Token, Trade } from 'dxswap-sdk'
import { BigNumber } from 'ethers'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useActiveWeb3React } from '.'
import { INITIAL_ALLOWED_SLIPPAGE } from '../constants'
import { useTokenAllowancesForMultipleSpenders } from '../data/Allowances'
import { MainnetGasPrice } from '../state/application/actions'
import { useMainnetGasPrices } from '../state/application/hooks'
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
  const { account, library, chainId } = useActiveWeb3React()
  const platformSwapCalls = useSwapsCallArguments(trades, allowedSlippage, recipientAddressOrName)
  const mainnetGasPrices = useMainnetGasPrices()
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
  const typedIndependentCurrencyAmount = useMemo(
    () => tryParseAmount(typedValue, independentCurrency || undefined, chainId),
    [chainId, independentCurrency, typedValue]
  )
  const routerAddresses = useMemo(() => {
    if (!trades) return undefined
    const rawRouterAddresses = trades.map(trade => trade?.platform?.routerAddress[chainId || ChainId.MAINNET])
    if (rawRouterAddresses.some(address => !address)) return undefined
    return rawRouterAddresses as string[]
  }, [chainId, trades])
  const routerAllowances = useTokenAllowancesForMultipleSpenders(
    independentCurrency as Token,
    account || undefined,
    routerAddresses
  )

  // this boolean represents whether the user has approved the traded token and whether they
  // have enough balance for the trade to go through or not. If any of the preconditions are
  // not satisfied, the trade won't go through, so no gas estimations are performed
  const calculateGasFees = useMemo(() => {
    return (
      !!account &&
      !!trades &&
      trades.length > 0 &&
      !!preferredGasPrice &&
      (preferredGasPrice in MainnetGasPrice ? !!mainnetGasPrices : true) &&
      routerAllowances &&
      routerAllowances.length === trades.length &&
      typedIndependentCurrencyAmount &&
      independentCurrencyBalance &&
      (independentCurrencyBalance.greaterThan(typedIndependentCurrencyAmount) ||
        independentCurrencyBalance.equalTo(typedIndependentCurrencyAmount))
    )
  }, [
    account,
    independentCurrencyBalance,
    mainnetGasPrices,
    preferredGasPrice,
    routerAllowances,
    trades,
    typedIndependentCurrencyAmount
  ])

  const [loading, setLoading] = useState(false)
  const [estimations, setEstimations] = useState<(BigNumber | null)[][]>([])

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddress || account

  const updateEstimations = useCallback(async () => {
    if (!routerAllowances || !trades || !typedIndependentCurrencyAmount || routerAllowances.length !== trades.length)
      return
    setLoading(true)
    const estimatedCalls = []
    for (let i = 0; i < platformSwapCalls.length; i++) {
      const platformCalls = platformSwapCalls[i]
      let specificCalls = []
      // if the allowance to the router for the traded token is less than the
      // types amount, avoid estimating gas since the tx would fail, printing
      // an horrible error log in the console, continuously
      if (routerAllowances[i].lessThan(typedIndependentCurrencyAmount)) {
        specificCalls = platformCalls.map(() => null)
      } else {
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
      }
      estimatedCalls.push(specificCalls)
    }
    setEstimations(estimatedCalls)
    setLoading(false)
  }, [platformSwapCalls, routerAllowances, trades, typedIndependentCurrencyAmount])

  useEffect(() => {
    if (!trades || trades.length === 0 || !library || !chainId || !recipient || !account || !calculateGasFees) {
      setEstimations([])
      return
    }
    updateEstimations()
  }, [chainId, library, recipient, trades, updateEstimations, account, calculateGasFees])

  return { loading: loading, estimations }
}
