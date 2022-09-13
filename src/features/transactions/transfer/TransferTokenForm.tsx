import { AnyAction } from '@reduxjs/toolkit'
import React, { Suspense, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TransferArrowButton } from 'src/components/buttons/TransferArrowButton'
import { CurrencyInputPanel } from 'src/components/input/CurrencyInputPanel'
import { DecimalPad } from 'src/components/input/DecimalPad'
import { RecipientInputPanel } from 'src/components/input/RecipientInputPanel'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { WarningAction } from 'src/components/modals/types'
import { NFTTransfer } from 'src/components/NFT/NFTTransfer'
import { ElementName } from 'src/features/telemetry/constants'
import { useSwapActionHandlers, useUSDTokenUpdater } from 'src/features/transactions/swap/hooks'
import {
  CurrencyField,
  transactionStateActions,
} from 'src/features/transactions/transactionState/transactionState'
import { DerivedTransferInfo } from 'src/features/transactions/transfer/hooks'
import { TransferFormWarnings } from 'src/features/transactions/transfer/TransferFormWarnings'
import { createOnToggleShowRecipientSelector } from 'src/features/transactions/transfer/utils'
import { createTransactionId } from 'src/features/transactions/utils'
import { dimensions } from 'src/styles/sizing'

interface TransferTokenProps {
  dispatch: React.Dispatch<AnyAction>
  derivedTransferInfo: DerivedTransferInfo
  onNext: () => void
}

export interface TransferWarning {
  hasWarning: boolean
  loading: boolean
}

export function TransferTokenForm({ dispatch, derivedTransferInfo, onNext }: TransferTokenProps) {
  const {
    currencyAmounts,
    currencyBalances,
    formattedAmounts,
    exactAmountToken,
    exactAmountUSD = '',
    recipient,
    isUSDInput = false,
    warnings,
    currencyIn,
    nftIn,
    chainId,
  } = derivedTransferInfo

  useUSDTokenUpdater(
    dispatch,
    isUSDInput,
    exactAmountToken,
    exactAmountUSD,
    currencyIn ?? undefined
  )

  const [showWarningModal, setShowWarningModal] = useState(false)
  const [transferWarning, setTransferWarning] = useState<TransferWarning>({
    loading: true,
    hasWarning: false,
  })

  const { t } = useTranslation()

  const { onShowTokenSelector, onSetAmount, onSetMax, onToggleUSDInput } =
    useSwapActionHandlers(dispatch)
  const onToggleShowRecipientSelector = createOnToggleShowRecipientSelector(dispatch)

  const actionButtonDisabled =
    warnings.some((warning) => warning.action === WarningAction.DisableReview) ||
    transferWarning.loading

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
      <AnimatedFlex grow entering={FadeIn} exiting={FadeOut} justifyContent="space-between" p="md">
        <Flex gap="sm">
          {nftIn ? (
            <Box mx="xl">
              <NFTTransfer asset={nftIn} nftSize={dimensions.fullHeight / 4} />
            </Box>
          ) : (
            <CurrencyInputPanel
              autoFocus
              currency={currencyIn}
              currencyAmount={currencyAmounts[CurrencyField.INPUT]}
              currencyBalance={currencyBalances[CurrencyField.INPUT]}
              isUSDInput={isUSDInput}
              value={formattedAmounts[CurrencyField.INPUT]}
              warnings={warnings}
              onSetAmount={(value) => onSetAmount(CurrencyField.INPUT, value, isUSDInput)}
              onSetMax={onSetMax}
              onShowTokenSelector={() => onShowTokenSelector(CurrencyField.INPUT)}
              onToggleUSDInput={() => onToggleUSDInput(!isUSDInput)}
            />
          )}
          <Flex
            backgroundColor={recipient ? 'backgroundContainer' : 'none'}
            borderRadius="lg"
            mt="xl"
            width="100%">
            <Box zIndex="popover">
              <Box alignItems="center" height={36} style={StyleSheet.absoluteFill}>
                <Box alignItems="center" position="absolute" top={-24}>
                  <TransferArrowButton
                    disabled
                    bg="backgroundAction"
                    borderColor="backgroundSurface"
                  />
                </Box>
              </Box>
            </Box>
            <Flex pb="xl" pt="xl" px="md">
              <Suspense fallback={<Loading type="image" />}>
                <RecipientInputPanel
                  recipientAddress={recipient}
                  onToggleShowRecipientSelector={onToggleShowRecipientSelector}
                />
              </Suspense>
            </Flex>
          </Flex>
        </Flex>

        {!nftIn && (
          <DecimalPad
            setValue={(newValue) => onSetAmount(CurrencyField.INPUT, newValue, isUSDInput)}
            value={formattedAmounts[CurrencyField.INPUT]}
          />
        )}

        <PrimaryButton
          disabled={actionButtonDisabled}
          label={t('Review transfer')}
          name={ElementName.ReviewTransfer}
          py="md"
          testID={ElementName.ReviewTransfer}
          textVariant="largeLabel"
          variant="blue"
          onPress={onPressReview}
        />
      </AnimatedFlex>
    </>
  )
}
