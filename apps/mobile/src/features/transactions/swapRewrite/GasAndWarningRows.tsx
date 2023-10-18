import { useCallback, useState } from 'react'
import { Keyboard } from 'react-native'
import { useSwapFormContext } from 'src/features/transactions/swapRewrite/contexts/SwapFormContext'
import { useSwapTxContext } from 'src/features/transactions/swapRewrite/contexts/SwapTxContext'
import { useParsedSwapWarnings } from 'src/features/transactions/swapRewrite/hooks/useParsedSwapWarnings'
import { SwapWarningModal } from 'src/features/transactions/swapRewrite/SwapWarningModal'
import { BlockedAddressWarning } from 'src/features/trm/BlockedAddressWarning'
import { Flex, Icons, Text, TouchableArea, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/format'
import { useUSDValue } from 'wallet/src/features/gas/hooks'
import { useIsBlockedActiveAddress } from 'wallet/src/features/trm/hooks'
import { useFiatConversionFormatted } from 'wallet/src/utils/currency'

export function GasAndWarningRows(): JSX.Element {
  const colors = useSporeColors()

  const { gasFee } = useSwapTxContext()
  const { derivedSwapInfo } = useSwapFormContext()

  const { chainId } = derivedSwapInfo

  const [showWarningModal, setShowWarningModal] = useState(false)

  const { isBlocked } = useIsBlockedActiveAddress()

  const { formScreenWarning } = useParsedSwapWarnings()

  const gasFeeUSD = useUSDValue(chainId, gasFee?.value)
  const gasFeeFormatted = useFiatConversionFormatted(gasFeeUSD, NumberType.FiatGasPrice)

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
          <Flex centered row gap="$spacing4">
            <Icons.Gas color={colors.neutral2.val} size="$icon.20" />
            <Text color="$neutral2" variant="body3">
              {gasFeeFormatted}
            </Text>
          </Flex>
        )}

        {formScreenWarning && !isBlocked && (
          <TouchableArea onPress={onSwapWarningClick}>
            <Flex centered row gap="$spacing8" px="$spacing24">
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
            </Flex>
          </TouchableArea>
        )}
      </Flex>
    </>
  )
}
