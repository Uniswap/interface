import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { ReactComponent as UniswapLogo } from 'assets/svg/uniswap_app_logo.svg'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Magic } from 'ui/src/components/icons/Magic'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'

type LPIncentiveFeeStatTooltipProps = {
  currency0Amount: CurrencyAmount<Currency>
  currency1Amount: CurrencyAmount<Currency>
  totalApr?: number
  poolApr?: number
  lpIncentiveRewardApr?: number
}

function LPIncentiveFeeStatTooltip({
  currency0Amount,
  currency1Amount,
  poolApr,
  lpIncentiveRewardApr,
  totalApr,
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
    >
      <TooltipRow>
        <TooltipLabel
          icon={<DoubleCurrencyLogo currencies={[currency0Amount?.currency, currency1Amount?.currency]} size={16} />}
          label={t('pool.aprText')}
        />
        <Text variant="body4" color="$neutral1">
          {displayPoolApr}
        </Text>
      </TooltipRow>
      <TooltipRow>
        <TooltipLabel
          icon={
            <Flex
              row
              gap="$spacing4"
              alignItems="center"
              justifyContent="center"
              backgroundColor="white"
              borderRadius="$roundedFull"
              width="$spacing16"
              height="$spacing16"
            >
              <UniswapLogo width={12} height={12} />
            </Flex>
          }
          label={t('pool.rewardAPR')}
        />
        <Text variant="body4" color="$neutral1">
          {displayRewardApr}
        </Text>
      </TooltipRow>
      <TooltipRow backgroundColor="$accent2" borderBottomLeftRadius="$rounded6" borderBottomRightRadius="$rounded6">
        <TooltipLabel icon={<Magic size="$icon.16" color="$accent1" />} label={t('pool.totalAPR')} color="$accent1" />
        <Text variant="body4" color="$accent1">
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
}

const TooltipRow = ({
  children,
  backgroundColor,
  borderBottomLeftRadius,
  borderBottomRightRadius,
}: TooltipRowProps) => (
  <Flex
    row
    justifyContent="space-between"
    alignItems="center"
    px="$spacing8"
    height="$spacing24"
    gap="$spacing4"
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
}

const TooltipLabel = ({ icon, label, color = '$neutral2' }: TooltipLabelProps) => (
  <Flex row alignItems="center" gap="$spacing6">
    {icon}
    <Text variant="body4" color={color}>
      {label}
    </Text>
  </Flex>
)
