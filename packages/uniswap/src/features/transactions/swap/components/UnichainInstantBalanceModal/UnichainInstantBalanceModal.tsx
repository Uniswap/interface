import { useCallback, useRef } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Button, Flex, ModalCloseIcon, Text, useExtractedTokenColor } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { GradientContainer } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/GradientContainer'
import { StyledTokenLogo } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/StyledTokenLogo'
import { useActualCompletionTime } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/hooks/useActualCompletionTime'
import { useActualSwapOutput } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/hooks/useActualSwapOutput'
import { useBackgroundColor } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/hooks/useBackgroundColor'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { isInterface, isWeb } from 'utilities/src/platform'

export function UnichainInstantBalanceModal(): JSX.Element | null {
  const { t } = useTranslation()

  const { outputCurrencyInfo, lastSwapOutputBalance } = useActualSwapOutput()

  const backgroundColor = useBackgroundColor()
  const { tokenColor } = useExtractedTokenColor({
    imageUrl: outputCurrencyInfo?.logoUrl,
    tokenName: outputCurrencyInfo?.currency.name,
    backgroundColor,
    defaultColor: backgroundColor,
  })

  const { setScreen, onClose, screen } = useTransactionModalContext()

  const confirmTimeSeconds = useActualCompletionTime({
    outputCurrencyInfo,
  })

  const updateSwapForm = useSwapFormStore((s) => s.updateSwapForm)
  const isHandleCloseCalledRef = useRef(false)
  const handleClose = useCallback(() => {
    if (isHandleCloseCalledRef.current) {
      return
    }
    isHandleCloseCalledRef.current = true
    updateSwapForm({
      preSwapDataPreserved: undefined,
      postSwapDataPreserved: undefined,
      exactAmountFiat: undefined,
      exactAmountToken: '',
      isSubmitting: false,
      showPendingUI: false,
      isConfirmed: false,
      preSwapNativeAssetAmountRaw: undefined,
    })

    // Close the entire swap flow
    if (isWeb) {
      setScreen(TransactionScreen.Form)
    } else {
      onClose()
    }
  }, [onClose, updateSwapForm, setScreen])

  const isModalOpen = outputCurrencyInfo && lastSwapOutputBalance && confirmTimeSeconds

  if (!isModalOpen) {
    return null
  }

  return (
    <Modal
      height="auto"
      // currency null guard ensures this is only shown when a Unichain swap is completed
      isModalOpen={screen === TransactionScreen.UnichainInstantBalance}
      name={ModalName.UnichainInstantBalanceModal}
      alignment={isInterface ? 'center' : 'top'}
      padding="$none"
      zIndex={zIndexes.popover}
      onClose={handleClose}
    >
      <GradientContainer tokenBackground={tokenColor ?? backgroundColor}>
        <Flex gap="$spacing28" alignItems="center" p="$spacing24">
          {/* TOP-RIGHT CLOSE BUTTON */}
          {isWeb && (
            <Flex width="100%" height="$spacing32" flexDirection="row-reverse">
              <ModalCloseIcon onClose={handleClose} />
            </Flex>
          )}

          {/* TOKEN LOGO */}
          <StyledTokenLogo currencyInfo={outputCurrencyInfo} size={80} />

          {/* TEXT CONTENT */}
          <Flex gap="$gap8" alignItems="center">
            <Text variant="subheading1" color="$neutral1">
              {t('swap.details.completed')}
            </Text>
            <Text variant="heading2" color="$neutral1">
              {`${lastSwapOutputBalance} ${outputCurrencyInfo.currency.symbol}`}
            </Text>
            <Text variant="body3" color="$neutral2" textAlign="center">
              {confirmTimeSeconds === 0.2 ? (
                <Trans
                  i18nKey="swap.details.completedIn.withFasterThan"
                  values={{ percent: 90 }}
                  components={{
                    time: (
                      <Text variant="body3" color="$neutral1">
                        {t('common.time.past.seconds.short', { seconds: confirmTimeSeconds })}
                      </Text>
                    ),
                  }}
                />
              ) : (
                <Trans
                  i18nKey="swap.details.completedIn"
                  components={{
                    time: (
                      <Text variant="body3" color="$neutral1">
                        {t('common.time.past.seconds.short', { seconds: confirmTimeSeconds })}
                      </Text>
                    ),
                  }}
                />
              )}
            </Text>
          </Flex>

          {/* PRIMARY CLOSE BUTTON */}
          <Button
            p="$padding16"
            emphasis="tertiary"
            size="large"
            borderColor="$surface3"
            minHeight={56}
            onPress={handleClose}
          >
            {t('common.button.close')}
          </Button>
        </Flex>
      </GradientContainer>
    </Modal>
  )
}
