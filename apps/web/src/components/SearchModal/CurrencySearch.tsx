import { InterfaceEventName, InterfaceModalName } from '@uniswap/analytics-events'
import { Currency } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import { useActiveLocalCurrency } from 'hooks/useActiveLocalCurrency'
import { useActiveLocale } from 'hooks/useActiveLocale'
import useSelectChain from 'hooks/useSelectChain'
import { useShowSwapNetworkNotification } from 'hooks/useShowSwapNetworkNotification'
import { useCallback, useEffect } from 'react'
import { useSwapAndLimitContext } from 'state/swap/useSwapContext'
import { Flex } from 'ui/src'
import { TokenSelectorContent, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/TokenSelector'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { CurrencyField } from 'uniswap/src/types/currency'
import { SwapTab } from 'uniswap/src/types/screens/interface'
// eslint-disable-next-line no-restricted-imports
import { formatNumberOrString } from 'utilities/src/format/localeBased'
import { NumberType as UtilitiesNumberType } from 'utilities/src/format/types'
import { usePrevious } from 'utilities/src/react/hooks'
import { NumberType, useFormatter } from 'utils/formatNumbers'

interface CurrencySearchProps {
  currencyField: CurrencyField
  onCurrencySelect: (currency: Currency) => void
  onDismiss: () => void
}

export function CurrencySearch({ currencyField, onCurrencySelect, onDismiss }: CurrencySearchProps) {
  const account = useAccount()
  const { chainId, setSelectedChainId, isUserSelectedToken, setIsUserSelectedToken, currentTab, multichainUXEnabled } =
    useSwapAndLimitContext()
  const prevChainId = usePrevious(chainId)
  const { formatNumber } = useFormatter()
  const showSwapNetworkNotification = useShowSwapNetworkNotification()

  const activeCurrencyCode = useActiveLocalCurrency()
  const activeLocale = useActiveLocale()

  const selectChain = useSelectChain()

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
          activeAccountAddress={account.address!}
          isLimits={currentTab === SwapTab.Limit}
          chainId={!multichainUXEnabled || isUserSelectedToken ? chainId : undefined}
          convertFiatAmountFormattedCallback={(fromAmount) =>
            formatNumber({
              input: fromAmount as number,
              type: NumberType.FiatTokenPrice,
            })
          }
          currencyField={currencyField}
          flow={TokenSelectorFlow.Swap}
          formatNumberOrStringCallback={(input) =>
            formatNumberOrString({
              price: input.value,
              currencyCode: activeCurrencyCode,
              locale: activeLocale,
              type: UtilitiesNumberType.TokenNonTx,
            })
          }
          isSurfaceReady={true}
          variation={
            currencyField === CurrencyField.INPUT
              ? TokenSelectorVariation.BalancesAndPopular
              : TokenSelectorVariation.SuggestedAndFavoritesAndPopular
          }
          onClose={onDismiss}
          onSelectCurrency={handleCurrencySelectTokenSelectorCallback}
        />
      </Flex>
    </Trace>
  )
}
