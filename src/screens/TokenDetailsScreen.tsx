import { Currency } from '@uniswap/sdk-core'
import { graphql } from 'babel-plugin-relay/macro'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PreloadedQuery, useFragment } from 'react-relay'
import { useAppDispatch } from 'src/app/hooks'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { useEagerLoadedQuery } from 'src/app/navigation/useEagerNavigation'
import SendIcon from 'src/assets/icons/send.svg'
import { Button, ButtonEmphasis, ButtonSize } from 'src/components/buttons/Button'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Suspense } from 'src/components/data/Suspense'
import { Box, Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { Loading } from 'src/components/loading'
import { CurrencyPriceChart } from 'src/components/PriceChart'
import { Text } from 'src/components/Text'
import { useCrossChainBalances } from 'src/components/TokenDetails/hooks'
import { TokenBalances } from 'src/components/TokenDetails/TokenBalances'
import { TokenDetailsBackButtonRow } from 'src/components/TokenDetails/TokenDetailsBackButtonRow'
import { TokenDetailsStats } from 'src/components/TokenDetails/TokenDetailsStats'
import TokenWarningModal from 'src/components/tokens/TokenWarningModal'
import WarningIcon from 'src/components/tokens/WarningIcon'
import { AssetType } from 'src/entities/assets'
import { openModal } from 'src/features/modals/modalSlice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
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
import { theme } from 'src/styles/theme'
import { currencyAddress } from 'src/utils/currencyId'
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
  tokenWarningLevel: TokenWarningLevel
  onPressWarningIcon: () => void
}

function TokenDetailsHeader({
  currency,
  tokenWarningLevel,
  onPressWarningIcon,
}: TokenDetailsHeaderProps) {
  const { t } = useTranslation()
  return (
    <Flex mx="sm">
      <CurrencyLogo currency={currency} size={36} />
      <Flex row alignItems="center" gap="xs">
        <Text color="textPrimary" numberOfLines={1} style={flex.shrink} variant="subheadLarge">
          {currency.name ?? t('Unknown token')}
        </Text>
        {/* Suppress warning icon on low warning level */}
        {(tokenWarningLevel === TokenWarningLevel.MEDIUM ||
          tokenWarningLevel === TokenWarningLevel.BLOCKED) && (
          <TouchableArea onPress={onPressWarningIcon}>
            <WarningIcon
              height={theme.iconSizes.md}
              tokenWarningLevel={tokenWarningLevel}
              width={theme.imageSizes.sm}
            />
          </TouchableArea>
        )}
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

enum TransactionType {
  BUY,
  SELL,
  SEND,
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
  // set if attempting buy or sell, use for warning modal
  const [activeTransactionType, setActiveTransactionType] = useState<TransactionType | undefined>(
    undefined
  )
  const [showWarningModal, setShowWarningModal] = useState(false)
  const { tokenWarningLevel, tokenWarningDismissed, warningDismissCallback } = useTokenWarningLevel(
    currency.wrapped
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
      showRecipientSelector: true,
    }
  }, [currency])

  const navigateToSwapBuy = useCallback(() => {
    setActiveTransactionType(undefined)
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
    setActiveTransactionType(undefined)
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
    (swapType: TransactionType.BUY | TransactionType.SELL) => {
      // show warning modal speedbump if token has a warning level and user has not dismissed
      if (tokenWarningLevel !== TokenWarningLevel.NONE && !tokenWarningDismissed) {
        setActiveTransactionType(swapType)
        setShowWarningModal(true)
      } else {
        if (swapType === TransactionType.BUY) {
          navigateToSwapBuy()
        }
        if (swapType === TransactionType.SELL) {
          navigateToSwapSell()
        }
        return
      }
    },
    [navigateToSwapBuy, navigateToSwapSell, tokenWarningDismissed, tokenWarningLevel]
  )

  const onPressSend = useCallback(() => {
    // show warning modal speedbump if token has a warning level and user has not dismissed
    if (tokenWarningLevel !== TokenWarningLevel.NONE && !tokenWarningDismissed) {
      setActiveTransactionType(TransactionType.SEND)
      setShowWarningModal(true)
    } else {
      dispatch(openModal({ name: ModalName.Send, ...{ initialState: initialSendState } }))
    }
  }, [tokenWarningLevel, tokenWarningDismissed, dispatch, initialSendState])

  const onAcceptWarning = useCallback(() => {
    warningDismissCallback()
    setShowWarningModal(false)
    if (activeTransactionType === TransactionType.BUY) {
      navigateToSwapBuy()
    } else if (activeTransactionType === TransactionType.SELL) {
      navigateToSwapSell()
    } else if (activeTransactionType === TransactionType.SEND) {
      navigateToSwapSell()
      dispatch(openModal({ name: ModalName.Send, ...{ initialState: initialSendState } }))
    }
  }, [
    activeTransactionType,
    dispatch,
    initialSendState,
    navigateToSwapBuy,
    navigateToSwapSell,
    warningDismissCallback,
  ])

  return (
    <Box flex={1} mb="md">
      <HeaderScrollScreen
        contentHeader={
          <TokenDetailsBackButtonRow currency={currency} otherChainBalances={otherChainBalances} />
        }
        fixedHeader={
          <BackHeader>
            <HeaderTitleElement currency={currency} tokenProject={data?.tokenProjects?.[0]} />
          </BackHeader>
        }>
        <Flex gap="xl" my="md">
          <Flex gap="xxs">
            <TokenDetailsHeader
              currency={currency}
              tokenWarningLevel={tokenWarningLevel}
              onPressWarningIcon={() => setShowWarningModal(true)}
            />
            <CurrencyPriceChart currency={currency} />
          </Flex>
          <Flex gap="lg">
            <TokenBalances
              currentChainBalance={currentChainBalance}
              otherChainBalances={otherChainBalances}
            />
            <Flex gap="lg" mx="md">
              <TokenDetailsStats
                currency={currency}
                token={data?.tokens?.[0]}
                tokenProject={data?.tokenProjects?.[0]}
              />
            </Flex>
          </Flex>
        </Flex>
      </HeaderScrollScreen>
      <Flex
        row
        bg="background0"
        borderTopColor="backgroundOutline"
        borderTopWidth={1}
        gap="xs"
        pb="md"
        pt="sm"
        px="lg">
        <Button
          fill
          label={t('Swap')}
          size={ButtonSize.Large}
          onPress={() =>
            onPressSwap(currentChainBalance ? TransactionType.SELL : TransactionType.BUY)
          }
        />
        {currentChainBalance && (
          <Button
            IconName={SendIcon}
            emphasis={ButtonEmphasis.Secondary}
            name={ElementName.Send}
            size={ButtonSize.Large}
            onPress={onPressSend}
          />
        )}
      </Flex>
      <TokenWarningModal
        currency={currency}
        disableAccept={!activeTransactionType || tokenWarningLevel === TokenWarningLevel.BLOCKED}
        isVisible={showWarningModal}
        tokenWarningLevel={tokenWarningLevel}
        onAccept={onAcceptWarning}
        onClose={() => {
          setActiveTransactionType(undefined)
          setShowWarningModal(false)
        }}
      />
    </Box>
  )
}
