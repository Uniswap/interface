import { graphql } from 'babel-plugin-relay/macro'
import React, { memo, Suspense, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlexAlignType, Image, ImageStyle } from 'react-native'
import ContextMenu from 'react-native-context-menu-view'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useLazyLoadQuery } from 'react-relay'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { AnimatedButton, Button, ButtonProps } from 'src/components/buttons/Button'
import { PinnedTokenCardQuery } from 'src/components/explore/__generated__/PinnedTokenCardQuery.graphql'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { RelativeChange } from 'src/components/text/RelativeChange'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { PollingInterval } from 'src/constants/misc'
import { AssetType } from 'src/entities/assets'
import { currencyIdToContractInput } from 'src/features/dataApi/utils'
import { removeFavoriteToken } from 'src/features/favorites/slice'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import { fromGraphQLChain } from 'src/utils/chainId'
import { CurrencyId } from 'src/utils/currencyId'
import { formatUSDPrice } from 'src/utils/format'

const THIN_BORDER = 0.5

const BOX_TOKEN_LOGO_SIZE = 36
const boxTokenLogoStyle: ImageStyle = { width: BOX_TOKEN_LOGO_SIZE, height: BOX_TOKEN_LOGO_SIZE }

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

type PinnedTokenCardProps = {
  currencyId: CurrencyId
  isEditing?: boolean
  setIsEditing: (update: boolean) => void
} & ButtonProps

function PinnedTokenCard(props: PinnedTokenCardProps) {
  return (
    <Suspense fallback={<Loading />}>
      <PinnedTokenCardInner {...props} />
    </Suspense>
  )
}

function PinnedTokenCardInner({
  currencyId,
  isEditing,
  setIsEditing,
  ...rest
}: PinnedTokenCardProps) {
  const theme = useAppTheme()
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const tokenDetailsNavigation = useTokenDetailsNavigation()
  const queryInput = useMemo(() => [currencyIdToContractInput(currencyId)], [currencyId])

  const data = useLazyLoadQuery<PinnedTokenCardQuery>(
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
  const chainId = fromGraphQLChain(token?.chain)
  const usdPrice = tokenData?.markets?.[0]?.price?.value
  const pricePercentChange = tokenData?.markets?.[0]?.pricePercentChange24h?.value

  const onRemove = useCallback(
    () => dispatch(removeFavoriteToken({ currencyId })),
    [currencyId, dispatch]
  )

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
      { title: t('Remove pin'), systemIcon: 'pin' },
      { title: t('Edit pins'), systemIcon: 'square.and.pencil' },
      { title: t('Swap'), systemIcon: 'arrow.2.squarepath' },
    ]
  }, [t])

  const onPress = () => {
    if (isEditing) return
    tokenDetailsNavigation.navigate(currencyId)
  }

  const onPressIn = () => {
    if (isEditing) return
    tokenDetailsNavigation.preload(currencyId)
  }

  return (
    <Button testID={`token-box-${token?.symbol}`} onPress={onPress} onPressIn={onPressIn} {...rest}>
      {isEditing ? (
        <RemoveFavoriteTokenButton position="absolute" right={-8} top={-8} onPress={onRemove} />
      ) : null}
      <ContextMenu
        actions={menuActions}
        disabled={isEditing}
        onPress={(e) => {
          // Emitted index based on order of menu action array
          // remove pin action
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
        }}>
        <BaseCard.Shadow>
          <Flex alignItems="center" gap="xxs">
            {tokenData?.logoUrl && (
              <Image
                source={{ uri: tokenData.logoUrl }}
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
            )}
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
        </BaseCard.Shadow>
      </ContextMenu>
    </Button>
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
      <Box backgroundColor="textSecondary" borderRadius="md" height={2} width={12} />
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
