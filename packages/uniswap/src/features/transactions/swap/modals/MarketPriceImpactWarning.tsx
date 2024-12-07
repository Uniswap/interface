import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { isWeb, Text, TouchableArea, useSporeColors } from 'ui/src'
import { ChartBar } from 'ui/src/components/icons/ChartBar'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { openUri } from 'uniswap/src/utils/linking'

export function MarketPriceImpactWarning({ children }: PropsWithChildren): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const onPressLearnMore = async (): Promise<void> => {
    await openUri(uniswapUrls.helpArticleUrls.swapFeeInfo)
  }

  const caption = t('swap.impactOfTrade')

  return (
    <WarningInfo
      infoButton={
        <TouchableArea onPress={onPressLearnMore}>
          <Text color="$accent1" variant={isWeb ? 'body4' : 'buttonLabel2'}>
            {t('common.button.learn')}
          </Text>
        </TouchableArea>
      }
      modalProps={{
        hideIcon: isWeb,
        icon: <ChartBar color={colors.neutral1.val} size={18} />,
        backgroundIconColor: colors.surface2.get(),
        captionComponent: (
          <Text color="$neutral2" textAlign={isWeb ? 'left' : 'center'} variant={isWeb ? 'body4' : 'body2'}>
            {caption}
          </Text>
        ),
        rejectText: t('common.button.close'),
        modalName: ModalName.NetworkFeeInfo,
        severity: WarningSeverity.None,
        title: t('swap.priceImpact'),
      }}
      tooltipProps={{ text: caption, placement: 'top' }}
    >
      {children}
    </WarningInfo>
  )
}
