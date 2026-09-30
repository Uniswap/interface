import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'

/**
 * Which surface is asking. Portfolio totals rewards across every pool, so it describes them
 * differently; exported so callers name the same axis rather than mapping onto it.
 */
export type LpIncentivesInfoVariant = 'positions' | 'portfolio'

/**
 * The info affordance beside an LP-incentive rewards total: what administers the rewards, or why the
 * fetch failed, plus a Learn more link. One component behind the positions chip, the rewards card
 * and the portfolio sidebar card, which each carried their own copy of it.
 *
 * Whether it appears at all stays with the caller — the three surfaces gate on different things
 * (loading and presence, viewport, a zero balance) and none of that belongs to the tooltip.
 */
export function LpIncentivesInfoTooltip({
  hasError,
  variant = 'positions',
  stopPropagation = false,
}: {
  hasError: boolean
  variant?: LpIncentivesInfoVariant
  /** For triggers inside a pressable row, so opening the tooltip doesn't also activate the row. */
  stopPropagation?: boolean
}): JSX.Element {
  const { t } = useTranslation()

  const icon = <InfoCircleFilled color="$neutral3" size="$icon.16" />

  return (
    <InfoTooltip
      placement="top"
      trigger={
        <TouchableArea
          testID={TestID.LpIncentivesInfoTooltip}
          onPress={stopPropagation ? (e) => e.stopPropagation() : undefined}
        >
          {icon}
        </TouchableArea>
      }
      text={
        <Flex gap="$spacing4">
          <Text variant="body4" color="$neutral1">
            {hasError
              ? t('pool.incentives.yourRewards.error.description')
              : variant === 'portfolio'
                ? t('pool.incentives.administeredRewards.portfolio')
                : t('pool.incentives.administeredRewards')}
          </Text>
          {/* No Learn more on the error copy: it explains a failed fetch, not the programme. */}
          {!hasError && (
            <Trace logPress eventOnTrigger={UniswapEventName.LpIncentiveLearnMoreCtaClicked}>
              <LearnMoreLink
                textVariant="buttonLabel4"
                textColor="$neutral2"
                url={UniswapHelpUrls.articles.lpIncentiveInfo}
              />
            </Trace>
          )}
        </Flex>
      }
    />
  )
}
