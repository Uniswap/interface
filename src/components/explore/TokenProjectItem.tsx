import React, { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlexAlignType } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'
import { FadeInRight } from 'react-native-reanimated'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import PinIcon from 'src/assets/icons/pin.svg'
import { AnimatedButton, Button, ButtonProps } from 'src/components/buttons/Button'
import { TokenLogo } from 'src/components/CurrencyLogo/TokenLogo'
import { Box } from 'src/components/layout/Box'
import { AnimatedFlex, Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
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
import { opacify } from 'src/utils/colors'
import { buildCurrencyId, buildNativeCurrencyId } from 'src/utils/currencyId'
import { formatNumber, formatUSDPrice } from 'src/utils/format'

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

interface TokenProjectItemProps {
  tokenItemData: TokenItemData
  index?: number
  metadataDisplayType?: TokensMetadataDisplayType
  onCycleMetadata?: () => void
  isFavorited?: boolean
  isEditing?: boolean
}

export const TokenProjectItem = memo(
  ({
    tokenItemData,
    index,
    metadataDisplayType,
    onCycleMetadata,
    isFavorited,
    isEditing,
  }: TokenProjectItemProps) => {
    const { t } = useTranslation()
    const theme = useAppTheme()
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
            { title: t('Remove favorite'), systemIcon: 'minus' },
            { title: t('Swap'), systemIcon: 'arrow.2.squarepath' },
          ]
        : [
            { title: 'Favorite token', systemIcon: 'star' },
            { title: 'Swap', systemIcon: 'arrow.2.squarepath' },
          ]
    }, [isFavorited, t])

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
        <Button
          disabled={isEditing}
          opacity={isFavorited && isEditing ? 0.3 : 1}
          testID={`token-item-${name}`}
          onPress={() => {
            if (isEditing) return
            tokenDetailsNavigation.navigate(_currencyId)
          }}
          onPressIn={() => {
            if (isEditing) return
            tokenDetailsNavigation.preload(_currencyId)
          }}>
          <AnimatedFlex
            row
            alignItems="center"
            bg="none"
            justifyContent="space-between"
            px="xs"
            py="sm">
            <Flex centered row flexShrink={1} gap="xs" overflow="hidden">
              <Flex centered row flexShrink={1} gap="xxs" overflow="hidden">
                {index !== undefined && (
                  <Box minWidth={16}>
                    <Text color="textSecondary" variant="badge">
                      {index + 1}
                    </Text>
                  </Box>
                )}
                <TokenLogo size={theme.imageSizes.lg} symbol={symbol} url={logoUrl} />
              </Flex>
              <Flex alignItems="flex-start" flexShrink={1} gap="xxxs" marginLeft="xxs">
                <Text variant="subhead">{name}</Text>
                <Text color="textSecondary" variant="caption">
                  {symbol.toUpperCase()}
                </Text>
              </Flex>
            </Flex>
            <Flex row alignItems="center" justifyContent="flex-end">
              <Button disabled={!onCycleMetadata} onPress={onCycleMetadata}>
                <TokenMetadata
                  main={formatUSDPrice(price)}
                  sub={
                    metadataDisplayType === TokensMetadataDisplayType.MarketCap ? (
                      <Text variant="caption">
                        {t('MCap {{marketCap}}', {
                          marketCap: formatNumber(marketCap),
                        })}
                      </Text>
                    ) : (
                      <RelativeChange change={pricePercentChange24h} />
                    )
                  }
                />
              </Button>
              {isEditing ? (
                <FavoriteButton disabled={Boolean(isFavorited)} onPress={toggleFavoriteToken} />
              ) : null}
            </Flex>
          </AnimatedFlex>
        </Button>
      </ContextMenu>
    )
  }
)

interface TokenMetadataProps {
  pre?: React.ReactNode
  main: React.ReactNode
  sub?: React.ReactNode
  align?: FlexAlignType
}

/** Helper component to format rhs metadata for a given token. */
function TokenMetadata({ pre, main, sub, align = 'flex-end' }: TokenMetadataProps) {
  return (
    <Flex row>
      {pre}
      <Flex alignItems={align} gap="xxs" minWidth={70}>
        <Text variant="body">{main}</Text>
        {sub && (
          <Text color="textSecondary" variant="caption">
            {sub}
          </Text>
        )}
      </Flex>
    </Flex>
  )
}

function FavoriteButton({ disabled, ...rest }: { disabled: boolean } & ButtonProps) {
  const theme = useAppTheme()
  return (
    <Box opacity={disabled ? 0 : 1}>
      <AnimatedButton
        borderRadius="full"
        borderWidth={1}
        entering={FadeInRight}
        justifyContent="center"
        padding="xs"
        {...rest}
        style={{
          backgroundColor: opacify(5, theme.colors.magentaVibrant),
          borderColor: opacify(20, theme.colors.magentaVibrant),
        }}>
        {/* @TODO: replace with updated icon from designs */}
        <PinIcon color={theme.colors.magentaVibrant} height={14} strokeWidth={2} width={14} />
      </AnimatedButton>
    </Box>
  )
}
