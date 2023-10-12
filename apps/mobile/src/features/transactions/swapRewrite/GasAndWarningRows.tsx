import { useCallback, useState } from 'react'
import { Keyboard } from 'react-native'
import { useSwapFormContext } from 'src/features/transactions/swapRewrite/contexts/SwapFormContext'
import { ParsedWarnings } from 'src/features/transactions/swapRewrite/hooks/useParsedSwapWarnings'
import { SwapWarningModal } from 'src/features/transactions/swapRewrite/SwapWarningModal'
import { BlockedAddressWarning } from 'src/features/trm/BlockedAddressWarning'
import { Flex, Icons, Text, TouchableArea, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { formatUSDPrice, NumberType } from 'utilities/src/format/format'
import { useUSDValue } from 'wallet/src/features/gas/hooks'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { useIsBlockedActiveAddress } from 'wallet/src/features/trm/hooks'

export function GasAndWarningRows({
  gasFee,
  mainWarning,
}: {
  gasFee?: GasFeeResult
  mainWarning?: ParsedWarnings['mainWarning']
}): JSX.Element {
  const colors = useSporeColors()

  const { derivedSwapInfo } = useSwapFormContext()

  const { chainId } = derivedSwapInfo

  const [showWarningModal, setShowWarningModal] = useState(false)

  const { isBlocked } = useIsBlockedActiveAddress()

  const gasFeeUSD = useUSDValue(chainId, gasFee?.value)

  const onSwapWarningClick = useCallback(() => {
    if (!mainWarning?.warning.message) {
      // Do not show the modal if the warning doesn't have a message.
      return
    }

    Keyboard.dismiss()
    setShowWarningModal(true)
  }, [mainWarning?.warning.message])

  return (
    <>
      {showWarningModal && mainWarning && (
        <SwapWarningModal
          parsedWarning={mainWarning}
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
              {formatUSDPrice(gasFeeUSD, NumberType.FiatGasPrice)}
            </Text>
          </Flex>
        )}

        {mainWarning && !isBlocked && (
          <TouchableArea onPress={onSwapWarningClick}>
            <Flex centered row gap="$spacing8">
              {mainWarning.Icon && (
                <mainWarning.Icon
                  color={mainWarning.color.text}
                  height={iconSizes.icon16}
                  strokeWidth={1.5}
                  width={iconSizes.icon16}
                />
              )}
              <Flex row>
                <Text color={mainWarning.color.text} variant="body3">
                  {mainWarning.warning.title}
                </Text>
              </Flex>
            </Flex>
          </TouchableArea>
        )}
      </Flex>
    </>
  )
}
