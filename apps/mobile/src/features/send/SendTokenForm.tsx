/* eslint-disable complexity */
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import InfoCircleFilled from 'ui/src/assets/icons/info-circle-filled.svg'
import { AlertCircle } from 'ui/src/components/icons'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { iconSizes, spacing } from 'ui/src/theme'
import { CurrencyInputPanel, CurrencyInputPanelRef } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanel'
import { TextInputProps } from 'uniswap/src/components/input/TextInput'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { getAlertColor } from 'uniswap/src/components/modals/WarningModal/getAlertColor'
import { WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { MAX_FIAT_INPUT_DECIMALS } from 'uniswap/src/constants/transactions'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import {
  DecimalPadCalculateSpace,
  DecimalPadCalculatedSpaceId,
  DecimalPadInput,
  DecimalPadInputRef,
} from 'uniswap/src/features/transactions/DecimalPadInput/DecimalPadInput'
import { InsufficientNativeTokenWarning } from 'uniswap/src/features/transactions/InsufficientNativeTokenWarning/InsufficientNativeTokenWarning'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { useUSDTokenUpdater } from 'uniswap/src/features/transactions/hooks/useUSDTokenUpdater'
import { BlockedAddressWarning } from 'uniswap/src/features/transactions/modals/BlockedAddressWarning'
import { SwapArrowButton } from 'uniswap/src/features/transactions/swap/form/SwapArrowButton'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useIsBlocked } from 'uniswap/src/features/trm/hooks'
import { CurrencyField } from 'uniswap/src/types/currency'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard'
import { truncateToMaxDecimals } from 'utilities/src/format/truncateToMaxDecimals'
import { RecipientInputPanel } from 'wallet/src/components/input/RecipientInputPanel'
import { NFTTransfer } from 'wallet/src/components/nfts/NFTTransfer'
import { useSendContext } from 'wallet/src/features/transactions/contexts/SendContext'
import { GasFeeRow } from 'wallet/src/features/transactions/send/GasFeeRow'
import { useShowSendNetworkNotification } from 'wallet/src/features/transactions/send/hooks/useShowSendNetworkNotification'
import { useIsBlockedActiveAddress } from 'wallet/src/features/trm/hooks'

const TRANSFER_DIRECTION_BUTTON_SIZE = iconSizes.icon20
const TRANSFER_DIRECTION_BUTTON_INNER_PADDING = spacing.spacing12
const TRANSFER_DIRECTION_BUTTON_BORDER_WIDTH = spacing.spacing4

export function SendTokenForm(): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { fullHeight } = useDeviceDimensions()

  const { walletNeedsRestore, openWalletRestoreModal } = useTransactionModalContext()
  const { updateSendForm, derivedSendInfo, warnings, gasFee } = useSendContext()

  const [currencyFieldFocused, setCurrencyFieldFocused] = useState(true)
  const [showWarningModal, setShowWarningModal] = useState(false)

  const {
    currencyAmounts,
    currencyBalances,
    exactAmountToken,
    exactAmountFiat,
    recipient,
    isFiatInput = false,
    currencyInInfo,
    nftIn,
  } = derivedSendInfo

  const currencyIn = currencyInInfo?.currency

  const onFiatAmountUpdated = useCallback(
    (amount: string): void => {
      updateSendForm({ exactAmountFiat: amount })
    },
    [updateSendForm],
  )

  const onTokenAmountUpdated = useCallback(
    (amount: string): void => {
      updateSendForm({ exactAmountToken: amount })
    },
    [updateSendForm],
  )

  useShowSendNetworkNotification({ chainId: currencyIn?.chainId })

  const inputCurrencyUSDValue = useUSDCValue(currencyAmounts[CurrencyField.INPUT])

  const onShowTokenSelector = useCallback(() => {
    updateSendForm({ selectingCurrencyField: CurrencyField.INPUT })
  }, [updateSendForm])

  const onShowRecipientSelector = useCallback(() => {
    updateSendForm({ showRecipientSelector: true })
  }, [updateSendForm])

  const { isBlocked: isActiveBlocked } = useIsBlockedActiveAddress()
  const { isBlocked: isRecipientBlocked } = useIsBlocked(recipient)
  const isBlocked = isActiveBlocked || isRecipientBlocked

  const onRestorePress = (): void => {
    if (!openWalletRestoreModal) {
      throw new Error('Invalid call to `onRestorePress` with missing `openWalletRestoreModal`')
    }
    setCurrencyFieldFocused(false)
    openWalletRestoreModal()
  }

  const onTransferWarningClick = (): void => {
    dismissNativeKeyboard()
    setShowWarningModal(true)
  }
  const transferWarning = warnings.warnings.find((warning) => warning.severity >= WarningSeverity.Low)
  const isInsufficientGasFundsWarning = transferWarning?.type === WarningLabel.InsufficientGasFunds
  const transferWarningColor = getAlertColor(transferWarning?.severity)
  const SendWarningIcon = transferWarning?.icon ?? AlertCircle

  const currencyInputPanelRef = useRef<CurrencyInputPanelRef>(null)

  const exactAmountTokenRef = useRef(exactAmountToken)
  const exactAmountFiatRef = useRef(exactAmountFiat)
  const exactValueRef = isFiatInput ? exactAmountFiatRef : exactAmountTokenRef

  const onSetExactAmount = useCallback(
    (amount: string) => {
      if (isFiatInput) {
        exactAmountFiatRef.current = amount
        updateSendForm({ exactAmountFiat: amount })
      } else {
        exactAmountTokenRef.current = amount
        updateSendForm({ exactAmountToken: amount })
      }
    },
    [isFiatInput, updateSendForm],
  )

  // Decimal pad logic
  const decimalPadRef = useRef<DecimalPadInputRef>(null)
  const maxDecimals = isFiatInput ? MAX_FIAT_INPUT_DECIMALS : currencyIn?.decimals ?? 0
  const selectionRef = useRef<TextInputProps['selection']>()

  const onInputSelectionChange = useCallback(
    (start: number, end: number) => {
      selectionRef.current = { start, end }
      decimalPadRef.current?.updateDisabledKeys()
    },
    [selectionRef],
  )

  const resetSelection = useCallback(
    ({ start, end }: { start: number; end?: number; currencyField?: CurrencyField }) => {
      // Update refs first to have the latest selection state available in the DecimalPadInput
      // component and properly update disabled keys of the decimal pad.
      // We reset the native selection on the next tick because we need to wait for the native input to be updated.
      // This is needed because of the combination of state (delayed update) + ref (instant update) to improve performance.
      selectionRef.current = { start, end }
      const inputFieldRef = currencyInputPanelRef.current?.textInputRef

      if (inputFieldRef) {
        setTimeout(() => {
          inputFieldRef?.current?.setNativeProps?.({ selection: { start, end } })
        }, 0)
      }
    },
    [],
  )

  const onSetMax = useCallback(
    (amount: string) => {
      exactAmountTokenRef.current = amount
      updateSendForm({ exactAmountToken: amount, isMax: true, isFiatInput: false, focusOnCurrencyField: null })

      // We want this update to happen on the next tick, after the input value is updated.
      setTimeout(() => {
        resetSelection({
          start: exactAmountTokenRef.current.length,
          end: exactAmountTokenRef.current.length,
        })
        decimalPadRef.current?.updateDisabledKeys()
      }, 0)
    },
    [resetSelection, updateSendForm],
  )

  const onToggleFiatInput = useCallback(() => {
    const newIsFiatInput = !isFiatInput

    exactAmountFiatRef.current = exactAmountFiat
    exactAmountTokenRef.current = exactAmountToken

    updateSendForm({ isFiatInput: newIsFiatInput })
    // We want this update to happen on the next tick, after the input value is updated.
    setTimeout(() => {
      const amount = newIsFiatInput ? exactAmountFiat : exactAmountToken
      resetSelection({
        start: amount.length,
        end: amount.length,
      })
    }, 0)
  }, [exactAmountFiat, exactAmountToken, isFiatInput, resetSelection, updateSendForm])

  useUSDTokenUpdater({
    onFiatAmountUpdated,
    onTokenAmountUpdated,
    isFiatInput,
    exactAmountToken,
    exactAmountFiat,
    currency: currencyIn ?? undefined,
  })

  const [decimalPadReady, setDecimalPadReady] = useState(false)

  const onDecimalPadReady = useCallback(() => setDecimalPadReady(true), [])

  const onDecimalPadTriggerInputShake = useCallback(() => {
    currencyInputPanelRef.current?.triggerShakeAnimation()
  }, [])

  const decimalPadSetValue = useCallback(
    (value: string): void => {
      // We disable the `DecimalPad` when the input reaches the max number of decimals,
      // but we still need to truncate in case the user moves the cursor and adds a decimal separator in the middle of the input.
      const truncatedValue = truncateToMaxDecimals({
        value,
        maxDecimals,
      })

      if (isFiatInput) {
        exactAmountFiatRef.current = truncatedValue
      } else {
        exactAmountTokenRef.current = truncatedValue
      }

      updateSendForm({
        exactAmountFiat: isFiatInput ? truncatedValue : undefined,
        exactAmountToken: !isFiatInput ? truncatedValue : undefined,
        exactCurrencyField: CurrencyField.INPUT,
        focusOnCurrencyField: CurrencyField.INPUT,
      })
    },
    [isFiatInput, maxDecimals, updateSendForm],
  )
  return (
    <>
      {transferWarning?.title && !isInsufficientGasFundsWarning && (
        <WarningModal
          caption={transferWarning.message}
          acknowledgeText={t('common.button.close')}
          icon={<SendWarningIcon color={transferWarningColor.text} size={iconSizes.icon24} />}
          isOpen={showWarningModal}
          modalName={ModalName.SendWarning}
          severity={transferWarning.severity}
          title={transferWarning.title}
          onClose={(): void => setShowWarningModal(false)}
          onAcknowledge={(): void => setShowWarningModal(false)}
        />
      )}
      <Flex grow gap="$spacing8" justifyContent="space-between">
        <Flex gap="$spacing2">
          {nftIn ? (
            <NFTTransfer asset={nftIn} nftSize={fullHeight / 4} />
          ) : (
            <Flex borderColor="$surface3" borderRadius="$rounded20" borderWidth="$spacing1" justifyContent="center">
              <CurrencyInputPanel
                ref={currencyInputPanelRef}
                currencyAmount={currencyAmounts[CurrencyField.INPUT]}
                currencyBalance={currencyBalances[CurrencyField.INPUT]}
                currencyField={CurrencyField.INPUT}
                currencyInfo={currencyInInfo}
                focus={currencyFieldFocused}
                isFiatMode={isFiatInput}
                resetSelection={resetSelection}
                showSoftInputOnFocus={false}
                usdValue={inputCurrencyUSDValue}
                value={isFiatInput ? exactAmountFiat : exactAmountToken}
                transactionType={TransactionType.Send}
                onPressIn={(): void => setCurrencyFieldFocused(true)}
                onSelectionChange={onInputSelectionChange}
                onSetExactAmount={onSetExactAmount}
                onSetPresetValue={onSetMax}
                onShowTokenSelector={onShowTokenSelector}
                onToggleIsFiatMode={onToggleFiatInput}
              />
            </Flex>
          )}

          <Flex zIndex="$popover">
            <Flex
              alignItems="center"
              height={
                TRANSFER_DIRECTION_BUTTON_SIZE +
                TRANSFER_DIRECTION_BUTTON_INNER_PADDING +
                TRANSFER_DIRECTION_BUTTON_BORDER_WIDTH
              }
              style={StyleSheet.absoluteFill}
            >
              <Flex alignItems="center" bottom={TRANSFER_DIRECTION_BUTTON_SIZE / 2} position="absolute">
                <SwapArrowButton disabled backgroundColor="$surface1" />
              </Flex>
            </Flex>
          </Flex>

          <Flex>
            <Flex
              backgroundColor="$surface2"
              borderBottomLeftRadius="$rounded20"
              borderBottomRightRadius="$rounded20"
              borderColor="$surface3"
              borderTopLeftRadius="$rounded20"
              borderTopRightRadius="$rounded20"
              borderWidth="$spacing1"
              justifyContent="center"
            >
              {recipient && (
                <RecipientInputPanel recipientAddress={recipient} onShowRecipientSelector={onShowRecipientSelector} />
              )}
              {walletNeedsRestore && (
                <TouchableArea disabled={!openWalletRestoreModal} onPress={onRestorePress}>
                  <Flex
                    grow
                    row
                    alignItems="center"
                    alignSelf="stretch"
                    backgroundColor="$surface2"
                    borderBottomColor="$surface1"
                    borderBottomLeftRadius="$rounded20"
                    borderBottomRightRadius="$rounded20"
                    borderBottomWidth={1}
                    gap="$spacing8"
                    p="$spacing12"
                  >
                    <InfoCircleFilled
                      color={colors.DEP_accentWarning.val}
                      height={iconSizes.icon20}
                      width={iconSizes.icon20}
                    />
                    <Text color="$DEP_accentWarning" variant="subheading2">
                      {t('send.warning.restore')}
                    </Text>
                  </Flex>
                </TouchableArea>
              )}
              {isBlocked ? (
                <BlockedAddressWarning
                  grow
                  row
                  alignItems="center"
                  alignSelf="stretch"
                  backgroundColor="$surface2"
                  borderBottomLeftRadius="$rounded16"
                  borderBottomRightRadius="$rounded16"
                  borderColor="$surface3"
                  borderTopWidth={0}
                  borderWidth="$spacing1"
                  isRecipientBlocked={isRecipientBlocked}
                  px="$spacing16"
                  py="$spacing12"
                />
              ) : null}
            </Flex>
            <Flex py="$spacing12">
              {gasFee && !transferWarning && currencyIn?.chainId && !isBlocked && (
                <GasFeeRow chainId={currencyIn?.chainId} gasFee={gasFee} />
              )}
            </Flex>
            {transferWarning && !isBlocked && !isInsufficientGasFundsWarning ? (
              <TouchableArea mt="$spacing1" onPress={onTransferWarningClick}>
                <Flex
                  grow
                  row
                  alignItems="center"
                  alignSelf="stretch"
                  backgroundColor={transferWarningColor.background}
                  borderBottomLeftRadius="$rounded16"
                  borderBottomRightRadius="$rounded16"
                  gap="$spacing8"
                  px="$spacing16"
                  py="$spacing12"
                >
                  <SendWarningIcon color={transferWarningColor.text} size={iconSizes.icon16} strokeWidth={1.5} />
                  <Text adjustsFontSizeToFit color={transferWarningColor.text} variant="body3">
                    {transferWarning.title}
                  </Text>
                </Flex>
              </TouchableArea>
            ) : null}
            <InsufficientNativeTokenWarning flow="send" gasFee={gasFee} warnings={warnings.warnings} />
          </Flex>
        </Flex>

        {!nftIn && (
          <>
            <DecimalPadCalculateSpace id={DecimalPadCalculatedSpaceId.Send} decimalPadRef={decimalPadRef} />

            <Flex
              animation="quick"
              bottom={0}
              gap="$spacing8"
              left={0}
              opacity={!decimalPadReady ? 0 : 1}
              position="absolute"
              right={0}
            >
              <DecimalPadInput
                ref={decimalPadRef}
                maxDecimals={maxDecimals}
                resetSelection={resetSelection}
                selectionRef={selectionRef}
                setValue={decimalPadSetValue}
                valueRef={exactValueRef}
                onReady={onDecimalPadReady}
                onTriggerInputShakeAnimation={onDecimalPadTriggerInputShake}
              />
            </Flex>
          </>
        )}
      </Flex>
    </>
  )
}
