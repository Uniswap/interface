import { useCallback, useState } from 'react'
import { Keyboard } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useSwapFormContext } from 'src/features/transactions/swapRewrite/contexts/SwapFormContext'
import { useSwapTxContext } from 'src/features/transactions/swapRewrite/contexts/SwapTxContext'
import { useParsedSwapWarnings } from 'src/features/transactions/swapRewrite/hooks/useParsedSwapWarnings'
import { SwapWarningModal } from 'src/features/transactions/swapRewrite/SwapWarningModal'
import { BlockedAddressWarning } from 'src/features/trm/BlockedAddressWarning'
import { AnimatedFlex, Flex, Icons, Text, TouchableArea, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/format'
import { useFiatConverter } from 'wallet/src/features/fiatCurrency/conversion'
import { useUSDValue } from 'wallet/src/features/gas/hooks'
import { useIsBlockedActiveAddress } from 'wallet/src/features/trm/hooks'

export function GasAndWarningRows(): JSX.Element {
  const colors = useSporeColors()
  const { convertFiatAmountFormatted } = useFiatConverter()

  const { gasFee } = useSwapTxContext()
  const { derivedSwapInfo } = useSwapFormContext()

  const { chainId } = derivedSwapInfo

  const [showWarningModal, setShowWarningModal] = useState(false)

  const { isBlocked } = useIsBlockedActiveAddress()

  const { formScreenWarning } = useParsedSwapWarnings()

  const gasFeeUSD = useUSDValue(chainId, gasFee?.value)
  const gasFeeFormatted = convertFiatAmountFormatted(gasFeeUSD, NumberType.FiatGasPrice)

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
      {showWarningModal && formScreenWarning && (
        <SwapWarningModal
          parsedWarning={formScreenWarning}
          onClose={(): void => setShowWarningModal(false)}
        />
      )}

      <Flex gap="$spacing16" mt="$spacing16">
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

        {gasFeeUSD && (
          <AnimatedFlex centered row entering={FadeIn} exiting={FadeOut} gap="$spacing4">
            <Icons.Gas color={colors.neutral2.val} size="$icon.16" />
            <Text color="$neutral2" variant="body3">
              {gasFeeFormatted}
            </Text>
          </AnimatedFlex>
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
      </Flex>
    </>
  )
}
