import { useCallback, useState } from 'react'
import { Keyboard } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { AnimatedFlex, Flex, Icons, Text, TouchableArea, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { SwapRewriteVariant } from 'wallet/src/features/experiments/constants'
import { useSwapRewriteVariant } from 'wallet/src/features/experiments/hooks'
import { useUSDValue } from 'wallet/src/features/gas/hooks'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useSwapFormContext } from 'wallet/src/features/transactions/contexts/SwapFormContext'
import { useSwapTxContext } from 'wallet/src/features/transactions/contexts/SwapTxContext'
import { useParsedSwapWarnings } from 'wallet/src/features/transactions/hooks/useParsedSwapWarnings'
import { NetworkFeeInfoModal } from 'wallet/src/features/transactions/swap/modals/NetworkFeeInfoModal'
import { SwapWarningModal } from 'wallet/src/features/transactions/swap/SwapWarningModal'
import { BlockedAddressWarning } from 'wallet/src/features/trm/BlockedAddressWarning'
import { useIsBlockedActiveAddress } from 'wallet/src/features/trm/hooks'

export function GasAndWarningRows({ renderEmptyRows }: { renderEmptyRows: boolean }): JSX.Element {
  const colors = useSporeColors()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const { gasFee } = useSwapTxContext()
  const { derivedSwapInfo } = useSwapFormContext()

  const { chainId } = derivedSwapInfo

  const [showWarningModal, setShowWarningModal] = useState(false)
  const [showGasInfoModal, setShowGasInfoModal] = useState(false)

  const { isBlocked } = useIsBlockedActiveAddress()

  const { formScreenWarning } = useParsedSwapWarnings()

  const gasFeeUSD = useUSDValue(chainId, gasFee?.value)
  const gasFeeFormatted = convertFiatAmountFormatted(gasFeeUSD, NumberType.FiatGasPrice)

  const swapRewriteVariant = useSwapRewriteVariant()
  const hideGasInfoForTest = swapRewriteVariant === SwapRewriteVariant.RewriteNoGas

  // only show the gas fee icon and price if we have a valid fee, and not hidden by experiment variant
  const showGasFee = Boolean(gasFeeUSD && !hideGasInfoForTest)

  const onSwapWarningClick = useCallback(() => {
    if (!formScreenWarning?.warning.message) {
      // Do not show the modal if the warning doesn't have a message.
      return
    }

    Keyboard.dismiss()
    setShowWarningModal(true)
  }, [formScreenWarning?.warning.message])

  return (
    <>
      {showGasInfoModal && <NetworkFeeInfoModal onClose={(): void => setShowGasInfoModal(false)} />}

      {showWarningModal && formScreenWarning && (
        <SwapWarningModal
          parsedWarning={formScreenWarning}
          onClose={(): void => setShowWarningModal(false)}
        />
      )}

      {/*
        Do not add any margins directly to this container, as this component is used in 2 different places.
        Adjust the margin in the parent component instead.
      */}
      <Flex $short={{ gap: '$spacing8' }} gap="$spacing16">
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

        {showGasFee && (
          <TouchableArea hapticFeedback onPress={(): void => setShowGasInfoModal(true)}>
            <AnimatedFlex centered row entering={FadeIn} gap="$spacing4">
              <Icons.Gas color={colors.neutral2.val} size="$icon.16" />
              <Text color="$neutral2" variant="body3">
                {gasFeeFormatted}
              </Text>
            </AnimatedFlex>
          </TouchableArea>
        )}

        {formScreenWarning && !isBlocked && (
          <TouchableArea onPress={onSwapWarningClick}>
            <AnimatedFlex
              centered
              row
              entering={FadeIn}
              exiting={FadeOut}
              gap="$spacing8"
              px="$spacing24">
              {formScreenWarning.Icon && (
                <formScreenWarning.Icon
                  color={formScreenWarning.color.text}
                  height={iconSizes.icon16}
                  strokeWidth={1.5}
                  width={iconSizes.icon16}
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

        {/*
        When there is no gas or no warning, we render an empty row to keep the layout consistent when calculating the container height.
        This is used when calculating the size of the `DecimalPad`.
        */}

        {!gasFeeUSD && renderEmptyRows && <EmptyRow />}
        {!formScreenWarning && renderEmptyRows && <EmptyRow />}
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
