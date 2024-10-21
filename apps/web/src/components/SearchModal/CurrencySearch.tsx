import { InterfaceEventName, InterfaceModalName } from '@uniswap/analytics-events'
import { Currency } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import useSelectChain from 'hooks/useSelectChain'
import { useShowSwapNetworkNotification } from 'hooks/useShowSwapNetworkNotification'
import { useAtomValue } from 'jotai/utils'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useActiveSmartPool, useAddPopup, useRemovePopup } from 'state/application/hooks'
import { useSwapAndLimitContext } from 'state/swap/useSwapContext'
import { Flex } from 'ui/src'
import { TokenSelectorContent, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/TokenSelector'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { useEnabledChains } from 'uniswap/src/features/settings/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { CurrencyField } from 'uniswap/src/types/currency'
import { SwapTab } from 'uniswap/src/types/screens/interface'
// eslint-disable-next-line no-restricted-imports
import { usePrevious } from 'utilities/src/react/hooks'

export interface CurrencySearchFilters {
  onlyDisplaySmartPools?: boolean
}

interface CurrencySearchProps {
  currencyField: CurrencyField
  hideChainSwitch: boolean
  onCurrencySelect: (currency: Currency) => void
  onDismiss: () => void
}

// TODO: we moved filtering by operate pool to currency search modal, check if needed
export function CurrencySearch({ currencyField, hideChainSwitch, onCurrencySelect, onDismiss }: CurrencySearchProps) {
  const account = useAccount()
  const { chainId, setSelectedChainId, isUserSelectedToken, setIsUserSelectedToken, currentTab, multichainUXEnabled } =
    useSwapAndLimitContext()
  const prevChainId = usePrevious(chainId)
  const showSwapNetworkNotification = useShowSwapNetworkNotification()

  const selectChain = useSelectChain()
  const { chains } = useEnabledChains()
  const { address: smartPoolAddress } = useActiveSmartPool()

  const handleCurrencySelectTokenSelectorCallback = useCallback(
    async (currency: Currency) => {
      if (!multichainUXEnabled) {
        const correctChain = await selectChain(currency.chainId)
        if (!correctChain) {
          return
        }
      }

      onCurrencySelect(currency)
      setSelectedChainId(currency.chainId)
      setIsUserSelectedToken(true)
      onDismiss()
    },
    [onCurrencySelect, onDismiss, setSelectedChainId, setIsUserSelectedToken, selectChain, multichainUXEnabled],
  )

  useEffect(() => {
    if ((currentTab !== SwapTab.Swap && currentTab !== SwapTab.Send) || !multichainUXEnabled) {
      return
    }

    showSwapNetworkNotification(chainId, prevChainId)
  }, [currentTab, chainId, prevChainId, multichainUXEnabled, showSwapNetworkNotification])

  return (
    <Trace
      logImpression
      eventOnTrigger={InterfaceEventName.TOKEN_SELECTOR_OPENED}
      modal={InterfaceModalName.TOKEN_SELECTOR}
    >
      <Flex width="100%" flexGrow={1} flexShrink={1} flexBasis="auto">
        <TokenSelectorContent
          activeAccountAddress={
            currentTab === SwapTab.Swap && location.pathname !== '/mint'
              ? smartPoolAddress ?? undefined
              : account.address!
          }
          isLimits={currentTab === SwapTab.Limit}
          chainId={!multichainUXEnabled || isUserSelectedToken ? chainId : undefined}
          chainIds={chains}
          currencyField={currencyField}
          flow={TokenSelectorFlow.Swap}
          isSurfaceReady={true}
          variation={
            currencyField === CurrencyField.INPUT ? TokenSelectorVariation.SwapInput : TokenSelectorVariation.SwapOutput
          }
          onClose={onDismiss}
          onSelectCurrency={handleCurrencySelectTokenSelectorCallback}
        />
      </Flex>
    </Trace>
  )
}
