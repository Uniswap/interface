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
import { addFavoriteToken, removeFavoriteToken } from 'src/features/favorites/slice'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import { TokensMetadataDisplayType } from 'src/features/wallet/types'
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
}

interface TokenItemProps {
  tokenItemData: TokenItemData
  index?: number
  metadataDisplayType?: TokensMetadataDisplayType
  onCycleMetadata?: () => void
  isFavorited?: boolean
  isEditing?: boolean
}

export const TokenItem = memo(
  ({
    tokenItemData,
    index,
    metadataDisplayType,
    onCycleMetadata,
    isFavorited,
    isEditing,
  }: TokenItemProps) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const tokenDetailsNavigation = useTokenDetailsNavigation()

    const { name, logoUrl, chainId, address, symbol, price, marketCap, pricePercentChange24h } =
      tokenItemData
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
            { title: t('Remove favorite'), systemIcon: 'star.fill' },
            { title: t('Swap'), systemIcon: 'arrow.2.squarepath' },
          ]
        : [
            { title: 'Favorite token', systemIcon: 'star' },
            { title: 'Swap', systemIcon: 'arrow.2.squarepath' },
          ]
    }, [isFavorited, t])

    const opacity = isFavorited && isEditing ? 0.3 : 1

    return (
      <ContextMenu
        actions={menuActions}
        onPress={(e) => {
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
          disabled={isEditing}
          testID={`token-item-${name}`}
          onPress={() => {
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
                <Text adjustsFontSizeToFit numberOfLines={1} variant="bodyLarge">
                  {name}
                </Text>
                <Text color="textSecondary" variant="subheadSmall">
                  {symbol.toUpperCase()}
                </Text>
              </Flex>
            </Flex>
            <Flex row alignItems="center" justifyContent="flex-end">
              <TouchableArea disabled={!onCycleMetadata} onPress={onCycleMetadata}>
                <TokenMetadata>
                  <Text variant="bodyLarge">{formatUSDPrice(price)}</Text>
                  {metadataDisplayType === TokensMetadataDisplayType.MarketCap ? (
                    <Text color="textSecondary" variant="subheadSmall">
                      {t('MCap {{marketCap}}', {
                        marketCap: formatNumber(marketCap, NumberType.FiatTokenStats),
                      })}
                    </Text>
                  ) : (
                    <RelativeChange change={pricePercentChange24h} variant="subheadSmall" />
                  )}
                </TokenMetadata>
              </TouchableArea>
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
