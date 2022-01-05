import { useTheme } from '@shopify/restyle'
import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet } from 'react-native'
import { AnyAction } from 'redux'
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
import { SwapDetailRow } from 'src/features/swap/SwapDetailsRow'
import { CurrencyField, SwapFormState } from 'src/features/swap/swapFormSlice'
import { isWrapAction } from 'src/features/swap/utils'
import { stringifySwapInfoError, validateSwapInfo } from 'src/features/swap/validate'
import { WrapType } from 'src/features/swap/wrapSaga'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Theme } from 'src/styles/theme'
import { SagaStatus } from 'src/utils/saga'

interface SwapFormProps {
  state: SwapFormState
  dispatch: React.Dispatch<AnyAction>
}

// TODO: token warnings
export function SwapForm(props: SwapFormProps) {
  const { state, dispatch } = props

  const activeAccount = useActiveAccount()

  const derivedSwapInfo = useDerivedSwapInfo(state)

  const {
    currencies,
    currencyAmounts,
    currencyBalances,
    trade: { trade: trade, status: quoteStatus },
    wrapType,
  } = derivedSwapInfo
  const swapInfoError = validateSwapInfo(derivedSwapInfo)

  const { onSelectCurrency, onSwitchCurrencies, onEnterExactAmount } =
    useSwapActionHandlers(dispatch)
  const { swapCallback, swapState } = useSwapCallback(trade)
  const { wrapCallback } = useWrapCallback(currencyAmounts[CurrencyField.INPUT], wrapType)

  // TODO:
  // -check erc20 permits
  // -handle max amount input/show max amount button
  // -handle price impact too high

  const theme = useTheme<Theme>()

  const { t } = useTranslation()

  // TODO: clear redux state on unmount?
  // useEffect(() => {
  //   return () => {
  //     dispatched(reset())
  //   }
  // }, [])

  // TODO: move to a helper function
  let errorLabel: string = ''
  if (swapInfoError !== null) {
    errorLabel = stringifySwapInfoError(swapInfoError, t)
  } else if (quoteStatus === 'loading') {
    errorLabel = t('Fetching best price...')
  } else if (quoteStatus === 'error') {
    errorLabel = t('Failed to fetch a quote')
  } else if (activeAccount && activeAccount.type === AccountType.readonly) {
    // TODO: move check somewhere else?
    errorLabel = t('Cannot swap on watched account')
  } else if (swapState?.status === SagaStatus.Failure) {
    errorLabel = t('Swap unsuccessful')
  }

  let swapStatusLabel = ''
  if (swapState?.status === SagaStatus.Success) {
    swapStatusLabel = t('Swap successful')
  } else if (swapState?.status === SagaStatus.Started) {
    swapStatusLabel = t('Swapping...')
  }

  const actionButtonDisabled = Boolean(!(isWrapAction(wrapType) || trade) || errorLabel)

  return (
    <Box paddingHorizontal="md" flex={1} justifyContent="space-between">
      <Box>
        {/* TODO: input currency selector should only token tokens in wallet */}
        <CurrencyInput
          currency={currencies[CurrencyField.INPUT]}
          currencyAmount={currencyAmounts[CurrencyField.INPUT]}
          currencyBalance={currencyBalances[CurrencyField.INPUT]}
          onSelectCurrency={(newCurrency: Currency) =>
            onSelectCurrency(CurrencyField.INPUT, newCurrency)
          }
          onSetAmount={(value) => onEnterExactAmount(CurrencyField.INPUT, value)}
          otherSelectedCurrency={currencies[CurrencyField.OUTPUT]}
          showNonZeroBalancesOnly={true}
        />

        <Box zIndex="popover">
          <Box style={StyleSheet.absoluteFill} alignItems="center" height={40}>
            <Box
              bg="background1"
              borderRadius="md"
              borderColor="white"
              borderWidth={4}
              justifyContent="center"
              alignItems="center"
              p="xs">
              <Button onPress={onSwitchCurrencies} justifyContent="center" alignItems="center">
                <SwapArrow height={20} width={20} />
              </Button>
            </Box>
          </Box>
        </Box>

        <CurrencyInput
          currency={currencies[CurrencyField.OUTPUT]}
          currencyBalance={currencyBalances[CurrencyField.OUTPUT]}
          currencyAmount={currencyAmounts[CurrencyField.OUTPUT]}
          onSelectCurrency={(newCurrency: Currency) =>
            onSelectCurrency(CurrencyField.OUTPUT, newCurrency)
          }
          onSetAmount={(value) => onEnterExactAmount(CurrencyField.OUTPUT, value)}
          showNonZeroBalancesOnly={false}
          otherSelectedCurrency={currencies[CurrencyField.INPUT]}
          title={t("You'll receive")}
          backgroundColor="background1"
        />
      </Box>
      <Box>
        {!isWrapAction(wrapType) && (
          <SwapDetailRow trade={trade} label={errorLabel ?? swapStatusLabel} />
        )}
        <PrimaryButton
          alignSelf="stretch"
          label={
            wrapType === WrapType.WRAP
              ? t('Wrap')
              : wrapType === WrapType.UNWRAP
              ? t('Unwrap')
              : t('Swap')
          }
          icon={
            quoteStatus === 'loading' ? (
              <ActivityIndicator size={25} color={theme.colors.white} />
            ) : undefined
          }
          onPress={() => {
            if (isWrapAction(wrapType)) {
              wrapCallback()
            } else {
              swapCallback()
            }
          }}
          disabled={actionButtonDisabled}
          mt="md"
          bg={actionButtonDisabled ? 'gray400' : undefined}
        />
      </Box>
    </Box>
  )
}
