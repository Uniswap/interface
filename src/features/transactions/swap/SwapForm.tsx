import { Currency } from '@uniswap/sdk-core'
import { notificationAsync } from 'expo-haptics'
import React, { useReducer } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { LongPressButton } from 'src/components/buttons/LongPressButton'
import { TransferArrowButton } from 'src/components/buttons/TransferArrowButton'
import { CurrencyInputPanel } from 'src/components/input/CurrencyInputPanel'
import { DecimalPad } from 'src/components/input/DecimalPad'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { useBiometricPrompt } from 'src/features/biometrics/hooks'
import { ElementName, SectionName } from 'src/features/telemetry/constants'
import { Trace } from 'src/features/telemetry/Trace'
import {
  useDerivedSwapInfo,
  useSwapActionHandlers,
  useSwapCallback,
  useUSDTokenUpdater,
  useWrapCallback,
} from 'src/features/transactions/swap/hooks'
import { isWrapAction } from 'src/features/transactions/swap/utils'
import { getHumanReadableSwapInputStatus } from 'src/features/transactions/swap/validate'
import { WrapType } from 'src/features/transactions/swap/wrapSaga'
import {
  CurrencyField,
  initialState as emptyState,
  TransactionState,
  transactionStateReducer,
} from 'src/features/transactions/transactionState/transactionState'
import { useActiveAccount } from 'src/features/wallet/hooks'

interface SwapFormProps {
  prefilledState?: TransactionState
  onClose: () => void
}

// TODO:
// -check erc20 permits
// -handle price impact too high
// TODO: token warnings
export function SwapForm({ prefilledState, onClose }: SwapFormProps) {
  const [state, dispatch] = useReducer(transactionStateReducer, prefilledState || emptyState)
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
    trade: { trade: trade, loading },
    wrapType,
    isUSDInput = false,
  } = derivedSwapInfo

  const { onSelectCurrency, onSwitchCurrencies, onSetAmount, onToggleUSDInput } =
    useSwapActionHandlers(dispatch)
  const exactCurrency = currencies[exactCurrencyField]

  useUSDTokenUpdater(
    dispatch,
    isUSDInput,
    exactAmountToken,
    exactAmountUSD,
    exactCurrency ?? undefined
  )
  const { swapCallback } = useSwapCallback(trade, onClose)
  const { wrapCallback } = useWrapCallback(currencyAmounts[CurrencyField.INPUT], wrapType, onClose)

  const swapInputStatusMessage = getHumanReadableSwapInputStatus(activeAccount, derivedSwapInfo, t)
  const actionButtonDisabled = Boolean(!(isWrapAction(wrapType) || trade) || swapInputStatusMessage)

  return (
    <Flex fill gap="xs" justifyContent="space-between" py="md">
      <Text textAlign="center" variant="subhead">
        {t('Swap')}
      </Text>
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
        <ActionButton
          callback={isWrapAction(wrapType) ? wrapCallback : swapCallback}
          disabled={actionButtonDisabled}
          label={
            wrapType === WrapType.Wrap
              ? t('Hold to wrap')
              : wrapType === WrapType.Unwrap
              ? t('Hold to unwrap')
              : t('Hold to swap')
          }
          loading={loading}
          name={
            wrapType === WrapType.Wrap
              ? ElementName.Wrap
              : wrapType === WrapType.Unwrap
              ? ElementName.Unwrap
              : ElementName.Swap
          }
        />
      </Flex>
    </Flex>
  )
}

type ActionButtonProps = {
  disabled: boolean
  name: ElementName
  label: string
  loading: boolean
  callback: () => void
}

function ActionButton({ callback, disabled, label, name }: ActionButtonProps) {
  const { trigger: actionButtonTrigger, modal: BiometricModal } = useBiometricPrompt(callback)

  return (
    <>
      <LongPressButton
        disabled={disabled}
        label={label}
        name={name}
        onComplete={() => {
          notificationAsync()
          actionButtonTrigger()
        }}
      />

      {BiometricModal}
    </>
  )
}
