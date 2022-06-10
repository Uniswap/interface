import React from 'react'
import { useTranslation } from 'react-i18next'
import { FlexAlignType, Image, ImageStyle, Pressable } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import { useAppSelector } from 'src/app/hooks'
import { Button } from 'src/components/buttons/Button'
import { IconButton } from 'src/components/buttons/IconButton'
import { Heart } from 'src/components/icons/Heart'
import { Box } from 'src/components/layout/Box'
import { AnimatedFlex, Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { ChainId } from 'src/constants/chains'
import { Asset } from 'src/features/dataApi/zerion/types'
import { useToggleFavoriteCallback } from 'src/features/favorites/hooks'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { buildCurrencyId } from 'src/utils/currencyId'
import { formatNumber, formatUSDPrice } from 'src/utils/format'

interface TokenItemProps {
  onCycleMetadata?: () => void
  index?: number
  isSearchResult?: boolean
  metadataDisplayType?: string
  onPress: () => void
  token: Asset
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
    <Flex centered bg="neutralAction" width={80}>
      <IconButton
        icon={<Heart active={active} size={24} />}
        variant="transparent"
        onPress={onPress}
      />
    </Flex>
  )
}

export function TokenItem({
  onCycleMetadata,
  index,
  metadataDisplayType,
  token,
  isSearchResult = false,
  onPress,
}: TokenItemProps) {
  const { t } = useTranslation()

  const assetId = buildCurrencyId(ChainId.Mainnet, token.asset.asset_code)
  const isFavoriteToken = useAppSelector(selectFavoriteTokensSet).has(assetId)
  const toggleFavoriteCallback = useToggleFavoriteCallback(assetId)

  const renderRightActions = () => {
    // TODO: fade in on drag
    return isSearchResult ? null : (
      <FavoriteButton active={isFavoriteToken} asset={token} onPress={toggleFavoriteCallback} />
    )
  }

  return (
    <Swipeable overshootRight={false} renderRightActions={renderRightActions}>
      <Button testID={`token-item-${token.asset.symbol}`} onPress={onPress}>
        <AnimatedFlex
          row
          alignItems="center"
          bg={isSearchResult ? 'none' : 'neutralBackground'}
          justifyContent="space-between"
          px={isSearchResult ? 'xs' : 'md'}
          py="sm">
          <Flex centered row flexShrink={1} gap="sm" overflow="hidden">
            {index && (
              <Box minWidth={18}>
                <Text color="neutralTextSecondary" variant="badge">
                  {index + 1}
                </Text>
              </Box>
            )}

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
            <Button onPress={onCycleMetadata}>
              <TokenMetadata
                main={formatUSDPrice(token.asset.price?.value)}
                sub={
                  metadataDisplayType === 'market_cap' ? (
                    <Text variant="caption">
                      {t('MCap {{marketCap}}', { marketCap: formatNumber(token?.market_cap) })}
                    </Text>
                  ) : (
                    <RelativeChange change={token?.asset.price?.relative_change_24h} />
                  )
                }
              />
            </Button>
          </Flex>
        </AnimatedFlex>
      </Button>
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
