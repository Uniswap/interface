import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { useExploreTokenContextMenu } from 'src/components/explore/hooks'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { TokenMetadata } from 'src/components/tokens/TokenMetadata'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { disableOnPress } from 'src/utils/disableOnPress'
import { AnimatedFlex, Flex, Text, TouchableArea } from 'ui/src'
import { NumberType } from 'utilities/src/format/types'
import { TokenLogo } from 'wallet/src/components/CurrencyLogo/TokenLogo'
import { RelativeChange } from 'wallet/src/components/text/RelativeChange'
import { ChainId } from 'wallet/src/constants/chains'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { TokenMetadataDisplayType } from 'wallet/src/features/wallet/types'
import { SectionName } from 'wallet/src/telemetry/constants'
import {
  buildCurrencyId,
  buildNativeCurrencyId,
  currencyIdToAddress,
  currencyIdToChain,
} from 'wallet/src/utils/currencyId'

export type TokenItemData = {
  name: string
  logoUrl: string
  chainId: ChainId
  address: Address | null
  symbol: string
  price?: number
  marketCap?: number
  pricePercentChange24h?: number
  volume24h?: number
  totalValueLocked?: number
}

interface TokenItemProps {
  tokenItemData: TokenItemData
  index: number
  metadataDisplayType?: TokenMetadataDisplayType
}

export const TokenItem = memo(function _TokenItem({
  tokenItemData,
  index,
  metadataDisplayType,
}: TokenItemProps) {
  const { t } = useTranslation()
  const tokenDetailsNavigation = useTokenDetailsNavigation()
  const { convertFiatAmountFormatted } = useLocalizationContext()

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
  const totalValueLockedFormatted = convertFiatAmountFormatted(
    totalValueLocked,
    NumberType.FiatTokenDetails
  )

  const getMetadataSubtitle = (): string | undefined => {
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
    }
  }

  const onPress = (): void => {
    tokenDetailsNavigation.preload(_currencyId)
    tokenDetailsNavigation.navigate(_currencyId)
    sendMobileAnalyticsEvent(MobileEventName.ExploreTokenItemSelected, {
      address: currencyIdToAddress(_currencyId),
      chain: currencyIdToChain(_currencyId) as number,
      name,
      position: index + 1,
    })
  }

  const { menuActions, onContextMenuPress } = useExploreTokenContextMenu({
    chainId,
    currencyId: _currencyId,
    analyticsSection: SectionName.ExploreTopTokensSection,
  })

  return (
    <ContextMenu actions={menuActions} onPress={onContextMenuPress}>
      <TouchableArea
        hapticFeedback
        hapticStyle={ImpactFeedbackStyle.Light}
        testID={`token-item-${name}`}
        onLongPress={disableOnPress}
        onPress={onPress}>
        <AnimatedFlex grow row gap="$spacing12" px="$spacing24" py="$spacing8">
          <Flex centered row gap="$spacing4" overflow="hidden">
            {index !== undefined && (
              <Flex minWidth={16}>
                <Text color="$neutral2" variant="buttonLabel4">
                  {index + 1}
                </Text>
              </Flex>
            )}
            <TokenLogo name={name} symbol={symbol} url={logoUrl} />
          </Flex>
          <Flex shrink gap="$spacing2">
            <Text numberOfLines={1} variant="body1">
              {name}
            </Text>
            <Text color="$neutral2" numberOfLines={1} variant="subheading2">
              {getMetadataSubtitle()}
            </Text>
          </Flex>
          <Flex grow row alignItems="center" justifyContent="flex-end">
            <TokenMetadata>
              <Text lineHeight={24} variant="body1">
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
