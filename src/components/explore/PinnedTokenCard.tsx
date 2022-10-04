import { ShadowProps } from '@shopify/restyle'
import { graphql } from 'babel-plugin-relay/macro'
import React, { memo, useCallback, useMemo } from 'react'
import {
  FlexAlignType,
  Image,
  ImageStyle,
  Pressable,
  PressableProps,
  useColorScheme,
} from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useLazyLoadQuery } from 'react-relay-offline'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { AnimatedButton, ButtonProps } from 'src/components/buttons/Button'
import { PinnedTokenCardQuery } from 'src/components/explore/__generated__/PinnedTokenCardQuery.graphql'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { PollingInterval } from 'src/constants/misc'
import { currencyIdToContractInput } from 'src/features/dataApi/utils'
import { removeFavoriteToken } from 'src/features/favorites/slice'
import { Theme } from 'src/styles/theme'
import { CurrencyId } from 'src/utils/currencyId'
import { formatUSDPrice } from 'src/utils/format'

const THIN_BORDER = 0.5

const BOX_TOKEN_LOGO_SIZE = 36
const boxTokenLogoStyle: ImageStyle = { width: BOX_TOKEN_LOGO_SIZE, height: BOX_TOKEN_LOGO_SIZE }

const SHADOW_OFFSET: ShadowProps<Theme>['shadowOffset'] = { width: 0, height: 2 }

// Do one query per item to avoid suspense on entire screen / container
// @TODO: Find way to load at the root of explore without a rerender when pinned token state changes
export const pinnedTokenCardQuery = graphql`
  query PinnedTokenCardQuery($contracts: [ContractInput!]!) {
    tokenProjects(contracts: $contracts) {
      tokens {
        chain
        address
        symbol
      }
      logoUrl
      markets(currencies: USD) {
        price {
          currency
          value
        }
        pricePercentChange24h {
          currency
          value
        }
      }
    }
  }
`

export const TOKEN_ITEM_BOX_MINWIDTH = 137

function PinnedTokenCard({
  currencyId,
  isEditing,
  ...rest
}: {
  currencyId: CurrencyId
  isEditing?: boolean
} & PressableProps) {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const isDarkMode = useColorScheme() === 'dark'
  const tokenDetailsNavigation = useTokenDetailsNavigation()
  const queryInput = useMemo(() => [currencyIdToContractInput(currencyId)], [currencyId])

  const { data } = useLazyLoadQuery<PinnedTokenCardQuery>(
    pinnedTokenCardQuery,
    {
      contracts: queryInput,
    },
    { networkCacheConfig: { poll: PollingInterval.Fast } }
  )

  // Parse token fields from response
  const tokenData = data?.tokenProjects?.[0]
  // Mirror behavior in top tokens list, use first chain the token is on for the symbol
  const token = data?.tokenProjects?.[0]?.tokens?.[0]
  const usdPrice = tokenData?.markets?.[0]?.price?.value
  const pricePercentChange = tokenData?.markets?.[0]?.pricePercentChange24h?.value

  const onRemove = useCallback(
    () => dispatch(removeFavoriteToken({ currencyId })),
    [currencyId, dispatch]
  )

  return (
    <Pressable
      testID={`token-box-${token?.symbol}`}
      onPress={() => {
        tokenDetailsNavigation.navigate(currencyId)
      }}
      onPressIn={() => {
        tokenDetailsNavigation.preload(currencyId)
      }}
      {...rest}>
      {isEditing ? (
        <RemoveFavoriteTokenButton position="absolute" right={-8} top={-8} onPress={onRemove} />
      ) : null}
      <Flex
        alignItems="center"
        bg={isDarkMode ? 'backgroundSurface' : 'backgroundBackdrop'}
        borderRadius="lg"
        gap="xxs"
        p="sm"
        shadowColor="black"
        shadowOffset={SHADOW_OFFSET}
        shadowOpacity={0.05}
        shadowRadius={6}>
        <Image
          source={{ uri: tokenData?.logoUrl ?? '' }}
          style={[
            boxTokenLogoStyle,
            {
              backgroundColor: theme.colors.textTertiary,
              borderRadius: BOX_TOKEN_LOGO_SIZE / 2,
              borderColor: theme.colors.backgroundOutline,
              borderWidth: THIN_BORDER,
            },
          ]}
        />
        <TokenMetadata
          align="center"
          main={<Text variant="body">{formatUSDPrice(usdPrice)}</Text>}
          sub={
            <RelativeChange
              change={pricePercentChange ?? undefined}
              semanticColor={true}
              variant="badge"
            />
          }
        />
      </Flex>
    </Pressable>
  )
}

function RemoveFavoriteTokenButton(props: ButtonProps) {
  const theme = useAppTheme()
  return (
    <AnimatedButton
      {...props}
      alignItems="center"
      backgroundColor="backgroundBackdrop"
      borderColor="backgroundOutline"
      borderRadius="full"
      borderWidth={1}
      entering={FadeIn}
      exiting={FadeOut}
      height={theme.imageSizes.lg}
      justifyContent="center"
      width={theme.imageSizes.lg}
      zIndex="tooltip">
      <Box backgroundColor="accentAction" borderRadius="md" height={2} width={12} />
    </AnimatedButton>
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

export default memo(PinnedTokenCard)
