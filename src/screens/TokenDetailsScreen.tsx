import { Currency } from '@uniswap/sdk-core'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { HomeStackScreenProp, useHomeStackNavigation } from 'src/app/navigation/types'
import SendIcon from 'src/assets/icons/send.svg'
import { BackButton } from 'src/components/buttons/BackButton'
import { IconButton } from 'src/components/buttons/IconButton'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Star } from 'src/components/icons/Star'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Screen } from 'src/components/layout/Screen'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { PriceChart } from 'src/components/PriceChart'
import { Text } from 'src/components/Text'
import { TokenBalanceItem } from 'src/components/TokenBalanceList/TokenBalanceItem'
import TokenWarningCard from 'src/components/tokens/TokenWarningCard'
import TokenWarningModalContent from 'src/components/tokens/TokenWarningModalContent'
import { AssetType } from 'src/entities/assets'
import { useSingleBalance } from 'src/features/dataApi/balances'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { addFavoriteToken, removeFavoriteToken } from 'src/features/favorites/slice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useCurrency } from 'src/features/tokens/useCurrency'
import { TokenWarningLevel, useTokenWarningLevel } from 'src/features/tokens/useTokenWarningLevel'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import { Screens } from 'src/screens/Screens'
import { currencyAddress, currencyId } from 'src/utils/currencyId'

interface TokenDetailsHeaderProps {
  currency: Currency
}

function TokenDetailsHeader({ currency }: TokenDetailsHeaderProps) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const isFavoriteToken = useAppSelector(selectFavoriteTokensSet).has(currencyId(currency))

  const onFavoritePress = () => {
    if (isFavoriteToken) {
      dispatch(removeFavoriteToken({ currencyId: currencyId(currency) }))
    } else {
      dispatch(addFavoriteToken({ currencyId: currencyId(currency) }))
    }
  }

  return (
    <CenterBox flexDirection="row" justifyContent="space-between" my="md">
      <BackButton ml="lg" />
      <Flex centered row gap="sm">
        <CurrencyLogo currency={currency} size={30} />
        <Text variant="h2">{currency.symbol ?? t('Unknown token')}</Text>
      </Flex>
      <IconButton
        icon={<Star active={isFavoriteToken} size={24} />}
        mr="sm"
        variant="transparent"
        onPress={onFavoritePress}
      />
    </CenterBox>
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
    navigation.push(Screens.Swap, { swapFormState })
  }, [currency, navigation])

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
    navigation.push(Screens.Swap, { swapFormState })
  }, [currency, navigation])

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
    <Screen>
      <TokenDetailsHeader currency={currency} />
      <ScrollView>
        <Flex gap="lg">
          <PriceChart currency={currency} />
          <Box>
            {balance && (
              <Box mx="lg">
                <Text color="deprecated_gray600" variant="body2">
                  {t('Your balance')}
                </Text>
                <TokenBalanceItem balance={balance} />
              </Box>
            )}
            <Flex flexDirection="row" gap="sm" mx="lg" my="md">
              <PrimaryButton
                disabled={tokenWarningLevel === TokenWarningLevel.BLOCKED}
                flex={1}
                label={t('Buy')}
                name={ElementName.BuyToken}
                textVariant="mediumLabel"
                onPress={() => onPressSwap(SwapType.BUY)}
              />
              <PrimaryButton
                disabled={!balance || tokenWarningLevel === TokenWarningLevel.BLOCKED}
                flex={1}
                label={t('Sell')}
                name={ElementName.SellToken}
                textVariant="mediumLabel"
                variant="gray"
                onPress={() => onPressSwap(SwapType.SELL)}
              />
              <IconButton
                bg="deprecated_gray100"
                borderRadius="md"
                disabled={!balance}
                icon={
                  <SendIcon
                    color={theme.colors.deprecated_textColor}
                    height={20}
                    strokeWidth={1.5}
                    width={20}
                  />
                }
                justifyContent="center"
                px="md"
                onPress={onPressSend}
              />
            </Flex>
            {tokenWarningLevel !== TokenWarningLevel.NONE && !tokenWarningDismissed && (
              <Box mx="lg">
                <TokenWarningCard
                  tokenWarningLevel={tokenWarningLevel}
                  onDismiss={warningDismissCallback}
                />
              </Box>
            )}
          </Box>
        </Flex>
      </ScrollView>
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
    </Screen>
  )
}
