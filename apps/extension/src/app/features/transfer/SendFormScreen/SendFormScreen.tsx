import { useCallback, useState } from 'react'
import { GasFeeRow } from 'src/app/features/transfer/SendFormScreen/GasFeeRow'
import { RecipientPanel } from 'src/app/features/transfer/SendFormScreen/RecipientPanel'
import { ReviewButton } from 'src/app/features/transfer/SendFormScreen/ReviewButton'
import { SendReviewScreen } from 'src/app/features/transfer/SendReviewScreen/SendReviewScreen'
import { TransferScreen, useTransferContext } from 'src/app/features/transfer/TransferContext'
import { Flex, Separator, useSporeColors } from 'ui/src'
import { BottomSheetModal } from 'uniswap/src/components/modals/BottomSheetModal'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { InsufficientNativeTokenWarning } from 'wallet/src/features/transactions/InsufficientNativeTokenWarning/InsufficientNativeTokenWarning'
import { useTokenFormActionHandlers } from 'wallet/src/features/transactions/hooks/useTokenFormActionHandlers'
import { useTokenSelectorActionHandlers } from 'wallet/src/features/transactions/hooks/useTokenSelectorActionHandlers'
import { useUSDCValue } from 'wallet/src/features/transactions/swap/trade/hooks/useUSDCPrice'
import { useUSDTokenUpdater } from 'wallet/src/features/transactions/swap/trade/hooks/useUSDTokenUpdater'
import { transactionStateActions } from 'wallet/src/features/transactions/transactionState/transactionState'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { TokenSelectorPanel } from 'wallet/src/features/transactions/transfer/TokenSelectorPanel'
import { TransferAmountInput } from 'wallet/src/features/transactions/transfer/TransferAmountInput'
import { TransferFormSpeedbumps } from 'wallet/src/features/transactions/transfer/TransferFormWarnings'
import { useShowSendNetworkNotification } from 'wallet/src/features/transactions/transfer/hooks/useShowSendNetworkNotification'
import { TokenSelectorFlow, TransferSpeedbump } from 'wallet/src/features/transactions/transfer/types'
import { createTransactionId } from 'wallet/src/features/transactions/utils'
import { BlockedAddressWarning } from 'wallet/src/features/trm/BlockedAddressWarning'
import { useIsBlocked, useIsBlockedActiveAddress } from 'wallet/src/features/trm/hooks'

export function SendFormScreen(): JSX.Element {
  const colors = useSporeColors()
  const {
    dispatch,
    derivedTransferInfo,
    selectingCurrencyField,
    exactAmountToken,
    exactAmountFiat,
    isFiatInput,
    warnings,
    gasFee,
    showRecipientSelector,
    screen,
    setScreen,
    recipient,
  } = useTransferContext()

  const { currencyInInfo, currencyBalances, currencyAmounts, chainId } = derivedTransferInfo

  useShowSendNetworkNotification({ chainId: currencyInInfo?.currency.chainId })

  const { onSetExactAmount, onSetMax, onToggleFiatInput } = useTokenFormActionHandlers(dispatch)
  const { onSelectCurrency, onHideTokenSelector, onShowTokenSelector } = useTokenSelectorActionHandlers(
    dispatch,
    TokenSelectorFlow.Transfer,
  )

  const currencyUSDValue = useUSDCValue(currencyAmounts[CurrencyField.INPUT])

  // Sync fiat and token amounts
  useUSDTokenUpdater(dispatch, Boolean(isFiatInput), exactAmountToken, exactAmountFiat ?? '', currencyInInfo?.currency)

  const exactValue = isFiatInput ? exactAmountFiat : exactAmountToken

  const showTokenSelector = selectingCurrencyField === CurrencyField.INPUT

  // warnings
  const [showSpeedbumpModal, setShowSpeedbumpModal] = useState(false)
  const [transferSpeedbump, setTransferSpeedbump] = useState<TransferSpeedbump>({
    loading: true,
    hasWarning: false,
  })

  // blocked addresses
  const { isBlocked: isActiveBlocked, isBlockedLoading: isActiveBlockedLoading } = useIsBlockedActiveAddress()
  const { isBlocked: isRecipientBlocked, isBlockedLoading: isRecipientBlockedLoading } = useIsBlocked(recipient)
  const isBlocked = isActiveBlocked || isRecipientBlocked
  const isBlockedLoading = isActiveBlockedLoading || isRecipientBlockedLoading

  const onShowReviewScreen = useCallback(() => {
    setShowSpeedbumpModal(false)
    const txId = createTransactionId()
    dispatch(transactionStateActions.setTxId(txId))
    setScreen(TransferScreen.SendReview)
  }, [dispatch, setScreen])

  const onPressReview = useCallback(() => {
    if (transferSpeedbump.hasWarning) {
      setShowSpeedbumpModal(true)
    } else {
      onShowReviewScreen()
    }
  }, [onShowReviewScreen, transferSpeedbump.hasWarning])

  const inputShadowProps = {
    shadowColor: colors.surface3.val,
    shadowRadius: 10,
    shadowOpacity: 0.04,
    zIndex: 1,
  }

  return (
    <Trace logImpression section={SectionName.TransferForm}>
      {screen === TransferScreen.SendReview && (
        <BottomSheetModal alignment="top" name={ModalName.SendReview}>
          <SendReviewScreen />
        </BottomSheetModal>
      )}
      <TransferFormSpeedbumps
        chainId={chainId}
        recipient={recipient}
        setShowSpeedbumpModal={setShowSpeedbumpModal}
        setTransferSpeedbump={setTransferSpeedbump}
        showSpeedbumpModal={showSpeedbumpModal}
        onNext={onShowReviewScreen}
      />
      <Flex fill gap="$spacing12">
        <Flex
          borderColor="$surface3"
          borderRadius="$rounded20"
          borderWidth="$spacing1"
          flexGrow={showTokenSelector ? 1 : 0}
          overflow="hidden"
          {...inputShadowProps}
        >
          <TokenSelectorPanel
            currencyAmount={currencyAmounts[CurrencyField.INPUT]}
            currencyBalance={currencyBalances[CurrencyField.INPUT]}
            currencyInfo={currencyInInfo}
            showTokenSelector={showTokenSelector}
            onHideTokenSelector={onHideTokenSelector}
            onSelectCurrency={onSelectCurrency}
            onSetMax={onSetMax}
            onShowTokenSelector={() => onShowTokenSelector(CurrencyField.INPUT)}
          />
          {!showTokenSelector && (
            <>
              <Separator />
              <TransferAmountInput
                currencyAmount={currencyAmounts[CurrencyField.INPUT]}
                currencyInfo={currencyInInfo}
                isFiatInput={Boolean(isFiatInput)}
                py="$spacing48"
                usdValue={currencyUSDValue}
                value={exactValue}
                warnings={warnings}
                onSetExactAmount={onSetExactAmount}
                onToggleIsFiatMode={onToggleFiatInput}
              />
            </>
          )}
        </Flex>
        {!showTokenSelector && (
          <>
            <Flex
              borderColor="$surface3"
              borderRadius="$rounded20"
              borderWidth="$spacing1"
              flexGrow={showRecipientSelector ? 1 : 0}
              overflow="hidden"
              px="$spacing16"
              py="$spacing12"
              {...inputShadowProps}
            >
              <RecipientPanel />
            </Flex>
            {!showRecipientSelector && (
              <>
                {isBlocked && (
                  <BlockedAddressWarning
                    row
                    alignItems="center"
                    backgroundColor="$surface2"
                    borderRadius="$rounded16"
                    isRecipientBlocked={isRecipientBlocked}
                    px="$spacing16"
                    py="$spacing12"
                  />
                )}
                <ReviewButton disabled={isBlocked || isBlockedLoading} onPress={onPressReview} />
                <GasFeeRow chainId={chainId} gasFee={gasFee} />
                <InsufficientNativeTokenWarning flow="send" gasFee={gasFee} warnings={warnings.warnings} />
              </>
            )}
          </>
        )}
      </Flex>
    </Trace>
  )
}
