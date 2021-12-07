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
import { useDerivedSwapInfo, useSwapActionHandlers, useSwapCallback } from 'src/features/swap/hooks'
import { SwapDetailRow } from 'src/features/swap/SwapDetailsRow'
import { CurrencyField, SwapFormState } from 'src/features/swap/swapFormSlice'
import { stringifySwapInfoError, validateSwapInfo } from 'src/features/swap/validate'
import { AccountType } from 'src/features/wallet/accounts/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Theme } from 'src/styles/theme'
import { SagaStatus } from 'src/utils/saga'

interface SwapFormProps {
  state: SwapFormState
  dispatch: React.Dispatch<AnyAction>
}

// TODO: handle wrap eth
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
  } = derivedSwapInfo
  const swapInfoError = validateSwapInfo(derivedSwapInfo)

  const { onSelectCurrency, onSwitchCurrencies, onEnterExactAmount } =
    useSwapActionHandlers(dispatch)
  const { swapCallback, swapState } = useSwapCallback(trade)

  // TODO:
  // -check approval status
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
    errorLabel = t`Fetching best price...`
  } else if (quoteStatus === 'error') {
    errorLabel = t`Quote error`
  } else if (activeAccount && activeAccount.type === AccountType.readonly) {
    // TODO: move check somewhere else?
    errorLabel = t('Watched account cannot swap')
  } else if (swapState?.status === SagaStatus.Failure) {
    errorLabel = t('Swap unsuccessful')
  }

  let swapStatusLabel = ''
  if (swapState?.status === SagaStatus.Success) {
    swapStatusLabel = t('Swap successful')
  } else if (swapState?.status === SagaStatus.Started) {
    swapStatusLabel = t('Swapping...')
  }

  const swapButtonDisabled = Boolean(!trade || errorLabel !== '')

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
        />

        <Box zIndex="popover">
          <Box style={StyleSheet.absoluteFill} alignItems="center" height={34}>
            <Box
              bg="gray50"
              borderRadius="lg"
              borderColor="white"
              borderWidth={4}
              justifyContent="center"
              alignItems="center">
              <Button
                onPress={onSwitchCurrencies}
                height={30}
                width={30}
                justifyContent="center"
                alignItems="center">
                <SwapArrow height={24} width={24} />
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
          backgroundColor="gray50"
        />
      </Box>
      <Box>
        <SwapDetailRow trade={trade} label={errorLabel ?? swapStatusLabel} />
        <PrimaryButton
          alignSelf="stretch"
          label={t('Swap')}
          icon={
            quoteStatus === 'loading' ? (
              <ActivityIndicator size={25} color={theme.colors.white} />
            ) : undefined
          }
          onPress={swapCallback}
          disabled={swapButtonDisabled}
          mt="md"
          {...(swapButtonDisabled ? { bg: 'gray400' } : {})}
        />
      </Box>
    </Box>
  )
}
