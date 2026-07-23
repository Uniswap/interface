import { useTranslation } from 'react-i18next'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { EarnInfoPopover } from 'uniswap/src/features/earn/EarnInfoPopover'
import { MORPHO_FAQ_URL } from 'uniswap/src/features/earn/utils'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

interface WithdrawLiquidityInfoPopoverProps {
  currencyInfo: CurrencyInfo | null | undefined
  depositedBalanceFormatted: string
  withdrawableBalanceFormatted: string
}

export function WithdrawLiquidityInfoPopover({
  currencyInfo,
  depositedBalanceFormatted,
  withdrawableBalanceFormatted,
}: WithdrawLiquidityInfoPopoverProps): JSX.Element {
  const { t } = useTranslation()
  const currency = currencyInfo?.currency
  const symbol = currency?.symbol ?? ''

  const renderIcon = (): JSX.Element => (
    <TokenLogo
      url={currencyInfo?.logoUrl}
      size={iconSizes.icon16}
      chainId={currency?.chainId}
      symbol={symbol}
      name={currency?.name}
    />
  )

  return (
    <EarnInfoPopover
      title={t('explore.earn.withdraw.lowLiquidity.availableBalance')}
      caption={t('explore.earn.withdraw.lowLiquidity.tooltip')}
      detailRows={[
        {
          label: t('common.totalBalance'),
          value: depositedBalanceFormatted,
          icon: renderIcon(),
        },
        {
          label: t('explore.earn.withdraw.lowLiquidity.availableNow'),
          value: withdrawableBalanceFormatted,
          icon: renderIcon(),
        },
      ]}
      learnMore={{ text: t('common.button.learn'), url: MORPHO_FAQ_URL }}
      modalName={ModalName.EarnWithdrawInfo}
    />
  )
}
