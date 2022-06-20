import { Currency } from '@uniswap/sdk-core'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { HomeStackScreenProp, useHomeStackNavigation } from 'src/app/navigation/types'
import SendIcon from 'src/assets/icons/send.svg'
import { IconButton } from 'src/components/buttons/IconButton'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Heart } from 'src/components/icons/Heart'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { ScrollDetailScreen } from 'src/components/layout/ScrollDetailScreen'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { PriceChart } from 'src/components/PriceChart'
import { Text } from 'src/components/Text'
import TokenWarningCard from 'src/components/tokens/TokenWarningCard'
import TokenWarningModalContent from 'src/components/tokens/TokenWarningModalContent'
import { AssetType } from 'src/entities/assets'
import { useSingleBalance } from 'src/features/dataApi/balances'
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
import { formatCurrencyAmount, formatUSDPrice } from 'src/utils/format'

interface TokenDetailsHeaderProps {
  currency: Currency
}

function TokenDetailsHeader({ currency }: TokenDetailsHeaderProps) {
  const { t } = useTranslation()

  const isFavoriteToken = useAppSelector(selectFavoriteTokensSet).has(currencyId(currency))
  const onFavoritePress = useToggleFavoriteCallback(currencyId(currency))

  return (
    <Flex row justifyContent="space-between" mx="md">
      <Flex centered row gap="xs">
        <CurrencyLogo currency={currency} size={35} />
        <Box>
          <Text variant="h3">{currency.name ?? t('Unknown token')}</Text>
          <Text variant="caption">{currency.symbol ?? t('Unknown token')}</Text>
        </Box>
      </Flex>
      <IconButton
        icon={<Heart active={isFavoriteToken} size={24} />}
        px="none"
        variant="transparent"
        onPress={onFavoritePress}
      />
    </Flex>
  )
}

function HeaderTitleElement({ currency }: TokenDetailsHeaderProps) {
  const { t } = useTranslation()

  return (
    <Flex centered gap="none">
      <Flex centered row gap="xxs">
        <CurrencyLogo currency={currency} size={20} />
        <Text variant="subHead1">{currency.name ?? t('Unknown token')}</Text>
      </Flex>
      <Text variant="caption">{currency.symbol ?? t('Unknown token')}</Text>
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
  const navigation = useHomeStackNavigation()
  const balance = useSingleBalance(currency)

  const theme = useAppTheme()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const { tokenWarningLevel, tokenWarningDismissed, warningDismissCallback } = useTokenWarningLevel(
    currency.wrapped
  )

  // set if attempting buy or sell, use for warning modal
  const [activeSwapAttemptType, setActiveSwapAttemptType] = useState<SwapType | undefined>(
    undefined
  )

  const navigateToSwapBuy = useCallback(() => {
    setActiveSwapAttemptType(undefined)
    const swapFormState: TransactionState = {
      exactCurrencyField: CurrencyField.OUTPUT,
      exactAmount: '0',
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
      exactAmount: '0',
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

  const onPressSend = () => {
    const transferFormState: TransactionState = {
      exactCurrencyField: CurrencyField.INPUT,
      exactAmount: '1',
      [CurrencyField.INPUT]: {
        address: currencyAddress(currency),
        chainId: currency.wrapped.chainId,
        type: AssetType.Currency,
      },
      [CurrencyField.OUTPUT]: null,
    }
    navigation.push(Screens.Transfer, { transferFormState })
  }

  return (
    <>
      <ScrollDetailScreen titleElement={<HeaderTitleElement currency={currency} />}>
        <Flex gap="md" my="md">
          <TokenDetailsHeader currency={currency} />
          <PriceChart currency={currency} />
          {balance && (
            <Flex bg="neutralContainer" borderRadius="sm" gap="md" mx="md" p="md">
              <Text color="neutralTextSecondary" variant="subHead2">
                {t('Your balance')}
              </Text>
              <Flex row alignItems="center" justifyContent="space-between">
                <Text variant="h3">
                  {`${formatCurrencyAmount(balance.amount)}`} {currency.symbol}
                </Text>
                <Text variant="body1">{formatUSDPrice(balance.balanceUSD)}</Text>
              </Flex>
            </Flex>
          )}

          {tokenWarningLevel !== TokenWarningLevel.NONE && !tokenWarningDismissed && (
            <Box mx="md">
              <TokenWarningCard
                tokenWarningLevel={tokenWarningLevel}
                onDismiss={warningDismissCallback}
              />
            </Box>
          )}
        </Flex>
      </ScrollDetailScreen>
      <Flex row bg="neutralBackground" gap="sm" px="sm" py="xs">
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
          <IconButton
            bg="deprecated_gray100"
            borderRadius="md"
            disabled={!balance}
            icon={
              <SendIcon
                color={theme.colors.neutralTextSecondary}
                height={20}
                strokeWidth={1.5}
                width={20}
              />
            }
            justifyContent="center"
            px="md"
            onPress={onPressSend}
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
