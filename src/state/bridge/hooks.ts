import { AppState, AppDispatch } from '../index'
import { useSelector, useDispatch } from 'react-redux'
import { useCallback, useMemo } from 'react'
import { useAsyncMemo } from 'use-async-memo'
import { typeInput, Field, BridgeTransactionStatus } from './actions'
import { Currency, CurrencyAmount } from '@fuseio/fuse-swap-sdk'
import { useCurrencyBalances } from '../wallet/hooks'
import { useActiveWeb3React, useChain } from '../../hooks'
import { tryParseAmount } from '../swap/hooks'
import { DEFAULT_CONFIRMATIONS_LIMIT } from '../../constants/bridge'
import { useCurrency } from '../../hooks/Tokens'
import { getMinMaxPerTxn } from './limits'
import { calculateBridgeFee } from '../../utils'
import { BridgeMode } from './bridges/tokenBridge'
import { getBridgeMode } from './bridges/utils'

export function useBridgeState(): AppState['bridge'] {
  return useSelector<AppState, AppState['bridge']>(state => state.bridge)
}

export function useDerivedBridgeInfo(
  tokenAddress: string | undefined
): {
  currencies: { [field in Field]?: Currency }
  currencyBalances: { [field in Field]?: CurrencyAmount }
  parsedAmounts: { [field in Field]?: CurrencyAmount }
  inputError?: string
  bridgeTransactionStatus: BridgeTransactionStatus
  confirmations: number
  bridgeFee?: string
} {
  const { account, chainId, library } = useActiveWeb3React()

  const { isHome } = useChain()

  const inputCurrency = useCurrency(tokenAddress)

  const { independentField, typedValue, bridgeTransactionStatus, confirmations } = useBridgeState()

  const currencies: { [field in Field]?: Currency } = useMemo(
    () => ({
      [Field.INPUT]: inputCurrency ?? undefined
    }),
    [inputCurrency]
  )

  const balances = useCurrencyBalances(account ?? undefined, [currencies[Field.INPUT]])

  const currencyBalances: { [field in Field]?: CurrencyAmount } = {
    [Field.INPUT]: balances[0]
  }

  const independentAmount: CurrencyAmount | undefined = tryParseAmount(typedValue, currencies[independentField])

  const parsedAmounts: { [field in Field]: CurrencyAmount | undefined } = {
    [Field.INPUT]: independentAmount
  }

  const parsedAmount = tryParseAmount(typedValue, inputCurrency ?? undefined)

  const { [Field.INPUT]: inputAmount } = parsedAmounts

  const minMaxAmount = useAsyncMemo(async () => {
    if (!tokenAddress || !chainId || !library || !account) return
    try {
      return await getMinMaxPerTxn(tokenAddress, inputCurrency?.decimals, isHome, chainId, library, account)
    } catch (e) {
      console.error(`Failed to fetch min max amount`)
      return { minAmount: '0', maxAmount: '1000' }
    }
  }, [tokenAddress, inputCurrency])

  const bridgeFee = useAsyncMemo(async () => {
    if (
      !tokenAddress ||
      !parsedAmount ||
      !library ||
      !account ||
      !isHome ||
      getBridgeMode(tokenAddress) !== BridgeMode.ERC20_TO_ERC677
    )
      return

    const fee = await calculateBridgeFee(tokenAddress, parsedAmount, library, account)
    return fee
  }, [tokenAddress, parsedAmount?.raw.toString()])

  let inputError: string | undefined
  if (!account) {
    inputError = 'Connect Wallet'
  }

  if (!currencies[Field.INPUT]) {
    inputError = inputError ?? 'Select a token'
  }

  if (!parsedAmount) {
    inputError = inputError ?? 'Enter an amount'
  }

  if (minMaxAmount && Number(typedValue) < Number(minMaxAmount.minAmount)) {
    inputError = inputError ?? `Below minimum limit (${minMaxAmount.minAmount})`
  }

  if (inputAmount && currencyBalances?.[Field.INPUT]?.lessThan(inputAmount)) {
    inputError = 'Insufficient ' + currencies[Field.INPUT]?.symbol + ' balance'
  }

  if (minMaxAmount && Number(typedValue) > Number(minMaxAmount.maxAmount)) {
    inputError = inputError ?? `Above maximum limit (${minMaxAmount.maxAmount})`
  }

  return {
    currencies,
    currencyBalances,
    parsedAmounts,
    inputError,
    bridgeTransactionStatus,
    confirmations,
    bridgeFee
  }
}

export function useBridgeStatus(bridgeStatus: BridgeTransactionStatus): string {
  const { confirmations } = useBridgeState()
  const { isHome } = useChain()

  return useMemo(() => {
    switch (bridgeStatus) {
      case BridgeTransactionStatus.INITIAL:
        return ''
      case BridgeTransactionStatus.TOKEN_TRANSFER_PENDING:
      case BridgeTransactionStatus.TOKEN_TRANSFER_SUCCESS:
        return 'Transfering...'
      case BridgeTransactionStatus.CONFIRMATION_TRANSACTION_PENDING:
      case BridgeTransactionStatus.CONFIRMATION_TRANSACTION_SUCCESS:
        return `Waiting for ${confirmations}/${DEFAULT_CONFIRMATIONS_LIMIT} Confirmations`
      case BridgeTransactionStatus.CONFIRM_TOKEN_TRANSFER_PENDING:
        const network = isHome ? 'Ethereum' : 'Fuse'
        return 'Moving funds to ' + network
      default:
        return ''
    }
  }, [bridgeStatus, confirmations, isHome])
}

export function useBridgeActionHandlers(): {
  onFieldInput: (typedValue: string) => void
} {
  const dispatch = useDispatch<AppDispatch>()

  const onFieldInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: Field.INPUT, typedValue }))
    },
    [dispatch]
  )

  return { onFieldInput }
}
