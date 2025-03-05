import { InterfaceEventName, InterfaceModalName } from '@uniswap/analytics-events'
import { Currency } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import useSelectChain from 'hooks/useSelectChain'
import { useShowSwapNetworkNotification } from 'hooks/useShowSwapNetworkNotification'
import { useCallback, useEffect } from 'react'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { useSwapAndLimitContext } from 'state/swap/useSwapContext'
import { Flex } from 'ui/src'
import { TokenSelectorContent, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/TokenSelector'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { CurrencyField } from 'uniswap/src/types/currency'
import { SwapTab } from 'uniswap/src/types/screens/interface'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { usePrevious } from 'utilities/src/react/hooks'

interface CurrencySearchProps {
  currencyField: CurrencyField
  onCurrencySelect: (currency: Currency) => void
  onDismiss: () => void
  chainIds?: UniverseChainId[]
}

export function CurrencySearch({ currencyField, onCurrencySelect, onDismiss, chainIds }: CurrencySearchProps) {
  const account = useAccount()
  const { chainId, setSelectedChainId, isUserSelectedToken, setIsUserSelectedToken, isMultichainContext } =
    useMultichainContext()
  const { currentTab } = useSwapAndLimitContext()
  const prevChainId = usePrevious(chainId)
  const showSwapNetworkNotification = useShowSwapNetworkNotification()

  const selectChain = useSelectChain()
  const { chains } = useEnabledChains()

  const handleCurrencySelectTokenSelectorCallback = useCallback(
    async (currency: Currency) => {
      if (!isMultichainContext) {
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
    [onCurrencySelect, onDismiss, setSelectedChainId, setIsUserSelectedToken, selectChain, isMultichainContext],
  )

  useEffect(() => {
    if ((currentTab !== SwapTab.Swap && currentTab !== SwapTab.Send) || !isMultichainContext) {
      return
    }

    showSwapNetworkNotification({ chainId, prevChainId })
  }, [currentTab, chainId, prevChainId, isMultichainContext, showSwapNetworkNotification])

  return (
    <Trace
      logImpression
      eventOnTrigger={InterfaceEventName.TOKEN_SELECTOR_OPENED}
      modal={InterfaceModalName.TOKEN_SELECTOR}
    >
      <Flex width="100%" flexGrow={1} flexShrink={1} flexBasis="auto">
        <TokenSelectorContent
          activeAccountAddress={account.address!}
          isLimits={currentTab === SwapTab.Limit}
          chainId={!isMultichainContext || isUserSelectedToken ? chainId : undefined}
          chainIds={chainIds ?? chains}
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
