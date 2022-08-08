import { Currency } from '@uniswap/sdk-core'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { HomeStackScreenProp } from 'src/app/navigation/types'
import { BackButton } from 'src/components/buttons/BackButton'
import { Button } from 'src/components/buttons/Button'
import { IconButton } from 'src/components/buttons/IconButton'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { SendButton } from 'src/components/buttons/SendButton'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { Chevron } from 'src/components/icons/Chevron'
import { Heart } from 'src/components/icons/Heart'
import { Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Box } from 'src/components/layout/Box'
import { HeaderScrollScreen } from 'src/components/layout/screens/HeaderScrollScreen'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { CurrencyPriceChart } from 'src/components/PriceChart'
import { Text } from 'src/components/Text'
import { TokenBalances } from 'src/components/TokenDetails/TokenBalances'
import { TokenDetailsStats } from 'src/components/TokenDetails/TokenDetailsStats'
import TokenWarningCard from 'src/components/tokens/TokenWarningCard'
import TokenWarningModalContent from 'src/components/tokens/TokenWarningModalContent'
import { CHAIN_INFO } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { useSingleBalance } from 'src/features/dataApi/balances'
import { useSpotPrices } from 'src/features/dataApi/prices'
import { useToggleFavoriteCallback } from 'src/features/favorites/hooks'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { openModal } from 'src/features/modals/modalSlice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useCurrency } from 'src/features/tokens/useCurrency'
import { TokenWarningLevel, useTokenWarningLevel } from 'src/features/tokens/useTokenWarningLevel'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import { Screens } from 'src/screens/Screens'
import { currencyAddress, currencyId } from 'src/utils/currencyId'
import { formatUSDPrice } from 'src/utils/format'

interface TokenDetailsHeaderProps {
  currency: Currency
}

function BackButtonRow({ currency }: TokenDetailsHeaderProps) {
  const theme = useAppTheme()
  return (
    <Flex row alignItems="center" justifyContent="space-between" pt="sm">
      <BackButton showButtonLabel />
      <Button>
        <Flex centered row bg="backgroundContainer" borderRadius="sm" gap="xxs" p="xs">
          <NetworkLogo chainId={currency.chainId} size={16} />
          <Text color="textSecondary" pl="xxxs" textAlign="center" variant="smallLabel">
            {CHAIN_INFO[currency.chainId].label}
          </Text>
          <Chevron color={theme.colors.textSecondary} direction="s" height={16} width={16} />
        </Flex>
      </Button>
    </Flex>
  )
}

function TokenDetailsHeader({ currency }: TokenDetailsHeaderProps) {
  const { t } = useTranslation()

  const isFavoriteToken = useAppSelector(selectFavoriteTokensSet).has(currencyId(currency))
  const onFavoritePress = useToggleFavoriteCallback(currencyId(currency))

  return (
    <Flex row justifyContent="space-between" mx="md">
      <Flex centered row gap="xs">
        <CurrencyLogo currency={currency} size={32} />
        <Box>
          <Text variant="headlineSmall">{currency.name ?? t('Unknown token')}</Text>
          <Text color="textTertiary" variant="caption">
            {currency.symbol ?? t('Unknown token')}
          </Text>
        </Box>
      </Flex>
      <Flex row gap="none">
        <SendButton iconOnly bg="none" iconColor="textPrimary" iconSize={21} />
        <IconButton
          icon={<Heart active={isFavoriteToken} size={21} />}
          px="none"
          variant="transparent"
          onPress={onFavoritePress}
        />
      </Flex>
    </Flex>
  )
}

function HeaderTitleElement({ currency }: TokenDetailsHeaderProps) {
  const { t } = useTranslation()
  const currencies = useMemo(() => [currency], [currency])

  const { loading, spotPrices } = useSpotPrices(currencies)

  return (
    <Flex centered gap="none">
      <Flex centered row gap="xxs">
        <CurrencyLogo currency={currency} size={20} />
        <Text variant="subhead">{currency.name ?? t('Unknown token')}</Text>
      </Flex>
      {loading ? null : (
        <Text color="textTertiary" variant="caption">
          {formatUSDPrice(spotPrices[currencyId(currency)]?.price) ?? t('Unknown token')}
        </Text>
      )}
    </Flex>
  )
}

enum SwapType {
  BUY,
  SELL,
}

export function TokenDetailsScreen({ route }: HomeStackScreenProp<Screens.TokenDetails>) {
  const { currencyId: _currencyId } = route.params

  const currency = useCurrency(_currencyId)

  if (!currency) return null
  return <TokenDetails currency={currency} />
}

function TokenDetails({ currency }: { currency: Currency }) {
  const balance = useSingleBalance(currency)

  const dispatch = useAppDispatch()
  const { t } = useTranslation()

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
        contentHeader={<BackButtonRow currency={currency} />}
        fixedHeader={
          <BackHeader>
            <HeaderTitleElement currency={currency} />
          </BackHeader>
        }>
        <Flex gap="md" my="md">
          <TokenDetailsHeader currency={currency} />
          <CurrencyPriceChart currency={currency} />
          {balance && <TokenBalances balance={balance} />}
          <TokenDetailsStats currency={currency} />
          {tokenWarningLevel !== TokenWarningLevel.NONE && !tokenWarningDismissed && (
            <Box mx="md">
              <TokenWarningCard
                tokenWarningLevel={tokenWarningLevel}
                onDismiss={warningDismissCallback}
              />
            </Box>
          )}
        </Flex>
      </HeaderScrollScreen>
      <Flex row bg="backgroundBackdrop" gap="sm" px="sm" py="xs">
        <PrimaryButton
          disabled={tokenWarningLevel === TokenWarningLevel.BLOCKED}
          flex={1}
          label={t('Buy')}
          name={ElementName.BuyToken}
          textVariant="mediumLabel"
          onPress={() => onPressSwap(SwapType.BUY)}
        />
        {balance && (
          <PrimaryButton
            disabled={tokenWarningLevel === TokenWarningLevel.BLOCKED}
            flex={1}
            label={t('Sell')}
            name={ElementName.SellToken}
            textVariant="mediumLabel"
            variant="gray"
            onPress={() => onPressSwap(SwapType.SELL)}
          />
        )}
        {balance && (
          <SendButton
            iconOnly
            disabled={!balance}
            iconStrokeWidth={1.5}
            initialState={initialSendState}
          />
        )}
      </Flex>
      <BottomSheetModal
        isVisible={
          activeSwapAttemptType === SwapType.BUY || activeSwapAttemptType === SwapType.SELL
        }
        name={ModalName.TokenWarningModal}
        onClose={() => setActiveSwapAttemptType(undefined)}>
        <TokenWarningModalContent
          currency={currency}
          onAccept={activeSwapAttemptType === SwapType.BUY ? navigateToSwapBuy : navigateToSwapSell}
          onClose={() => setActiveSwapAttemptType(undefined)}
        />
      </BottomSheetModal>
    </>
  )
}
