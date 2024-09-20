import { useCallback, useState } from 'react'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { Flex, Text, TouchableArea, useIsShortMobileDevice, useMedia } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { iconSizes } from 'ui/src/theme'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { InsufficientNativeTokenWarning } from 'uniswap/src/features/transactions/InsufficientNativeTokenWarning/InsufficientNativeTokenWarning'
import { BlockedAddressWarning } from 'uniswap/src/features/transactions/modals/BlockedAddressWarning'
import { GasTradeRow, useDebouncedGasInfo } from 'uniswap/src/features/transactions/swap/form/footer/GasTradeRow'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings'
import { SwapWarningModal } from 'uniswap/src/features/transactions/swap/modals/SwapWarningModal'
import { useIsBlocked } from 'uniswap/src/features/trm/hooks'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard'

export function GasAndWarningRows(): JSX.Element {
  const isShort = useMedia().short
  const isShortMobileDevice = useIsShortMobileDevice()

  const account = useAccountMeta()

  const [showWarningModal, setShowWarningModal] = useState(false)

  const { isBlocked } = useIsBlocked(account?.address)

  const { formScreenWarning, insufficientGasFundsWarning, warnings } = useParsedSwapWarnings()
  const showFormWarning = formScreenWarning && formScreenWarning.displayedInline && !isBlocked

  const debouncedGasInfo = useDebouncedGasInfo()

  const onSwapWarningClick = useCallback(() => {
    if (!formScreenWarning?.warning.message) {
      // Do not show the modal if the warning doesn't have a message.
      return
    }

    dismissNativeKeyboard()
    setShowWarningModal(true)
  }, [formScreenWarning?.warning.message])

  return (
    <>
      {formScreenWarning && (
        <SwapWarningModal
          isOpen={showWarningModal}
          parsedWarning={formScreenWarning}
          onClose={(): void => setShowWarningModal(false)}
        />
      )}

      {/*
        Do not add any margins directly to this container, as this component is used in 2 different places.
        Adjust the margin in the parent component instead.
      */}
      <Flex gap={isShortMobileDevice ? '$spacing2' : isShort ? '$spacing8' : '$spacing16'}>
        {isBlocked && (
          // TODO: review design of this warning.
          <BlockedAddressWarning
            row
            alignItems="center"
            alignSelf="stretch"
            backgroundColor="$surface2"
            borderBottomLeftRadius="$rounded16"
            borderBottomRightRadius="$rounded16"
            flexGrow={1}
            px="$spacing16"
            py="$spacing12"
          />
        )}

        <GasTradeRow gasInfo={debouncedGasInfo} />

        {showFormWarning && (
          <TouchableArea onPress={onSwapWarningClick}>
            <AnimatedFlex centered row entering={FadeIn} exiting={FadeOut} gap="$spacing8" px="$spacing24">
              {formScreenWarning.Icon && (
                <formScreenWarning.Icon
                  color={formScreenWarning.color.text}
                  size={iconSizes.icon16}
                  strokeWidth={1.5}
                />
              )}
              <Flex row>
                <Text color={formScreenWarning.color.text} textAlign="center" variant="body3">
                  {formScreenWarning.warning.title}
                </Text>
              </Flex>
            </AnimatedFlex>
          </TouchableArea>
        )}

        <InsufficientNativeTokenWarning flow="swap" gasFee={debouncedGasInfo.gasFee} warnings={warnings} />

        {/*
        When there is no gas or no warning, we render an empty row to keep the layout consistent when calculating the container height.
        This is used when calculating the size of the `DecimalPad`.
        */}

        {!debouncedGasInfo.fiatPriceFormatted ? <EmptyRow /> : undefined}
        {!showFormWarning && !insufficientGasFundsWarning && <EmptyRow />}
      </Flex>
    </>
  )
}

function EmptyRow(): JSX.Element {
  return (
    <Flex centered gap="$spacing8" height={iconSizes.icon16}>
      <Text variant="body3"> </Text>
    </Flex>
  )
}
