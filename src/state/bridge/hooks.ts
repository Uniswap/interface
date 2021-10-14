import { ChainId, Currency } from '@swapr/sdk'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import { useCurrency } from '../../hooks/Tokens'
import { AppDispatch, AppState } from '../index'
import { useCurrencyBalances } from '../wallet/hooks'
import {
  selectCurrency,
  typeInput,
  setFromBridgeNetwork,
  setToBridgeNetwork,
  swapBridgeNetworks,
  setBridgeTxsFilter,
  setBridgeModalStatus,
  setBridgeModalData
} from './actions'
import { currencyId } from '../../utils/currencyId'
import { tryParseAmount } from '../swap/hooks'
import { BridgeModalState, BridgeModalStatus, BridgeTxsFilter } from './reducer'
import { bridgeModalDataSelector, bridgeTxsFilterSelector } from './selectors'
import { getChainPair } from '../../utils/arbitrum'

export function useBridgeState(): AppState['bridge'] {
  return useSelector<AppState, AppState['bridge']>(state => state.bridge)
}

export function useBridgeActionHandlers(): {
  onCurrencySelection: (currency: Currency | string) => void
  onUserInput: (typedValue: string) => void
  onFromNetworkChange: (chainId: ChainId) => void
  onToNetworkChange: (chainId: ChainId) => void
  onSwapBridgeNetworks: () => void
  getCollectedTx: ({
    from,
    to,
    currency,
    typedValue
  }: {
    from: ChainId
    to: ChainId
    currency: Currency | string
    typedValue: string
  }) => void
} {
  const dispatch = useDispatch<AppDispatch>()

  const { fromNetwork, toNetwork } = useBridgeState()

  const onFromNetworkChange = useCallback(
    (chainId: ChainId) => {
      const { partnerChainId } = getChainPair(chainId)
      if (chainId === toNetwork.chainId) {
        dispatch(swapBridgeNetworks())
        return
      }
      dispatch(
        setFromBridgeNetwork({
          chainId: chainId
        })
      )
      dispatch(
        setToBridgeNetwork({
          chainId: partnerChainId
        })
      )
    },
    [dispatch, toNetwork.chainId]
  )

  const onToNetworkChange = useCallback(
    (chainId: ChainId) => {
      const { partnerChainId } = getChainPair(chainId)

      if (chainId === fromNetwork.chainId) {
        dispatch(swapBridgeNetworks())
        return
      }
      dispatch(
        setToBridgeNetwork({
          chainId: chainId
        })
      )
      dispatch(
        setFromBridgeNetwork({
          chainId: partnerChainId
        })
      )
    },
    [dispatch, fromNetwork.chainId]
  )

  const onSwapBridgeNetworks = useCallback(() => {
    dispatch(swapBridgeNetworks())
  }, [dispatch])

  const onCurrencySelection = useCallback(
    (currency: Currency | string) => {
      dispatch(
        selectCurrency({
          currencyId: currency instanceof Currency ? currencyId(currency) : currency
        })
      )
    },
    [dispatch]
  )

  const onUserInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ typedValue }))
    },
    [dispatch]
  )

  const getCollectedTx = useCallback(
    ({
      from,
      to,
      currency,
      typedValue
    }: {
      from: ChainId
      to: ChainId
      currency: Currency | string
      typedValue: string
    }) => {
      dispatch(setFromBridgeNetwork({ chainId: from }))
      dispatch(setToBridgeNetwork({ chainId: to }))
      dispatch(typeInput({ typedValue }))
      dispatch(
        selectCurrency({
          currencyId: currency instanceof Currency ? currencyId(currency) : currency
        })
      )
    },
    [dispatch]
  )

  return {
    onCurrencySelection,
    onUserInput,
    onFromNetworkChange,
    onToNetworkChange,
    onSwapBridgeNetworks,
    getCollectedTx
  }
}

export function useBridgeInfo() {
  const { account, chainId } = useActiveWeb3React()
  const { typedValue, currencyId, fromNetwork, toNetwork } = useBridgeState()

  const bridgeCurrency = useCurrency(currencyId)
  const parsedAmount = tryParseAmount(typedValue, bridgeCurrency ?? undefined, chainId)

  const [currencyBalance] = useCurrencyBalances(account ?? undefined, [bridgeCurrency ?? undefined])

  let inputError: string | undefined
  if (!account) {
    inputError = 'Connect Wallet'
  }

  if (!parsedAmount) {
    inputError = inputError ?? 'Enter amount'
  }

  if (!bridgeCurrency) {
    inputError = inputError ?? 'Select a token'
  }

  if (currencyBalance && parsedAmount && currencyBalance.lessThan(parsedAmount)) {
    inputError = 'Insufficient ' + parsedAmount.currency.symbol + ' balance'
  }

  return {
    bridgeCurrency,
    currencyBalance,
    parsedAmount,
    inputError,
    typedValue,
    fromNetwork,
    toNetwork
  }
}

export const useBridgeTxsFilter = (): [BridgeTxsFilter, (filter: BridgeTxsFilter) => void] => {
  const dispatch = useDispatch()
  const filter = useSelector(bridgeTxsFilterSelector)
  const setFilter = (filter: BridgeTxsFilter) => dispatch(setBridgeTxsFilter(filter))

  return [filter, setFilter]
}

export const useBridgeModal = (): [
  BridgeModalState,
  (status: BridgeModalStatus, error?: string) => void,
  ({
    currencyId,
    typedValue,
    fromChainId,
    toChainId
  }: Pick<BridgeModalState, 'currencyId' | 'typedValue'> & { fromChainId: ChainId; toChainId: ChainId }) => void
] => {
  const dispatch = useDispatch()
  const modalData = useSelector(bridgeModalDataSelector)

  const setModalStatus = (status: BridgeModalStatus, error?: string) =>
    dispatch(setBridgeModalStatus({ status, error }))

  const setModalData = ({
    currencyId,
    typedValue,
    fromChainId,
    toChainId
  }: Pick<BridgeModalState, 'currencyId' | 'typedValue'> & { fromChainId: ChainId; toChainId: ChainId }) =>
    dispatch(setBridgeModalData({ currencyId, typedValue, fromChainId, toChainId }))

  return [modalData, setModalStatus, setModalData]
}
