import { AnyAction } from '@reduxjs/toolkit'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TransferArrowButton } from 'src/components/buttons/TransferArrowButton'
import { CurrencyInputPanel } from 'src/components/input/CurrencyInputPanel'
import { DecimalPad } from 'src/components/input/DecimalPad'
import { RecipientInputPanel } from 'src/components/input/RecipientInputPanel'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { WarningAction, WarningSeverity } from 'src/components/modals/types'
import WarningModal from 'src/components/modals/WarningModal'
import { NFTTransfer } from 'src/components/NFT/NFTTransfer'
import { Text } from 'src/components/Text'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useSwapActionHandlers, useUSDTokenUpdater } from 'src/features/transactions/swap/hooks'
import {
  clearRecipient,
  CurrencyField,
  transactionStateActions,
} from 'src/features/transactions/transactionState/transactionState'
import {
  DerivedTransferInfo,
  useShowTransferWarnings,
  useUpdateTransferGasEstimate,
} from 'src/features/transactions/transfer/hooks'
import { createOnToggleShowRecipientSelector } from 'src/features/transactions/transfer/utils'
import { createTransactionId } from 'src/features/transactions/utils'
import { dimensions } from 'src/styles/sizing'

interface TransferTokenProps {
  dispatch: React.Dispatch<AnyAction>
  derivedTransferInfo: DerivedTransferInfo
  onNext: () => void
}

export function TransferTokenForm({ dispatch, derivedTransferInfo, onNext }: TransferTokenProps) {
  const {
    currencyAmounts,
    currencyBalances,
    currencyTypes,
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

  useUpdateTransferGasEstimate({
    transactionStateDispatch: dispatch,
    chainId,
    currencyIn,
    nftIn,
    amount: currencyAmounts[CurrencyField.INPUT]?.quotient.toString(),
    recipient,
    assetType: currencyTypes[CurrencyField.INPUT],
  })

  useUSDTokenUpdater(
    dispatch,
    isUSDInput,
    exactAmountToken,
    exactAmountUSD,
    currencyIn ?? undefined
  )

  const [showWarningModal, setShowWarningModal] = useState(false)

  const { t } = useTranslation()

  const { onShowTokenSelector, onSetAmount, onSetMax, onToggleUSDInput } =
    useSwapActionHandlers(dispatch)
  const onToggleShowRecipientSelector = createOnToggleShowRecipientSelector(dispatch)

  const { showNewRecipientWarning, showSmartContractWarning, areWarningsLoading } =
    useShowTransferWarnings(recipient, chainId)

  const actionButtonDisabled =
    warnings.some((warning) => warning.action === WarningAction.DisableReview) || areWarningsLoading

  const goToNext = useCallback(() => {
    const txId = createTransactionId()
    dispatch(transactionStateActions.setTxId(txId))
    onNext()
  }, [dispatch, onNext])

  const onPressReview = useCallback(() => {
    if (showNewRecipientWarning || showSmartContractWarning) {
      setShowWarningModal(true)
    } else {
      goToNext()
    }
  }, [goToNext, showNewRecipientWarning, showSmartContractWarning])

  const onCloseSmartContractWarning = useCallback(() => {
    dispatch(clearRecipient())
    setShowWarningModal(false)
  }, [dispatch])

  const onCloseNewRecipientWarning = useCallback(() => setShowWarningModal(false), [])

  return (
    <>
      {showWarningModal && showNewRecipientWarning && (
        <WarningModal
          caption={t(
            "You haven't transacted with this address before. Please confirm that the address is correct before continuing."
          )}
          closeText={t('Cancel')}
          confirmText={t('Confirm')}
          isVisible={showWarningModal && showNewRecipientWarning}
          modalName={ModalName.SendWarning}
          severity={WarningSeverity.Medium}
          title={t('New address')}
          onClose={onCloseNewRecipientWarning}
          onConfirm={goToNext}>
          <Box borderColor="backgroundOutline" borderRadius="xs" borderWidth={1}>
            <Text color="textPrimary" px="md" py="sm" textAlign="center" variant="subheadSmall">
              {recipient}
            </Text>
          </Box>
        </WarningModal>
      )}
      {showWarningModal && showSmartContractWarning && (
        <WarningModal
          caption={t(
            'This address is a smart contract. In many cases, sending tokens directly to a contract will result in the loss of your assets. Please select a different address.'
          )}
          confirmText={t('OK')}
          isVisible={showWarningModal && showSmartContractWarning}
          modalName={ModalName.SendWarning}
          severity={WarningSeverity.High}
          title={t('Smart contract address')}
          onClose={onCloseSmartContractWarning}
          onConfirm={onCloseSmartContractWarning}
        />
      )}
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
              <RecipientInputPanel
                recipientAddress={recipient}
                onToggleShowRecipientSelector={onToggleShowRecipientSelector}
              />
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
