import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { isWeb, useSporeColors } from 'ui/src'
import { MoneyBillSend } from 'ui/src/components/icons/MoneyBillSend'
import { iconSizes } from 'ui/src/theme'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function FeeOnTransferWarning({ children }: PropsWithChildren): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

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
        backgroundIconColor: colors.DEP_magentaDark.val,
        caption,
        closeText: t('common.button.close'),
        icon: (
          <MoneyBillSend
            color="$magentaVibrant"
            // @ts-expect-error TODO(MOB-1571): this token is the only one that doesn't use same width/height, overriding type here as it will pass through and work
            height={iconSizes.icon20}
            width={iconSizes.icon24}
          />
        ),

        modalName: ModalName.FOTInfo,
        title,
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
