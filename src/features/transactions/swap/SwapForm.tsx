import { AnyAction } from '@reduxjs/toolkit'
import React, { Dispatch, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { FadeIn, FadeOut, FadeOutDown } from 'react-native-reanimated'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import InfoCircle from 'src/assets/icons/info-circle.svg'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TransferArrowButton } from 'src/components/buttons/TransferArrowButton'
import { CurrencyInputPanel } from 'src/components/input/CurrencyInputPanel'
import { DecimalPad } from 'src/components/input/DecimalPad'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { LaserLoader } from 'src/components/loading/LaserLoader'
import { Text } from 'src/components/Text'
import { WarningAction, WarningModalType } from 'src/components/warnings/types'
import { getWarningColor } from 'src/components/warnings/utils'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotificationType } from 'src/features/notifications/types'
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
import usePrevious from 'src/utils/hooks'

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

  const prevChainId = usePrevious(chainId)

  const {
    onSwitchCurrencies,
    onSetAmount,
    onSetMax,
    onToggleUSDInput,
    onShowSwapWarning,
    onCreateTxId,
    onUpdateExactCurrencyField,
    onShowTokenSelector,
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

  const appDispatch = useAppDispatch()
  useEffect(() => {
    // don't fire notification toast for first network selection
    if (!prevChainId || !chainId || prevChainId === chainId) return

    appDispatch(pushNotification({ type: AppNotificationType.SwapNetwork, chainId }))
  }, [chainId, prevChainId, appDispatch])

  const ARROW_SIZE = 44

  return (
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
              showSoftInputOnFocus={isCompressedView}
              value={formattedAmounts[CurrencyField.INPUT]}
              warnings={warnings}
              onPressIn={onCurrencyInputPress(CurrencyField.INPUT)}
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
                  showNonZeroBalancesOnly={false}
                  showSoftInputOnFocus={isCompressedView}
                  value={formattedAmounts[CurrencyField.OUTPUT]}
                  warnings={warnings}
                  onPressIn={onCurrencyInputPress(CurrencyField.OUTPUT)}
                  onSetAmount={(value) => onSetAmount(CurrencyField.OUTPUT, value, isUSDInput)}
                  onShowTokenSelector={() => onShowTokenSelector(CurrencyField.OUTPUT)}
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
