import { AnyAction } from '@reduxjs/toolkit'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, StyleSheet } from 'react-native'
import { FadeIn, FadeOut, FadeOutDown } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangleIcon from 'src/assets/icons/alert-triangle.svg'
import { Button, ButtonSize } from 'src/components/buttons/Button'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TransferArrowButton } from 'src/components/buttons/TransferArrowButton'
import { Suspense } from 'src/components/data/Suspense'
import { CurrencyInputPanel } from 'src/components/input/CurrencyInputPanel'
import { DecimalPad } from 'src/components/input/DecimalPad'
import { RecipientInputPanel } from 'src/components/input/RecipientInputPanel'
import { TextInputProps } from 'src/components/input/TextInput'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { Warning, WarningAction, WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal, { getAlertColor } from 'src/components/modals/WarningModal/WarningModal'
import { NFTTransfer } from 'src/components/NFT/NFTTransfer'
import { Text } from 'src/components/Text'
import { useUSDCValue } from 'src/features/routing/useUSDCPrice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useShouldShowNativeKeyboard } from 'src/features/transactions/hooks'
import { useSwapActionHandlers, useUSDTokenUpdater } from 'src/features/transactions/swap/hooks'
import { ARROW_SIZE } from 'src/features/transactions/swap/SwapForm'
import {
  CurrencyField,
  transactionStateActions,
} from 'src/features/transactions/transactionState/transactionState'
import { DerivedTransferInfo } from 'src/features/transactions/transfer/hooks'
import { TransferFormSpeedbumps } from 'src/features/transactions/transfer/TransferFormWarnings'
import { createOnToggleShowRecipientSelector } from 'src/features/transactions/transfer/utils'
import { createTransactionId } from 'src/features/transactions/utils'
import { BlockedAddressWarning } from 'src/features/trm/BlockedAddressWarning'
import { useIsBlockedActiveAddress } from 'src/features/trm/hooks'
import { dimensions } from 'src/styles/sizing'

interface TransferTokenProps {
  dispatch: React.Dispatch<AnyAction>
  derivedTransferInfo: DerivedTransferInfo
  onNext: () => void
  warnings: Warning[]
}

export interface TransferSpeedbump {
  hasWarning: boolean
  loading: boolean
}

export function TransferTokenForm({
  dispatch,
  derivedTransferInfo,
  onNext,
  warnings,
}: TransferTokenProps) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const {
    currencyAmounts,
    currencyBalances,
    exactAmountToken,
    exactAmountUSD,
    recipient,
    isUSDInput = false,
    currencyIn,
    nftIn,
    chainId,
  } = derivedTransferInfo

  const { showNativeKeyboard, onLayout } = useShouldShowNativeKeyboard()

  useUSDTokenUpdater(
    dispatch,
    isUSDInput,
    exactAmountToken,
    exactAmountUSD,
    currencyIn ?? undefined
  )

  const inputCurrencyUSDValue = useUSDCValue(currencyAmounts[CurrencyField.INPUT])

  const [showWarningModal, setShowWarningModal] = useState(false)
  const [showSpeedbumpModal, setShowSpeedbumpModal] = useState(false)
  const [transferSpeedbump, setTransferSpeedbump] = useState<TransferSpeedbump>({
    loading: true,
    hasWarning: false,
  })

  const { onShowTokenSelector, onSetAmount, onSetMax } = useSwapActionHandlers(dispatch)
  const onToggleShowRecipientSelector = createOnToggleShowRecipientSelector(dispatch)

  const { isBlocked, isBlockedLoading } = useIsBlockedActiveAddress()

  const actionButtonDisabled =
    warnings.some((warning) => warning.action === WarningAction.DisableReview) ||
    transferSpeedbump.loading ||
    isBlocked ||
    isBlockedLoading

  const goToNext = useCallback(() => {
    const txId = createTransactionId()
    dispatch(transactionStateActions.setTxId(txId))
    onNext()
  }, [dispatch, onNext])

  const onPressReview = useCallback(() => {
    if (transferSpeedbump.hasWarning) {
      setShowSpeedbumpModal(true)
    } else {
      goToNext()
    }
  }, [goToNext, transferSpeedbump.hasWarning])

  const onSetTransferSpeedbump = useCallback(({ hasWarning, loading }: TransferSpeedbump) => {
    setTransferSpeedbump({ hasWarning, loading })
  }, [])

  const onSetShowSpeedbumpModal = useCallback((showModal: boolean) => {
    setShowSpeedbumpModal(showModal)
  }, [])

  const [inputSelection, setInputSelection] = useState<TextInputProps['selection']>()
  const resetSelection = useCallback(
    (start: number, end?: number) => {
      setInputSelection({ start, end: end ?? start })
    },
    [setInputSelection]
  )

  const onTransferWarningClick = () => {
    Keyboard.dismiss()
    setShowWarningModal(true)
  }

  const transferWarning = warnings.find((warning) => warning.severity >= WarningSeverity.Medium)
  const transferWarningColor = getAlertColor(transferWarning?.severity)

  return (
    <>
      {showWarningModal && transferWarning?.title && (
        <WarningModal
          isVisible
          caption={transferWarning.message}
          confirmText={t('OK')}
          modalName={ModalName.SendWarning}
          severity={transferWarning.severity}
          title={transferWarning.title}
          onClose={() => setShowWarningModal(false)}
          onConfirm={() => setShowWarningModal(false)}
        />
      )}
      <Suspense fallback={null}>
        <TransferFormSpeedbumps
          chainId={chainId}
          dispatch={dispatch}
          recipient={recipient}
          setShowSpeedbumpModal={onSetShowSpeedbumpModal}
          setTransferSpeedbump={onSetTransferSpeedbump}
          showSpeedbumpModal={showSpeedbumpModal}
          onNext={goToNext}
        />
      </Suspense>
      <Flex fill grow gap="xs" justifyContent="space-between" onLayout={onLayout}>
        <AnimatedFlex fill entering={FadeIn} exiting={FadeOut} gap="xxxs">
          {nftIn ? (
            <NFTTransfer asset={nftIn} nftSize={dimensions.fullHeight / 4} />
          ) : (
            <Flex
              backgroundColor="background2"
              borderRadius="xl"
              justifyContent="center"
              pb="md"
              pt="lg"
              px="md">
              <CurrencyInputPanel
                autoFocus
                currency={currencyIn}
                currencyAmount={currencyAmounts[CurrencyField.INPUT]}
                currencyBalance={currencyBalances[CurrencyField.INPUT]}
                isUSDInput={isUSDInput}
                selection={inputSelection}
                showSoftInputOnFocus={showNativeKeyboard}
                usdValue={inputCurrencyUSDValue}
                value={isUSDInput ? exactAmountUSD : exactAmountToken}
                warnings={warnings}
                onSelectionChange={
                  showNativeKeyboard ? undefined : (start, end) => setInputSelection({ start, end })
                }
                onSetAmount={(value) => onSetAmount(CurrencyField.INPUT, value, isUSDInput)}
                onSetMax={onSetMax}
                onShowTokenSelector={() => onShowTokenSelector(CurrencyField.INPUT)}
              />
            </Flex>
          )}
          <Box zIndex="popover">
            <Box alignItems="center" height={ARROW_SIZE} style={StyleSheet.absoluteFill}>
              <Box alignItems="center" bottom={ARROW_SIZE / 2} position="absolute">
                <TransferArrowButton disabled bg={recipient ? 'background3' : 'background1'} />
              </Box>
            </Box>
          </Box>

          <Box>
            <Flex
              backgroundColor={recipient ? 'background2' : 'none'}
              borderBottomLeftRadius={transferWarning || isBlocked ? 'none' : 'xl'}
              borderBottomRightRadius={transferWarning || isBlocked ? 'none' : 'xl'}
              borderTopLeftRadius="xl"
              borderTopRightRadius="xl"
              justifyContent="center"
              mt="xxs"
              px="md"
              py="lg">
              {recipient && (
                <Suspense fallback={<Loading type="image" />}>
                  <RecipientInputPanel
                    recipientAddress={recipient}
                    onToggleShowRecipientSelector={onToggleShowRecipientSelector}
                  />
                </Suspense>
              )}
            </Flex>
            {transferWarning && !isBlocked ? (
              <TouchableArea onPress={onTransferWarningClick}>
                <Flex
                  row
                  alignItems="center"
                  alignSelf="stretch"
                  backgroundColor={transferWarningColor.background}
                  borderBottomLeftRadius="lg"
                  borderBottomRightRadius="lg"
                  flexGrow={1}
                  gap="xs"
                  px="md"
                  py="sm">
                  <AlertTriangleIcon
                    color={theme.colors[transferWarningColor.text]}
                    height={theme.iconSizes.sm}
                    width={theme.iconSizes.sm}
                  />
                  <Text color={transferWarningColor.text} variant="subheadSmall">
                    {transferWarning.title}
                  </Text>
                </Flex>
              </TouchableArea>
            ) : null}
            {isBlocked ? (
              <BlockedAddressWarning
                row
                alignItems="center"
                alignSelf="stretch"
                backgroundColor="background2"
                borderBottomLeftRadius="lg"
                borderBottomRightRadius="lg"
                flexGrow={1}
                mt="xxxs"
                px="md"
                py="sm"
              />
            ) : null}
          </Box>
        </AnimatedFlex>
        <AnimatedFlex exiting={FadeOutDown} gap="xs">
          {!nftIn && !showNativeKeyboard && (
            <DecimalPad
              hasCurrencyPrefix={isUSDInput}
              resetSelection={resetSelection}
              selection={inputSelection}
              setValue={(newValue) => onSetAmount(CurrencyField.INPUT, newValue, isUSDInput)}
              value={isUSDInput ? exactAmountUSD : exactAmountToken}
            />
          )}
          <Button
            disabled={actionButtonDisabled}
            label={t('Review transfer')}
            name={ElementName.ReviewTransfer}
            size={ButtonSize.Large}
            onPress={onPressReview}
          />
        </AnimatedFlex>
      </Flex>
    </>
  )
}
