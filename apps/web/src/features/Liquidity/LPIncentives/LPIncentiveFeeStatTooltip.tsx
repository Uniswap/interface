import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Magic } from 'ui/src/components/icons/Magic'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { CurrencyLogo } from '~/components/Logo/CurrencyLogo'
import { LP_INCENTIVES_REWARD_TOKEN } from '~/features/Liquidity/LPIncentives/constants'

type LPIncentiveFeeStatTooltipProps = {
  currency0Info: Maybe<CurrencyInfo>
  currency1Info: Maybe<CurrencyInfo>
  totalApr?: number
  poolApr?: number
  lpIncentiveRewardApr?: number
  apr1d?: number
  apr7d?: number
  apr30d?: number
  chainId?: UniverseChainId
}

export function LPIncentiveFeeStatTooltip({
  currency0Info,
  currency1Info,
  poolApr,
  lpIncentiveRewardApr,
  totalApr,
  apr1d,
  apr7d,
  apr30d,
  chainId = UniverseChainId.Mainnet,
}: LPIncentiveFeeStatTooltipProps) {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  // Presence checks match the row gating (`!== undefined`) so a genuine 0% renders as 0%,
  // consistent with the timeframe rows.
  const displayPoolApr = poolApr !== undefined ? formatPercent(poolApr) : '-'
  const displayRewardApr = lpIncentiveRewardApr !== undefined ? formatPercent(lpIncentiveRewardApr) : '-'
  const displayTotalApr = totalApr !== undefined ? formatPercent(totalApr) : '-'
  // Reward rows are only meaningful on LP-incentive surfaces; plain fee-APR surfaces omit them.
  const showRewardRows = lpIncentiveRewardApr !== undefined
  // The 24H average row supersedes the Pool APR row (design: Philippe Cao), so the latter only
  // renders on surfaces without windowed day-data (e.g. the Explore pools table).
  const hasTimeframeRows = apr1d !== undefined || apr7d !== undefined || apr30d !== undefined

  return (
    <Flex flexDirection="column" gap="$spacing4" id="boosted-apr-tooltip" py="$spacing4" px="$spacing4" maxWidth={256}>
      {!hasTimeframeRows && (
        <TooltipRow>
          <TooltipLabel
            icon={
              <SplitLogo
                inputCurrencyInfo={currency0Info}
                outputCurrencyInfo={currency1Info}
                size={12}
                chainId={chainId}
              />
            }
            label={t('pool.aprText')}
          />
          <Text variant="body4" color="$neutral1" flexShrink={0}>
            {displayPoolApr}
          </Text>
        </TooltipRow>
      )}
      {apr1d !== undefined && <TimeframeAprRow label={t('pool.apr.average.24h')} apr={apr1d} />}
      {apr7d !== undefined && <TimeframeAprRow label={t('pool.apr.average.7d')} apr={apr7d} />}
      {apr30d !== undefined && <TimeframeAprRow label={t('pool.apr.average.30d')} apr={apr30d} />}
      {showRewardRows && (
        <>
          <TooltipRow>
            <TooltipLabel
              icon={<CurrencyLogo currency={LP_INCENTIVES_REWARD_TOKEN} size={12} />}
              label={t('pool.rewardAPR')}
            />
            <Text variant="body4" color="$neutral1" flexShrink={0}>
              {displayRewardApr}
            </Text>
          </TooltipRow>
          <TooltipRow
            backgroundColor="$accent2"
            borderBottomLeftRadius="$rounded6"
            borderBottomRightRadius="$rounded6"
            alignItems="center"
          >
            <TooltipLabel
              icon={<Magic size="$icon.12" color="$accent1" />}
              label={t('pool.totalAPR')}
              color="$accent1"
              alignItems="center"
            />
            <Text variant="body4" color="$accent1" flexShrink={0}>
              {displayTotalApr}
            </Text>
          </TooltipRow>
        </>
      )}
    </Flex>
  )
}

const TimeframeAprRow = ({ label, apr }: { label: string; apr: number }) => {
  const { formatPercent } = useLocalizationContext()

  return (
    <TooltipRow>
      <TooltipLabel label={label} />
      <Text variant="body4" color="$neutral1" flexShrink={0}>
        {formatPercent(apr)}
      </Text>
    </TooltipRow>
  )
}

type TooltipRowProps = {
  children: React.ReactNode
  backgroundColor?: string
  borderBottomLeftRadius?: string
  borderBottomRightRadius?: string
  alignItems?: 'flex-start' | 'center'
}

// Rows center their content so the minHeight slack splits evenly — combined with the
// container's symmetric vertical padding this keeps the top/bottom margins equal
// whichever row type ends the tooltip.
const TooltipRow = ({
  children,
  backgroundColor,
  borderBottomLeftRadius,
  borderBottomRightRadius,
  alignItems = 'center',
}: TooltipRowProps) => (
  <Flex
    row
    justifyContent="space-between"
    alignItems={alignItems}
    px="$spacing8"
    minHeight="$spacing24"
    gap="$spacing8"
    backgroundColor={backgroundColor}
    borderBottomLeftRadius={borderBottomLeftRadius}
    borderBottomRightRadius={borderBottomRightRadius}
  >
    {children}
  </Flex>
)

type TooltipLabelProps = {
  label: string
  icon?: React.ReactNode
  color?: string
  alignItems?: 'flex-start' | 'center'
}

const TooltipLabel = ({ icon, label, color = '$neutral2', alignItems = 'flex-start' }: TooltipLabelProps) => (
  <Flex row alignItems={alignItems} gap="$spacing6" flex={1} maxWidth="80%">
    <Flex pt="$spacing2" flexShrink={0}>
      {icon}
    </Flex>
    <Text variant="body4" color={color} flex={1} numberOfLines={0}>
      {label}
    </Text>
  </Flex>
)
