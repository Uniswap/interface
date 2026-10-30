import { Button, Flex, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'

export interface AcceptNewQuoteRowProps {
  /** New amount on the derived side of the trade, already formatted. */
  amount: string
  /** Symbol of the derived-side currency, already truncated for display. */
  symbol?: string
  /** Signed percent change against the accepted quote without the `%` sign, e.g. `+0.42` or `-1.30`. */
  percentageDifference?: string
  onAccept: () => void
}

export function AcceptNewQuoteRow({
  amount,
  symbol,
  percentageDifference,
  onAccept,
}: AcceptNewQuoteRowProps): JSX.Element {
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
    >
      <Flex fill>
        <Text color="$neutral2" variant="body3">
          {t('swap.details.updatedPrice')}
        </Text>
        <Flex row alignItems="center">
          <Text color="$neutral1" numberOfLines={1} variant="body3">
            {amount} {symbol} <Text color="$neutral2">({percentageDifference}%)</Text>
          </Text>
        </Flex>
      </Flex>
      <Button
        px="$spacing8"
        width="auto"
        variant="branded"
        emphasis="secondary"
        size="small"
        flex={0}
        onPress={onAccept}
      >
        {t('common.button.accept')}
      </Button>
    </Flex>
  )
}
