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
import { CoingeckoMarketCoin } from 'src/features/dataApi/coingecko/types'
import { useToggleFavoriteCallback } from 'src/features/favorites/hooks'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { formatNumber, formatUSDPrice } from 'src/utils/format'

interface TokenItemProps {
  currencyId: string
  gesturesEnabled?: boolean
  index?: number
  metadataDisplayType?: string
  onCycleMetadata?: () => void
  onPress: () => void
  token: CoingeckoMarketCoin
}

const tokenLogoStyle: ImageStyle = { width: 35, height: 35, borderRadius: 35 / 2 }
const boxTokenLogoStyle: ImageStyle = { width: 18, height: 18, borderRadius: 18 / 2 }

interface FavoriteButtonProps {
  token: CoingeckoMarketCoin
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
  currencyId,
  gesturesEnabled,
  index,
  metadataDisplayType,
  onCycleMetadata,
  onPress,
  token,
}: TokenItemProps) {
  const { t } = useTranslation()

  const isFavoriteToken = useAppSelector(selectFavoriteTokensSet).has(currencyId)
  const toggleFavoriteCallback = useToggleFavoriteCallback(currencyId)

  const renderRightActions = () => {
    // TODO: fade in on drag
    return (
      <FavoriteButton active={isFavoriteToken} token={token} onPress={toggleFavoriteCallback} />
    )
  }

  return (
    <Swipeable
      enabled={gesturesEnabled}
      overshootRight={false}
      renderRightActions={renderRightActions}>
      <Button testID={`token-item-${token.symbol}`} onPress={onPress}>
        <AnimatedFlex
          row
          alignItems="center"
          bg="neutralBackground"
          justifyContent="space-between"
          px="md"
          py="sm">
          <Flex centered row flexShrink={1} gap="sm" overflow="hidden">
            {index !== undefined && (
              <Box minWidth={18}>
                <Text color="neutralTextSecondary" variant="badge">
                  {token.market_cap_rank}
                </Text>
              </Box>
            )}

            <Image source={{ uri: token.image }} style={tokenLogoStyle} />
            <Flex alignItems="flex-start" flexShrink={1} gap="xxs">
              <Text variant="mediumLabel">{token.name ?? ''}</Text>
              <Text color="neutralTextSecondary" variant="caption">
                {token.symbol.toUpperCase() ?? ''}
              </Text>
            </Flex>
          </Flex>
          <Flex row justifyContent="flex-end">
            <Button onPress={onCycleMetadata}>
              <TokenMetadata
                main={formatUSDPrice(token.current_price)}
                sub={
                  metadataDisplayType === 'market_cap' ? (
                    <Text variant="caption">
                      {t('MCap {{marketCap}}', { marketCap: formatNumber(token?.market_cap) })}
                    </Text>
                  ) : (
                    <RelativeChange change={token.price_change_percentage_24h ?? undefined} />
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
    <Pressable testID={`token-box-${token.symbol}`} onPress={onPress}>
      <Box bg="neutralContainer" borderRadius="lg" justifyContent="space-between">
        <Flex p="sm">
          <Flex row alignItems="center" justifyContent="space-between">
            <Text variant="body1">{token.symbol ?? ''}</Text>
            <Image source={{ uri: token.image }} style={boxTokenLogoStyle} />
          </Flex>
          <Flex row>
            <TokenMetadata
              align="flex-start"
              main={<Text variant="body2">{formatUSDPrice(token.current_price)}</Text>}
              sub={<RelativeChange change={token.price_change_percentage_24h ?? undefined} />}
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
