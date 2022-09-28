import React from 'react'
import { useTranslation } from 'react-i18next'
import { FlexAlignType, Image, ImageStyle } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { AnimatedFlex, Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { ChainId } from 'src/constants/chains'
import { CoingeckoOrderBy } from 'src/features/dataApi/coingecko/types'
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
  metadataDisplayType?: string
  onCycleMetadata?: () => void
}

export const TokenProjectItem = ({
  tokenItemData,
  index,
  metadataDisplayType,
  onCycleMetadata,
}: TokenProjectItemProps) => {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const tokenDetailsNavigation = useTokenDetailsNavigation()

  const { name, logoUrl, chainId, address, symbol, price, marketCap, pricePercentChange24h } =
    tokenItemData

  const _currencyId = address ? buildCurrencyId(chainId, address) : buildNativeCurrencyId(chainId)

  return (
    <Button
      testID={`token-item-${name}`}
      onPress={() => {
        tokenDetailsNavigation.navigate(_currencyId)
      }}
      onPressIn={() => {
        tokenDetailsNavigation.preload(_currencyId)
      }}>
      <AnimatedFlex
        row
        alignItems="center"
        bg="none"
        justifyContent="space-between"
        px="md"
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
            <Image
              source={{ uri: logoUrl }}
              style={[
                tokenLogoStyle,
                {
                  backgroundColor: theme.colors.textTertiary,
                  borderRadius: TOKEN_LOGO_SIZE / 2,
                  borderColor: theme.colors.backgroundOutline,
                  borderWidth: THIN_BORDER,
                },
              ]}
            />
          </Flex>
          <Flex alignItems="flex-start" flexShrink={1} gap="xxxs" marginLeft="xxs">
            <Text variant="subhead">{name}</Text>
            <Text color="textSecondary" variant="caption">
              {symbol.toUpperCase()}
            </Text>
          </Flex>
        </Flex>
        <Flex row justifyContent="flex-end">
          <Button disabled={!onCycleMetadata} onPress={onCycleMetadata}>
            <TokenMetadata
              main={formatUSDPrice(price)}
              sub={
                metadataDisplayType === CoingeckoOrderBy.MarketCapDesc ? (
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
        </Flex>
      </AnimatedFlex>
    </Button>
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

const THIN_BORDER = 0.5
const TOKEN_LOGO_SIZE = 36
const tokenLogoStyle: ImageStyle = {
  width: TOKEN_LOGO_SIZE,
  height: TOKEN_LOGO_SIZE,
  resizeMode: 'contain',
}
