import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { isWeb, Text, TouchableArea, useSporeColors } from 'ui/src'
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
        hideIcon: true,
        backgroundIconColor: colors.surface2.get(),
        caption,
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
