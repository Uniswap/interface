import { Flex, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'

// The liquidation badge, wherever a position surface shows one. `full` only ever comes back for a
// CLOSED position (getMarginLiquidationBadge), so the open-position callers can only render the
// partial form — but reading the badge here rather than hardcoding it per site is what keeps the three
// call sites from drifting apart in copy or token.
export function MarginLiquidationPill({
  badge,
  // The drawer sits in a wider container than the table cells and pads one step further.
  px = '$spacing6',
}: {
  badge: 'full' | 'partial'
  px?: '$spacing6' | '$spacing8'
}): JSX.Element {
  const { t } = useTranslation()
  const isFull = badge === 'full'
  return (
    <Flex
      px={px}
      py="$spacing2"
      borderRadius="$roundedFull"
      backgroundColor={isFull ? '$statusCritical2' : '$statusWarning2'}
    >
      <Text variant="buttonLabel4" color={isFull ? '$statusCritical' : '$statusWarning'}>
        {isFull ? t('margin.table.liquidated') : t('margin.table.partiallyLiquidated')}
      </Text>
    </Flex>
  )
}
