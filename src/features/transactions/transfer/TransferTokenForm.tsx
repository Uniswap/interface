import { AnyAction } from '@reduxjs/toolkit'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { FadeIn, FadeOut, FadeOutDown } from 'react-native-reanimated'
import { Button, ButtonSize } from 'src/components/buttons/Button'
import { TransferArrowButton } from 'src/components/buttons/TransferArrowButton'
import { Suspense } from 'src/components/data/Suspense'
import { CurrencyInputPanel } from 'src/components/input/CurrencyInputPanel'
import { DecimalPad } from 'src/components/input/DecimalPad'
import { RecipientInputPanel } from 'src/components/input/RecipientInputPanel'
import { TextInputProps } from 'src/components/input/TextInput'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { Warning, WarningAction } from 'src/components/modals/WarningModal/types'
import { NFTTransfer } from 'src/components/NFT/NFTTransfer'
import { useUSDCValue } from 'src/features/routing/useUSDCPrice'
import { ElementName } from 'src/features/telemetry/constants'
import { useShouldShowNativeKeyboard } from 'src/features/transactions/hooks'
import { useSwapActionHandlers, useUSDTokenUpdater } from 'src/features/transactions/swap/hooks'
import { ARROW_SIZE } from 'src/features/transactions/swap/SwapForm'
import {
  CurrencyField,
  transactionStateActions,
} from 'src/features/transactions/transactionState/transactionState'
import { DerivedTransferInfo } from 'src/features/transactions/transfer/hooks'
import { TransferFormWarnings } from 'src/features/transactions/transfer/TransferFormWarnings'
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

export interface TransferWarning {
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
  const [transferWarning, setTransferWarning] = useState<TransferWarning>({
    loading: true,
    hasWarning: false,
  })

  const { onShowTokenSelector, onSetAmount, onSetMax } = useSwapActionHandlers(dispatch)
  const onToggleShowRecipientSelector = createOnToggleShowRecipientSelector(dispatch)

  const { isBlocked, isBlockedLoading } = useIsBlockedActiveAddress()

  const actionButtonDisabled =
    warnings.some((warning) => warning.action === WarningAction.DisableReview) ||
    transferWarning.loading ||
    isBlocked ||
    isBlockedLoading

  const goToNext = useCallback(() => {
    const txId = createTransactionId()
    dispatch(transactionStateActions.setTxId(txId))
    onNext()
  }, [dispatch, onNext])

  const onPressReview = useCallback(() => {
    if (transferWarning.hasWarning) {
      setShowWarningModal(true)
    } else {
      goToNext()
    }
  }, [goToNext, transferWarning.hasWarning])

  const onSetTransferWarning = useCallback(({ hasWarning, loading }: TransferWarning) => {
    setTransferWarning({ hasWarning, loading })
  }, [])

  const onSetShowWarningModal = useCallback((showModal: boolean) => {
    setShowWarningModal(showModal)
  }, [])

  const [inputSelection, setInputSelection] = useState<TextInputProps['selection']>()
  const resetSelection = useCallback(
    (start: number, end?: number) => {
      setInputSelection({ start, end: end ?? start })
    },
    [setInputSelection]
  )

  return (
    <>
      <Suspense fallback={null}>
        <TransferFormWarnings
          chainId={chainId}
          dispatch={dispatch}
          recipient={recipient}
          setShowWarningModal={onSetShowWarningModal}
          setTransferWarning={onSetTransferWarning}
          showWarningModal={showWarningModal}
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

          <Flex
            backgroundColor={recipient ? 'background2' : 'none'}
            borderBottomLeftRadius={isBlocked ? 'none' : 'xl'}
            borderBottomRightRadius={isBlocked ? 'none' : 'xl'}
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
          {isBlocked && (
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
          )}
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
