import React from 'react'
import { FlexAlignType, Image, ImageStyle, Pressable } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { IconButton } from 'src/components/buttons/IconButton'
import { Star } from 'src/components/icons/Star'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { ChainId } from 'src/constants/chains'
import { Asset } from 'src/features/dataApi/zerion/types'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { addFavoriteToken, removeFavoriteToken } from 'src/features/favorites/slice'
import { buildCurrencyId } from 'src/utils/currencyId'
import { formatUSDPrice } from 'src/utils/format'
import { Flex } from '../../components/layout'

interface TokenItemProps {
  token: Asset
  onPress: () => void
}

const tokenLogoStyle: ImageStyle = { width: 35, height: 35, borderRadius: 35 / 2 }
const boxTokenLogoStyle: ImageStyle = { width: 18, height: 18, borderRadius: 18 / 2 }

interface FavoriteButtonProps {
  asset: Asset
  onPress: () => void
  active: boolean
}

function FavoriteButton({ active, onPress }: FavoriteButtonProps) {
  return (
    <Flex centered bg={'neutralAction'} width={60}>
      <IconButton
        icon={<Star active={active} size={24} />}
        variant="transparent"
        onPress={onPress}
      />
    </Flex>
  )
}

export function TokenItem({ token, onPress }: TokenItemProps) {
  const dispatch = useAppDispatch()

  const assetId = buildCurrencyId(ChainId.Mainnet, token.asset.asset_code)
  const isFavoriteToken = useAppSelector(selectFavoriteTokensSet).has(assetId)

  const onFavoriteToken = () => {
    if (isFavoriteToken) dispatch(removeFavoriteToken({ currencyId: assetId }))
    else dispatch(addFavoriteToken({ currencyId: assetId }))
  }

  const renderRightActions = () => (
    <FavoriteButton active={isFavoriteToken} asset={token} onPress={onFavoriteToken} />
  )

  return (
    <Swipeable overshootRight={false} renderRightActions={renderRightActions}>
      <Pressable testID={`token-item-${token.asset.symbol}`} onPress={onPress}>
        <Flex row alignItems="center" justifyContent="space-between" py="sm">
          <Flex centered row flexShrink={1} gap="sm" overflow="hidden">
            <Image source={{ uri: token.asset.icon_url }} style={tokenLogoStyle} />
            <Flex alignItems="flex-start" flexShrink={1} gap="xxs">
              <Flex row>
                <Text variant="mediumLabel">{token.asset.name ?? ''}</Text>
              </Flex>
              <Flex row>
                <Text variant="caption">{token.asset.symbol ?? ''}</Text>
              </Flex>
            </Flex>
          </Flex>
          <Flex row justifyContent="flex-end">
            <TokenMetadata
              main={formatUSDPrice(token.asset.price?.value)}
              sub={<RelativeChange change={token?.asset.price?.relative_change_24h} />}
            />
          </Flex>
        </Flex>
      </Pressable>
    </Swipeable>
  )
}

export function TokenItemBox({ token, onPress }: TokenItemProps) {
  return (
    <Pressable testID={`token-box-${token.asset.symbol}`} onPress={onPress}>
      <Box bg="translucentBackground" borderRadius="lg" justifyContent="space-between">
        <Flex p="sm">
          <Flex row alignItems="center" justifyContent="space-between">
            <Text variant="body1">{token.asset.symbol ?? ''}</Text>
            <Image source={{ uri: token.asset.icon_url }} style={boxTokenLogoStyle} />
          </Flex>
          <Flex row>
            <TokenMetadata
              align="flex-start"
              main={<Text variant="body2">{formatUSDPrice(token.asset.price?.value)}</Text>}
              sub={<RelativeChange change={token?.asset.price?.relative_change_24h} />}
            />
          </Flex>
        </Flex>
      </Box>
    </Pressable>
  )
}

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
      <Box alignItems={align} minWidth={70}>
        <Text variant="body1">{main}</Text>
        {sub && (
          <Text color="deprecated_gray400" variant="caption">
            {sub}
          </Text>
        )}
      </Box>
    </Flex>
  )
}
