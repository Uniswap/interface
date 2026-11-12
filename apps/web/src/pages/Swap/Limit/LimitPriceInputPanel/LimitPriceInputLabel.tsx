import { Currency } from '@uniswap/sdk-core'
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { Trans } from 'ui/src'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'

export function LimitPriceInputLabel({
  currency,
  showCurrencyMessage,
  openCurrencySearchModal,
}: {
  currency?: Currency
  showCurrencyMessage: boolean
  openCurrencySearchModal: () => void
}) {
  const { t } = useTranslation()
  const currencyInfo = useCurrencyInfo(currencyId(currency))
  if (!currency || !showCurrencyMessage) {
    return (
      <Text variant="body3" userSelect="none" color="$neutral2">
        {t('limits.price.label')}
      </Text>
    )
  }
  return (
    <Text
      variant="body3"
      userSelect="none"
      color="$neutral2"
      display="flex"
      flexDirection="row"
      width="100%"
      alignItems="center"
    >
      <Trans
        i18nKey="limits.price.input.label"
        components={{
          tokenSymbol: (
            <Flex my="$none" mx="$spacing4">
              <TouchableArea row alignItems="center" gap="$spacing8" height="100%" onPress={openCurrencySearchModal}>
                <CurrencyLogo currencyInfo={currencyInfo} size={16} />
                <Text variant="body2" display="inline" color="$neutral1">
                  {currency.symbol}
                </Text>
              </TouchableArea>
            </Flex>
          ),
        }}
      />
    </Text>
  )
}
