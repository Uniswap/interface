// TODO(MOB-203): reduce component complexity
/* eslint-disable complexity */
import { AnyAction } from '@reduxjs/toolkit'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, StyleSheet } from 'react-native'
import { FadeIn, FadeOut, FadeOutDown } from 'react-native-reanimated'
import { Button, ButtonSize } from 'src/components/buttons/Button'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TransferArrowButton } from 'src/components/buttons/TransferArrowButton'
import { CurrencyInputPanel } from 'src/components/input/CurrencyInputPanel'
import { DecimalPad } from 'src/components/input/DecimalPad'
import { RecipientInputPanel } from 'src/components/input/RecipientInputPanel'
import { TextInputProps } from 'src/components/input/TextInput'
import { AnimatedFlex } from 'src/components/layout'
import { Warning, WarningAction, WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal, { getAlertColor } from 'src/components/modals/WarningModal/WarningModal'
import { NFTTransfer } from 'src/components/NFT/NFTTransfer'
import { TokenSelectorFlow } from 'src/components/TokenSelector/TokenSelector'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import {
  useShouldShowNativeKeyboard,
  useTokenFormActionHandlers,
  useTokenSelectorActionHandlers,
} from 'src/features/transactions/hooks'
import { useUSDTokenUpdater } from 'src/features/transactions/swap/hooks'
import { transactionStateActions } from 'src/features/transactions/transactionState/transactionState'
import {
  DerivedTransferInfo,
  useOnToggleShowRecipientSelector,
} from 'src/features/transactions/transfer/hooks'
import { TransferFormSpeedbumps } from 'src/features/transactions/transfer/TransferFormWarnings'
import { BlockedAddressWarning } from 'src/features/trm/BlockedAddressWarning'
import { useWalletRestore } from 'src/features/wallet/hooks'
import { Flex, Text, useSporeColors } from 'ui/src'
import AlertTriangleIcon from 'ui/src/assets/icons/alert-triangle.svg'
import InfoCircleFilled from 'ui/src/assets/icons/info-circle-filled.svg'
import { dimensions, iconSizes, spacing } from 'ui/src/theme'
import { usePrevious } from 'utilities/src/react/hooks'
import { useUSDCValue } from 'wallet/src/features/routing/useUSDCPrice'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { createTransactionId } from 'wallet/src/features/transactions/utils'
import { useIsBlockedActiveAddress } from 'wallet/src/features/trm/hooks'

interface TransferTokenProps {
  dispatch: React.Dispatch<AnyAction>
  derivedTransferInfo: DerivedTransferInfo
  onNext: () => void
  warnings: Warning[]
  showingSelectorScreen: boolean
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
  showingSelectorScreen,
}: TransferTokenProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const {
    currencyAmounts,
    currencyBalances,
    exactAmountToken,
    exactAmountUSD,
    recipient,
    isUSDInput = false,
    currencyInInfo,
    nftIn,
    chainId,
  } = derivedTransferInfo

  const currencyIn = currencyInInfo?.currency
  useUSDTokenUpdater(
    dispatch,
    isUSDInput,
    exactAmountToken,
    exactAmountUSD,
    currencyIn ?? undefined
  )

  const inputCurrencyUSDValue = useUSDCValue(currencyAmounts[CurrencyField.INPUT])

  const [currencyFieldFocused, setCurrencyFieldFocused] = useState(true)
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [showSpeedbumpModal, setShowSpeedbumpModal] = useState(false)
  const [transferSpeedbump, setTransferSpeedbump] = useState<TransferSpeedbump>({
    loading: true,
    hasWarning: false,
  })

  const { onShowTokenSelector } = useTokenSelectorActionHandlers(
    dispatch,
    TokenSelectorFlow.Transfer
  )
  const { onSetExactAmount, onSetMax } = useTokenFormActionHandlers(dispatch)
  const onToggleShowRecipientSelector = useOnToggleShowRecipientSelector(dispatch)

  const { isBlocked, isBlockedLoading } = useIsBlockedActiveAddress()

  const { walletNeedsRestore, openWalletRestoreModal } = useWalletRestore()

  const onRestorePress = (): void => {
    setCurrencyFieldFocused(false)
    openWalletRestoreModal()
  }

  const actionButtonDisabled =
    warnings.some((warning) => warning.action === WarningAction.DisableReview) ||
    transferSpeedbump.loading ||
    isBlocked ||
    isBlockedLoading ||
    walletNeedsRestore

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

  const prevIsUSDInput = usePrevious(isUSDInput)

  // when text changes on the screen, the default iOS input behavior is to use the same cursor
  // position but from the END of the input. so for example, if the cursor is currently at
  // 12.3|4 and the input changes to $1.232354, then new cursor will be at $1.23235|4
  // this useEffect essentially calculates where the new cursor position is when the text has changed
  // and that only happens on toggling USD <-> token input
  useEffect(() => {
    // only run this useEffect if isUSDInput has changed
    // if inputSelection is undefined, then that means no text selection or cursor
    // movement has happened yet, so let iOS do its default thang
    if (isUSDInput === prevIsUSDInput || !inputSelection) return

    if (inputSelection.start !== inputSelection.end) {
      setInputSelection(undefined)
      return
    }

    const [prevInput, newInput] = isUSDInput
      ? [exactAmountToken, exactAmountUSD]
      : [exactAmountUSD, exactAmountToken]
    const positionFromEnd = prevInput.length - inputSelection.start
    const newPositionFromStart = newInput.length - positionFromEnd
    const newPositionFromStartWithPrefix = newPositionFromStart + (isUSDInput ? 1 : -1)

    setInputSelection({
      start: newPositionFromStartWithPrefix,
      end: newPositionFromStartWithPrefix,
    })
  }, [
    isUSDInput,
    prevIsUSDInput,
    inputSelection,
    setInputSelection,
    exactAmountToken,
    exactAmountUSD,
  ])

  const onTransferWarningClick = (): void => {
    Keyboard.dismiss()
    setShowWarningModal(true)
  }

  const transferWarning = warnings.find((warning) => warning.severity >= WarningSeverity.Low)
  const transferWarningColor = getAlertColor(transferWarning?.severity)

  const { showNativeKeyboard, onDecimalPadLayout, isLayoutPending, onInputPanelLayout } =
    useShouldShowNativeKeyboard()

  const TRANSFER_DIRECTION_BUTTON_SIZE = iconSizes.icon20
  const TRANSFER_DIRECTION_BUTTON_INNER_PADDING = spacing.spacing12
  const TRANSFER_DIRECTION_BUTTON_BORDER_WIDTH = spacing.spacing4
  const SendWarningIcon = transferWarning?.icon ?? AlertTriangleIcon

  return (
    <>
      {showWarningModal && transferWarning?.title && (
        <WarningModal
          caption={transferWarning.message}
          confirmText={t('Close')}
          icon={
            <SendWarningIcon
              color={transferWarningColor.text}
              height={iconSizes.icon24}
              width={iconSizes.icon24}
            />
          }
          modalName={ModalName.SendWarning}
          severity={transferWarning.severity}
          title={transferWarning.title}
          onClose={(): void => setShowWarningModal(false)}
          onConfirm={(): void => setShowWarningModal(false)}
        />
      )}
      <TransferFormSpeedbumps
        chainId={chainId}
        recipient={recipient}
        setShowSpeedbumpModal={onSetShowSpeedbumpModal}
        setTransferSpeedbump={onSetTransferSpeedbump}
        showSpeedbumpModal={showSpeedbumpModal}
        onNext={goToNext}
      />
      <Flex grow gap="$spacing8" justifyContent="space-between">
        <AnimatedFlex
          entering={FadeIn}
          exiting={FadeOut}
          gap="spacing2"
          onLayout={onInputPanelLayout}>
          {nftIn ? (
            <NFTTransfer asset={nftIn} nftSize={dimensions.fullHeight / 4} />
          ) : (
            <Flex
              backgroundColor="$surface2"
              borderRadius="$rounded20"
              gap="$none"
              justifyContent="center">
              <CurrencyInputPanel
                currencyAmount={currencyAmounts[CurrencyField.INPUT]}
                currencyBalance={currencyBalances[CurrencyField.INPUT]}
                currencyInfo={currencyInInfo}
                focus={currencyFieldFocused}
                isOnScreen={!showingSelectorScreen}
                isUSDInput={isUSDInput}
                showSoftInputOnFocus={showNativeKeyboard}
                usdValue={inputCurrencyUSDValue}
                value={isUSDInput ? exactAmountUSD : exactAmountToken}
                warnings={warnings}
                onPressIn={(): void => setCurrencyFieldFocused(true)}
                onSelectionChange={
                  showNativeKeyboard
                    ? undefined
                    : (start, end): void => setInputSelection({ start, end })
                }
                onSetExactAmount={(value): void =>
                  onSetExactAmount(CurrencyField.INPUT, value, isUSDInput)
                }
                onSetMax={(amount): void => {
                  onSetMax(amount)
                  setCurrencyFieldFocused(false)
                }}
                onShowTokenSelector={(): void => onShowTokenSelector(CurrencyField.INPUT)}
              />
            </Flex>
          )}

          <Flex gap="$none" zIndex="$popover">
            <Flex
              alignItems="center"
              gap="$none"
              height={
                TRANSFER_DIRECTION_BUTTON_SIZE +
                TRANSFER_DIRECTION_BUTTON_INNER_PADDING +
                TRANSFER_DIRECTION_BUTTON_BORDER_WIDTH
              }
              style={StyleSheet.absoluteFill}>
              <Flex
                alignItems="center"
                bottom={TRANSFER_DIRECTION_BUTTON_SIZE / 2}
                gap="$none"
                position="absolute">
                <TransferArrowButton
                  disabled
                  bg={recipient ? 'surface2' : 'surface2'}
                  padding="spacing8"
                />
              </Flex>
            </Flex>
          </Flex>

          <Flex gap="$none">
            <Flex
              backgroundColor={recipient ? '$surface2' : '$transparent'}
              borderBottomLeftRadius={transferWarning || isBlocked ? '$none' : '$rounded20'}
              borderBottomRightRadius={transferWarning || isBlocked ? '$none' : '$rounded20'}
              borderTopLeftRadius="$rounded20"
              borderTopRightRadius="$rounded20"
              gap="$none"
              justifyContent="center">
              {recipient && (
                <RecipientInputPanel
                  recipientAddress={recipient}
                  onToggleShowRecipientSelector={onToggleShowRecipientSelector}
                />
              )}
              {walletNeedsRestore && (
                <TouchableArea onPress={onRestorePress}>
                  <Flex
                    grow
                    row
                    alignItems="center"
                    alignSelf="stretch"
                    backgroundColor="$surface2"
                    borderBottomLeftRadius="$rounded16"
                    borderBottomRightRadius="$rounded16"
                    borderTopColor="$surface1"
                    borderTopWidth={1}
                    gap="$spacing8"
                    px="$spacing12"
                    py="$spacing12">
                    <InfoCircleFilled
                      color={colors.DEP_accentWarning.val}
                      height={iconSizes.icon20}
                      width={iconSizes.icon20}
                    />
                    <Text color="$DEP_accentWarning" variant="subheadSmall">
                      {t('Restore your wallet to send')}
                    </Text>
                  </Flex>
                </TouchableArea>
              )}
            </Flex>
            {transferWarning && !isBlocked ? (
              <TouchableArea mt="spacing1" onPress={onTransferWarningClick}>
                <Flex
                  row
                  alignItems="center"
                  alignSelf="stretch"
                  backgroundColor={transferWarningColor.background}
                  borderBottomLeftRadius="$rounded16"
                  borderBottomRightRadius="$rounded16"
                  flexGrow={1}
                  gap="$spacing8"
                  px="$spacing16"
                  py="$spacing12">
                  <SendWarningIcon
                    color={transferWarningColor.text}
                    height={iconSizes.icon16}
                    strokeWidth={1.5}
                    width={iconSizes.icon16}
                  />
                  <Text color={transferWarningColor.text} variant="subheadSmall">
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
                mt="$spacing2"
                px="$spacing16"
                py="$spacing12"
              />
            ) : null}
          </Flex>
        </AnimatedFlex>
        <AnimatedFlex
          bottom={0}
          exiting={FadeOutDown}
          gap="spacing8"
          left={0}
          opacity={isLayoutPending ? 0 : 1}
          position="absolute"
          right={0}
          onLayout={onDecimalPadLayout}>
          {!nftIn && !showNativeKeyboard && (
            <DecimalPad
              hasCurrencyPrefix={isUSDInput}
              resetSelection={resetSelection}
              selection={inputSelection}
              setValue={(newValue): void => {
                if (!currencyFieldFocused) return
                onSetExactAmount(CurrencyField.INPUT, newValue, isUSDInput)
              }}
              value={isUSDInput ? exactAmountUSD : exactAmountToken}
            />
          )}
          <Button
            disabled={actionButtonDisabled}
            label={t('Review transfer')}
            size={ButtonSize.Large}
            testID={ElementName.ReviewTransfer}
            onPress={onPressReview}
          />
        </AnimatedFlex>
      </Flex>
    </>
  )
}
