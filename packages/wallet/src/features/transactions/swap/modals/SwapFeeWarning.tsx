import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { Text, TouchableArea, isWeb, useSporeColors } from 'ui/src'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { WarningInfo } from 'wallet/src/components/modals/WarningModal/WarningInfo'
import { WarningSeverity } from 'wallet/src/features/transactions/WarningModal/types'
import { ModalName } from 'wallet/src/telemetry/constants'
import { openUri } from 'wallet/src/utils/linking'

export function SwapFeeWarning({
  noFee,
  children,
}: PropsWithChildren<{ noFee: boolean }>): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const onPressLearnMore = async (): Promise<void> => {
    await openUri(uniswapUrls.helpArticleUrls.swapFeeInfo)
  }

  const caption = noFee
    ? t('swap.warning.uniswapFee.message.default')
    : t('swap.warning.uniswapFee.message.included')

  return (
    <WarningInfo
      infoButton={
        <TouchableArea onPress={onPressLearnMore}>
          <Text color="$magentaVibrant" variant={isWeb ? 'buttonLabel4' : 'buttonLabel3'}>
            {t('common.button.learn')}
          </Text>
        </TouchableArea>
      }
      modalProps={{
        hideIcon: true,
        backgroundIconColor: colors.surface2.get(),
        caption,
        closeText: t('common.button.close'),
        modalName: ModalName.NetworkFeeInfo,
        severity: WarningSeverity.None,
        title: t('swap.warning.uniswapFee.title'),
      }}
      tooltipProps={{ text: caption, placement: 'top' }}>
      {children}
    </WarningInfo>
  )
}
