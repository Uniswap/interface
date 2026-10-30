import { TradingApi } from '@universe/api'
import { isWebPlatform } from '@universe/environment'
import { zIndexes } from '@universe/mycelium'
import { ChartBar } from '@universe/mycelium/icons/ChartBar'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { PriceDifferenceCaption, PriceDifferenceLearnMoreButton } from '@universe/swap-ui'
import { TFunction } from 'i18next'
import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningInfo, type WarningInfoShell } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { openUri } from 'uniswap/src/utils/linking'

function getPriceDifferenceInfo({ t, routing }: { t: TFunction; routing: TradingApi.Routing }): {
  caption: string
  link: string
} {
  if (isUniswapX({ routing })) {
    return {
      caption: t('swap.impactOfTrade.uniswapx'),
      link: UniswapHelpUrls.articles.uniswapXInfo,
    }
  }
  return {
    caption: t('swap.impactOfTrade'),
    link: UniswapHelpUrls.articles.priceImpact,
  }
}

/** Shell adapter: owns the tooltip/modal; the caption and learn-more content come from swap-ui. */
export function MarketPriceDifferenceWarningModal({
  children,
  routing,
}: PropsWithChildren<{ routing: TradingApi.Routing }>): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const { caption, link } = getPriceDifferenceInfo({ t, routing })
  const openLearnMore = async (): Promise<void> => await openUri({ uri: link })
  // WarningInfo picks the shell; the button is told which one instead of guessing from the platform.
  const renderLearnMoreButton = (shell: WarningInfoShell): JSX.Element => (
    <PriceDifferenceLearnMoreButton container={shell} onPress={openLearnMore} />
  )

  return (
    <WarningInfo
      infoButton={renderLearnMoreButton}
      modalProps={{
        hideIcon: isWebPlatform,
        icon: <ChartBar color="$neutral1" size="$icon.18" />,
        backgroundIconColor: colors.surface2.get(),
        captionComponent: <PriceDifferenceCaption caption={caption} container="modal" />,
        rejectText: t('common.button.close'),
        modalName: ModalName.PriceImpact,
        severity: WarningSeverity.None,
        title: t('swap.priceImpact'),
        zIndex: zIndexes.popover,
      }}
      tooltipProps={{ text: caption, placement: 'top' }}
      analyticsTitle="Price Impact"
    >
      {children}
    </WarningInfo>
  )
}
