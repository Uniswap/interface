import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ChainId, Currency } from '@swapr/sdk'

import { AppDispatch, AppState } from '../index'
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
import { bridgeModalDataSelector, bridgeTxsFilterSelector } from './selectors'
import { BridgeModalState, BridgeModalStatus, BridgeTxsFilter } from './reducer'

import { tryParseAmount } from '../swap/hooks'
import { useCurrency } from '../../hooks/Tokens'
import { useActiveWeb3React } from '../../hooks'
import { useCurrencyBalances } from '../wallet/hooks'

import { currencyId } from '../../utils/currencyId'
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

  return {
    onCurrencySelection,
    onUserInput,
    onFromNetworkChange,
    onToNetworkChange,
    onSwapBridgeNetworks
  }
}

export function useBridgeInfo() {
  const { account, chainId } = useActiveWeb3React()
  const { typedValue, currencyId, fromNetwork, toNetwork } = useBridgeState()

  console.log(currencyId)
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
    symbol,
    typedValue,
    fromChainId,
    toChainId
  }: Pick<BridgeModalState, 'symbol' | 'typedValue'> & { fromChainId: ChainId; toChainId: ChainId }) => void
] => {
  const dispatch = useDispatch()
  const modalData = useSelector(bridgeModalDataSelector)

  const setModalStatus = (status: BridgeModalStatus, error?: string) =>
    dispatch(setBridgeModalStatus({ status, error }))

  const setModalData = ({
    symbol,
    typedValue,
    fromChainId,
    toChainId
  }: Pick<BridgeModalState, 'symbol' | 'typedValue'> & { fromChainId: ChainId; toChainId: ChainId }) =>
    dispatch(setBridgeModalData({ symbol, typedValue, fromChainId, toChainId }))

  return [modalData, setModalStatus, setModalData]
}
