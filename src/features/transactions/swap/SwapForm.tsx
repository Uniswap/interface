import { AnyAction } from '@reduxjs/toolkit'
import { Currency } from '@uniswap/sdk-core'
import React, { Dispatch } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TransferArrowButton } from 'src/components/buttons/TransferArrowButton'
import { CurrencyInputPanel } from 'src/components/input/CurrencyInputPanel'
import { DecimalPad } from 'src/components/input/DecimalPad'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { ElementName, SectionName } from 'src/features/telemetry/constants'
import { Trace } from 'src/features/telemetry/Trace'
import {
  useDerivedSwapInfo,
  useSwapActionHandlers,
  useUpdateSwapGasEstimate,
  useUSDTokenUpdater,
} from 'src/features/transactions/swap/hooks'
import { isWrapAction } from 'src/features/transactions/swap/utils'
import { getHumanReadableSwapInputStatus } from 'src/features/transactions/swap/validate'
import {
  CurrencyField,
  TransactionState,
} from 'src/features/transactions/transactionState/transactionState'
import { useActiveAccount } from 'src/features/wallet/hooks'

interface SwapFormProps {
  state: TransactionState
  dispatch: Dispatch<AnyAction>
  onNext: () => void
}

// TODO:
// -check erc20 permits
// -handle price impact too high
// TODO: token warnings
export function SwapForm({ state, dispatch, onNext }: SwapFormProps) {
  const activeAccount = useActiveAccount()
  const { t } = useTranslation()
  const derivedSwapInfo = useDerivedSwapInfo(state)

  const {
    currencies,
    currencyAmounts,
    currencyBalances,
    exactCurrencyField,
    exactAmountToken,
    exactAmountUSD = '',
    formattedAmounts,
    trade: { trade: trade },
    wrapType,
    isUSDInput = false,
  } = derivedSwapInfo

  const { onSelectCurrency, onSwitchCurrencies, onSetAmount, onSetMax, onToggleUSDInput } =
    useSwapActionHandlers(dispatch)

  const exactCurrency = currencies[exactCurrencyField]
  useUSDTokenUpdater(
    dispatch,
    isUSDInput,
    exactAmountToken,
    exactAmountUSD,
    exactCurrency ?? undefined
  )

  useUpdateSwapGasEstimate(dispatch, trade)

  const swapInputStatusMessage = getHumanReadableSwapInputStatus(activeAccount, derivedSwapInfo, t)
  const actionButtonDisabled = Boolean(!(isWrapAction(wrapType) || trade) || swapInputStatusMessage)

  return (
    <>
      <Flex gap="sm" justifyContent="center">
        <Trace section={SectionName.CurrencyInputPanel}>
          <CurrencyInputPanel
            autoFocus
            currency={currencies[CurrencyField.INPUT]}
            currencyAmount={currencyAmounts[CurrencyField.INPUT]}
            currencyBalance={currencyBalances[CurrencyField.INPUT]}
            isUSDInput={isUSDInput}
            otherSelectedCurrency={currencies[CurrencyField.OUTPUT]}
            value={formattedAmounts[CurrencyField.INPUT]}
            onSelectCurrency={(newCurrency: Currency) =>
              onSelectCurrency(CurrencyField.INPUT, newCurrency)
            }
            onSetAmount={(value) => onSetAmount(CurrencyField.INPUT, value, isUSDInput)}
            onSetMax={onSetMax}
            onToggleUSDInput={() => onToggleUSDInput(!isUSDInput)}
          />
        </Trace>

        <Trace section={SectionName.CurrencyOutputPanel}>
          <Flex
            backgroundColor={currencies[CurrencyField.OUTPUT] ? 'backgroundSurface' : 'none'}
            borderRadius="lg"
            mb="sm"
            mt="xl"
            mx="md"
            position="relative">
            <Box zIndex="popover">
              <Box alignItems="center" height={36} style={StyleSheet.absoluteFill}>
                <Box alignItems="center" position="absolute" top={-24}>
                  <TransferArrowButton
                    disabled={!currencies[CurrencyField.OUTPUT]}
                    onPress={onSwitchCurrencies}
                  />
                </Box>
              </Box>
            </Box>
            <Flex pb="md" pt="md" px="md">
              <CurrencyInputPanel
                isOutput
                currency={currencies[CurrencyField.OUTPUT]}
                currencyAmount={currencyAmounts[CurrencyField.OUTPUT]}
                currencyBalance={currencyBalances[CurrencyField.OUTPUT]}
                isUSDInput={isUSDInput}
                otherSelectedCurrency={currencies[CurrencyField.INPUT]}
                showNonZeroBalancesOnly={false}
                value={formattedAmounts[CurrencyField.OUTPUT]}
                onSelectCurrency={(newCurrency: Currency) =>
                  onSelectCurrency(CurrencyField.OUTPUT, newCurrency)
                }
                onSetAmount={(value) => onSetAmount(CurrencyField.OUTPUT, value, isUSDInput)}
              />
            </Flex>
          </Flex>
        </Trace>
      </Flex>
      <Flex flexGrow={1} gap="sm" justifyContent="flex-end" mb="xl" mt="xs" px="sm">
        <DecimalPad
          setValue={(value: string) => onSetAmount(exactCurrencyField, value, isUSDInput)}
          value={formattedAmounts[exactCurrencyField]}
        />
        <PrimaryButton
          disabled={actionButtonDisabled}
          label={t('Review swap')}
          name={ElementName.ReviewSwap}
          py="md"
          textVariant="largeLabel"
          variant="blue"
          onPress={onNext}
        />
      </Flex>
    </>
  )
}
