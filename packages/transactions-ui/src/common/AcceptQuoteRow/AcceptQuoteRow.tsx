import { Button, Flex, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'

export interface AcceptQuoteRowProps {
  /** The new quote's amount on the derived side, with symbol: `1,240.55 USDC`. */
  value: string
  /** Signed change against the quote on screen, pre-formatted: `(-1.42%)`. */
  changeText?: string
  onAccept: () => void
  testID?: string
}

/**
 * "Updated price · 1,240.55 USDC (-1.42%) · [Accept]": shown when a refreshed quote moved
 * enough that the amounts above are held and dimmed until the user takes it. When to show
 * it, the amount and the change all arrive pre-computed. The label and button copy are
 * generic, so the view owns them (existing keys kept).
 *
 * @alias UpdatedPriceRow, NewQuoteRow, PriceUpdateBanner
 */
export function AcceptQuoteRow({ value, changeText, onAccept, testID }: AcceptQuoteRowProps): JSX.Element {
  const { t } = useTranslation()

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
      testID={testID}
    >
      <Flex fill>
        <Text color="$neutral2" variant="body3">
          {t('swap.details.updatedPrice')}
        </Text>
        <Flex row alignItems="center">
          <Text color="$neutral1" numberOfLines={1} variant="body3">
            {value} {changeText ? <Text color="$neutral2">{changeText}</Text> : null}
          </Text>
        </Flex>
      </Flex>
      {/* fill={false} sizes the pill to its label. The default fill is flex-1 with a zero basis,
          so with flex={0} the pill collapsed to its padding and clipped "Accept". */}
      <Button emphasis="secondary" fill={false} px="$spacing8" size="small" variant="branded" onPress={onAccept}>
        {t('common.button.accept')}
      </Button>
    </Flex>
  )
}
