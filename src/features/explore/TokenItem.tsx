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
import { CoingeckoMarketCoin, CoingeckoOrderBy } from 'src/features/dataApi/coingecko/types'
import { useToggleFavoriteCallback } from 'src/features/favorites/hooks'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { formatNumber, formatUSDPrice } from 'src/utils/format'

interface TokenItemProps {
  coin: CoingeckoMarketCoin
  currencyId: string
  gesturesEnabled?: boolean
  index?: number
  metadataDisplayType?: string
  onCycleMetadata?: () => void
  onPress: () => void
}

const boxTokenLogoStyle: ImageStyle = { width: 18, height: 18, borderRadius: 18 / 2 }
const tokenLogoStyle: ImageStyle = { width: 35, height: 35, borderRadius: 35 / 2 }

interface FavoriteButtonProps {
  active: boolean
  coin: CoingeckoMarketCoin
  onPress: () => void
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
  coin,
  currencyId,
  gesturesEnabled,
  index,
  metadataDisplayType,
  onCycleMetadata,
  onPress,
}: TokenItemProps) {
  const { t } = useTranslation()

  const isFavoriteToken = useAppSelector(selectFavoriteTokensSet).has(currencyId)
  const toggleFavoriteCallback = useToggleFavoriteCallback(currencyId)

  const renderRightActions = () => {
    // TODO: fade in on drag
    return <FavoriteButton active={isFavoriteToken} coin={coin} onPress={toggleFavoriteCallback} />
  }

  return (
    <Swipeable
      enabled={gesturesEnabled}
      overshootRight={false}
      renderRightActions={renderRightActions}>
      <Button testID={`token-item-${coin.symbol}`} onPress={onPress}>
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
                  {index}
                </Text>
              </Box>
            )}

            <Image source={{ uri: coin.image }} style={tokenLogoStyle} />
            <Flex alignItems="flex-start" flexShrink={1} gap="xxs">
              <Text variant="mediumLabel">{coin.name ?? ''}</Text>
              <Text color="neutralTextSecondary" variant="caption">
                {coin.symbol.toUpperCase() ?? ''}
              </Text>
            </Flex>
          </Flex>
          <Flex row justifyContent="flex-end">
            <Button onPress={onCycleMetadata}>
              <TokenMetadata
                main={formatUSDPrice(coin.current_price)}
                sub={
                  metadataDisplayType === CoingeckoOrderBy.MarketCapDesc ? (
                    <Text variant="caption">
                      {t('MCap {{marketCap}}', { marketCap: formatNumber(coin?.market_cap) })}
                    </Text>
                  ) : (
                    <RelativeChange change={coin.price_change_percentage_24h ?? undefined} />
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

export function TokenItemBox({ coin, onPress }: TokenItemProps) {
  return (
    <Pressable testID={`token-box-${coin.symbol}`} onPress={onPress}>
      <Box bg="neutralContainer" borderRadius="lg" justifyContent="space-between">
        <Flex p="sm">
          <Flex row alignItems="center" justifyContent="space-between">
            <Text variant="body1">{coin.symbol.toUpperCase() ?? ''}</Text>
            <Image source={{ uri: coin.image }} style={boxTokenLogoStyle} />
          </Flex>
          <Flex row>
            <TokenMetadata
              align="flex-start"
              main={<Text variant="body2">{formatUSDPrice(coin.current_price)}</Text>}
              sub={<RelativeChange change={coin.price_change_percentage_24h ?? undefined} />}
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
