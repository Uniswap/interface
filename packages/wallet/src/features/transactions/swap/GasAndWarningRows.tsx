import { useCallback, useState } from 'react'
import { Keyboard } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { AnimatedFlex, Flex, Text, TouchableArea, isWeb } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { useUSDValue } from 'wallet/src/features/gas/hooks'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useSwapFormContext } from 'wallet/src/features/transactions/contexts/SwapFormContext'
import { useSwapTxContext } from 'wallet/src/features/transactions/contexts/SwapTxContext'
import { useParsedSwapWarnings } from 'wallet/src/features/transactions/hooks/useParsedSwapWarnings'
import { SwapBuyTokenRow } from 'wallet/src/features/transactions/swap/SwapBuyTokenRow'
import { SwapRateRatio } from 'wallet/src/features/transactions/swap/SwapRateRatio'
import { SwapWarningModal } from 'wallet/src/features/transactions/swap/SwapWarningModal'
import { NetworkFeeWarning } from 'wallet/src/features/transactions/swap/modals/NetworkFeeWarning'
import { BlockedAddressWarning } from 'wallet/src/features/trm/BlockedAddressWarning'
import { useIsBlockedActiveAddress } from 'wallet/src/features/trm/hooks'

export function GasAndWarningRows({ renderEmptyRows }: { renderEmptyRows: boolean }): JSX.Element {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const { gasFee } = useSwapTxContext()
  const { derivedSwapInfo } = useSwapFormContext()

  const { chainId, trade } = derivedSwapInfo

  const [showWarningModal, setShowWarningModal] = useState(false)

  const { isBlocked } = useIsBlockedActiveAddress()

  const { formScreenWarning } = useParsedSwapWarnings()
  const showFormWarning = formScreenWarning && formScreenWarning.displayedInline && !isBlocked

  const gasFeeUSD = useUSDValue(chainId, gasFee?.value)
  const gasFeeFormatted = convertFiatAmountFormatted(gasFeeUSD, NumberType.FiatGasPrice)

  // only show the gas fee icon and price if we have a valid fee
  const showGasFee = Boolean(gasFeeUSD)

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

      {/*
        Do not add any margins directly to this container, as this component is used in 2 different places.
        Adjust the margin in the parent component instead.
      */}
      <Flex $short={{ gap: '$spacing8' }} fill={isWeb} gap="$spacing16">
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

        <Flex centered row>
          {isWeb && (
            <Flex fill>
              <SwapRateRatio initialInverse={true} styling="secondary" trade={trade.trade} />
            </Flex>
          )}
          {showGasFee && (
            <NetworkFeeWarning showGasIcon={true}>
              <AnimatedFlex centered row entering={FadeIn} gap="$spacing4">
                <Text color="$neutral2" variant="body3">
                  {gasFeeFormatted}
                </Text>
              </AnimatedFlex>
            </NetworkFeeWarning>
          )}
        </Flex>

        {showFormWarning && (
          <TouchableArea onPress={onSwapWarningClick}>
            <AnimatedFlex
              centered
              row
              entering={FadeIn}
              // TODO(EXT-526): re-enable `exiting` animation when it's fixed.
              exiting={isWeb ? undefined : FadeOut}
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
        {isWeb && (
          <>
            <Flex fill />
            <SwapBuyTokenRow />
          </>
        )}
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
