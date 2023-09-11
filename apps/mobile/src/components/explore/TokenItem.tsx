import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { useExploreTokenContextMenu } from 'src/components/explore/hooks'
import { Box } from 'src/components/layout'
import { AnimatedFlex, Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { TokenMetadata } from 'src/components/tokens/TokenMetadata'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName, SectionName } from 'src/features/telemetry/constants'
import { formatNumber, formatUSDPrice, NumberType } from 'utilities/src/format/format'
import { TokenLogo } from 'wallet/src/components/CurrencyLogo/TokenLogo'
import { RelativeChange } from 'wallet/src/components/text/RelativeChange'
import { ChainId } from 'wallet/src/constants/chains'
import { TokenMetadataDisplayType } from 'wallet/src/features/wallet/types'
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

  const getMetadataSubtitle = (): string | undefined => {
    switch (metadataDisplayType) {
      case TokenMetadataDisplayType.MarketCap:
        return t('{{num}} MCap', { num: formatNumber(marketCap, NumberType.FiatTokenStats) })
      case TokenMetadataDisplayType.Volume:
        return t('{{num}} Vol', { num: formatNumber(volume24h, NumberType.FiatTokenStats) })
      case TokenMetadataDisplayType.TVL:
        return t('{{num}} TVL', {
          num: formatNumber(totalValueLocked, NumberType.FiatTokenStats),
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
    address,
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
        onPress={onPress}>
        <AnimatedFlex grow row gap="spacing12" px="spacing24" py="spacing8">
          <Flex centered row gap="spacing4" overflow="hidden">
            {index !== undefined && (
              <Box minWidth={16}>
                <Text color="neutral2" variant="buttonLabelMicro">
                  {index + 1}
                </Text>
              </Box>
            )}
            <TokenLogo symbol={symbol} url={logoUrl} />
          </Flex>
          <Flex shrink gap="spacing2">
            <Text numberOfLines={1} variant="bodyLarge">
              {name}
            </Text>
            <Text color="neutral2" numberOfLines={1} variant="subheadSmall">
              {getMetadataSubtitle()}
            </Text>
          </Flex>
          <Flex grow row alignItems="center" justifyContent="flex-end">
            <TokenMetadata>
              <Text lineHeight={24} variant="bodyLarge">
                {formatUSDPrice(price)}
              </Text>
              <RelativeChange change={pricePercentChange24h} variant="bodySmall" />
            </TokenMetadata>
          </Flex>
        </AnimatedFlex>
      </TouchableArea>
    </ContextMenu>
  )
})
