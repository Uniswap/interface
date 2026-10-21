import { Flex, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { useMarginHealthLabels } from '~/pages/Swap/Margin/hooks/useMarginHealthLabels'
import { resolveMarginHealthDisplay } from '~/pages/Swap/Margin/marginFormat'

// The margin health factor as a tier LABEL ("Healthy"/"Caution"/"At risk"), never a raw number. Renders
// the VALUE only — the caller owns the row + visible label (DrawerDataCell in the drawer, MarginDetailRow
// in the modals). `after` omitted → one colored label; present → "before → after" (each colored by its
// own tier), collapsing to a single label when the tier is unchanged. `label` is used ONLY to compose the
// transition case's combined a11y string (so screen readers announce it like the sibling before→after
// rows), not for layout. Debt-free health must arrive as Infinity (never the wire "0" sentinel).
export function MarginHealthValue(
  props:
    // `after` present → a transition; it needs `label` to compose the combined a11y string.
    { before: number; after: number; label: string } | { before: number; after?: undefined; label?: string },
): JSX.Element {
  const { before, after, label } = props
  const { t } = useTranslation()
  const healthLabels = useMarginHealthLabels()
  const display = resolveMarginHealthDisplay({ before, after })

  if (display.mode === 'single') {
    return (
      <Text variant="body3" color={display.tier.color}>
        {healthLabels[display.tier.key]}
      </Text>
    )
  }

  const beforeLabel = healthLabels[display.before.key]
  const afterLabel = healthLabels[display.after.key]
  const ariaLabel =
    label !== undefined ? t('margin.beforeAfter.a11y', { label, before: beforeLabel, after: afterLabel }) : undefined

  return (
    <Flex row alignItems="center" gap="$spacing6" aria-label={ariaLabel}>
      <Text variant="body3" color={display.before.color}>
        {beforeLabel}
      </Text>
      <Text variant="body3" color="$neutral2">
        →
      </Text>
      <Text variant="body3" color={display.after.color}>
        {afterLabel}
      </Text>
    </Flex>
  )
}
