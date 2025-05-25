import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { Text, TouchableArea, isWeb, useSporeColors } from 'ui/src'
import { AlertCircleFilled } from 'ui/src/components/icons/AlertCircleFilled'
import { zIndexes } from 'ui/src/theme'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
import { openUri } from 'uniswap/src/utils/linking'

export function SwapFeeWarning({ noFee, children }: PropsWithChildren<{ noFee: boolean }>): JSX.Element {
  const priceUXEnabled = usePriceUXEnabled()
  const colors = useSporeColors()
  const { t } = useTranslation()

  const onPressLearnMore = async (): Promise<void> => {
    await openUri(uniswapUrls.helpArticleUrls.swapFeeInfo)
  }

  const caption = priceUXEnabled
    ? t('fee.uniswap.description')
    : noFee
      ? t('swap.warning.uniswapFee.message.default')
      : t('swap.warning.uniswapFee.message.included')

  return (
    <WarningInfo
      infoButton={
        <TouchableArea onPress={onPressLearnMore}>
          <Text
            color={priceUXEnabled && isWeb ? '$neutral1' : '$accent1'}
            variant={isWeb ? (priceUXEnabled ? 'buttonLabel4' : 'body4') : 'buttonLabel2'}
          >
            {t('common.button.learn')}
          </Text>
        </TouchableArea>
      }
      modalProps={{
        icon: <AlertCircleFilled color="$neutral1" size="$icon.20" />,
        backgroundIconColor: colors.surface2.get(),
        captionComponent: (
          <Text color="$neutral2" textAlign={isWeb ? 'left' : 'center'} variant={isWeb ? 'body4' : 'body2'}>
            {caption}
          </Text>
        ),
        rejectText: t('common.button.close'),
        modalName: ModalName.NetworkFeeInfo,
        severity: WarningSeverity.None,
        title: t('swap.warning.uniswapFee.title'),
        zIndex: zIndexes.popover,
      }}
      tooltipProps={{ text: caption, placement: 'top' }}
      analyticsTitle="Swap fee"
    >
      {children}
    </WarningInfo>
  )
}
