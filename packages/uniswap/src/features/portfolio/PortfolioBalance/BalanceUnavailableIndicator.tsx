import { WalletBalanceCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { isWebPlatform } from '@universe/environment'
import { useTranslation } from 'react-i18next'
import { Flex, Text, Tooltip } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import type { IconSizeTokens } from 'ui/src/theme'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

// Fixed display order for the concatenated label (earn before pools), matching the designs.
const CATEGORY_DISPLAY_ORDER: WalletBalanceCategory[] = [WalletBalanceCategory.EARN_VAULTS, WalletBalanceCategory.POOLS]

/**
 * Builds the "…balances currently unavailable" sentence for the given categories, concatenating names
 * when more than one failed (e.g. "Earn and Pools balances currently unavailable"). Returns `undefined`
 * when no known category is unavailable. Shared by the header tooltip and the mobile portfolio banner.
 */
export function useUnavailableBalancesText(categories: WalletBalanceCategory[]): string | undefined {
  const { t } = useTranslation()

  const labelByCategory: Partial<Record<WalletBalanceCategory, string>> = {
    [WalletBalanceCategory.EARN_VAULTS]: t('explore.earn.title'),
    [WalletBalanceCategory.POOLS]: t('common.pools'),
  }

  const labels = CATEGORY_DISPLAY_ORDER.filter((category) => categories.includes(category))
    .map((category) => labelByCategory[category])
    .filter((label): label is string => label !== undefined)

  if (labels.length === 0) {
    return undefined
  }

  const joinedLabels =
    labels.length === 1
      ? (labels[0] ?? '')
      : t('common.conjunction.and', { first: labels[0] ?? '', second: labels[1] ?? '' })

  return t('portfolio.balances.unavailable', { categories: joinedLabels })
}

/**
 * Warning icon shown next to the portfolio total when one or more (but not all) balance categories
 * failed to load, so the displayed total is a partial sum. On web it carries a tooltip naming the
 * unavailable categories, concatenated (e.g. "Earn and Pools balances currently unavailable").
 */
export function BalanceUnavailableIndicator({
  categories,
  testID = TestID.BalanceUnavailableIndicator,
  message,
  iconSize = '$icon.20',
}: {
  categories: WalletBalanceCategory[]
  testID?: string
  /** Override the category-derived tooltip text (e.g. a chain-specific per-section warning). */
  message?: string
  iconSize?: IconSizeTokens
}): JSX.Element | null {
  const text = useUnavailableBalancesText(categories)

  if (text === undefined) {
    return null
  }

  const icon = (
    <Flex testID={testID}>
      <AlertTriangleFilled color="$neutral2" size={iconSize} />
    </Flex>
  )

  if (!isWebPlatform) {
    return icon
  }

  return (
    <Tooltip placement="top">
      <Tooltip.Trigger>{icon}</Tooltip.Trigger>
      <Tooltip.Content>
        <Text variant="body4" color="$neutral1">
          {message ?? text}
        </Text>
        <Tooltip.Arrow />
      </Tooltip.Content>
    </Tooltip>
  )
}
