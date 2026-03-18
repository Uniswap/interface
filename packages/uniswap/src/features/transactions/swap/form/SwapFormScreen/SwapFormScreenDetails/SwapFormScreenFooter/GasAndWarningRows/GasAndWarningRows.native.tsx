import { memo, useCallback, useMemo, useState } from 'react'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { Flex, Text, TouchableArea, useIsShortMobileDevice, useMedia } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { iconSizes } from 'ui/src/theme'
import type { WarningWithStyle } from 'uniswap/src/components/modals/WarningModal/types'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { InsufficientNativeTokenWarning } from 'uniswap/src/features/transactions/components/InsufficientNativeTokenWarning/InsufficientNativeTokenWarning'
import { useInsufficientNativeTokenWarning } from 'uniswap/src/features/transactions/components/InsufficientNativeTokenWarning/useInsufficientNativeTokenWarning'
import { BlockedAddressWarning } from 'uniswap/src/features/transactions/modals/BlockedAddressWarning'
import { SwapWarningModal } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/SwapWarningModal'
import { TradeInfoRow } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/TradeInfoRow/TradeInfoRow'
import { useDebouncedGasInfo } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/useDebouncedGasInfo'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings'
import { useIsBlocked } from 'uniswap/src/features/trm/hooks'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'

/*
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║                                                                           ║
 * ║   W A R N I N G                                                           ║
 * ║                                                                           ║
 * ║   Be very careful when modifying this component and make sure you've      ║
 * ║   tested your changes with every possible combination of warnings and     ║
 * ║   mobile device sizes.                                                    ║
 * ║                                                                           ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */
export function GasAndWarningRows(): JSX.Element {
  const isShortMobileDevice = useIsShortMobileDevice()
  const isShort = useMedia().short

  const evmAddress = useActiveAddress(Platform.EVM)

  const [showWarningModal, setShowWarningModal] = useState(false)

  const { isBlocked } = useIsBlocked(evmAddress)

  const { formScreenWarning, insufficientGasFundsWarning, warnings } = useParsedSwapWarnings()
  const showFormWarning = formScreenWarning && formScreenWarning.displayedInline && !isBlocked

  const debouncedGasInfo = useDebouncedGasInfo()

  const insufficientNativeTokenWarning = useInsufficientNativeTokenWarning({
    warnings,
    flow: 'swap',
    gasFee: debouncedGasInfo.gasFee,
  })

  const onSwapWarningClick = useCallback(() => {
    if (!formScreenWarning?.warning.message) {
      // Do not show the modal if the warning doesn't have a message.
      return
    }

    dismissNativeKeyboard()
    setShowWarningModal(true)
  }, [formScreenWarning?.warning.message])

  // Count visible content rows to adjust spacing dynamically.
  // When 3+ rows are visible, we use minimal spacing to fit within available space
  // and prevent overflow into the preset buttons.
  const visibleRowCount = useMemo(() => {
    let count = 1 // TradeInfoRow always renders
    if (isBlocked) {
      count += 1
    }
    if (showFormWarning) {
      count += 1
    }
    if (insufficientNativeTokenWarning) {
      count += 1
    }
    return count
  }, [isBlocked, showFormWarning, insufficientNativeTokenWarning])

  // Calculate gap based on device size and number of visible rows.
  // Use minimal spacing when 3+ rows are visible to prevent overflow.
  const gap = useMemo(() => {
    const hasMultipleWarnings = visibleRowCount >= 3
    if (isShortMobileDevice) {
      return '$spacing2'
    }
    if (isShort || hasMultipleWarnings) {
      return '$spacing8'
    }
    return '$spacing16'
  }, [isShortMobileDevice, isShort, visibleRowCount])

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
      <Flex gap={gap}>
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

        <TradeInfoRow gasInfo={debouncedGasInfo} />

        {showFormWarning && (
          <FormWarning
            Icon={formScreenWarning.Icon}
            textColor={formScreenWarning.color.text}
            warningTitle={formScreenWarning.warning.title}
            onSwapWarningClick={onSwapWarningClick}
          />
        )}

        <InsufficientNativeTokenWarning flow="swap" gasFee={debouncedGasInfo.gasFee} warnings={warnings} />

        {/*
        When there is no gas or no warning, we render an empty row to keep the layout consistent when calculating the container height.
        This is used when calculating the size of the `DecimalPad`.
        */}

        {!debouncedGasInfo.fiatPriceFormatted ? <EmptyRow /> : undefined}
        {!(showFormWarning || insufficientGasFundsWarning || insufficientNativeTokenWarning) && <EmptyRow />}
      </Flex>
    </>
  )
}

// We want to optimize the swap flow as much as possible, so we split this up into its own component in order to memoize it.
// If you modify this component, make sure you don't pass complex objects as props that would change on every render.
const FormWarning = memo(function FormWarning({
  Icon,
  textColor,
  warningTitle,
  onSwapWarningClick,
}: {
  Icon?: WarningWithStyle['Icon']
  textColor: WarningWithStyle['color']['text']
  warningTitle: WarningWithStyle['warning']['title']
  onSwapWarningClick: () => void
}): JSX.Element {
  return (
    <TouchableArea onPress={onSwapWarningClick}>
      <AnimatedFlex centered row entering={FadeIn} exiting={FadeOut} gap="$spacing8" px="$spacing24">
        {Icon && <Icon color={textColor} size="$icon.16" strokeWidth={1.5} />}
        <Flex row>
          <Text color={textColor} textAlign="center" variant="body3">
            {warningTitle}
          </Text>
        </Flex>
      </AnimatedFlex>
    </TouchableArea>
  )
})

function EmptyRow(): JSX.Element {
  return (
    <Flex row centered p="$spacing2">
      <Flex row minHeight={iconSizes.icon16}>
        <Text variant="body3"> </Text>
      </Flex>
    </Flex>
  )
}
