import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { isWebPlatform } from '@universe/environment'
import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { InfoTooltipProps } from 'uniswap/src/components/tooltip/InfoTooltipProps'
import { bpsToPercent } from 'uniswap/src/features/fees/feeUnits'
import type { FeeBreakdown } from 'uniswap/src/features/fees/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'

// Matches MAX_FEE_TIER_DECIMALS used across the existing fee surfaces.
const FEE_DISPLAY_MAX_DECIMALS = 4

export interface FeeDisplayProps {
  /**
   * Fee breakdown from the engine (`getFeeBreakdown`). This component never recomputes fees.
   * Omit it (flag off / dynamic tier / non-fee content) and the wrapper is transparent — it just
   * renders `children` with no tooltip.
   */
  feeBreakdown?: FeeBreakdown
  /** Tooltip placement for the hover breakdown (web only). */
  placement?: InfoTooltipProps['placement']
}

/**
 * Cross-version fee breakdown on hover. Wraps a caller-rendered fee headline (`children`) and, on
 * web, reveals the LP fee, protocol fee, and all-in total when hovered. It never renders the
 * headline itself — the caller owns that text and its styling, so the number matches its
 * surroundings and stays identical whether the feature is on or off; this component only decorates
 * it with the breakdown. Transparent (returns `children` untouched) when there is no breakdown,
 * nothing to reveal (v4 fees-off, or the protocol fee is unavailable — e.g. hooked pools, which the
 * FE never computes), or on native (no InfoTooltip implementation). Driven entirely by the fee
 * engine: it handles the additive (v4) vs subtractive (v2/v3) semantics and suppresses the tooltip
 * for the fees-off and unavailable states.
 */
export function FeeDisplay({
  feeBreakdown,
  placement = 'top',
  children,
}: PropsWithChildren<FeeDisplayProps>): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()

  const formatBps = (bps: number): string => formatPercent(bpsToPercent(bps), FEE_DISPLAY_MAX_DECIMALS)

  // No breakdown to reveal, or native (no InfoTooltip) → transparent wrapper.
  if (!feeBreakdown || !isWebPlatform) {
    return <>{children}</>
  }

  const { lpFeeBps, protocolFeeBps, effectiveFeeBps, version } = feeBreakdown
  // v4 fees add on top of the LP fee; v2/v3 fees are carved out of it (the tier IS the effective rate).
  const isAdditive = version === ProtocolVersion.V4
  // Nothing to reveal → render the bare headline with no tooltip:
  // - protocol fee unavailable (`undefined`, not a served 0): the FE never computes fees, so a pool
  //   with no served value (e.g. a hooked v4 pool) has no breakdown to show — a bare "unavailable"
  //   note adds nothing, so we drop the tooltip entirely.
  // - v4 fees-off / min-resolution: the LP fee already equals the effective rate.
  if (protocolFeeBps === undefined || (isAdditive && protocolFeeBps === 0)) {
    return <>{children}</>
  }

  return (
    <InfoTooltip
      placement={placement}
      maxWidth={260}
      trigger={children}
      text={
        <Flex gap="$spacing8">
          <Flex gap="$spacing4">
            <FeeBreakdownRow label={t('fee.breakdown.lp')} value={formatBps(lpFeeBps)} />
            <FeeBreakdownRow label={t('fee.breakdown.protocol')} value={formatBps(protocolFeeBps)} />
            <FeeBreakdownRow emphasize label={t('fee.breakdown.total')} value={formatBps(effectiveFeeBps)} />
          </Flex>
          <Text color="$neutral2" variant="body4">
            {isAdditive ? t('fee.breakdown.explainer') : t('fee.breakdown.explainerSubtractive')}
          </Text>
        </Flex>
      }
    />
  )
}

function FeeBreakdownRow({
  label,
  value,
  emphasize,
}: {
  label: string
  value: string
  emphasize?: boolean
}): JSX.Element {
  return (
    <Flex row justifyContent="space-between" gap="$spacing16">
      <Text color={emphasize ? '$neutral1' : '$neutral2'} variant="body4">
        {label}
      </Text>
      <Text color="$neutral1" variant="body4">
        {value}
      </Text>
    </Flex>
  )
}
