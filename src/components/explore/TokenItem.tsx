import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { useAppDispatch } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TokenLogo } from 'src/components/CurrencyLogo/TokenLogo'
import { FavoriteButton } from 'src/components/explore/FavoriteButton'
import { Box } from 'src/components/layout/Box'
import { AnimatedFlex, Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { TokenMetadata } from 'src/components/tokens/TokenMetadata'
import { ChainId } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { TokenMetadataDisplayType } from 'src/features/explore/types'
import { addFavoriteToken, removeFavoriteToken } from 'src/features/favorites/slice'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import { buildCurrencyId, buildNativeCurrencyId } from 'src/utils/currencyId'
import { formatNumber, formatUSDPrice, NumberType } from 'src/utils/format'

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
  index?: number
  metadataDisplayType?: TokenMetadataDisplayType
  isFavorited?: boolean
  isEditing?: boolean
}

export const TokenItem = memo(
  ({ tokenItemData, index, metadataDisplayType, isFavorited, isEditing }: TokenItemProps) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
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

    const toggleFavoriteToken = useCallback(() => {
      if (isFavorited) {
        dispatch(removeFavoriteToken({ currencyId: _currencyId }))
      } else {
        dispatch(addFavoriteToken({ currencyId: _currencyId }))
      }
    }, [_currencyId, dispatch, isFavorited])

    const navigateToSwapSell = useCallback(() => {
      if (!address) return

      const swapFormState: TransactionState = {
        exactCurrencyField: CurrencyField.INPUT,
        exactAmountToken: '0',
        [CurrencyField.INPUT]: {
          address,
          chainId,
          type: AssetType.Currency,
        },
        [CurrencyField.OUTPUT]: null,
      }
      dispatch(openModal({ name: ModalName.Swap, initialState: swapFormState }))
    }, [address, chainId, dispatch])

    const menuActions = useMemo(() => {
      return isFavorited
        ? [
            { title: t('Remove favorite'), systemIcon: 'heart.fill' },
            { title: t('Swap'), systemIcon: 'arrow.2.squarepath' },
          ]
        : [
            { title: 'Favorite token', systemIcon: 'heart' },
            { title: 'Swap', systemIcon: 'arrow.2.squarepath' },
          ]
    }, [isFavorited, t])

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

    const opacity = isFavorited && isEditing ? 0.3 : 1

    return (
      <ContextMenu
        actions={menuActions}
        onPress={(e): void => {
          // Emitted native index is based on order of options in the action array
          // Toggle favorite action
          if (e.nativeEvent.index === 0) {
            toggleFavoriteToken()
          }
          // Swap action
          if (e.nativeEvent.index === 1) {
            navigateToSwapSell()
          }
        }}>
        <TouchableArea
          hapticFeedback
          disabled={isEditing}
          hapticStyle={ImpactFeedbackStyle.Light}
          testID={`token-item-${name}`}
          onPress={(): void => {
            if (isEditing) return
            tokenDetailsNavigation.preload(_currencyId)
            tokenDetailsNavigation.navigate(_currencyId)
          }}>
          <AnimatedFlex
            row
            alignItems="flex-start"
            justifyContent="space-between"
            opacity={opacity}
            px="lg"
            py="xs">
            <Flex centered row flexShrink={1} gap="xs" overflow="hidden">
              <Flex centered row gap="xxs" overflow="hidden">
                {index !== undefined && (
                  <Box minWidth={16}>
                    <Text color="textSecondary" variant="buttonLabelMicro">
                      {index + 1}
                    </Text>
                  </Box>
                )}
                <TokenLogo symbol={symbol} url={logoUrl} />
              </Flex>
              <Flex alignItems="flex-start" flexShrink={1} gap="xxxs" marginLeft="xxs">
                <Text numberOfLines={1} variant="bodyLarge">
                  {name}
                </Text>
                <Text color="textSecondary" variant="subheadSmall">
                  {getMetadataSubtitle()}
                </Text>
              </Flex>
            </Flex>
            <Flex row alignItems="center" justifyContent="flex-end">
              <TokenMetadata>
                <Text variant="bodyLarge">{formatUSDPrice(price)}</Text>
                <RelativeChange change={pricePercentChange24h} variant="subheadSmall" />
              </TokenMetadata>
              {isEditing ? (
                <FavoriteButton disabled={Boolean(isFavorited)} onPress={toggleFavoriteToken} />
              ) : null}
            </Flex>
          </AnimatedFlex>
        </TouchableArea>
      </ContextMenu>
    )
  }
)
