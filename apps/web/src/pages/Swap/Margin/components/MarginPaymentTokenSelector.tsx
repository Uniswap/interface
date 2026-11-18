import type { Currency } from '@uniswap/sdk-core'
import { TokenSelectorModal } from 'uniswap/src/components/TokenSelector/TokenSelector'
import { TokenSelectorFlow, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/types'
import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { MarginPaymentToken } from 'uniswap/src/features/transactions/margin/types'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useEvent } from 'utilities/src/react/hooks'
import { MARGIN_PAYMENT_SOURCE_CHAIN_IDS, type MarginMarket } from '~/constants/margin'
import {
  isMarketDefaultPaymentToken,
  isPaymentTokenDifferentFromCollateral,
} from '~/features/margin/utils/marginCurrencies'
import { toMarginPaymentToken } from '~/pages/Swap/Margin/hooks/useMarginPaymentTokens'

// Logs the pick and maps the market default to undefined, so the default keeps re-resolving on
// market switch.
export function resolveMarginPaymentTokenPick({
  token,
  market,
}: {
  token: MarginPaymentToken
  market: MarginMarket
}): MarginPaymentToken | undefined {
  if (isPaymentTokenDifferentFromCollateral({ token, market })) {
    sendAnalyticsEvent(InterfaceEventName.MarginPaymentTokenSelected, { symbol: token.symbol, marketKey: market.key })
  }
  return isMarketDefaultPaymentToken({ token, market }) ? undefined : token
}

export function MarginPaymentTokenSelector({
  isOpen,
  market,
  onClose,
  onSelect,
}: {
  isOpen: boolean
  market: MarginMarket
  onClose: () => void
  onSelect: (token: MarginPaymentToken | undefined) => void
}): JSX.Element {
  const addresses = useActiveAddresses()
  const onSelectCurrency = useEvent(({ currency }: { currency: Currency }) =>
    onSelect(resolveMarginPaymentTokenPick({ token: toMarginPaymentToken(currency), market })),
  )
  return (
    <TokenSelectorModal
      isModalOpen={isOpen}
      addresses={addresses}
      chainIds={MARGIN_PAYMENT_SOURCE_CHAIN_IDS}
      currencyField={CurrencyField.INPUT}
      flow={TokenSelectorFlow.Swap}
      variation={TokenSelectorVariation.BalancesOnly}
      onClose={onClose}
      onSelectCurrency={onSelectCurrency}
    />
  )
}
