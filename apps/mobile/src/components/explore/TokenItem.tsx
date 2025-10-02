import React, { memo, ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, LayoutRectangle } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'
import { useExploreTokenContextMenu } from 'src/components/explore/hooks'
import { TokenItemChart } from 'src/components/explore/TokenItemChart'
import { TokenItemData } from 'src/components/explore/TokenItemData'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { TokenMetadata } from 'src/components/tokens/TokenMetadata'
import { Flex, FlexProps, Text, TouchableArea, useSporeColors } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { spacing } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { MobileEventName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  buildCurrencyId,
  buildNativeCurrencyId,
  currencyIdToAddress,
  currencyIdToChain,
} from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { noop } from 'utilities/src/react/noop'
import { TokenMetadataDisplayType } from 'wallet/src/features/wallet/types'

interface TokenItemProps {
  tokenItemData: TokenItemData
  index: number
  eventName: MobileEventName.ExploreTokenItemSelected | MobileEventName.HomeExploreTokenItemSelected
  metadataDisplayType?: TokenMetadataDisplayType
  containerProps?: FlexProps
  hideNumberedList?: boolean
  priceWrapperProps?: FlexProps
  showChart?: boolean
  overlay?: ReactNode
  onPriceWrapperLayout?: (layout: LayoutRectangle) => void
}

export const TokenItem = memo(function _TokenItem({
  tokenItemData,
  index,
  metadataDisplayType,
  containerProps,
  eventName,
  hideNumberedList,
  priceWrapperProps,
  showChart,
  overlay,
  onPriceWrapperLayout,
}: TokenItemProps) {
  const { t } = useTranslation()
  const tokenDetailsNavigation = useTokenDetailsNavigation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const colors = useSporeColors()

  const {
    name,
    logoUrl,
    chainId,
    address,
    symbol,
    price,
    marketCap,
    pricePercentChange24h,
    volume24h,
    totalValueLocked,
  } = tokenItemData
  const _currencyId = address ? buildCurrencyId(chainId, address) : buildNativeCurrencyId(chainId)
  const marketCapFormatted = convertFiatAmountFormatted(marketCap, NumberType.FiatTokenDetails)
  const volume24hFormatted = convertFiatAmountFormatted(volume24h, NumberType.FiatTokenDetails)
  const totalValueLockedFormatted = convertFiatAmountFormatted(totalValueLocked, NumberType.FiatTokenDetails)

  const metadataSubtitle = useMemo((): string | undefined => {
    switch (metadataDisplayType) {
      case TokenMetadataDisplayType.MarketCap:
        return t('explore.tokens.metadata.marketCap', { number: marketCapFormatted })
      case TokenMetadataDisplayType.Volume:
        return t('explore.tokens.metadata.volume', { number: volume24hFormatted })
      case TokenMetadataDisplayType.TVL:
        return t('explore.tokens.metadata.totalValueLocked', {
          number: totalValueLockedFormatted,
        })
      case TokenMetadataDisplayType.Symbol:
        return symbol
      default:
        return undefined
    }
  }, [metadataDisplayType, marketCapFormatted, volume24hFormatted, totalValueLockedFormatted, symbol, t])

  const onLayout = useEvent((e: LayoutChangeEvent): void => {
    onPriceWrapperLayout?.(e.nativeEvent.layout)
  })

  const onPress = useEvent((): void => {
    tokenDetailsNavigation.preload(_currencyId)
    tokenDetailsNavigation.navigate(_currencyId)
    sendAnalyticsEvent(eventName, {
      address: currencyIdToAddress(_currencyId),
      chain: currencyIdToChain(_currencyId) as number,
      name: tokenItemData.name,
      position: index + 1,
    })
  })

  const { menuActions, onContextMenuPress } = useExploreTokenContextMenu({
    chainId,
    currencyId: _currencyId,
    analyticsSection: SectionName.ExploreTopTokensSection,
  })

  return (
    <ContextMenu actions={menuActions} previewBackgroundColor={colors.surface1.val} onPress={onContextMenuPress}>
      <TouchableArea testID={`token-item-${name}`} onLongPress={noop} onPress={onPress}>
        {overlay}
        <AnimatedFlex grow row alignItems="center" gap="$spacing12" px="$spacing24" py="$spacing8" {...containerProps}>
          <Flex centered row gap="$spacing4">
            {!hideNumberedList && (
              <Flex minWidth={spacing.spacing16} mr="$spacing8">
                <Text color="$neutral2" variant="body3">
                  {index + 1}
                </Text>
              </Flex>
            )}
            <TokenLogo chainId={chainId} name={name} symbol={symbol} url={logoUrl} />
          </Flex>
          <Flex fill shrink gap="$spacing2">
            <Text numberOfLines={1} variant="body1">
              {name}
            </Text>
            <Text color="$neutral2" numberOfLines={1} testID="token-item/metadata-subtitle" variant="subheading2">
              {metadataSubtitle}
            </Text>
          </Flex>
          {showChart && <TokenItemChart height={20} tokenItemData={tokenItemData} width={40} />}
          <Flex row alignItems="center" justifyContent="flex-end" onLayout={onLayout} {...priceWrapperProps}>
            <TokenMetadata>
              <Text lineHeight={24} testID="token-item/price" variant="body1">
                {convertFiatAmountFormatted(price, NumberType.FiatTokenPrice)}
              </Text>
              <RelativeChange change={pricePercentChange24h} variant="body2" />
            </TokenMetadata>
          </Flex>
        </AnimatedFlex>
      </TouchableArea>
    </ContextMenu>
  )
})
