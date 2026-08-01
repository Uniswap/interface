import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'

export interface NetworkCostRowProps {
  gasFeeUsd: string | undefined
  enableCustomGasFeeEntry: boolean
  hasOverrides: boolean
  hasWarning: boolean
  /** When true, renders the "Includes smart wallet activation" subtitle below
   *  the row, matching the default `<NetworkFee />` flow. Defaults to false. */
  includesDelegation?: boolean
  /** When true (alongside `includesDelegation`), the subtitle reads
   *  "Includes smart wallet update" — the delegation is a Calibur
   *  re-delegation rather than a first-time activation. Defaults to false. */
  includesDelegationUpgrade?: boolean
  /** When `pressable` is true (default), the row is wrapped in `TouchableArea`
   *  and renders a trailing chevron. When false, the row is display-only —
   *  no chevron, no `onPress`. */
  pressable?: boolean
  onPress?: () => void
}

/**
 * A compact row showing the network cost summary used on swap-review and
 * dapp-transaction surfaces. Renders one of three variants:
 *
 *  - Neutral value only: when `enableCustomGasFeeEntry` is false. The wallet
 *    is in auto mode so no annotation is needed.
 *  - Auto pill + neutral value: when `enableCustomGasFeeEntry` is true but
 *    no per-tx overrides have been saved yet — the wallet preference is
 *    Custom, but behavior is still auto for this tx, so we surface that to
 *    the user.
 *  - Amber alert icon + amber value: when `enableCustomGasFeeEntry` is true,
 *    overrides are present, AND the saved overrides trigger a warning
 *    (e.g. priority fee too low, max base fee underpriced, etc.).
 *
 * Set `pressable={false}` for surfaces that are display-only (e.g. swap review,
 * where the editor entry point lives on the swap form). With `pressable` true
 * (the default) the row reads as tappable and `onPress` is invoked on tap.
 */
export function NetworkCostRow({
  gasFeeUsd,
  enableCustomGasFeeEntry,
  hasOverrides,
  hasWarning,
  includesDelegation = false,
  includesDelegationUpgrade = false,
  pressable = true,
  onPress,
}: NetworkCostRowProps): JSX.Element {
  const { t } = useTranslation()
  const showAutoPill = enableCustomGasFeeEntry && !hasOverrides
  const showWarning = enableCustomGasFeeEntry && hasOverrides && hasWarning

  const content = (
    <Flex gap="$spacing4">
      <Flex row alignItems="center" justifyContent="space-between">
        <Text variant="body3" color="$neutral2">
          {t('gas.override.title')}
        </Text>
        <Flex row alignItems="center" gap="$spacing6">
          {showAutoPill && (
            <Flex centered backgroundColor="$surface3" borderRadius="$rounded6" height={20} px="$spacing8">
              <Text color="$neutral1" variant="buttonLabel4" lineHeight={16}>
                {t('common.auto')}
              </Text>
            </Flex>
          )}
          {showWarning && (
            <AlertTriangleFilled testID="network-cost-warning-icon" color="$statusWarning" size="$icon.16" />
          )}
          <Text variant="body3" color={showWarning ? '$statusWarning' : '$neutral1'}>
            {gasFeeUsd ?? '—'}
          </Text>
          {pressable && <RotatableChevron color="$neutral3" direction="right" size="$icon.16" />}
        </Flex>
      </Flex>
      {includesDelegation && (
        <Text color="$neutral3" variant="body4">
          {includesDelegationUpgrade
            ? t('swap.warning.networkFee.includesSmartWalletUpdate')
            : t('swap.warning.networkFee.includesDelegation')}
        </Text>
      )}
    </Flex>
  )

  if (!pressable) {
    return content
  }
  return <TouchableArea onPress={onPress}>{content}</TouchableArea>
}
