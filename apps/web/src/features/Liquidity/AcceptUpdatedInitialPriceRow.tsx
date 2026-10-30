import type { Currency, Price } from '@uniswap/sdk-core'
import { Button, Flex, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { NumberType } from 'utilities/src/format/types'

export function AcceptUpdatedInitialPriceRow({
  updatedPrice,
  priceChangePercent,
  base,
  quote,
  onAccept,
}: {
  updatedPrice: Price<Currency, Currency>
  priceChangePercent: number
  base: Maybe<Currency>
  quote: Maybe<Currency>
  onAccept: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()

  const formattedPrice = formatNumberOrString({ value: updatedPrice.toSignificant(), type: NumberType.TokenTx })
  const formattedChange = `${priceChangePercent > 0 ? '+' : ''}${priceChangePercent.toFixed(2)}`

  return (
    <Flex
      row
      shrink
      alignItems="center"
      borderColor="$surface3"
      borderRadius="$rounded16"
      borderWidth="$spacing1"
      gap="$spacing12"
      justifyContent="space-between"
      pl="$spacing12"
      pr="$spacing8"
      py="$spacing8"
    >
      <Flex fill>
        <Text color="$neutral2" variant="body3">
          {t('position.initialPrice.marketUpdated')}
        </Text>
        <Text color="$neutral1" numberOfLines={1} variant="body3">
          {formattedPrice} {quote?.symbol}/{base?.symbol} <Text color="$neutral2">({formattedChange}%)</Text>
        </Text>
      </Flex>
      <Trace logPress element={ElementName.AcceptUpdatedInitialPrice}>
        <Button px="$spacing8" variant="branded" emphasis="secondary" size="small" fill={false} onPress={onAccept}>
          {t('common.button.accept')}
        </Button>
      </Trace>
    </Flex>
  )
}
