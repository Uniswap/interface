import { Flex, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { SelectTokenButton } from 'uniswap/src/components/CurrencyInputPanel/SelectTokenButton'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import {
  useMarginFormStore,
  useMarginFormStoreActions,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import type { MarginPaymentToken } from 'uniswap/src/features/transactions/margin/types'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { MarginPaymentTokenSelector } from '~/pages/Swap/Margin/components/MarginPaymentTokenSelector'
import type { DerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'

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
  const { formatCurrencyAmount } = useLocalizationContext()
  const { balance } = derivedMarginInfo
  const isSelectorOpen = useMarginFormStore((s) => s.selectingPaymentToken)
  const { setMarginFormState } = useMarginFormStoreActions()
  const openSelector = useEvent(() => setMarginFormState({ selectingPaymentToken: true }))
  const closeSelector = useEvent(() => setMarginFormState({ selectingPaymentToken: false }))
  const onSelect = useEvent((paymentToken: MarginPaymentToken | undefined) => {
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
        <Flex gap="$spacing2" flexShrink={1}>
          <Text variant="subheading2" color="$neutral2">
            {t('margin.payment.selector.title')}
          </Text>
          {/* The Deposit box above shows no balance: it reads in dollars, restated from this token. */}
          {balance ? (
            <Text variant="body3" color="$neutral2" numberOfLines={1}>
              {t('margin.payment.available', {
                balance: formatCurrencyAmount({ value: balance, type: NumberType.TokenNonTx }),
              })}
            </Text>
          ) : null}
        </Flex>
        <SelectTokenButton
          testID={TestID.MarginPayWith}
          selectedCurrencyInfo={derivedMarginInfo.paymentCurrencyInfo}
          onPress={openSelector}
        />
      </Flex>
      <MarginPaymentTokenSelector
        isOpen={isSelectorOpen}
        market={derivedMarginInfo.market}
        onClose={closeSelector}
        onSelect={onSelect}
      />
    </>
  )
}
