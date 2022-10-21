import { Currency } from '@uniswap/sdk-core'
import { graphql } from 'babel-plugin-relay/macro'
import React, { Suspense, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PreloadedQuery, useFragment } from 'react-relay'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { useEagerLoadedQuery } from 'src/app/navigation/useEagerNavigation'
import { IconButton } from 'src/components/buttons/IconButton'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { SendButton } from 'src/components/buttons/SendButton'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Heart } from 'src/components/icons/Heart'
import { Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Box } from 'src/components/layout/Box'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { Loading } from 'src/components/loading'
import { CurrencyPriceChart } from 'src/components/PriceChart'
import { Text } from 'src/components/Text'
import { useCrossChainBalances } from 'src/components/TokenDetails/hooks'
import { TokenBalances } from 'src/components/TokenDetails/TokenBalances'
import { TokenDetailsBackButtonRow } from 'src/components/TokenDetails/TokenDetailsBackButtonRow'
import { TokenDetailsStats } from 'src/components/TokenDetails/TokenDetailsStats'
import TokenWarningCard from 'src/components/tokens/TokenWarningCard'
import TokenWarningModal from 'src/components/tokens/TokenWarningModal'
import { AssetType } from 'src/entities/assets'
import { useToggleFavoriteCallback } from 'src/features/favorites/hooks'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'src/features/telemetry/constants'
import { useCurrency } from 'src/features/tokens/useCurrency'
import { TokenWarningLevel, useTokenWarningLevel } from 'src/features/tokens/useTokenWarningLevel'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import { Screens } from 'src/screens/Screens'
import { TokenDetailsScreenQuery } from 'src/screens/__generated__/TokenDetailsScreenQuery.graphql'
import { TokenDetailsScreen_headerPriceLabel$key } from 'src/screens/__generated__/TokenDetailsScreen_headerPriceLabel.graphql'
import { flex } from 'src/styles/flex'
import { currencyAddress, currencyId } from 'src/utils/currencyId'
import { formatUSDPrice } from 'src/utils/format'

export const tokenDetailsScreenQuery = graphql`
  query TokenDetailsScreenQuery($contract: ContractInput!) {
    tokens(contracts: [$contract]) {
      ...TokenDetailsStats_token
    }

    tokenProjects(contracts: [$contract]) {
      ...TokenDetailsStats_tokenProject
      ...TokenDetailsScreen_headerPriceLabel
    }
  }
`

interface TokenDetailsHeaderProps {
  currency: Currency
  initialSendState: TransactionState
}

function TokenDetailsHeader({ currency, initialSendState }: TokenDetailsHeaderProps) {
  const { t } = useTranslation()

  const isFavoriteToken = useAppSelector(selectFavoriteTokensSet).has(currencyId(currency))
  const onFavoritePress = useToggleFavoriteCallback(currencyId(currency))

  return (
    <Flex row justifyContent="space-between" mx="md">
      <Flex centered row flexShrink={1} gap="xs">
        <CurrencyLogo currency={currency} size={36} />
        <Box flexShrink={1}>
          <Text numberOfLines={1} style={flex.shrink} variant="headlineSmall">
            {currency.name ?? t('Unknown token')}
          </Text>
          <Text color="textTertiary" numberOfLines={1} style={flex.shrink} variant="bodySmall">
            {currency.symbol ?? t('Unknown token')}
          </Text>
        </Box>
      </Flex>
      <Flex row alignItems="center" gap="none" justifyContent="center">
        <SendButton
          iconOnly
          bg="none"
          iconColor="textPrimary"
          iconSize={24}
          initialState={initialSendState}
        />
        <IconButton
          icon={<Heart active={isFavoriteToken} size={24} />}
          px="none"
          variant="transparent"
          onPress={onFavoritePress}
        />
      </Flex>
    </Flex>
  )
}

function HeaderPriceLabel({
  tokenProject,
}: {
  tokenProject: TokenDetailsScreen_headerPriceLabel$key
}) {
  const { t } = useTranslation()
  const spotPrice = useFragment(
    graphql`
      fragment TokenDetailsScreen_headerPriceLabel on TokenProject {
        markets(currencies: [USD]) {
          price {
            value
          }
        }
      }
    `,
    tokenProject
  )

  return (
    <Text color="textSecondary" variant="buttonLabelMicro">
      {formatUSDPrice(spotPrice?.markets?.[0]?.price?.value) ?? t('Unknown token')}
    </Text>
  )
}

function HeaderTitleElement({
  currency,
  tokenProject,
}: Pick<TokenDetailsHeaderProps, 'currency'> & {
  tokenProject: TokenDetailsScreen_headerPriceLabel$key | null | undefined
}) {
  const { t } = useTranslation()

  return (
    <Flex centered gap="none">
      <Flex centered row gap="xs">
        <CurrencyLogo currency={currency} size={16} />
        <Text variant="subheadLarge">{currency.name ?? t('Unknown token')}</Text>
      </Flex>
      {tokenProject && (
        <Suspense fallback={null}>
          <HeaderPriceLabel tokenProject={tokenProject} />
        </Suspense>
      )}
    </Flex>
  )
}

enum SwapType {
  BUY,
  SELL,
}

export function TokenDetailsScreen({ route }: AppStackScreenProp<Screens.TokenDetails>) {
  const { currencyId: _currencyId, preloadedQuery } = route.params

  const currency = useCurrency(_currencyId)

  if (!currency || !preloadedQuery) {
    return null
  }

  return (
    <Suspense fallback={<Loading />}>
      <TokenDetails currency={currency} preloadedQuery={preloadedQuery} />
    </Suspense>
  )
}

function TokenDetails({
  currency,
  preloadedQuery,
}: {
  currency: Currency
  preloadedQuery: PreloadedQuery<TokenDetailsScreenQuery>
}) {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const { currentChainBalance, otherChainBalances } = useCrossChainBalances(currency)

  const data = useEagerLoadedQuery<TokenDetailsScreenQuery>(tokenDetailsScreenQuery, preloadedQuery)

  const { tokenWarningLevel, tokenWarningDismissed, warningDismissCallback } = useTokenWarningLevel(
    currency.wrapped
  )

  // set if attempting buy or sell, use for warning modal
  const [activeSwapAttemptType, setActiveSwapAttemptType] = useState<SwapType | undefined>(
    undefined
  )

  const initialSendState = useMemo((): TransactionState => {
    return {
      exactCurrencyField: CurrencyField.INPUT,
      exactAmountToken: '',
      [CurrencyField.INPUT]: {
        address: currencyAddress(currency),
        chainId: currency.wrapped.chainId,
        type: AssetType.Currency,
      },
      [CurrencyField.OUTPUT]: null,
    }
  }, [currency])

  const navigateToSwapBuy = useCallback(() => {
    setActiveSwapAttemptType(undefined)
    const swapFormState: TransactionState = {
      exactCurrencyField: CurrencyField.OUTPUT,
      exactAmountToken: '0',
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: {
        address: currencyAddress(currency),
        chainId: currency.wrapped.chainId,
        type: AssetType.Currency,
      },
    }
    dispatch(openModal({ name: ModalName.Swap, initialState: swapFormState }))
  }, [currency, dispatch])

  const navigateToSwapSell = useCallback(() => {
    setActiveSwapAttemptType(undefined)
    const swapFormState: TransactionState = {
      exactCurrencyField: CurrencyField.INPUT,
      exactAmountToken: '0',
      [CurrencyField.INPUT]: {
        address: currencyAddress(currency),
        chainId: currency.wrapped.chainId,
        type: AssetType.Currency,
      },
      [CurrencyField.OUTPUT]: null,
    }
    dispatch(openModal({ name: ModalName.Swap, initialState: swapFormState }))
  }, [currency, dispatch])

  const onPressSwap = useCallback(
    (swapType: SwapType) => {
      // show warning modal speedbump if token has a warning level and user has not dismissed
      if (tokenWarningLevel !== TokenWarningLevel.NONE && !tokenWarningDismissed) {
        setActiveSwapAttemptType(swapType)
      } else {
        if (swapType === SwapType.BUY) {
          navigateToSwapBuy()
        }
        if (swapType === SwapType.SELL) {
          navigateToSwapSell()
        }
        return
      }
    },
    [navigateToSwapBuy, navigateToSwapSell, tokenWarningDismissed, tokenWarningLevel]
  )

  return (
    <>
      <HeaderScrollScreen
        contentHeader={
          <TokenDetailsBackButtonRow currency={currency} otherChainBalances={otherChainBalances} />
        }
        fixedHeader={
          <BackHeader>
            <HeaderTitleElement currency={currency} tokenProject={data?.tokenProjects?.[0]} />
          </BackHeader>
        }>
        <Flex gap="md" mb="xxl" mt="lg" pb="xxl">
          <TokenDetailsHeader currency={currency} initialSendState={initialSendState} />
          <CurrencyPriceChart currency={currency} />
          <TokenBalances
            currentChainBalance={currentChainBalance}
            otherChainBalances={otherChainBalances}
          />
          <Flex gap="lg" p="md">
            <TokenDetailsStats
              currency={currency}
              token={data?.tokens?.[0]}
              tokenProject={data?.tokenProjects?.[0]}
            />
            {tokenWarningLevel !== TokenWarningLevel.NONE && !tokenWarningDismissed && (
              <TokenWarningCard
                tokenWarningLevel={tokenWarningLevel}
                onDismiss={warningDismissCallback}
              />
            )}
          </Flex>
        </Flex>
      </HeaderScrollScreen>

      <Flex row bg="background0" bottom={0} gap="sm" pb="xl" position="absolute" pt="sm" px="sm">
        <PrimaryButton
          disabled={tokenWarningLevel === TokenWarningLevel.BLOCKED}
          flex={1}
          label={t('Swap')}
          py="md"
          textVariant="buttonLabelMedium"
          onPress={() => onPressSwap(currentChainBalance ? SwapType.SELL : SwapType.BUY)}
        />
        {currentChainBalance && (
          <SendButton iconOnly iconStrokeWidth={1.5} initialState={initialSendState} />
        )}
      </Flex>

      {activeSwapAttemptType === SwapType.BUY || activeSwapAttemptType === SwapType.SELL ? (
        <TokenWarningModal
          isVisible
          currency={currency}
          tokenWarningLevel={tokenWarningLevel}
          onAccept={activeSwapAttemptType === SwapType.BUY ? navigateToSwapBuy : navigateToSwapSell}
          onClose={() => setActiveSwapAttemptType(undefined)}
        />
      ) : null}
    </>
  )
}
