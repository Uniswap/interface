import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { isWeb } from 'ui/src'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TokenFeeInfo, getFeeSeverity } from 'uniswap/src/features/transactions/TransactionDetails/FeeOnTransferFee'

export function FeeOnTransferWarning({ children, feeInfo }: PropsWithChildren<{ feeInfo: TokenFeeInfo }>): JSX.Element {
  const { t } = useTranslation()
  const { severity } = getFeeSeverity(feeInfo.fee)
  const caption = t('swap.warning.feeOnTransfer.message')
  const title = t('swap.warning.feeOnTransfer.title')

  return (
    <WarningInfo
      infoButton={
        <LearnMoreLink
          textVariant={isWeb ? 'buttonLabel3' : undefined}
          url={uniswapUrls.helpArticleUrls.feeOnTransferHelp}
        />
      }
      modalProps={{
        caption,
        rejectText: t('common.button.close'),
        icon: <WarningIcon heroIcon severity={severity} size="$icon.24" />,
        modalName: ModalName.FOTInfo,
        title,
        rejectButtonTheme: 'tertiary',
        backgroundIconColor: false,
      }}
      tooltipProps={{
        text: caption,
        title,
        placement: 'top',
      }}
    >
      {children}
    </WarningInfo>
  )
}
