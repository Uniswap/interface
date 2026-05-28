import {
  createTransactionSettingsStore,
  initialTransactionSettingsState,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/createTransactionSettingsStore'
import { isDefaultTradeRouteOptions } from 'uniswap/src/features/transactions/swap/components/SwapFormSettings/settingsConfigurations/TradeRoutingPreference/isDefaultTradeRouteOptions'

describe('createTransactionSettingsStore', () => {
  describe('initialTransactionSettingsState', () => {
    it('should have default values that pass isDefaultTradeRouteOptions validation', () => {
      const { selectedProtocols, isV4HookPoolsEnabled } = initialTransactionSettingsState

      const isDefault = isDefaultTradeRouteOptions({
        selectedProtocols,
        isV4HookPoolsEnabled,
      })

      expect(isDefault).toBe(true)
    })

    it('should fail validation if isV4HookPoolsEnabled is false', () => {
      const { selectedProtocols } = initialTransactionSettingsState

      const isDefault = isDefaultTradeRouteOptions({
        selectedProtocols,
        isV4HookPoolsEnabled: false,
      })

      expect(isDefault).toBe(false)
    })
  })

  it('sets and clears gasOverrides', () => {
    const { store } = createTransactionSettingsStore()
    store.getState().actions.setGasOverrides({ maxBaseFeeGwei: '3.5', priorityFeeGwei: '2', gasLimit: '500000' })
    expect(store.getState().gasOverrides).toEqual({
      maxBaseFeeGwei: '3.5',
      priorityFeeGwei: '2',
      gasLimit: '500000',
    })
    store.getState().actions.clearGasOverrides()
    expect(store.getState().gasOverrides).toBeUndefined()
  })
})
