import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { Icons, isWeb, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { WarningInfo } from 'wallet/src/components/modals/WarningModal/WarningInfo'
import { LearnMoreLink } from 'wallet/src/components/text/LearnMoreLink'
import { ModalName } from 'wallet/src/telemetry/constants'

export function FeeOnTransferWarning({ children }: PropsWithChildren): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const caption = t('swap.warning.feeOnTransfer.message')
  const title = t('swap.warning.feeOnTransfer.title')

  return (
    <WarningInfo
      infoButton={
        <LearnMoreLink
          textVariant={isWeb ? 'buttonLabel4' : undefined}
          url={uniswapUrls.helpArticleUrls.feeOnTransferHelp}
        />
      }
      modalProps={{
        backgroundIconColor: colors.DEP_magentaDark.val,
        caption,
        closeText: t('common.button.close'),
        icon: (
          <Icons.MoneyBillSend
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
      }}>
      {children}
    </WarningInfo>
  )
}
