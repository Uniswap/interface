import { AppState, AppDispatch } from '../index'
import { useSelector, useDispatch } from 'react-redux'
import * as Sentry from '@sentry/react'
import { useCallback, useMemo } from 'react'
import { useAsyncMemo } from 'use-async-memo'
import { typeInput, Field, BridgeTransactionStatus, selectBridgeDirection, selectCurrency } from './actions'
import { Currency, CurrencyAmount, ChainId } from '@fuseio/fuse-swap-sdk'
import { useCurrencyBalances } from '../wallet/hooks'
import { useActiveWeb3React, useChain } from '../../hooks'
import { tryParseAmount } from '../swap/hooks'
import { DEFAULT_CONFIRMATIONS_LIMIT, HOME_TO_FOREIGN_FEE_TYPE_HASH } from '../../constants/bridge'
import { useCurrency, useToken } from '../../hooks/Tokens'
import { getMinMaxPerTxn } from './limits'
import { getHomeMultiAMBErc20ToErc677Contract, getEthFuseBridgeType } from '../../utils'
import { formatEther, formatUnits } from 'ethers/lib/utils'
import useParsedQueryString from '../../hooks/useParsedQueryString'
import { FUSE_ERC20_TO_ERC677_BRIDGE_HOME_ADDRESS, BINANCE_CHAIN_ID } from '../../constants'

export enum BridgeType {
  ETH_FUSE_NATIVE = 'ETH_FUSE_NATIVE',
  ETH_FUSE_ERC677_TO_ERC677 = 'ETH_FUSE_ERC677_TO_ERC677',
  ETH_FUSE_ERC20_TO_ERC677 = 'ETH_FUSE_ERC20_TO_ERC677',
  BSC_FUSE_ERC20_TO_ERC677 = 'BSC_FUSE_ERC20_TO_ERC677'
}

export enum BridgeDirection {
  ETH_TO_FUSE = 'ETH_TO_FUSE',
  FUSE_TO_ETH = 'FUSE_TO_ETH',
  BSC_TO_FUSE = 'BSC_TO_FUSE',
  FUSE_TO_BSC = 'FUSE_TO_BSC'
}

export function useBridgeState(): AppState['bridge'] {
  return useSelector<AppState, AppState['bridge']>(state => state.bridge)
}

export function useDerivedBridgeInfo(
  bridgeDirection?: BridgeDirection
): {
  currencies: { [field in Field]?: Currency }
  currencyBalances: { [field in Field]?: CurrencyAmount }
  parsedAmounts: { [field in Field]?: CurrencyAmount }
  inputError?: string
  bridgeTransactionStatus: BridgeTransactionStatus
  confirmations: number
  bridgeFee?: string
  inputCurrencyId?: string
} {
  const { account, chainId, library } = useActiveWeb3React()

  const { isHome } = useChain()

  const {
    independentField,
    typedValue,
    bridgeTransactionStatus,
    confirmations,
    [Field.INPUT]: { currencyId: inputCurrencyId }
  } = useBridgeState()

  const inputCurrency = useCurrency(inputCurrencyId, 'Bridge')

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
    if (!inputCurrencyId || !chainId || !library || !account || !bridgeDirection) return
    try {
      return await getMinMaxPerTxn(inputCurrencyId, bridgeDirection, inputCurrency?.decimals, isHome, library, account)
    } catch (e) {
      console.error(`Failed to fetch min max amount for ${inputCurrency?.symbol} at ${inputCurrencyId}`, e)
      return { minAmount: '0', maxAmount: '1000' }
    }
  }, [inputCurrencyId, inputCurrency, bridgeDirection])

  let inputError: string | undefined
  if (!account) {
    inputError = 'Connect Wallet'
  }

  if (isHome && !bridgeDirection) {
    inputError = inputError ?? 'Select destination'
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
    inputCurrencyId
  }
}

export function useBridgeStatus(bridgeStatus: BridgeTransactionStatus): string {
  const { confirmations, bridgeDirection } = useBridgeState()
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
        const network = isHome ? (bridgeDirection === BridgeDirection.FUSE_TO_BSC ? 'Binance' : 'Ethereum') : 'Fuse'
        return 'Moving funds to ' + network
      default:
        return ''
    }
  }, [bridgeDirection, bridgeStatus, confirmations, isHome])
}

export function useBridgeActionHandlers(): {
  onFieldInput: (typedValue: string) => void
  onSelectBridgeDirection: (direction: BridgeDirection) => void
  onSelectCurrency: (currencyId: string | undefined) => void
} {
  const dispatch = useDispatch<AppDispatch>()

  const onFieldInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: Field.INPUT, typedValue }))
    },
    [dispatch]
  )

  const onSelectBridgeDirection = useCallback(
    (direction: BridgeDirection) => {
      dispatch(selectBridgeDirection({ direction }))
    },
    [dispatch]
  )

  const onSelectCurrency = useCallback(
    (currencyId: string | undefined) => {
      dispatch(selectCurrency({ field: Field.INPUT, currencyId }))
    },
    [dispatch]
  )

  return { onFieldInput, onSelectBridgeDirection, onSelectCurrency }
}

export function useBridgeFee(tokenAddress: string | undefined) {
  const { account, library } = useActiveWeb3React()
  const { isHome } = useChain()

  return useAsyncMemo(async () => {
    if (
      !isHome ||
      !account ||
      !library ||
      !tokenAddress ||
      getEthFuseBridgeType(tokenAddress) !== BridgeType.ETH_FUSE_ERC20_TO_ERC677
    )
      return

    try {
      const address = FUSE_ERC20_TO_ERC677_BRIDGE_HOME_ADDRESS
      const contract = getHomeMultiAMBErc20ToErc677Contract(address, library, account)
      const fee = await contract.getFee(HOME_TO_FOREIGN_FEE_TYPE_HASH, tokenAddress)
      return formatEther(fee)
    } catch (error) {
      Sentry.captureException(error)
      console.error(error)
      return
    }
  }, [isHome, account, library, tokenAddress])
}

export function useCalculatedBridgeFee(tokenAddress: string | undefined, currencyAmount: CurrencyAmount | undefined) {
  const { account, library } = useActiveWeb3React()
  const { isHome } = useChain()
  const token = useToken(tokenAddress)
  const amount = currencyAmount?.raw?.toString()

  return useAsyncMemo(async () => {
    if (
      !isHome ||
      !account ||
      !library ||
      !tokenAddress ||
      !amount ||
      !token ||
      getEthFuseBridgeType(tokenAddress) !== BridgeType.ETH_FUSE_ERC20_TO_ERC677
    )
      return

    try {
      const address = FUSE_ERC20_TO_ERC677_BRIDGE_HOME_ADDRESS
      const contract = getHomeMultiAMBErc20ToErc677Contract(address, library, account)
      const fee = await contract.calculateFee(HOME_TO_FOREIGN_FEE_TYPE_HASH, tokenAddress, amount)
      return formatUnits(fee, token.decimals)
    } catch (error) {
      Sentry.captureException(error)
      console.error(error)
      return
    }
  }, [isHome, account, amount, library, tokenAddress])
}

export function useDetectBridgeDirection(selectedBridgeDirection?: BridgeDirection) {
  const { chainId } = useActiveWeb3React()

  if (selectedBridgeDirection) {
    return selectedBridgeDirection
  }

  switch (chainId) {
    case ChainId.MAINNET:
    case ChainId.ROPSTEN:
      return BridgeDirection.ETH_TO_FUSE
    case BINANCE_CHAIN_ID:
      return BridgeDirection.BSC_TO_FUSE
    default:
      return undefined
  }
}

export function useDefaultsFromURLSearch() {
  const parsedQs = useParsedQueryString()

  const inputCurrencyId = parsedQs.inputCurrencyId?.toString()

  return {
    inputCurrencyId
  }
}
