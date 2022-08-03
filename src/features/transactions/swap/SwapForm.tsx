import { AnyAction } from '@reduxjs/toolkit'
import { Currency } from '@uniswap/sdk-core'
import React, { Dispatch } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { FadeIn, FadeOut, FadeOutDown } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import InfoCircle from 'src/assets/icons/info-circle.svg'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TransferArrowButton } from 'src/components/buttons/TransferArrowButton'
import { CurrencyInputPanel } from 'src/components/input/CurrencyInputPanel'
import { DecimalPad } from 'src/components/input/DecimalPad'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { Text } from 'src/components/Text'
import { WarningAction, WarningModalType } from 'src/components/warnings/types'
import { getWarningColor } from 'src/components/warnings/utils'
import { ElementName, SectionName } from 'src/features/telemetry/constants'
import { Trace } from 'src/features/telemetry/Trace'
import {
  DerivedSwapInfo,
  useSwapActionHandlers,
  useUpdateSwapGasEstimate,
  useUSDTokenUpdater,
} from 'src/features/transactions/swap/hooks'
import { getReviewActionName, isWrapAction } from 'src/features/transactions/swap/utils'
import { showWarningInPanel } from 'src/features/transactions/swap/validate'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { createTransactionId } from 'src/features/transactions/utils'

interface SwapFormProps {
  dispatch: Dispatch<AnyAction>
  onNext: () => void
  derivedSwapInfo: DerivedSwapInfo
  isCompressedView: boolean
}

export function SwapForm({ dispatch, onNext, derivedSwapInfo, isCompressedView }: SwapFormProps) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const {
    currencies,
    currencyAmounts,
    currencyBalances,
    exactCurrencyField,
    exactAmountToken,
    exactAmountUSD = '',
    formattedAmounts,
    trade,
    wrapType,
    isUSDInput = false,
    warnings,
  } = derivedSwapInfo

  const {
    onSelectCurrency,
    onSwitchCurrencies,
    onSetAmount,
    onSetMax,
    onToggleUSDInput,
    onShowSwapWarning,
    onCreateTxId,
    onUpdateExactCurrencyField,
  } = useSwapActionHandlers(dispatch)

  const exactCurrency = currencies[exactCurrencyField]
  useUSDTokenUpdater(
    dispatch,
    isUSDInput,
    exactAmountToken,
    exactAmountUSD,
    exactCurrency ?? undefined
  )

  useUpdateSwapGasEstimate(dispatch, trade.trade)

  const outputNotLoaded = !!(
    formattedAmounts[CurrencyField.INPUT] &&
    currencies[CurrencyField.OUTPUT] &&
    !formattedAmounts[CurrencyField.OUTPUT]
  )
  const inputNotLoaded = !!(
    formattedAmounts[CurrencyField.OUTPUT] &&
    currencies[CurrencyField.INPUT] &&
    !formattedAmounts[CurrencyField.INPUT]
  )

  const otherAmountNotLoaded = outputNotLoaded || inputNotLoaded

  const swapDataRefreshing = trade.isFetching || trade.loading || otherAmountNotLoaded

  const noValidSwap = !isWrapAction(wrapType) && !trade
  const blockWarning = warnings.some((warning) => warning.action === WarningAction.DisableReview)

  const actionButtonDisabled = noValidSwap || blockWarning || swapDataRefreshing

  const swapWarning = warnings.find(showWarningInPanel)
  const swapWarningColor = getWarningColor(swapWarning)

  const onReview = () => {
    const txId = createTransactionId()
    onCreateTxId(txId)
    onNext()
  }

  const onCurrencyInputPress = (currencyField: CurrencyField) => () => {
    const newExactAmount = formattedAmounts[currencyField]
    onUpdateExactCurrencyField(currencyField, newExactAmount)
  }

  return (
    <Flex grow gap="none" justifyContent="space-between">
      <AnimatedFlex grow entering={FadeIn} exiting={FadeOut} gap="sm">
        <Trace section={SectionName.CurrencyInputPanel}>
          <CurrencyInputPanel
            currency={currencies[CurrencyField.INPUT]}
            currencyAmount={currencyAmounts[CurrencyField.INPUT]}
            currencyBalance={currencyBalances[CurrencyField.INPUT]}
            dimTextColor={exactCurrencyField === CurrencyField.OUTPUT && swapDataRefreshing}
            focus={exactCurrencyField === CurrencyField.INPUT}
            isUSDInput={isUSDInput}
            otherSelectedCurrency={currencies[CurrencyField.OUTPUT]}
            showSoftInputOnFocus={isCompressedView}
            value={formattedAmounts[CurrencyField.INPUT]}
            warnings={warnings}
            onPressIn={onCurrencyInputPress(CurrencyField.INPUT)}
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
            backgroundColor={currencies[CurrencyField.OUTPUT] ? 'backgroundContainer' : 'none'}
            borderRadius="lg"
            mb="sm"
            mt="lg"
            mx="md"
            position="relative">
            <Box bottom={12} height={24} position="absolute" right={12} width={24}>
              {swapDataRefreshing ? <SpinningLoader color="textSecondary" size={24} /> : null}
            </Box>
            <Box zIndex="popover">
              <Box alignItems="center" height={36} style={StyleSheet.absoluteFill}>
                <Box alignItems="center" position="absolute" top="-100%">
                  <TransferArrowButton
                    bg={currencies[CurrencyField.OUTPUT] ? 'backgroundAction' : 'backgroundSurface'}
                    disabled={!currencies[CurrencyField.OUTPUT]}
                    onPress={onSwitchCurrencies}
                  />
                </Box>
              </Box>
            </Box>
            <Flex>
              <Flex pb={swapWarning ? 'xxs' : 'lg'} pt="xs" px="md">
                <CurrencyInputPanel
                  isOutput
                  currency={currencies[CurrencyField.OUTPUT]}
                  currencyAmount={currencyAmounts[CurrencyField.OUTPUT]}
                  currencyBalance={currencyBalances[CurrencyField.OUTPUT]}
                  dimTextColor={exactCurrencyField === CurrencyField.INPUT && swapDataRefreshing}
                  focus={exactCurrencyField === CurrencyField.OUTPUT}
                  isUSDInput={isUSDInput}
                  otherSelectedCurrency={currencies[CurrencyField.INPUT]}
                  showNonZeroBalancesOnly={false}
                  showSoftInputOnFocus={isCompressedView}
                  value={formattedAmounts[CurrencyField.OUTPUT]}
                  warnings={warnings}
                  onPressIn={onCurrencyInputPress(CurrencyField.OUTPUT)}
                  onSelectCurrency={(newCurrency: Currency) =>
                    onSelectCurrency(CurrencyField.OUTPUT, newCurrency)
                  }
                  onSetAmount={(value) => onSetAmount(CurrencyField.OUTPUT, value, isUSDInput)}
                />
              </Flex>
              {swapWarning ? (
                <Button onPress={() => onShowSwapWarning(WarningModalType.INFORMATIONAL)}>
                  <Flex
                    centered
                    row
                    alignItems="center"
                    alignSelf="stretch"
                    backgroundColor={swapWarningColor.background}
                    borderBottomLeftRadius="lg"
                    borderBottomRightRadius="lg"
                    flexGrow={1}
                    gap="xs"
                    p="sm">
                    <Text color={swapWarningColor.text} fontWeight="600" variant="caption">
                      {swapWarning.title}
                    </Text>
                    <InfoCircle
                      color={theme.colors.accentTextLightSecondary}
                      height={18}
                      width={18}
                    />
                  </Flex>
                </Button>
              ) : null}
            </Flex>
          </Flex>
        </Trace>
      </AnimatedFlex>
      <AnimatedFlex exiting={FadeOutDown} gap="sm" justifyContent="flex-end" mb="lg" px="sm">
        {!isCompressedView ? (
          <DecimalPad
            setValue={(value: string) => onSetAmount(exactCurrencyField, value, isUSDInput)}
            value={formattedAmounts[exactCurrencyField]}
          />
        ) : null}
        <PrimaryButton
          disabled={actionButtonDisabled}
          label={getReviewActionName(t, wrapType)}
          name={ElementName.ReviewSwap}
          py="md"
          testID={ElementName.ReviewSwap}
          textVariant="largeLabel"
          variant="blue"
          onPress={onReview}
        />
      </AnimatedFlex>
    </Flex>
  )
}
