import { AnyAction } from '@reduxjs/toolkit'
import React, { Dispatch, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TextInputProps } from 'react-native'
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
import { LaserLoader } from 'src/components/loading/LaserLoader'
import { WarningAction, WarningSeverity } from 'src/components/modals/types'
import WarningModal, { getAlertColor } from 'src/components/modals/WarningModal'
import { Text } from 'src/components/Text'
import { ElementName, ModalName, SectionName } from 'src/features/telemetry/constants'
import { Trace } from 'src/features/telemetry/Trace'
import {
  DerivedSwapInfo,
  useShowSwapNetworkNotification,
  useSwapActionHandlers,
  useUpdateSwapGasEstimate,
  useUSDTokenUpdater,
} from 'src/features/transactions/swap/hooks'
import { getReviewActionName, isWrapAction } from 'src/features/transactions/swap/utils'
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
    chainId,
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
    onSwitchCurrencies,
    onSetAmount,
    onSetMax,
    onToggleUSDInput,
    onCreateTxId,
    onUpdateExactCurrencyField,
    onShowTokenSelector,
  } = useSwapActionHandlers(dispatch)

  useUSDTokenUpdater(
    dispatch,
    isUSDInput,
    exactAmountToken,
    exactAmountUSD,
    currencies[exactCurrencyField] ?? undefined
  )
  useShowSwapNetworkNotification(chainId)
  useUpdateSwapGasEstimate(dispatch, trade.trade)

  const [showWarningModal, setShowWarningModal] = useState(false)

  const outputNotLoaded = !!(
    formattedAmounts[CurrencyField.INPUT] &&
    Number(formattedAmounts[CurrencyField.INPUT]) &&
    currencies[CurrencyField.OUTPUT] &&
    !formattedAmounts[CurrencyField.OUTPUT]
  )
  const inputNotLoaded = !!(
    formattedAmounts[CurrencyField.OUTPUT] &&
    Number(formattedAmounts[CurrencyField.OUTPUT]) &&
    currencies[CurrencyField.INPUT] &&
    !formattedAmounts[CurrencyField.INPUT]
  )

  const otherAmountNotLoaded = outputNotLoaded || inputNotLoaded

  const swapDataRefreshing =
    !isWrapAction(wrapType) && (trade.isFetching || trade.loading || otherAmountNotLoaded)

  const noValidSwap = !isWrapAction(wrapType) && !trade
  const blockingWarning = warnings.some((warning) => warning.action === WarningAction.DisableReview)

  const actionButtonDisabled = noValidSwap || blockingWarning || swapDataRefreshing

  const swapWarning = warnings.find((warning) => warning.severity >= WarningSeverity.Medium)
  const swapWarningColor = getAlertColor(swapWarning?.severity)

  const onReview = () => {
    const txId = createTransactionId()
    onCreateTxId(txId)
    onNext()
  }

  const onCurrencyInputPress = (currencyField: CurrencyField) => () => {
    const newExactAmount = formattedAmounts[currencyField]
    onUpdateExactCurrencyField(currencyField, newExactAmount)
  }

  const ARROW_SIZE = 44

  const [inputSelection, setInputSelection] = React.useState<TextInputProps['selection']>()
  const [outputSelection, setOutputSelection] = React.useState<TextInputProps['selection']>()
  const selection = React.useMemo(
    () => ({
      [CurrencyField.INPUT]: inputSelection,
      [CurrencyField.OUTPUT]: outputSelection,
    }),
    [inputSelection, outputSelection]
  )
  const resetSelection = (start: number, end?: number) => {
    const reset =
      exactCurrencyField === CurrencyField.INPUT ? setInputSelection : setOutputSelection
    reset({ start, end })
  }

  return (
    <>
      {showWarningModal && swapWarning?.title && (
        <WarningModal
          isVisible
          caption={swapWarning.message}
          confirmText={t('OK')}
          modalName={ModalName.SwapWarning}
          severity={swapWarning.severity}
          title={swapWarning.title}
          onClose={() => setShowWarningModal(false)}
          onConfirm={() => setShowWarningModal(false)}
        />
      )}
      <Flex grow gap="none" justifyContent="space-between">
        <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="none">
          <Trace section={SectionName.CurrencyInputPanel}>
            <Flex mt="sm">
              <CurrencyInputPanel
                currency={currencies[CurrencyField.INPUT]}
                currencyAmount={currencyAmounts[CurrencyField.INPUT]}
                currencyBalance={currencyBalances[CurrencyField.INPUT]}
                dimTextColor={exactCurrencyField === CurrencyField.OUTPUT && swapDataRefreshing}
                focus={exactCurrencyField === CurrencyField.INPUT}
                isUSDInput={isUSDInput}
                selection={inputSelection}
                showSoftInputOnFocus={isCompressedView}
                value={formattedAmounts[CurrencyField.INPUT]}
                warnings={warnings}
                onPressIn={onCurrencyInputPress(CurrencyField.INPUT)}
                onSelectionChange={(start, end) => setInputSelection({ start, end })}
                onSetAmount={(value) => onSetAmount(CurrencyField.INPUT, value, isUSDInput)}
                onSetMax={onSetMax}
                onShowTokenSelector={() => onShowTokenSelector(CurrencyField.INPUT)}
                onToggleUSDInput={() => onToggleUSDInput(!isUSDInput)}
              />
            </Flex>
          </Trace>

          <Box mt="xl" zIndex="popover">
            <Box alignItems="center" height={ARROW_SIZE} style={StyleSheet.absoluteFill}>
              <Box alignItems="center" bottom={ARROW_SIZE / 2} position="absolute">
                <TransferArrowButton
                  bg={currencies[CurrencyField.OUTPUT] ? 'backgroundAction' : 'backgroundSurface'}
                  disabled={!currencies[CurrencyField.OUTPUT]}
                  onPress={onSwitchCurrencies}
                />
              </Box>
            </Box>
          </Box>

          <Trace section={SectionName.CurrencyOutputPanel}>
            <Flex
              backgroundColor={currencies[CurrencyField.OUTPUT] ? 'backgroundContainer' : 'none'}
              borderRadius="xl"
              gap="xs"
              mb="sm"
              mt="none"
              mx="md"
              overflow="hidden"
              position="relative">
              <Box bottom={0} left={0} position="absolute" right={0}>
                {swapDataRefreshing ? <LaserLoader /> : null}
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
                    selection={outputSelection}
                    showNonZeroBalancesOnly={false}
                    showSoftInputOnFocus={isCompressedView}
                    value={formattedAmounts[CurrencyField.OUTPUT]}
                    warnings={warnings}
                    onPressIn={onCurrencyInputPress(CurrencyField.OUTPUT)}
                    onSelectionChange={(start, end) => setOutputSelection({ start, end })}
                    onSetAmount={(value) => onSetAmount(CurrencyField.OUTPUT, value, isUSDInput)}
                    onShowTokenSelector={() => onShowTokenSelector(CurrencyField.OUTPUT)}
                  />
                </Flex>
                {swapWarning && (
                  <Button onPress={() => setShowWarningModal(true)}>
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
                        color={theme.colors[swapWarningColor.text]}
                        height={18}
                        width={18}
                      />
                    </Flex>
                  </Button>
                )}
              </Flex>
            </Flex>
          </Trace>
        </AnimatedFlex>
        <AnimatedFlex exiting={FadeOutDown} gap="sm" justifyContent="flex-end" mb="lg" px="sm">
          {!isCompressedView ? (
            <DecimalPad
              resetSelection={resetSelection}
              selection={selection[exactCurrencyField]}
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
    </>
  )
}
