import { useCallback } from 'react'
import { RecipientPanel } from 'src/app/features/send/SendFormScreen/RecipientPanel'
import { ReviewButton } from 'src/app/features/send/SendFormScreen/ReviewButton'
import { Flex, Separator, useSporeColors } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { InsufficientNativeTokenWarning } from 'uniswap/src/features/transactions/InsufficientNativeTokenWarning/InsufficientNativeTokenWarning'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { useUSDTokenUpdater } from 'uniswap/src/features/transactions/hooks/useUSDTokenUpdater'
import { BlockedAddressWarning } from 'uniswap/src/features/transactions/modals/BlockedAddressWarning'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { useIsBlocked } from 'uniswap/src/features/trm/hooks'
import { CurrencyField } from 'uniswap/src/types/currency'
import { createTransactionId } from 'uniswap/src/utils/createTransactionId'
import { useSendContext } from 'wallet/src/features/transactions/contexts/SendContext'
import { GasFeeRow } from 'wallet/src/features/transactions/send/GasFeeRow'
import { SendAmountInput } from 'wallet/src/features/transactions/send/SendAmountInput'
import { SendReviewDetails } from 'wallet/src/features/transactions/send/SendReviewDetails'
import { TokenSelectorPanel } from 'wallet/src/features/transactions/send/TokenSelectorPanel'
import { useShowSendNetworkNotification } from 'wallet/src/features/transactions/send/hooks/useShowSendNetworkNotification'
import { useIsBlockedActiveAddress } from 'wallet/src/features/trm/hooks'

export function SendFormScreen(): JSX.Element {
  const colors = useSporeColors()

  const {
    derivedSendInfo,
    selectingCurrencyField,
    exactAmountToken,
    isFiatInput,
    warnings,
    gasFee,
    showRecipientSelector,
    recipient,
    updateSendForm,
    onSelectCurrency,
  } = useSendContext()

  const { screen, setScreen } = useTransactionModalContext()

  const { currencyInInfo, currencyBalances, currencyAmounts, chainId, exactAmountFiat } = derivedSendInfo

  // When a user changes networks or visits the send screen, show a network notification
  useShowSendNetworkNotification({ chainId: currencyInInfo?.currency.chainId })

  // Sync fiat and token amounts
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

  useUSDTokenUpdater({
    onFiatAmountUpdated,
    onTokenAmountUpdated,
    isFiatInput: Boolean(isFiatInput),
    exactAmountToken,
    exactAmountFiat,
    currency: currencyInInfo?.currency,
  })

  const currencyUSDValue = useUSDCValue(currencyAmounts[CurrencyField.INPUT])

  const exactValue = isFiatInput ? exactAmountFiat : exactAmountToken
  const showTokenSelector = selectingCurrencyField === CurrencyField.INPUT

  // blocked addresses
  const { isBlocked: isActiveBlocked, isBlockedLoading: isActiveBlockedLoading } = useIsBlockedActiveAddress()
  const { isBlocked: isRecipientBlocked, isBlockedLoading: isRecipientBlockedLoading } = useIsBlocked(recipient)
  const isBlocked = isActiveBlocked || isRecipientBlocked
  const isBlockedLoading = isActiveBlockedLoading || isRecipientBlockedLoading

  const onPressReview = useCallback(() => {
    const txId = createTransactionId()
    updateSendForm({ txId })
    setScreen(TransactionScreen.Review)
  }, [setScreen, updateSendForm])

  const onSetExactAmount = useCallback(
    (amount: string) => {
      updateSendForm(isFiatInput ? { exactAmountFiat: amount } : { exactAmountToken: amount })
    },
    [isFiatInput, updateSendForm],
  )

  const onSetMax = useCallback(
    (amount: string) => {
      updateSendForm({ exactAmountToken: amount, isFiatInput: false, focusOnCurrencyField: null })
    },
    [updateSendForm],
  )

  const onHideTokenSelector = useCallback(() => {
    updateSendForm({ selectingCurrencyField: undefined })
  }, [updateSendForm])

  const onShowTokenSelector = useCallback(() => {
    updateSendForm({ selectingCurrencyField: CurrencyField.INPUT })
  }, [updateSendForm])

  const onToggleFiatInput = useCallback(() => {
    updateSendForm({ isFiatInput: !isFiatInput })
  }, [isFiatInput, updateSendForm])

  const inputShadowProps = {
    shadowColor: colors.surface3.val,
    shadowRadius: 10,
    shadowOpacity: 0.04,
    zIndex: 1,
  }

  return (
    <Trace logImpression section={SectionName.SendForm}>
      <Modal alignment="top" isModalOpen={screen === TransactionScreen.Review} name={ModalName.SendReview}>
        <SendReviewDetails />
      </Modal>
      <Flex fill gap="$spacing12">
        <Flex
          borderColor="$surface3"
          borderRadius="$rounded20"
          borderWidth="$spacing1"
          flexGrow={0}
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
            onShowTokenSelector={onShowTokenSelector}
          />
          <Separator />
          <SendAmountInput
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
        </Flex>
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
          <RecipientPanel chainId={chainId} />
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
      </Flex>
    </Trace>
  )
}
