import type { Currency } from '@uniswap/sdk-core'
import { Flex, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { SelectTokenButton } from 'uniswap/src/components/CurrencyInputPanel/SelectTokenButton'
import { TokenSelectorModal } from 'uniswap/src/components/TokenSelector/TokenSelector'
import { TokenSelectorFlow, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/types'
import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import {
  useMarginFormStore,
  useMarginFormStoreActions,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import type { MarginPaymentToken } from 'uniswap/src/features/transactions/margin/types'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useEvent } from 'utilities/src/react/hooks'
import { MARGIN_PAYMENT_SOURCE_CHAIN_IDS } from '~/constants/margin'
import { resolveMarginPaymentTokenPick } from '~/pages/Swap/Margin/components/MarginPaymentTokenSelector'
import type { DerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'
import { toMarginPaymentToken } from '~/pages/Swap/Margin/hooks/useMarginPaymentTokens'

// The wallet token that funds the margin, picked in the app's shared token selector. BalancesOnly
// over the payment source chains matches what margin accepts: any holding there, with the quote as
// the routability backstop. The resolved pick goes to `onSelectPaymentToken`, which owns writing it
// (the Margin input re-prices its amount into the new token).
export function MarginPayWith({
  derivedMarginInfo,
  onSelectPaymentToken,
}: {
  derivedMarginInfo: DerivedMarginInfo
  onSelectPaymentToken: (token: MarginPaymentToken | undefined) => void
}): JSX.Element {
  const { t } = useTranslation()
  const addresses = useActiveAddresses()
  const isSelectorOpen = useMarginFormStore((s) => s.selectingPaymentToken)
  const { setMarginFormState } = useMarginFormStoreActions()
  const openSelector = useEvent(() => setMarginFormState({ selectingPaymentToken: true }))
  const closeSelector = useEvent(() => setMarginFormState({ selectingPaymentToken: false }))
  const onSelectCurrency = useEvent(({ currency }: { currency: Currency }) => {
    const paymentToken = resolveMarginPaymentTokenPick({
      token: toMarginPaymentToken(currency),
      market: derivedMarginInfo.market,
    })
    setMarginFormState({ selectingPaymentToken: false })
    onSelectPaymentToken(paymentToken)
  })

  return (
    <>
      <Flex
        row
        alignItems="center"
        justifyContent="space-between"
        gap="$spacing12"
        p="$spacing16"
        borderRadius="$rounded20"
        backgroundColor="$surface2"
      >
        <Text variant="subheading2" color="$neutral2">
          {t('margin.payment.selector.title')}
        </Text>
        <SelectTokenButton
          testID={TestID.MarginPayWith}
          selectedCurrencyInfo={derivedMarginInfo.paymentCurrencyInfo}
          onPress={openSelector}
        />
      </Flex>
      <TokenSelectorModal
        isModalOpen={isSelectorOpen}
        addresses={addresses}
        chainIds={MARGIN_PAYMENT_SOURCE_CHAIN_IDS}
        currencyField={CurrencyField.INPUT}
        flow={TokenSelectorFlow.Swap}
        variation={TokenSelectorVariation.BalancesOnly}
        onClose={closeSelector}
        onSelectCurrency={onSelectCurrency}
      />
    </>
  )
}
