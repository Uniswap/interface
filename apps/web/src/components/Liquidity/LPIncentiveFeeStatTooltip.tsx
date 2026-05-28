import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { LP_INCENTIVES_REWARD_TOKEN } from 'components/LpIncentives/constants'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Magic } from 'ui/src/components/icons/Magic'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'

type LPIncentiveFeeStatTooltipProps = {
  currency0Info: Maybe<CurrencyInfo>
  currency1Info: Maybe<CurrencyInfo>
  totalApr?: number
  poolApr?: number
  lpIncentiveRewardApr?: number
  chainId?: UniverseChainId
}

function LPIncentiveFeeStatTooltip({
  currency0Info,
  currency1Info,
  poolApr,
  lpIncentiveRewardApr,
  totalApr,
  chainId = UniverseChainId.Mainnet,
}: LPIncentiveFeeStatTooltipProps) {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const displayPoolApr = poolApr ? formatPercent(poolApr) : '-'
  const displayRewardApr = lpIncentiveRewardApr ? formatPercent(lpIncentiveRewardApr) : '-'
  const displayTotalApr = totalApr ? formatPercent(totalApr) : '-'

  return (
    <Flex
      flexDirection="column"
      gap="$spacing4"
      id="boosted-apr-tooltip"
      paddingTop="$spacing8"
      paddingBottom={5}
      px="$spacing4"
      maxWidth={256}
    >
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
    </Flex>
  )
}

export default LPIncentiveFeeStatTooltip

type TooltipRowProps = {
  children: React.ReactNode
  backgroundColor?: string
  borderBottomLeftRadius?: string
  borderBottomRightRadius?: string
  alignItems?: 'flex-start' | 'center'
}

const TooltipRow = ({
  children,
  backgroundColor,
  borderBottomLeftRadius,
  borderBottomRightRadius,
  alignItems = 'flex-start',
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
