import React, { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ViewProps } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { AnimatedTouchableArea } from 'src/components/buttons/TouchableArea'
import { TokenLogo } from 'src/components/CurrencyLogo/TokenLogo'
import RemoveButton from 'src/components/explore/RemoveButton'
import { Box } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { TokenMetadata } from 'src/components/tokens/TokenMetadata'
import { ExploreTokensTabQuery } from 'src/data/__generated__/types-and-hooks'
import { AssetType } from 'src/entities/assets'
import { removeFavoriteToken } from 'src/features/favorites/slice'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import { fromGraphQLChain } from 'src/utils/chainId'
import { buildCurrencyId, buildNativeCurrencyId } from 'src/utils/currencyId'
import { formatUSDPrice } from 'src/utils/format'

type FavoriteTokenCardProps = {
  tokenData: NonNullable<ExploreTokensTabQuery['favoriteTokensData']>[0]
  isEditing?: boolean
  setIsEditing: (update: boolean) => void
} & ViewProps

function FavoriteTokenCard({
  tokenData,
  isEditing,
  setIsEditing,
  ...rest
}: FavoriteTokenCardProps) {
  const theme = useAppTheme()
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const tokenDetailsNavigation = useTokenDetailsNavigation()

  const token = tokenData?.tokens[0]
  // Mirror behavior in top tokens list, use first chain the token is on for the symbol
  const chainId = fromGraphQLChain(token?.chain)
  const currencyId =
    chainId && token?.address
      ? buildCurrencyId(chainId, token?.address)
      : chainId
      ? buildNativeCurrencyId(chainId)
      : undefined
  const usdPrice = tokenData?.markets?.[0]?.price?.value
  const pricePercentChange = tokenData?.markets?.[0]?.pricePercentChange24h?.value

  const onRemove = useCallback(() => {
    if (currencyId) {
      dispatch(removeFavoriteToken({ currencyId }))
    }
  }, [currencyId, dispatch])

  const navigateToSwapSell = useCallback(() => {
    if (!token?.address || !chainId) return

    const swapFormState: TransactionState = {
      exactCurrencyField: CurrencyField.INPUT,
      exactAmountToken: '0',
      [CurrencyField.INPUT]: {
        address: token.address,
        chainId: chainId,
        type: AssetType.Currency,
      },
      [CurrencyField.OUTPUT]: null,
    }
    dispatch(openModal({ name: ModalName.Swap, initialState: swapFormState }))
  }, [chainId, dispatch, token?.address])

  const menuActions = useMemo(() => {
    return [
      { title: t('Remove favorite'), systemIcon: 'star.fill' },
      { title: t('Edit favorites'), systemIcon: 'square.and.pencil' },
      { title: t('Swap'), systemIcon: 'arrow.2.squarepath' },
    ]
  }, [t])

  const onPress = () => {
    if (isEditing || !currencyId) return
    tokenDetailsNavigation.preload(currencyId)
    tokenDetailsNavigation.navigate(currencyId)
  }

  return (
    <ContextMenu
      actions={menuActions}
      disabled={isEditing}
      style={{ borderRadius: theme.borderRadii.lg }}
      onPress={(e) => {
        // Emitted index based on order of menu action array
        // remove favorite action
        if (e.nativeEvent.index === 0) {
          onRemove()
        }
        // Edit mode toggle action
        if (e.nativeEvent.index === 1) {
          setIsEditing(true)
        }
        // Swap token action
        if (e.nativeEvent.index === 2) {
          navigateToSwapSell()
        }
      }}
      {...rest}>
      <AnimatedTouchableArea
        borderRadius="lg"
        entering={FadeIn}
        exiting={FadeOut}
        testID={`token-box-${token?.symbol}`}
        onPress={onPress}>
        {isEditing ? (
          <RemoveButton position="absolute" right={-8} top={-8} onPress={onRemove} />
        ) : null}
        <BaseCard.Shadow px="xs">
          <Flex alignItems="center" gap="xxs">
            <TokenLogo
              chainId={chainId ?? undefined}
              symbol={token?.symbol ?? undefined}
              url={tokenData?.logoUrl ?? undefined}
            />
            <TokenMetadata align="center">
              <Box>
                <Text adjustsFontSizeToFit numberOfLines={1} textAlign="center" variant="bodyLarge">
                  {formatUSDPrice(usdPrice)}
                </Text>
              </Box>
              <RelativeChange
                change={pricePercentChange ?? undefined}
                semanticColor={true}
                variant="bodyMicro"
              />
            </TokenMetadata>
          </Flex>
        </BaseCard.Shadow>
      </AnimatedTouchableArea>
    </ContextMenu>
  )
}

export default memo(FavoriteTokenCard)
