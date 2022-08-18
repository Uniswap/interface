import { AnyAction } from '@reduxjs/toolkit'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TransferArrowButton } from 'src/components/buttons/TransferArrowButton'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { CurrencyInputPanel } from 'src/components/input/CurrencyInputPanel'
import { DecimalPad } from 'src/components/input/DecimalPad'
import { RecipientInputPanel } from 'src/components/input/RecipientInputPanel'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { WarningAction, WarningLabel, WarningSeverity } from 'src/components/warnings/types'
import { WarningModal } from 'src/components/warnings/WarningModal'
import { ChainId } from 'src/constants/chains'
import { ElementName } from 'src/features/telemetry/constants'
import { useSwapActionHandlers, useUSDTokenUpdater } from 'src/features/transactions/swap/hooks'
import {
  clearRecipient,
  closeNewAddressWarningModal,
  CurrencyField,
  TransactionState,
  transactionStateActions,
} from 'src/features/transactions/transactionState/transactionState'
import {
  DerivedTransferInfo,
  useHandleTransferWarningModals,
  useIsSmartContractAddress,
  useUpdateTransferGasEstimate,
} from 'src/features/transactions/transfer/hooks'
import { InputAssetInfo } from 'src/features/transactions/transfer/types'
import { createTransactionId } from 'src/features/transactions/utils'
import { currencyAddress } from 'src/utils/currencyId'

interface TransferTokenProps {
  state: TransactionState
  dispatch: React.Dispatch<AnyAction>
  derivedTransferInfo: DerivedTransferInfo
  inputAssetInfo: InputAssetInfo
  onNext: () => void
}

export function TransferTokenForm({
  state,
  dispatch,
  derivedTransferInfo,
  inputAssetInfo,
  onNext,
}: TransferTokenProps) {
  const { t } = useTranslation()
  const { showNewAddressWarning } = state

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
  } = derivedTransferInfo

  const { currencyIn, nftIn, chainId } = inputAssetInfo

  const { onShowTokenSelector, onSetAmount, onSetMax, onSelectRecipient, onToggleUSDInput } =
    useSwapActionHandlers(dispatch)

  useUSDTokenUpdater(
    dispatch,
    isUSDInput,
    exactAmountToken,
    exactAmountUSD,
    currencyIn ?? undefined
  )

  const { onPressReview, onPressWarningContinue } = useHandleTransferWarningModals(
    dispatch,
    () => {
      const txId = createTransactionId()
      dispatch(transactionStateActions.setTxId(txId))
      onNext()
    },
    recipient
  )
  const { isSmartContractAddress, loading: addressLoading } = useIsSmartContractAddress(
    recipient,
    chainId ?? ChainId.Mainnet
  )
  const showAddressIsSmartContractError = !!recipient && !addressLoading && isSmartContractAddress

  const actionButtonDisabled =
    warnings.some((warning) => warning.action === WarningAction.DisableReview) ||
    addressLoading ||
    showAddressIsSmartContractError

  // if action button is disabled, make amount undefined so that gas estimate doesn't run
  useUpdateTransferGasEstimate(
    dispatch,
    chainId,
    nftIn ? nftIn?.asset_contract.address : currencyIn ? currencyAddress(currencyIn) : undefined,
    !actionButtonDisabled ? currencyAmounts[CurrencyField.INPUT]?.quotient.toString() : undefined,
    recipient,
    nftIn?.token_id,
    currencyTypes[CurrencyField.INPUT]
  )

  return (
    <>
      {showNewAddressWarning && !showAddressIsSmartContractError && (
        <WarningModal
          data={recipient}
          warning={{
            type: WarningLabel.RecipientNewAddress,
            severity: WarningSeverity.Medium,
            action: WarningAction.WarnBeforeSubmit,
            title: t('New address'),
            message: t(
              "You haven't transacted with this address before. Please confirm that the address is correct before continuing."
            ),
          }}
          onClose={() => dispatch(closeNewAddressWarningModal())}
          onPressContinue={onPressWarningContinue}
        />
      )}
      {showAddressIsSmartContractError && (
        <WarningModal
          warning={{
            type: WarningLabel.RecipientNewAddress,
            severity: WarningSeverity.High,
            action: WarningAction.DisableReview,
            title: t('Smart contract address'),
            message: t(
              'This address is a smart contract. In many cases, sending tokens directly to a contract will result in the loss of your assets. Please select a different address.'
            ),
          }}
          onClose={() => {
            dispatch(clearRecipient())
          }}
        />
      )}
      <AnimatedFlex grow entering={FadeIn} exiting={FadeOut} justifyContent="space-between" p="md">
        <Flex gap="md">
          {nftIn ? (
            <Flex centered mx="xl">
              <NFTViewer uri={nftIn.image_url} />
            </Flex>
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
                setRecipientAddress={(newRecipient) => {
                  onSelectRecipient(newRecipient)
                }}
              />
            </Flex>
          </Flex>
        </Flex>

        {nftIn ? null : (
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
