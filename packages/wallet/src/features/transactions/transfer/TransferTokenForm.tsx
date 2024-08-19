// TODO(MOB-203): reduce component complexity
/* eslint-disable complexity */
import { AnyAction } from '@reduxjs/toolkit'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, LayoutChangeEvent, StyleSheet } from 'react-native'
import { FadeIn, FadeOut, FadeOutDown } from 'react-native-reanimated'
import { Button, Flex, Text, TouchableArea, isWeb, useSporeColors } from 'ui/src'
import InfoCircleFilled from 'ui/src/assets/icons/info-circle-filled.svg'
import { AlertCircle, Gas } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { iconSizes, spacing } from 'ui/src/theme'
import { TextInputProps } from 'uniswap/src/components/input/TextInput'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { CurrencyField } from 'uniswap/src/features/transactions/transactionState/types'
import { TokenSelectorFlow } from 'uniswap/src/features/transactions/transfer/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'
import { usePrevious } from 'utilities/src/react/hooks'
import { RecipientInputPanel } from 'wallet/src/components/input/RecipientInputPanel'
import { CurrencyInputPanelLegacy } from 'wallet/src/components/legacy/CurrencyInputPanelLegacy'
import { DecimalPadLegacy } from 'wallet/src/components/legacy/DecimalPadLegacy'
import { WarningModal, getAlertColor } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { NFTTransfer } from 'wallet/src/components/nfts/NFTTransfer'
import { useUSDValue } from 'wallet/src/features/gas/hooks'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { WarningAction, WarningSeverity } from 'wallet/src/features/transactions/WarningModal/types'
import { ParsedWarnings } from 'wallet/src/features/transactions/hooks/useParsedTransactionWarnings'
import { useTokenFormActionHandlers } from 'wallet/src/features/transactions/hooks/useTokenFormActionHandlers'
import { useTokenSelectorActionHandlers } from 'wallet/src/features/transactions/hooks/useTokenSelectorActionHandlers'
import { SwapArrowButton } from 'wallet/src/features/transactions/swap/SwapArrowButton'
import { NetworkFeeWarning } from 'wallet/src/features/transactions/swap/modals/NetworkFeeWarning'
import { useUSDCValue } from 'wallet/src/features/transactions/swap/trade/hooks/useUSDCPrice'
import { useUSDTokenUpdater } from 'wallet/src/features/transactions/swap/trade/hooks/useUSDTokenUpdater'
import { transactionStateActions } from 'wallet/src/features/transactions/transactionState/transactionState'
import { useSetShowRecipientSelector } from 'wallet/src/features/transactions/transfer/hooks/useOnToggleShowRecipientSelector'
import { useShowSendNetworkNotification } from 'wallet/src/features/transactions/transfer/hooks/useShowSendNetworkNotification'
import { DerivedTransferInfo } from 'wallet/src/features/transactions/transfer/types'
import { TransactionType } from 'wallet/src/features/transactions/types'
import { createTransactionId } from 'wallet/src/features/transactions/utils'
import { BlockedAddressWarning } from 'wallet/src/features/trm/BlockedAddressWarning'
import { useIsBlocked, useIsBlockedActiveAddress } from 'wallet/src/features/trm/hooks'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

interface TransferTokenProps {
  dispatch: React.Dispatch<AnyAction>
  derivedTransferInfo: DerivedTransferInfo
  onNext: () => void
  warnings: ParsedWarnings
  showingSelectorScreen: boolean
  walletNeedsRestore: boolean
  openWalletRestoreModal?: () => void
  showNativeKeyboard: boolean
  onDecimalPadLayout?: (event: LayoutChangeEvent) => void
  isLayoutPending: boolean
  onInputPanelLayout?: (event: LayoutChangeEvent) => void
  setShowViewOnlyModal: (show: boolean) => void
  gasFee: GasFeeResult
}

export function TransferTokenForm({
  dispatch,
  derivedTransferInfo,
  onNext,
  warnings,
  showingSelectorScreen,
  walletNeedsRestore,
  openWalletRestoreModal,
  showNativeKeyboard,
  onDecimalPadLayout,
  isLayoutPending,
  onInputPanelLayout,
  setShowViewOnlyModal,
  gasFee,
}: TransferTokenProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { fullHeight } = useDeviceDimensions()
  const account = useActiveAccountWithThrow()

  const {
    currencyAmounts,
    currencyBalances,
    exactAmountToken,
    exactAmountFiat,
    recipient,
    isFiatInput = false,
    currencyInInfo,
    nftIn,
  } = derivedTransferInfo

  const currencyIn = currencyInInfo?.currency
  useUSDTokenUpdater(dispatch, isFiatInput, exactAmountToken, exactAmountFiat, currencyIn ?? undefined)

  useShowSendNetworkNotification({ chainId: currencyIn?.chainId })

  const inputCurrencyUSDValue = useUSDCValue(currencyAmounts[CurrencyField.INPUT])

  const [currencyFieldFocused, setCurrencyFieldFocused] = useState(true)
  const [showWarningModal, setShowWarningModal] = useState(false)

  const { onShowTokenSelector } = useTokenSelectorActionHandlers(dispatch, TokenSelectorFlow.Transfer)
  const { onSetExactAmount, onSetMax } = useTokenFormActionHandlers(dispatch)
  const onSetShowRecipientSelector = useSetShowRecipientSelector(dispatch)

  const onShowRecipientSelector = useCallback(() => {
    onSetShowRecipientSelector(true)
  }, [onSetShowRecipientSelector])

  const { isBlocked: isActiveBlocked, isBlockedLoading: isActiveBlockedLoading } = useIsBlockedActiveAddress()
  const { isBlocked: isRecipientBlocked, isBlockedLoading: isRecipientBlockedLoading } = useIsBlocked(recipient)
  const isBlocked = isActiveBlocked || isRecipientBlocked
  const isBlockedLoading = isActiveBlockedLoading || isRecipientBlockedLoading

  const onRestorePress = (): void => {
    if (!openWalletRestoreModal) {
      throw new Error('Invalid call to `onRestorePress` with missing `openWalletRestoreModal`')
    }
    setCurrencyFieldFocused(false)
    openWalletRestoreModal()
  }

  const isViewOnlyWallet = account.type === AccountType.Readonly
  const actionButtonDisabled =
    warnings.warnings.some((warning) => warning.action === WarningAction.DisableReview) ||
    isBlocked ||
    isBlockedLoading ||
    walletNeedsRestore

  const goToNext = useCallback(() => {
    const txId = createTransactionId()
    dispatch(transactionStateActions.setTxId(txId))
    onNext()
  }, [dispatch, onNext])

  const onPressReview = useCallback(() => {
    if (isViewOnlyWallet) {
      setShowViewOnlyModal(true)
    } else {
      goToNext()
    }
  }, [isViewOnlyWallet, setShowViewOnlyModal, goToNext])

  const [inputSelection, setInputSelection] = useState<TextInputProps['selection']>()

  const resetSelection = useCallback(
    (start: number, end?: number) => {
      setInputSelection({ start, end: end ?? start })
    },
    [setInputSelection],
  )

  const previsFiatInput = usePrevious(isFiatInput)

  // when text changes on the screen, the default iOS input behavior is to use the same cursor
  // position but from the END of the input. so for example, if the cursor is currently at
  // 12.3|4 and the input changes to $1.232354, then new cursor will be at $1.23235|4
  // this useEffect essentially calculates where the new cursor position is when the text has changed
  // and that only happens on toggling USD <-> token input
  useEffect(() => {
    // only run this useEffect if isFiatInput has changed
    // if inputSelection is undefined, then that means no text selection or cursor
    // movement has happened yet, so let iOS do its default thang
    if (isFiatInput === previsFiatInput || !inputSelection) {
      return
    }

    if (inputSelection.start !== inputSelection.end) {
      setInputSelection(undefined)
      return
    }

    const [prevInput, newInput] = isFiatInput
      ? [exactAmountToken, exactAmountFiat]
      : [exactAmountFiat, exactAmountToken]
    const positionFromEnd = prevInput.length - inputSelection.start
    const newPositionFromStart = newInput.length - positionFromEnd
    const newPositionFromStartWithPrefix = newPositionFromStart + (isFiatInput ? 1 : -1)

    setInputSelection({
      start: newPositionFromStartWithPrefix,
      end: newPositionFromStartWithPrefix,
    })
  }, [isFiatInput, previsFiatInput, inputSelection, setInputSelection, exactAmountToken, exactAmountFiat])

  const onTransferWarningClick = (): void => {
    Keyboard.dismiss()
    setShowWarningModal(true)
  }

  const { onToggleFiatInput } = useTokenFormActionHandlers(dispatch)

  const transferWarning = warnings.warnings.find((warning) => warning.severity >= WarningSeverity.Low)
  const transferWarningColor = getAlertColor(transferWarning?.severity)

  const TRANSFER_DIRECTION_BUTTON_SIZE = iconSizes.icon20
  const TRANSFER_DIRECTION_BUTTON_INNER_PADDING = spacing.spacing12
  const TRANSFER_DIRECTION_BUTTON_BORDER_WIDTH = spacing.spacing4
  const SendWarningIcon = transferWarning?.icon ?? AlertCircle

  const { convertFiatAmountFormatted } = useLocalizationContext()
  const gasFeeUSD = useUSDValue(currencyInInfo?.currency.chainId, gasFee?.value)
  const gasFeeFormatted = convertFiatAmountFormatted(gasFeeUSD, NumberType.FiatGasPrice)

  return (
    <>
      {showWarningModal && transferWarning?.title && (
        <WarningModal
          caption={transferWarning.message}
          confirmText={t('common.button.close')}
          icon={
            <SendWarningIcon color={transferWarningColor.text} height={iconSizes.icon24} width={iconSizes.icon24} />
          }
          modalName={ModalName.SendWarning}
          severity={transferWarning.severity}
          title={transferWarning.title}
          onClose={(): void => setShowWarningModal(false)}
          onConfirm={(): void => setShowWarningModal(false)}
        />
      )}
      <Flex grow gap="$spacing8" justifyContent="space-between">
        <AnimatedFlex
          entering={FadeIn}
          // TODO(EXT-526): re-enable `exiting` animation when it's fixed.
          exiting={isWeb ? undefined : FadeOut}
          gap="$spacing2"
          onLayout={onInputPanelLayout}
        >
          {nftIn ? (
            <NFTTransfer asset={nftIn} nftSize={fullHeight / 4} />
          ) : (
            <Flex borderColor="$surface3" borderRadius="$rounded20" borderWidth={1} justifyContent="center">
              <CurrencyInputPanelLegacy
                currencyAmount={currencyAmounts[CurrencyField.INPUT]}
                currencyBalance={currencyBalances[CurrencyField.INPUT]}
                currencyInfo={currencyInInfo}
                focus={currencyFieldFocused}
                isFiatInput={isFiatInput}
                isOnScreen={!showingSelectorScreen}
                showSoftInputOnFocus={showNativeKeyboard}
                transactionType={TransactionType.Send}
                usdValue={inputCurrencyUSDValue}
                value={isFiatInput ? exactAmountFiat : exactAmountToken}
                warnings={warnings.warnings}
                onPressIn={(): void => setCurrencyFieldFocused(true)}
                onSelectionChange={
                  showNativeKeyboard ? undefined : (start, end): void => setInputSelection({ start, end })
                }
                onSetExactAmount={(value): void => onSetExactAmount(CurrencyField.INPUT, value, isFiatInput)}
                onSetMax={(amount): void => {
                  onSetMax(amount)
                  setCurrencyFieldFocused(false)
                }}
                onShowTokenSelector={(): void => onShowTokenSelector(CurrencyField.INPUT)}
                onToggleFiatInput={onToggleFiatInput}
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
              backgroundColor={recipient ? '$surface2' : '$transparent'}
              borderBottomLeftRadius={transferWarning || isBlocked ? '$none' : '$rounded20'}
              borderBottomRightRadius={transferWarning || isBlocked ? '$none' : '$rounded20'}
              borderBottomWidth={transferWarning || isBlocked ? 0 : 1}
              borderColor="$surface3"
              borderTopLeftRadius="$rounded20"
              borderTopRightRadius="$rounded20"
              borderWidth={1}
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
                    borderBottomLeftRadius="$rounded16"
                    borderBottomRightRadius="$rounded16"
                    borderTopColor="$surface1"
                    borderTopWidth={0}
                    gap="$spacing8"
                    px="$spacing12"
                    py="$spacing12"
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
            </Flex>
            {gasFeeUSD && !transferWarning && !isBlocked && (
              <Flex centered row py="$spacing12">
                <NetworkFeeWarning tooltipTrigger={null}>
                  <AnimatedFlex centered row entering={FadeIn} gap="$spacing4">
                    <Gas color="$neutral2" size="$icon.16" />
                    <Text color="$neutral2" variant="body3">
                      {gasFeeFormatted}
                    </Text>
                  </AnimatedFlex>
                </NetworkFeeWarning>
              </Flex>
            )}
            {transferWarning && !isBlocked ? (
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
                  <SendWarningIcon
                    color={transferWarningColor.text}
                    height={iconSizes.icon16}
                    strokeWidth={1.5}
                    width={iconSizes.icon16}
                  />
                  <Text adjustsFontSizeToFit color={transferWarningColor.text} variant="body3">
                    {transferWarning.title}
                  </Text>
                </Flex>
              </TouchableArea>
            ) : null}
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
                borderWidth={1}
                isRecipientBlocked={isRecipientBlocked}
                px="$spacing16"
                py="$spacing12"
              />
            ) : null}
          </Flex>
        </AnimatedFlex>

        <AnimatedFlex
          bottom={0}
          // TODO(EXT-526): re-enable `exiting` animation when it's fixed.
          exiting={isWeb ? undefined : FadeOutDown}
          gap="$spacing8"
          left={0}
          opacity={isLayoutPending ? 0 : 1}
          position="absolute"
          right={0}
          onLayout={onDecimalPadLayout}
        >
          {!isWeb && !nftIn && !showNativeKeyboard && (
            <DecimalPadLegacy
              hasCurrencyPrefix={isFiatInput}
              resetSelection={resetSelection}
              selection={inputSelection}
              setValue={(newValue): void => {
                if (!currencyFieldFocused) {
                  return
                }
                onSetExactAmount(CurrencyField.INPUT, newValue, isFiatInput)
              }}
              value={isFiatInput ? exactAmountFiat : exactAmountToken}
            />
          )}
          <Button
            disabled={actionButtonDisabled && !isViewOnlyWallet}
            // Override opacity only for view-only wallets
            opacity={isViewOnlyWallet ? 0.4 : undefined}
            size="large"
            testID={TestID.ReviewTransfer}
            onPress={onPressReview}
          >
            {t('send.button.review')}
          </Button>
        </AnimatedFlex>
      </Flex>
    </>
  )
}
