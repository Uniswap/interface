import { StackActions } from '@react-navigation/native'
import { useTheme } from '@shopify/restyle'
import { Currency } from '@uniswap/sdk-core'
import { notificationAsync } from 'expo-haptics'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Keyboard, StyleSheet } from 'react-native'
import { AnyAction } from 'redux'
import { useAppStackNavigation } from 'src/app/navigation/types'
import SwapArrow from 'src/assets/icons/swap-arrow.svg'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { CurrencyInput } from 'src/components/input/CurrencyInput'
import { Box } from 'src/components/layout/Box'
import {
  useDerivedSwapInfo,
  useSwapActionHandlers,
  useSwapCallback,
  useWrapCallback,
} from 'src/features/swap/hooks'
import { SwapDetails } from 'src/features/swap/SwapDetails'
import { SwapDetailRow } from 'src/features/swap/SwapDetailsRow'
import { CurrencyField, SwapFormState } from 'src/features/swap/swapFormSlice'
import { isWrapAction } from 'src/features/swap/utils'
import { getHumanReadableSwapInputStatus } from 'src/features/swap/validate'
import { WrapType } from 'src/features/swap/wrapSaga'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Theme } from 'src/styles/theme'

interface SwapFormProps {
  state: SwapFormState
  dispatch: React.Dispatch<AnyAction>
}

// TODO:
// -check erc20 permits
// -handle price impact too high
// TODO: token warnings
export function SwapForm(props: SwapFormProps) {
  const { state, dispatch } = props

  const activeAccount = useActiveAccount()
  const navigation = useAppStackNavigation()
  const theme = useTheme<Theme>()
  const { t } = useTranslation()

  const onSubmit = useCallback(() => {
    navigation.dispatch(StackActions.popToTop())
  }, [navigation])

  const derivedSwapInfo = useDerivedSwapInfo(state)

  const {
    currencies,
    currencyAmounts,
    currencyBalances,
    trade: { trade: trade, status: quoteStatus },
    wrapType,
  } = derivedSwapInfo

  const { onSelectCurrency, onSwitchCurrencies, onEnterExactAmount } =
    useSwapActionHandlers(dispatch)
  const { swapCallback } = useSwapCallback(trade, onSubmit)
  const { wrapCallback } = useWrapCallback(currencyAmounts[CurrencyField.INPUT], wrapType, onSubmit)

  const swapInputStatusMessage = getHumanReadableSwapInputStatus(activeAccount, derivedSwapInfo, t)
  const actionButtonDisabled = Boolean(!(isWrapAction(wrapType) || trade) || swapInputStatusMessage)

  return (
    <Button flex={1} onPress={() => Keyboard.dismiss()}>
      <Box flex={1} justifyContent="space-between" px="md">
        <Box>
          <CurrencyInput
            currency={currencies[CurrencyField.INPUT]}
            currencyAmount={currencyAmounts[CurrencyField.INPUT]}
            currencyBalance={currencyBalances[CurrencyField.INPUT]}
            otherSelectedCurrency={currencies[CurrencyField.OUTPUT]}
            showNonZeroBalancesOnly={true}
            onSelectCurrency={(newCurrency: Currency) =>
              onSelectCurrency(CurrencyField.INPUT, newCurrency)
            }
            onSetAmount={(value) => onEnterExactAmount(CurrencyField.INPUT, value)}
          />
          <Box zIndex="popover">
            <Box alignItems="center" height={40} style={StyleSheet.absoluteFill}>
              <Box
                alignItems="center"
                bg="background1"
                borderColor="white"
                borderRadius="md"
                borderWidth={4}
                justifyContent="center"
                p="xs">
                <Button alignItems="center" justifyContent="center" onPress={onSwitchCurrencies}>
                  <SwapArrow height={20} width={20} />
                </Button>
              </Box>
            </Box>
          </Box>
          <CurrencyInput
            backgroundColor="background1"
            currency={currencies[CurrencyField.OUTPUT]}
            currencyAmount={currencyAmounts[CurrencyField.OUTPUT]}
            currencyBalance={currencyBalances[CurrencyField.OUTPUT]}
            otherSelectedCurrency={currencies[CurrencyField.INPUT]}
            showNonZeroBalancesOnly={false}
            title={t("You'll receive")}
            onSelectCurrency={(newCurrency: Currency) =>
              onSelectCurrency(CurrencyField.OUTPUT, newCurrency)
            }
            onSetAmount={(value) => onEnterExactAmount(CurrencyField.OUTPUT, value)}
          />
          {!isWrapAction(wrapType) && (
            <Box mt="md">
              <SwapDetailRow label={swapInputStatusMessage} trade={trade} />
            </Box>
          )}
        </Box>
        <Box>
          {!isWrapAction(wrapType) && trade && quoteStatus === 'success' && (
            <SwapDetails
              currencyIn={currencyAmounts[CurrencyField.INPUT]}
              currencyOut={currencyAmounts[CurrencyField.OUTPUT]}
              trade={trade}
            />
          )}
          <PrimaryButton
            alignSelf="stretch"
            bg={actionButtonDisabled ? 'gray400' : undefined}
            disabled={actionButtonDisabled}
            icon={
              quoteStatus === 'loading' ? (
                <ActivityIndicator color={theme.colors.white} size={25} />
              ) : undefined
            }
            label={
              wrapType === WrapType.WRAP
                ? t('Wrap')
                : wrapType === WrapType.UNWRAP
                ? t('Unwrap')
                : t('Swap')
            }
            mt="md"
            onPress={() => {
              notificationAsync()
              if (isWrapAction(wrapType)) {
                wrapCallback()
              } else {
                swapCallback()
              }
            }}
          />
        </Box>
      </Box>
    </Button>
  )
}
