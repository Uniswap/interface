import { Flex, Text } from '@universe/mycelium'
import { Lightning } from '@universe/mycelium/icons/Lightning'
import { useTranslation } from 'react-i18next'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'

const CURRENT_FEE_MAX_DECIMALS = 4

/**
 * The display label for a dynamic-fee pool: the fee it currently charges, or the generic "Dynamic"
 * until the backend can establish one (no swap indexed yet) — never a 0% stand-in.
 */
export function useDynamicFeeLabel(currentLpFeePips: number | undefined): {
  label: string
  hasCurrentFee: boolean
} {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()

  if (currentLpFeePips === undefined) {
    return { label: t('common.dynamic'), hasCurrentFee: false }
  }
  return { label: formatPercent(currentLpFeePips / BIPS_BASE, CURRENT_FEE_MAX_DECIMALS), hasCurrentFee: true }
}

export function DynamicFeeIcon(): JSX.Element {
  return <Lightning color="$neutral2" size="$icon.12" />
}

export function DynamicFeeTooltipContent({ hasCurrentFee }: { hasCurrentFee: boolean }): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex gap="$spacing4">
      {hasCurrentFee ? (
        <Text variant="body4" color="$neutral2">
          {t('fee.dynamic.current')}
        </Text>
      ) : null}
      <Text variant="body4" color="$neutral1">
        {t('fee.dynamic.tooltip')}
      </Text>
    </Flex>
  )
}
